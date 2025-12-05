/*
  Warnings:

  - The values [COMPANY] on the enum `AccountType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Service` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountType_new" AS ENUM ('SELLER', 'INDIVIDUAL', 'ENTERPRISE');
ALTER TABLE "User" ALTER COLUMN "typeCompte" TYPE "AccountType_new" USING ("typeCompte"::text::"AccountType_new");
ALTER TYPE "AccountType" RENAME TO "AccountType_old";
ALTER TYPE "AccountType_new" RENAME TO "AccountType";
DROP TYPE "AccountType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "code" TEXT NOT NULL,
ALTER COLUMN "basePriceCents" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "completionPrice" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");
