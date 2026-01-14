
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AnnonceAmenityService } from './annonce-amenity.service';
import { CreateAmenityDto, UpdateAmenityDto } from 'src/common/dto/request/annonce.dto';
import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Annonce Amenity Api')
@ApiBearerAuth('access-token')
@Controller('annonce-amenity')
export class AnnonceAmenityController {

    constructor(private readonly amenityService: AnnonceAmenityService) { }

    /* -------------------
     * CREATE AMENITY
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Ajouter une amenity à une annonce' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 1 }]))
    @ApiBody({ type: CreateAmenityDto })
    @ApiResponse({ status: 201, description: 'Amenity ajoutée.' })
    async create(@UploadedFiles() files: { images?: Express.Multer.File[] }, @Body() dto: CreateAmenityDto,) {
        const images = files.images ?? [];
        return this.amenityService.create(dto, images);
    }

    /* -------------------
     * UPDATE AMENITY
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une amenity d’annonce' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 1 }]))
    @ApiBody({ type: UpdateAmenityDto })
    @ApiResponse({ status: 200, description: 'Amenity mise à jour.' })
    async update(@Param('id') id: string, @UploadedFiles() files: { images?: Express.Multer.File[] }, @Body() dto: UpdateAmenityDto,) {
        const images = files.images ?? [];
        return this.amenityService.update(id, dto, images);
    }

    /* -------------------
     * DELETE AMENITY
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une amenity d’annonce' })
    @ApiResponse({ status: 200, description: 'Amenity supprimée.' })
    async delete(@Param('id') id: string) {
        return this.amenityService.delete(id);
    }

    
    /* -------------------
     * LIST ALL AMENITIES
     * ------------------*/
    @Get()
    @ApiOperation({ summary: 'Lister toutes les amenities' })
    @ApiResponse({ status: 200, description: 'Liste récupérée.' })
    async listAll() {
        return this.amenityService.listAll();
    }

    /* -------------------
     * LIST AMENITIES BY ANNOUNCE
     * ------------------*/
    @Get('by-annonce/:annonceId')
    @ApiOperation({ summary: 'Lister les amenities d’une annonce' })
    @ApiResponse({ status: 200, description: 'Liste récupérée.' })
    async listByAnnonce(@Param('annonceId') annonceId: string) {
        return this.amenityService.listByAnnonce(annonceId);
    }

    /* -------------------
     * PAGINATE AMENITIES (ADMIN)
     * ------------------*/
    @Get('paginate')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lister les amenities paginées (admin)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste paginée récupérée.' })
    async paginate(@Query('page') page?: string, @Query('limit') limit?: string,) {
        return this.amenityService.paginate({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, });
    }


}
