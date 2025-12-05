import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class ServiceCategoryDto {
    @ApiProperty({ example: 'uuid-category-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Coiffure' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Tous les services de coiffure' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateServiceCategoryDto extends OmitType(ServiceCategoryDto, ['id'] as const) { }
export class UpdateServiceCategoryDto extends PartialType(CreateServiceCategoryDto) {}
