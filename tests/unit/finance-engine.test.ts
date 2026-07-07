import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  calculateBalloonPayment,
  calculateCredit,
  calculateFinancedAmount,
  calculateFrenchPaymentWithFutureValue,
  CapitalizationFrequency,
  Currency,
  effectiveAnnualRateToMonthly,
  GracePeriodType,
  nominalAnnualRateToMonthly,
  PaymentPeriodType,
  RateType,
} from "@/domain/finance";

function expectClose(actual: Decimal, expected: string, tolerance: string) {
  expect(actual.minus(expected).abs().lte(tolerance)).toBe(true);
}

describe("finance engine", () => {
  it("converts percentages and builds case 1 without grace periods", () => {
    const monthlyRate = effectiveAnnualRateToMonthly("15");
    const financedAmount = calculateFinancedAmount("70000", "20");
    const balloonPayment = calculateBalloonPayment("70000", "50");
    const basePayment = calculateFrenchPaymentWithFutureValue(
      financedAmount,
      balloonPayment,
      monthlyRate,
      36,
    );

    const result = calculateCredit({
      currency: Currency.PEN,
      vehiclePrice: "70000",
      downPaymentRate: "20",
      residualValueRate: "50",
      termMonths: 36,
      rateType: RateType.EffectiveAnnual,
      annualRate: "15",
      debtReliefInsuranceMonthlyRate: "0.05",
      vehicleInsuranceMonthlyRate: "0.08",
      periodicCommission: "5",
      itfRate: "0.005",
      annualDiscountRate: "10",
    });

    expectClose(monthlyRate.mul(100), "1.171491692", "0.000000001");
    expectClose(financedAmount, "56000", "0.0000000001");
    expectClose(balloonPayment, "35000", "0.0000000001");
    expectClose(basePayment, "1128.3430", "0.0001");
    expectClose(result.monthlyEffectiveRate.mul(100), "1.171491692", "0.000000001");
    expectClose(result.schedule[0].basePayment, "1128.3430", "0.0001");
    expectClose(result.indicators.totalInterest, "19620.3485", "0.0001");
    expectClose(result.indicators.totalPaid, "78657.6899", "0.0001");
    expectClose(result.indicators.netPresentValue, "-8123.7625", "0.0001");
    expectClose(result.indicators.monthlyIrr.mul(100), "1.35051771", "0.00000001");
    expectClose(result.indicators.tcea.mul(100), "17.46585862", "0.00000001");
    expect(result.cashFlows[0].gt(0)).toBe(true);
    expect(result.cashFlows.slice(1).every((cashFlow) => cashFlow.lte(0))).toBe(true);
    expect(result.schedule.at(-1)?.closingBalance.isZero()).toBe(true);
  });

  it("builds case 2 with total and partial grace periods", () => {
    const result = calculateCredit({
      currency: Currency.USD,
      vehiclePrice: "25000",
      downPaymentRate: "20",
      residualValueRate: "45",
      termMonths: 24,
      rateType: RateType.EffectiveAnnual,
      annualRate: "12",
      gracePeriods: [
        { type: GracePeriodType.Total, startPeriod: 1, endPeriod: 2 },
        { type: GracePeriodType.Partial, startPeriod: 3, endPeriod: 4 },
      ],
      debtReliefInsuranceMonthlyRate: "0.04",
      vehicleInsuranceMonthlyRate: "0.07",
      periodicCommission: "3",
      itfRate: "0.005",
      annualDiscountRate: "9",
    });

    expectClose(result.monthlyEffectiveRate.mul(100), "0.948879293", "0.000000001");
    expectClose(result.financedAmount, "20000", "0.0000000001");
    expectClose(result.balloonPayment, "11250", "0.0000000001");
    expect(result.schedule[0].periodType).toBe(PaymentPeriodType.TotalGrace);
    expect(result.schedule[0].totalPayment.isZero()).toBe(true);
    expect(result.schedule[0].charges.isZero()).toBe(true);
    expect(result.schedule[2].periodType).toBe(PaymentPeriodType.PartialGrace);
    expectClose(result.schedule[2].amortization, "0", "0.0000000001");
    expect(result.schedule[2].charges.gt(0)).toBe(true);
    expectClose(result.schedule[1].closingBalance, "20381.3525", "0.0001");
    expectClose(result.schedule[4].basePayment, "610.1650", "0.0001");
    expectClose(result.indicators.totalInterest, "3840.0894", "0.0001");
    expectClose(result.indicators.totalPaid, "24438.1143", "0.0001");
    expectClose(result.indicators.netPresentValue, "-1396.2964", "0.0001");
    expectClose(result.indicators.monthlyIrr.mul(100), "1.09358657", "0.00000001");
    expectClose(result.indicators.tcea.mul(100), "13.94184703", "0.00000001");
    expect(result.schedule.at(-1)?.balloonPayment.eq("11250")).toBe(true);
    expect(result.schedule.at(-1)?.closingBalance.isZero()).toBe(true);
  });

  it("converts nominal annual rates with capitalization to monthly effective rates", () => {
    const monthlyRate = nominalAnnualRateToMonthly(
      "12",
      CapitalizationFrequency.Monthly,
    );

    expectClose(monthlyRate.mul(100), "1", "0.0000000001");
  });

  it("rejects overlapping grace ranges", () => {
    expect(() =>
      calculateCredit({
        currency: Currency.PEN,
        vehiclePrice: "70000",
        downPaymentRate: "20",
        termMonths: 12,
        rateType: RateType.EffectiveAnnual,
        annualRate: "15",
        gracePeriods: [
          { type: GracePeriodType.Total, startPeriod: 1, endPeriod: 3 },
          { type: GracePeriodType.Partial, startPeriod: 3, endPeriod: 4 },
        ],
        debtReliefInsuranceMonthlyRate: "0.05",
        vehicleInsuranceMonthlyRate: "0.08",
        periodicCommission: "5",
        itfRate: "0.005",
        annualDiscountRate: "10",
      }),
    ).toThrow("Los rangos de gracia no pueden superponerse.");
  });
});
