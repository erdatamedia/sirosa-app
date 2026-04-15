-- CreateEnum
CREATE TYPE "MilkSession" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateTable
CREATE TABLE "milk_productions" (
    "id" TEXT NOT NULL,
    "cowId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "session" "MilkSession" NOT NULL DEFAULT 'MORNING',
    "amount" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milk_productions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "milk_productions" ADD CONSTRAINT "milk_productions_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "cows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milk_productions" ADD CONSTRAINT "milk_productions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
