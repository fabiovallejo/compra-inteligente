"use client";

import Decimal from "decimal.js";
import { useActionState, useMemo, useState } from "react";
import {
  calculateCredit,
  CreditCalculationResult,
  effectiveAnnualRateToMonthly,
} from "@/domain/finance";
import {
  SaveSimulationState,
  saveSimulationAction,
} from "@/modules/simulations/actions";
import { simulationToCreditInput } from "@/modules/simulations/mapper";
import { simulationSchema } from "@/modules/simulations/validation";

export interface SimulationClientOption {
  id: string;
  label: string;
  monthlyIncome: string;
  incomeCurrency: "PEN" | "USD";
}

export interface SimulationVehicleOption {
  id: string;
  label: string;
  price: string;
  currency: "PEN" | "USD";
}

export interface SimulationProductOption {
  id: string;
  label: string;
  currency: "PEN" | "USD";
  downPaymentRate: string;
  residualValueRate: string;
  termMonths: number;
  rateType: "EFFECTIVE_ANNUAL" | "NOMINAL_ANNUAL";
  annualRate: string;
  capitalization: string;
  cok: string;
  debtReliefInsuranceRate: string;
  vehicleInsuranceRate: string;
  periodicCommission: string;
  itfRate: string;
}

export interface WizardForm {
  clientId: string;
  vehicleId: string;
  financialProductId: string;
  currency: "PEN" | "USD";
  vehiclePrice: string;
  downPaymentRate: string;
  residualValueRate: string;
  termMonths: string;
  rateType: "EFFECTIVE_ANNUAL" | "NOMINAL_ANNUAL";
  annualRate: string;
  capitalizationFrequency: string;
  totalGraceEnabled: boolean;
  totalGraceFrom: string;
  totalGraceTo: string;
  partialGraceEnabled: boolean;
  partialGraceFrom: string;
  partialGraceTo: string;
  debtReliefInsuranceMonthlyRate: string;
  vehicleInsuranceMonthlyRate: string;
  periodicCommission: string;
  itfRate: string;
  annualDiscountRate: string;
  clientMonthlyIncome: string;
}

const steps = [
  "Cliente y vehiculo",
  "Inicial y balon",
  "Tasa",
  "Gracia",
  "Costos y COK",
  "Revision",
];

const saveInitialState: SaveSimulationState = {};

