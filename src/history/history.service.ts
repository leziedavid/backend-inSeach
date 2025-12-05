import {
    Injectable,
    BadRequestException,
    NotFoundException,
    InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

export enum HistoryType {
    ORDERS = 'ORDERS',
    APPOINTMENTS = 'APPOINTMENTS',
}

export interface OverviewStats {
    totalOrders: number;
    totalRevenue: number;
    totalAppointments: number;
}

@Injectable()
export class HistoryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService
    ) { }

    /**
     * 📊 Récupère les statistiques globales d’un utilisateur
     */
    async getOverviewStats(userId: string, type?: HistoryType): Promise<BaseResponse<OverviewStats>> {
        try {
            let totalOrders = 0;
            let totalAppointments = 0;
            let totalRevenue = 0;

            /** -------------------- 🛒 ORDERS ---------------------- */
            if (!type || type === HistoryType.ORDERS) {
                const orders = await this.prisma.order.findMany({
                    where: { providerId: userId },
                    include: { transaction: true },
                });
                totalOrders = orders.length;
                totalRevenue += orders
                    .filter(o => o.transaction?.status === 'COMPLETED')
                    .reduce((acc, o) => acc + (o.transaction?.amountCents ?? 0), 0);
            }

            /** -------------------- 📅 APPOINTMENTS ---------------------- */
            if (!type || type === HistoryType.APPOINTMENTS) {
                const appointments = await this.prisma.appointment.findMany({
                    where: { providerId: userId },
                    include: { transaction: true },
                });
                totalAppointments = appointments.length;
                totalRevenue += appointments
                    .filter(a => a.transaction?.status === 'COMPLETED')
                    .reduce((acc, a) => acc + (a.transaction?.amountCents ?? 0), 0);
            }

            return new BaseResponse(200, 'Statistiques récupérées', {
                totalOrders,
                totalRevenue,
                totalAppointments,
            });
        } catch (error) {
            console.error('[HistoryService.getOverviewStats] ❌', error);
            throw new InternalServerErrorException('Erreur récupération statistiques');
        }
    }

    /**
     * 👑 Récupère l’historique paginé (ADMIN ou USER)
     * - Filtre par type, providerId, status
     * - type peut être vide → retourne tout
     */
    async getAllPaginated(query: any) {
        try {

            const { page = 1, limit = 10, type, providerId,  status, } = query;
            // Conditions de base
            const conditions: any = {};

            // Filtre type uniquement si fourni
            if (type === HistoryType.ORDERS) {
                conditions.orderId = { not: null }; // Filtre sur orders
            } else if (type === HistoryType.APPOINTMENTS) {
                conditions.appointmentId = { not: null }; // Filtre sur appointments
            }

            if (providerId) conditions.providerId = providerId;
            if (status) conditions.status = status;

            const paginateOptions: PaginateOptions = {
                model: 'Transaction', // On pagine les transactions
                page: Number(page),
                limit: Number(limit),
                conditions,
                selectAndInclude: {
                    select: null,
                    include: { order: { include: { client: true, provider: true } },
                        appointment: { include: { client: true, provider: true } },
                        wallet: true,
                        user: true,
                    },
                },
                orderBy: { createdAt: 'desc' },
            };

            const data = await this.functionService.paginate(paginateOptions);

            return new BaseResponse(200, 'Historique paginé récupéré', data);

        } catch (error) {
            console.error('[HistoryService.getAllPaginated] ❌', error);
            throw new InternalServerErrorException('Erreur récupération historique');
        }
    }
}
