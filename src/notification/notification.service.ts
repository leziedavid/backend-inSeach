import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PushService } from 'src/push/push.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pushService: PushService,
        private readonly gateway: NotificationGateway,
    ) { }

    /* ==========================
     * NOTIFICATION UTILISATEUR
     * ========================== */
    async notifyUser(
        userId: string,
        payload: { title: string; body: string; url?: string },
    ) {
        // 1️⃣ Toujours sauvegarder en DB (historique)
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                title: payload.title,
                body: payload.body,
                url: payload.url,
            },
        });

        // 2️⃣ Si utilisateur connecté → WebSocket ONLY
        if (this.gateway.isUserConnected(userId)) {
            this.gateway.sendToUser(userId, 'notification', notification);
            return;
        }

        // 3️⃣ Sinon → Push
        await this.pushService.sendToUser(userId, payload);
    }

    /* ==========================
     * NOTIFICATION GLOBALE
     * ========================== */
    async notifyAll(payload: { title: string; body: string; url?: string }) {
        // Historique global (optionnel)
        await this.prisma.notification.create({
            data: {
                title: payload.title,
                body: payload.body,
                url: payload.url,
            },
        });

        // WS + Push
        this.gateway.sendToAll('notification', payload);
        await this.pushService.sendToAll(payload);
    }

    /* ==========================
     * MARQUER COMME LU
     * ========================== */
    async markAsRead(notificationId: string) {
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }
}
