import { createHash, randomBytes } from "node:crypto";
import { SESSION_DURATION_MS } from "./constants";

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "./constants";

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionExpirationDate(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_DURATION_MS);
}
