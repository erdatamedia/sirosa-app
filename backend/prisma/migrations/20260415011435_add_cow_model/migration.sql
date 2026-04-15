-- CreateEnum
CREATE TYPE "CowStatus" AS ENUM ('ACTIVE', 'DRY', 'CULLED');

-- CreateTable
CREATE TABLE "cows" (
    "id" TEXT NOT NULL,
    "earTag" TEXT NOT NULL,
    "name" TEXT,
    "birthDate" TIMESTAMP(3),
    "parity" INTEGER NOT NULL DEFAULT 1,
    "currentWeight" DOUBLE PRECISION,
    "currentBCS" DOUBLE PRECISION,
    "lactationMonth" INTEGER,
    "status" "CowStatus" NOT NULL DEFAULT 'ACTIVE',
    "farmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cows_earTag_key" ON "cows"("earTag");

-- AddForeignKey
ALTER TABLE "cows" ADD CONSTRAINT "cows_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
