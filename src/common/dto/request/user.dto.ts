// user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNotEmpty,IsOptional, IsString, IsUUID, IsNumber, ValidateNested,} from 'class-validator';
import { Type } from 'class-transformer';
import { Role, AccountType } from '@prisma/client';
import { PartialType, OmitType } from '@nestjs/swagger';

/* ----------------------------------------------------
 * LOCATION DTO
 * --------------------------------------------------*/
export class LocationDto {
    @ApiProperty({ example: 5.400981361941216 })
    @IsNumber()
    lat: number;

    @ApiProperty({ example: -3.955873758087492 })
    @IsNumber()
    lng: number;

    @ApiProperty({ example: "Côte d’Ivoire" })
    @IsString()
    country: string;

    @ApiProperty({ example: "Abidjan" })
    @IsString()
    city: string;

    @ApiProperty({ example: "Boulevard Charles Bauza Donwahi" })
    @IsString()
    district: string;

    @ApiProperty({ example: "8e et 9e tranche" })
    @IsString()
    street: string;
}

/* ----------------------------------------------------
 * USER DTO
 * --------------------------------------------------*/
export class UserDto {
    @ApiProperty({ example: 'uuid-user-123' })
    @IsUUID()
    id: string;

    @IsOptional()
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @IsOptional()
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'TDLEZ' })
    @IsOptional()
    @IsString()
    companyName?: string;

    /* -------- CONTACT -------- */

    @ApiProperty({ example: '+2250153686819' })
    @IsString()
    phone: string;

    @ApiProperty({ type: LocationDto })
    @ValidateNested()
    @Type(() => LocationDto)
    location: LocationDto;

    /* -------- ACCOUNT -------- */

    @ApiProperty({ enum: AccountType, example: 'COMPANY' })
    @IsEnum(AccountType)
    typeCompte: AccountType;

    @ApiProperty({  enum: Role, example: 'PROVIDER', description: 'Rôle utilisateur unique',})
    @IsEnum(Role)
    roles: Role; // ← un seul rôle

/* -------- SERVICES -------- */

    @ApiPropertyOptional({  type: [String],  example: ['cat1'], description: 'Identifiants des catégories sélectionnées',})
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    serviceCategories?: string[];

    @ApiPropertyOptional({ type: [String], example: ['sub1'], description: 'Identifiants des sous-catégories sélectionnées',})
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    serviceSubcategories?: string[];

    @ApiProperty({ example: '@1234' })
    @IsString()
    password: string;

    /* -------- IMAGES (NE PAS SUPPRIMER) -------- */
    @ApiPropertyOptional({ type: 'array',  items: { type: 'string', format: 'binary' },  description: 'Images uploadées',})
    @IsOptional()
    @IsArray()
    images?: Express.Multer.File[];
}

/* ----------------------------------------------------
 * CREATE
 * --------------------------------------------------*/
export class CreateUserDto extends OmitType(UserDto, ['id'] as const) {}

/* ----------------------------------------------------
 * UPDATE
 * --------------------------------------------------*/
export class UpdateUserDto extends PartialType(CreateUserDto) { }
