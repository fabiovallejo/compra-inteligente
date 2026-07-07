"use server";

import {
  CostCalculationBase,
  CostCalculationType,
  FinancialProductCostType,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/log";
import { requireCurrentUser } from "@/server/auth/session";
import { productFormDataToObject, productSchema } from "./validation";

export interface ProductActionState {
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function parseProductForm(formData: FormData) {
  const parsed = productSchema.safeParse(productFormDataToObject(formData));

  if (!parsed.success) {
    return {
      ok: false as const,
      state: {
        message: "Revisa los campos marcados.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  return { ok: true as const, data: parsed.data };
}

function duplicateProductMessage(error: unknown): ProductActionState | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return { message: "Ya existe un producto con ese nombre y moneda." };
  }

  return null;
}

function costRows(data: ReturnType<typeof productSchema.parse>) {
  return [
    {
      costType: FinancialProductCostType.DEBT_RELIEF_INSURANCE,
      calculationType: CostCalculationType.PERCENTAGE,
      rate: data.debtReliefInsuranceRate,
      fixedAmount: null,
      calculationBase: CostCalculationBase.BALANCE,
    },
    {
      costType: FinancialProductCostType.VEHICLE_INSURANCE,
      calculationType: CostCalculationType.PERCENTAGE,
      rate: data.vehicleInsuranceRate,
      fixedAmount: null,
      calculationBase: CostCalculationBase.VEHICLE_PRICE,
    },
    {
      costType: FinancialProductCostType.PERIODIC_COMMISSION,
      calculationType: CostCalculationType.FIXED_AMOUNT,
      rate: null,
      fixedAmount: data.periodicCommission,
      calculationBase: CostCalculationBase.FIXED,
    },
    {
      costType: FinancialProductCostType.ITF,
      calculationType: CostCalculationType.PERCENTAGE,
      rate: data.itfRate,
      fixedAmount: null,
      calculationBase: CostCalculationBase.PAYMENT_AMOUNT,
    },
  ];
}

export async function createProductAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const user = await requireCurrentUser();
  const parsed = parseProductForm(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const product = await prisma.financialProduct.create({
      data: {
        name: parsed.data.name,
        currency: parsed.data.currency,
        defaultDownPaymentRate: parsed.data.defaultDownPaymentRate,
        defaultResidualValueRate: parsed.data.defaultResidualValueRate,
        defaultTermMonths: parsed.data.defaultTermMonths,
        defaultRateType: parsed.data.defaultRateType,
        defaultAnnualRate: parsed.data.defaultAnnualRate,
        capitalization: parsed.data.capitalization || null,
        cok: parsed.data.cok,
        costs: { create: costRows(parsed.data) },
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "FinancialProduct",
      recordId: product.id,
      detail: { name: product.name, currency: product.currency },
    });

    revalidatePath("/productos-financieros");
    redirect(`/productos-financieros/${product.id}`);
  } catch (error) {
    const duplicate = duplicateProductMessage(error);
    if (duplicate) return duplicate;
    throw error;
  }
}

export async function updateProductAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const user = await requireCurrentUser();
  const productId = String(formData.get("id") ?? "");
  const parsed = parseProductForm(formData);

  if (!productId) {
    return { message: "No se encontro el producto a editar." };
  }

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.financialProduct.update({
        where: { id: productId },
        data: {
          name: parsed.data.name,
          currency: parsed.data.currency,
          defaultDownPaymentRate: parsed.data.defaultDownPaymentRate,
          defaultResidualValueRate: parsed.data.defaultResidualValueRate,
          defaultTermMonths: parsed.data.defaultTermMonths,
          defaultRateType: parsed.data.defaultRateType,
          defaultAnnualRate: parsed.data.defaultAnnualRate,
          capitalization: parsed.data.capitalization || null,
          cok: parsed.data.cok,
        },
      });

      for (const cost of costRows(parsed.data)) {
        await tx.financialProductCost.upsert({
          where: {
            productId_costType: {
              productId,
              costType: cost.costType,
            },
          },
          update: cost,
          create: { productId, ...cost },
        });
      }

      return updated;
    });

    await writeAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "FinancialProduct",
      recordId: product.id,
      detail: { name: product.name, currency: product.currency },
    });

    revalidatePath("/productos-financieros");
    revalidatePath(`/productos-financieros/${product.id}`);
    redirect(`/productos-financieros/${product.id}`);
  } catch (error) {
    const duplicate = duplicateProductMessage(error);
    if (duplicate) return duplicate;
    throw error;
  }
}

export async function deactivateProductAction(formData: FormData) {
  const user = await requireCurrentUser();
  const productId = String(formData.get("id") ?? "");

  if (!productId) return;

  const product = await prisma.financialProduct.update({
    where: { id: productId },
    data: { active: false },
  });

  await writeAuditLog({
    userId: user.id,
    action: "DEACTIVATE",
    entity: "FinancialProduct",
    recordId: product.id,
    detail: { name: product.name },
  });

  revalidatePath("/productos-financieros");
  revalidatePath(`/productos-financieros/${product.id}`);
}
