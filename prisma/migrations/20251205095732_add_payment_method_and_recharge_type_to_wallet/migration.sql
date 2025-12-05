-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'MOBILE_MONEY',
ADD COLUMN     "rechargeType" TEXT NOT NULL DEFAULT 'WAVE';
