import bcrypt from "bcrypt";
import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  getSessionExpirationDate,
  hashSessionToken,
} from "@/server/auth/tokens";
import { verifyPassword } from "@/server/auth/password";

describe("authentication helpers", () => {
  it("verifies passwords using bcrypt hashes", async () => {
    const password = "S3gura!2026";
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrecta", hash)).resolves.toBe(false);
  });

  it("creates opaque session tokens and stores only a hashable value", () => {
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);

    expect(token.length).toBeGreaterThan(32);
    expect(tokenHash).not.toBe(token);
    expect(tokenHash).toHaveLength(64);
    expect(hashSessionToken(token)).toBe(tokenHash);
  });

  it("sets session expiration in the future", () => {
    const now = new Date("2026-07-07T12:00:00.000Z");
    const expiresAt = getSessionExpirationDate(now);

    expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
  });
});
