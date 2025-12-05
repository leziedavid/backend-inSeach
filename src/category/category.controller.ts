import { Controller, Get, Post, Patch, Delete, Body, Param, UploadedFile, UseInterceptors, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CategoryService } from './category.service';
import { CreateServiceCategoryDto, UpdateServiceCategoryDto } from 'src/common/dto/request/category.dto';
import { CreateServiceSubcategoryDto, UpdateServiceSubcategoryDto } from 'src/common/dto/request/subcategory.dto';
import { ImportFileDto } from 'src/common/dto/request/import-file.dto';


@ApiTags('Category Api')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    // ========================================================================
    // 📌 IMPORT EXCEL
    // ========================================================================


    // category.controller.ts
    @Post('import-file')
    @ApiOperation({ summary: 'Importer un fichier CSV ou Excel pour le découpage' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: ImportFileDto })
    @ApiResponse({ status: 201, description: 'Import réussi' })
    @ApiResponse({ status: 400, description: 'Fichier invalide' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {

        if (!file || !file.buffer) {
            throw new BadRequestException('Fichier manquant ou invalide.');
        }
        console.log('Fichier reçu:', file);

        // Détecter le type à partir de l'extension ou mimetype
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (!['csv', 'xls', 'xlsx'].includes(ext)) {
            throw new BadRequestException('Format de fichier non supporté. Utilisez CSV ou Excel.');
        }

        // Passer seulement le buffer au service
        return this.categoryService.importExcel(file.buffer);
    }


    // ========================================================================
    // 📌 CATEGORY CRUD
    // ========================================================================

    @Post()
    @ApiOperation({ summary: 'Créer une catégorie' })
    @ApiResponse({ status: 201, description: 'Catégorie créée.' })
    async createCategory(@Body() dto: CreateServiceCategoryDto) {
        return this.categoryService.createCategory(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie' })
    @ApiResponse({ status: 200, description: 'Catégorie mise à jour.' })
    async updateCategory(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
        return this.categoryService.updateCategory(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une catégorie' })
    @ApiResponse({ status: 200, description: 'Catégorie supprimée.' })
    async deleteCategory(@Param('id') id: string) {
        return this.categoryService.deleteCategory(id);
    }


    @Get()
    @ApiOperation({ summary: 'Lister toutes les catégories' })
    @ApiResponse({ status: 200, description: 'Liste des catégories.' })
    async listCategories() {
        return this.categoryService.listCategories();
    }

    // ========================================================================
    // 📌 SUBCATEGORY CRUD
    // ========================================================================

    @Post('sub')
    @ApiOperation({ summary: 'Créer une sous-catégorie' })
    @ApiResponse({ status: 201, description: 'Sous-catégorie créée.' })
    async createSubcategory(@Body() dto: CreateServiceSubcategoryDto) {
        return this.categoryService.createSubcategory(dto);
    }

    @Patch('sub/:id')
    @ApiOperation({ summary: 'Mettre à jour une sous-catégorie' })
    @ApiResponse({ status: 200, description: 'Sous-catégorie mise à jour.' })
    async updateSubcategory(@Param('id') id: string, @Body() dto: UpdateServiceSubcategoryDto) {
        return this.categoryService.updateSubcategory(id, dto);
    }


    @Delete('sub/:id')
    @ApiOperation({ summary: 'Supprimer une sous-catégorie' })
    @ApiResponse({ status: 200, description: 'Sous-catégorie supprimée.' })
    async deleteSubcategory(@Param('id') id: string) {
        return this.categoryService.deleteSubcategory(id);
    }


    @Get('sub')
    @ApiOperation({ summary: 'Lister toutes les sous-catégories' })
    @ApiResponse({ status: 200, description: 'Liste des sous-catégories.' })
    async listSubcategories() {
        return this.categoryService.listSubcategories();
    }

    // ========================================================================
    // 📌 FRONT-END QUERIES
    // ========================================================================

    @Get('with/subcategories')
    @ApiOperation({ summary: 'Retourner toutes les catégories avec leurs sous-catégories' })
    async getAllCategoriesWithSubcategories() {
        return this.categoryService.getAllCategoriesWithSubcategories();
    }

    @Get(':categoryId/subcategories')
    @ApiOperation({ summary: 'Retourner les sous-catégories d’une catégorie donnée' })
    async getSubcategoriesByCategory(@Param('categoryId') categoryId: string) {
        return this.categoryService.getSubcategoriesByCategory(categoryId);
    }

    @Get('sub/all/with-category')
    @ApiOperation({ summary: 'Retourner toutes les sous-catégories avec leur catégorie' })
    async getAllSubcategories() {
        return this.categoryService.getAllSubcategories();
    }

    @Get('sub/search/name')
    @ApiOperation({ summary: 'Retourner toutes les sous-catégories avec leur catégorie' })
    async searchSubcategoriesByName(@Query('name') name: string) {
        return this.categoryService.searchSubcategoriesByName(name);
    }
}
