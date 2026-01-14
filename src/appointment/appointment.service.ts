import { Injectable, ForbiddenException, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from 'src/common/dto/request/appointment.dto';
import { AppointmentStatus, TransactionStatus } from '@prisma/client';
import { BaseResponse } from 'src/utils/base-response';
import { FunctionService } from 'src/utils/pagination.service';
import { ParamsDto } from 'src/common/dto/request/params.dto';

@Injectable()
export class AppointmentService {

    constructor(private prisma: PrismaService, private functionService: FunctionService,) { }

    /* ----------------------
     * CREATE APPOINTMENT
     * ----------------------*/
    async create(dto: CreateAppointmentDto, userId: string) {
        const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
        if (!service) throw new NotFoundException('Service introuvable');

        const appointment = await this.prisma.appointment.create({
            data: {
                service: { connect: { id: dto.serviceId } },
                provider: { connect: { id: service.providerId } },
                client: { connect: { id: userId } },
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
                time: dto.time ?? undefined,
                durationMins: dto.durationMins ?? undefined,
                priceCents: dto.priceCents ?? undefined,
                providerNotes: dto.providerNotes ?? undefined,
                status: AppointmentStatus.REQUESTED,
                interventionType: dto.interventionType ?? undefined,
            },
        });
        return new BaseResponse(201, 'Rendez-vous créé', appointment);
    }

    /* ----------------------
     * UPDATE APPOINTMENT
     * ----------------------*/
    async update(id: string, dto: UpdateAppointmentDto) {
        const appointment = await this.prisma.appointment.findUnique({ where: { id } });
        if (!appointment) throw new NotFoundException('Rendez-vous introuvable');

        const updateData: any = {};
        if (dto.scheduledAt !== undefined) updateData.scheduledAt = new Date(dto.scheduledAt);
        if (dto.time !== undefined) updateData.time = dto.time;
        if (dto.durationMins !== undefined) updateData.durationMins = dto.durationMins;
        if (dto.priceCents !== undefined) updateData.priceCents = dto.priceCents;
        if (dto.providerNotes !== undefined) updateData.providerNotes = dto.providerNotes;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.interventionType !== undefined) updateData.interventionType = dto.interventionType;

        if (dto.serviceId) {
            const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
            if (!service) throw new NotFoundException('Service introuvable pour mise à jour');
            updateData.service = { connect: { id: dto.serviceId } };
            updateData.provider = { connect: { id: service.providerId } };
        }

        const updatedAppointment = await this.prisma.appointment.update({
            where: { id },
            data: updateData,
        });

        return new BaseResponse(200, 'Rendez-vous mis à jour', updatedAppointment);
    }

    /* ----------------------
     * UPDATE STATUS SECURE
     * ----------------------*/


    async updateStatus(id: string, status: AppointmentStatus, userId: string, priceCents?: number) {

        console.log("🔁 Mettre à jour le statut du rendez-vous :", id, status, userId, priceCents);

        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: {
                service: true,
                provider: {
                    include: { wallet: true }
                }
            },
        });

        if (!appointment) {
            throw new NotFoundException('Rendez-vous introuvable');
        }

        const isClient = appointment.clientId === userId;
        const isProvider = appointment.service?.providerId === userId;

        if (!isClient && !isProvider) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation de changer le statut de ce rendez-vous.");
        }

        // 💰 Construction dynamique des données à mettre à jour
        const updateData: any = { status };

        if (priceCents !== undefined) {
            updateData.priceCents = priceCents;
        }

        const updated = await this.prisma.appointment.update({
            where: { id },
            data: updateData,
        });

        // 3️⃣ Si terminé → créer la transaction
        if (status === AppointmentStatus.COMPLETED) {

            console.log("💰 Création automatique d'une transaction pour le provider...");

            // Vérification de la présence du wallet provider
            if (!appointment.provider?.wallet) {
                throw new NotFoundException("Le prestataire n’a pas encore de wallet.");
            }

            const providerWallet = appointment.provider.wallet;
            const totalAmount = priceCents ?? appointment.priceCents;

            if (!totalAmount) {
                throw new BadRequestException("Un prix doit être défini pour compléter ce rendez-vous.");
            }

            // 4️⃣ Création de la transaction
            const transaction = await this.prisma.transaction.create({
                data: {
                    userId: appointment.providerId,         // 🧍 Prestataire
                    walletId: providerWallet.id,            // 💼 Wallet du prestataire
                    amountCents: totalAmount,               // 💰 Montant
                    currency: "FCFA",
                    status: TransactionStatus.COMPLETED,    // Le prestataire reçoit la somme
                    description: {
                        type: "APPOINTMENT_COMPLETED",
                        appointmentId: appointment.id
                    }
                }
            });

            // 5️⃣ Mise à jour du RDV → associer transactionId
            await this.prisma.appointment.update({
                where: { id },
                data: { transactionId: transaction.id }
            });

            console.log("✅ Transaction créée et liée au rendez-vous :", transaction.id);
        }

        return new BaseResponse(200, 'Statut du rendez-vous mis à jour', updated);
    }

    addRatingOfAppointment = async (id: string, rating: number, comment: string, userId: string,) => {

        // 1️⃣ Vérifier que le rendez-vous existe
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: { service: true },
        });

        if (!appointment) {
            throw new NotFoundException('Rendez-vous introuvable');
        }

        // 2️⃣ Vérifier que l’utilisateur est autorisé
        const isClient = appointment.clientId === userId;
        const isProvider = appointment.service?.providerId === userId;

        if (!isClient && !isProvider) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation de noter ce rendez-vous.");
        }

        // 3️⃣ Vérifier si une note existe déjà (relation 1–1)
        const existingRating = await this.prisma.rating.findUnique({
            where: { appointmentId: id },
        });

        let result;

        if (!existingRating) {
            // 4️⃣ Création d'une nouvelle note
            result = await this.prisma.rating.create({
                data: { appointmentId: id, clientId: userId, rating, comment, },
            });
        } else {
            // 5️⃣ Mise à jour de la note existante
            result = await this.prisma.rating.update({
                where: { appointmentId: id },
                data: { rating, comment, },
            });
        }

        return new BaseResponse(200, 'Note du rendez-vous mise à jour', result,);
    };

    /* ----------------------
     * GET ONE 31da94c4-f1c7-4aed-9bd9-6d44aa2ced1b
    UPDATE public."Appointment"
    SET "status" = 'REQUESTED',  "updatedAt" = NOW()
    WHERE "id" = '31da94c4-f1c7-4aed-9bd9-6d44aa2ced1b';
     * ----------------------*/

    async findOne(id: string) {

        const appointment = await this.prisma.appointment.findUnique({ where: { id }, include: { service: true, provider: true, client: true }, });
        if (!appointment) throw new NotFoundException('Rendez-vous introuvable');
        return new BaseResponse(200, 'Rendez-vous récupéré', appointment);

    }

    /* ----------------------
     * PAGINATION SIMPLE
     * ----------------------*/
    async paginate(params: ParamsDto) {
        try {
            const pagination = await this.functionService.paginate({
                model: 'Appointment',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: { service: true, provider: true, client: true, rating: true },
                },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Rendez-vous paginés', pagination);
        } catch (error) {
            console.error('[Appointment.paginate] ❌', error);
            throw new InternalServerErrorException('Erreur pagination rendez-vous');
        }
    }

    /* ----------------------
     * PAGINATION POUR UN UTILISATEUR
     * ----------------------*/


    async paginateForUser(userId: string, params: ParamsDto) {
        try {

            // 1️⃣ Récupérer l'utilisateur et son rôle
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new NotFoundException('Utilisateur introuvable');

            const userRole = user.roles; // peut être 'CLIENT' ou 'PROVIDER'

            // 2️⃣ Construire les conditions selon le rôle
            let where: any = {};

            // 2️⃣ Construire les conditions selon le rôle
            let conditions: any = {};
            if (userRole === 'CLIENT') {
                conditions = { clientId: userId,  serviceId: { not: null }, };

            } else if (userRole === 'PROVIDER') {
                // Important : on filtre par providerId dans la relation service, mais on ne fait pas d'include direct sur service pour la condition
                const services = await this.prisma.service.findMany({ where: { providerId: userId }, select: { id: true }, });
                const serviceIds = services.map(s => s.id);
                conditions = {  serviceId: { in: serviceIds, not: null, },  };
            } else {
                throw new ForbiddenException('Rôle non autorisé pour cette opération');
            }
            // 3️⃣ Pagination
            const pagination = await this.functionService.paginate({
                model: 'Appointment',
                page: params.page,
                limit: params.limit,
                selectAndInclude: { select: null, include: { service: true, provider: true, client: true, rating: true }, },
                conditions,
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Rendez-vous utilisateur paginés', pagination);
        } catch (error) {
            console.error('[Appointment.paginateForUser] ❌', error);
            throw new InternalServerErrorException('Erreur pagination rendez-vous utilisateur');
        }
    }


    /* ----------------------
     * DELETE
     * ----------------------*/
    async remove(id: string) {
        const appointment = await this.prisma.appointment.findUnique({ where: { id } });
        if (!appointment) throw new NotFoundException('Rendez-vous introuvable');

        await this.prisma.appointment.delete({ where: { id } });
        return new BaseResponse(200, 'Rendez-vous supprimé', appointment);
    }

    /* ----------------------
     * GET APPOINTMENTS FOR CALENDAR
     * ----------------------*/
    async getCalendarData(userId: string, year?: number, month?: number) {
        try {
            // 1️⃣ Récupérer l'utilisateur et son rôle
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new NotFoundException('Utilisateur introuvable');
            }

            const userRole = user.roles; // CLIENT | PROVIDER

            // 2️⃣ Déterminer la période
            const currentDate = new Date();
            const targetYear = year ?? currentDate.getFullYear();
            const targetMonth = month ?? currentDate.getMonth(); // 0-indexed

            const startDate = new Date(targetYear, targetMonth, 1);
            const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

            // 3️⃣ Construire le filtre dynamique selon le rôle
            let roleConditions: any = {};

            if (userRole === 'CLIENT') {
                roleConditions = {
                    clientId: userId,
                    serviceId: { not: null },
                };
            }

            else if (userRole === 'PROVIDER') {
                const services = await this.prisma.service.findMany({
                    where: { providerId: userId },
                    select: { id: true },
                });

                const serviceIds = services.map(s => s.id);

                roleConditions = {
                    serviceId: {
                        in: serviceIds,
                        not: null,
                    },
                };
            }

            else {
                throw new ForbiddenException('Rôle non autorisé');
            }

            // 4️⃣ Requête finale
            const appointments = await this.prisma.appointment.findMany({
                where: {
                    AND: [
                        roleConditions,
                        {
                            scheduledAt: {
                                gte: startDate,
                                lte: endDate,
                            },
                        },
                    ],
                },
                include: {
                    service: true,
                    client: true,
                    provider: true,
                },
                orderBy: {
                    scheduledAt: 'asc',
                },
            });

            // 5️⃣ Transformation pour le frontend
            const transformedAppointments = appointments.map(apt => ({
                id: apt.id,
                serviceId: apt.serviceId,
                providerId: apt.providerId,
                clientId: apt.clientId,
                client: apt.client
                    ? {
                        id: apt.client.id,
                        name: apt.client.name,
                        email: apt.client.email,
                        phone: apt.client.phone,
                    }
                    : null,
                scheduledAt: apt.scheduledAt?.toISOString() ?? null,
                time: apt.time,
                durationMins: apt.durationMins,
                priceCents: apt.priceCents,
                status: apt.status,
                providerNotes: apt.providerNotes,
                service: apt.service,
                createdAt: apt.createdAt.toISOString(),
                updatedAt: apt.updatedAt.toISOString(),
            }));

            // 6️⃣ Groupement par jour
            const appointmentsByDay: Record<string, any[]> = {};

            transformedAppointments.forEach(apt => {
                if (!apt.scheduledAt) return;

                const date = new Date(apt.scheduledAt);
                const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

                appointmentsByDay[key] = appointmentsByDay[key] || [];
                appointmentsByDay[key].push(apt);
            });

            // 7️⃣ Réponse
            return new BaseResponse(200, 'Données calendrier récupérées', {
                appointments: transformedAppointments,
                appointmentsByDay,
                period: {
                    year: targetYear,
                    month: targetMonth,
                    monthName: this.getMonthName(targetMonth),
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                },
                stats: {
                    total: transformedAppointments.length,
                    confirmed: transformedAppointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
                    pending: transformedAppointments.filter(a => a.status === AppointmentStatus.REQUESTED).length,
                    cancelled: transformedAppointments.filter(
                        a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.REJECTED
                    ).length,
                    completed: transformedAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
                },
            });

        } catch (error) {
            console.error('[Appointment.getCalendarData] ❌', error);
            throw new InternalServerErrorException('Erreur récupération données calendrier');
        }
    }


    /* ----------------------
     * HELPER: GET MONTH NAME
     * ----------------------*/
    private getMonthName(monthIndex: number): string {
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return monthNames[monthIndex];
    }

}
