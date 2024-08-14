/*
  Warnings:

  - You are about to drop the `Application` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskResponse" DROP CONSTRAINT "TaskResponse_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskResponse" DROP CONSTRAINT "TaskResponse_userId_fkey";

-- DropTable
DROP TABLE "Application";

-- DropTable
DROP TABLE "TaskResponse";

-- DropEnum
DROP TYPE "ApplicationStatus";

-- DropEnum
DROP TYPE "ResponseStatus";

-- CreateTable
CREATE TABLE "ProgressProject" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventToProgressProject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressProject_userId_projectId_key" ON "ProgressProject"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "_EventToProgressProject_AB_unique" ON "_EventToProgressProject"("A", "B");

-- CreateIndex
CREATE INDEX "_EventToProgressProject_B_index" ON "_EventToProgressProject"("B");

-- AddForeignKey
ALTER TABLE "ProgressProject" ADD CONSTRAINT "ProgressProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressProject" ADD CONSTRAINT "ProgressProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToProgressProject" ADD CONSTRAINT "_EventToProgressProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToProgressProject" ADD CONSTRAINT "_EventToProgressProject_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgressProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
