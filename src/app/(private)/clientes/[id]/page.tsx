import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deactivateClientAction } from "@/modules/clients/actions";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl">
      <Link className="text-sm font-semibold text-[#1f5f57]" href="/clientes">
        Volver a clientes
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
              Cliente
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {client.firstNames} {client.lastNames}
            </h1>
            <p className="mt-1 text-sm text-[#66727c]">
              {client.active ? "Activo" : "Inactivo"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              className="rounded-md border border-[#c9c7bd] px-4 py-2 text-sm font-semibold"
              href={`/clientes/${client.id}/editar`}
            >
              Editar
            </Link>
            {client.active ? (
              <form action={deactivateClientAction}>
                <input name="id" type="hidden" value={client.id} />
                <button
                  className="rounded-md border border-[#b65f5f] px-4 py-2 text-sm font-semibold text-[#8a1f1f]"
                  type="submit"
                >
                  Desactivar
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <Detail label="DNI" value={client.dni} />
          <Detail label="Correo" value={client.email} />
          <Detail label="Telefono" value={client.phone ?? "-"} />
          <Detail
            label="Ingreso mensual"
            value={`${client.incomeCurrency} ${client.monthlyIncome.toString()}`}
          />
          <Detail label="Ocupacion" value={client.occupation ?? "-"} />
          <Detail
            label="Nacimiento"
            value={client.birthDate?.toLocaleDateString("es-PE") ?? "-"}
          />
          <Detail label="Direccion" value={client.address ?? "-"} />
        </dl>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ebe8df] p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#66727c]">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium">{value}</dd>
    </div>
  );
}
