"use server";

import { Prisma, VehicleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/log";
import { requireCurrentUser } from "@/server/auth/session";
import { vehicleFormDataToObject, vehicleSchema } from "./validation";

export interface VehicleActionState {
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function parseVehicleForm(formData: FormData): {
  ok: true;
  data: ReturnType<typeof vehicleSchema.parse>;
} | {
  ok: false;
  state: VehicleActionState;
} {
  const parsed = vehicleSchema.safeParse(vehicleFormDataToObject(formData));

  if (!parsed.success) {
    return {
      ok: false,
      state: {
        message: "Revisa los campos marcados.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  return { ok: true, data: parsed.data };
}

function duplicateVehicleMessage(error: unknown): VehicleActionState | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "Ya existe un vehiculo con ese VIN.",
    };
  }

  return null;
}

export async function createVehicleAction(
  _previousState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const user = await requireCurrentUser();
  const parsed = parseVehicleForm(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: parsed.data.vin,
        brand: parsed.data.brand,
        model: parsed.data.model,
        year: parsed.data.year,
        color: parsed.data.color,
        type: parsed.data.type,
        condition: parsed.data.condition,
        price: parsed.data.price,
        currency: parsed.data.currency,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Vehicle",
      recordId: vehicle.id,
      detail: { vin: vehicle.vin, brand: vehicle.brand, model: vehicle.model },
    });

    revalidatePath("/vehiculos");
    redirect(`/vehiculos/${vehicle.id}`);
  } catch (error) {
    const duplicate = duplicateVehicleMessage(error);

    if (duplicate) {
      return duplicate;
    }

    throw error;
  }
}

export async function updateVehicleAction(
  _previousState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const user = await requireCurrentUser();
  const vehicleId = String(formData.get("id") ?? "");
  const parsed = parseVehicleForm(formData);

  if (!vehicleId) {
    return { message: "No se encontro el vehiculo a editar." };
  }

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        vin: parsed.data.vin,
        brand: parsed.data.brand,
        model: parsed.data.model,
        year: parsed.data.year,
        color: parsed.data.color,
        type: parsed.data.type,
        condition: parsed.data.condition,
        price: parsed.data.price,
        currency: parsed.data.currency,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Vehicle",
      recordId: vehicle.id,
      detail: { vin: vehicle.vin, brand: vehicle.brand, model: vehicle.model },
    });

    revalidatePath("/vehiculos");
    revalidatePath(`/vehiculos/${vehicle.id}`);
    redirect(`/vehiculos/${vehicle.id}`);
  } catch (error) {
    const duplicate = duplicateVehicleMessage(error);

    if (duplicate) {
      return duplicate;
    }

    throw error;
  }
}

export async function deactivateVehicleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const vehicleId = String(formData.get("id") ?? "");

  if (!vehicleId) {
    return;
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: VehicleStatus.INACTIVE },
  });

  await writeAuditLog({
    userId: user.id,
    action: "DEACTIVATE",
    entity: "Vehicle",
    recordId: vehicle.id,
    detail: { vin: vehicle.vin },
  });

  revalidatePath("/vehiculos");
  revalidatePath(`/vehiculos/${vehicle.id}`);
}
