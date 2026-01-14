import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, ValidateNested, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { LocationDto } from "./user.dto";

/* ----------------------------------------------------
 * FILTER PARAMS DTO
 * --------------------------------------------------*/
export class FilterAnnonceParamsDto {

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({ example: "coiffure", description: "Texte recherché dans le titre, description, catégorie, sous-catégorie" })
    @IsOptional()
    @IsString()
    label?: string;

    @ApiPropertyOptional({ type: LocationDto, description: "Localisation complète du client" })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;

    /* -----------------------------
     * FILTRES PRODUITS
     * ---------------------------*/
    @ApiPropertyOptional({ example: "uuid-category", description: "Filtrer par categoryId" })
    @IsOptional()
    @IsString()
    categoryId?: string;
}
