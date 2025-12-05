import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ServiceType } from '@prisma/client';
import { PartialType } from '@nestjs/swagger';

export class ServiceSubcategoryDto {
    @ApiProperty({ example: 'uuid-subcategory-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Tresses' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Toutes les tresses africaines' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 'uuid-category-123' })
    @IsUUID()
    categoryId: string;

    @ApiProperty({
        enum: ServiceType,
        isArray: true,
        example: [ServiceType.APPOINTMENT, ServiceType.ORDER],
    })
    @IsArray()
    @IsEnum(ServiceType, { each: true })
    serviceType: ServiceType[];
}

export class CreateServiceSubcategoryDto extends OmitType(ServiceSubcategoryDto, ['id'] as const) { }
export class UpdateServiceSubcategoryDto extends PartialType(CreateServiceSubcategoryDto) { }
