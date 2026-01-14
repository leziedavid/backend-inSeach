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
    private async uploadImage1(annonceId: string, fileBuffer: Buffer, replaceExisting = false) {

        if (replaceExisting) {
            const existingFile = await this.prisma.fileManager.findFirst({
                where: { targetId: annonceId, fileType: 'AnnonceMain' },
                orderBy: { createdAt: 'desc' },
            });

            if (existingFile?.fileCode) {
                try {
                    await this.localStorage.deleteFile(existingFile.fileCode);
                } catch (error) {
                    console.warn(`Erreur suppression  ${existingFile.fileCode}: ${error.message}`);
                }
                await this.prisma.fileManager.deleteMany({
                    where: { targetId: annonceId, fileType: 'AnnonceMain' },
                });
            }
        }

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
 * UPLOAD IMAGE (AJOUT SEULEMENT)
 * -----------------------------------------------------*/
    private async uploadImage(annonceId: string, fileBuffer: Buffer, replaceExisting = false) {
        const upload = await this.localStorage.saveFile(fileBuffer, 'annonces');

        await this.prisma.fileManager.create({
            data: {
                ...upload,
                fileType: 'AnnonceMain',
                targetId: annonceId,
            },
        });
    }


/* -------------------------------------------------------
 * DELETE SELECTED IMAGES (SAFE)
 * -----------------------------------------------------*/
private async deleteImagesByUrls(
    annonceId: string,
    imageUrls: string[]
) {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;

    const files = await this.prisma.fileManager.findMany({
        where: {
            targetId: annonceId,
            fileType: 'AnnonceMain',
            filePath: { in: imageUrls,  },
        },
    });

    if (!files.length) return;

    // suppression physique
    for (const file of files) {
        if (!file.fileCode) continue;

        try {
            await this.localStorage.deleteFile(file.fileCode);
        } catch (error: any) {
            console.warn( `[deleteImagesByUrls] ⚠️ erreur suppression ${file.fileCode}`, error?.message,
            );
        }
    }

    // suppression DB
    await this.prisma.fileManager.deleteMany({
        where: {
            id: {
                in: files.map(f => f.id),
            },
        },
    });
}



    /* -------------------------------------------------------
     * CREATE
     * -----------------------------------------------------*/
    async create(userId: string, dto: CreateAnnonceDto) {
        const { images, categoryId, amenitiesIds, typeId, providerId, amenityId, ...rest } = dto as any;
        // ⚡ Parse le bon champ envoyé par le front
        const parsedAmenities = amenityId ? Array.isArray(amenityId) ? amenityId : JSON.parse(amenityId) : [];
        console.log('parsedAmenities:', parsedAmenities); // debug

        try {
            const annonce = await this.generic.create({
                ...rest,

                // conversions
                price: Number(rest.price),
                capacity: Number(rest.capacity),
                rooms: Number(rest.rooms),
                beds: Number(rest.beds),
                pinned: rest.pinned === true || rest.pinned === "true",
                certifiedAt: new Date(rest.certifiedAt),
                gpsLocation: rest.gpsLocation ? typeof rest.gpsLocation === "string" ? JSON.parse(rest.gpsLocation) : rest.gpsLocation : undefined,

                // relations ✅
                provider: { connect: { id: userId } },
                category: categoryId ? { connect: { id: categoryId } } : undefined,
                type: typeId ? { connect: { id: typeId } } : undefined,
            });


            // ⚡ Crée la table pivot Annonce ↔ Amenity
            if (parsedAmenities.length > 0) {
                await this.prisma.annonceAmenity.createMany({
                    data: parsedAmenities.map((amenity: string) => ({
                        annonceId: annonce.id,  // id de l'annonce
                        amenityId: amenity,     // id de l'amenity
                    })),
                    skipDuplicates: true, // évite les erreurs si certains couples existent déjà
                });
            }

            // upload images
            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(annonce.id, file.buffer, false);
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
    async update(id: string, userId: string, dto: UpdateAnnonceDto) {
        const { images, categoryId, amenitiesIds, typeId, providerId, existingImages, amenityId, ...rest } = dto as any;

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
                    price: rest.price !== undefined ? Number(rest.price) : annonce.price,
                    capacity: rest.capacity !== undefined ? Number(rest.capacity) : annonce.capacity,
                    rooms: rest.rooms !== undefined ? Number(rest.rooms) : annonce.rooms,
                    beds: rest.beds !== undefined ? Number(rest.beds) : annonce.beds,
                    pinned: rest.pinned !== undefined ? rest.pinned === true || rest.pinned === "true" : annonce.pinned,
                    certifiedAt: rest.certifiedAt ? new Date(rest.certifiedAt) : annonce.certifiedAt,
                    gpsLocation: rest.gpsLocation ? typeof rest.gpsLocation === "string" ? JSON.parse(rest.gpsLocation) : rest.gpsLocation : annonce.gpsLocation,
                    categoryId: categoryId ?? annonce.categoryId,
                    typeId: typeId ?? annonce.typeId,
                }
            );

            // amenities
            // ⚡ Prend le bon champ pour les amenities
            const parsedAmenities = amenityId ? Array.isArray(amenityId) ? amenityId : JSON.parse(amenityId) : [];
            console.log('parsedAmenities:', parsedAmenities);
            console.log('mon dto:', dto);

            if (parsedAmenities.length > 0) {
                // Supprime les anciennes relations
                await this.prisma.annonceAmenity.deleteMany({
                    where: { annonceId: id },
                });

                // Crée les nouvelles relations
                await this.prisma.annonceAmenity.createMany({
                    data: parsedAmenities.map((amenity: string) => ({
                        annonceId: id,
                        amenityId: amenity,
                    })),
                    skipDuplicates: true,
                });
            }



            // images
            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(updated.id, file.buffer, true);
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
            const page = Number(params.page) || 1;
            const limit = Number(params.limit) || 10;

            const pagination = await this.functionService.paginate({
                model: 'Annonce',
                page: page,
                limit: limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        category: true,
                        provider: true,
                        amenities: { include: { amenity: true } },
                        reviews: true,
                        type: true,
                        // ✅ Dernier appointment uniquement
                        appointments: {
                            where: { status: 'COMPLETED' }, // seulement les complétés
                            orderBy: { createdAt: 'desc' }, take: 1, },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            const ids = pagination.data.map(a => a.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'AnnonceMain' },
                orderBy: { createdAt: 'desc' },
            });
            /* =================== AJOUT ICI =================== */
            /* --------- ICÔNES DES AMENITIES --------- */
            const amenityIds = pagination.data.flatMap(a =>  a.amenities.map(am => am.amenityId) );
            const amenityIcons = amenityIds.length ? await this.prisma.fileManager.findMany({ where: { targetId: { in: amenityIds }, fileType: 'AmenityMain', }, }) : [];

            const formatted = this.annonceMapper.mapAnnonces(pagination.data, files, amenityIcons);

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
            const page = Number(params.page) || 1;
            const limit = Number(params.limit) || 10;

            const pagination = await this.functionService.paginate({
                model: 'Annonce',
                page: page,
                limit: limit,
                conditions: { providerId: userId },
                selectAndInclude: {
                    select: null,
                    include: {
                        category: true,
                        amenities: { include: { amenity: true } },
                        reviews: true,
                        type: true,
                         // ✅ Dernier appointment uniquement
                        appointments: {
                            where: { status: 'COMPLETED' }, // seulement les complétés
                            orderBy: { createdAt: 'desc' }, take: 1, },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            const ids = pagination.data.map(a => a.id);
            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'AnnonceMain' },
            });

            /* =================== AJOUT ICI =================== */
            /* --------- ICÔNES DES AMENITIES --------- */
            const amenityIds = pagination.data.flatMap(a =>  a.amenities.map(am => am.amenityId) );
            const amenityIcons = amenityIds.length ? await this.prisma.fileManager.findMany({ where: { targetId: { in: amenityIds }, fileType: 'AmenityMain', }, }) : [];


            const formatted = this.annonceMapper.mapAnnonces(pagination.data, files, amenityIcons);

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
            // ⚡ Conversion sécurisée de page et limit en nombres
            const page = Number(params.page) || 1;
            const limit = Number(params.limit) || 10;
            const { label, location } = params;

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
                    type: true,
                     // ✅ Dernier appointment uniquement
                        appointments: {
                            // On ne prend que le dernier appointment non terminé
                            where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
                            orderBy: { createdAt: 'desc' }, take: 1,
                        },
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

                        /* =================== AJOUT ICI =================== */
            /* --------- ICÔNES DES AMENITIES --------- */
            const amenityIds = annonces.flatMap(a =>  a.amenities.map(am => am.amenityId) );
            const amenityIcons = amenityIds.length ? await this.prisma.fileManager.findMany({ where: { targetId: { in: amenityIds }, fileType: 'AmenityMain', }, }) : [];


            const formatted = this.annonceMapper.mapAnnonces(paginated, files, amenityIcons);

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
            const page = Number(params.page) || 1;
            const limit = Number(params.limit) || 10;
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
                        type: true,
                         // ✅ Dernier appointment uniquement
                        appointments: {
                            // On ne prend que le dernier appointment non terminé
                            where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
                            orderBy: { createdAt: 'desc' }, take: 1, },
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

            /* =================== AJOUT ICI =================== */
            /* --------- ICÔNES DES AMENITIES --------- */
            const amenityIds = annonces.flatMap(a =>  a.amenities.map(am => am.amenityId) );
            const amenityIcons = amenityIds.length ? await this.prisma.fileManager.findMany({ where: { targetId: { in: amenityIds }, fileType: 'AmenityMain', }, }) : [];


            // Mapping complet avec AnnonceMapper
            const formatted = this.annonceMapper.mapAnnonces(annonces, files, amenityIcons);
            return new BaseResponse(200, 'Annonces utilisateur', { total,   page, limit,   data: formatted, });
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
