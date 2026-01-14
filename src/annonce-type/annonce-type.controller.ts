import { Controller, Post, Patch, Delete, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AnnonceTypeService } from './annonce-type.service';
import {
    CreateAnnonceTypeDto,
    UpdateAnnonceTypeDto,
    CreateAnnonceTypeBatchDto,
} from 'src/common/dto/request/annonce.dto';

@ApiTags('Annonce Type Api')
@ApiBearerAuth('access-token')
@Controller('annonce-type')
export class AnnonceTypeController {

    constructor(private readonly typeService: AnnonceTypeService) { }

    /* -------------------
     * CREATE SINGLE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau type d’annonce' })
    @ApiBody({ type: CreateAnnonceTypeDto })
    @ApiResponse({ status: 201, description: 'Type d’annonce créé avec succès.' })
    async createType(@Body() dto: CreateAnnonceTypeDto) {
        return this.typeService.createType(dto);
    }

    /* -------------------
     * CREATE BATCH
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Post('batch')
    @ApiOperation({ summary: 'Créer plusieurs types d’annonce en batch' })
    @ApiBody({ type: CreateAnnonceTypeBatchDto })
    @ApiResponse({ status: 201, description: 'Types d’annonces créés avec succès.' })
    async createTypeBatch(@Body() dto: CreateAnnonceTypeBatchDto) {
        return this.typeService.createTypeBatch(dto);
    }

    /* -------------------
     * UPDATE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un type d’annonce' })
    @ApiBody({ type: UpdateAnnonceTypeDto })
    @ApiResponse({ status: 200, description: 'Type d’annonce mis à jour.' })
    async updateType(@Param('id') id: string, @Body() dto: UpdateAnnonceTypeDto) {
        return this.typeService.updateType(id, dto);
    }

    /* -------------------
     * DELETE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un type d’annonce' })
    @ApiResponse({ status: 200, description: 'Type d’annonce supprimé avec succès.' })
    async deleteType(@Param('id') id: string) {
        return this.typeService.deleteType(id);
    }

    /* -------------------
     * LIST ALL
     * ------------------*/
    @Get()
    @ApiOperation({ summary: 'Lister tous les types d’annonces' })
    @ApiResponse({ status: 200, description: 'Liste des types d’annonces récupérée.' })
    async listTypes() {
        return this.typeService.listTypes();
    }

    /* -------------------
     * PAGINATED LIST
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Get('paginate')
    @ApiOperation({ summary: 'Lister les types d’annonces paginés (admin)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Types d’annonces paginés récupérés.' })
    async paginateTypes(@Query() query: { page?: number; limit?: number }) {
        return this.typeService.paginate(query);
    }
}
