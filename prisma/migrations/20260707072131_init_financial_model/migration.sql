-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('PEN', 'USD');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ADVISOR');

-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('EFFECTIVE_ANNUAL', 'NOMINAL_ANNUAL');

-- CreateEnum
CREATE TYPE "CapitalizationFrequency" AS ENUM ('ANNUAL', 'SEMIANNUAL', 'QUARTERLY', 'BIMONTHLY', 'MONTHLY', 'DAILY_360');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'FINANCED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FinancialProductCostType" AS ENUM ('DEBT_RELIEF_INSURANCE', 'VEHICLE_INSURANCE', 'PERIODIC_COMMISSION', 'ITF', 'OTHER');

-- CreateEnum
CREATE TYPE "CostCalculationType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "CostCalculationBase" AS ENUM ('BALANCE', 'VEHICLE_PRICE', 'PAYMENT_AMOUNT', 'FINANCED_AMOUNT', 'FIXED');

-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GracePeriodType" AS ENUM ('TOTAL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PaymentPeriodType" AS ENUM ('NORMAL', 'TOTAL_GRACE', 'PARTIAL_GRACE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADVISOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "firstNames" TEXT NOT NULL,
    "lastNames" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "birthDate" TIMESTAMP(3),
    "occupation" TEXT,
    "monthlyIncome" DECIMAL(18,8) NOT NULL,
    "incomeCurrency" "Currency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "type" TEXT,
    "condition" TEXT,
    "price" DECIMAL(18,8) NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "defaultDownPaymentRate" DECIMAL(18,12) NOT NULL,
    "defaultResidualValueRate" DECIMAL(18,12) NOT NULL,
    "defaultTermMonths" INTEGER NOT NULL,
    "defaultRateType" "RateType" NOT NULL,
    "defaultAnnualRate" DECIMAL(18,12) NOT NULL,
    "capitalization" "CapitalizationFrequency",
    "cok" DECIMAL(18,12) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialProductCost" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "costType" "FinancialProductCostType" NOT NULL,
    "calculationType" "CostCalculationType" NOT NULL,
    "rate" DECIMAL(18,12),
    "fixedAmount" DECIMAL(18,8),
    "calculationBase" "CostCalculationBase" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialProductCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditSimulation" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "financialProductId" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "calculatedMonthlyEffectiveRate" DECIMAL(18,12) NOT NULL,
    "financedAmount" DECIMAL(18,8) NOT NULL,
    "balloonPayment" DECIMAL(18,8) NOT NULL,
    "basePayment" DECIMAL(18,8) NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'CALCULATED',
    "simulatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GracePeriod" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "type" "GracePeriodType" NOT NULL,
    "periodFrom" INTEGER NOT NULL,
    "periodTo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GracePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentScheduleItem" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "periodType" "PaymentPeriodType" NOT NULL,
    "openingBalance" DECIMAL(18,8) NOT NULL,
    "interest" DECIMAL(18,8) NOT NULL,
    "basePayment" DECIMAL(18,8) NOT NULL,
    "amortization" DECIMAL(18,8) NOT NULL,
    "debtReliefInsurance" DECIMAL(18,8) NOT NULL,
    "vehicleInsurance" DECIMAL(18,8) NOT NULL,
    "commission" DECIMAL(18,8) NOT NULL,
    "itf" DECIMAL(18,8) NOT NULL,
    "balloonPayment" DECIMAL(18,8) NOT NULL,
    "totalPayment" DECIMAL(18,8) NOT NULL,
    "closingBalance" DECIMAL(18,8) NOT NULL,
    "debtorCashFlow" DECIMAL(18,8) NOT NULL,

    CONSTRAINT "PaymentScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialIndicator" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "netPresentValue" DECIMAL(18,8) NOT NULL,
    "monthlyIrr" DECIMAL(18,12) NOT NULL,
    "annualIrr" DECIMAL(18,12) NOT NULL,
    "tcea" DECIMAL(18,12) NOT NULL,
    "totalInterest" DECIMAL(18,8) NOT NULL,
    "totalCharges" DECIMAL(18,8) NOT NULL,
    "totalPaid" DECIMAL(18,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Client_dni_key" ON "Client"("dni");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_lastNames_firstNames_idx" ON "Client"("lastNames", "firstNames");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_brand_model_idx" ON "Vehicle"("brand", "model");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_currency_idx" ON "Vehicle"("currency");

-- CreateIndex
CREATE INDEX "FinancialProduct_currency_active_idx" ON "FinancialProduct"("currency", "active");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialProduct_name_currency_key" ON "FinancialProduct"("name", "currency");

-- CreateIndex
CREATE INDEX "FinancialProductCost_productId_idx" ON "FinancialProductCost"("productId");

-- CreateIndex
CREATE INDEX "FinancialProductCost_costType_idx" ON "FinancialProductCost"("costType");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialProductCost_productId_costType_key" ON "FinancialProductCost"("productId", "costType");

-- CreateIndex
CREATE INDEX "CreditSimulation_createdByUserId_idx" ON "CreditSimulation"("createdByUserId");

-- CreateIndex
CREATE INDEX "CreditSimulation_clientId_idx" ON "CreditSimulation"("clientId");

-- CreateIndex
CREATE INDEX "CreditSimulation_vehicleId_idx" ON "CreditSimulation"("vehicleId");

-- CreateIndex
CREATE INDEX "CreditSimulation_financialProductId_idx" ON "CreditSimulation"("financialProductId");

-- CreateIndex
CREATE INDEX "CreditSimulation_status_idx" ON "CreditSimulation"("status");

-- CreateIndex
CREATE INDEX "CreditSimulation_simulatedAt_idx" ON "CreditSimulation"("simulatedAt");

-- CreateIndex
CREATE INDEX "GracePeriod_simulationId_idx" ON "GracePeriod"("simulationId");

-- CreateIndex
CREATE UNIQUE INDEX "GracePeriod_simulationId_periodFrom_periodTo_key" ON "GracePeriod"("simulationId", "periodFrom", "periodTo");

-- CreateIndex
CREATE INDEX "PaymentScheduleItem_simulationId_idx" ON "PaymentScheduleItem"("simulationId");

-- CreateIndex
CREATE INDEX "PaymentScheduleItem_periodType_idx" ON "PaymentScheduleItem"("periodType");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentScheduleItem_simulationId_periodNumber_key" ON "PaymentScheduleItem"("simulationId", "periodNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialIndicator_simulationId_key" ON "FinancialIndicator"("simulationId");

-- CreateIndex
CREATE INDEX "FinancialIndicator_createdAt_idx" ON "FinancialIndicator"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_recordId_idx" ON "AuditLog"("entity", "recordId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialProductCost" ADD CONSTRAINT "FinancialProductCost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinancialProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditSimulation" ADD CONSTRAINT "CreditSimulation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditSimulation" ADD CONSTRAINT "CreditSimulation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditSimulation" ADD CONSTRAINT "CreditSimulation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditSimulation" ADD CONSTRAINT "CreditSimulation_financialProductId_fkey" FOREIGN KEY ("financialProductId") REFERENCES "FinancialProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GracePeriod" ADD CONSTRAINT "GracePeriod_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "CreditSimulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentScheduleItem" ADD CONSTRAINT "PaymentScheduleItem_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "CreditSimulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialIndicator" ADD CONSTRAINT "FinancialIndicator_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "CreditSimulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
