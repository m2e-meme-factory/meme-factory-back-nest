/*
  Warnings:

  - Added the required column `taskId` to the `AutoTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AutoTask" ADD COLUMN     "taskId" INTEGER NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;
