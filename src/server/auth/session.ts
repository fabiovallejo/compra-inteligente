import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionExpirationDate,
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "./tokens";

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: UserRole;
}

const secureCookie = process.env.NODE_ENV === "production";

export async function createDatabaseSession(userId: string): Promise<void> {
  const token = createSessionToken();
  const sessionToken = hashSessionToken(token);
  const expiresAt = getSessionExpirationDate();

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const sessionToken = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          active: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date() || !session.user.active) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
  };
}

export async function requireCurrentUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session
      .deleteMany({ where: { sessionToken: hashSessionToken(token) } })
      .catch(() => null);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
