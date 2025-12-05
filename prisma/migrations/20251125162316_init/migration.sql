-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROVIDER', 'CLIENT', 'SELLER', 'USER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('IMMEDIATE', 'ON_ARRIVAL', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('COMPANY', 'INDIVIDUAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('APPOINTMENT', 'ORDER', 'PRODUCT', 'MIXED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PROCESSING', 'READY', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "Icone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Icone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSubcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "serviceType" "ServiceType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "typeCompte" "AccountType" NOT NULL,
    "roles" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "companyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "location" JSONB NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubcategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "providerId" TEXT,
    "serviceType" "ServiceType" NOT NULL,
    "basePriceCents" INTEGER,
    "completionPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "location" JSONB NOT NULL,
    "iconId" TEXT,
    "categoryId" TEXT,
    "subcategoryId" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "clientId" TEXT,
    "transactionId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "time" TEXT,
    "durationMins" INTEGER,
    "priceCents" INTEGER,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "providerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "image" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentegeRating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stock" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "features" TEXT[],
    "seller" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "providerId" TEXT,
    "transactionId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "totalCents" INTEGER NOT NULL,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "walletId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "audioUrl" TEXT,
    "linkText" TEXT,
    "linkHref" TEXT,
    "isClickable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "rating" DOUBLE PRECISION,
    "reviews" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "image" TEXT NOT NULL,
    "isToday" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Slider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileManager" (
    "id" SERIAL NOT NULL,
    "fileCode" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileManager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_name_key" ON "ServiceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_transactionId_key" ON "Appointment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_slug_key" ON "SubCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_transactionId_key" ON "Order"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_appointmentId_key" ON "Rating"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FileManager_fileCode_key" ON "FileManager"("fileCode");

-- AddForeignKey
ALTER TABLE "ServiceSubcategory" ADD CONSTRAINT "ServiceSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCategory" ADD CONSTRAINT "UserCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCategory" ADD CONSTRAINT "UserCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubcategory" ADD CONSTRAINT "UserSubcategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubcategory" ADD CONSTRAINT "UserSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "ServiceSubcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "Icone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "ServiceSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
