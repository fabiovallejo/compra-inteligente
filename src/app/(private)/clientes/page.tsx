import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deactivateClientAction } from "@/modules/clients/actions";

export const dynamic = "force-dynamic";

const pageSize = 10;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const page = Math.max(Number(params.page ?? 1) || 1, 1);
  const where: Prisma.ClientWhereInput = query
    ? {
        OR: [
          { dni: { contains: query } },
          { firstNames: { contains: query, mode: "insensitive" } },
          { lastNames: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.client.count({ where }),
  ]);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
            Gestion comercial
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Clientes</h1>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#1f5f57] px-4 text-sm font-semibold text-white transition hover:bg-[#184c46]"
          href="/clientes/nuevo"
        >
          Registrar cliente
        </Link>
      </div>

      <form className="flex flex-col gap-3 rounded-md border border-[#d6d3c8] bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold" htmlFor="q">
              Buscar clientes
            </label>
            <button
              aria-label="Ayuda para buscar clientes"
              className="flex size-7 items-center justify-center rounded-full border border-[#c9c7bd] text-xs font-bold text-[#2f6f65]"
              title="Filtra por DNI, nombres, apellidos o correo del cliente."
              type="button"
            >
              i
            </button>
          </div>
          <input
            className="h-10 rounded-md border border-[#c9c7bd] px-3 text-sm outline-none focus:border-[#2f6f65] focus:ring-2 focus:ring-[#2f6f65]/20"
            defaultValue={query}
            id="q"
            name="q"
            placeholder="Buscar por DNI, nombre o correo"
          />
        </div>
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
                <th className="px-5 py-3 font-semibold">DNI</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Correo</th>
                <th className="px-5 py-3 font-semibold">Telefono</th>
                <th className="px-5 py-3 font-semibold">Ingreso</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#66727c]" colSpan={7}>
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr className="border-t border-[#ebe8df]" key={client.id}>
                    <td className="px-5 py-4 font-medium">{client.dni}</td>
                    <td className="px-5 py-4">
                      {client.firstNames} {client.lastNames}
                    </td>
                    <td className="px-5 py-4">{client.email}</td>
                    <td className="px-5 py-4">{client.phone}</td>
                    <td className="px-5 py-4">
                      {client.incomeCurrency} {client.monthlyIncome.toString()}
                    </td>
                    <td className="px-5 py-4">
                      {client.active ? "Activo" : "Inactivo"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-md border border-[#c9c7bd] px-3 py-1.5 font-medium"
                          href={`/clientes/${client.id}`}
                        >
                          Ver
                        </Link>
                        <Link
                          className="rounded-md border border-[#c9c7bd] px-3 py-1.5 font-medium"
                          href={`/clientes/${client.id}/editar`}
                        >
                          Editar
                        </Link>
                        {client.active ? (
                          <form action={deactivateClientAction}>
                            <input name="id" type="hidden" value={client.id} />
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
        basePath="/clientes"
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
