import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Ingresa tu usuario.")
    .max(80, "El usuario no debe superar 80 caracteres."),
  password: z
    .string()
    .min(1, "Ingresa tu contrasena.")
    .max(200, "La contrasena no debe superar 200 caracteres."),
});

export type LoginInput = z.infer<typeof loginSchema>;
