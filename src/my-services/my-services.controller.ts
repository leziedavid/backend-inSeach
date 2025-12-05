import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req, BadRequestException, } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody, } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { CreateServiceDto, UpdateServiceDto } from 'src/common/dto/request/service.dto';
import { MyServicesService } from './my-services.service';
import { FilterParamsDto } from 'src/common/dto/request/filter-params.dto';

@ApiTags('Service Api')
@ApiBearerAuth('access-token')
@Controller('service')

export class MyServicesController {
    
    constructor(private readonly serviceService: MyServicesService) { }

    /* -------------------
     * CREATE SERVICE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau service' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 201, description: 'Service créé avec succès.' })
    async createService( @UploadedFiles() files: { images?: Express.Multer.File[] }, @Body() dto: CreateServiceDto, @Req() req: Request,) {
        dto.images = files.images ?? [];
        const user = req.user as any;
        return this.serviceService.create(dto, user.id);
    }

    /* -------------------
     * UPDATE SERVICE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un service' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 200, description: 'Service mis à jour.' })
    @ApiResponse({ status: 404, description: 'Service non trouvé.' })
    async updateService(  @Param('id') id: string,  @UploadedFiles() files: { images?: Express.Multer.File[] },  @Body() dto: UpdateServiceDto,  @Req() req: Request,) {
        dto.images = files.images ?? [];
        const user = req.user as any;
        return this.serviceService.update(id, dto, user.id);
    }

    /* -------------------
     * GET ONE SERVICE
     * ------------------*/
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un service par ID' })
    @ApiResponse({ status: 200, description: 'Service récupéré avec succès.' })
    async getServiceById(@Param('id') id: string) {
        return this.serviceService.findOne(id);
    }

    /* -------------------
     * GET ALL SERVICES
     * ------------------*/
    @Get()
    @ApiOperation({ summary: 'Liste de tous les services' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des services récupérée.' })
    async getAllServices(@Query() params: FilterParamsDto) {
        return this.serviceService.paginate(params);
    }

    @Get('all/servicesbyUserId')
    @ApiOperation({ summary: 'Récupérer les services d’un utilisateur' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des services récupérée.' })
    async getByUserId(@Query() params: FilterParamsDto, @Req() req: Request,) {
        const user = req.user as any;
        const userId = user?.id;
        return this.serviceService.getByUserId(userId,params);
    }

    /* -------------------
     * DELETE SERVICE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un service' })
    @ApiResponse({ status: 200, description: 'Service supprimé avec succès.' })
    async deleteService(@Param('id') id: string) {
        return this.serviceService.remove(id);
    }

    /* -------------------
     * FILTER & PAGINATE SERVICES
     * ------------------*/
    @Post('filter-services')
    @ApiOperation({ summary: 'Filtrer les services avec pagination' })
    @ApiBody({ description: 'Filtres et pagination', type: FilterParamsDto })
    @ApiResponse({ status: 200, description: 'Services filtrés avec succès.' })
    async filterServices(@Body() params: FilterParamsDto) {
        return this.serviceService.filterPagination(params);
    }

}
