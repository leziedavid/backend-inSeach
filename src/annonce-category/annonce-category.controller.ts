import { Controller, Post, Patch, Delete, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AnnonceCategoryService } from './annonce-category.service';
import {
    CreateAnnonceCategoryDto,
    UpdateAnnonceCategoryDto,
    CreateAnnonceCategoryBatchDto,
} from 'src/common/dto/request/annonce.dto';

@ApiTags('Annonce Category Api')
@ApiBearerAuth('access-token')
@Controller('annonce-category')
export class AnnonceCategoryController {

    constructor(private readonly categoryService: AnnonceCategoryService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle catégorie d’annonce' })
    @ApiBody({ type: CreateAnnonceCategoryDto })
    @ApiResponse({ status: 201, description: 'Catégorie créée avec succès.' })
    async createCategory(@Body() dto: CreateAnnonceCategoryDto) {
        return this.categoryService.createCategory(dto);
    }

    // ---------------- BATCH CREATE ----------------
    @UseGuards(JwtAuthGuard)
    @Post('batch')
    @ApiOperation({ summary: 'Créer plusieurs catégories d’annonce en batch' })
    @ApiBody({ type: CreateAnnonceCategoryBatchDto })
    @ApiResponse({ status: 201, description: 'Catégories créées avec succès.' })
    async createCategoryBatch(@Body() dto: CreateAnnonceCategoryBatchDto) {
        return this.categoryService.createCategoryBatch(dto);
    }


    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie d’annonce' })
    @ApiBody({ type: UpdateAnnonceCategoryDto })
    @ApiResponse({ status: 200, description: 'Catégorie mise à jour.' })
    async updateCategory(@Param('id') id: string, @Body() dto: UpdateAnnonceCategoryDto) {
        return this.categoryService.updateCategory(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une catégorie d’annonce' })
    @ApiResponse({ status: 200, description: 'Catégorie supprimée avec succès.' })
    async deleteCategory(@Param('id') id: string) {
        return this.categoryService.deleteCategory(id);
    }

    @Get()
    @ApiOperation({ summary: 'Lister toutes les catégories d’annonce' })
    @ApiResponse({ status: 200, description: 'Liste des catégories récupérée.' })
    async listCategories() {
        return this.categoryService.listCategories();
    }

    @Get('paginate')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lister les catégories paginées (admin)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Catégories paginées récupérées.' })
    async paginateCategories(@Query() query: { page?: number; limit?: number }) {
        return this.categoryService.paginate(query);
    }
    
}
