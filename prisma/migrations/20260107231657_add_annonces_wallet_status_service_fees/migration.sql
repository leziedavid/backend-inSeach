-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "expiration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportFeeCents" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "annonces" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "rooms" INTEGER NOT NULL DEFAULT 1,
    "beds" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "certifiedAt" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "expiration" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT NOT NULL,
    "providerId" TEXT,
    "gpsLocation" JSONB,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonce_categories" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annonce_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonce_amenities" (
    "id" TEXT NOT NULL,
    "annonceId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonce_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonce_reviews" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "annonceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annonce_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "annonce_categories_value_key" ON "annonce_categories"("value");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_label_key" ON "amenities"("label");

-- CreateIndex
CREATE UNIQUE INDEX "annonce_amenities_annonceId_amenityId_key" ON "annonce_amenities"("annonceId", "amenityId");

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "annonce_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonce_amenities" ADD CONSTRAINT "annonce_amenities_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonce_amenities" ADD CONSTRAINT "annonce_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonce_reviews" ADD CONSTRAINT "annonce_reviews_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
