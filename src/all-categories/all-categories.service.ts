import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { GenericService } from '../utils/generic.service';
import { seedFromExcelBuffer } from 'src/utils/seed-from-excel';

import {
    CreateServiceCategoryDto,
    UpdateServiceCategoryDto,
} from 'src/common/dto/request/category.dto';

import { CreateServiceSubcategoryDto, UpdateServiceSubcategoryDto, } from 'src/common/dto/request/subcategory.dto';
import { FunctionService } from 'src/utils/pagination.service';
import { FilterParamsDto } from 'src/common/dto/request/filter-params.dto';

@Injectable()
export class AllCategoriesService {

    private genericCategory: GenericService<any>;
    private genericSubcategory: GenericService<any>;
    private readonly functionService: FunctionService;

    constructor(private readonly prisma: PrismaService) {
        this.genericCategory = new GenericService(prisma, 'category');
        this.genericSubcategory = new GenericService(prisma, 'subCategory');
        this.functionService = new FunctionService(prisma);

    }

    // ==============================================================
    // 📌 Import Excel (Catégories + sous-catégories)
    // ==============================================================
    async importExcel(file: Express.Multer.File): Promise<BaseResponse> {
        try {
            if (!file || !file.buffer) {
                throw new BadRequestException('Aucun fichier reçu.');
            }

            const success = await seedFromExcelBuffer(file.buffer);

            if (!success) {
                return new BaseResponse(400, 'Échec de l’importation.', null);
            }

            return new BaseResponse(200, 'Importation réussie !', null);

        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            console.error('Erreur importExcel:', error);
            throw new InternalServerErrorException('Erreur lors de l’importation Excel.');
        }
    }

    // ==============================================================
    // 📌 CATEGORY CRUD
    // ==============================================================
    async createCategory(dto: CreateServiceCategoryDto) {
        const category = await this.genericCategory.create(dto);
        return new BaseResponse(201, 'Catégorie créée', category);
    }

    async updateCategory(id: string, dto: UpdateServiceCategoryDto) {
        const category = await this.genericCategory.update(id, dto);
        return new BaseResponse(200, 'Catégorie mise à jour', category);
    }

    async deleteCategory(id: string) {
        await this.genericCategory.delete(id);
        return new BaseResponse(200, 'Catégorie supprimée', null);
    }

    async listCategories() {
        const data = await this.prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        return new BaseResponse(200, 'Liste des catégories', data);
    }

    // ==============================================================
    // 📌 SUBCATEGORY CRUD
    // ==============================================================
    async createSubcategory(dto: CreateServiceSubcategoryDto) {
        const sub = await this.genericSubcategory.create(dto);
        return new BaseResponse(201, 'Sous-catégorie créée', sub);
    }

    async updateSubcategory(id: string, dto: UpdateServiceSubcategoryDto) {
        const sub = await this.genericSubcategory.update(id, dto);
        return new BaseResponse(200, 'Sous-catégorie mise à jour', sub);
    }

    async deleteSubcategory(id: string) {
        await this.genericSubcategory.delete(id);
        return new BaseResponse(200, 'Sous-catégorie supprimée', null);
    }

    async listSubcategories() {
        const data = await this.prisma.subCategory.findMany({
            include: { category: true },
            orderBy: { name: 'asc' },
        });
        return new BaseResponse(200, 'Liste des sous-catégories', data);
    }

    // ==============================================================
    // 📌 Toutes les catégories avec sous-catégories
    // ==============================================================
    async getAllCategoriesWithSubcategories(): Promise<BaseResponse> {
        const data = await this.prisma.category.findMany({
            include: { subCategories: true },
            orderBy: { name: 'asc' },
        });

        return new BaseResponse(
            200,
            'Liste des catégories avec leurs sous-catégories',
            data
        );
    }

    // ==============================================================
    // 📌 Toutes les sous-catégories avec catégorie parent
    // ==============================================================
    async getAllSubcategories(): Promise<BaseResponse> {
        const data = await this.prisma.subCategory.findMany({
            include: { category: true },
            orderBy: { name: 'asc' },
        });

        return new BaseResponse(200, 'Liste des sous-catégories', data);
    }

    // ==============================================================
    // 📌 Sous-catégories d'une catégorie donnée
    // ==============================================================
    async getSubcategoriesByCategory(categoryId: string): Promise<BaseResponse> {
        const data = await this.prisma.subCategory.findMany({
            where: { categoryId },
            include: { category: true },
            orderBy: { name: 'asc' },
        });

        return new BaseResponse(
            200,
            `Sous-catégories de la catégorie ${categoryId}`,
            data
        );
    }



    // ==============================================================
    // 📌 Pagination des catégories
    // ==============================================================
    async paginateCategories(params: FilterParamsDto): Promise<BaseResponse> {
        try {
            const pagination = await this.functionService.paginate({
                model: 'ServiceCategory', // exact
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: { subcategories: true }, // ✅ nom exact du champ dans le schéma
                },
                orderBy: { name: 'asc' },
            });

            return new BaseResponse(200, 'Catégories paginées', pagination);
        } catch (error) {
            console.error('[AllCategoriesService.paginateCategories] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la pagination des catégories');
        }
    }

    // ==============================================================
    // 📌 Pagination des sous-catégories
    // ==============================================================
    async paginateSubcategories(params: FilterParamsDto): Promise<BaseResponse> {
        try {
            const pagination = await this.functionService.paginate({
                model: 'ServiceSubcategory', // exact
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: { category: true }, // ✅ nom exact du champ dans le schéma
                },
                orderBy: { name: 'asc' },
            });

            const filteredData = params.categoryId
                ? pagination.data.filter((item: any) => item.categoryId === params.categoryId)
                : pagination.data;

            return new BaseResponse(200, 'Sous-catégories paginées', { ...pagination, data: filteredData });
        } catch (error) {
            console.error('[AllCategoriesService.paginateSubcategories] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la pagination des sous-catégories');
        }
    }


}
