import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CategoryDto {
    @ApiProperty({ example: 'uuid-category-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Mode' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'mode-africaine' })
    @IsOptional()
    @IsString()
    slug?: string;
}

export class CreateCategoryDto extends OmitType(CategoryDto, ['id'] as const) {}
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
