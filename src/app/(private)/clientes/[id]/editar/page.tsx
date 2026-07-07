import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/client-form";
import { prisma } from "@/lib/prisma";
import { decimalString } from "@/modules/shared/decimal";
import { updateClientAction } from "@/modules/clients/actions";

export default async function EditClientPage({
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
    <section className="mx-auto max-w-4xl">
      <Link
        className="text-sm font-semibold text-[#1f5f57]"
        href={`/clientes/${client.id}`}
      >
        Volver al cliente
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <h1 className="text-2xl font-semibold">Editar cliente</h1>
        <div className="mt-6">
          <ClientForm
            action={updateClientAction}
            initialValues={{
              id: client.id,
              dni: client.dni,
              firstNames: client.firstNames,
              lastNames: client.lastNames,
              email: client.email,
              phone: client.phone ?? "",
              address: client.address ?? "",
              birthDate: client.birthDate
                ? client.birthDate.toISOString().slice(0, 10)
                : "",
              occupation: client.occupation ?? "",
              monthlyIncome: decimalString(client.monthlyIncome),
              incomeCurrency: client.incomeCurrency,
            }}
            submitLabel="Guardar cambios"
          />
        </div>
      </div>
    </section>
  );
}
