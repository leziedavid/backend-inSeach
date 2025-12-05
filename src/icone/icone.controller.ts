import {Controller,Post,Get,Patch,Delete,Body,Param,UseGuards,UseInterceptors,UploadedFiles,Query,BadRequestException,Req,} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {ApiTags,ApiOperation,ApiBearerAuth,ApiResponse,ApiConsumes,ApiBody,ApiQuery,} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { IconeService } from './icone.service';
import { CreateIconeDto, UpdateIconeDto } from 'src/common/dto/request/icone.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@ApiTags('Icone Api')
@ApiBearerAuth('access-token')
@Controller('icone')

export class IconeController {
    constructor(private readonly iconeService: IconeService) { }

    /* -------------------
     * CREATE ICONE
     * ------------------*/
    // @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle icône' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 201, description: 'Icône créée avec succès.' })
    async createIcone( @UploadedFiles() files: { images?: Express.Multer.File[] },  @Body() dto: CreateIconeDto,@Req() req: Request, ) {
        dto.images = files.images ?? [];
        return this.iconeService.create(dto);
    }

    /* -------------------
     * UPDATE ICONE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une icône' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 200, description: 'Icône mise à jour avec succès.' })
    @ApiResponse({ status: 404, description: 'Icône non trouvée.' })
    async updateIcone( @Param('id') id: string, @UploadedFiles() files: { images?: Express.Multer.File[] }, @Body() dto: UpdateIconeDto,) {
        dto.images = files.images ?? [];
        return this.iconeService.update(id, dto);
    }

    /* -------------------
     * GET ONE ICONE
     * ------------------*/
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une icône par ID' })
    @ApiResponse({ status: 200, description: 'Icône récupérée avec succès.' })
    async getIconeById(@Param('id') id: string) {
        return this.iconeService.findOne(id);
    }

    /* -------------------
     * GET ALL ICONES
     * ------------------*/
    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les icônes' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des icônes récupérée.' })
    async getAllIcones(@Query() params: PaginationParamsDto) {
        return this.iconeService.getAllPaginate(params);
    }

    /* -------------------
     * DELETE ICONE
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une icône' })
    @ApiResponse({ status: 200, description: 'Icône supprimée avec succès.' })
    async deleteIcone(@Param('id') id: string) {
        return this.iconeService.remove(id);
    }
    
}
