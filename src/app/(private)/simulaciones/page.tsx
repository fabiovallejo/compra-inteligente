import Link from "next/link";
import { Prisma, SimulationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { simulationStatusLabel } from "@/modules/simulations/format";

export const dynamic = "force-dynamic";

export default async function SimulationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    clientId?: string;
    vehicleId?: string;
    currency?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const where: Prisma.CreditSimulationWhereInput = {
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(params.vehicleId ? { vehicleId: params.vehicleId } : {}),
    ...(params.status && isSimulationStatus(params.status)
      ? { status: params.status }
      : {}),
    ...(params.currency === "PEN" || params.currency === "USD"
      ? { financialProduct: { currency: params.currency } }
      : {}),
    ...(params.from || params.to
      ? {
          simulatedAt: {
            ...(params.from ? { gte: new Date(`${params.from}T00:00:00`) } : {}),
            ...(params.to ? { lte: new Date(`${params.to}T23:59:59`) } : {}),
          },
        }
      : {}),
  };

  const [simulations, clients, vehicles] = await Promise.all([
    prisma.creditSimulation.findMany({
      where,
      include: {
        client: { select: { id: true, firstNames: true, lastNames: true } },
        vehicle: { select: { id: true, brand: true, model: true } },
        financialProduct: { select: { name: true, currency: true } },
        financialIndicator: true,
      },
      orderBy: { simulatedAt: "desc" },
      take: 50,
    }),
    prisma.client.findMany({
      orderBy: [{ lastNames: "asc" }, { firstNames: "asc" }],
      select: { id: true, firstNames: true, lastNames: true, dni: true },
    }),
    prisma.vehicle.findMany({
      orderBy: [{ brand: "asc" }, { model: "asc" }],
      select: { id: true, brand: true, model: true, vin: true },
    }),
  ]);

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

      <form className="grid gap-3 rounded-md border border-[#d6d3c8] bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <select className="h-10 rounded-md border border-[#c9c7bd] px-3 text-sm" defaultValue={params.clientId ?? ""} name="clientId">
          <option value="">Todos los clientes</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.dni} - {client.firstNames} {client.lastNames}
            </option>
          ))}
        </select>
        <select className="h-10 rounded-md border border-[#c9c7bd] px-3 text-sm" defaultValue={params.vehicleId ?? ""} name="vehicleId">
          <option value="">Todos los vehiculos</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.vin} - {vehicle.brand} {vehicle.model}
            </option>
          ))}
        </select>
        <select className="h-10 rounded-md border border-[#c9c7bd] px-3 text-sm" defaultValue={params.currency ?? ""} name="currency">
          <option value="">Todas las monedas</option>
          <option value="PEN">PEN</option>
          <option value="USD">USD</option>
        </select>
        <select className="h-10 rounded-md border border-[#c9c7bd] px-3 text-sm" defaultValue={params.status ?? ""} name="status">
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="CALCULADA">Calculada</option>
          <option value="APROBADA">Aprobada</option>
          <option value="ARCHIVADA">Archivada</option>
        </select>
        <input className="h-10 rounded-md border border-[#c9c7bd] px-3 text-sm" defaultValue={params.from ?? ""} name="from" placeholder="Desde" type="date" />
        <div className="flex gap-2">
          <input className="h-10 min-w-0 rounded-md border border-[#c9c7bd] px-3 text-sm" defaultValue={params.to ?? ""} name="to" placeholder="Hasta" type="date" />
          <button className="h-10 rounded-md bg-[#1f5f57] px-4 text-sm font-semibold text-white" type="submit">Filtrar</button>
        </div>
      </form>

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
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {simulations.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#66727c]" colSpan={9}>
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
                      {simulationStatusLabel(simulation.status)}
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

function isSimulationStatus(value: string): value is SimulationStatus {
  return ["BORRADOR", "CALCULADA", "APROBADA", "ARCHIVADA"].includes(value);
}
