/*
  Warnings:

  - Changed the type of `userId` on the `AutoTask` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "AutoTask" DROP CONSTRAINT "AutoTask_userId_fkey";

-- AlterTable
ALTER TABLE "AutoTask" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "AutoTask" ADD CONSTRAINT "AutoTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
