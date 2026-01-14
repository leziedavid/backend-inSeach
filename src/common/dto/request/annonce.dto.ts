import {
    ApiProperty,
    ApiPropertyOptional,
    OmitType,
    PartialType,
} from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

/* =====================================================
 * GPS LOCATION (JSON)
 * ===================================================== */
export class GpsLocationDto {
    @ApiProperty()
    @IsNumber()
    lat: number;

    @ApiProperty()
    @IsNumber()
    lng: number;

    @ApiPropertyOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional()
    @IsString()
    district?: string;

    @ApiPropertyOptional()
    @IsString()
    street?: string;
}

/* =====================================================
 * ANNONCE
 * ===================================================== */
export class AnnonceDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsBoolean()
    pinned: boolean;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsInt()
    capacity: number;

    @ApiProperty()
    @IsInt()
    rooms: number;

    @ApiProperty()
    @IsInt()
    beds: number;

    @ApiPropertyOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Note moyenne calculée automatiquement' })
    @IsNumber()
    rating: number;

    @ApiPropertyOptional()
    @IsDateString()
    certifiedAt?: string;

    @ApiProperty()
    @IsString()
    location: string;

    @ApiProperty()
    @IsUUID()
    categoryId: string;

    @ApiProperty()
    @IsUUID()
    typeId: string;

    // amenitiesIds
    @ApiPropertyOptional({ type: [String] })
    @IsArray()
    amenityId?: string[];

    @ApiPropertyOptional({ type: GpsLocationDto })
    gpsLocation?: GpsLocationDto;

    /* -------- IMAGES -------- */
    @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Images uploadées du service', })
    @IsOptional()
    images?: Express.Multer.File[];

    @ApiProperty()
    @IsDateString()
    createdAt: string;

    @ApiProperty()
    @IsDateString()
    updatedAt: string;
}

/* ---------------- CREATE / UPDATE ANNONCE ---------------- */
export class CreateAnnonceDto extends OmitType(AnnonceDto, ['id', 'rating', 'createdAt', 'updatedAt',] as const) { }
export class UpdateAnnonceDto extends PartialType(CreateAnnonceDto) { }

/* =====================================================
 * ANNONCE CATEGORY
 * ===================================================== */
export class AnnonceCategoryDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    value: string;

    @ApiProperty()
    @IsString()
    label: string;

    @ApiPropertyOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsDateString()
    certifiedAt?: string;

    @ApiProperty()
    @IsDateString()
    createdAt: string;

    @ApiProperty()
    @IsDateString()
    updatedAt: string;
}

/* ---------------- CREATE / UPDATE CATEGORY ---------------- */
export class CreateAnnonceCategoryDto extends OmitType( AnnonceCategoryDto, ['id', 'createdAt', 'updatedAt'] as const,) { }

export class UpdateAnnonceCategoryDto extends PartialType( CreateAnnonceCategoryDto,) { }

/* ---------------- CREATE BATCH CATEGORY ---------------- */
export class CreateAnnonceCategoryBatchDto {
    @ApiProperty({ type: [CreateAnnonceCategoryDto] })
    @IsNotEmpty()
    categories: CreateAnnonceCategoryDto[];
}


/* =====================================================
 * AMENITY
 * ===================================================== */
export class AmenityDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    label: string;

    @ApiProperty()
    @IsString()
    icon?: string;
    /* -------- IMAGES -------- */
    @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Images uploadées du service', })
    @IsOptional()
    images?: Express.Multer.File[];

    @ApiProperty()
    @IsDateString()
    createdAt: string;

    @ApiProperty()
    @IsDateString()
    updatedAt: string;
}

/* ---------------- CREATE / UPDATE AMENITY ---------------- */
export class CreateAmenityDto extends OmitType(AmenityDto, ['id','createdAt','updatedAt',] as const) { }
export class UpdateAmenityDto extends PartialType(CreateAmenityDto) { }

/* =====================================================
 * ANNONCE ↔ AMENITY (TABLE PIVOT)
 * ===================================================== */
export class AnnonceAmenityDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsUUID()
    annonceId: string;

    @ApiProperty()
    @IsUUID()
    amenityId: string;

    @ApiProperty()
    @IsDateString()
    createdAt: string;
}

/* ---------------- CREATE / UPDATE ANNONCE AMENITY ---------------- */
export class CreateAnnonceAmenityDto extends OmitType(  AnnonceAmenityDto, ['id', 'createdAt'] as const, ) { }
export class UpdateAnnonceAmenityDto extends PartialType(  CreateAnnonceAmenityDto,) { }

/* =====================================================
 * REVIEW
 * ===================================================== */
export class ReviewDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    author: string;

    @ApiProperty({ example: 4 })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional()
    @IsString()
    comment?: string;

    @ApiProperty()
    @IsUUID()
    annonceId: string;

    @ApiProperty()
    @IsDateString()
    createdAt: string;

    @ApiProperty()
    @IsDateString()
    updatedAt: string;
}

/* ---------------- CREATE / UPDATE REVIEW ---------------- */
export class CreateReviewDto extends OmitType(ReviewDto, ['id','createdAt','updatedAt',] as const) { }
export class UpdateReviewDto extends PartialType(CreateReviewDto) { }

/* =====================================================
 * ANNONCE TYPE
 * ===================================================== */
export class AnnonceTypeDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    @IsString()
    label: string; // "Vente", "Location", etc.

    @ApiPropertyOptional()
    @IsString()
    description?: string; // Optionnel, description pour l'UI

    @ApiPropertyOptional()
    @IsString()
    icon?: string; // Optionnel, icône pour l'UI

    @ApiProperty()
    createdAt: string;

    @ApiProperty()
    updatedAt: string;
}

/* ---------------- CREATE / UPDATE TYPE ---------------- */
export class CreateAnnonceTypeDto extends OmitType(AnnonceTypeDto, ['id', 'createdAt', 'updatedAt'] as const) {}
export class UpdateAnnonceTypeDto extends PartialType(CreateAnnonceTypeDto) {}

/* ---------------- CREATE BATCH TYPE ---------------- */
export class CreateAnnonceTypeBatchDto { @ApiProperty({ type: [CreateAnnonceTypeDto] })  @IsNotEmpty()  @IsArray()  types: CreateAnnonceTypeDto[];}