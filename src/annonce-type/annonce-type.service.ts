import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { GenericService } from '../utils/generic.service';
import {CreateAnnonceTypeDto,CreateAnnonceTypeBatchDto,UpdateAnnonceTypeDto,} from 'src/common/dto/request/annonce.dto';

@Injectable()
export class AnnonceTypeService {

    private genericType: GenericService<any>;

    constructor(private readonly prisma: PrismaService) {
        this.genericType = new GenericService(prisma, 'annonceType');
    }

    /* -------------------
     * CREATE SINGLE
     * ------------------*/
    async createType(dto: CreateAnnonceTypeDto) {
        try {
            const type = await this.genericType.create(dto);
            return new BaseResponse(201, 'Type d’annonce créé', type);
        } catch (error) {
            console.error('[AnnonceTypeService.createType] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création du type d’annonce');
        }
    }

    /* -------------------
     * CREATE BATCH
     * ------------------*/
    async createTypeBatch(dto: CreateAnnonceTypeBatchDto) {
        try {
            const result = await this.prisma.annonceType.createMany({
                data: dto.types,
                skipDuplicates: true,
            });

            // Retour complet des types insérés ou déjà existants
            const allTypes = await this.prisma.annonceType.findMany({
                where: { label: { in: dto.types.map(t => t.label) } },
                orderBy: { label: 'asc' },
            });

            return new BaseResponse(201, 'Types d’annonces créés en batch (doublons ignorés)', allTypes);
        } catch (error) {
            console.error('[AnnonceTypeService.createTypeBatch] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création batch des types d’annonces');
        }
    }

    /* -------------------
     * UPDATE
     * ------------------*/
    async updateType(id: string, dto: UpdateAnnonceTypeDto) {
        try {
            const type = await this.genericType.update({ id }, dto);
            return new BaseResponse(200, 'Type d’annonce mis à jour', type);
        } catch (error) {
            console.error('[AnnonceTypeService.updateType] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du type d’annonce');
        }
    }

    /* -------------------
     * DELETE
     * ------------------*/
    async deleteType(id: string) {
        try {
            await this.genericType.delete(id);
            return new BaseResponse(200, 'Type d’annonce supprimé', null);
        } catch (error) {
            console.error('[AnnonceTypeService.deleteType] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la suppression du type d’annonce');
        }
    }

    /* -------------------
     * LIST ALL
     * ------------------*/
    async listTypes() {
        try {
            const data = await this.prisma.annonceType.findMany({
                orderBy: { label: 'asc' },
            });
            return new BaseResponse(200, 'Liste des types d’annonces', data);
        } catch (error) {
            console.error('[AnnonceTypeService.listTypes] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des types d’annonces');
        }
    }

    /* -------------------
     * PAGINATED LIST
     * ------------------*/
    async paginate(params: { page?: number; limit?: number }) {
        try {
            const page = Number(params.page ?? 1);
            const limit = Number(params.limit ?? 10);

            const total = await this.prisma.annonceType.count();

            const data = await this.prisma.annonceType.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { label: 'asc' },
            });

            return new BaseResponse(200, 'Types d’annonces paginés', { total, page, limit, data });
        } catch (error) {
            console.error('[AnnonceTypeService.paginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la pagination des types d’annonces');
        }
    }
}
