-- CreateTable
CREATE TABLE "prediction_histories" (
    "id" SERIAL NOT NULL,
    "model" TEXT NOT NULL,
    "parity" INTEGER,
    "ll" INTEGER NOT NULL,
    "bcs" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION,
    "result" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_histories_pkey" PRIMARY KEY ("id")
);
