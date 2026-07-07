import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleForm } from "@/components/vehicle-form";
import { prisma } from "@/lib/prisma";
import { decimalString } from "@/modules/shared/decimal";
import { updateVehicleAction } from "@/modules/vehicles/actions";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });

  if (!vehicle) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl">
      <Link
        className="text-sm font-semibold text-[#1f5f57]"
        href={`/vehiculos/${vehicle.id}`}
      >
        Volver al vehiculo
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <h1 className="text-2xl font-semibold">Editar vehiculo</h1>
        <div className="mt-6">
          <VehicleForm
            action={updateVehicleAction}
            initialValues={{
              id: vehicle.id,
              vin: vehicle.vin,
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year.toString(),
              color: vehicle.color ?? "",
              type: vehicle.type ?? "",
              condition: vehicle.condition,
              price: decimalString(vehicle.price),
              currency: vehicle.currency,
            }}
            submitLabel="Guardar cambios"
          />
        </div>
      </div>
    </section>
  );
}
