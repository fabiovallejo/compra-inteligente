"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "./validation";
import { verifyPassword } from "./password";
import { createDatabaseSession, destroyCurrentSession } from "./session";

export interface LoginActionState {
  message?: string;
  fieldErrors?: {
    username?: string[];
    password?: string[];
  };
}

const invalidCredentialsMessage = "Usuario o contrasena incorrectos.";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: {
      id: true,
      passwordHash: true,
      active: true,
    },
  });

  if (!user) {
    return { message: invalidCredentialsMessage };
  }

  if (!user.active) {
    return { message: "Tu usuario esta inactivo. Contacta a un administrador." };
  }

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return { message: invalidCredentialsMessage };
  }

  await createDatabaseSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/login");
}
