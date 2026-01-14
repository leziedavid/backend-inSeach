import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { GenericService } from '../utils/generic.service';

import {
    CreateAnnonceCategoryBatchDto,
    CreateAnnonceCategoryDto,
    UpdateAnnonceCategoryDto,
} from 'src/common/dto/request/annonce.dto';

@Injectable()
export class AnnonceCategoryService {

    private genericCategory: GenericService<any>;

    constructor(private readonly prisma: PrismaService) {
        this.genericCategory = new GenericService(prisma, 'annonceCategory');
    }

    async createCategory(dto: CreateAnnonceCategoryDto) {
        const category = await this.genericCategory.create(dto);
        return new BaseResponse(201, 'Catégorie créée', category);
    }

    // ---------------- BATCH CREATE ----------------

    async createCategoryBatch(dto: CreateAnnonceCategoryBatchDto) {
        try {
            // Prisma createMany ignore automatiquement les doublons sur les champs uniques
            const result = await this.prisma.annonceCategory.createMany({
                data: dto.categories,
                skipDuplicates: true, // ✅ ignore les doublons basés sur les champs uniques
            });

            // Optionnel : récupérer toutes les catégories envoyées, pour le retour complet
            const allCategories = await this.prisma.annonceCategory.findMany({
                where: { value: { in: dto.categories.map(c => c.value) }, },
                orderBy: { value: 'asc' },
            });

            return new BaseResponse(201, 'Catégories créées en batch (doublons ignorés)', allCategories);
        } catch (error) {
            console.error('Erreur lors de la création batch des catégories :', error);
            throw new InternalServerErrorException('Erreur lors de la création batch des catégories');
        }
    }


    async updateCategory(id: string, dto: UpdateAnnonceCategoryDto) {
        const category = await this.genericCategory.update({ id }, dto);
        return new BaseResponse(200, 'Catégorie mise à jour', category);
    }

    async deleteCategory(id: string) {
        await this.genericCategory.delete(id);
        return new BaseResponse(200, 'Catégorie supprimée', null);
    }

    async listCategories() {
        const data = await this.prisma.annonceCategory.findMany({
            orderBy: { value: 'asc' },
        });
        return new BaseResponse(200, 'Liste des catégories', data);
    }

    /* -------------------
     * PAGINATED CATEGORIES
     * ------------------*/
    async paginate(params: { page?: number; limit?: number }) {
        const page = Number(params.page ?? 1);
        const limit = Number(params.limit ?? 10);

        const total = await this.prisma.annonceCategory.count();

        const data = await this.prisma.annonceCategory.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { value: 'asc' },
        });

        return new BaseResponse(200, 'Catégories paginées', { total, page, limit, data });
    }


}
