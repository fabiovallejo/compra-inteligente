"use client";

import { useActionState } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EntityField, inputClassName } from "./entity-field";
import type { ProductActionState } from "@/modules/products/actions";

export interface ProductFormValues {
  id?: string;
  name: string;
  currency: "PEN" | "USD";
  defaultDownPaymentRate: string;
  defaultResidualValueRate: string;
  defaultTermMonths: string;
  defaultRateType: "EFFECTIVE_ANNUAL" | "NOMINAL_ANNUAL";
  defaultAnnualRate: string;
  capitalization: string;
  cok: string;
  debtReliefInsuranceRate: string;
  vehicleInsuranceRate: string;
  periodicCommission: string;
  itfRate: string;
}

const initialState: ProductActionState = {};

export function ProductForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (
    previousState: ProductActionState,
    formData: FormData,
  ) => Promise<ProductActionState>;
  initialValues?: Partial<ProductFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const {
    register,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: initialValues?.name ?? "",
      currency: initialValues?.currency ?? "PEN",
      defaultDownPaymentRate: initialValues?.defaultDownPaymentRate ?? "20",
      defaultResidualValueRate: initialValues?.defaultResidualValueRate ?? "50",
      defaultTermMonths: initialValues?.defaultTermMonths ?? "36",
      defaultRateType: initialValues?.defaultRateType ?? "EFFECTIVE_ANNUAL",
      defaultAnnualRate: initialValues?.defaultAnnualRate ?? "15",
      capitalization: initialValues?.capitalization ?? "MONTHLY",
      cok: initialValues?.cok ?? "10",
      debtReliefInsuranceRate: initialValues?.debtReliefInsuranceRate ?? "0.05",
      vehicleInsuranceRate: initialValues?.vehicleInsuranceRate ?? "0.08",
      periodicCommission: initialValues?.periodicCommission ?? "5",
      itfRate: initialValues?.itfRate ?? "0.005",
    },
    mode: "onBlur",
  });
  const [rateType, setRateType] = useState(
    initialValues?.defaultRateType ?? "EFFECTIVE_ANNUAL",
  );
  const rateTypeRegister = register("defaultRateType");

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
          error={errors.name?.message ?? state.fieldErrors?.name?.at(0)}
          help="Nombre comercial que identifica la configuracion financiera."
          label="Nombre"
          name="name"
        >
          <input
            {...register("name", { required: "Ingresa el nombre." })}
            className={inputClassName}
            id="name"
            name="name"
            placeholder="Compra Inteligente Vehicular PEN"
            required
          />
        </EntityField>

        <EntityField
          error={errors.currency?.message ?? state.fieldErrors?.currency?.at(0)}
          help="Moneda en la que opera el producto financiero."
          label="Moneda"
          name="currency"
        >
          <select
            {...register("currency", { required: "Selecciona una moneda." })}
            className={inputClassName}
            id="currency"
            name="currency"
          >
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
          </select>
        </EntityField>

        <NumberField
          error={
            errors.defaultDownPaymentRate?.message ??
            state.fieldErrors?.defaultDownPaymentRate?.at(0)
          }
          help="Porcentaje inicial sugerido sobre el precio del vehiculo."
          label="Inicial predeterminada (%)"
          name="defaultDownPaymentRate"
          placeholder="20"
          register={register}
        />
        <NumberField
          error={
            errors.defaultResidualValueRate?.message ??
            state.fieldErrors?.defaultResidualValueRate?.at(0)
          }
          help="Porcentaje residual usado para calcular la cuota balon."
          label="Valor residual predeterminado (%)"
          name="defaultResidualValueRate"
          placeholder="50"
          register={register}
        />
        <NumberField
          error={
            errors.defaultTermMonths?.message ??
            state.fieldErrors?.defaultTermMonths?.at(0)
          }
          help="Plazo mensual sugerido para nuevas simulaciones."
          label="Plazo predeterminado"
          name="defaultTermMonths"
          placeholder="36"
          register={register}
        />

        <EntityField
          error={
            errors.defaultRateType?.message ??
            state.fieldErrors?.defaultRateType?.at(0)
          }
          help="TEA usa tasa efectiva anual; TNA exige frecuencia de capitalizacion."
          label="Tipo de tasa"
          name="defaultRateType"
        >
          <select
            {...rateTypeRegister}
            className={inputClassName}
            id="defaultRateType"
            name="defaultRateType"
            onChange={(event) => {
              rateTypeRegister.onChange(event);
              setRateType(
                event.target.value as "EFFECTIVE_ANNUAL" | "NOMINAL_ANNUAL",
              );
            }}
          >
            <option value="EFFECTIVE_ANNUAL">TEA</option>
            <option value="NOMINAL_ANNUAL">TNA</option>
          </select>
        </EntityField>

        <NumberField
          error={
            errors.defaultAnnualRate?.message ??
            state.fieldErrors?.defaultAnnualRate?.at(0)
          }
          help="Tasa anual predeterminada expresada en porcentaje."
          label="Tasa anual (%)"
          name="defaultAnnualRate"
          placeholder="15"
          register={register}
        />

        <EntityField
          error={
            errors.capitalization?.message ??
            state.fieldErrors?.capitalization?.at(0)
          }
          help="Frecuencia obligatoria cuando el producto usa TNA."
          label="Capitalizacion"
          name="capitalization"
        >
          <select
            {...register("capitalization")}
            className={inputClassName}
            disabled={rateType !== "NOMINAL_ANNUAL"}
            id="capitalization"
            name="capitalization"
          >
            <option value="">No aplica</option>
            <option value="MONTHLY">Mensual</option>
            <option value="BIMONTHLY">Bimestral</option>
            <option value="QUARTERLY">Trimestral</option>
            <option value="SEMIANNUAL">Semestral</option>
            <option value="ANNUAL">Anual</option>
            <option value="DAILY_360">Diaria 360</option>
          </select>
        </EntityField>

        <NumberField
          error={errors.cok?.message ?? state.fieldErrors?.cok?.at(0)}
          help="Costo de oportunidad anual usado para descontar los flujos."
          label="COK anual (%)"
          name="cok"
          placeholder="10"
          register={register}
        />
        <NumberField
          error={
            errors.debtReliefInsuranceRate?.message ??
            state.fieldErrors?.debtReliefInsuranceRate?.at(0)
          }
          help="Seguro de desgravamen mensual aplicado sobre saldo."
          label="Desgravamen mensual (%)"
          name="debtReliefInsuranceRate"
          placeholder="0.05"
          register={register}
        />
        <NumberField
          error={
            errors.vehicleInsuranceRate?.message ??
            state.fieldErrors?.vehicleInsuranceRate?.at(0)
          }
          help="Seguro vehicular mensual aplicado sobre el precio del vehiculo."
          label="Seguro vehicular mensual (%)"
          name="vehicleInsuranceRate"
          placeholder="0.08"
          register={register}
        />
        <NumberField
          error={
            errors.periodicCommission?.message ??
            state.fieldErrors?.periodicCommission?.at(0)
          }
          help="Monto fijo cobrado en cada periodo aplicable."
          label="Comision periodica"
          name="periodicCommission"
          placeholder="5"
          register={register}
        />
        <NumberField
          error={errors.itfRate?.message ?? state.fieldErrors?.itfRate?.at(0)}
          help="Impuesto a las transacciones financieras aplicado al pago."
          label="ITF (%)"
          name="itfRate"
          placeholder="0.005"
          register={register}
        />
      </div>

      <div className="flex justify-end">
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

function NumberField({
  error,
  help,
  label,
  name,
  placeholder,
  register,
}: {
  error?: string;
  help: string;
  label: string;
  name: keyof ProductFormValues;
  placeholder: string;
  register: ReturnType<typeof useForm<ProductFormValues>>["register"];
}) {
  return (
    <EntityField error={error} help={help} label={label} name={name}>
      <input
        {...register(name, { required: "Campo obligatorio." })}
        className={inputClassName}
        id={name}
        inputMode="decimal"
        name={name}
        placeholder={placeholder}
        required
      />
    </EntityField>
  );
}
