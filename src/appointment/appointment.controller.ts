import { Controller, Post, Get, Patch, Delete, Body, Param, Query, Req, BadRequestException, UseGuards, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAppointmentDto, UpdateAppointmentDto } from 'src/common/dto/request/appointment.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AppointmentStatus } from '@prisma/client';
import { Request } from 'express';
import { AppointmentService } from './appointment.service';
import { ParamsDto } from 'src/common/dto/request/params.dto';

@ApiBearerAuth('access-token')
@ApiTags('Appointments API')
@Controller('appointments')
export class AppointmentController {
    constructor(private readonly appointmentsService: AppointmentService) { }

    /** --------------------- 📌 Créer un rendez-vous --------------------- */
    /** --------------------- 📌 Créer un rendez-vous --------------------- */
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un rendez-vous' })
    @ApiResponse({ status: 201, description: 'Rendez-vous créé avec succès.' })
    async create(@Body() dto: CreateAppointmentDto, @Req() req: Request) {
        const user = req.user as any;
        // Log utile pour debug (à garder si besoin)
        console.log("📥 Reçu BODY JSON =", req.body);
        console.log("📘 DTO Après Validation =", dto);
        return this.appointmentsService.create(dto, user.id);
    }


    /** --------------------- 🔄 Mettre à jour un rendez-vous --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Modifier un rendez-vous' })
    @ApiBody({ type: UpdateAppointmentDto })
    async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
        return this.appointmentsService.update(id, dto);
    }

    /** --------------------- 🔁 Mettre à jour un statut --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    @ApiOperation({ summary: 'Mettre à jour le statut d’un rendez-vous' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { status: { type: 'string', enum: Object.values(AppointmentStatus), }, priceCents: { type: 'number', nullable: true, example: 1500, }, },
            required: ['status'],
        },
    })

    @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès.' })
    async updateStatus(@Param('id') id: string, @Body() body: { status: AppointmentStatus; priceCents?: number | null }, @Req() req: Request) {
        const { status, priceCents } = body;
        if (!status) {
            throw new BadRequestException('Le statut est requis');
        }
        const user = req.user as any;
        return this.appointmentsService.updateStatus(id, status, user.id, priceCents
        );
    }

    /** --------------------- ⭐ Ajouter un rating à un rendez-vous --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/rating')
    @ApiOperation({ summary: 'Ajouter une note et un commentaire à un rendez-vous' })
    @ApiBody({ schema: { type: 'object', properties: { rating: { type: 'number', example: 5 }, comment: { type: 'string', example: 'Très bon service', nullable: true }, }, required: ['rating'], }, })
    @ApiResponse({ status: 200, description: 'Rating ajouté avec succès.' })
    async addRatingOfAppointment(@Param('id') id: string, @Body() body: { rating: number; comment?: string }, @Req() req: Request,) {
        const { rating, comment } = body;
        if (!rating) {
            throw new BadRequestException('Le rating est requis');
        }
        const user = req.user as any;
        return this.appointmentsService.addRatingOfAppointment(id, rating, comment ?? null, user.id,);
    }

    /** --------------------- 🔍 Récupérer un rendez-vous --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Obtenir les détails d’un rendez-vous' })
    async findOne(@Param('id') id: string) {
        return this.appointmentsService.findOne(id);
    }

    /** --------------------- 📋 Tous les rendez-vous (admin) --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Liste paginée de tous les rendez-vous (admin)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async paginate(@Query() params: ParamsDto) {
        return this.appointmentsService.paginate(params);
    }

    /** --------------------- 👤 Rendez-vous de l’utilisateur connecté --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('listes/user')
    @ApiOperation({ summary: 'Lister les rendez-vous de l’utilisateur connecté (paginé)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async getUserAppointments(@Req() req: Request, @Query() params: ParamsDto) {
        const user = req.user as any;
        return this.appointmentsService.paginateForUser(user.id, params);
    }

    /** --------------------- ❌ Supprimer un rendez-vous --------------------- */
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un rendez-vous' })
    async remove(@Param('id') id: string) {
        return this.appointmentsService.remove(id);
    }

    /** --------------------- 📅 Récupérer les rendez-vous du calendrier --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('all/calendar')
    @ApiOperation({ summary: 'Récupérer les rendez-vous du calendrier' })
    @ApiQuery({ name: 'year', required: false, example: 2025 })
    @ApiQuery({ name: 'month', required: false, example: 1 })
    async getCalendarData(@Req() req: Request, @Query('year') year?: number, @Query('month') month?: number,) {
        const user = req.user as any;
        return this.appointmentsService.getCalendarData(user.id, year, month);
    }

}
