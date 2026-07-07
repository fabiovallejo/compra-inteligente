import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SimulationsPage() {
  const simulations = await prisma.creditSimulation.findMany({
    include: {
      client: { select: { firstNames: true, lastNames: true } },
      vehicle: { select: { brand: true, model: true } },
      financialProduct: { select: { name: true, currency: true } },
      financialIndicator: true,
    },
    orderBy: { simulatedAt: "desc" },
    take: 50,
  });

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
            Compra Inteligente
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Simulaciones</h1>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#1f5f57] px-4 text-sm font-semibold text-white transition hover:bg-[#184c46]"
          href="/simulaciones/nuevo"
        >
          Nueva simulacion
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-[#d6d3c8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead className="bg-[#f7f7f2] text-left text-[#53616b]">
              <tr>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Vehiculo</th>
                <th className="px-5 py-3 font-semibold">Producto</th>
                <th className="px-5 py-3 font-semibold">Financiado</th>
                <th className="px-5 py-3 font-semibold">TEM</th>
                <th className="px-5 py-3 font-semibold">TCEA</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {simulations.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#66727c]" colSpan={8}>
                    Todavia no hay simulaciones guardadas.
                  </td>
                </tr>
              ) : (
                simulations.map((simulation) => (
                  <tr className="border-t border-[#ebe8df]" key={simulation.id}>
                    <td className="px-5 py-4">
                      {simulation.client.firstNames}{" "}
                      {simulation.client.lastNames}
                    </td>
                    <td className="px-5 py-4">
                      {simulation.vehicle.brand} {simulation.vehicle.model}
                    </td>
                    <td className="px-5 py-4">
                      {simulation.financialProduct.name}
                    </td>
                    <td className="px-5 py-4">
                      {simulation.financialProduct.currency}{" "}
                      {simulation.financedAmount.toString()}
                    </td>
                    <td className="px-5 py-4">
                      {simulation.calculatedMonthlyEffectiveRate
                        .mul(100)
                        .toFixed(6)}
                      %
                    </td>
                    <td className="px-5 py-4">
                      {simulation.financialIndicator?.tcea.mul(100).toFixed(6) ??
                        "-"}
                      %
                    </td>
                    <td className="px-5 py-4">
                      {simulation.simulatedAt.toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="rounded-md border border-[#c9c7bd] px-3 py-1.5 font-medium"
                        href={`/simulaciones/${simulation.id}`}
                      >
                        Ver
                      </Link>
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
