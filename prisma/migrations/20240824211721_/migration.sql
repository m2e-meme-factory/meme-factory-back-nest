/*
  Warnings:

  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'DEPOSIT', 'WITHDRAWAL', 'SYSTEM');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "type" "TransactionType" NOT NULL;