export function SimulationWizard({
  clients,
  initialValues,
  products,
  simulationId,
  vehicles,
}: {
  clients: SimulationClientOption[];
  initialValues?: Partial<WizardForm>;
  products: SimulationProductOption[];
  simulationId?: string;
  vehicles: SimulationVehicleOption[];
}) {
  const [saveState, saveAction, pendingSave] = useActionState(
    saveSimulationAction,
    saveInitialState,
  );
  const [step, setStep] = useState(0);
  const [previewRequested, setPreviewRequested] = useState(false);
  const [form, setForm] = useState<WizardForm>(() => {
    const client = clients[0];
    const vehicle = vehicles[0];
    const product =
      products.find((item) => item.currency === vehicle?.currency) ??
      products[0];

    return {
      clientId: client?.id ?? "",
      vehicleId: vehicle?.id ?? "",
      financialProductId: product?.id ?? "",
      currency: product?.currency ?? vehicle?.currency ?? "PEN",
      vehiclePrice: vehicle?.price ?? "0",
      downPaymentRate: product?.downPaymentRate ?? "20",
      residualValueRate: product?.residualValueRate ?? "50",
      termMonths: String(product?.termMonths ?? 36),
      rateType: product?.rateType ?? "EFFECTIVE_ANNUAL",
      annualRate: product?.annualRate ?? "15",
      capitalizationFrequency: product?.capitalization ?? "MONTHLY",
      totalGraceEnabled: false,
      totalGraceFrom: "",
      totalGraceTo: "",
      partialGraceEnabled: false,
      partialGraceFrom: "",
      partialGraceTo: "",
      debtReliefInsuranceMonthlyRate:
        product?.debtReliefInsuranceRate ?? "0.05",
      vehicleInsuranceMonthlyRate: product?.vehicleInsuranceRate ?? "0.08",
      periodicCommission: product?.periodicCommission ?? "5",
      itfRate: product?.itfRate ?? "0.005",
      annualDiscountRate: product?.cok ?? "10",
      clientMonthlyIncome: client?.monthlyIncome ?? "0",
      ...initialValues,
    };
  });

  function patch(next: Partial<WizardForm>) {
    setPreviewRequested(false);
    setForm((current) => ({ ...current, ...next }));
  }

  function selectClient(clientId: string) {
    const client = clients.find((item) => item.id === clientId);
    patch({
      clientId,
      clientMonthlyIncome: client?.monthlyIncome ?? form.clientMonthlyIncome,
    });
  }

  function selectVehicle(vehicleId: string) {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    const product = products.find((item) => item.currency === vehicle?.currency);
    patch({
      vehicleId,
      vehiclePrice: vehicle?.price ?? form.vehiclePrice,
      currency: vehicle?.currency ?? form.currency,
      ...(product ? productDefaults(product) : {}),
    });
  }

  function selectProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      patch({ financialProductId: productId });
      return;
    }

    patch({
      ...productDefaults(product),
    });
  }

  const parsed = useMemo(() => parseWizardForm(form), [form]);
  const calculation = useMemo(() => {
    if (!parsed.success) {
      return null;
    }

    try {
      return calculateCredit(simulationToCreditInput(parsed.data));
    } catch {
      return null;
    }
  }, [parsed]);
  const errors = parsed.success ? {} : parsed.error.flatten().fieldErrors;
  const firstPayment = calculation?.schedule.find((item) =>
    item.totalPayment.gt(0),
  );
  const ratio = firstPayment
    ? firstPayment.totalPayment
        .div(new Decimal(form.clientMonthlyIncome || "1"))
        .mul(100)
    : null;
  const monthlyDiscountRate = safeMonthlyDiscount(form.annualDiscountRate);
  const payload = parsed.success ? JSON.stringify(parsed.data) : "";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <button
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              step === index
                ? "border-[#1f5f57] bg-[#1f5f57] text-white"
                : "border-[#d6d3c8] bg-white text-[#34434e]"
            }`}
            key={label}
            onClick={() => setStep(index)}
            type="button"
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-[#d6d3c8] bg-white p-5">
        {step === 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              error={errors.clientId?.at(0)}
              help="Cliente al que se asociara la simulacion."
              label="Cliente"
              name="clientId"
              onChange={selectClient}
              value={form.clientId}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              error={errors.vehicleId?.at(0)}
              help="Vehiculo que define precio y moneda base."
              label="Vehiculo"
              name="vehicleId"
              onChange={selectVehicle}
              value={form.vehicleId}
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              error={errors.financialProductId?.at(0)}
              help="Producto financiero con valores predeterminados."
              label="Producto financiero"
              name="financialProductId"
              onChange={selectProduct}
              value={form.financialProductId}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                </option>
              ))}
            </SelectField>
            <ReadOnlyField
              help="Ingreso mensual registrado del cliente seleccionado."
              label="Ingreso del cliente"
              value={form.clientMonthlyIncome}
            />
            <SelectField
              error={errors.currency?.at(0)}
              help="Moneda de la simulacion."
              label="Moneda"
              name="currency"
              onChange={(value) => {
                const currency = value as "PEN" | "USD";
                const product = products.find((item) => item.currency === currency);
                patch({
                  currency,
                  ...(product ? productDefaults(product) : {}),
                });
              }}
              value={form.currency}
            >
              <option value="PEN">PEN</option>
              <option value="USD">USD</option>
            </SelectField>
            <InputField
              error={errors.vehiclePrice?.at(0)}
              help="Precio del vehiculo usado por el motor financiero."
              label="Precio del vehiculo"
              name="vehiclePrice"
              onChange={(value) => patch({ vehiclePrice: value })}
              placeholder="70000.00"
              value={form.vehiclePrice}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <InputField
              error={errors.downPaymentRate?.at(0)}
              help="Porcentaje de inicial sobre el precio del vehiculo."
              label="Cuota inicial (%)"
              name="downPaymentRate"
              onChange={(value) => patch({ downPaymentRate: value })}
              placeholder="20"
              value={form.downPaymentRate}
            />
            <ReadOnlyField
              help="Monto de cuota inicial calculado por el motor."
              label="Cuota inicial monto"
              value={calculation?.downPayment.toFixed(4) ?? "-"}
            />
            <ReadOnlyField
              help="Monto que se financia despues de descontar la inicial."
              label="Monto financiado"
              value={calculation?.financedAmount.toFixed(4) ?? "-"}
            />
            <InputField
              error={errors.residualValueRate?.at(0)}
              help="Porcentaje residual para calcular la cuota balon."
              label="Valor residual (%)"
              name="residualValueRate"
              onChange={(value) => patch({ residualValueRate: value })}
              placeholder="50"
              value={form.residualValueRate}
            />
            <ReadOnlyField
              help="Cuota balon calculada sobre el precio del vehiculo."
              label="Cuota balon"
              value={calculation?.balloonPayment.toFixed(4) ?? "-"}
            />
            <InputField
              error={errors.termMonths?.at(0)}
              help="Plazo total de la simulacion en meses."
              label="Plazo mensual"
              name="termMonths"
              onChange={(value) => patch({ termMonths: value })}
              placeholder="36"
              value={form.termMonths}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              error={errors.rateType?.at(0)}
              help="TEA convierte directamente a TEM; TNA requiere capitalizacion."
              label="Tipo de tasa"
              name="rateType"
              onChange={(value) =>
                patch({
                  rateType: value as "EFFECTIVE_ANNUAL" | "NOMINAL_ANNUAL",
                })
              }
              value={form.rateType}
            >
              <option value="EFFECTIVE_ANNUAL">TEA</option>
              <option value="NOMINAL_ANNUAL">TNA</option>
            </SelectField>
            <InputField
              error={errors.annualRate?.at(0)}
              help="Tasa anual ingresada como porcentaje."
              label="Tasa anual (%)"
              name="annualRate"
              onChange={(value) => patch({ annualRate: value })}
              placeholder="15"
              value={form.annualRate}
            />
            <SelectField
              disabled={form.rateType !== "NOMINAL_ANNUAL"}
              error={errors.capitalizationFrequency?.at(0)}
              help="Frecuencia usada para convertir TNA a TEM."
              label="Capitalizacion"
              name="capitalizationFrequency"
              onChange={(value) => patch({ capitalizationFrequency: value })}
              value={
                form.rateType === "NOMINAL_ANNUAL"
                  ? form.capitalizationFrequency
                  : ""
              }
            >
              <option value="">No aplica</option>
              <option value="MONTHLY">Mensual</option>
              <option value="BIMONTHLY">Bimestral</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="SEMIANNUAL">Semestral</option>
              <option value="ANNUAL">Anual</option>
              <option value="DAILY_360">Diaria 360</option>
            </SelectField>
            <ReadOnlyField
              help="Tasa efectiva mensual calculada por el motor financiero."
              label="TEM calculada"
              value={
                calculation
                  ? `${calculation.monthlyEffectiveRate.mul(100).toFixed(8)}%`
                  : "-"
              }
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <CheckField
              checked={form.totalGraceEnabled}
              help="Durante gracia total no se pagan cuota ni cargos; intereses capitalizan."
              label="Habilitar gracia total"
              name="totalGraceEnabled"
              onChange={(checked) => patch({ totalGraceEnabled: checked })}
            />
            <CheckField
              checked={form.partialGraceEnabled}
              help="Durante gracia parcial se pagan intereses y cargos, sin amortizar capital."
              label="Habilitar gracia parcial"
              name="partialGraceEnabled"
              onChange={(checked) => patch({ partialGraceEnabled: checked })}
            />
            <InputField
              disabled={!form.totalGraceEnabled}
              error={errors.totalGraceFrom?.at(0)}
              help="Primer periodo mensual de gracia total."
              label="Gracia total desde"
              name="totalGraceFrom"
              onChange={(value) => patch({ totalGraceFrom: value })}
              placeholder="1"
              value={form.totalGraceFrom}
            />
            <InputField
              disabled={!form.totalGraceEnabled}
              error={errors.totalGraceTo?.at(0)}
              help="Ultimo periodo mensual de gracia total."
              label="Gracia total hasta"
              name="totalGraceTo"
              onChange={(value) => patch({ totalGraceTo: value })}
              placeholder="2"
              value={form.totalGraceTo}
            />
            <InputField
              disabled={!form.partialGraceEnabled}
              error={errors.partialGraceFrom?.at(0)}
              help="Primer periodo mensual de gracia parcial."
              label="Gracia parcial desde"
              name="partialGraceFrom"
              onChange={(value) => patch({ partialGraceFrom: value })}
              placeholder="3"
              value={form.partialGraceFrom}
            />
            <InputField
              disabled={!form.partialGraceEnabled}
              error={errors.partialGraceTo?.at(0)}
              help="Ultimo periodo mensual de gracia parcial."
              label="Gracia parcial hasta"
              name="partialGraceTo"
              onChange={(value) => patch({ partialGraceTo: value })}
              placeholder="4"
              value={form.partialGraceTo}
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <InputField
              error={errors.debtReliefInsuranceMonthlyRate?.at(0)}
              help="Seguro de desgravamen mensual sobre saldo."
              label="Seguro de desgravamen (%)"
              name="debtReliefInsuranceMonthlyRate"
              onChange={(value) =>
                patch({ debtReliefInsuranceMonthlyRate: value })
              }
              placeholder="0.05"
              value={form.debtReliefInsuranceMonthlyRate}
            />
            <InputField
              error={errors.vehicleInsuranceMonthlyRate?.at(0)}
              help="Seguro vehicular mensual sobre precio del vehiculo."
              label="Seguro vehicular (%)"
              name="vehicleInsuranceMonthlyRate"
              onChange={(value) => patch({ vehicleInsuranceMonthlyRate: value })}
              placeholder="0.08"
              value={form.vehicleInsuranceMonthlyRate}
            />
            <InputField
              error={errors.periodicCommission?.at(0)}
              help="Comision fija cobrada por periodo aplicable."
              label="Comision"
              name="periodicCommission"
              onChange={(value) => patch({ periodicCommission: value })}
              placeholder="5"
              value={form.periodicCommission}
            />
            <InputField
              error={errors.itfRate?.at(0)}
              help="ITF aplicado al monto de cada operacion."
              label="ITF (%)"
              name="itfRate"
              onChange={(value) => patch({ itfRate: value })}
              placeholder="0.005"
              value={form.itfRate}
            />
            <InputField
              error={errors.annualDiscountRate?.at(0)}
              help="COK anual usado para descontar flujos y calcular VAN."
              label="COK anual (%)"
              name="annualDiscountRate"
              onChange={(value) => patch({ annualDiscountRate: value })}
              placeholder="10"
              value={form.annualDiscountRate}
            />
            <ReadOnlyField
              help="Tasa mensual equivalente del COK anual."
              label="Tasa de descuento mensual"
              value={
                monthlyDiscountRate
                  ? `${monthlyDiscountRate.mul(100).toFixed(8)}%`
                  : "-"
              }
            />
          </div>
        ) : null}

        {step === 5 ? (
          <ReviewPanel
            calculation={calculation}
            errors={Object.values(errors).flat().filter(Boolean) as string[]}
            form={form}
            ratio={ratio}
          />
        ) : null}

        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#ebe8df] pt-5">
          <button
            className="rounded-md border border-[#c9c7bd] px-4 py-2 text-sm font-semibold"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            type="button"
          >
            Anterior
          </button>
          <div className="flex gap-3">
            {step < 5 ? (
              <button
                className="rounded-md bg-[#1f5f57] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setStep((current) => Math.min(current + 1, 5))}
                type="button"
              >
                Siguiente
              </button>
            ) : (
              <button
                className="rounded-md bg-[#1f5f57] px-4 py-2 text-sm font-semibold text-white disabled:bg-[#7a9a95]"
                onClick={() => setPreviewRequested(true)}
                type="button"
              >
                Calcular
              </button>
            )}
          </div>
        </div>
      </div>

      {previewRequested && calculation && parsed.success ? (
        <form action={saveAction} className="rounded-md border border-[#d6d3c8] bg-white p-5">
          {saveState.message ? (
            <p className="mb-4 text-sm font-medium text-[#8a1f1f]">
              {saveState.message}
            </p>
          ) : null}
          {simulationId ? (
            <input name="simulationId" type="hidden" value={simulationId} />
          ) : null}
          <input name="payload" type="hidden" value={payload} />
          <h2 className="text-lg font-semibold">Vista previa calculada</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Summary label="Monto financiado" value={calculation.financedAmount.toFixed(2)} />
            <Summary label="Cuota balon" value={calculation.balloonPayment.toFixed(2)} />
            <Summary label="TEM" value={`${calculation.monthlyEffectiveRate.mul(100).toFixed(6)}%`} />
            <Summary label="TCEA" value={`${calculation.indicators.tcea.mul(100).toFixed(6)}%`} />
            <Summary label="VAN" value={calculation.indicators.netPresentValue.toFixed(2)} />
            <Summary label="TIR mensual" value={`${calculation.indicators.monthlyIrr.mul(100).toFixed(6)}%`} />
            <Summary label="Total pagado" value={calculation.indicators.totalPaid.toFixed(2)} />
            <Summary label="Ratio cuota/ingreso" value={ratio ? `${ratio.toFixed(2)}%` : "-"} />
          </div>
          <button
            className="mt-5 rounded-md bg-[#1f5f57] px-5 py-2.5 text-sm font-semibold text-white disabled:bg-[#7a9a95]"
            disabled={pendingSave}
            type="submit"
          >
            {pendingSave
              ? "Guardando..."
              : simulationId
                ? "Guardar recalculo"
                : "Guardar simulacion"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function productDefaults(product: SimulationProductOption): Partial<WizardForm> {
  return {
    financialProductId: product.id,
    currency: product.currency,
    downPaymentRate: product.downPaymentRate,
    residualValueRate: product.residualValueRate,
    termMonths: String(product.termMonths),
    rateType: product.rateType,
    annualRate: product.annualRate,
    capitalizationFrequency: product.capitalization || "MONTHLY",
    annualDiscountRate: product.cok,
    debtReliefInsuranceMonthlyRate: product.debtReliefInsuranceRate,
    vehicleInsuranceMonthlyRate: product.vehicleInsuranceRate,
    periodicCommission: product.periodicCommission,
    itfRate: product.itfRate,
  };
}

function parseWizardForm(form: WizardForm) {
  return simulationSchema.safeParse({
    ...form,
    termMonths: form.termMonths,
    totalGraceFrom: form.totalGraceFrom || undefined,
    totalGraceTo: form.totalGraceTo || undefined,
    partialGraceFrom: form.partialGraceFrom || undefined,
    partialGraceTo: form.partialGraceTo || undefined,
    capitalizationFrequency:
      form.rateType === "NOMINAL_ANNUAL"
        ? form.capitalizationFrequency
        : undefined,
  });
}

function safeMonthlyDiscount(annualRate: string) {
  try {
    return effectiveAnnualRateToMonthly(annualRate);
  } catch {
    return null;
  }
}

function FieldLabel({
  help,
  label,
  name,
}: {
  help: string;
  label: string;
  name?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-semibold text-[#24313b]" htmlFor={name}>
        {label}
      </label>
      <button
        aria-label={`Ayuda para ${label}`}
        className="flex size-7 items-center justify-center rounded-full border border-[#c9c7bd] text-xs font-bold text-[#2f6f65]"
        title={help}
        type="button"
      >
        i
      </button>
    </div>
  );
}

function InputField({
  disabled,
  error,
  help,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  error?: string;
  help: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel help={help} label={label} name={name} />
      <input
        className="h-11 w-full rounded-md border border-[#c9c7bd] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f65] focus:ring-2 focus:ring-[#2f6f65]/20 disabled:bg-[#f1f1ec]"
        disabled={disabled}
        id={name}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}
    </div>
  );
}

function SelectField({
  children,
  disabled,
  error,
  help,
  label,
  name,
  onChange,
  value,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  error?: string;
  help: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel help={help} label={label} name={name} />
      <select
        className="h-11 w-full rounded-md border border-[#c9c7bd] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f65] focus:ring-2 focus:ring-[#2f6f65]/20 disabled:bg-[#f1f1ec]"
        disabled={disabled}
        id={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}
    </div>
  );
}

function CheckField({
  checked,
  help,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  help: string;
  label: string;
  name: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#d6d3c8] p-3">
      <FieldLabel help={help} label={label} name={name} />
      <input
        checked={checked}
        className="size-5 accent-[#1f5f57]"
        id={name}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </div>
  );
}

function ReadOnlyField({
  help,
  label,
  value,
}: {
  help: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel help={help} label={label} />
      <div className="flex h-11 items-center rounded-md border border-[#c9c7bd] bg-[#f1f1ec] px-3 text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}

function ReviewPanel({
  calculation,
  errors,
  form,
  ratio,
}: {
  calculation: CreditCalculationResult | null;
  errors: string[];
  form: WizardForm;
  ratio: Decimal | null;
}) {
  return (
    <div className="grid gap-5">
      {errors.length > 0 ? (
        <div className="rounded-md border border-[#d9a3a3] bg-[#fff5f5] p-4 text-sm text-[#8a1f1f]">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Summary label="Moneda" value={form.currency} />
        <Summary label="Precio" value={form.vehiclePrice} />
        <Summary label="Ingreso cliente" value={form.clientMonthlyIncome} />
        <Summary
          label="Monto financiado"
          value={calculation?.financedAmount.toFixed(4) ?? "-"}
        />
        <Summary
          label="Cuota balon"
          value={calculation?.balloonPayment.toFixed(4) ?? "-"}
        />
        <Summary
          label="Cuota/ingreso"
          value={ratio ? `${ratio.toFixed(2)}%` : "-"}
        />
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ebe8df] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#66727c]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}
