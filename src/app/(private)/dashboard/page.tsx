import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/modules/simulations/format";
import { simulationSchema } from "@/modules/simulations/validation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [clientCount, vehicleCount, simulationCount, simulations, latest] =
    await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      prisma.creditSimulation.count(),
      prisma.creditSimulation.findMany({
        select: {
          financedAmount: true,
          inputSnapshot: true,
          financialProduct: { select: { currency: true } },
        },
      }),
      prisma.creditSimulation.findMany({
        orderBy: { simulatedAt: "desc" },
        take: 5,
        include: {
          client: {
            select: { firstNames: true, lastNames: true },
          },
          vehicle: {
            select: { brand: true, model: true },
          },
          financialProduct: { select: { currency: true } },
        },
      }),
    ]);

  const totals = simulations.reduce(
    (accumulator, simulation) => {
      const currency = simulationCurrency(
        simulation.inputSnapshot,
        simulation.financialProduct.currency,
      );
      accumulator[currency] = accumulator[currency].plus(
        simulation.financedAmount,
      );
      return accumulator;
    },
    { PEN: new Decimal(0), USD: new Decimal(0) },
  );

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
          Resumen operativo
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Clientes" value={clientCount.toString()} />
        <MetricCard label="Vehiculos" value={vehicleCount.toString()} />
        <MetricCard label="Simulaciones" value={simulationCount.toString()} />
        <MetricCard
          label="Financiado PEN"
          value={formatMoney(totals.PEN, "PEN")}
        />
        <MetricCard
          label="Financiado USD"
          value={formatMoney(totals.USD, "USD")}
        />
      </div>

      <div className="rounded-md border border-[#d6d3c8] bg-white">
        <div className="border-b border-[#e5e2d8] px-5 py-4">
          <h2 className="text-lg font-semibold">Ultimas simulaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-[#f7f7f2] text-left text-[#53616b]">
              <tr>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Vehiculo</th>
                <th className="px-5 py-3 font-semibold">Monto financiado</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {latest.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#66727c]" colSpan={5}>
                    Todavia no hay simulaciones registradas.
                  </td>
                </tr>
              ) : (
                latest.map((simulation) => (
                  <tr
                    className="border-t border-[#ebe8df]"
                    key={simulation.id}
                  >
                    <td className="px-5 py-4">
                      {simulation.client.firstNames}{" "}
                      {simulation.client.lastNames}
                    </td>
                    <td className="px-5 py-4">
                      {simulation.vehicle.brand} {simulation.vehicle.model}
                    </td>
                    <td className="px-5 py-4">
                      {formatMoney(
                        simulation.financedAmount,
                        simulationCurrency(
                          simulation.inputSnapshot,
                          simulation.financialProduct.currency,
                        ),
                      )}
                    </td>
                    <td className="px-5 py-4">{simulation.status}</td>
                    <td className="px-5 py-4">
                      {simulation.simulatedAt.toLocaleDateString("es-PE")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function simulationCurrency(
  snapshot: unknown,
  fallback: "PEN" | "USD",
): "PEN" | "USD" {
  const parsed = simulationSchema.safeParse(snapshot);

  return parsed.success ? parsed.data.currency : fallback;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-[#d6d3c8] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#63717b]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[#1f2933]">{value}</p>
    </article>
  );
}
