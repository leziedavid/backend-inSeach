import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { CreateAnnonceDto, UpdateAnnonceDto } from 'src/common/dto/request/annonce.dto';
import { AnnoncesService } from './annonces.service';
import { FilterAnnonceParamsDto } from 'src/common/dto/request/filter-annonce-params.dto';

@ApiTags('Annonce Api')
@ApiBearerAuth('access-token')
@Controller('annonce')

export class AnnoncesController {

    constructor(private readonly annonceService:AnnoncesService) {}

    /* -------------------
     * CREATE ANNOUNCE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle annonce' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 201, description: 'Annonce créée avec succès.' })
    async createAnnonce( @UploadedFiles() files: { images?: Express.Multer.File[] },  @Body() dto: CreateAnnonceDto,  @Req() req: Request,  ) {
        dto.images = files.images ?? [];
        const user = req.user as any;
        return this.annonceService.create(user.id, dto);
    }

    /* -------------------
     * UPDATE ANNOUNCE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une annonce' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 200, description: 'Annonce mise à jour.' })
    @ApiResponse({ status: 404, description: 'Annonce non trouvée.' })
    async updateAnnonce(  @Param('id') id: string,  @UploadedFiles() files: { images?: Express.Multer.File[] },  @Body() dto: UpdateAnnonceDto,  @Req() req: Request,) {
        dto.images = files.images ?? [];
        const user = req.user as any;
        return this.annonceService.update(id, user.id,dto);
    }

    /* -------------------
     * GET ONE ANNOUNCE
     * ------------------*/
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une annonce par ID' })
    @ApiResponse({ status: 200, description: 'Annonce récupérée avec succès.' })
    async getAnnonceById(@Param('id') id: string) {
        return this.annonceService.findOne(id);
    }

    /* -------------------
     * GET ALL ANNOUNCES (paginated)
     * ------------------*/
    @Get()
    @ApiOperation({ summary: 'Liste paginée des annonces' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des annonces récupérée.' })
    async getAllAnnonces(@Query() params: FilterAnnonceParamsDto) {
        return this.annonceService.paginate(params);
    }

    /* -------------------
     * GET ANNOUNCES BY USER
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Get('all/annonces/user')
    @ApiOperation({ summary: 'Récupérer les annonces de l’utilisateur connecté' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des annonces récupérée.' })
    async getByUserId(@Query() params: FilterAnnonceParamsDto, @Req() req: Request) {
        const user = req.user as any;
        console.log("Params", params);
        return this.annonceService.getByUserId(user.id, params);
    }

    /* -------------------
     * DELETE ANNOUNCE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une annonce' })
    @ApiResponse({ status: 200, description: 'Annonce supprimée avec succès.' })
    async deleteAnnonce(@Param('id') id: string) {
        return this.annonceService.remove(id);
    }

    /* -------------------
     * FILTER & PAGINATE ANNOUNCES
     * ------------------*/
    @Post('filter-annonces')
    @ApiOperation({ summary: 'Filtrer les annonces avec pagination' })
    @ApiBody({ description: 'Filtres et pagination', type: FilterAnnonceParamsDto })
    @ApiResponse({ status: 200, description: 'Annonces filtrées avec succès.' })
    async filterAnnonces(@Body() params: FilterAnnonceParamsDto) {
        return this.annonceService.filterPagination(params);
    }

    /* -------------------
     * GET ALL ANNOUNCES BY USER
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Get('me/annonce/user/paginate')
    @ApiOperation({ summary: 'Récupérer les annonces de l’utilisateur connecté' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des annonces récupérée.' })
    async getMyAllAnnonces(@Query() params: FilterAnnonceParamsDto, @Req() req: Request,) {
            const user = req.user as any;
            const userId = user?.id;
        return this.annonceService.getMyAllAnnonces(userId,params);
    }


}
