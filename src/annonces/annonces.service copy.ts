import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { GenericService } from 'src/utils/generic.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { BaseResponse } from 'src/utils/base-response';
import { FunctionService } from 'src/utils/pagination.service';
import { CreateAnnonceDto, UpdateAnnonceDto } from 'src/common/dto/request/annonce.dto';
import { Annonce } from '@prisma/client';
import { getPublicFileUrl } from 'src/utils/helper';
import { locationMapping } from 'src/utils/mappers/location-mapper';
import { FilterAnnonceParamsDto } from 'src/common/dto/request/filter-annonce-params.dto';
import { AnnonceMapper } from 'src/utils/mappers/annonce-mapper';

@Injectable()
export class AnnoncesService {

    private generic: GenericService<Annonce>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly localStorage: LocalStorageService,
        private readonly functionService: FunctionService,
        private readonly annonceMapper: AnnonceMapper, // <- injecter
    ) {
        this.generic = new GenericService<Annonce>(prisma, 'annonce');
    }

    /* -------------------------------------------------------
     * UPLOAD IMAGE
     * -----------------------------------------------------*/
    private async uploadImage(annonceId: string, fileBuffer: Buffer) {
        await this.prisma.fileManager.deleteMany({
            where: { targetId: annonceId, fileType: 'AnnonceMain' },
        });

        const upload = await this.localStorage.saveFile(fileBuffer, 'annonces');

        await this.prisma.fileManager.create({
            data: {
                ...upload,
                fileType: 'AnnonceMain',
                targetId: annonceId,
            }
        });
    }

    /* -------------------------------------------------------
     * CREATE
     * -----------------------------------------------------*/
    async create(dto: CreateAnnonceDto, userId: string) {
        const { images, categoryId, amenitiesIds, typeId, ...rest } = dto as any;

        try {
            const annonce = await this.generic.create({
                ...rest,
                provider: { connect: { id: userId } },
                category: categoryId ? { connect: { id: categoryId } } : undefined,
                type: typeId ? { connect: { id: typeId } } : undefined,
                amenities: amenitiesIds?.length ? { create: amenitiesIds.map((id: string) => ({ amenity: { connect: { id } } })) } : undefined,
            });

            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(annonce.id, file.buffer);
                }
            }

            return new BaseResponse(201, 'Annonce créée avec succès', annonce);

        } catch (error) {
            console.error('[Annonce.create] ❌', error);
            throw new InternalServerErrorException('Erreur création annonce');
        }
    }

    /* -------------------------------------------------------
     * UPDATE
     * -----------------------------------------------------*/
    async update(id: string, dto: UpdateAnnonceDto, userId: string) {
        const { images, categoryId, amenitiesIds, typeId, ...rest } = dto as any;

        try {
            const annonce = await this.generic.findOne({ id });
            if (!annonce) throw new NotFoundException('Annonce introuvable');

            if (annonce.providerId !== userId) {
                throw new ForbiddenException("Action non autorisée");
            }

            const updated = await this.generic.update(
                { id },
                {
                    ...rest,
                    categoryId: categoryId ?? annonce.categoryId,
                    typeId: typeId ?? annonce.typeId,
                }
            );

            if (amenitiesIds) {
                await this.prisma.annonceAmenity.deleteMany({
                    where: { annonceId: id },
                });

                await this.prisma.annonceAmenity.createMany({
                    data: amenitiesIds.map((amenityId: string) => ({
                        annonceId: id,
                        amenityId,
                    }))
                });
            }

            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(updated.id, file.buffer);
                }
            }

            return new BaseResponse(200, 'Annonce mise à jour', updated);

        } catch (error) {
            console.error('[Annonce.update] ❌', error);
            if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
            throw new InternalServerErrorException('Erreur mise à jour annonce');
        }
    }

    /* -------------------------------------------------------
     * FIND ONE
     * -----------------------------------------------------*/
    async findOne(id: string) {
        try {
            const annonce = await this.prisma.annonce.findUnique({
                where: { id },
                include: {
                    category: true,
                    provider: true,
                    amenities: { include: { amenity: true } },
                    reviews: true,
                }
            });

            if (!annonce) throw new NotFoundException('Annonce introuvable');

            const file = await this.prisma.fileManager.findFirst({
                where: { targetId: id, fileType: 'AnnonceMain' },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Annonce récupérée', {
                ...annonce,
                image: file ? getPublicFileUrl(file.fileUrl) : null,
            });

        } catch (error) {
            console.error('[Annonce.findOne] ❌', error);
            throw new InternalServerErrorException('Erreur lecture annonce');
        }
    }

    /* -------------------------------------------------------
     * FIND ALL
     * -----------------------------------------------------*/
    async findAll() {
        try {
            const data = await this.prisma.annonce.findMany({
                orderBy: { createdAt: 'desc' },
            });

            const ids = data.map(a => a.id);

            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'AnnonceMain' },
                orderBy: { createdAt: 'desc' },
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) {
                if (!fileMap[f.targetId]) {
                    fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);
                }
            }

            return new BaseResponse(200, 'Liste annonces', data.map(a => ({
                ...a,
                image: fileMap[a.id] ?? null
            })));

        } catch (error) {
            console.error('[Annonce.findAll] ❌', error);
            throw new InternalServerErrorException('Erreur liste annonces');
        }
    }

    /* -------------------------------------------------------
     * PAGINATION
     * -----------------------------------------------------*/
    async paginate(params: any) {
        try {
            const pagination = await this.functionService.paginate({
                model: 'Annonce',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        category: true,
                        provider: true,
                        amenities: { include: { amenity: true } },
                        reviews: true,
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            const ids = pagination.data.map(a => a.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'AnnonceMain' },
                orderBy: { createdAt: 'desc' },
            });

            const formatted = this.annonceMapper.mapAnnonces(pagination.data, files);

            return new BaseResponse(200, 'Annonces paginées', {
                ...pagination,
                data: formatted,
            });
        } catch (error) {
            console.error('[Annonce.paginate] ❌', error);
            throw new InternalServerErrorException('Erreur pagination annonces');
        }
    }

    /* -------------------------------------------------------
     * GET BY USER
     * -----------------------------------------------------*/
    async getByUserId(userId: string, params: any) {
        try {
            const pagination = await this.functionService.paginate({
                model: 'Annonce',
                page: params.page,
                limit: params.limit,
                conditions: { providerId: userId },
                selectAndInclude: {
                    select: null,
                    include: {
                        category: true,
                        amenities: { include: { amenity: true } },
                        reviews: true,
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            const ids = pagination.data.map(a => a.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'AnnonceMain' },
            });

            const formatted = this.annonceMapper.mapAnnonces(pagination.data, files);

            return new BaseResponse(200, 'Annonces utilisateur', {
                ...pagination,
                data: formatted,
            });
        } catch (error) {
            console.error('[Annonce.getByUserId] ❌', error);
            throw new InternalServerErrorException('Erreur annonces utilisateur');
        }
    }

    /* -------------------------------------------------------
     * FILTER PAGINATION
     * -----------------------------------------------------*/
    async filterPagination(params: FilterAnnonceParamsDto) {
        try {
            const { label, location, page = 1, limit = 10 } = params;

            let annonces = await this.prisma.annonce.findMany({
                where: label
                    ? {
                        OR: [
                            { title: { contains: label, mode: 'insensitive' } },
                            { description: { contains: label, mode: 'insensitive' } },
                        ],
                    }
                    : undefined,
                include: {
                    category: true,
                    provider: true,
                    amenities: { include: { amenity: true } },
                    reviews: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            if (location) {
                annonces = annonces.filter(a => {
                    const loc = locationMapping(a.gpsLocation);
                    return loc.country === location.country;
                });
            }

            const start = (page - 1) * limit;
            const paginated = annonces.slice(start, start + limit);

            // Récupération des images
            const ids = paginated.map(a => a.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'AnnonceMain' },
            });

            const formatted = this.annonceMapper.mapAnnonces(paginated, files);

            return new BaseResponse(200, 'Annonces filtrées', {
                total: annonces.length,
                page,
                limit,
                data: formatted,
            });
        } catch (error) {
            console.error('[Annonce.filterPagination] ❌', error);
            throw new InternalServerErrorException('Erreur filtrage annonces');
        }
    }


    async getMyAllAnnonces(userId: string, params: { page?: number; limit?: number }) {
        try {
            const page = params.page ?? 1;
            const limit = params.limit ?? 10;

            // Pagination des annonces de l'utilisateur
            const [total, annonces] = await Promise.all([
                this.prisma.annonce.count({ where: { providerId: userId } }),
                this.prisma.annonce.findMany({
                    where: { providerId: userId },
                    include: {
                        category: true,
                        provider: true,
                        amenities: { include: { amenity: true } },
                        reviews: true,
                    },
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
            ]);

            // Récupération des images principales
            const annonceIds = annonces.map(a => a.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: annonceIds }, fileType: 'AnnonceMain' },
                orderBy: { createdAt: 'desc' },
            });

            // Mapping complet avec AnnonceMapper
            const formatted = this.annonceMapper.mapAnnonces(annonces, files);

            return new BaseResponse(200, 'Annonces utilisateur', {
                total,
                page,
                limit,
                data: formatted,
            });
        } catch (error) {
            console.error('[Annonce.getMyAllAnnonces] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des annonces');
        }
    }


    /* -------------------------------------------------------
     * DELETE
     * -----------------------------------------------------*/
    async remove(id: string) {
        try {
            const annonce = await this.prisma.annonce.findUnique({ where: { id } });
            if (!annonce) throw new BadRequestException('Annonce introuvable');

            await this.prisma.fileManager.deleteMany({
                where: { targetId: id, fileType: 'AnnonceMain' },
            });

            await this.prisma.annonce.delete({ where: { id } });

            return new BaseResponse(200, 'Annonce supprimée', annonce);

        } catch (error) {
            console.error('[Annonce.delete] ❌', error);
            throw new InternalServerErrorException('Erreur suppression annonce');
        }
    }
}
