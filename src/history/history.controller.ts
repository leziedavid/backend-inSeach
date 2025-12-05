import {Controller,Get,Query,Req,UseGuards,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { HistoryService, HistoryType } from './history.service';

@ApiTags('History Api')
@ApiBearerAuth('access-token')
@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) { }

    /** -------------------
     * USER: Overview Stats
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Get('overview')
    @ApiOperation({ summary: 'Récupérer les statistiques de l’historique de l’utilisateur connecté' })
    @ApiQuery({ name: 'type', required: false, enum: HistoryType })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès.' })
    async getOverview(@Req() req: Request, @Query('type') type?: HistoryType) {
        const user = req.user as any;
        return this.historyService.getOverviewStats(user.id, type);
    }

    /** -------------------
     * USER: Paginated History
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Récupérer l’historique paginé de l’utilisateur connecté' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'type', required: false, enum: HistoryType })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Historique récupéré avec succès.' })
    async getMyHistory(@Req() req: Request, @Query() query: any) {
        const user = req.user as any;
        query.providerId = user.id; // for user-specific
        return this.historyService.getAllPaginated(query);
    }

    /** -------------------
     * ADMIN: Paginated History
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Get('admin')
    @ApiOperation({ summary: 'Récupérer l’historique paginé de tous les utilisateurs (admin)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'type', required: false, enum: HistoryType })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'providerId', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Historique récupéré avec succès.' })
    async getAllHistory(@Query() query: any) {
        // ici on peut ajouter un guard admin si besoin
        return this.historyService.getAllPaginated(query);
    }
}
