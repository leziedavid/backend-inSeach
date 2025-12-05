import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { GenericService } from 'src/utils/generic.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { BaseResponse } from 'src/utils/base-response';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { CreateServiceDto, UpdateServiceDto } from 'src/common/dto/request/service.dto';

import { Service } from '@prisma/client';
import { getPublicFileUrl } from 'src/utils/helper';
import { ServiceMapper } from 'src/utils/mappers/service.mapper';
import { FilterParamsDto } from 'src/common/dto/request/filter-params.dto';
import { locationMapping } from 'src/utils/mappers/location-mapper';

@Injectable()
export class MyServicesService {

    private generic: GenericService<Service>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly localStorage: LocalStorageService,
        private readonly functionService: FunctionService,
        private readonly mapper: ServiceMapper,) {
        this.generic = new GenericService<Service>(prisma, 'service');
    }

    /* -------------------------------------------------------
     * UPLOAD IMAGE
     * -----------------------------------------------------*/
    private async uploadImage(serviceId: string, fileBuffer: Buffer,) {
        // Supprimer les anciennes images
        await this.prisma.fileManager.deleteMany({
            where: { targetId: serviceId, fileType: 'ServiceMain' },
        });

        // Sauvegarde fichier
        const upload = await this.localStorage.saveFile(fileBuffer, 'services');

        // Enregistrement FileManager
        await this.prisma.fileManager.create({
            data: {
                ...upload,
                fileType: 'ServiceMain',
                targetId: serviceId,
            }
        });
    }

    private async generateUniqueServiceCode(): Promise<string> {
        const lastService = await this.prisma.service.findFirst({
            orderBy: { code: 'desc' },
            where: {
                code: {
                    startsWith: 'SERV-'
                }
            }
        });

        let nextNumber = 1;
        if (lastService?.code) {
            const lastNumber = parseInt(lastService.code.replace('SERV-', ''));
            if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
        }
        return `SERV-${String(nextNumber).padStart(4, '0')}`;
    }

    /* -------------------------------------------------------
     * CREATE
     * -----------------------------------------------------*/

    async create(dto: CreateServiceDto, userId: string) {
        const { images, iconId, basePriceCents, categoryId, subcategoryId, completionPrice, ...rest } = dto as any;


        const code = await this.generateUniqueServiceCode();
        const price = basePriceCents ? parseFloat(basePriceCents) : null;

        try {
            const service = await this.generic.create({
                ...rest,
                code,
                basePriceCents: price,
                completionPrice: completionPrice ?? null,
                provider: { connect: { id: userId } }, // provider connecté
                icone: iconId ? { connect: { id: iconId } } : undefined, // ✅ corrige iconId -> icone
                category: categoryId ? { connect: { id: categoryId } } : undefined,
                subcategory: subcategoryId ? { connect: { id: subcategoryId } } : undefined,
            });

            // Upload images si présentes
            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(service.id, file.buffer);
                }
            }

            return new BaseResponse(201, 'Service créé avec succès', service);

        } catch (error) {
            console.error('[MyServicesService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création du service');
        }

    }



    /* -------------------------------------------------------
     * UPDATE
     * -----------------------------------------------------*/

    async update(id: string, dto: UpdateServiceDto, userId: string) {
        const { images, iconId, basePriceCents, ...rest } = dto as any;
        const price = basePriceCents ? parseFloat(basePriceCents) : null;
        try {
            // Vérifier si le service existe
            const service = await this.generic.findOne({ id });
            if (!service) throw new NotFoundException('Service introuvable');

            // Vérifier que l'utilisateur est bien le provider du service
            if (service.providerId !== userId) {
                throw new ForbiddenException(
                    "Vous n'êtes pas autorisé à modifier ce service."
                );
            }

            // Mettre à jour le service
            const updated = await this.generic.update(
                { id },
                {
                    ...rest,
                    iconId: iconId ?? service.iconId ?? null,
                    basePriceCents: price,
                }
            );

            // Upload images si présentes
            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(updated.id, file.buffer);
                }
            }

            return new BaseResponse(200, 'Service mis à jour', updated);

        } catch (error) {
            console.error('[Service.update] ❌', error);
            if (error instanceof NotFoundException || error instanceof ForbiddenException) { throw error; }
            throw new InternalServerErrorException('Erreur lors de la mise à jour du service');
        }
    }


    /* -------------------------------------------------------
     * FIND ONE
     * -----------------------------------------------------*/
    async findOne(id: string) {
        try {
            const service = await this.prisma.service.findUnique({ where: { id } });

            if (!service) throw new NotFoundException('Service introuvable');

            const file = await this.prisma.fileManager.findFirst({
                where: { targetId: id, fileType: 'ServiceMain' },
                orderBy: { createdAt: 'desc' },
            });


            const mapped = this.mapper.mapService(service, file ? getPublicFileUrl(file.fileUrl) : null);
            return new BaseResponse(200, 'Service récupéré', mapped);

        } catch (error) {
            console.error('[Service.findOne] ❌', error);
            throw new InternalServerErrorException('Erreur lecture service');
        }
    }

    /* -------------------------------------------------------
     * FIND ALL
     * -----------------------------------------------------*/
    async findAll() {
        try {
            const data = await this.prisma.service.findMany({
                orderBy: { createdAt: 'desc' },
            });

            const ids = data.map(s => s.id);
            const iconId = data.map(s => s.iconId).filter((id): id is string => id !== null && id !== undefined);

            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'ServiceMain' },
                orderBy: { createdAt: 'desc' },
            });

            const fileMap: Record<string, string> = {};

            for (const f of files) {
                if (!fileMap[f.targetId]) {
                    fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);
                }
            }



            const iconFiles = await this.prisma.fileManager.findMany({
                where: {
                    targetId: { in: iconId },
                    fileType: 'IconeMain', // ⭐ EXACTEMENT comme dans create()
                },
                orderBy: { createdAt: 'desc' },
            });

            // Map targetId => iconUrl
            const iconUrlMap: Record<string, string> = {};
            for (const file of iconFiles) {
                if (!iconUrlMap[file.targetId]) { iconUrlMap[file.targetId] = getPublicFileUrl(file.fileUrl); }
            }

            const response = this.mapper.mapServices(data, fileMap, iconUrlMap);
            return new BaseResponse(200, 'Liste des services', response);


            return new BaseResponse(200, 'Liste des services', response);

        } catch (error) {
            console.error('[Service.findAll] ❌', error);
            throw new InternalServerErrorException('Erreur liste services');
        }
    }

    /* -------------------------------------------------------
     * PAGINATION
     * -----------------------------------------------------*/

    async paginate(params: any) {
        try {
            const pagination = await this.functionService.paginate({
                model: 'Service',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        category: true,
                        subcategory: true,
                        icone: true,
                        appointments: true,
                        orderItems: true,
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const ids = pagination.data.map(s => s.id);
            const iconId = pagination.data.map(s => s.iconId).filter((id): id is string => id !== null && id !== undefined);

            const files = await this.prisma.fileManager.findMany({
                where: { targetId: { in: ids }, fileType: 'ServiceMain' },
                orderBy: { createdAt: 'desc' }
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) {
                if (!fileMap[f.targetId]) {
                    fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);
                }
            }

            const iconFiles = await this.prisma.fileManager.findMany({
                where: {
                    targetId: { in: iconId },
                    fileType: 'IconeMain', // ⭐ EXACTEMENT comme dans create()
                },
                orderBy: { createdAt: 'desc' },
            });

            // Map targetId => iconUrl
            const iconUrlMap: Record<string, string> = {};
            for (const file of iconFiles) {
                if (!iconUrlMap[file.targetId]) { iconUrlMap[file.targetId] = getPublicFileUrl(file.fileUrl); }
            }

            const formatted = this.mapper.mapServices(pagination.data, fileMap, iconUrlMap);
            return new BaseResponse(200, 'Services paginés', { ...pagination, data: formatted, });

        } catch (error) {
            console.error('[Service.paginate] ❌', error);
            throw new InternalServerErrorException('Erreur pagination services');
        }
    }

    // getByUserId paginé (avec paginate + files + icons)
    async getByUserId(userId: string,params: any) {
        console.log("Params reçus pour le filtrage :", params,userId);

        try {
            // 1️⃣ Appel du paginate générique AVEC FILTRE providerId
            const pagination = await this.functionService.paginate({
                model: 'Service',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        category: true,
                        subcategory: true,
                        icone: true,
                        appointments: true,
                        orderItems: true,
                    }
                },
                conditions: {
                    providerId: userId,  // FILTRE PAR UTILISATEUR
                },
                orderBy: { createdAt: 'desc' }
            });

            // Si aucun résultat
            if (!pagination.data.length) {
                return new BaseResponse(200, 'Aucun service trouvé', {
                    ...pagination,
                    data: [],
                });
            }

            // 2️⃣ Extraction des IDs + iconIds
            const ids = pagination.data.map(s => s.id);

            const iconId = pagination.data
                .map(s => s.iconId)
                .filter((id): id is string => id !== null && id !== undefined);

            // 3️⃣ Fichiers ServiceMain
            const files = await this.prisma.fileManager.findMany({
                where: {
                    targetId: { in: ids },
                    fileType: 'ServiceMain'
                },
                orderBy: { createdAt: 'desc' }
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) {
                if (!fileMap[f.targetId]) {
                    fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);
                }
            }

            // 4️⃣ Fichiers IconeMain
            const iconFiles = await this.prisma.fileManager.findMany({
                where: {
                    targetId: { in: iconId },
                    fileType: 'IconeMain'
                },
                orderBy: { createdAt: 'desc' },
            });

            const iconUrlMap: Record<string, string> = {};
            for (const file of iconFiles) {
                if (!iconUrlMap[file.targetId]) {
                    iconUrlMap[file.targetId] = getPublicFileUrl(file.fileUrl);
                }
            }

            // 5️⃣ Formatage final
            const formatted = this.mapper.mapServices(
                pagination.data,
                fileMap,
                iconUrlMap
            );

            return new BaseResponse(
                200,
                'Services paginés',
                { ...pagination, data: formatted }
            );

        } catch (error) {
            console.error('[Service.getByUserId] ❌', error);
            throw new InternalServerErrorException('Erreur pagination services utilisateur');
        }
    }



    /**
     * Filtre services par label puis par proximité géographique
     */
    async filterPagination(params: FilterParamsDto) {

        try {
            const { label, location, page = 1, limit = 10 } = params;

            /* ----------------------------------------------------
             * ÉTAPE 1 : Recherche par LABEL uniquement
             * --------------------------------------------------*/
            let services: any[] = [];

            if (label) {
                // Recherche par label dans tout le pays (ou sans filtre géo)
                services = await this.prisma.service.findMany({
                    where: {
                        OR: [
                            { title: { contains: label, mode: "insensitive" } },
                            { description: { contains: label, mode: "insensitive" } },
                            { category: { name: { contains: label, mode: "insensitive" } } },
                            { subcategory: { name: { contains: label, mode: "insensitive" } } },
                        ],
                    },
                    include: {
                        category: true,
                        subcategory: true,
                        icone: true,
                        appointments: true,
                        orderItems: true,
                    },
                    orderBy: { createdAt: "desc" },
                });
            } else if (location) {
                // Si pas de label, on cherche juste par pays
                services = await this.prisma.service.findMany({
                    where: {
                        location: { path: ["country"], equals: location.country },
                    },
                    include: {
                        category: true,
                        subcategory: true,
                        icone: true,
                        appointments: true,
                        orderItems: true,
                    },
                    orderBy: { createdAt: "desc" },
                });
            } else {
                // Aucun filtre : retourner tous les services
                services = await this.prisma.service.findMany({
                    include: {
                        category: true,
                        subcategory: true,
                        icone: true,
                        appointments: true,
                        orderItems: true,
                    },
                    orderBy: { createdAt: "desc" },
                });
            }

            /* ----------------------------------------------------
             * ÉTAPE 2 : Filtrage par PROXIMITÉ (si location fournie)
             * --------------------------------------------------*/
            let filteredServices = services;

            if (location && services.length > 0) {
                // Convertir les locations JSON en objets structurés
                const servicesWithLocation = services.map(service => ({
                    ...service,
                    parsedLocation: locationMapping(service.location)
                }));

                // Construire les niveaux hiérarchiques
                const locationLevels = [
                    { street: location.street, district: location.district, city: location.city, country: location.country },
                    { district: location.district, city: location.city, country: location.country },
                    { city: location.city, country: location.country },
                    { country: location.country },
                ];

                // Essayer chaque niveau
                let matchedServices: any[] = [];

                for (const level of locationLevels) {
                    matchedServices = servicesWithLocation.filter(service => {
                        const loc = service.parsedLocation;

                        // Vérifier le pays (toujours requis)
                        if (loc.country !== level.country) return false;

                        // Vérifier la ville (si spécifiée dans le niveau)
                        if (level.city && loc.city !== level.city) return false;

                        // Vérifier le district (si spécifié dans le niveau)
                        if (level.district && loc.district !== level.district) return false;

                        // Vérifier la rue (si spécifiée dans le niveau)
                        if (level.street && loc.street !== level.street) return false;

                        return true;
                    });

                    // Si on trouve des résultats à ce niveau, on s'arrête
                    if (matchedServices.length > 0) {
                        filteredServices = matchedServices;
                        break;
                    }
                }

                // Si aucun match trouvé, on garde tous les résultats du label
                // (pas de fallback sur le pays car déjà fait à l'étape 1)
            }

            /* ----------------------------------------------------
             * ÉTAPE 3 : Récupérer les images via fileManager
             * --------------------------------------------------*/
            const ids = filteredServices.map((s) => s.id);
            const iconId = filteredServices.map((s) => s.iconId).filter((id): id is string => id !== null && id !== undefined);

            // Récupération en parallèle pour optimisation
            const [files, iconFiles] = await Promise.all([
                this.prisma.fileManager.findMany({
                    where: {
                        targetId: { in: ids },
                        fileType: "ServiceMain",
                    },
                    orderBy: { createdAt: "desc" },
                }),
                this.prisma.fileManager.findMany({
                    where: {
                        targetId: { in: iconId },
                        fileType: 'IconeMain',
                    },
                    orderBy: { createdAt: 'desc' },
                })
            ]);

            // Construire les maps d'images
            const fileMap: Record<string, string> = {};
            for (const f of files) {
                if (!fileMap[f.targetId]) {
                    fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);
                }
            }

            const iconUrlMap: Record<string, string> = {};
            for (const file of iconFiles) {
                if (!iconUrlMap[file.targetId]) {
                    iconUrlMap[file.targetId] = getPublicFileUrl(file.fileUrl);
                }
            }

            /* ----------------------------------------------------
             * ÉTAPE 4 : Mapper les services
             * --------------------------------------------------*/
            const formatted = this.mapper.mapServices(filteredServices, fileMap, iconUrlMap);

            /* ----------------------------------------------------
             * ÉTAPE 5 : Pagination
             * --------------------------------------------------*/
            const start = (page - 1) * limit;
            const paginated = formatted.slice(start, start + limit);

            return new BaseResponse(200, "Services filtrés", {
                total: formatted.length,
                page,
                limit,
                data: paginated,
            });

        } catch (error) {
            console.error("[Service.filterPagination] ❌", error);
            throw new InternalServerErrorException("Erreur filtrage services");
        }
    }

    /* -------------------------------------------------------
     * DELETE
     * -----------------------------------------------------*/
    async remove(id: string) {
        try {
            const service = await this.prisma.service.findUnique({ where: { id } });

            if (!service)
                throw new BadRequestException('Service introuvable');

            await this.prisma.fileManager.deleteMany({
                where: { targetId: id, fileType: 'ServiceMain' },
            });

            await this.prisma.service.delete({
                where: { id },
            });

            return new BaseResponse(200, 'Service supprimé', service);

        } catch (error) {
            console.error('[Service.delete] ❌', error);
            throw new InternalServerErrorException('Erreur suppression service');
        }
    }

}
