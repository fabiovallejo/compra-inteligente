import { FinancialProductCostType } from "@prisma/client";
import { SimulationWizard } from "@/components/simulation-wizard";
import { prisma } from "@/lib/prisma";
import { productCostValue } from "@/modules/products/costs";

export const dynamic = "force-dynamic";

export default async function NewSimulationPage() {
  const [clients, vehicles, products] = await Promise.all([
    prisma.client.findMany({
      where: { active: true },
      orderBy: [{ lastNames: "asc" }, { firstNames: "asc" }],
    }),
    prisma.vehicle.findMany({
      where: { status: { not: "INACTIVE" } },
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    }),
    prisma.financialProduct.findMany({
      where: { active: true },
      include: { costs: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
          Asistente
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Nueva simulacion Compra Inteligente
        </h1>
      </div>
      <SimulationWizard
        clients={clients.map((client) => ({
          id: client.id,
          label: `${client.dni} - ${client.firstNames} ${client.lastNames}`,
          monthlyIncome: client.monthlyIncome.toString(),
          incomeCurrency: client.incomeCurrency,
        }))}
        vehicles={vehicles.map((vehicle) => ({
          id: vehicle.id,
          label: `${vehicle.vin} - ${vehicle.brand} ${vehicle.model}`,
          price: vehicle.price.toString(),
          currency: vehicle.currency,
        }))}
        products={products.map((product) => ({
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
        }))}
      />
    </section>
  );
}
