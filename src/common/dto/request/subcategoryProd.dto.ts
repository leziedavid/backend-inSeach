import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class SubCategoryDto {
    @ApiProperty({ example: 'uuid-subcategory-456' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Boubou Yacouba' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'boubou-yacouba' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiProperty({ example: 'uuid-category-123' })
    @IsUUID()
    categoryId: string;
}

export class CreateSubCategoryDto extends OmitType(SubCategoryDto, ['id'] as const) { }

export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) { }
