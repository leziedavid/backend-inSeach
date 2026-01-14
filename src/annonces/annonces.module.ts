import { Module } from '@nestjs/common';
import { AnnoncesController } from './annonces.controller';
import { AnnoncesService } from './annonces.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FunctionService } from 'src/utils/pagination.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { AnnonceMapper } from 'src/utils/mappers/annonce-mapper';

@Module({

    imports: [
      ConfigModule, // 👈 pour injection locale (non nécessaire si global)
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (config: ConfigService) => {
          return {
            secret: config.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRE') || '15m' }, // par défaut 15m
          };
        }
      }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      PrismaModule,
    ],
    providers: [AnnoncesService, JwtStrategy, FunctionService, LocalStorageService,AnnonceMapper],  // <-- JwtStrategy ajouté ici
  

  controllers: [AnnoncesController],
})
export class AnnoncesModule {}
