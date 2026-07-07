"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { EntityField, inputClassName } from "./entity-field";
import type { VehicleActionState } from "@/modules/vehicles/actions";

export interface VehicleFormValues {
  id?: string;
  vin: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  type: string;
  condition: "NUEVO" | "SEMINUEVO";
  price: string;
  currency: "PEN" | "USD";
}

const initialState: VehicleActionState = {};

export function VehicleForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (
    previousState: VehicleActionState,
    formData: FormData,
  ) => Promise<VehicleActionState>;
  initialValues?: Partial<VehicleFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const {
    register,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    defaultValues: {
      vin: initialValues?.vin ?? "",
      brand: initialValues?.brand ?? "",
      model: initialValues?.model ?? "",
      year: initialValues?.year ?? "",
      color: initialValues?.color ?? "",
      type: initialValues?.type ?? "",
      condition: initialValues?.condition ?? "NUEVO",
      price: initialValues?.price ?? "",
      currency: initialValues?.currency ?? "PEN",
    },
    mode: "onBlur",
  });

  return (
    <form action={formAction} className="grid gap-5" noValidate={false}>
      {initialValues?.id ? (
        <input name="id" type="hidden" value={initialValues.id} />
      ) : null}

      {state.message ? (
        <div
          className="rounded-md border border-[#d9a3a3] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#8a1f1f]"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <EntityField
          error={errors.vin?.message ?? state.fieldErrors?.vin?.at(0)}
          help="Identificador unico del vehiculo, 17 caracteres sin I, O ni Q."
          label="VIN"
          name="vin"
        >
          <input
            {...register("vin", {
              required: "Ingresa el VIN.",
              pattern: {
                value: /^[A-HJ-NPR-Z0-9]{17}$/i,
                message:
                  "El VIN debe tener 17 caracteres validos y no puede incluir I, O ni Q.",
              },
            })}
            className={inputClassName}
            id="vin"
            name="vin"
            placeholder="8APDE1234RA000001"
            required
          />
        </EntityField>

        <EntityField
          error={errors.brand?.message ?? state.fieldErrors?.brand?.at(0)}
          help="Marca comercial del vehiculo."
          label="Marca"
          name="brand"
        >
          <input
            {...register("brand", { required: "Ingresa la marca." })}
            className={inputClassName}
            id="brand"
            name="brand"
            placeholder="Toyota"
            required
          />
        </EntityField>

        <EntityField
          error={errors.model?.message ?? state.fieldErrors?.model?.at(0)}
          help="Modelo comercial del vehiculo."
          label="Modelo"
          name="model"
        >
          <input
            {...register("model", { required: "Ingresa el modelo." })}
            className={inputClassName}
            id="model"
            name="model"
            placeholder="Corolla Cross"
            required
          />
        </EntityField>

        <EntityField
          error={errors.year?.message ?? state.fieldErrors?.year?.at(0)}
          help="Anio de fabricacion o modelo."
          label="Anio"
          name="year"
        >
          <input
            {...register("year", {
              required: "Ingresa el anio.",
              min: { value: 1900, message: "El anio no puede ser menor a 1900." },
              max: { value: 2100, message: "El anio no puede ser mayor a 2100." },
            })}
            className={inputClassName}
            id="year"
            inputMode="numeric"
            name="year"
            placeholder="2025"
            required
          />
        </EntityField>

        <EntityField
          error={errors.condition?.message ?? state.fieldErrors?.condition?.at(0)}
          help="Condicion comercial permitida para el financiamiento."
          label="Condicion"
          name="condition"
        >
          <select
            {...register("condition", {
              required: "Selecciona una condicion.",
            })}
            className={inputClassName}
            id="condition"
            name="condition"
            required
          >
            <option value="NUEVO">NUEVO</option>
            <option value="SEMINUEVO">SEMINUEVO</option>
          </select>
        </EntityField>

        <EntityField
          error={errors.price?.message ?? state.fieldErrors?.price?.at(0)}
          help="Precio del vehiculo; debe ser mayor que cero."
          label="Precio"
          name="price"
        >
          <input
            {...register("price", {
              required: "Ingresa el precio.",
              min: { value: 0.01, message: "El precio debe ser mayor que cero." },
            })}
            className={inputClassName}
            id="price"
            inputMode="decimal"
            name="price"
            placeholder="70000.00"
            required
          />
        </EntityField>

        <EntityField
          error={errors.currency?.message ?? state.fieldErrors?.currency?.at(0)}
          help="Moneda del precio del vehiculo."
          label="Moneda"
          name="currency"
        >
          <select
            {...register("currency", { required: "Selecciona una moneda." })}
            className={inputClassName}
            id="currency"
            name="currency"
            required
          >
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
          </select>
        </EntityField>

        <EntityField
          error={errors.color?.message ?? state.fieldErrors?.color?.at(0)}
          help="Color principal del vehiculo."
          label="Color"
          name="color"
        >
          <input
            {...register("color")}
            className={inputClassName}
            id="color"
            name="color"
            placeholder="Blanco perla"
          />
        </EntityField>

        <EntityField
          error={errors.type?.message ?? state.fieldErrors?.type?.at(0)}
          help="Categoria o carroceria del vehiculo."
          label="Tipo"
          name="type"
        >
          <input
            {...register("type")}
            className={inputClassName}
            id="type"
            name="type"
            placeholder="SUV"
          />
        </EntityField>
      </div>

      <div className="flex justify-end gap-3">
        <button
          className="rounded-md bg-[#1f5f57] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#184c46] disabled:cursor-not-allowed disabled:bg-[#7a9a95]"
          disabled={pending}
          type="submit"
        >
          {pending ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
