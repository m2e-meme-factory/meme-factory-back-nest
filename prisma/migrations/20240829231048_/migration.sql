/*
  Warnings:

  - Changed the type of `reward` on the `AutoTask` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AutoTask" DROP COLUMN "reward",
ADD COLUMN     "reward" DECIMAL(65,30) NOT NULL;
