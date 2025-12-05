import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsUUID, Min, Max } from 'class-validator';

export class ProductDto {
    @ApiProperty({ example: 'uuid-product-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Tunique Africaine' })
    @IsString()
    name: string;

    @ApiProperty({ example: 25000 })
    @IsNumber()
    price: number;

    @ApiPropertyOptional({ example: 30000 })
    @IsOptional()
    @IsNumber()
    originalPrice?: number;

    @ApiProperty({ example: 'FCFA' })
    @IsString()
    currency: string;

    @ApiProperty({ example: 'https://example.com/images/product1.jpg' })
    @IsString()
    image: string;

    @ApiProperty({ example: 'Tunique traditionnelle Yacouba en coton' })
    @IsString()
    description: string;

    @ApiProperty({ example: 4.5 })
    @IsNumber()
    @Min(0)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ example: 90 })
    @IsOptional()
    @IsNumber()
    percentegeRating?: number;

    @ApiProperty({ example: 10 })
    @IsNumber()
    reviewCount: number;

    @ApiProperty({ example: true })
    @IsBoolean()
    isBestSeller: boolean;

    @ApiPropertyOptional({ example: ['S', 'M', 'L'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    sizes?: string[];

    @ApiProperty({ example: 50 })
    @IsNumber()
    stock: number;
    @ApiPropertyOptional({ example: ['traditionnel', 'cotton'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
    @ApiPropertyOptional({ example: ['coton', 'design unique'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features?: string[];
    @ApiProperty({ example: 'Artisan Yacouba' })
    @IsString()
    seller: string;
    // Relations
    @ApiProperty({ example: 'uuid-category-123' })
    @IsUUID()
    categoryId: string;
    @ApiProperty({ example: 'uuid-subcategory-123' })
    @IsUUID()
    subCategoryId: string;
    @ApiPropertyOptional({ example: 'uuid-user-123' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    /* -------- IMAGES -------- */

    @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Images uploadées du service', })
    @IsOptional()
    images?: Express.Multer.File[];
    
}

// ✅ Create DTO (exclut l’ID)
export class CreateProductDto extends OmitType(ProductDto, ['id'] as const) { }
// ✅ Update DTO (partiel)
export class UpdateProductDto extends PartialType(CreateProductDto) { }
