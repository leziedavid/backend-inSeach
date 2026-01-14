-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_serviceId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "annonceId" TEXT,
ADD COLUMN     "departureDate" TIMESTAMP(3),
ADD COLUMN     "entryDate" TIMESTAMP(3),
ADD COLUMN     "nights" INTEGER,
ALTER COLUMN "serviceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "annonces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
