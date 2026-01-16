import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotifyUserDto {
    @ApiProperty({ description: 'ID du device ciblé' })
    deviceId: string;

    @ApiProperty({ description: 'Titre de la notification' })
    title: string;

    @ApiProperty({ description: 'Message de la notification' })
    message: string;

    @ApiPropertyOptional({ description: 'URL optionnelle à ouvrir' })
    url?: string;
}

export class NotifyAllDto {
    @ApiProperty({ description: 'Titre de la notification globale' })
    title: string;

    @ApiProperty({ description: 'Message de la notification globale' })
    message: string;

    @ApiPropertyOptional({ description: 'URL optionnelle à ouvrir' })
    url?: string;
}
