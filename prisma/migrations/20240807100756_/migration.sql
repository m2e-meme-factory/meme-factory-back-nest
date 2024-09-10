-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'moderation', 'published', 'not_accepted', 'closed');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'draft';
