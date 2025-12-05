import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsNumber } from "class-validator";

/* ----------------------------------------------------
 *  PARAMS DTO
 * --------------------------------------------------*/
export class ParamsDto {

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    limit?: number;
}
