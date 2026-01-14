import {Controller,Post,Get,Patch,Delete,Body,Param, Query,Req,BadRequestException, UseGuards,ParseIntPipe,DefaultValuePipe} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth,ApiParam } from '@nestjs/swagger';
import { CreateAppointmentAnnonceDto, UpdateAppointmentAnnonceDto, UpdateAppointmentAnnonceStatusDto,RatingAppointmentAnnonceDto,CheckAvailabilityDto, FilterAppointmentAnnonceDto} from 'src/common/dto/request/appointment-annonce.dto';
import { ParamsDto } from 'src/common/dto/request/params.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AppointmentStatus } from '@prisma/client';
import { Request } from 'express';
import { AppointmentAnnonceService } from './appointment-annonce.service';

@ApiBearerAuth('access-token')
@ApiTags('Appointments Annonces API')
@Controller('appointment-annonces')
export class AppointmentAnnonceController {
    constructor(private readonly appointmentAnnonceService: AppointmentAnnonceService) { }

    /** --------------------- 📌 Créer un rendez-vous annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un rendez-vous/une demande de réservation pour une annonce',  description: 'Crée une demande de rendez-vous ou de réservation pour une annonce. Si des dates sont fournies, vérifie la disponibilité.' })
    @ApiResponse({  status: 201,  description: 'Demande de rendez-vous/réservation créée avec succès.' })
    @ApiResponse({ status: 400, description: 'Dates non disponibles ou données invalides.' })
    async create(@Body() dto: CreateAppointmentAnnonceDto, @Req() req: Request) {  
        const user = req.user as any;
        return this.appointmentAnnonceService.create(dto, user.id);
    }

    /** --------------------- 🔄 Mettre à jour un rendez-vous annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Modifier un rendez-vous annonce', description: 'Met à jour les informations d\'un rendez-vous/réservation. Le client peut modifier avant confirmation.'})
    @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
    @ApiBody({ type: UpdateAppointmentAnnonceDto })
    @ApiResponse({ status: 200,description: 'Rendez-vous mis à jour avec succès.' })
    async update(  @Param('id') id: string,   @Body() dto: UpdateAppointmentAnnonceDto,    @Req() req: Request ) {
        const user = req.user as any;
        return this.appointmentAnnonceService.update(id, dto, user.id);
    }

    /** --------------------- 🔁 Mettre à jour le statut d\'un rendez-vous annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    @ApiOperation({  summary: 'Mettre à jour le statut d\'un rendez-vous annonce',description: 'Change le statut d\'une réservation (confirmation, annulation, etc.)'})
    @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
    @ApiBody({ type: UpdateAppointmentAnnonceStatusDto })
    @ApiResponse({  status: 200,  description: 'Statut mis à jour avec succès.' })
    async updateStatus(  @Param('id') id: string,   @Body() body: UpdateAppointmentAnnonceStatusDto, @Req() req: Request ) {
        const { status, priceCents } = body;
        if (!status) {
            throw new BadRequestException('Le statut est requis');
        }
        const user = req.user as any;
        return this.appointmentAnnonceService.updateStatus(id, status, user.id, priceCents);
    }

    /** --------------------- ⭐ Ajouter un rating à un rendez-vous annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/rating')
    @ApiOperation({  summary: 'Ajouter une note et un commentaire à un rendez-vous annonce', description: 'Le client peut noter une réservation terminée. Note de 1 à 5.'})
    @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
    @ApiBody({ type: RatingAppointmentAnnonceDto })
    @ApiResponse({  status: 200,  description: 'Note ajoutée avec succès.' })
    async addRatingOfAppointment( @Param('id') id: string,  @Body() body: RatingAppointmentAnnonceDto, @Req() req: Request) {
        const { rating, comment } = body;
        if (!rating) {
            throw new BadRequestException('La note est requise');
        }
        if (rating < 1 || rating > 5) {
            throw new BadRequestException('La note doit être entre 1 et 5');
        }
        const user = req.user as any;
        return this.appointmentAnnonceService.addRatingOfAppointment( id, rating,  comment ?? '', user.id);
    }

    /** --------------------- 🔍 Récupérer un rendez-vous annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Obtenir les détails d\'un rendez-vous annonce',  description: 'Récupère les informations détaillées d\'une réservation'})
    @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
    async findOne(@Param('id') id: string) {
        return this.appointmentAnnonceService.findOne(id);
    }

    /** --------------------- 📋 Tous les rendez-vous annonces (admin) --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Liste paginée de tous les rendez-vous annonces (admin)',  description: 'Retourne toutes les réservations liées à des annonces' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async paginate(@Query() params: ParamsDto) {
        return this.appointmentAnnonceService.paginate(params);
    }

    /** --------------------- 👤 Rendez-vous annonces de l\'utilisateur connecté --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('listes/user')
    @ApiOperation({ summary: 'Lister les rendez-vous annonces de l\'utilisateur connecté (paginé)',  description: 'Pour les clients: leurs réservations. Pour les prestataires: réservations de leurs annonces.' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async getUserAppointmentAnnonces( @Req() req: Request,@Query() params: ParamsDto  ) {
        const user = req.user as any;
        return this.appointmentAnnonceService.paginateForUser(user.id, params);
    }

    /** --------------------- 📅 Récupérer les rendez-vous annonces du calendrier --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('all/calendar')
    @ApiOperation({ summary: 'Récupérer les rendez-vous annonces du calendrier',  description: 'Récupère les réservations pour affichage calendrier'})
    @ApiQuery({ name: 'year', required: false, type: Number, example: 2025 })
    @ApiQuery({ name: 'month', required: false, type: Number, example: 0 })
    async getCalendarData(@Req() req: Request,   @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year?: number,  @Query('month', new DefaultValuePipe(new Date().getMonth()), ParseIntPipe) month?: number ) {
        const user = req.user as any;
        return this.appointmentAnnonceService.getCalendarData(user.id, year, month);
    }

    /** --------------------- 📅 Récupérer les rendez-vous annonces du calendrier par annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('annonce/:annonceId/calendar')
    @ApiOperation({ summary: 'Récupérer les rendez-vous annonces du calendrier pour une annonce spécifique',   description: 'Récupère les réservations d\'une annonce spécifique pour affichage calendrier'})
    @ApiParam({ name: 'annonceId', description: 'ID de l\'annonce' })
    @ApiQuery({ name: 'year', required: false, type: Number, example: 2025 })
    @ApiQuery({ name: 'month', required: false, type: Number, example: 0 })
    async getCalendarDataForAnnonce(
        @Param('annonceId') annonceId: string,
        @Req() req: Request,
        @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year?: number,
        @Query('month', new DefaultValuePipe(new Date().getMonth()), ParseIntPipe) month?: number
    ) {
        const user = req.user as any;
        return this.appointmentAnnonceService.getCalendarData2(user.id, year, month, annonceId);
    }

    /** --------------------- ✅ Vérifier la disponibilité d\'une annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Post('check-availability')
    @ApiOperation({ summary: 'Vérifier la disponibilité d\'une annonce pour des dates données',  description: 'Vérifie si une annonce est disponible pour les dates spécifiées' })
    @ApiBody({ type: CheckAvailabilityDto })
    @ApiResponse({ status: 200, description: 'Disponibilité vérifiée avec succès.' })
    async checkAvailability(@Body() dto: CheckAvailabilityDto) {
        const entryDate = new Date(dto.entryDate);
        const departureDate = new Date(dto.departureDate);
        
        if (departureDate <= entryDate) {
            throw new BadRequestException('La date de départ doit être après la date d\'arrivée');
        }
        
        return this.appointmentAnnonceService.checkAvailability(
            dto.annonceId,
            entryDate,
            departureDate
        );
    }

    /** --------------------- 🗑️ Supprimer un rendez-vous annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un rendez-vous annonce',  description: 'Supprime une réservation (seulement si non confirmée ou non terminée)'})
    @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
    async remove(@Param('id') id: string, @Req() req: Request) {
        const user = req.user as any;
        return this.appointmentAnnonceService.remove(id, user.id);
    }

    /** --------------------- 🔍 Filtrer les rendez-vous annonces --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('filter')
    @ApiOperation({ summary: 'Filtrer les rendez-vous annonces', description: 'Filtre les réservations selon différents critères'})
    @ApiQuery({ name: 'annonceId', required: false })
    @ApiQuery({ name: 'clientId', required: false })
    @ApiQuery({ name: 'providerId', required: false })
    @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'interventionType', required: false })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async filter( @Query() filters: FilterAppointmentAnnonceDto,  @Query() params: ParamsDto
    ) {
        // Note: Vous devrez ajouter une méthode de filtrage dans le service
        // return this.appointmentAnnonceService.filter(filters, params);
        throw new BadRequestException('Fonctionnalité de filtrage à implémenter');
    }

    /** --------------------- 📊 Statistiques des rendez-vous annonces --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('stats/user')
    @ApiOperation({summary: 'Obtenir les statistiques des rendez-vous annonces de l\'utilisateur',  description: 'Retourne les statistiques (nombre total, confirmés, annulés, etc.)' })
    async getUserStats(@Req() req: Request) {
        const user = req.user as any;
        // Note: Vous devrez ajouter une méthode getStats dans le service
        // return this.appointmentAnnonceService.getStats(user.id);
        throw new BadRequestException('Fonctionnalité de statistiques à implémenter');
    }

    /** --------------------- 📊 Statistiques par annonce --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('annonce/:annonceId/stats')
    @ApiOperation({  summary: 'Obtenir les statistiques des rendez-vous pour une annonce',   description: 'Retourne les statistiques d\'une annonce spécifique'
    })
    @ApiParam({ name: 'annonceId', description: 'ID de l\'annonce' })
    async getAnnonceStats(@Param('annonceId') annonceId: string, @Req() req: Request) {
        const user = req.user as any;
        // Note: Vous devrez ajouter une méthode getAnnonceStats dans le service
        // return this.appointmentAnnonceService.getAnnonceStats(annonceId, user.id);
        throw new BadRequestException('Fonctionnalité de statistiques par annonce à implémenter');
    }
}