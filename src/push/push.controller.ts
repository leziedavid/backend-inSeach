
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PushService } from './push.service';
import { BaseResponse } from 'src/utils/base-response';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { NotifyAllDto, NotifyUserDto } from 'src/common/dto/request/push.dto';


@ApiTags('Push Notifications')
@ApiBearerAuth('access-token')
@Controller('push')
export class PushController {
    constructor(private readonly pushService: PushService) { }

    /* -------------------
     * SUBSCRIBE USER
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Post('subscribe')
    @ApiOperation({ summary: 'S\'abonner aux notifications push' })
    @ApiResponse({ status: 201, description: 'Subscription enregistrée avec succès' })
    async subscribeUser(@Body() body: { userId: string; subscription: any, deviceId: string }, @Req() req: Request,): Promise<BaseResponse<null>> {
        // Utiliser l'userId du token JWT pour plus de sécurité
        const user = req.user as any;;
        return this.pushService.subscribe(user.id, body.subscription, body.deviceId);
    }

    /* -------------------
     * UNSUBSCRIBE USER
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Post('unsubscribe')
    @ApiOperation({ summary: 'Se désabonner des notifications push' })
    @ApiResponse({ status: 200, description: 'Désinscription réussie' })
    async unsubscribeUser(@Body() body: { deviceId: string }, @Req() req: Request,): Promise<BaseResponse<null>> {
        const user = req.user as any;
        return this.pushService.unsubscribe(user.id, body.deviceId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('notify-user')
    @ApiOperation({ summary: 'Envoyer une notification à un utilisateur' })
    @ApiResponse({ status: 200, description: 'Notification envoyée' })
    async notifyUser(@Body() body: NotifyUserDto,  @Req() req: Request,): Promise<BaseResponse<null>> {
        const user = req as any;
        return this.pushService.sendToUser(
            user.id, {
            title: body.title,
            body: body.message,
            url: body.url,
            deviceId: body.deviceId,
        });
    }

    @Post('notify-all')
    @ApiOperation({ summary: 'Envoyer une notification à tous les utilisateurs' })
    @ApiResponse({ status: 200, description: 'Notifications envoyées' })
    async notifyAll(@Body() body: NotifyAllDto,): Promise<BaseResponse<null>> {
        return this.pushService.sendToAll({
            title: body.title,
            body: body.message,
            url: body.url,
        });
    }
}
