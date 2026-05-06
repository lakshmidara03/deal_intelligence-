-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'AT_RISK');

-- CreateEnum
CREATE TYPE "DealHealth" AS ENUM ('HEALTHY', 'AT_RISK', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE');

-- CreateEnum
CREATE TYPE "DriverImpact" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "stage" "DealStage" NOT NULL,
    "closeDate" TIMESTAMP(3) NOT NULL,
    "health" "DealHealth" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "healthExplanation" TEXT,
    "recommendedAction" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'Medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDriver" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" "DriverImpact" NOT NULL,

    CONSTRAINT "DealDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealInsight" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_dealId_idx" ON "Activity"("dealId");

-- CreateIndex
CREATE INDEX "DealDriver_dealId_idx" ON "DealDriver"("dealId");

-- CreateIndex
CREATE INDEX "DealInsight_dealId_idx" ON "DealInsight"("dealId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDriver" ADD CONSTRAINT "DealDriver_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealInsight" ADD CONSTRAINT "DealInsight_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
