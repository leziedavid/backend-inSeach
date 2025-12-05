import {BadRequestException,Injectable,InternalServerErrorException,NotFoundException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenericService } from 'src/utils/generic.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { BaseResponse } from 'src/utils/base-response';
import { getPublicFileUrl } from 'src/utils/helper';
import { CreateProductDto, UpdateProductDto } from 'src/common/dto/request/products.dto';
import { FilterParamsDto } from 'src/common/dto/request/filter-params.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';


@Injectable()
export class ProductService {
    
    private generic: GenericService<any>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly localStorage: LocalStorageService,
        private readonly functionService: FunctionService,
    ) {
        this.generic = new GenericService(prisma, 'product');
    }

    /* -------------------
     * UPLOAD IMAGE
     * ------------------*/
    private async uploadImage(productId: string, fileBuffer: Buffer) {
        await this.prisma.fileManager.deleteMany({
            where: { targetId: productId, fileType: 'ProductMain' },
        });

        const upload = await this.localStorage.saveFile(fileBuffer, 'products');

        await this.prisma.fileManager.create({
            data: {
                ...upload,
                fileType: 'ProductMain',
                targetId: productId,
            },
        });
    }

    /* -------------------
     * PARSE FORM DATA DTO
     * ------------------*/
    private parseDto(dto: any, userId?: string) {
        return {
            ...dto,
            userId: userId ?? dto.userId,
            price: dto.price !== undefined ? parseFloat(dto.price) : undefined,
            originalPrice: dto.originalPrice !== undefined ? parseFloat(dto.originalPrice) : undefined,
            rating: dto.rating !== undefined ? parseFloat(dto.rating) : 0,
            percentegeRating: dto.percentegeRating !== undefined ? parseFloat(dto.percentegeRating) : undefined,
            reviewCount: dto.reviewCount !== undefined ? parseInt(dto.reviewCount, 10) : 0,
            isBestSeller: dto.isBestSeller !== undefined
                ? (dto.isBestSeller === 'true' || dto.isBestSeller === true)
                : false,
            stock: dto.stock !== undefined ? parseInt(dto.stock, 10) : 0,
            sizes: dto.sizes
                ? Array.isArray(dto.sizes) ? dto.sizes : JSON.parse(dto.sizes)
                : [],
            tags: dto.tags
                ? Array.isArray(dto.tags) ? dto.tags : JSON.parse(dto.tags)
                : [],
            features: dto.features
                ? Array.isArray(dto.features) ? dto.features : JSON.parse(dto.features)
                : [],
        };
    }

    /* -------------------
     * CREATE PRODUCT
     * ------------------*/
    async create(dto: CreateProductDto, userId: string) {
        try {
            const { images, ...rest } = dto as any;
            const parsed = this.parseDto(rest, userId);

            const product = await this.generic.create(parsed);

            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(product.id, file.buffer);
                }
            }

            return new BaseResponse(201, 'Produit créé', product);
        } catch (error) {
            console.error('[Product.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création du produit');
        }
    }

    /* -------------------
     * UPDATE PRODUCT
     * ------------------*/
    async update(id: string, dto: UpdateProductDto, userId?: string) {
        try {
            const { images, ...rest } = dto as any;

            const product = await this.generic.findOne({ id });
            if (!product) throw new NotFoundException('Produit introuvable');

            const parsed = this.parseDto(rest, userId);

            const updated = await this.generic.update({ id }, parsed);

            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(updated.id, file.buffer);
                }
            }

            return new BaseResponse(200, 'Produit mis à jour', updated);
        } catch (error) {
            console.error('[Product.update] ❌', error);
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Erreur lors de la mise à jour du produit');
        }
    }


    /* -------------------
     * FIND ONE PRODUCT
     * ------------------*/
    async findOne(id: string) {
        try {
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: { category: true, subCategory: true, user: true },
            });

            if (!product) throw new NotFoundException('Produit introuvable');

            const file = await this.prisma.fileManager.findFirst({
                where: { targetId: id, fileType: 'ProductMain' },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Produit récupéré', {
                ...product,
                imageUrl: file ? getPublicFileUrl(file.fileUrl) : null,
            });
        } catch (error) {
            console.error('[Product.findOne] ❌', error);
            throw new InternalServerErrorException('Erreur lecture produit');
        }
    }

    /* -------------------
     * PAGINATED FIND ALL
     * ------------------*/
    async findAll(params: FilterParamsDto) {
        try {
            const { page = 1, limit = 10 } = params;

            const paginateOptions: PaginateOptions = {
                model: 'Product',
                page: Number(page),
                limit: Number(limit),
                selectAndInclude: {
                    select: null,
                    include: { category: true, subCategory: true, user: true },
                },
                orderBy: { createdAt: 'desc' },
            };

            const data = await this.functionService.paginate(paginateOptions);

            const ids = data.data.map((p) => p.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'ProductMain' },
                orderBy: { createdAt: 'desc' },
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) if (!fileMap[f.targetId]) fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);

            data.data = data.data.map((product) => ({
                ...product,
                imageUrl: fileMap[product.id] ?? null,
            }));

            return new BaseResponse(200, 'Liste paginée des produits', data);
        } catch (error) {
            console.error('[Product.findAll] ❌', error);
            throw new InternalServerErrorException('Erreur liste produits');
        }
    }

    /* -------------------
     * GET BESTSELLERS
     * ------------------*/
    async getBestSellers(params: FilterParamsDto) {
        try {
            const { page = 1, limit = 10 } = params;

            const paginateOptions: PaginateOptions = {
                model: 'Product',
                page: Number(page),
                limit: Number(limit),
                conditions: { isBestSeller: true },
                selectAndInclude: {
                    select: null,
                    include: { category: true, subCategory: true, user: true },
                },
                orderBy: { createdAt: 'desc' },
            };

            const data = await this.functionService.paginate(paginateOptions);

            const ids = data.data.map((p) => p.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'ProductMain' },
                orderBy: { createdAt: 'desc' },
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) if (!fileMap[f.targetId]) fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);

            data.data = data.data.map((product) => ({
                ...product,
                imageUrl: fileMap[product.id] ?? null,
            }));

            return new BaseResponse(200, 'Liste des best-sellers', data);
        } catch (error) {
            console.error('[Product.getBestSellers] ❌', error);
            throw new InternalServerErrorException('Erreur récupération best-sellers');
        }
    }

    /* -------------------
     * GET PRODUCTS BY CATEGORY & OPTIONAL SUBCATEGORY
     * ------------------*/
    async getProductsByCategoryEndSubCategory(params: FilterParamsDto) {
        try {
            const { categoryId, subCategoryId, page = 1, limit = 10 } = params;

            if (!categoryId) throw new BadRequestException('categoryId requis');

            const conditions: any = { categoryId };
            if (subCategoryId) conditions.subCategoryId = subCategoryId;

            const paginateOptions: PaginateOptions = {
                model: 'Product',
                page: Number(page),
                limit: Number(limit),
                conditions,
                selectAndInclude: {
                    select: null,
                    include: { category: true, subCategory: true, user: true },
                },
                orderBy: { createdAt: 'desc' },
            };

            const data = await this.functionService.paginate(paginateOptions);

            const ids = data.data.map((p) => p.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'ProductMain' },
                orderBy: { createdAt: 'desc' },
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) if (!fileMap[f.targetId]) fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);

            data.data = data.data.map((product) => ({
                ...product,
                imageUrl: fileMap[product.id] ?? null,
            }));

            return new BaseResponse(200, 'Liste des produits filtrés', data);
        } catch (error) {
            console.error('[Product.getProductsByCategoryEndSubCategory] ❌', error);
            throw new InternalServerErrorException('Erreur récupération produits');
        }
    }

    /* -------------------
     * DELETE PRODUCT
     * ------------------*/
    async remove(id: string) {
        try {
            const product = await this.prisma.product.findUnique({ where: { id } });
            if (!product) throw new NotFoundException('Produit introuvable');

            await this.prisma.fileManager.deleteMany({
                where: { targetId: id, fileType: 'ProductMain' },
            });

            await this.prisma.product.delete({ where: { id } });

            return new BaseResponse(200, 'Produit supprimé', product);
        } catch (error) {
            console.error('[Product.remove] ❌', error);
            throw new InternalServerErrorException('Erreur suppression produit');
        }
    }


}
