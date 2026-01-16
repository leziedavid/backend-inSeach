// src/app.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module';
import { UserModule } from './user/user.module';
import { SecurityModule } from './security/security.module';
import { CategoryModule } from './category/category.module';
import { IconeModule } from './icone/icone.module';
import { MyServicesModule } from './my-services/my-services.module';
import { AllCategoriesModule } from './all-categories/all-categories.module';
import { ProductModule } from './product/product.module';
import { AppointmentModule } from './appointment/appointment.module';
import { HistoryModule } from './history/history.module';
import { AnnoncesModule } from './annonces/annonces.module';
import { AnnonceCategoryModule } from './annonce-category/annonce-category.module';
import { AnnonceAmenityModule } from './annonce-amenity/annonce-amenity.module';
import { AnnonceTypeModule } from './annonce-type/annonce-type.module';
import { AppointmentAnnonceModule } from './appointment-annonce/appointment-annonce.module';
import { PushModule } from './push/push.module';
import { NotificationModule } from './notification/notification.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.register({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, }),
    PrismaModule,
    UtilsModule,
    WalletModule,
    UserModule,
    SecurityModule,
    CategoryModule,
    IconeModule,
    MyServicesModule,
    AllCategoriesModule,
    ProductModule,
    AppointmentModule,
    HistoryModule,
    AnnoncesModule,
    AnnonceCategoryModule,
    AnnonceAmenityModule,
    AnnonceTypeModule,
    AppointmentAnnonceModule,
    PushModule,
    NotificationModule,
  ],
})
export class AppModule {}
