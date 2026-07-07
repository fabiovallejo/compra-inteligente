import Link from "next/link";
import { ClientForm } from "@/components/client-form";
import { createClientAction } from "@/modules/clients/actions";

export default function NewClientPage() {
  return (
    <section className="mx-auto max-w-4xl">
      <Link className="text-sm font-semibold text-[#1f5f57]" href="/clientes">
        Volver a clientes
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <h1 className="text-2xl font-semibold">Registrar cliente</h1>
        <div className="mt-6">
          <ClientForm action={createClientAction} submitLabel="Crear cliente" />
        </div>
      </div>
    </section>
  );
}
