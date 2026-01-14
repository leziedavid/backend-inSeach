import { Injectable, ForbiddenException, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppointmentStatus, TransactionStatus } from '@prisma/client';
import { BaseResponse } from 'src/utils/base-response';
import { FunctionService } from 'src/utils/pagination.service';
import { ParamsDto } from 'src/common/dto/request/params.dto';
import { CreateAppointmentAnnonceDto, UpdateAppointmentAnnonceDto } from 'src/common/dto/request/appointment-annonce.dto';
import { getPublicFileUrl } from 'src/utils/helper';

@Injectable()
export class AppointmentAnnonceService {

    constructor(private prisma: PrismaService, private functionService: FunctionService,) { }

    /* ----------------------
     * CREATE APPOINTMENT ANNONCE
     * ----------------------*/
    async create(dto: CreateAppointmentAnnonceDto, userId: string) {
        // Vérifier que l'annonce existe
        const annonce = await this.prisma.annonce.findUnique({
            where: { id: dto.annonceId }
        });

        if (!annonce) {
            throw new NotFoundException('Annonce introuvable');
        }

        // Vérifier que l'utilisateur n'est pas le propriétaire de l'annonce
        if (annonce.providerId === userId) {
            throw new ForbiddenException('Vous ne pouvez pas créer un rendez-vous pour votre propre annonce');
        }

        // Vérifier la disponibilité des dates si fournies
        if (dto.entryDate && dto.departureDate) {
            const entryDate = new Date(dto.entryDate);
            const departureDate = new Date(dto.departureDate);

            if (departureDate <= entryDate) {
                throw new BadRequestException('La date de départ doit être après la date d\'arrivée');
            }

            // Calculer le nombre de nuits
            const diffTime = Math.abs(departureDate.getTime() - entryDate.getTime());
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Vérifier les conflits de réservation
            const conflictingAppointments = await this.prisma.appointment.findMany({
                where: {
                    annonceId: dto.annonceId,
                    status: {
                        in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED]
                    },
                    OR: [
                        {
                            entryDate: {
                                lte: departureDate
                            },
                            departureDate: {
                                gte: entryDate
                            }
                        }
                    ]
                }
            });

            if (conflictingAppointments.length > 0) {
                throw new BadRequestException('Les dates sélectionnées ne sont pas disponibles');
            }

            // Créer le rendez-vous avec les dates
            const appointment = await this.prisma.appointment.create({
                data: {
                    annonce: { connect: { id: dto.annonceId } },
                    provider: { connect: { id: annonce.providerId } },
                    client: { connect: { id: userId } },
                    scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
                    time: dto.time ?? undefined,
                    durationMins: dto.durationMins ?? undefined,
                    priceCents: dto.priceCents ?? undefined,
                    providerNotes: dto.providerNotes ?? undefined,
                    status: AppointmentStatus.REQUESTED,
                    interventionType: dto.interventionType ?? undefined,
                    entryDate: new Date(dto.entryDate),
                    departureDate: new Date(dto.departureDate),
                    nights: nights,
                },
            });

            return new BaseResponse(201, 'Demande de réservation créée', appointment);
        }

        // Créer le rendez-vous sans dates (simple consultation)
        const appointment = await this.prisma.appointment.create({
            data: {
                annonce: { connect: { id: dto.annonceId } },
                provider: { connect: { id: annonce.providerId } },
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

        return new BaseResponse(201, 'Demande de rendez-vous créée', appointment);
    }

    /* ----------------------
     * UPDATE APPOINTMENT ANNONCE
     * ----------------------*/
    async update(id: string, dto: UpdateAppointmentAnnonceDto, userId: string) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: { annonce: true }
        });

        if (!appointment) {
            throw new NotFoundException('Rendez-vous introuvable');
        }

        // Vérifier les autorisations
        const isClient = appointment.clientId === userId;
        const isProvider = appointment.annonce?.providerId === userId;

