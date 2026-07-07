import { z } from "zod";
import {
  isNonNegativeDecimal,
  isPercentageAboveZeroBelowHundred,
  isPercentageAtLeastZeroBelowHundred,
  isPositiveDecimal,
} from "@/modules/shared/decimal";

export const simulationSchema = z
  .object({
    clientId: z.string().min(1, "Selecciona un cliente."),
    vehicleId: z.string().min(1, "Selecciona un vehiculo."),
    financialProductId: z.string().min(1, "Selecciona un producto financiero."),
    currency: z.enum(["PEN", "USD"]),
    vehiclePrice: z
      .string()
      .trim()
      .refine(isPositiveDecimal, "El precio del vehiculo debe ser mayor que cero."),
    downPaymentRate: z
      .string()
      .trim()
      .refine(
        isPercentageAtLeastZeroBelowHundred,
        "La cuota inicial debe ser mayor o igual a cero y menor que 100.",
      ),
    residualValueRate: z
      .string()
      .trim()
      .refine(
        isPercentageAboveZeroBelowHundred,
        "El valor residual debe ser mayor que cero y menor que 100.",
      ),
    termMonths: z.coerce
      .number({ error: "Ingresa un plazo valido." })
      .int("El plazo debe ser entero.")
      .positive("El plazo debe ser mayor que cero."),
    rateType: z.enum(["EFFECTIVE_ANNUAL", "NOMINAL_ANNUAL"]),
    annualRate: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "La tasa anual debe ser cero o mayor."),
    capitalizationFrequency: z
      .enum(["ANNUAL", "SEMIANNUAL", "QUARTERLY", "BIMONTHLY", "MONTHLY", "DAILY_360"])
      .optional()
      .or(z.literal("")),
    totalGraceEnabled: z.boolean(),
    totalGraceFrom: z.coerce.number().int().optional(),
    totalGraceTo: z.coerce.number().int().optional(),
    partialGraceEnabled: z.boolean(),
    partialGraceFrom: z.coerce.number().int().optional(),
    partialGraceTo: z.coerce.number().int().optional(),
    debtReliefInsuranceMonthlyRate: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "El seguro de desgravamen debe ser cero o mayor."),
    vehicleInsuranceMonthlyRate: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "El seguro vehicular debe ser cero o mayor."),
    periodicCommission: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "La comision debe ser cero o mayor."),
    itfRate: z.string().trim().refine(isNonNegativeDecimal, "El ITF debe ser cero o mayor."),
    annualDiscountRate: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, "El COK debe ser cero o mayor."),
    clientMonthlyIncome: z
      .string()
      .trim()
      .refine(isPositiveDecimal, "El ingreso del cliente debe ser mayor que cero."),
  })
  .superRefine((data, context) => {
    if (data.rateType === "NOMINAL_ANNUAL" && !data.capitalizationFrequency) {
      context.addIssue({
        code: "custom",
        path: ["capitalizationFrequency"],
        message: "La capitalizacion es obligatoria para TNA.",
      });
    }

    const ranges: Array<{ name: string; from?: number; to?: number }> = [];

    if (data.totalGraceEnabled) {
      ranges.push({
        name: "gracia total",
        from: data.totalGraceFrom,
        to: data.totalGraceTo,
      });
    }

    if (data.partialGraceEnabled) {
      ranges.push({
        name: "gracia parcial",
        from: data.partialGraceFrom,
        to: data.partialGraceTo,
      });
    }

    for (const range of ranges) {
      if (!range.from || !range.to || range.from < 1 || range.to < range.from) {
        context.addIssue({
          code: "custom",
          path: [range.name === "gracia total" ? "totalGraceFrom" : "partialGraceFrom"],
          message: `El rango de ${range.name} es invalido.`,
        });
      }

      if (range.to && range.to >= data.termMonths) {
        context.addIssue({
          code: "custom",
          path: [range.name === "gracia total" ? "totalGraceTo" : "partialGraceTo"],
          message: "La gracia no puede incluir el ultimo periodo.",
        });
      }
    }

    if (ranges.length === 2) {
      const [first, second] = ranges;
      if (
        first.from &&
        first.to &&
        second.from &&
        second.to &&
        first.from <= second.to &&
        second.from <= first.to
      ) {
        context.addIssue({
          code: "custom",
          path: ["partialGraceFrom"],
          message: "Los rangos de gracia no pueden superponerse.",
        });
      }
    }
  });

export type SimulationFormInput = z.infer<typeof simulationSchema>;
