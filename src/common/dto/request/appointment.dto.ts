import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {IsUUID,IsNotEmpty,IsOptional,IsString,IsEnum,IsDateString,IsInt,IsNumber} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentDto {

    @ApiProperty({ example: 'uuid-appointment-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'uuid-service-123' })
    @IsUUID()
    @IsNotEmpty()
    serviceId: string;

    // @ApiProperty({ example: 'uuid-provider-123' })
    // @IsUUID()
    // @IsNotEmpty()
    // providerId: string;

    @ApiPropertyOptional({ example: 'uuid-client-123' })
    @IsUUID()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional({ example: 'uuid-transaction-123' })
    @IsUUID()
    @IsOptional()
    transactionId?: string;

    @ApiPropertyOptional({
        example: '2025-12-20T15:00:00Z',
        description: 'Date programmée du rendez-vous'
    })
    @IsOptional()
    @IsDateString()
    scheduledAt?: string;

    @ApiPropertyOptional({
        example: '15:30',
        description: 'Heure prévue si scheduledAt n’est pas utilisé'
    })
    @IsOptional()
    @IsString()
    time?: string;

    @ApiPropertyOptional({ example: 45, description: 'Durée en minutes' })
    @IsOptional()
    @IsInt()
    durationMins?: number;

    @ApiPropertyOptional({ example: 1500, description: 'Prix en centimes' })
    @IsOptional()
    @IsNumber()
    priceCents?: number;

    @ApiPropertyOptional({
        enum: AppointmentStatus,
        example: AppointmentStatus.REQUESTED,
    })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @ApiPropertyOptional({
        example: 'Le client a demandé une modification de l’horaire'
    })
    @IsOptional()
    @IsString()
    providerNotes?: string;
}

/** --------------------- CREATE DTO --------------------- */
export class CreateAppointmentDto extends OmitType(AppointmentDto, ['id'] as const) { }

/** --------------------- UPDATE DTO --------------------- */
export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) { }
