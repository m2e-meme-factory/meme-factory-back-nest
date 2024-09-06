-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('creator', 'advertiser');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'moderation', 'published', 'not_accepted', 'closed');
