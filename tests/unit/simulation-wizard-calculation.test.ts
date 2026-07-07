import { describe, expect, it } from "vitest";
import { calculateCredit, PaymentPeriodType } from "@/domain/finance";
import { simulationToCreditInput } from "@/modules/simulations/mapper";
import {
  SimulationFormInput,
  simulationSchema,
} from "@/modules/simulations/validation";

const baseSimulation: SimulationFormInput = {
  clientId: "client-1",
  vehicleId: "vehicle-1",
  financialProductId: "product-1",
  currency: "PEN",
  vehiclePrice: "70000",
  downPaymentRate: "20",
  residualValueRate: "50",
  termMonths: 36,
  rateType: "EFFECTIVE_ANNUAL",
  annualRate: "15",
  capitalizationFrequency: "",
  totalGraceEnabled: false,
  totalGraceFrom: undefined,
  totalGraceTo: undefined,
  partialGraceEnabled: false,
  partialGraceFrom: undefined,
  partialGraceTo: undefined,
  debtReliefInsuranceMonthlyRate: "0.05",
  vehicleInsuranceMonthlyRate: "0.08",
  periodicCommission: "5",
  itfRate: "0.005",
  annualDiscountRate: "10",
  clientMonthlyIncome: "8500",
};

function calculate(input: SimulationFormInput) {
  const parsed = simulationSchema.parse(input);
  return calculateCredit(simulationToCreditInput(parsed));
}

describe("simulation wizard calculation scenarios", () => {
  it("calculates TEM from TEA", () => {
    const result = calculate(baseSimulation);

    expect(result.monthlyEffectiveRate.mul(100).toNumber()).toBeCloseTo(
      1.171491692,
      9,
    );
  });

  it("requires capitalization and calculates TEM from TNA", () => {
    const invalid = simulationSchema.safeParse({
      ...baseSimulation,
      rateType: "NOMINAL_ANNUAL",
      annualRate: "12",
      capitalizationFrequency: "",
    });
    const result = calculate({
      ...baseSimulation,
      rateType: "NOMINAL_ANNUAL",
      annualRate: "12",
      capitalizationFrequency: "MONTHLY",
    });

    expect(invalid.success).toBe(false);
    expect(result.monthlyEffectiveRate.mul(100).toNumber()).toBeCloseTo(1, 10);
  });

  it("rejects invalid down payment and residual percentages", () => {
    const invalid = simulationSchema.safeParse({
      ...baseSimulation,
      downPaymentRate: "100",
      residualValueRate: "0",
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      const errors = invalid.error.flatten().fieldErrors;
      expect(errors.downPaymentRate?.at(0)).toContain("menor que 100");
      expect(errors.residualValueRate?.at(0)).toContain("mayor que cero");
    }
  });

  it("supports total grace", () => {
    const result = calculate({
      ...baseSimulation,
      totalGraceEnabled: true,
      totalGraceFrom: 1,
      totalGraceTo: 2,
    });

    expect(result.schedule[0].periodType).toBe(PaymentPeriodType.TotalGrace);
    expect(result.schedule[0].totalPayment.isZero()).toBe(true);
    expect(result.schedule[0].closingBalance.gt(result.schedule[0].openingBalance)).toBe(true);
  });

  it("supports partial grace", () => {
    const result = calculate({
      ...baseSimulation,
      partialGraceEnabled: true,
      partialGraceFrom: 1,
      partialGraceTo: 2,
    });

    expect(result.schedule[0].periodType).toBe(PaymentPeriodType.PartialGrace);
    expect(result.schedule[0].amortization.isZero()).toBe(true);
    expect(result.schedule[0].totalPayment.gt(result.schedule[0].interest)).toBe(true);
  });

  it("supports total and partial grace when ranges do not overlap", () => {
    const result = calculate({
      ...baseSimulation,
      totalGraceEnabled: true,
      totalGraceFrom: 1,
      totalGraceTo: 2,
      partialGraceEnabled: true,
      partialGraceFrom: 3,
      partialGraceTo: 4,
    });
    const invalid = simulationSchema.safeParse({
      ...baseSimulation,
      totalGraceEnabled: true,
      totalGraceFrom: 1,
      totalGraceTo: 3,
      partialGraceEnabled: true,
      partialGraceFrom: 3,
      partialGraceTo: 4,
    });

    expect(result.schedule[0].periodType).toBe(PaymentPeriodType.TotalGrace);
    expect(result.schedule[2].periodType).toBe(PaymentPeriodType.PartialGrace);
    expect(invalid.success).toBe(false);
  });
});
