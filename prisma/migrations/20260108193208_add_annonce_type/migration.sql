/*
  Warnings:

  - Added the required column `typeId` to the `annonces` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "annonces" ADD COLUMN     "typeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "annonce_types" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annonce_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "annonce_types_label_key" ON "annonce_types"("label");

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "annonce_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
