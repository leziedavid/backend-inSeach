import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
    IsUUID,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsEnum,
    IsDateString,
    IsInt,
    IsNumber,
    Min,
    Max,
    IsBoolean,
    ValidateIf,
    IsDate,
    MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentAnnonceDto {
    @ApiProperty({ example: 'uuid-appointment-123' })
    @IsUUID()
    id: string;

    @ApiProperty({
        example: 'uuid-annonce-123',
        description: 'ID de l\'annonce liée au rendez-vous'
    })
    @IsUUID()
    @IsNotEmpty()
    annonceId: string;

    @ApiPropertyOptional({
        example: 'uuid-client-123',
        description: 'ID du client (rempli automatiquement)'
    })
    @IsUUID()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional({
        example: 'uuid-transaction-123',
        description: 'ID de la transaction (rempli automatiquement)'
    })
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
        description: 'Heure prévue si scheduledAt n\'est pas utilisé'
    })
    @IsOptional()
    @IsString()
    time?: string;

    @ApiPropertyOptional({
        example: 45,
        description: 'Durée en minutes'
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    durationMins?: number;

    @ApiPropertyOptional({
        example: 1500,
        description: 'Prix en centimes par nuit'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    priceCents?: number;

    @ApiPropertyOptional({
        enum: AppointmentStatus,
        example: AppointmentStatus.REQUESTED,
        description: 'Statut du rendez-vous'
    })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    // interventionType
    @ApiPropertyOptional({ example: 'rdv' })
    @IsString()
    interventionType: string;
    example: string;
    description: 'Type d\'intervention: urgence ou rdv'


    @ApiPropertyOptional({
        example: '2025-12-20T14:00:00Z',
        description: 'Date d\'arrivée pour les réservations'
    })
    @IsOptional()
    @IsDateString()
    entryDate?: string;

    @ApiPropertyOptional({
        example: '2025-12-25T11:00:00Z',
        description: 'Date de départ pour les réservations'
    })
    @IsOptional()
    @IsDateString()
    departureDate?: string;

    @ApiPropertyOptional({
        example: 5,
        description: 'Nombre de nuits (calculé automatiquement)'
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    nights?: number;

    @ApiPropertyOptional({
        example: 'Le client a demandé une modification de l\'horaire',
        description: 'Notes du prestataire'
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    providerNotes?: string;

    @ApiPropertyOptional({
        example: '2025-01-12T10:30:00Z',
        description: 'Date de création'
    })
    @IsDateString()
    @IsOptional()
    createdAt?: string;

    @ApiPropertyOptional({
        example: '2025-01-12T10:30:00Z',
        description: 'Date de dernière mise à jour'
    })
    @IsDateString()
    @IsOptional()
    updatedAt?: string;
}

/** --------------------- CREATE DTO --------------------- */
export class CreateAppointmentAnnonceDto extends OmitType(AppointmentAnnonceDto, [
    'id',
    'clientId',
    'transactionId',
    'createdAt',
    'updatedAt',
    'nights',
    'status'
] as const) {
    @ApiProperty({
        example: 'uuid-annonce-123',
        description: 'ID de l\'annonce',
        required: true
    })
    @IsUUID()
    @IsNotEmpty()
    annonceId: string;

    @ApiPropertyOptional({
        example: '2025-12-20T14:00:00Z',
        description: 'Date d\'arrivée (obligatoire pour les réservations)'
    })
    @ValidateIf(o => o.departureDate !== undefined)
    @IsDateString()
    @IsNotEmpty()
    entryDate?: string;

    @ApiPropertyOptional({
        example: '2025-12-25T11:00:00Z',
        description: 'Date de départ (obligatoire pour les réservations)'
    })
    @ValidateIf(o => o.entryDate !== undefined)
    @IsDateString()
    @IsNotEmpty()
    departureDate?: string;

    @ApiPropertyOptional({
        example: 5000,
        description: 'Prix en centimes (si différent du prix de l\'annonce)'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    priceCents?: number;
}

/** --------------------- UPDATE DTO --------------------- */
export class UpdateAppointmentAnnonceDto extends PartialType(CreateAppointmentAnnonceDto) {
    @ApiPropertyOptional({
        enum: AppointmentStatus,
        example: AppointmentStatus.CONFIRMED,
        description: 'Statut du rendez-vous'
    })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;
}

/** --------------------- STATUS UPDATE DTO --------------------- */
export class UpdateAppointmentAnnonceStatusDto {
    @ApiProperty({
        enum: AppointmentStatus,
        example: AppointmentStatus.CONFIRMED,
        description: 'Nouveau statut du rendez-vous',
        required: true
    })
    @IsEnum(AppointmentStatus)
    @IsNotEmpty()
    status: AppointmentStatus;

    @ApiPropertyOptional({
        example: 7500,
        description: 'Prix final en centimes (pour les mises à jour de prix)'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    priceCents?: number;
}

/** --------------------- RATING DTO --------------------- */
export class RatingAppointmentAnnonceDto {
    @ApiProperty({
        example: 4.5,
        description: 'Note entre 1 et 5',
        minimum: 1,
        maximum: 5
    })
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsNotEmpty()
    rating: number;

    @ApiPropertyOptional({
        example: 'Très bon séjour, propriétaire très accueillant',
        description: 'Commentaire sur le rendez-vous'
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    comment?: string;
}

/** --------------------- CHECK AVAILABILITY DTO --------------------- */
export class CheckAvailabilityDto {
    @ApiProperty({
        example: 'uuid-annonce-123',
        description: 'ID de l\'annonce',
        required: true
    })
    @IsUUID()
    @IsNotEmpty()
    annonceId: string;

    @ApiProperty({
        example: '2025-12-20T14:00:00Z',
        description: 'Date d\'arrivée',
        required: true
    })
    @IsDateString()
    @IsNotEmpty()
    entryDate: string;

    @ApiProperty({
        example: '2025-12-25T11:00:00Z',
        description: 'Date de départ',
        required: true
    })
    @IsDateString()
    @IsNotEmpty()
    departureDate: string;

    @ApiPropertyOptional({
        example: 'uuid-appointment-123',
        description: 'ID du rendez-vous à exclure (pour les mises à jour)'
    })
    @IsOptional()
    @IsUUID()
    appointmentId?: string;
}

/** --------------------- FILTER DTO --------------------- */
export class FilterAppointmentAnnonceDto {
    @ApiPropertyOptional({
        example: 'uuid-annonce-123',
        description: 'Filtrer par annonce'
    })
    @IsOptional()
    @IsUUID()
    annonceId?: string;

    @ApiPropertyOptional({
        example: 'uuid-client-123',
        description: 'Filtrer par client'
    })
    @IsOptional()
    @IsUUID()
    clientId?: string;

    @ApiPropertyOptional({
        example: 'uuid-provider-123',
        description: 'Filtrer par propriétaire'
    })
    @IsOptional()
    @IsUUID()
    providerId?: string;

    @ApiPropertyOptional({
        enum: AppointmentStatus,
        example: AppointmentStatus.CONFIRMED,
        description: 'Filtrer par statut'
    })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @ApiPropertyOptional({
        example: '2025-01-01',
        description: 'Date de début pour filtrer par période'
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        example: '2025-12-31',
        description: 'Date de fin pour filtrer par période'
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        example: 'rdv',
        description: 'Filtrer par type d\'intervention'
    })
    @IsOptional()
    @IsString()
    interventionType?: string;
}

/** --------------------- CALENDAR QUERY DTO --------------------- */
export class CalendarQueryDto {
    @ApiPropertyOptional({
        example: 2025,
        description: 'Année pour le calendrier'
    })
    @IsOptional()
    @IsInt()
    @Min(2000)
    @Max(2100)
    year?: number;

    @ApiPropertyOptional({
        example: 11,
        description: 'Mois (0-11) pour le calendrier'
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(11)
    month?: number;

    @ApiPropertyOptional({
        example: 'uuid-annonce-123',
        description: 'ID de l\'annonce spécifique'
    })
    @IsOptional()
    @IsUUID()
    annonceId?: string;
}

/** --------------------- RESPONSE DTO --------------------- */
export class AppointmentAnnonceResponseDto {
    @ApiProperty({ example: 'uuid-appointment-123' })
    id: string;

    @ApiProperty({ example: 'uuid-annonce-123' })
    annonceId: string;

    @ApiProperty({ example: 'uuid-client-123' })
    clientId: string;

    @ApiPropertyOptional({ example: 'uuid-provider-123' })
    providerId?: string;

    @ApiPropertyOptional({ example: '2025-12-20T15:00:00Z' })
    scheduledAt?: string;

    @ApiPropertyOptional({ example: '15:30' })
    time?: string;

    @ApiPropertyOptional({ example: 45 })
    durationMins?: number;

    @ApiPropertyOptional({ example: 1500 })
    priceCents?: number;

    @ApiProperty({
        enum: AppointmentStatus,
        example: AppointmentStatus.REQUESTED
    })
    status: AppointmentStatus;

    @ApiPropertyOptional({ example: 'rdv' })
    interventionType?: string;

    @ApiPropertyOptional({ example: '2025-12-20T14:00:00Z' })
    entryDate?: string;

    @ApiPropertyOptional({ example: '2025-12-25T11:00:00Z' })
    departureDate?: string;

    @ApiPropertyOptional({ example: 5 })
    nights?: number;

    @ApiPropertyOptional({ example: 'Notes du prestataire' })
    providerNotes?: string;

    @ApiProperty({ example: '2025-01-12T10:30:00Z' })
    createdAt: string;

    @ApiProperty({ example: '2025-01-12T10:30:00Z' })
    updatedAt: string;

    // Relations
    @ApiPropertyOptional({ type: Object })
    annonce?: any;

    @ApiPropertyOptional({ type: Object })
    client?: any;

    @ApiPropertyOptional({ type: Object })
    provider?: any;

    @ApiPropertyOptional({ type: Object })
    rating?: any;
}
