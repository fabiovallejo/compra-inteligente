import { SimulationWizard } from "@/components/simulation-wizard";
import { prisma } from "@/lib/prisma";
import { getSimulationWizardOptions } from "@/modules/simulations/wizard-options";

export const dynamic = "force-dynamic";

export default async function NewSimulationPage() {
  const options = await getSimulationWizardOptions(prisma);

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
        clients={options.clients}
        products={options.products}
        vehicles={options.vehicles}
      />
    </section>
  );
}
