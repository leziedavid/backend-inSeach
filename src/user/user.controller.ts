import { Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from 'src/common/dto/request/user.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { UserStatus } from '@prisma/client';

@ApiTags('User Api')
@ApiBearerAuth('access-token')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    /** --------------------- Création utilisateur --------------------- */
    @Post('register')
    @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès.' })
    async createUser(@UploadedFiles() files: { images?: Express.Multer.File[] }, @Body() dto: CreateUserDto,) {
        return this.userService.create({
            ...dto, images: files?.images || [],
        });
    }

    /** --------------------- Mise à jour utilisateur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès.' })
    async updateUser(@Param('id') id: string, @UploadedFiles() files: { images?: Express.Multer.File[] }, @Body() dto: UpdateUserDto,) {
        return this.userService.update(id, { ...dto, images: files?.images || [], });
    }

    /** --------------------- Suppression utilisateur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un utilisateur' })
    @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès.' })
    async deleteUser(@Param('id') id: string) {
        return this.userService.delete(id);
    }

    // @UseGuards(JwtAuthGuard)
    @Patch(':id/status/update')
    @ApiOperation({ summary: 'Mettre à jour le statut d’un utilisateur' })
    @ApiResponse({ status: 200, description: 'Statut de l’utilisateur mis à jour avec succès.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: Object.values(UserStatus),
                    example: 'ACTIVE',
                },
            },
        },
    })
    async updateStatus(@Param('id') id: string, @Body('status') status: UserStatus,) {
        return this.userService.updateUserStatus(id, status);
    }

    /** --------------------- Liste paginée --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Liste paginée des utilisateurs' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste paginée des utilisateurs.' })
    async getPaginatedUsers(@Query() params: PaginationParamsDto) {
        return this.userService.getAllPaginate(params);
    }

    /** --------------------- Récupération des images d’un utilisateur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get(':id/images')
    @ApiOperation({ summary: 'Récupérer les images associées à un utilisateur' })
    @ApiResponse({ status: 200, description: 'Images de l’utilisateur récupérées avec succès.' })
    async getUserImages(@Param('id') id: string) {
        return this.userService.getUserImages(id);
    }
}
