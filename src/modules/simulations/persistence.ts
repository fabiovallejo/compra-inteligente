import { Prisma, PrismaClient } from "@prisma/client";
import { calculateCredit } from "@/domain/finance";
import { simulationToCreditInput } from "./mapper";
import type { SimulationFormInput } from "./validation";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface PersistSimulationInput {
  userId: string;
  data: SimulationFormInput;
  simulationId?: string;
}

export async function persistSimulationCalculation(
  prisma: PrismaClient,
  input: PersistSimulationInput,
) {
  const result = calculateCredit(simulationToCreditInput(input.data));
  const basePayment =
    result.schedule.find((item) => item.basePayment.gt(0))?.basePayment ?? "0";
  const totalCharges = result.schedule.reduce(
    (total, item) => total.plus(item.charges).plus(item.itf),
    new Prisma.Decimal(0),
  );
  const snapshot = sanitizeForJson(input.data);

  const simulation = await prisma.$transaction(async (tx) => {
    const creditSimulation = input.simulationId
      ? await tx.creditSimulation.update({
          where: { id: input.simulationId },
          data: {
            clientId: input.data.clientId,
            vehicleId: input.data.vehicleId,
            financialProductId: input.data.financialProductId,
            inputSnapshot: snapshot,
            calculatedMonthlyEffectiveRate:
              result.monthlyEffectiveRate.toString(),
            financedAmount: result.financedAmount.toString(),
            balloonPayment: result.balloonPayment.toString(),
            basePayment: basePayment.toString(),
          },
        })
      : await tx.creditSimulation.create({
          data: {
            createdByUserId: input.userId,
            clientId: input.data.clientId,
            vehicleId: input.data.vehicleId,
            financialProductId: input.data.financialProductId,
            inputSnapshot: snapshot,
            calculatedMonthlyEffectiveRate:
              result.monthlyEffectiveRate.toString(),
            financedAmount: result.financedAmount.toString(),
            balloonPayment: result.balloonPayment.toString(),
            basePayment: basePayment.toString(),
          },
        });

    if (input.simulationId) {
      await clearSimulationDetails(tx, creditSimulation.id);
    }

    await createSimulationDetails(tx, creditSimulation.id, input.data, result, {
      totalCharges,
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: input.simulationId ? "UPDATE" : "CREATE",
        entity: "CreditSimulation",
        recordId: creditSimulation.id,
        detail: {
          clientId: input.data.clientId,
          vehicleId: input.data.vehicleId,
          financialProductId: input.data.financialProductId,
          recalculated: Boolean(input.simulationId),
        },
      },
    });

    return creditSimulation;
  });

  return { simulation, result, totalCharges };
}

async function clearSimulationDetails(
  tx: TransactionClient,
  simulationId: string,
) {
  await tx.paymentScheduleItem.deleteMany({ where: { simulationId } });
  await tx.gracePeriod.deleteMany({ where: { simulationId } });
  await tx.financialIndicator.deleteMany({ where: { simulationId } });
}

async function createSimulationDetails(
  tx: TransactionClient,
  simulationId: string,
  data: SimulationFormInput,
  result: ReturnType<typeof calculateCredit>,
  totals: { totalCharges: Prisma.Decimal },
) {
  if (data.totalGraceEnabled && data.totalGraceFrom && data.totalGraceTo) {
    await tx.gracePeriod.create({
      data: {
        simulationId,
        type: "TOTAL",
        periodFrom: data.totalGraceFrom,
        periodTo: data.totalGraceTo,
      },
    });
  }

  if (data.partialGraceEnabled && data.partialGraceFrom && data.partialGraceTo) {
    await tx.gracePeriod.create({
      data: {
        simulationId,
        type: "PARTIAL",
        periodFrom: data.partialGraceFrom,
        periodTo: data.partialGraceTo,
      },
    });
  }

  await tx.paymentScheduleItem.createMany({
    data: result.schedule.map((item) => ({
      simulationId,
      periodNumber: item.period,
      periodType: item.periodType,
      openingBalance: item.openingBalance.toString(),
      interest: item.interest.toString(),
      basePayment: item.basePayment.toString(),
      amortization: item.amortization.toString(),
      debtReliefInsurance: item.debtReliefInsurance.toString(),
      vehicleInsurance: item.vehicleInsurance.toString(),
      commission: item.periodicCommission.toString(),
      itf: item.itf.toString(),
      balloonPayment: item.balloonPayment.toString(),
      totalPayment: item.totalPayment.toString(),
      closingBalance: item.closingBalance.toString(),
      debtorCashFlow: item.debtorCashFlow.toString(),
    })),
  });

  await tx.financialIndicator.create({
    data: {
      simulationId,
      netPresentValue: result.indicators.netPresentValue.toString(),
      monthlyIrr: result.indicators.monthlyIrr.toString(),
      annualIrr: result.indicators.annualIrr.toString(),
      tcea: result.indicators.tcea.toString(),
      totalInterest: result.indicators.totalInterest.toString(),
      totalCharges: totals.totalCharges.toString(),
      totalPaid: result.indicators.totalPaid.toString(),
    },
  });
}

function sanitizeForJson(value: SimulationFormInput): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