        if (!isClient && !isProvider) {
            throw new ForbiddenException('Vous n\'avez pas l\'autorisation de modifier ce rendez-vous');
        }

        // Seul le client peut modifier certains champs avant confirmation
        if (!isClient && appointment.status === AppointmentStatus.REQUESTED) {
            throw new ForbiddenException('Seul le client peut modifier cette demande avant confirmation');
        }

        const updateData: any = {};

        if (dto.scheduledAt !== undefined) updateData.scheduledAt = new Date(dto.scheduledAt);
        if (dto.time !== undefined) updateData.time = dto.time;
        if (dto.durationMins !== undefined) updateData.durationMins = dto.durationMins;
        if (dto.priceCents !== undefined) updateData.priceCents = dto.priceCents;
        if (dto.providerNotes !== undefined) updateData.providerNotes = dto.providerNotes;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.interventionType !== undefined) updateData.interventionType = dto.interventionType;

        // Gestion des dates de réservation
        if (dto.entryDate && dto.departureDate) {
            const entryDate = new Date(dto.entryDate);
            const departureDate = new Date(dto.departureDate);

            if (departureDate <= entryDate) {
                throw new BadRequestException('La date de départ doit être après la date d\'arrivée');
            }

            const diffTime = Math.abs(departureDate.getTime() - entryDate.getTime());
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Vérifier les conflits (exclure le rendez-vous actuel)
            const conflictingAppointments = await this.prisma.appointment.findMany({
                where: {
                    annonceId: appointment.annonceId,
                    id: { not: id },
                    status: {
                        in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED]
                    },
                    OR: [
                        {
                            entryDate: {
                                lte: departureDate
                            },
                            departureDate: {
                                gte: entryDate
                            }
                        }
                    ]
                }
            });

            if (conflictingAppointments.length > 0) {
                throw new BadRequestException('Les nouvelles dates ne sont pas disponibles');
            }

            updateData.entryDate = entryDate;
            updateData.departureDate = departureDate;
            updateData.nights = nights;
        }

        if (dto.annonceId && dto.annonceId !== appointment.annonceId) {
            const annonce = await this.prisma.annonce.findUnique({
                where: { id: dto.annonceId }
            });

            if (!annonce) {
                throw new NotFoundException('Nouvelle annonce introuvable');
            }

            updateData.annonce = { connect: { id: dto.annonceId } };
            updateData.provider = { connect: { id: annonce.providerId } };
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
        console.log("🔁 Mettre à jour le statut du rendez-vous annonce :", id, status, userId, priceCents);

        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: {
                annonce: true,
                provider: {
                    include: { wallet: true }
                }
            },
        });

        if (!appointment) {
            throw new NotFoundException('Rendez-vous introuvable');
        }

        const isClient = appointment.clientId === userId;
        const isProvider = appointment.annonce?.providerId === userId;

        if (!isClient && !isProvider) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation de changer le statut de ce rendez-vous.");
        }

        // Logique de validation des statuts
        if (status === AppointmentStatus.CONFIRMED && !isProvider) {
            throw new ForbiddenException("Seul le propriétaire de l'annonce peut confirmer une réservation");
        }

        if (status === AppointmentStatus.CANCELLED) {
            // Le client peut annuler avant confirmation, le propriétaire peut annuler à tout moment
            if (isClient && appointment.status !== AppointmentStatus.REQUESTED) {
                throw new ForbiddenException("Vous ne pouvez annuler qu'une demande non confirmée");
            }
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
                throw new NotFoundException("Le propriétaire n'a pas encore de wallet.");
            }

            const providerWallet = appointment.provider.wallet;
            const totalAmount = priceCents ?? appointment.priceCents;

            if (!totalAmount) {
                throw new BadRequestException("Un prix doit être défini pour compléter cette réservation.");
            }

            // Calculer le montant total si c'est une réservation avec nuits
            let finalAmount = totalAmount;
            if (appointment.nights && appointment.nights > 0) {
                finalAmount = totalAmount * appointment.nights;
            }

            // 4️⃣ Création de la transaction
            const transaction = await this.prisma.transaction.create({
                data: {
                    userId: appointment.providerId,
                    walletId: providerWallet.id,
                    amountCents: finalAmount,
                    currency: "FCFA",
                    status: TransactionStatus.COMPLETED,
                    description: {
                        type: "ANNONCE_APPOINTMENT_COMPLETED",
                        appointmentId: appointment.id,
                        annonceId: appointment.annonceId,
                        nights: appointment.nights
                    }
                }
            });

            // 5️⃣ Mise à jour du RDV → associer transactionId
            await this.prisma.appointment.update({
                where: { id },
                data: { transactionId: transaction.id }
            });

            console.log("✅ Transaction créée et liée au rendez-vous annonce :", transaction.id);
        }

        return new BaseResponse(200, 'Statut du rendez-vous mis à jour', updated);
    }



    /* ----------------------
     * ADD RATING
     * ----------------------*/

    addRatingOfAppointment = async (id: string, rating: number, comment: string, userId: string,) => {

        // 1️⃣ Vérifier que le rendez-vous existe
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: { annonce: true },
        });

        if (!appointment) {
            throw new NotFoundException('Rendez-vous introuvable');
        }

        // 2️⃣ Vérifier que l’utilisateur est autorisé
        const isClient = appointment.clientId === userId;
        const isProvider = appointment.annonce?.providerId === userId;

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
     * GET ONE
     * ----------------------*/
    async findOne(id: string) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: {
                annonce: true,
                provider: true,
                client: true,
                rating: true
            },
        });

        if (!appointment) {
            throw new NotFoundException('Rendez-vous introuvable');
        }

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
                    include: {
                        annonce: true,
                        provider: true,
                        client: true,
                        rating: true
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Rendez-vous annonces paginés', pagination);
        } catch (error) {
            console.error('[AppointmentAnnonce.paginate] ❌', error);
            throw new InternalServerErrorException('Erreur pagination rendez-vous annonces');
        }
    }

    /* ----------------------
     * PAGINATION POUR UN UTILISATEUR
     * ----------------------*/
    async paginateForUser(userId: string, params: ParamsDto) {
        try {
            // 1️⃣ Récupérer l'utilisateur
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new NotFoundException('Utilisateur introuvable');
            }

            // 2️⃣ Construire les conditions selon le rôle
            let conditions: any = {};

            if (user.roles === 'CLIENT') {
                conditions = {
                    clientId: userId,
                    annonceId: { not: null }
                };
            } else if (user.roles === 'PROVIDER') {
                // Récupérer les annonces de l'utilisateur
                const annonces = await this.prisma.annonce.findMany({
                    where: { providerId: userId },
                    select: { id: true }
                });
                const annonceIds = annonces.map(a => a.id);
                conditions = {
                    annonceId: {
                        in: annonceIds,
                        not: null
                    }
                };
            } else {
                throw new ForbiddenException('Rôle non autorisé pour cette opération');
            }

            // 3️⃣ Pagination
            const pagination = await this.functionService.paginate({
                model: 'Appointment',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        annonce: true,
                        provider: true,
                        client: true,
                        rating: true
                    }
                },
                conditions,
                orderBy: { createdAt: 'desc' },
            });

            // 4️⃣ Récupérer les IDs des annonces
            const annonceIds = pagination.data
                .map(a => a.annonce?.id)
                .filter(id => id !== null && id !== undefined);

            // 5️⃣ Récupérer toutes les images pour ces annonces
            const annonceImages = await this.prisma.fileManager.findMany({
                where: {  targetId: { in: annonceIds }, fileType: 'AnnonceMain' },
                select: {   targetId: true,  fileUrl: true,  fileName: true, fileType: true },
                orderBy: { createdAt: 'desc' },
            });

            // 6️⃣ Grouper les images par annonceId
            const imagesByAnnonce = annonceImages.reduce((acc, file) => {
                if (!acc[file.targetId]) {
                    acc[file.targetId] = [];
                }
                acc[file.targetId].push(getPublicFileUrl(file.fileUrl));
                return acc;
            }, {} as Record<string, string[]>);

            // 7️⃣ Ajouter les images dans chaque annonce
            pagination.data = pagination.data.map(appointment => {
                if (appointment.annonce && appointment.annonce.id) {
                    const annonceId = appointment.annonce.id;
                    return { ...appointment,
                        annonce: {
                            ...appointment.annonce,
                            images: imagesByAnnonce[annonceId] || []
                        }
                    };
                }
                return appointment;
            });

            return new BaseResponse(200, 'Rendez-vous annonces utilisateur paginés', pagination);
        } catch (error) {
            console.error('[AppointmentAnnonce.paginateForUser] ❌', error);
            throw new InternalServerErrorException('Erreur pagination rendez-vous annonces utilisateur');
        }
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
                    annonceId: { not: null },
                };
            }

            else if (userRole === 'PROVIDER') {

                const annonces = await this.prisma.annonce.findMany({ where: { providerId: userId }, select: { id: true } });
                const annonceIds = annonces.map(a => a.id);
                roleConditions = { annonceId: { in: annonceIds, not: null, }, };
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
                    annonce: true,
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
                annonceId: apt.annonceId,
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
                annonce: apt.annonce,
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


    async getCalendarData2(userId: string, year?: number, month?: number, annonceId?: string) {
        try {
            // Déterminer la période
            const currentDate = new Date();
            const targetYear = year ?? currentDate.getFullYear();
            const targetMonth = month ?? currentDate.getMonth();

            // Calculer les dates de début et fin du mois
            const startDate = new Date(targetYear, targetMonth, 1);
            const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

            // Construire la condition where
            const where: any = {
                annonceId: { not: null },
                scheduledAt: {
                    gte: startDate,
                    lte: endDate,
                }
            };

            // Filtrer par annonce si spécifié
            if (annonceId) {
                where.annonceId = annonceId;
            } else {
                // Sinon, récupérer les annonces de l'utilisateur
                const userAnnonces = await this.prisma.annonce.findMany({ where: { providerId: userId }, select: { id: true } });
                const userAnnonceIds = userAnnonces.map(a => a.id);
                where.OR = [
                    { clientId: userId },
                    { annonceId: { in: userAnnonceIds } }
                ];
            }

            const appointments = await this.prisma.appointment.findMany({
                where,
                include: {
                    annonce: true,
                    client: true,
                    provider: true,
                },
                orderBy: {
                    scheduledAt: 'asc',
                },
            });

            // Transformer les données
            const transformedAppointments = appointments.map(apt => ({
                id: apt.id,
                annonceId: apt.annonceId,
                providerId: apt.providerId,
                clientId: apt.clientId,
                client: apt.client ? {
                    id: apt.client.id,
                    name: apt.client.name,
                    email: apt.client.email,
                    phone: apt.client.phone,
                } : null,
                scheduledAt: apt.scheduledAt ? apt.scheduledAt.toISOString() : null,
                entryDate: apt.entryDate ? apt.entryDate.toISOString() : null,
                departureDate: apt.departureDate ? apt.departureDate.toISOString() : null,
                nights: apt.nights,
                time: apt.time,
                durationMins: apt.durationMins,
                priceCents: apt.priceCents,
                status: apt.status,
                providerNotes: apt.providerNotes,
                annonce: apt.annonce,
                createdAt: apt.createdAt.toISOString(),
                updatedAt: apt.updatedAt.toISOString(),
            }));

            // Grouper par jour
            const appointmentsByDay = {};
            transformedAppointments.forEach(apt => {
                if (apt.scheduledAt) {
                    const date = new Date(apt.scheduledAt);
                    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

                    if (!appointmentsByDay[dateKey]) {
                        appointmentsByDay[dateKey] = [];
                    }

                    appointmentsByDay[dateKey].push(apt);
                }
            });

            // Dates indisponibles (réservations confirmées)
            const unavailableDates = [];
            const confirmedAppointments = await this.prisma.appointment.findMany({
                where: {
                    annonceId: annonceId ? annonceId : undefined,
                    status: AppointmentStatus.CONFIRMED,
                    entryDate: { not: null },
                    departureDate: { not: null }
                },
                select: {
                    entryDate: true,
                    departureDate: true
                }
            });

            confirmedAppointments.forEach(apt => {
                if (apt.entryDate && apt.departureDate) {
                    const current = new Date(apt.entryDate);
                    const end = new Date(apt.departureDate);

                    while (current <= end) {
                        unavailableDates.push(new Date(current).toISOString().split('T')[0]);
                        current.setDate(current.getDate() + 1);
                    }
                }
            });

            return new BaseResponse(200, 'Données calendrier annonces récupérées', {
                appointments: transformedAppointments,
                appointmentsByDay,
                unavailableDates: [...new Set(unavailableDates)], // Supprimer les doublons
                period: {
                    year: targetYear,
                    month: targetMonth,
                    monthName: this.getMonthName(targetMonth),
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                },
                stats: {
                    total: transformedAppointments.length,
                    requested: transformedAppointments.filter(a => a.status === AppointmentStatus.REQUESTED).length,
                    confirmed: transformedAppointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
                    cancelled: transformedAppointments.filter(a =>
                        a.status === AppointmentStatus.CANCELLED ||
                        a.status === AppointmentStatus.REJECTED
                    ).length,
                    completed: transformedAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
                }
            });
        } catch (error) {
            console.error('[AppointmentAnnonce.getCalendarData] ❌', error);
            throw new InternalServerErrorException('Erreur récupération données calendrier annonces');
        }
    }

    /* ----------------------
     * DELETE
     * ----------------------*/
    async remove(id: string, userId: string) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: { annonce: true }
        });

        if (!appointment) {
            throw new NotFoundException('Rendez-vous introuvable');
        }

        // Vérifier les autorisations
        const isClient = appointment.clientId === userId;
        const isProvider = appointment.annonce?.providerId === userId;

        if (!isClient && !isProvider) {
            throw new ForbiddenException('Vous n\'avez pas l\'autorisation de supprimer ce rendez-vous');
        }

        // Empêcher la suppression si le rendez-vous est confirmé ou terminé
        if (appointment.status === AppointmentStatus.CONFIRMED ||
            appointment.status === AppointmentStatus.COMPLETED) {
            throw new ForbiddenException('Vous ne pouvez pas supprimer un rendez-vous confirmé ou terminé');
        }

        await this.prisma.appointment.delete({ where: { id } });

        return new BaseResponse(200, 'Rendez-vous supprimé', appointment);
    }

    /* ----------------------
     * CHECK AVAILABILITY
     * ----------------------*/
    async checkAvailability(annonceId: string, entryDate: Date, departureDate: Date) {
        const conflictingAppointments = await this.prisma.appointment.findMany({
            where: {
                annonceId,
                status: {
                    in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED]
                },
                OR: [
                    {
                        entryDate: {
                            lte: departureDate
                        },
                        departureDate: {
                            gte: entryDate
                        }
                    }
                ]
            }
        });

        const isAvailable = conflictingAppointments.length === 0;
        const nights = Math.ceil(Math.abs(departureDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

        return new BaseResponse(200, 'Disponibilité vérifiée', {
            isAvailable,
            conflictingAppointments: conflictingAppointments.length,
            nights,
            entryDate: entryDate.toISOString(),
            departureDate: departureDate.toISOString()
        });
    }

    /* ----------------------
     * HELPER: GET MONTH NAME
     * ----------------------*/
    private getMonthName(monthIndex: number): string {
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return monthNames[monthIndex];
    }
}