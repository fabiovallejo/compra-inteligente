import type Decimal from "decimal.js";

export type DecimalInput = Decimal.Value;

export enum Currency {
  PEN = "PEN",
  USD = "USD",
}

export enum RateType {
  EffectiveAnnual = "EFFECTIVE_ANNUAL",
  NominalAnnual = "NOMINAL_ANNUAL",
}

export enum CapitalizationFrequency {
  Annual = 1,
  Semiannual = 2,
  Quarterly = 4,
  Bimonthly = 6,
  Monthly = 12,
  Daily360 = 360,
}

export enum GracePeriodType {
  Total = "TOTAL",
  Partial = "PARTIAL",
}

export enum PaymentPeriodType {
  Normal = "NORMAL",
  TotalGrace = "TOTAL_GRACE",
  PartialGrace = "PARTIAL_GRACE",
}

export interface GracePeriod {
  type: GracePeriodType;
  startPeriod: number;
  endPeriod: number;
}

export interface CreditInput {
  currency: Currency;
  vehiclePrice: DecimalInput;
  downPaymentRate: DecimalInput;
  residualValueRate?: DecimalInput;
  termMonths: number;
  rateType: RateType;
  annualRate: DecimalInput;
  capitalizationFrequency?: CapitalizationFrequency;
  gracePeriods?: GracePeriod[];
  debtReliefInsuranceMonthlyRate: DecimalInput;
  vehicleInsuranceMonthlyRate: DecimalInput;
  periodicCommission: DecimalInput;
  itfRate: DecimalInput;
  annualDiscountRate: DecimalInput;
}

export interface ScheduleItem {
  period: number;
  periodType: PaymentPeriodType;
  openingBalance: Decimal;
  interest: Decimal;
  basePayment: Decimal;
  amortization: Decimal;
  balloonPayment: Decimal;
  debtReliefInsurance: Decimal;
  vehicleInsurance: Decimal;
  periodicCommission: Decimal;
  charges: Decimal;
  itf: Decimal;
  totalPayment: Decimal;
  closingBalance: Decimal;
  debtorCashFlow: Decimal;
}

export interface FinancialIndicators {
  netPresentValue: Decimal;
  monthlyIrr: Decimal;
  annualIrr: Decimal;
  tcea: Decimal;
  totalInterest: Decimal;
  totalPaid: Decimal;
}

export interface CreditCalculationResult {
  currency: Currency;
  monthlyEffectiveRate: Decimal;
  monthlyDiscountRate: Decimal;
  financedAmount: Decimal;
  downPayment: Decimal;
  balloonPayment: Decimal;
  cashFlows: Decimal[];
  schedule: ScheduleItem[];
  indicators: FinancialIndicators;
}
