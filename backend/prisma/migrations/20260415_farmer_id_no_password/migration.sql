-- AlterTable: make email and password optional, add farmerId
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "farmerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_farmerId_key" ON "users"("farmerId");
