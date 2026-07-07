import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function SimulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const simulation = await prisma.creditSimulation.findUnique({
    where: { id },
    include: {
      client: true,
      vehicle: true,
      financialProduct: true,
      gracePeriods: true,
      financialIndicator: true,
      paymentScheduleItems: {
        orderBy: { periodNumber: "asc" },
        take: 8,
      },
    },
  });

  if (!simulation) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl">
      <Link
        className="text-sm font-semibold text-[#1f5f57]"
        href="/simulaciones"
      >
        Volver a simulaciones
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <h1 className="text-3xl font-semibold">Simulacion guardada</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary
            label="Cliente"
            value={`${simulation.client.firstNames} ${simulation.client.lastNames}`}
          />
          <Summary
            label="Vehiculo"
            value={`${simulation.vehicle.brand} ${simulation.vehicle.model}`}
          />
          <Summary
            label="Producto"
            value={simulation.financialProduct.name}
          />
          <Summary
            label="Monto financiado"
            value={`${simulation.financialProduct.currency} ${simulation.financedAmount.toString()}`}
          />
          <Summary
            label="Cuota balon"
            value={simulation.balloonPayment.toString()}
          />
          <Summary
            label="Cuota base"
            value={simulation.basePayment.toString()}
          />
          <Summary
            label="TEM"
            value={`${simulation.calculatedMonthlyEffectiveRate.mul(100).toFixed(6)}%`}
          />
          <Summary
            label="TCEA"
            value={`${simulation.financialIndicator?.tcea.mul(100).toFixed(6) ?? "-"}%`}
          />
        </div>
      </div>

      <div className="mt-6 rounded-md border border-[#d6d3c8] bg-white">
        <div className="border-b border-[#ebe8df] px-5 py-4">
          <h2 className="text-lg font-semibold">Primeros periodos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-[#f7f7f2] text-left text-[#53616b]">
              <tr>
                <th className="px-5 py-3">Periodo</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Saldo inicial</th>
                <th className="px-5 py-3">Interes</th>
                <th className="px-5 py-3">Cuota</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Saldo final</th>
              </tr>
            </thead>
            <tbody>
              {simulation.paymentScheduleItems.map((item) => (
                <tr className="border-t border-[#ebe8df]" key={item.id}>
                  <td className="px-5 py-3">{item.periodNumber}</td>
                  <td className="px-5 py-3">{item.periodType}</td>
                  <td className="px-5 py-3">{item.openingBalance.toString()}</td>
                  <td className="px-5 py-3">{item.interest.toString()}</td>
                  <td className="px-5 py-3">{item.basePayment.toString()}</td>
                  <td className="px-5 py-3">{item.totalPayment.toString()}</td>
                  <td className="px-5 py-3">{item.closingBalance.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ebe8df] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#66727c]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}
