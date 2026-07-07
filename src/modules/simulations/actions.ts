"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateCredit } from "@/domain/finance";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/log";
import { requireCurrentUser } from "@/server/auth/session";
import { simulationToCreditInput } from "./mapper";
import { simulationSchema } from "./validation";

export interface SaveSimulationState {
  message?: string;
}

export async function saveSimulationAction(
  _previousState: SaveSimulationState,
  formData: FormData,
): Promise<SaveSimulationState> {
  const user = await requireCurrentUser();
  const rawPayload = String(formData.get("payload") ?? "");
  let payload: unknown;

  try {
    payload = JSON.parse(rawPayload);
  } catch {
    return { message: "La simulacion enviada no es valida." };
  }

  const parsed = simulationSchema.safeParse(payload);

  if (!parsed.success) {
    return { message: "La simulacion tiene datos incompletos o invalidos." };
  }

  const result = calculateCredit(simulationToCreditInput(parsed.data));
  const basePayment =
    result.schedule.find((item) => item.basePayment.gt(0))?.basePayment ?? "0";
  const totalCharges = result.schedule.reduce(
    (total, item) => total.plus(item.charges).plus(item.itf),
    new Prisma.Decimal(0),
  );

  const simulation = await prisma.$transaction(async (tx) => {
    const created = await tx.creditSimulation.create({
      data: {
        createdByUserId: user.id,
        clientId: parsed.data.clientId,
        vehicleId: parsed.data.vehicleId,
        financialProductId: parsed.data.financialProductId,
        inputSnapshot: parsed.data,
        calculatedMonthlyEffectiveRate:
          result.monthlyEffectiveRate.toString(),
        financedAmount: result.financedAmount.toString(),
        balloonPayment: result.balloonPayment.toString(),
        basePayment: basePayment.toString(),
      },
    });

    if (parsed.data.totalGraceEnabled && parsed.data.totalGraceFrom && parsed.data.totalGraceTo) {
      await tx.gracePeriod.create({
        data: {
          simulationId: created.id,
          type: "TOTAL",
          periodFrom: parsed.data.totalGraceFrom,
          periodTo: parsed.data.totalGraceTo,
        },
      });
    }

    if (
      parsed.data.partialGraceEnabled &&
      parsed.data.partialGraceFrom &&
      parsed.data.partialGraceTo
    ) {
      await tx.gracePeriod.create({
        data: {
          simulationId: created.id,
          type: "PARTIAL",
          periodFrom: parsed.data.partialGraceFrom,
          periodTo: parsed.data.partialGraceTo,
        },
      });
    }

    await tx.paymentScheduleItem.createMany({
      data: result.schedule.map((item) => ({
        simulationId: created.id,
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
        simulationId: created.id,
        netPresentValue: result.indicators.netPresentValue.toString(),
        monthlyIrr: result.indicators.monthlyIrr.toString(),
        annualIrr: result.indicators.annualIrr.toString(),
        tcea: result.indicators.tcea.toString(),
        totalInterest: result.indicators.totalInterest.toString(),
        totalCharges: totalCharges.toString(),
        totalPaid: result.indicators.totalPaid.toString(),
      },
    });

    return created;
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "CreditSimulation",
    recordId: simulation.id,
    detail: {
      clientId: parsed.data.clientId,
      vehicleId: parsed.data.vehicleId,
      financialProductId: parsed.data.financialProductId,
    },
  });

  revalidatePath("/simulaciones");
  redirect(`/simulaciones/${simulation.id}`);
}
