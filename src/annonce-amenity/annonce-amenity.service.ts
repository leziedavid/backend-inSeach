import { Injectable, BadRequestException, InternalServerErrorException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { GenericService } from 'src/utils/generic.service';
import { CreateAmenityDto, UpdateAmenityDto } from 'src/common/dto/request/annonce.dto';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';

@Injectable()
export class AnnonceAmenityService {

    private genericAmenity: GenericService<any>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly localStorage: LocalStorageService,
    ) {
        this.genericAmenity = new GenericService(prisma, 'amenity');
    }

    /* -------------------
     * UPLOAD IMAGE
     * ------------------*/
    private async uploadImage(amenityId: string, fileBuffer: Buffer,replaceExisting = false) {
        // Supprime les anciennes images pour cet amenity
        if (replaceExisting) {
            const existingFile = await this.prisma.fileManager.findFirst({
                where: { targetId: amenityId, fileType: 'AmenityMain' },
                orderBy: { createdAt: 'desc' },
            });

            if (existingFile?.fileCode) {
                try {
                    await this.localStorage.deleteFile(existingFile.fileCode);
                } catch (error) {
                    console.warn(`Erreur suppression  ${existingFile.fileCode}: ${error.message}`);
                }
                await this.prisma.fileManager.deleteMany({
                    where: { targetId: amenityId, fileType: 'AmenityMain' },
                });
            }
        }

        const upload = await this.localStorage.saveFile(fileBuffer, 'amenities');
        await this.prisma.fileManager.create({ data: { ...upload, fileType: 'AmenityMain', targetId: amenityId, }, });
    }

    /* -------------------
     * CREATE
     * ------------------*/
    async create(dto: CreateAmenityDto, images?: Express.Multer.File[]) {
        try {
            const amenity = await this.genericAmenity.create(dto);

            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(amenity.id, file.buffer);
                }
            }

            // Récupérer le fichier uploadé si existant
            const file = await this.prisma.fileManager.findFirst({
                where: { targetId: amenity.id, fileType: 'AmenityMain' },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(201, 'Amenity ajoutée à l’annonce', { ...amenity, icon: file ? getPublicFileUrl(file.fileUrl) : amenity.icon || null, });
        } catch (error) {
            console.error('[Amenity.create] ❌', error);
            throw new InternalServerErrorException('Erreur création amenity');
        }
    }

    /* -------------------
     * UPDATE
     * ------------------*/
    async update(id: string, dto: UpdateAmenityDto, images?: Express.Multer.File[]) {
        try {
            const amenity = await this.genericAmenity.update(id, dto);

            if (images?.length) {
                for (const file of images) {
                    await this.uploadImage(id, file.buffer);
                }
            }

            const file = await this.prisma.fileManager.findFirst({
                where: { targetId: id, fileType: 'AmenityMain' },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Amenity mise à jour', { ...amenity, icon: file ? getPublicFileUrl(file.fileUrl) : amenity.icon || null, });
        } catch (error) {
            console.error('[Amenity.update] ❌', error);
            throw new InternalServerErrorException('Erreur mise à jour amenity');
        }
    }

    /* -------------------
     * DELETE
     * ------------------*/
    async delete(id: string) {
        try {
            await this.prisma.fileManager.deleteMany({
                where: { targetId: id, fileType: 'AmenityMain' },
            });

            await this.genericAmenity.delete(id);
            return new BaseResponse(200, 'Amenity supprimée', null);
        } catch (error) {
            console.error('[Amenity.delete] ❌', error);
            throw new InternalServerErrorException('Erreur suppression amenity');
        }
    }

    /* -------------------
     * LIST ALL
     * ------------------*/
    async listAll() {
        try {
            const data = await this.prisma.amenity.findMany({
                orderBy: { createdAt: 'desc' },
            });

            const ids = data.map(a => a.id);

            const files = await this.prisma.fileManager.findMany({
                where: {
                    targetId: { in: ids },
                    fileType: 'AmenityMain',
                },
                orderBy: { createdAt: 'desc' },
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) {
                if (!fileMap[f.targetId]) {
                    fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);
                }
            }

            const formatted = data.map(a => ({
                ...a,
                icon: fileMap[a.id] ?? a.icon ?? null,
            }));

            return new BaseResponse(200, 'Liste de toutes les amenities', formatted);

        } catch (error) {
            console.error('[Amenity.listAll] ❌', error);
            throw new InternalServerErrorException('Erreur récupération amenities');
        }
    }

    /* -------------------
     * LIST BY ANNOUNCE
     * ------------------*/
    async listByAnnonce(annonceId: string) {
        try {
            const links = await this.prisma.annonceAmenity.findMany({
                where: { annonceId },
                include: { amenity: true },
                orderBy: { createdAt: 'desc' },
            });

            const ids = links.map(l => l.amenity.id);

            const files = await this.prisma.fileManager.findMany({
                where: {
                    targetId: { in: ids },
                    fileType: 'AmenityMain',
                },
                orderBy: { createdAt: 'desc' },
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) {
                if (!fileMap[f.targetId]) {
                    fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);
                }
            }

            const formatted = links.map(l => ({
                ...l.amenity,
                icon: fileMap[l.amenity.id] ?? l.amenity.icon ?? null,
            }));

            return new BaseResponse(
                200,
                `Liste des amenities pour l'annonce ${annonceId}`,
                formatted
            );

        } catch (error) {
            console.error('[Amenity.listByAnnonce] ❌', error);
            throw new InternalServerErrorException('Erreur récupération amenities par annonce');
        }
    }


    /* -------------------
     * PAGINATE (ADMIN)
     * ------------------*/
    async paginate(params: { page?: number; limit?: number }) {
        try {
            const page = params.page ?? 1;
            const limit = params.limit ?? 10;

            const total = await this.prisma.amenity.count();

            const data = await this.prisma.amenity.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            });

            const ids = data.map(a => a.id);

            const files = await this.prisma.fileManager.findMany({
                where: {
                    targetId: { in: ids },
                    fileType: 'AmenityMain',
                },
                orderBy: { createdAt: 'desc' },
            });

            const fileMap: Record<string, string> = {};
            for (const f of files) {
                if (!fileMap[f.targetId]) {
                    fileMap[f.targetId] = getPublicFileUrl(f.fileUrl);
                }
            }

            const formatted = data.map(a => ({
                ...a,
                icon: fileMap[a.id] ?? a.icon ?? null,
            }));

            return new BaseResponse(200, 'Liste paginée des amenities', {
                total,
                page,
                limit,
                data: formatted,
            });

        } catch (error) {
            console.error('[Amenity.paginate] ❌', error);
            throw new InternalServerErrorException('Erreur pagination amenities');
        }
    }


}
