import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import { GenericService } from 'src/utils/generic.service';
import { Icone } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { CreateIconeDto, UpdateIconeDto } from 'src/common/dto/request/icone.dto';
import { BaseResponse } from 'src/utils/base-response';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { getPublicFileUrl } from 'src/utils/helper';



@Injectable()
export class IconeService {

    private generic: GenericService<Icone>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly localStorage: LocalStorageService,
        private readonly functionService: FunctionService,
    ) {
        this.generic = new GenericService<Icone>(prisma, 'icone');
    }

    /** --------------------- Upload fichier --------------------- */
    private async uploadFile(userId: string, fileBuffer: Buffer | string, fileType: string, folder: string) {

        const existingFile = await this.prisma.fileManager.findFirst({
            where: { targetId: userId, fileType },
            orderBy: { createdAt: 'desc' },
        });

        if (existingFile?.fileCode) {
            try {
                await this.localStorage.deleteFile(existingFile.fileCode);
            } catch (err) {
                console.warn(`Erreur suppression du fichier ${existingFile.fileCode}: ${err.message}`);
            }
            await this.prisma.fileManager.deleteMany({ where: { targetId: userId, fileType } });
        }
        const uploadResult = await this.localStorage.saveFile(fileBuffer, folder);
        await this.prisma.fileManager.create({
            data: { ...uploadResult, fileType, targetId: userId },
        });

    }


    /** ----------- CREATE ----------- */
    async create(dto: CreateIconeDto) {
        const { images, ...allData } = dto as any;

        try {
            if (!images?.length) {
                throw new BadRequestException("Aucune image fournie");
            }

            const createdIcones = [];

            for (const file of images) {
                // 1️⃣ Création d'une icône pour CHAQUE image
                const icone = await this.generic.create({
                    ...allData   // name, description, category...
                });

                // 2️⃣ Upload de l'image liée à CETTE icône
                await this.uploadFile(icone.id, file.buffer, 'IconeMain', 'icone');

                createdIcones.push(icone);
            }

            return new BaseResponse(
                201,
                'Icônes créées avec succès',
                createdIcones
            );
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            console.error('[IconeService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création des icônes');
        }
    }


    /** ----------- UPDATE ----------- */
    async update(id: string, dto: UpdateIconeDto) {

        const { images, ...allData } = dto as any;

        try {

            const icone = await this.generic.findOne({ id });
            if (!icone) throw new BadRequestException('icone introuvable');

            const updatedIcone = await this.generic.update({ id }, allData);

            if (images?.length) {
                for (const file of images) {
                    await this.uploadFile(updatedIcone.id, file.buffer, 'IconeMain', 'icone');
                }
            }

            return new BaseResponse(200, 'icone mis à jour avec succès', updatedIcone);
        } catch (error) {
            // ✅ Si c’est une erreur NestJS (BadRequestException, NotFoundException, etc.), on la relance telle quelle
            if (error instanceof BadRequestException) throw error;
            console.error('[IconeService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour de l’icone');
        }


    }

    /** --------------------- FIND ALL --------------------- */

    async findAll() {

        try {
            // 1️⃣ Récupération des icônes
            const data = await this.prisma.icone.findMany({
                orderBy: { createdAt: 'desc' },
            });

            if (!data.length) {
                return new BaseResponse(200, 'Aucune icône trouvée', []);
            }

            // 2️⃣ Récupération des IDs
            const iconeIds = data.map(i => i.id);

            // 3️⃣ Récupération des fichiers associés dans fileManager
            const allFiles = await this.prisma.fileManager.findMany({
                where: { targetId: { in: iconeIds }, fileType: 'IconeMain' },
                orderBy: { createdAt: 'desc' },
            });

            // 4️⃣ Préparer un map id => url publique
            const filesMap: Record<string, string | null> = {};
            for (const file of allFiles) {
                if (!filesMap[file.targetId]) {
                    filesMap[file.targetId] = getPublicFileUrl(file.fileUrl); // ⭐ URL publique
                }
            }

            // 5️⃣ Construire la réponse finale
            const response = data.map(icone => ({
                id: icone.id,
                name: icone.name,
                description: icone.description,
                iconUrl: filesMap[icone.id] || null,
                createdAt: icone.createdAt,
                updatedAt: icone.updatedAt,
            }));

            return new BaseResponse(200, 'Liste des icônes récupérée avec succès', response);

        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            console.error('[IconeService.findAll] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des icônes');
        }
    }


    /** --------------------- FIND ONE --------------------- */
    async findOne(id: string) {
        try {
            // 1️⃣ Vérifier que l’icône existe
            const icone = await this.prisma.icone.findUnique({
                where: { id },
            });

            if (!icone) {
                throw new NotFoundException('Icône introuvable');
            }

            // 2️⃣ Récupérer son image dans fileManager
            const file = await this.prisma.fileManager.findFirst({
                where: { targetId: id, fileType: 'IconeMain' },
                orderBy: { createdAt: 'desc' },
            });

            // 3️⃣ Construire la réponse finale
            return new BaseResponse(200, 'Icône récupérée avec succès', {
                id: icone.id,
                name: icone.name,
                description: icone.description,
                iconUrl: file ? getPublicFileUrl(file.fileUrl) : null,
                createdAt: icone.createdAt,
                updatedAt: icone.updatedAt,
            });

        } catch (error) {
            if (error instanceof NotFoundException) throw error;

            console.error('[IconeService.findOne] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération de l’icône');
        }
    }

    /** --------------------- Pagination icones --------------------- */
    async getAllPaginate(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'Icone',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                },
                orderBy: { createdAt: 'desc' },
            });

            const iconeIds = data.data.map(i => i.id);

            // Récupération du fichier principal de chaque icône
            const allFiles = await this.prisma.fileManager.findMany({
                where: {
                    targetId: { in: iconeIds },
                    fileType: 'IconeMain', // ⭐ EXACTEMENT comme dans create()
                },
                orderBy: { createdAt: 'desc' },
            });

            // Map targetId => iconUrl
            const filesMap: Record<string, string> = {};
            for (const file of allFiles) {
                if (!filesMap[file.targetId]) {
                    filesMap[file.targetId] = getPublicFileUrl(file.fileUrl);
                }
            }

            // Format final EXACTEMENT comme ton tableau fakeIcones
            const iconesFormatted = data.data.map(icone => ({
                id: icone.id,
                name: icone.name,
                description: icone.description,
                iconUrl: filesMap[icone.id] || null,   // ⭐ correct
                createdAt: icone.createdAt,
                updatedAt: icone.updatedAt,
            }));

            return new BaseResponse(200, 'Liste paginée des icônes', {
                ...data,
                data: iconesFormatted,
            });

        } catch (error) {
            console.error('[IconeService.getAllPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des icônes');
        }
    }

    /** --------------------- DELETE Icône --------------------- */
    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            // 1️⃣ Vérifier que l’icône existe
            const iconeData = await this.prisma.icone.findUnique({
                where: { id },
            });

            if (!iconeData) {
                throw new BadRequestException('Icône introuvable');
            }

            // 2️⃣ Supprimer son image dans FileManager
            await this.prisma.fileManager.deleteMany({
                where: { targetId: id, fileType: 'IconeMain' },
            });

            // 3️⃣ Supprimer l'icône
            await this.prisma.icone.delete({
                where: { id },
            });

            return new BaseResponse(200, 'Icône supprimée avec succès', iconeData);

        } catch (error) {
            console.error('[IconeService.delete] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la suppression de l’icône');
        }
    }


}
