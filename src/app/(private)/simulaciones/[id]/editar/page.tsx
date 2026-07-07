import Link from "next/link";
import { notFound } from "next/navigation";
import { SimulationWizard, type WizardForm } from "@/components/simulation-wizard";
import { prisma } from "@/lib/prisma";
import { simulationSchema } from "@/modules/simulations/validation";
import { getSimulationWizardOptions } from "@/modules/simulations/wizard-options";

export default async function EditSimulationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const simulation = await prisma.creditSimulation.findUnique({
    where: { id },
  });

  if (!simulation) {
    notFound();
  }

  const parsed = simulationSchema.safeParse(simulation.inputSnapshot);

  if (!parsed.success) {
    notFound();
  }

  const options = await getSimulationWizardOptions(prisma, "edit");
  const initialValues: WizardForm = {
    clientId: parsed.data.clientId,
    vehicleId: parsed.data.vehicleId,
    financialProductId: parsed.data.financialProductId,
    currency: parsed.data.currency,
    vehiclePrice: parsed.data.vehiclePrice,
    downPaymentRate: parsed.data.downPaymentRate,
    residualValueRate: parsed.data.residualValueRate,
    termMonths: parsed.data.termMonths.toString(),
    rateType: parsed.data.rateType,
    annualRate: parsed.data.annualRate,
    capitalizationFrequency: parsed.data.capitalizationFrequency ?? "",
    totalGraceEnabled: parsed.data.totalGraceEnabled,
    totalGraceFrom: parsed.data.totalGraceFrom?.toString() ?? "",
    totalGraceTo: parsed.data.totalGraceTo?.toString() ?? "",
    partialGraceEnabled: parsed.data.partialGraceEnabled,
    partialGraceFrom: parsed.data.partialGraceFrom?.toString() ?? "",
    partialGraceTo: parsed.data.partialGraceTo?.toString() ?? "",
    debtReliefInsuranceMonthlyRate: parsed.data.debtReliefInsuranceMonthlyRate,
    vehicleInsuranceMonthlyRate: parsed.data.vehicleInsuranceMonthlyRate,
    periodicCommission: parsed.data.periodicCommission,
    itfRate: parsed.data.itfRate,
    annualDiscountRate: parsed.data.annualDiscountRate,
    clientMonthlyIncome: parsed.data.clientMonthlyIncome,
  };

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <Link
          className="text-sm font-semibold text-[#1f5f57]"
          href={`/simulaciones/${simulation.id}`}
        >
          Volver a resultados
        </Link>
        <h1 className="mt-3 text-3xl font-semibold">
          Editar y recalcular simulacion
        </h1>
      </div>
      <SimulationWizard
        clients={options.clients}
        initialValues={initialValues}
        products={options.products}
        simulationId={simulation.id}
        vehicles={options.vehicles}
      />
    </section>
  );
}
