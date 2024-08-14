/*
  Warnings:

  - You are about to drop the `_EventToProgressProject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_EventToProgressProject" DROP CONSTRAINT "_EventToProgressProject_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventToProgressProject" DROP CONSTRAINT "_EventToProgressProject_B_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "progressProjectId" INTEGER;

-- DropTable
DROP TABLE "_EventToProgressProject";

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_progressProjectId_fkey" FOREIGN KEY ("progressProjectId") REFERENCES "ProgressProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
