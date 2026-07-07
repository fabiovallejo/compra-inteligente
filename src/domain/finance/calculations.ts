import Decimal from "decimal.js";
import {
  CapitalizationFrequency,
  CreditCalculationResult,
  CreditInput,
  DecimalInput,
  FinancialIndicators,
  GracePeriod,
  GracePeriodType,
  PaymentPeriodType,
  RateType,
  ScheduleItem,
} from "./types";

Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

const DEFAULT_BALLOON_PERCENT = new Decimal(50);
const ONE = new Decimal(1);
const ZERO = new Decimal(0);

export function toDecimal(value: DecimalInput): Decimal {
  return new Decimal(value);
}

export function normalizePercentage(value: DecimalInput): Decimal {
  return toDecimal(value).div(100);
}

export function effectiveAnnualRateToMonthly(annualRate: DecimalInput): Decimal {
  const rate = normalizePercentage(annualRate);

  return ONE.plus(rate).pow(ONE.div(12)).minus(1);
}

export function nominalAnnualRateToMonthly(
  annualRate: DecimalInput,
  capitalizationFrequency: CapitalizationFrequency,
): Decimal {
  const rate = normalizePercentage(annualRate);
  const periodsPerYear = new Decimal(capitalizationFrequency);

  if (!periodsPerYear.isInteger() || periodsPerYear.lte(0)) {
    throw new Error("La frecuencia de capitalizacion debe ser mayor a cero.");
  }

  return ONE.plus(rate.div(periodsPerYear))
    .pow(periodsPerYear.div(12))
    .minus(1);
}

export function annualRateToMonthlyEffective(input: {
  rateType: RateType;
  annualRate: DecimalInput;
  capitalizationFrequency?: CapitalizationFrequency;
}): Decimal {
  if (input.rateType === RateType.EffectiveAnnual) {
    return effectiveAnnualRateToMonthly(input.annualRate);
  }

  if (!input.capitalizationFrequency) {
    throw new Error("La capitalizacion es obligatoria para tasas nominales.");
  }

  return nominalAnnualRateToMonthly(
    input.annualRate,
    input.capitalizationFrequency,
  );
}

export function calculateFinancedAmount(
  vehiclePrice: DecimalInput,
  downPaymentRate: DecimalInput,
): Decimal {
  const price = toDecimal(vehiclePrice);
  const initialRate = normalizePercentage(downPaymentRate);

  return price.mul(ONE.minus(initialRate));
}

export function calculateBalloonPayment(
  vehiclePrice: DecimalInput,
  residualValueRate: DecimalInput = DEFAULT_BALLOON_PERCENT,
): Decimal {
  return toDecimal(vehiclePrice).mul(normalizePercentage(residualValueRate));
}

export function calculateFrenchPaymentWithFutureValue(
  principal: DecimalInput,
  futureValue: DecimalInput,
  monthlyRate: DecimalInput,
  periods: number,
): Decimal {
  const presentValue = toDecimal(principal);
  const balloonPayment = toDecimal(futureValue);
  const rate = toDecimal(monthlyRate);
  const term = new Decimal(periods);

  if (!term.isInteger() || term.lte(0)) {
    throw new Error("El numero de periodos debe ser mayor a cero.");
  }

  if (rate.isZero()) {
    return presentValue.minus(balloonPayment).div(term);
  }

  const compound = ONE.plus(rate);
  const discountedFutureValue = balloonPayment.div(compound.pow(term));
  const annuityFactor = ONE.minus(compound.pow(term.neg()));

  return presentValue.minus(discountedFutureValue).mul(rate.div(annuityFactor));
}

export function calculateNetPresentValue(
  cashFlows: DecimalInput[],
  monthlyDiscountRate: DecimalInput,
): Decimal {
  const discountRate = toDecimal(monthlyDiscountRate);

  return cashFlows.reduce<Decimal>((netPresentValue, cashFlow, period) => {
    return netPresentValue.plus(
      toDecimal(cashFlow).div(ONE.plus(discountRate).pow(period)),
    );
  }, ZERO);
}

