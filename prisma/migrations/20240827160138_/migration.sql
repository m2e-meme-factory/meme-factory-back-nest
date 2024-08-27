-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_fromUserId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "fromUserId" DROP NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'PAYMENT';

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
