"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/session";
import { persistSimulationCalculation } from "./persistence";
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

  const simulationId = String(formData.get("simulationId") ?? "") || undefined;
  const { simulation } = await persistSimulationCalculation(prisma, {
    userId: user.id,
    data: parsed.data,
    simulationId,
  });

  revalidatePath("/simulaciones");
  revalidatePath(`/simulaciones/${simulation.id}`);
  redirect(`/simulaciones/${simulation.id}`);
}