export function calculateMonthlyIrr(cashFlows: DecimalInput[]): Decimal {
  const flows = cashFlows.map(toDecimal);
  const hasPositive = flows.some((cashFlow) => cashFlow.gt(0));
  const hasNegative = flows.some((cashFlow) => cashFlow.lt(0));

  if (!hasPositive || !hasNegative) {
    throw new Error("La TIR requiere al menos un flujo positivo y uno negativo.");
  }

  let lowerBound = new Decimal("-0.999999999999");
  let upperBound = new Decimal(1);
  let lowerValue = calculateNetPresentValue(flows, lowerBound);
  let upperValue = calculateNetPresentValue(flows, upperBound);
  let expansions = 0;

  while (lowerValue.mul(upperValue).gt(0) && expansions < 100) {
    upperBound = upperBound.mul(2);
    upperValue = calculateNetPresentValue(flows, upperBound);
    expansions += 1;
  }

  if (lowerValue.mul(upperValue).gt(0)) {
    throw new Error("No se encontro un intervalo valido para calcular la TIR.");
  }

  for (let iteration = 0; iteration < 300; iteration += 1) {
    const midpoint = lowerBound.plus(upperBound).div(2);
    const midpointValue = calculateNetPresentValue(flows, midpoint);

    if (midpointValue.abs().lt("1e-30")) {
      return midpoint;
    }

    if (lowerValue.mul(midpointValue).lte(0)) {
      upperBound = midpoint;
      upperValue = midpointValue;
    } else {
      lowerBound = midpoint;
      lowerValue = midpointValue;
    }

    if (upperBound.minus(lowerBound).abs().lt("1e-30")) {
      return lowerBound.plus(upperBound).div(2);
    }
  }

  return lowerBound.plus(upperBound).div(2);
}

export function calculateAnnualRateFromMonthly(
  monthlyRate: DecimalInput,
): Decimal {
  return ONE.plus(toDecimal(monthlyRate)).pow(12).minus(1);
}

export function calculateFinancialIndicators(input: {
  cashFlows: DecimalInput[];
  monthlyDiscountRate: DecimalInput;
  totalInterest: DecimalInput;
  totalPaid: DecimalInput;
}): FinancialIndicators {
  const monthlyIrr = calculateMonthlyIrr(input.cashFlows);
  const annualIrr = calculateAnnualRateFromMonthly(monthlyIrr);

  return {
    netPresentValue: calculateNetPresentValue(
      input.cashFlows,
      input.monthlyDiscountRate,
    ),
    monthlyIrr,
    annualIrr,
    tcea: annualIrr,
    totalInterest: toDecimal(input.totalInterest),
    totalPaid: toDecimal(input.totalPaid),
  };
}

export function calculateCredit(input: CreditInput): CreditCalculationResult {
  validateCreditInput(input);

  const vehiclePrice = toDecimal(input.vehiclePrice);
  const residualValueRate = input.residualValueRate ?? DEFAULT_BALLOON_PERCENT;
  const financedAmount = calculateFinancedAmount(
    vehiclePrice,
    input.downPaymentRate,
  );
  const downPayment = vehiclePrice.minus(financedAmount);
  const balloonPayment = calculateBalloonPayment(vehiclePrice, residualValueRate);
  const monthlyEffectiveRate = annualRateToMonthlyEffective(input);
  const monthlyDiscountRate = effectiveAnnualRateToMonthly(
    input.annualDiscountRate,
  );
  const debtReliefInsuranceRate = normalizePercentage(
    input.debtReliefInsuranceMonthlyRate,
  );
  const vehicleInsuranceRate = normalizePercentage(
    input.vehicleInsuranceMonthlyRate,
  );
  const itfRate = normalizePercentage(input.itfRate);
  const periodicCommission = toDecimal(input.periodicCommission);
  const gracePeriods = input.gracePeriods ?? [];
  const periodTypes = buildPeriodTypes(input.termMonths, gracePeriods);
  const schedule: ScheduleItem[] = [];
  const cashFlows: Decimal[] = [financedAmount];
  let balance = financedAmount;
  let totalInterest = ZERO;
  let totalPaid = ZERO;

  for (let period = 1; period <= input.termMonths; period += 1) {
    const periodType = periodTypes[period] ?? PaymentPeriodType.Normal;
    const openingBalance = balance;
    const interest = openingBalance.mul(monthlyEffectiveRate);
    let basePayment = ZERO;
    let amortization = ZERO;
    let balloonPaid = ZERO;
    let closingBalance = openingBalance;

    if (periodType === PaymentPeriodType.TotalGrace) {
      closingBalance = openingBalance.plus(interest);
    } else if (periodType === PaymentPeriodType.PartialGrace) {
      basePayment = interest;
    } else {
      const remainingNormalPeriods = countRemainingNormalPeriods(
        periodTypes,
        period,
        input.termMonths,
      );
      basePayment = calculateFrenchPaymentWithFutureValue(
        openingBalance,
        balloonPayment,
        monthlyEffectiveRate,
        remainingNormalPeriods,
      );
      amortization = basePayment.minus(interest);
      closingBalance = openingBalance.minus(amortization);

      if (period === input.termMonths) {
        balloonPaid = balloonPayment;
        amortization = amortization.plus(balloonPaid);
        closingBalance = ZERO;
      }
    }

    const chargesApply = periodType !== PaymentPeriodType.TotalGrace;
    const debtReliefInsurance = chargesApply
      ? openingBalance.mul(debtReliefInsuranceRate)
      : ZERO;
    const vehicleInsurance = chargesApply
      ? vehiclePrice.mul(vehicleInsuranceRate)
      : ZERO;
    const commission = chargesApply ? periodicCommission : ZERO;
    const charges = debtReliefInsurance.plus(vehicleInsurance).plus(commission);
    const itf = chargesApply
      ? basePayment.plus(balloonPaid).plus(charges).mul(itfRate)
      : ZERO;
    const totalPayment = basePayment.plus(balloonPaid).plus(charges).plus(itf);
    const debtorCashFlow = totalPayment.neg();

    totalInterest = totalInterest.plus(interest);
    totalPaid = totalPaid.plus(totalPayment);
    cashFlows.push(debtorCashFlow);

    schedule.push({
      period,
      periodType,
      openingBalance,
      interest,
      basePayment,
      amortization,
      balloonPayment: balloonPaid,
      debtReliefInsurance,
      vehicleInsurance,
      periodicCommission: commission,
      charges,
      itf,
      totalPayment,
      closingBalance,
      debtorCashFlow,
    });

    balance = closingBalance;
  }

  const indicators = calculateFinancialIndicators({
    cashFlows,
    monthlyDiscountRate,
    totalInterest,
    totalPaid,
  });

  return {
    currency: input.currency,
    monthlyEffectiveRate,
    monthlyDiscountRate,
    financedAmount,
    downPayment,
    balloonPayment,
    cashFlows,
    schedule,
    indicators,
  };
}

