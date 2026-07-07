import { z } from "zod";
import { isPositiveDecimal } from "@/modules/shared/decimal";

const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const vehicleSchema = z.object({
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      vinRegex,
      "El VIN debe tener 17 caracteres validos y no puede incluir I, O ni Q.",
    ),
  brand: z.string().trim().min(1, "Ingresa la marca."),
  model: z.string().trim().min(1, "Ingresa el modelo."),
  year: z.coerce
    .number({ error: "Ingresa un anio valido." })
    .int("El anio debe ser entero.")
    .min(1900, "El anio no puede ser menor a 1900.")
    .max(2100, "El anio no puede ser mayor a 2100."),
  color: optionalText,
  type: optionalText,
  condition: z.enum(["NUEVO", "SEMINUEVO"], {
    error: "Selecciona una condicion.",
  }),
  price: z
    .string()
    .trim()
    .refine(isPositiveDecimal, "El precio debe ser mayor que cero."),
  currency: z.enum(["PEN", "USD"], {
    error: "Selecciona una moneda.",
  }),
});

export type VehicleFormInput = z.infer<typeof vehicleSchema>;

export function vehicleFormDataToObject(formData: FormData) {
  return {
    vin: String(formData.get("vin") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    model: String(formData.get("model") ?? ""),
    year: String(formData.get("year") ?? ""),
    color: String(formData.get("color") ?? ""),
    type: String(formData.get("type") ?? ""),
    condition: String(formData.get("condition") ?? ""),
    price: String(formData.get("price") ?? ""),
    currency: String(formData.get("currency") ?? ""),
  };
}
