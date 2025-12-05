import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class IconeDto {
    
    @ApiProperty({ example: 'uuid-icone-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Shopping Bag' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'Icône représentant un sac de shopping' })
    @IsOptional()
    @IsString()
    description?: string;

    /* -------- IMAGES -------- */
    @ApiPropertyOptional({ type: 'array',  items: { type: 'string', format: 'binary' },  description: 'Images uploadées du service',})
    @IsOptional()
    images?: Express.Multer.File[];
}

/** --------------------- CREATE DTO --------------------- */
export class CreateIconeDto extends OmitType(IconeDto, ['id'] as const) {}

/** --------------------- UPDATE DTO --------------------- */
export class UpdateIconeDto extends PartialType(CreateIconeDto) {}
