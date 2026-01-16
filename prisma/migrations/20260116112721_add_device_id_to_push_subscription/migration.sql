/*
  Warnings:

  - Added the required column `deviceId` to the `PushSubscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "deviceId" TEXT NOT NULL;
