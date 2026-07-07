import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deactivateVehicleAction } from "@/modules/vehicles/actions";

export const dynamic = "force-dynamic";

const pageSize = 10;

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const page = Math.max(Number(params.page ?? 1) || 1, 1);
  const where: Prisma.VehicleWhereInput = query
    ? {
        OR: [
          { vin: { contains: query, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.vehicle.count({ where }),
  ]);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
            Bien financiable
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Vehiculos</h1>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#1f5f57] px-4 text-sm font-semibold text-white transition hover:bg-[#184c46]"
          href="/vehiculos/nuevo"
        >
          Registrar vehiculo
        </Link>
      </div>

      <form className="flex flex-col gap-3 rounded-md border border-[#d6d3c8] bg-white p-4 sm:flex-row">
        <input
          className="h-10 flex-1 rounded-md border border-[#c9c7bd] px-3 text-sm outline-none focus:border-[#2f6f65] focus:ring-2 focus:ring-[#2f6f65]/20"
          defaultValue={query}
          name="q"
          placeholder="Buscar por VIN, marca o modelo"
        />
        <button
          className="h-10 rounded-md border border-[#1f5f57] px-4 text-sm font-semibold text-[#1f5f57]"
          type="submit"
        >
          Buscar
        </button>
      </form>

      <div className="overflow-hidden rounded-md border border-[#d6d3c8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-[#f7f7f2] text-left text-[#53616b]">
              <tr>
                <th className="px-5 py-3 font-semibold">VIN</th>
                <th className="px-5 py-3 font-semibold">Vehiculo</th>
                <th className="px-5 py-3 font-semibold">Anio</th>
                <th className="px-5 py-3 font-semibold">Condicion</th>
                <th className="px-5 py-3 font-semibold">Precio</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#66727c]" colSpan={7}>
                    No se encontraron vehiculos.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr className="border-t border-[#ebe8df]" key={vehicle.id}>
                    <td className="px-5 py-4 font-medium">{vehicle.vin}</td>
                    <td className="px-5 py-4">
                      {vehicle.brand} {vehicle.model}
                    </td>
                    <td className="px-5 py-4">{vehicle.year}</td>
                    <td className="px-5 py-4">{vehicle.condition}</td>
                    <td className="px-5 py-4">
                      {vehicle.currency} {vehicle.price.toString()}
                    </td>
                    <td className="px-5 py-4">{vehicle.status}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-md border border-[#c9c7bd] px-3 py-1.5 font-medium"
                          href={`/vehiculos/${vehicle.id}`}
                        >
                          Ver
                        </Link>
                        <Link
                          className="rounded-md border border-[#c9c7bd] px-3 py-1.5 font-medium"
                          href={`/vehiculos/${vehicle.id}/editar`}
                        >
                          Editar
                        </Link>
                        {vehicle.status !== "INACTIVE" ? (
                          <form action={deactivateVehicleAction}>
                            <input name="id" type="hidden" value={vehicle.id} />
                            <button
                              className="rounded-md border border-[#b65f5f] px-3 py-1.5 font-medium text-[#8a1f1f]"
                              type="submit"
                            >
                              Desactivar
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        basePath="/vehiculos"
        page={page}
        query={query}
        totalPages={totalPages}
      />
    </section>
  );
}

function Pagination({
  basePath,
  page,
  query,
  totalPages,
}: {
  basePath: string;
  page: number;
  query: string;
  totalPages: number;
}) {
  const previous = Math.max(page - 1, 1);
  const next = Math.min(page + 1, totalPages);
  const search = query ? `&q=${encodeURIComponent(query)}` : "";

  return (
    <div className="flex items-center justify-between text-sm text-[#53616b]">
      <span>
        Pagina {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          className="rounded-md border border-[#c9c7bd] px-3 py-2"
          href={`${basePath}?page=${previous}${search}`}
        >
          Anterior
        </Link>
        <Link
          className="rounded-md border border-[#c9c7bd] px-3 py-2"
          href={`${basePath}?page=${next}${search}`}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
