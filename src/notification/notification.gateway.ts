import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class NotificationGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);

    // userId -> Set<socketId>
    private connectedUsers = new Map<string, Set<string>>();

    handleConnection(client: Socket) {
        const userId = client.handshake.auth?.userId;
        if (!userId) {
            client.disconnect();
            return;
        }

        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }

        this.connectedUsers.get(userId)!.add(client.id);
        this.logger.log(`🟢 WS connecté user=${userId} socket=${client.id}`);
    }

    handleDisconnect(client: Socket) {
        for (const [userId, sockets] of this.connectedUsers.entries()) {
            if (sockets.has(client.id)) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.connectedUsers.delete(userId);
                }
                this.logger.log(`🔴 WS déconnecté user=${userId}`);
                break;
            }
        }
    }

    isUserConnected(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }

    sendToUser(userId: string, event: string, payload: any) {
        const sockets = this.connectedUsers.get(userId);
        if (!sockets) return;

        sockets.forEach((socketId) => {
            this.server.to(socketId).emit(event, payload);
        });
    }

    sendToAll(event: string, payload: any) {
        this.server.emit(event, payload);
    }
}
