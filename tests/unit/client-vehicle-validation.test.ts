import { describe, expect, it } from "vitest";
import { clientSchema } from "@/modules/clients/validation";
import { vehicleSchema } from "@/modules/vehicles/validation";

describe("client validation", () => {
  it("accepts a valid client", () => {
    const parsed = clientSchema.safeParse({
      dni: "45678912",
      firstNames: "Mariana Lucia",
      lastNames: "Torres Salazar",
      email: "mariana.torres@example.com",
      phone: "999111222",
      address: "Av. Javier Prado 1234",
      birthDate: "1991-04-18",
      occupation: "Analista financiera",
      monthlyIncome: "8500.00",
      incomeCurrency: "PEN",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid DNI, email, phone and income", () => {
    const parsed = clientSchema.safeParse({
      dni: "123",
      firstNames: "Mariana",
      lastNames: "Torres",
      email: "correo-invalido",
      phone: "12",
      monthlyIncome: "0",
      incomeCurrency: "PEN",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      expect(errors.dni?.at(0)).toContain("8 digitos");
      expect(errors.email?.at(0)).toContain("correo valido");
      expect(errors.phone?.at(0)).toContain("telefono valido");
      expect(errors.monthlyIncome?.at(0)).toContain("mayor que cero");
    }
  });
});

describe("vehicle validation", () => {
  it("accepts a valid vehicle", () => {
    const parsed = vehicleSchema.safeParse({
      vin: "8APDE1234RA000001",
      brand: "Toyota",
      model: "Corolla Cross",
      year: "2025",
      color: "Blanco",
      type: "SUV",
      condition: "NUEVO",
      price: "70000.00",
      currency: "PEN",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid VIN, condition, currency and price", () => {
    const parsed = vehicleSchema.safeParse({
      vin: "INVALIDO",
      brand: "Toyota",
      model: "Corolla Cross",
      year: "2025",
      condition: "USADO",
      price: "0",
      currency: "EUR",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      expect(errors.vin?.at(0)).toContain("17 caracteres");
      expect(errors.condition?.at(0)).toBeTruthy();
      expect(errors.price?.at(0)).toContain("mayor que cero");
      expect(errors.currency?.at(0)).toBeTruthy();
    }
  });
});
