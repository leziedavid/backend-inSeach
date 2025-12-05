// service.dto.ts
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, ValidateNested, IsEnum, } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './user.dto';
import { ServiceType } from '@prisma/client';


/* ----------------------------------------------------
 * SERVICE DTO
 * --------------------------------------------------*/
export class ServiceDto {

    @ApiProperty({ example: 'uuid-service-123' })
    @IsUUID()
    id: string;

    /* -------- CATEGORY -------- */

    @ApiProperty({ example: 'cat-1' })
    @IsString()
    categoryId: string;

    @ApiProperty({ example: 'sub-1' })
    @IsString()
    subcategoryId: string;

    /* -------- INFO -------- */

    @ApiProperty({ example: 'Coiffure & Barber' })
    @IsString()
    title: string;

    @ApiProperty({ example: '<p>justev</p>' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 2000000 })
    @IsNumber()
    @IsOptional()
    basePriceCents?: number;

    /* -------- ICON -------- */

    @ApiPropertyOptional({ description: "Identifiant de l'icône associée", example: 'icn-1', })
    @IsOptional()
    @IsString()
    iconId?: string;

    /* -------- LOCATION -------- */

    @ApiProperty({ type: LocationDto, description: 'Localisation complète + GPS', })
    @ValidateNested()
    @Type(() => LocationDto)
    location: LocationDto;

    @ApiProperty({  description: 'Type de service', enum: ServiceType, enumName: 'ServiceType', example: ServiceType.APPOINTMENT,})
    @IsEnum(ServiceType)
    serviceType: ServiceType;

    /* -------- PROVIDER ID -------- */

    @ApiPropertyOptional({ description: 'ID du provider (lié automatiquement à l’utilisateur)', example: 'uuid-user-123', })
    @IsOptional()
    @IsUUID()
    providerId?: string;

    /* -------- IMAGES -------- */

    @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Images uploadées du service', })
    @IsOptional()
    images?: Express.Multer.File[];
}

/* ----------------------------------------------------
 * CREATE
 * --------------------------------------------------*/
export class CreateServiceDto extends OmitType(ServiceDto, ['id'] as const) { }

/* ----------------------------------------------------
 * UPDATE
 * --------------------------------------------------*/
export class UpdateServiceDto extends PartialType(CreateServiceDto) { }
