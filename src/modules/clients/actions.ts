"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/log";
import { requireCurrentUser } from "@/server/auth/session";
import { clientFormDataToObject, clientSchema } from "./validation";

export interface ClientActionState {
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function parseClientForm(formData: FormData): {
  ok: true;
  data: ReturnType<typeof clientSchema.parse>;
} | {
  ok: false;
  state: ClientActionState;
} {
  const parsed = clientSchema.safeParse(clientFormDataToObject(formData));

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

function duplicateClientMessage(error: unknown): ClientActionState | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "Ya existe un cliente con ese DNI o correo.",
    };
  }

  return null;
}

export async function createClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const user = await requireCurrentUser();
  const parsed = parseClientForm(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const client = await prisma.client.create({
      data: {
        dni: parsed.data.dni,
        firstNames: parsed.data.firstNames,
        lastNames: parsed.data.lastNames,
        email: parsed.data.email,
        phone: parsed.data.phone,
        address: parsed.data.address,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : undefined,
        occupation: parsed.data.occupation,
        monthlyIncome: parsed.data.monthlyIncome,
        incomeCurrency: parsed.data.incomeCurrency,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Client",
      recordId: client.id,
      detail: { dni: client.dni, email: client.email },
    });

    revalidatePath("/clientes");
    redirect(`/clientes/${client.id}`);
  } catch (error) {
    const duplicate = duplicateClientMessage(error);

    if (duplicate) {
      return duplicate;
    }

    throw error;
  }
}

export async function updateClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const user = await requireCurrentUser();
  const clientId = String(formData.get("id") ?? "");
  const parsed = parseClientForm(formData);

  if (!clientId) {
    return { message: "No se encontro el cliente a editar." };
  }

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        dni: parsed.data.dni,
        firstNames: parsed.data.firstNames,
        lastNames: parsed.data.lastNames,
        email: parsed.data.email,
        phone: parsed.data.phone,
        address: parsed.data.address,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : null,
        occupation: parsed.data.occupation,
        monthlyIncome: parsed.data.monthlyIncome,
        incomeCurrency: parsed.data.incomeCurrency,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Client",
      recordId: client.id,
      detail: { dni: client.dni, email: client.email },
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${client.id}`);
    redirect(`/clientes/${client.id}`);
  } catch (error) {
    const duplicate = duplicateClientMessage(error);

    if (duplicate) {
      return duplicate;
    }

    throw error;
  }
}

export async function deactivateClientAction(formData: FormData) {
  const user = await requireCurrentUser();
  const clientId = String(formData.get("id") ?? "");

  if (!clientId) {
    return;
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { active: false },
  });

  await writeAuditLog({
    userId: user.id,
    action: "DEACTIVATE",
    entity: "Client",
    recordId: client.id,
    detail: { dni: client.dni },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${client.id}`);
}
