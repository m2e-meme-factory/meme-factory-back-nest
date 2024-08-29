-- CreateTable
CREATE TABLE "AutoTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "url" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AutoTask" ADD CONSTRAINT "AutoTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;
