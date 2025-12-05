// src/import-decoupage/dto/import-file.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Express } from 'express';

export class ImportFileDto {
    @ApiProperty({ type: 'string', format: 'binary' })
    @IsNotEmpty()
    file: Express.Multer.File;
}
