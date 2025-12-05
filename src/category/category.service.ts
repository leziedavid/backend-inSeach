import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { GenericService } from '../utils/generic.service';
import { seedFromExcelBuffer, SeedResult } from 'src/utils/seed-from-excel';
import { CreateServiceCategoryDto, UpdateServiceCategoryDto } from 'src/common/dto/request/category.dto';
import { CreateServiceSubcategoryDto, UpdateServiceSubcategoryDto } from 'src/common/dto/request/subcategory.dto';

@Injectable()
export class CategoryService {

    private genericCategory: GenericService<any>;
    private genericSubcategory: GenericService<any>;

    constructor(private readonly prisma: PrismaService) {
        this.genericCategory = new GenericService(prisma, 'serviceCategory');
        this.genericSubcategory = new GenericService(prisma, 'serviceSubcategory');
    }

    async importExcel(fileBuffer: Buffer): Promise<{ success: boolean; message: string; details?: SeedResult }> {
        try {
            if (!fileBuffer) throw new BadRequestException('Aucun fichier reçu.');

            const seedResult = await seedFromExcelBuffer(fileBuffer);

            if (!seedResult.success) {
                return { success: false, message: 'Échec de l’importation.', details: seedResult };
            }
            
            return { success: true, message: 'Importation réussie !', details: seedResult };
        } catch (error) {
            console.error('[CategoryService.importExcel] ❌', error);
            throw new InternalServerErrorException('Erreur lors de l’importation Excel.');
        }
    }

    // ----------------------
    // CATEGORY CRUD
    // ----------------------

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
        const data = await this.genericCategory.findAll();
        return new BaseResponse(200, 'Liste des catégories', data);
    }

    // ----------------------
    // SUBCATEGORY CRUD
    // ----------------------

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
        const data = await this.genericSubcategory.findAll();
        return new BaseResponse(200, 'Liste des sous-catégories', data);
    }

    // ===============================
    // 📌 Retourner toutes les catégories (avec sous-catégories)
    // ===============================
    async getAllCategoriesWithSubcategories(): Promise<BaseResponse> {
        const data = await this.prisma.serviceCategory.findMany({ include: { subcategories: true }, orderBy: { name: 'asc' } });
        return new BaseResponse(200, "Liste des catégories avec sous-catégories", data);
    }

    // ===============================
    // 📌 Retourner toutes les sous-catégories
    // ===============================
    async getAllSubcategories(): Promise<BaseResponse> {
        const data = await this.prisma.serviceSubcategory.findMany({
            include: { category: true },
            orderBy: { name: 'asc' }
        });
        return new BaseResponse(200, "Liste des sous-catégories", data);
    }

    // ===============================
    // 📌 Retourner sous-catégories d’une catégorie donnée
    // ===============================
    async getSubcategoriesByCategory(categoryId: string): Promise<BaseResponse> {
        const data = await this.prisma.serviceSubcategory.findMany({
            where: { categoryId },
            include: { category: true },
            orderBy: { name: 'asc' }
        });
        return new BaseResponse(200, `Sous-catégories de la catégorie ${categoryId}`, data
        );
    }


    // ===============================
// 🔍 Rechercher des sous-catégories par nom
// ===============================
async searchSubcategoriesByName(name: string): Promise<BaseResponse> {
    const data = await this.prisma.serviceSubcategory.findMany({
        where: {
            name: {
                contains: name,  // recherche partielle
                mode: 'insensitive', // insensible à la casse
            },
        },
        include: { category: true },
        orderBy: { name: 'asc' },
    });

    return new BaseResponse(200, `Sous-catégories contenant "${name}"`, data);
}



}

