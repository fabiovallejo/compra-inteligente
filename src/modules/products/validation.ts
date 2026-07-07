import { z } from "zod";
import {
  isNonNegativeDecimal,
  isPercentageAboveZeroBelowHundred,
  isPercentageAtLeastZeroBelowHundred,
} from "@/modules/shared/decimal";

export const productSchema = z
  .object({
    name: z.string().trim().min(1, "Ingresa el nombre del producto."),
    currency: z.enum(["PEN", "USD"], { error: "Selecciona una moneda." }),
    defaultDownPaymentRate: z
      .string()
      .trim()
      .refine(
        isPercentageAtLeastZeroBelowHundred,
        "La cuota inicial debe ser mayor o igual a cero y menor que 100.",
      ),
    defaultResidualValueRate: z
      .string()
      .trim()
      .refine(
        isPercentageAboveZeroBelowHundred,
        "El valor residual debe ser mayor que cero y menor que 100.",
      ),
    defaultTermMonths: z.coerce
      .number({ error: "Ingresa un plazo valido." })
      .int("El plazo debe ser entero.")
      .positive("El plazo debe ser mayor que cero."),
    defaultRateType: z.enum(["EFFECTIVE_ANNUAL", "NOMINAL_ANNUAL"], {
      error: "Selecciona un tipo de tasa.",
    }),
    defaultAnnualRate: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "La tasa debe ser cero o mayor."),
    capitalization: z
      .enum(["ANNUAL", "SEMIANNUAL", "QUARTERLY", "BIMONTHLY", "MONTHLY", "DAILY_360"])
      .optional()
      .or(z.literal("")),
    cok: z.string().trim().refine(isNonNegativeDecimal, "El COK debe ser cero o mayor."),
    debtReliefInsuranceRate: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "El seguro de desgravamen debe ser cero o mayor."),
    vehicleInsuranceRate: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "El seguro vehicular debe ser cero o mayor."),
    periodicCommission: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "La comision debe ser cero o mayor."),
    itfRate: z.string().trim().refine(isNonNegativeDecimal, "El ITF debe ser cero o mayor."),
  })
  .refine(
    (data) =>
      data.defaultRateType !== "NOMINAL_ANNUAL" || Boolean(data.capitalization),
    {
      message: "La capitalizacion es obligatoria para TNA.",
      path: ["capitalization"],
    },
  );

export type ProductFormInput = z.infer<typeof productSchema>;

export function productFormDataToObject(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    defaultDownPaymentRate: String(formData.get("defaultDownPaymentRate") ?? ""),
    defaultResidualValueRate: String(
      formData.get("defaultResidualValueRate") ?? "",
    ),
    defaultTermMonths: String(formData.get("defaultTermMonths") ?? ""),
    defaultRateType: String(formData.get("defaultRateType") ?? ""),
    defaultAnnualRate: String(formData.get("defaultAnnualRate") ?? ""),
    capitalization: String(formData.get("capitalization") ?? ""),
    cok: String(formData.get("cok") ?? ""),
    debtReliefInsuranceRate: String(
      formData.get("debtReliefInsuranceRate") ?? "",
    ),
    vehicleInsuranceRate: String(formData.get("vehicleInsuranceRate") ?? ""),
    periodicCommission: String(formData.get("periodicCommission") ?? ""),
    itfRate: String(formData.get("itfRate") ?? ""),
  };
}