function validateCreditInput(input: CreditInput): void {
  if (!Number.isInteger(input.termMonths) || input.termMonths <= 0) {
    throw new Error("El plazo debe ser un entero mayor a cero.");
  }

  if (
    input.rateType === RateType.NominalAnnual &&
    !input.capitalizationFrequency
  ) {
    throw new Error("La capitalizacion es obligatoria para tasas nominales.");
  }

  const gracePeriods = input.gracePeriods ?? [];
  const occupiedPeriods = new Set<number>();

  for (const gracePeriod of gracePeriods) {
    validateGracePeriod(gracePeriod, input.termMonths);

    if (gracePeriod.endPeriod === input.termMonths) {
      throw new Error("El ultimo periodo no puede ser de gracia.");
    }

    for (
      let period = gracePeriod.startPeriod;
      period <= gracePeriod.endPeriod;
      period += 1
    ) {
      if (occupiedPeriods.has(period)) {
        throw new Error("Los rangos de gracia no pueden superponerse.");
      }

      occupiedPeriods.add(period);
    }
  }
}

function validateGracePeriod(
  gracePeriod: GracePeriod,
  termMonths: number,
): void {
  if (
    !Number.isInteger(gracePeriod.startPeriod) ||
    !Number.isInteger(gracePeriod.endPeriod) ||
    gracePeriod.startPeriod < 1 ||
    gracePeriod.endPeriod < gracePeriod.startPeriod ||
    gracePeriod.endPeriod > termMonths
  ) {
    throw new Error("El rango de gracia es invalido.");
  }
}

function buildPeriodTypes(
  termMonths: number,
  gracePeriods: GracePeriod[],
): Record<number, PaymentPeriodType> {
  const periodTypes: Record<number, PaymentPeriodType> = {};

  for (const gracePeriod of gracePeriods) {
    const periodType =
      gracePeriod.type === GracePeriodType.Total
        ? PaymentPeriodType.TotalGrace
        : PaymentPeriodType.PartialGrace;

    for (
      let period = gracePeriod.startPeriod;
      period <= gracePeriod.endPeriod;
      period += 1
    ) {
      periodTypes[period] = periodType;
    }
  }

  for (let period = 1; period <= termMonths; period += 1) {
    periodTypes[period] ??= PaymentPeriodType.Normal;
  }

  return periodTypes;
}

function countRemainingNormalPeriods(
  periodTypes: Record<number, PaymentPeriodType>,
  currentPeriod: number,
  termMonths: number,
): number {
  let remainingPeriods = 0;

  for (let period = currentPeriod; period <= termMonths; period += 1) {
    if (periodTypes[period] === PaymentPeriodType.Normal) {
      remainingPeriods += 1;
    }
  }

  return remainingPeriods;
}
