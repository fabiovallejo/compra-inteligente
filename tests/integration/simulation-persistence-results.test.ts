import bcrypt from "bcrypt";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  Currency,
  PrismaClient,
  RateType,
  UserRole,
  VehicleCondition,
} from "@prisma/client";
import { persistSimulationCalculation } from "@/modules/simulations/persistence";
import type { SimulationFormInput } from "@/modules/simulations/validation";

const prisma = new PrismaClient();
const suffix = Date.now().toString();
let userId = "";
let clientId = "";
let vehicleId = "";
let productId = "";
let simulationId = "";

function dniFromSuffix() {
  return suffix.slice(-8).padStart(8, "2");
}

function vinFromSuffix() {
  return `9BWDE${suffix.slice(-6).padStart(6, "0")}RA0000`;
}

function baseInput(): SimulationFormInput {
  return {
    clientId,
    vehicleId,
    financialProductId: productId,
    currency: "PEN",
    vehiclePrice: "70000",
    downPaymentRate: "20",
    residualValueRate: "50",
    termMonths: 36,
    rateType: "EFFECTIVE_ANNUAL",
    annualRate: "15",
    capitalizationFrequency: "",
    totalGraceEnabled: true,
    totalGraceFrom: 1,
    totalGraceTo: 2,
    partialGraceEnabled: true,
    partialGraceFrom: 3,
    partialGraceTo: 4,
    debtReliefInsuranceMonthlyRate: "0.05",
    vehicleInsuranceMonthlyRate: "0.08",
    periodicCommission: "5",
    itfRate: "0.005",
    annualDiscountRate: "10",
    clientMonthlyIncome: "8500",
  };
}

describe("simulation persistence and results", () => {
  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        username: `simulation-${suffix}`,
        passwordHash: await bcrypt.hash("Temporal123!", 8),
        role: UserRole.ADMIN,
      },
    });
    userId = user.id;

    const client = await prisma.client.create({
      data: {
        dni: dniFromSuffix(),
        firstNames: "Simulacion",
        lastNames: "Resultados",
        email: `simulacion-${suffix}@example.com`,
        phone: "999222333",
        monthlyIncome: "8500.00000000",
        incomeCurrency: Currency.PEN,
      },
    });
    clientId = client.id;

    const vehicle = await prisma.vehicle.create({
      data: {
        vin: vinFromSuffix(),
        brand: "Toyota",
        model: "Corolla Cross",
        year: 2025,
        condition: VehicleCondition.NUEVO,
        price: "70000.00000000",
        currency: Currency.PEN,
      },
    });
    vehicleId = vehicle.id;

    const product = await prisma.financialProduct.create({
      data: {
        name: `Producto simulacion ${suffix}`,
        currency: Currency.PEN,
        defaultDownPaymentRate: "20.000000000000",
        defaultResidualValueRate: "50.000000000000",
        defaultTermMonths: 36,
        defaultRateType: RateType.EFFECTIVE_ANNUAL,
        defaultAnnualRate: "15.000000000000",
        cok: "10.000000000000",
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    if (simulationId) {
      await prisma.creditSimulation.deleteMany({ where: { id: simulationId } });
    }
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.financialProduct.deleteMany({ where: { id: productId } });
    await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("persists calculated results, full schedule and audit history", async () => {
    const created = await persistSimulationCalculation(prisma, {
      userId,
      data: baseInput(),
    });
    simulationId = created.simulation.id;

    const persisted = await prisma.creditSimulation.findUniqueOrThrow({
      where: { id: simulationId },
      include: {
        financialIndicator: true,
        paymentScheduleItems: { orderBy: { periodNumber: "asc" } },
        gracePeriods: true,
      },
    });
    const lastItem = persisted.paymentScheduleItems.at(-1);

    expect(persisted.paymentScheduleItems).toHaveLength(36);
    expect(persisted.gracePeriods).toHaveLength(2);
    expect(persisted.financialIndicator?.tcea.gt(0)).toBe(true);
    expect(persisted.financialIndicator?.totalCharges.gt(0)).toBe(true);
    expect(lastItem?.closingBalance.toNumber()).toBeCloseTo(0, 6);
    expect(lastItem?.balloonPayment.toNumber()).toBeCloseTo(35000, 2);
    expect(lastItem?.debtorCashFlow.lt(0)).toBe(true);

    const updated = await persistSimulationCalculation(prisma, {
      userId,
      simulationId,
      data: {
        ...baseInput(),
        termMonths: 24,
        residualValueRate: "45",
      },
    });

    const recalculated = await prisma.creditSimulation.findUniqueOrThrow({
      where: { id: updated.simulation.id },
      include: {
        financialIndicator: true,
        paymentScheduleItems: { orderBy: { periodNumber: "asc" } },
      },
    });
    const auditActions = await prisma.auditLog.findMany({
      where: { entity: "CreditSimulation", recordId: simulationId },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    });

    expect(recalculated.id).toBe(simulationId);
    expect(recalculated.paymentScheduleItems).toHaveLength(24);
    expect(recalculated.balloonPayment.toNumber()).toBeCloseTo(31500, 2);
    expect(recalculated.financialIndicator?.totalPaid.gt(0)).toBe(true);
    expect(auditActions.map((item) => item.action)).toEqual([
      "CREATE",
      "UPDATE",
    ]);
  });
});
