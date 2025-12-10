import { Controller, Post, Get, Body, Query, Req, BadRequestException, UseGuards, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { LoginByPhoneCode } from 'src/common/dto/request/loginByPhoneCode.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@ApiTags('Security API')
@Controller('security')
export class SecurityController {
    constructor(private readonly securityService: SecurityService) { }


    /** --------------------- Reverse Geocoding --------------------- */
    @Get('reverse-geocode')
    @ApiOperation({ summary: 'Récupérer l’adresse depuis des coordonnées', description: 'Retourne une adresse complète via latitude et longitude.' })
    @ApiQuery({ name: 'lat', type: 'number', required: true, description: 'Latitude' })
    @ApiQuery({ name: 'lng', type: 'number', required: true, description: 'Longitude' })
    @ApiResponse({ status: 200, description: 'Adresse récupérée avec succès.', schema: { type: 'object' } })
    async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string,): Promise<any> {
        if (!lat || !lng) throw new BadRequestException('Latitude et longitude requises');
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        return this.securityService.reverseGeocode(latitude, longitude);
    }


    /** --------------------- 🔑 Connexion par email ou téléphone --------------------- */
    @Post()
    @ApiOperation({ summary: 'Connexion via email ou téléphone', description: 'Permet à un utilisateur de se connecter via email ou téléphone et reçoit les tokens JWT (access + refresh).' })
    @ApiBody({ type: LoginByPhoneCode })
    @ApiResponse({ status: 200, description: 'Connexion réussie.' })
    async login(@Body() dto: LoginByPhoneCode) {
        if (!dto.login || !dto.password) throw new BadRequestException('Login et mot de passe requis');
        return this.securityService.loginByEmailOrPhone(dto);
    }


    // recon@nectUser

    @Post('reconnect/:id')
    @ApiOperation({ summary: 'Reconnecter un utilisateur' })
    @ApiResponse({ status: 200, description: 'Utilisateur reconnecté.' })
    async reconnectUser(@Param('id', ParseUUIDPipe) id: string) {
        return this.securityService.reconnectUser(id);
    }



    /** --------------------- 🔁 Rafraîchir un token --------------------- */
    @Post('refresh')
    @ApiOperation({ summary: 'Rafraîchir le token JWT', description: 'Génère un nouveau token access à partir d’un refresh token valide.' })
    @ApiBody({ schema: { type: 'object', properties: { token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5...' }, }, }, })
    @ApiResponse({ status: 200, description: 'Token rafraîchi avec succès.' })
    async refreshToken(@Body('token') token: string) {
        if (!token) throw new BadRequestException('Token requis');
        return this.securityService.refreshToken(token);
    }

    /** --------------------- 👤 Détails de l’utilisateur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Récupérer les informations de l’utilisateur connecté' })
    @ApiResponse({ status: 200, description: 'Informations utilisateur récupérées avec succès.' })
    async getMyInfo(@Req() req: Request) {
        const user = req.user as any;
        return this.securityService.getUsersInfo(user.id);
    }

    /** --------------------- 👥 Liste paginée des utilisateurs --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('listes/users')
    @ApiOperation({ summary: 'Lister tous les utilisateurs (paginé)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiResponse({ status: 200, description: 'Utilisateurs récupérés avec succès.' })
    async getAllUsers(@Query() params: PaginationParamsDto) {
        return this.securityService.getAllUsersPaginate(params);
    }

    /** --------------------- 🛒 Commandes de l’utilisateur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('listes/orders/user')
    @ApiOperation({ summary: 'Lister les commandes de l’utilisateur connecté (paginé)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async getUserOrders(@Req() req: Request, @Query() params: PaginationParamsDto) {
        const user = req.user as any;
        return this.securityService.getUserOrdersPaginate(user.id, params);
    }

    /** --------------------- 🏬 Commandes d’un vendeur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('listes/orders/provider')
    @ApiOperation({ summary: 'Lister les commandes du vendeur connecté (paginé)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async getProviderOrders(@Req() req: Request, @Query() params: PaginationParamsDto) {
        const user = req.user as any;
        return this.securityService.getProviderOrdersPaginate(user.id, params);
    }

    /** --------------------- 📅 Rendez-vous de l’utilisateur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('listes/appointments/user')
    @ApiOperation({ summary: 'Lister les rendez-vous de l’utilisateur connecté (paginé)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async getUserAppointments(@Req() req: Request, @Query() params: PaginationParamsDto) {
        const user = req.user as any;
        return this.securityService.getUserAppointmentsPaginate(user.id, params);
    }

    /** --------------------- 📅 Rendez-vous d’un vendeur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('listes/appointments/provider')
    @ApiOperation({ summary: 'Lister les rendez-vous du vendeur connecté (paginé)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async getProviderAppointments(@Req() req: Request, @Query() params: PaginationParamsDto) {
        const user = req.user as any;
        return this.securityService.getProviderAppointmentsPaginate(user.id, params);
    }
}
