import { Injectable, Logger, InternalServerErrorException, BadRequestException, } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { PushSubscription } from 'web-push';

@Injectable()
export class PushService {
    private readonly logger = new Logger(PushService.name);

    constructor(private readonly prisma: PrismaService) {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT!,
            process.env.VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!,
        );

        this.logger.log('Web Push initialisé avec VAPID ✅');
    }

    /* ==============================
    📌 SUBSCRIBE
    ============================== */
    async subscribe(userId: string, subscription: PushSubscription, deviceId?: string,): Promise<BaseResponse<null>> {
        try {

            if (!userId || !subscription)
                throw new BadRequestException('userId et subscription requis');

            await this.prisma.pushSubscription.upsert({
                where: { userId_endpoint: { userId, endpoint: subscription.endpoint, }, },
                update: { keys: subscription.keys, deviceId, },
                create: { userId, deviceId, endpoint: subscription.endpoint, keys: subscription.keys, },
            });

            this.logger.log(`Subscription enregistrée (user=${userId}, device=${deviceId})`);
            return { statusCode: 201, message: 'Subscription enregistrée', data: null };

        } catch (error) {
            this.logger.error('[PushService.subscribe] ❌', error);
            throw new InternalServerErrorException('Erreur lors de l’enregistrement de la subscription',);
        }
    }

    /* ==============================
    📌 UNSUBSCRIBE (par device)
    ============================== */
    async unsubscribe(userId: string, deviceId: string,): Promise<BaseResponse<null>> {
        try {
            if (!userId || !deviceId) throw new BadRequestException('userId et deviceId requis');

            await this.prisma.pushSubscription.deleteMany({ where: { userId, deviceId }, });
            this.logger.log(`Désinscription push (user=${userId}, device=${deviceId})`);
            return { statusCode: 200, message: 'Désinscription réussie', data: null };

        } catch (error) {
            this.logger.error('[PushService.unsubscribe] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la désinscription push',);
        }
    }

    /* ==============================
        📌 SEND TO USER (option device)
    ============================== */
    async sendToUser(targetUserId: string, payload: { title: string; body: string; url?: string; deviceId?: string; },): Promise<BaseResponse<null>> {

        try {

            const subscriptions = await this.prisma.pushSubscription.findMany({
                where: {
                    userId: targetUserId,
                    ...(payload.deviceId && { deviceId: payload.deviceId }),
                },
            });

            if (!subscriptions.length) {
                this.logger.warn(`Aucune subscription trouvée (user=${targetUserId})`);
                return {
                    statusCode: 404,
                    message: 'Aucune subscription trouvée',
                    data: null,
                };
            }

            await Promise.all(
                subscriptions.map(async (sub) => {
                    try {
                        await webpush.sendNotification(
                            sub as any,
                            JSON.stringify({
                                title: payload.title,
                                body: payload.body,
                                url: payload.url,
                            }),
                        );
                    } catch (err: any) {
                        if (err?.statusCode === 404 || err?.statusCode === 410) {
                            this.logger.warn(`Subscription invalide supprimée (endpoint=${sub.endpoint})`,);
                            await this.prisma.pushSubscription.delete({ where: { id: sub.id }, });
                        } else {
                            this.logger.error('Erreur push ciblé', err);
                        }
                    }
                }),
            );

            return { statusCode: 200, message: 'Notification envoyée', data: null };
        } catch (error) {
            this.logger.error('[PushService.sendToUser] ❌', error);
            throw new InternalServerErrorException(
                'Erreur lors de l’envoi de la notification',
            );
        }
    }

    /* ==============================
    📌 SEND TO ALL
    ============================== */
    async sendToAll2(payload: { title: string; body: string; url?: string }): Promise<BaseResponse<null>> {
        try {

            const subscriptions = await this.prisma.pushSubscription.findMany();
            console.log(`📊 ${subscriptions.length} abonnements trouvés`);

            await Promise.all(
                subscriptions.map(async (sub) => {
                    try {

                        if (!sub.endpoint || !sub.keys) return;

                        const keys = sub.keys as { p256dh: string; auth: string };

                        const res = await webpush.sendNotification(
                            {
                                endpoint: sub.endpoint,
                                keys: {
                                    p256dh: keys.p256dh,
                                    auth: keys.auth,
                                },
                            },
                            JSON.stringify(payload)
                        );

                        console.log("res", res);

                    } catch (err: any) {
                        if (err?.statusCode === 404 || err?.statusCode === 410) {
                            await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
                        } else {
                            this.logger.error('Erreur notification globale', err);
                        }
                    }
                })
            );

            this.logger.log('Notification globale envoyée');
            return {
                statusCode: 200,
                message: 'Notification globale envoyée',
                data: null,
            };
        } catch (error) {
            this.logger.error('[PushService.sendToAll] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la notification globale');
        }
    }


    async sendToAll(payload: { title?: string; body?: string; url?: string }) {
        try {
            const subscriptions = await this.prisma.pushSubscription.findMany();
            console.log(`📊 ${subscriptions.length} abonnements trouvés`);

            const safePayload = {
                title: payload?.title || 'Notification',
                body: payload?.body || 'Nouveau message',
                url: payload?.url || '/',
            };

            await Promise.allSettled(
                subscriptions.map(async (sub) => {
                    if (!sub.endpoint || !sub.keys) return;

                    const keys = sub.keys as { p256dh: string; auth: string };

                    try {
                        await webpush.sendNotification(
                            {
                                endpoint: sub.endpoint,
                                keys: {
                                    p256dh: keys.p256dh,
                                    auth: keys.auth,
                                },
                            },
                            JSON.stringify(safePayload),
                            {
                                TTL: 60,
                                urgency: 'high',
                            }
                        );
                    } catch (err: any) {
                        if (err?.statusCode === 404 || err?.statusCode === 410) {
                            await this.prisma.pushSubscription.delete({
                                where: { id: sub.id },
                            });
                        } else {
                            console.error('❌ Push error:', err?.body || err);
                        }
                    }
                })
            );

            return {
                statusCode: 200,
                message: 'Notification globale envoyée',
                data: null,
            };
        } catch (error) {
            console.error('[PushService.sendToAll]', error);
            throw new InternalServerErrorException();
        }
    }



}

