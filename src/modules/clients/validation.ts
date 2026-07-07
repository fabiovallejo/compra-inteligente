import { z } from "zod";
import { isPositiveDecimal } from "@/modules/shared/decimal";

const phoneRegex = /^[0-9+()\-\s]{7,20}$/;

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const clientSchema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "El DNI debe tener exactamente 8 digitos."),
  firstNames: z.string().trim().min(1, "Ingresa los nombres."),
  lastNames: z.string().trim().min(1, "Ingresa los apellidos."),
  email: z.string().trim().email("Ingresa un correo valido."),
  phone: z
    .string()
    .trim()
    .min(1, "Ingresa un telefono.")
    .regex(phoneRegex, "Ingresa un telefono valido."),
  address: optionalText,
  birthDate: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .refine(
      (value) => value === undefined || !Number.isNaN(Date.parse(value)),
      "Ingresa una fecha valida.",
    )
    .optional(),
  occupation: optionalText,
  monthlyIncome: z
    .string()
    .trim()
    .refine(isPositiveDecimal, "El ingreso mensual debe ser mayor que cero."),
  incomeCurrency: z.enum(["PEN", "USD"], {
    error: "Selecciona una moneda.",
  }),
});

export type ClientFormInput = z.infer<typeof clientSchema>;

export function clientFormDataToObject(formData: FormData) {
  return {
    dni: String(formData.get("dni") ?? ""),
    firstNames: String(formData.get("firstNames") ?? ""),
    lastNames: String(formData.get("lastNames") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    occupation: String(formData.get("occupation") ?? ""),
    monthlyIncome: String(formData.get("monthlyIncome") ?? ""),
    incomeCurrency: String(formData.get("incomeCurrency") ?? ""),
  };
}
