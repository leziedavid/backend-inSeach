import { Module } from '@nestjs/common';
import { AllCategoriesController } from './all-categories.controller';
import { AllCategoriesService } from './all-categories.service';


import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FunctionService } from 'src/utils/pagination.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { LocalStorageService } from 'src/utils/LocalStorageService';

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
    providers: [AllCategoriesService, JwtStrategy, FunctionService, LocalStorageService],  // <-- JwtStrategy ajouté ici
  
  controllers: [AllCategoriesController],
})
export class AllCategoriesModule {}
