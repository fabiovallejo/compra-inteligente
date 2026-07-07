import { FinancialProductCostType, PrismaClient } from "@prisma/client";
import { productCostValue } from "@/modules/products/costs";
import type {
  SimulationClientOption,
  SimulationProductOption,
  SimulationVehicleOption,
} from "@/components/simulation-wizard";

export async function getSimulationWizardOptions(
  prisma: PrismaClient,
  mode: "create" | "edit" = "create",
): Promise<{
  clients: SimulationClientOption[];
  vehicles: SimulationVehicleOption[];
  products: SimulationProductOption[];
}> {
  const [clients, vehicles, products] = await Promise.all([
    prisma.client.findMany({
      where: mode === "create" ? { active: true } : undefined,
      orderBy: [{ lastNames: "asc" }, { firstNames: "asc" }],
    }),
    prisma.vehicle.findMany({
      where: mode === "create" ? { status: { not: "INACTIVE" } } : undefined,
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    }),
    prisma.financialProduct.findMany({
      where: mode === "create" ? { active: true } : undefined,
      include: { costs: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    clients: clients.map((client) => ({
      id: client.id,
      label: `${client.dni} - ${client.firstNames} ${client.lastNames}`,
      monthlyIncome: client.monthlyIncome.toString(),
      incomeCurrency: client.incomeCurrency,
    })),
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      label: `${vehicle.vin} - ${vehicle.brand} ${vehicle.model}`,
      price: vehicle.price.toString(),
      currency: vehicle.currency,
    })),
    products: products.map((product) => ({
      id: product.id,
      label: `${product.name} (${product.currency})`,
      currency: product.currency,
      downPaymentRate: product.defaultDownPaymentRate.toString(),
      residualValueRate: product.defaultResidualValueRate.toString(),
      termMonths: product.defaultTermMonths,
      rateType: product.defaultRateType,
      annualRate: product.defaultAnnualRate.toString(),
      capitalization: product.capitalization ?? "",
      cok: product.cok.toString(),
      debtReliefInsuranceRate: productCostValue(
        product.costs,
        FinancialProductCostType.DEBT_RELIEF_INSURANCE,
      ),
      vehicleInsuranceRate: productCostValue(
        product.costs,
        FinancialProductCostType.VEHICLE_INSURANCE,
      ),
      periodicCommission: productCostValue(
        product.costs,
        FinancialProductCostType.PERIODIC_COMMISSION,
      ),
      itfRate: productCostValue(product.costs, FinancialProductCostType.ITF),
    })),
  };
}
