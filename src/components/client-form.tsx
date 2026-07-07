"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { EntityField, inputClassName, textareaClassName } from "./entity-field";
import type { ClientActionState } from "@/modules/clients/actions";

export interface ClientFormValues {
  id?: string;
  dni: string;
  firstNames: string;
  lastNames: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  occupation: string;
  monthlyIncome: string;
  incomeCurrency: "PEN" | "USD";
}

const initialState: ClientActionState = {};

export function ClientForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (
    previousState: ClientActionState,
    formData: FormData,
  ) => Promise<ClientActionState>;
  initialValues?: Partial<ClientFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const {
    register,
    formState: { errors },
  } = useForm<ClientFormValues>({
    defaultValues: {
      dni: initialValues?.dni ?? "",
      firstNames: initialValues?.firstNames ?? "",
      lastNames: initialValues?.lastNames ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      address: initialValues?.address ?? "",
      birthDate: initialValues?.birthDate ?? "",
      occupation: initialValues?.occupation ?? "",
      monthlyIncome: initialValues?.monthlyIncome ?? "",
      incomeCurrency: initialValues?.incomeCurrency ?? "PEN",
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
          error={errors.dni?.message ?? state.fieldErrors?.dni?.at(0)}
          help="El DNI peruano debe contener exactamente 8 digitos."
          label="DNI"
          name="dni"
        >
          <input
            {...register("dni", {
              required: "Ingresa el DNI.",
              pattern: {
                value: /^\d{8}$/,
                message: "El DNI debe tener exactamente 8 digitos.",
              },
            })}
            className={inputClassName}
            id="dni"
            inputMode="numeric"
            name="dni"
            placeholder="12345678"
            required
          />
        </EntityField>

        <EntityField
          error={errors.email?.message ?? state.fieldErrors?.email?.at(0)}
          help="Correo principal para comunicaciones del credito."
          label="Correo"
          name="email"
        >
          <input
            {...register("email", {
              required: "Ingresa el correo.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Ingresa un correo valido.",
              },
            })}
            autoComplete="email"
            className={inputClassName}
            id="email"
            name="email"
            placeholder="cliente@correo.com"
            required
            type="email"
          />
        </EntityField>

        <EntityField
          error={
            errors.firstNames?.message ?? state.fieldErrors?.firstNames?.at(0)
          }
          help="Nombres completos segun documento de identidad."
          label="Nombres"
          name="firstNames"
        >
          <input
            {...register("firstNames", {
              required: "Ingresa los nombres.",
            })}
            className={inputClassName}
            id="firstNames"
            name="firstNames"
            placeholder="Mariana Lucia"
            required
          />
        </EntityField>

        <EntityField
          error={errors.lastNames?.message ?? state.fieldErrors?.lastNames?.at(0)}
          help="Apellidos completos segun documento de identidad."
          label="Apellidos"
          name="lastNames"
        >
          <input
            {...register("lastNames", {
              required: "Ingresa los apellidos.",
            })}
            className={inputClassName}
            id="lastNames"
            name="lastNames"
            placeholder="Torres Salazar"
            required
          />
        </EntityField>

        <EntityField
          error={errors.phone?.message ?? state.fieldErrors?.phone?.at(0)}
          help="Telefono de contacto, puede incluir espacios o prefijo internacional."
          label="Telefono"
          name="phone"
        >
          <input
            {...register("phone", {
              required: "Ingresa un telefono.",
              pattern: {
                value: /^[0-9+()\-\s]{7,20}$/,
                message: "Ingresa un telefono valido.",
              },
            })}
            className={inputClassName}
            id="phone"
            name="phone"
            placeholder="999111222"
            required
          />
        </EntityField>

        <EntityField
          error={
            errors.monthlyIncome?.message ??
            state.fieldErrors?.monthlyIncome?.at(0)
          }
          help="Ingreso mensual declarado; debe ser mayor que cero."
          label="Ingreso mensual"
          name="monthlyIncome"
        >
          <input
            {...register("monthlyIncome", {
              required: "Ingresa el ingreso mensual.",
              min: {
                value: 0.01,
                message: "El ingreso mensual debe ser mayor que cero.",
              },
            })}
            className={inputClassName}
            id="monthlyIncome"
            inputMode="decimal"
            name="monthlyIncome"
            placeholder="8500.00"
            required
          />
        </EntityField>

        <EntityField
          error={
            errors.incomeCurrency?.message ??
            state.fieldErrors?.incomeCurrency?.at(0)
          }
          help="Moneda en la que el cliente percibe sus ingresos."
          label="Moneda del ingreso"
          name="incomeCurrency"
        >
          <select
            {...register("incomeCurrency", {
              required: "Selecciona una moneda.",
            })}
            className={inputClassName}
            id="incomeCurrency"
            name="incomeCurrency"
            required
          >
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
          </select>
        </EntityField>

        <EntityField
          error={errors.birthDate?.message ?? state.fieldErrors?.birthDate?.at(0)}
          help="Fecha de nacimiento para evaluacion y registro del cliente."
          label="Fecha de nacimiento"
          name="birthDate"
        >
          <input
            {...register("birthDate")}
            className={inputClassName}
            id="birthDate"
            name="birthDate"
            placeholder="1991-04-18"
            type="date"
          />
        </EntityField>
      </div>

      <EntityField
        error={errors.occupation?.message ?? state.fieldErrors?.occupation?.at(0)}
        help="Ocupacion actual declarada por el cliente."
        label="Ocupacion"
        name="occupation"
      >
        <input
          {...register("occupation")}
          className={inputClassName}
          id="occupation"
          name="occupation"
          placeholder="Analista financiera"
        />
      </EntityField>

      <EntityField
        error={errors.address?.message ?? state.fieldErrors?.address?.at(0)}
        help="Direccion de residencia o contacto del cliente."
        label="Direccion"
        name="address"
      >
        <textarea
          {...register("address")}
          className={textareaClassName}
          id="address"
          name="address"
          placeholder="Av. Javier Prado 1234, Lima"
        />
      </EntityField>

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
