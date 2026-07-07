import {
  CapitalizationFrequency,
  CreditInput,
  Currency,
  GracePeriodType,
  RateType,
} from "@/domain/finance";
import type { SimulationFormInput } from "./validation";

const capitalizationMap: Record<string, CapitalizationFrequency> = {
  ANNUAL: CapitalizationFrequency.Annual,
  SEMIANNUAL: CapitalizationFrequency.Semiannual,
  QUARTERLY: CapitalizationFrequency.Quarterly,
  BIMONTHLY: CapitalizationFrequency.Bimonthly,
  MONTHLY: CapitalizationFrequency.Monthly,
  DAILY_360: CapitalizationFrequency.Daily360,
};

export function simulationToCreditInput(data: SimulationFormInput): CreditInput {
  const gracePeriods: CreditInput["gracePeriods"] = [];

  if (data.totalGraceEnabled && data.totalGraceFrom && data.totalGraceTo) {
    gracePeriods.push({
      type: GracePeriodType.Total,
      startPeriod: data.totalGraceFrom,
      endPeriod: data.totalGraceTo,
    });
  }

  if (data.partialGraceEnabled && data.partialGraceFrom && data.partialGraceTo) {
    gracePeriods.push({
      type: GracePeriodType.Partial,
      startPeriod: data.partialGraceFrom,
      endPeriod: data.partialGraceTo,
    });
  }

  return {
    currency: data.currency === "PEN" ? Currency.PEN : Currency.USD,
    vehiclePrice: data.vehiclePrice,
    downPaymentRate: data.downPaymentRate,
    residualValueRate: data.residualValueRate,
    termMonths: data.termMonths,
    rateType:
      data.rateType === "EFFECTIVE_ANNUAL"
        ? RateType.EffectiveAnnual
        : RateType.NominalAnnual,
    annualRate: data.annualRate,
    capitalizationFrequency: data.capitalizationFrequency
      ? capitalizationMap[data.capitalizationFrequency]
      : undefined,
    gracePeriods,
    debtReliefInsuranceMonthlyRate: data.debtReliefInsuranceMonthlyRate,
    vehicleInsuranceMonthlyRate: data.vehicleInsuranceMonthlyRate,
    periodicCommission: data.periodicCommission,
    itfRate: data.itfRate,
    annualDiscountRate: data.annualDiscountRate,
  };
}
