import { expect, test } from "@playwright/test";

test("main private module routes redirect anonymous users to login", async ({
  page,
}) => {
  for (const path of ["/clientes", "/vehiculos", "/clientes/nuevo", "/vehiculos/nuevo"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();
  }
});
