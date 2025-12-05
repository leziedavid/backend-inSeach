import {Controller,Get,Post,Patch,Delete,Body,Param,UploadedFile,UseInterceptors,} from '@nestjs/common';
import {ApiTags,ApiOperation,ApiResponse,ApiConsumes,ApiBearerAuth,} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { AllCategoriesService } from './all-categories.service';
import { CreateServiceCategoryDto, UpdateServiceCategoryDto } from 'src/common/dto/request/category.dto';
import { CreateServiceSubcategoryDto, UpdateServiceSubcategoryDto } from 'src/common/dto/request/subcategory.dto';

@ApiTags('All Categories Api')
@ApiBearerAuth('access-token')
@Controller('all-categories')

export class AllCategoriesController {

    constructor(private readonly allCategoriesService: AllCategoriesService) {}

    // ========================================================================
    // 📌 IMPORT EXCEL
    // ========================================================================
    @Post('import')
    @ApiOperation({ summary: 'Importer catégories + sous-catégories depuis un fichier Excel' })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 200, description: 'Importation réussie.' })
    async importExcel(@UploadedFile() file: Express.Multer.File) {
        return this.allCategoriesService.importExcel(file);
    }

    // ========================================================================
    // 📌 CATEGORY CRUD
    // ========================================================================

    @Post()
    @ApiOperation({ summary: 'Créer une catégorie' })
    @ApiResponse({ status: 201, description: 'Catégorie créée.' })
    async createCategory(@Body() dto: CreateServiceCategoryDto) {
        return this.allCategoriesService.createCategory(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie' })
    @ApiResponse({ status: 200, description: 'Catégorie mise à jour.' })
    async updateCategory(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
        return this.allCategoriesService.updateCategory(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une catégorie' })
    @ApiResponse({ status: 200, description: 'Catégorie supprimée.' })
    async deleteCategory(@Param('id') id: string) {
        return this.allCategoriesService.deleteCategory(id);
    }

    @Get()
    @ApiOperation({ summary: 'Lister toutes les catégories' })
    @ApiResponse({ status: 200, description: 'Liste des catégories.' })
    async listCategories() {
        return this.allCategoriesService.listCategories();
    }

    // ========================================================================
    // 📌 SUBCATEGORY CRUD
    // ========================================================================

    @Post('sub')
    @ApiOperation({ summary: 'Créer une sous-catégorie' })
    @ApiResponse({ status: 201, description: 'Sous-catégorie créée.' })
    async createSubcategory(@Body() dto: CreateServiceSubcategoryDto) {
        return this.allCategoriesService.createSubcategory(dto);
    }

    @Patch('sub/:id')
    @ApiOperation({ summary: 'Mettre à jour une sous-catégorie' })
    @ApiResponse({ status: 200, description: 'Sous-catégorie mise à jour.' })
    async updateSubcategory(@Param('id') id: string, @Body() dto: UpdateServiceSubcategoryDto) {
        return this.allCategoriesService.updateSubcategory(id, dto);
    }

    @Delete('sub/:id')
    @ApiOperation({ summary: 'Supprimer une sous-catégorie' })
    @ApiResponse({ status: 200, description: 'Sous-catégorie supprimée.' })
    async deleteSubcategory(@Param('id') id: string) {
        return this.allCategoriesService.deleteSubcategory(id);
    }

    @Get('sub')
    @ApiOperation({ summary: 'Lister toutes les sous-catégories' })
    @ApiResponse({ status: 200, description: 'Liste des sous-catégories.' })
    async listSubcategories() {
        return this.allCategoriesService.listSubcategories();
    }

    // ========================================================================
    // 📌 FRONT-END QUERIES
    // ========================================================================

    @Get('with/subcategories')
    @ApiOperation({ summary: 'Retourner toutes les catégories avec leurs sous-catégories' })
    async getAllCategoriesWithSubcategories() {
        return this.allCategoriesService.getAllCategoriesWithSubcategories();
    }

    @Get(':categoryId/subcategories')
    @ApiOperation({ summary: 'Retourner les sous-catégories d’une catégorie donnée' })
    async getSubcategoriesByCategory(@Param('categoryId') categoryId: string) {
        return this.allCategoriesService.getSubcategoriesByCategory(categoryId);
    }

    @Get('sub/all/with-category')
    @ApiOperation({ summary: 'Retourner toutes les sous-catégories avec leur catégorie' })
    async getAllSubcategories() {
        return this.allCategoriesService.getAllSubcategories();
    }
}
