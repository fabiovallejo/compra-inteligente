import Link from "next/link";
import { VehicleForm } from "@/components/vehicle-form";
import { createVehicleAction } from "@/modules/vehicles/actions";

export default function NewVehiclePage() {
  return (
    <section className="mx-auto max-w-4xl">
      <Link className="text-sm font-semibold text-[#1f5f57]" href="/vehiculos">
        Volver a vehiculos
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <h1 className="text-2xl font-semibold">Registrar vehiculo</h1>
        <div className="mt-6">
          <VehicleForm
            action={createVehicleAction}
            submitLabel="Crear vehiculo"
          />
        </div>
      </div>
    </section>
  );
}
