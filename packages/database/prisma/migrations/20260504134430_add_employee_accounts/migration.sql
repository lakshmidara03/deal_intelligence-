-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "employeeId" TEXT;

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'EMPLOYEE',
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Deal_employeeId_idx" ON "Deal"("employeeId");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
