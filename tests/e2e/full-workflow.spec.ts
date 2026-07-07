import { expect, test } from "@playwright/test";

test("complete Compra Inteligente workflow", async ({ page }) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString().slice(-6);
  const dni = `7${suffix}1`.slice(0, 8).padEnd(8, "1");
  const vin = `8APDE${suffix}RA0000`;

  await page.goto("/login");
  await page.getByRole("textbox", { name: "Usuario" }).fill("admin");
  await page.getByRole("textbox", { name: "Contrasena" }).fill("Admin123!");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/clientes/nuevo");
  await page.getByRole("textbox", { name: "DNI" }).fill(dni);
  await page.getByRole("textbox", { name: "Correo" }).fill(`e2e-${suffix}@example.com`);
  await page.getByRole("textbox", { name: "Nombres" }).fill("Cliente Prueba");
  await page.getByRole("textbox", { name: "Apellidos" }).fill("Compra Inteligente");
  await page.getByRole("textbox", { name: "Telefono" }).fill("999888777");
  await page.getByRole("textbox", { name: "Ingreso mensual" }).fill("9000");
  await page.getByRole("combobox", { name: "Moneda del ingreso" }).selectOption("PEN");
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page.getByRole("heading", { name: /Cliente Prueba/ })).toBeVisible();

  await page.goto("/vehiculos/nuevo");
  await page.getByRole("textbox", { name: "VIN" }).fill(vin);
  await page.getByRole("textbox", { name: "Marca" }).fill("Toyota");
  await page.getByRole("textbox", { name: "Modelo" }).fill(`Yaris ${suffix}`);
  await page.getByRole("textbox", { name: "Anio" }).fill("2025");
  await page.getByRole("combobox", { name: "Condicion" }).selectOption("NUEVO");
  await page.getByRole("textbox", { name: "Precio" }).fill("70000");
  await page.getByRole("combobox", { name: "Moneda" }).selectOption("PEN");
  await page.getByRole("textbox", { name: "Color" }).fill("Blanco");
  await page.getByRole("textbox", { name: "Tipo" }).fill("Sedan");
  await page.getByRole("button", { name: "Crear vehiculo" }).click();
  await expect(page.getByRole("heading", { name: /Toyota/ })).toBeVisible();

  await createSimulation(page, dni, vin, false);
  await expect(page.getByText("TCEA")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Saldo final" })).toBeVisible();
  await expect(page.getByText(/S\/\s*0\.00/).last()).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/cronograma-.*\.csv/);

  await createSimulation(page, dni, vin, true);
  await expect(page.getByText("Gracia total").first()).toBeVisible();
  await expect(page.getByText("Gracia parcial").first()).toBeVisible();

  await page.getByRole("link", { name: "Editar y recalcular" }).click();
  await openWizardStep(page, /2\. Inicial y balon/, () =>
    page.getByRole("textbox", { name: "Valor residual (%)" }),
  );
  await page.getByRole("textbox", { name: "Valor residual (%)" }).fill("45");
  await openWizardStep(page, /6\. Revision/, () =>
    page.getByRole("button", { name: "Calcular" }),
  );
  await page.getByRole("button", { name: "Calcular" }).click();
  await page.getByRole("button", { name: "Guardar recalculo" }).click();
  await expect(page.getByText("Gracia total").first()).toBeVisible();
  await expect(page.getByText("Gracia parcial").first()).toBeVisible();
});

async function createSimulation(
  page: import("@playwright/test").Page,
  dni: string,
  vin: string,
  withGrace: boolean,
) {
  await page.goto("/simulaciones/nuevo");
  await selectOptionContaining(page, "Cliente", dni);
  await selectOptionContaining(page, "Vehiculo", vin);
  await openWizardStep(page, /2\. Inicial y balon/, () =>
    page.getByRole("textbox", { name: "Cuota inicial (%)" }),
  );
  await page.getByRole("textbox", { name: "Cuota inicial (%)" }).fill("20");
  await page.getByRole("textbox", { name: "Valor residual (%)" }).fill("50");
  await page.getByRole("textbox", { name: "Plazo mensual" }).fill("36");
  await openWizardStep(page, /3\. Tasa/, () =>
    page.getByRole("combobox", { name: "Tipo de tasa" }),
  );
  await page.getByRole("combobox", { name: "Tipo de tasa" }).selectOption("EFFECTIVE_ANNUAL");
  await page.getByRole("textbox", { name: "Tasa anual (%)" }).fill("15");
  await openWizardStep(page, /4\. Gracia/, () =>
    page.getByRole("checkbox", { name: "Habilitar gracia total" }),
  );

  if (withGrace) {
    await page.getByRole("checkbox", { name: "Habilitar gracia total" }).check();
    await page.getByRole("textbox", { name: "Gracia total desde" }).fill("1");
    await page.getByRole("textbox", { name: "Gracia total hasta" }).fill("2");
    await page.getByRole("checkbox", { name: "Habilitar gracia parcial" }).check();
    await page.getByRole("textbox", { name: "Gracia parcial desde" }).fill("3");
    await page.getByRole("textbox", { name: "Gracia parcial hasta" }).fill("4");
  }

  await openWizardStep(page, /5\. Costos y COK/, () =>
    page.getByRole("textbox", { name: "Seguro de desgravamen (%)" }),
  );
  await page.getByRole("textbox", { name: "Seguro de desgravamen (%)" }).fill("0.05");
  await page.getByRole("textbox", { name: "Seguro vehicular (%)" }).fill("0.08");
  await page.getByRole("textbox", { name: "Comision" }).fill("5");
  await page.getByRole("textbox", { name: "ITF (%)" }).fill("0.005");
  await page.getByRole("textbox", { name: "COK anual (%)" }).fill("10");
  await openWizardStep(page, /6\. Revision/, () =>
    page.getByRole("button", { name: "Calcular" }),
  );
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByText("Vista previa calculada")).toBeVisible();
  await page.getByRole("button", { name: "Guardar simulacion" }).click();
  await expect(page).toHaveURL(/\/simulaciones\/[^/]+$/);
}

async function openWizardStep(
  page: import("@playwright/test").Page,
  name: RegExp,
  target: () => import("@playwright/test").Locator,
) {
  await expect(async () => {
    await page.getByRole("button", { name }).click();
    await expect(target()).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

async function selectOptionContaining(
  page: import("@playwright/test").Page,
  label: string,
  text: string,
) {
  const select = page.getByRole("combobox", { name: label });
  const value = await select
    .locator("option")
    .filter({ hasText: text })
    .first()
    .getAttribute("value");
  expect(value).toBeTruthy();
  await select.selectOption(value ?? "");
}
