import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().positive().default(12),
});

export type AppEnv = z.infer<typeof envSchema>;
