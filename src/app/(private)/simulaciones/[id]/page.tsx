import Decimal from "decimal.js";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { prisma } from "@/lib/prisma";
import { updateSimulationStatusAction } from "@/modules/simulations/actions";
import {
  formatMoney,
  formatPercent,
  periodLabel,
  simulationStatusLabel,
} from "@/modules/simulations/format";
import { simulationSchema } from "@/modules/simulations/validation";

export default async function SimulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const simulation = await prisma.creditSimulation.findUnique({
    where: { id },
    include: {
      client: true,
      vehicle: true,
      financialProduct: true,
      gracePeriods: { orderBy: { periodFrom: "asc" } },
      financialIndicator: true,
      paymentScheduleItems: { orderBy: { periodNumber: "asc" } },
    },
  });

  if (!simulation || !simulation.financialIndicator) notFound();

  const parsedSnapshot = simulationSchema.safeParse(simulation.inputSnapshot);
  const monthlyIncome = parsedSnapshot.success
    ? new Decimal(parsedSnapshot.data.clientMonthlyIncome)
    : simulation.client.monthlyIncome;
  const firstPayment =
    simulation.paymentScheduleItems.find((item) => item.totalPayment.gt(0)) ??
    null;
  const debtRatio =
    firstPayment && monthlyIncome.gt(0)
      ? firstPayment.totalPayment.div(monthlyIncome).mul(100)
      : new Decimal(0);
  const currency = parsedSnapshot.success
    ? parsedSnapshot.data.currency
    : simulation.financialProduct.currency;
  const finalBalance =
    simulation.paymentScheduleItems.at(-1)?.closingBalance ?? new Decimal(0);

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            className="text-sm font-semibold text-[#1f5f57]"
            href="/simulaciones"
          >
            Volver a simulaciones
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">
            Resultados de simulacion
          </h1>
          <p className="mt-1 text-sm text-[#66727c]">
            {simulation.client.firstNames} {simulation.client.lastNames} -{" "}
            {simulation.vehicle.brand} {simulation.vehicle.model}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#1f5f57]">
            Estado: {simulationStatusLabel(simulation.status)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center rounded-md border border-[#1f5f57] px-4 text-sm font-semibold text-[#1f5f57]"
            href={`/simulaciones/${simulation.id}/editar`}
          >
            Editar y recalcular
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-[#c9c7bd] px-4 text-sm font-semibold"
            href={`/simulaciones/${simulation.id}/export/csv`}
          >
            Exportar CSV
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-[#c9c7bd] px-4 text-sm font-semibold"
            href={`/simulaciones/${simulation.id}/export/pdf`}
          >
            Exportar PDF
          </Link>
          <PrintButton />
        </div>
      </div>

      <form
        action={updateSimulationStatusAction}
        className="flex flex-col gap-3 rounded-md border border-[#d6d3c8] bg-white p-4 sm:flex-row sm:items-center"
      >
        <input name="id" type="hidden" value={simulation.id} />
        <label className="text-sm font-semibold" htmlFor="status">
          Estado de la simulacion
        </label>
        <select
          className="h-10 rounded-md border border-[#c9c7bd] px-3 text-sm"
          defaultValue={simulation.status}
          id="status"
          name="status"
        >
          <option value="BORRADOR">Borrador</option>
          <option value="CALCULADA">Calculada</option>
          <option value="APROBADA">Aprobada</option>
          <option value="ARCHIVADA">Archivada</option>
        </select>
        <button
          className="h-10 rounded-md bg-[#1f5f57] px-4 text-sm font-semibold text-white"
          type="submit"
        >
          Guardar estado
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard
          label="Monto financiado"
          value={formatMoney(simulation.financedAmount, currency)}
        />
        <ResultCard
          label="Cuota base"
          value={formatMoney(simulation.basePayment, currency)}
        />
        <ResultCard
          label="Cuota balon"
          value={formatMoney(simulation.balloonPayment, currency)}
        />
        <ResultCard
          label="Total de intereses"
          value={formatMoney(simulation.financialIndicator.totalInterest, currency)}
        />
        <ResultCard
          label="Total de cargos"
          value={formatMoney(simulation.financialIndicator.totalCharges, currency)}
        />
        <ResultCard
          label="Total pagado"
          value={formatMoney(simulation.financialIndicator.totalPaid, currency)}
        />
        <ResultCard
          label="VAN"
          value={formatMoney(simulation.financialIndicator.netPresentValue, currency)}
        />
        <ResultCard
          label="TIR mensual"
          value={formatPercent(simulation.financialIndicator.monthlyIrr)}
        />
        <ResultCard
          label="TIR anual"
          value={formatPercent(simulation.financialIndicator.annualIrr)}
        />
        <ResultCard
          label="TCEA"
          value={formatPercent(simulation.financialIndicator.tcea)}
        />
        <ResultCard
          label="Ratio endeudamiento"
          value={`${debtRatio.toFixed(2)}%`}
        />
        <ResultCard
          label="Saldo final"
          tone={finalBalance.abs().lt("0.000001") ? "ok" : "warn"}
          value={formatMoney(finalBalance, currency)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InterpretationCard
          text={interpretVan(simulation.financialIndicator.netPresentValue)}
          title="VAN"
        />
        <InterpretationCard
          text={interpretIrr(simulation.financialIndicator.monthlyIrr)}
          title="TIR"
        />
        <InterpretationCard
          text={interpretTcea(simulation.financialIndicator.tcea)}
          title="TCEA"
        />
      </div>

      <div className="rounded-md border border-[#d6d3c8] bg-white">
        <div className="border-b border-[#ebe8df] px-5 py-4">
          <h2 className="text-lg font-semibold">Flujo de caja del deudor</h2>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <FlowPill
            period="0"
            value={formatMoney(simulation.financedAmount, currency)}
          />
          {simulation.paymentScheduleItems.map((item) => (
            <FlowPill
              key={item.id}
              period={item.periodNumber.toString()}
              value={formatMoney(item.debtorCashFlow, currency)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[#d6d3c8] bg-white">
        <div className="border-b border-[#ebe8df] px-5 py-4">
          <h2 className="text-lg font-semibold">Cronograma completo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-sm">
            <thead className="bg-[#f7f7f2] text-left text-[#53616b]">
              <tr>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Tipo de periodo</th>
                <th className="px-4 py-3">Saldo inicial</th>
                <th className="px-4 py-3">Interes</th>
                <th className="px-4 py-3">Cuota base</th>
                <th className="px-4 py-3">Amortizacion</th>
                <th className="px-4 py-3">Desgravamen</th>
                <th className="px-4 py-3">Seguro vehicular</th>
                <th className="px-4 py-3">Comision</th>
                <th className="px-4 py-3">ITF</th>
                <th className="px-4 py-3">Cuota balon</th>
                <th className="px-4 py-3">Total a pagar</th>
                <th className="px-4 py-3">Saldo final</th>
              </tr>
            </thead>
            <tbody>
              {simulation.paymentScheduleItems.map((item, index) => {
                const isLast =
                  index === simulation.paymentScheduleItems.length - 1;
                return (
                  <tr
                    className={`${periodRowClass(item.periodType)} ${
                      isLast ? "ring-2 ring-inset ring-[#1f5f57]" : ""
                    }`}
                    key={item.id}
                  >
                    <td className="px-4 py-3 font-semibold">
                      {item.periodNumber}
                    </td>
                    <td className="px-4 py-3">{periodLabel(item.periodType)}</td>
                    <td className="px-4 py-3">
                      {formatMoney(item.openingBalance, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.interest, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.basePayment, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.amortization, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.debtReliefInsurance, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.vehicleInsurance, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.commission, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.itf, currency)}
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        item.balloonPayment.gt(0)
                          ? "font-bold text-[#8a4b0f]"
                          : ""
                      }`}
                    >
                      {formatMoney(item.balloonPayment, currency)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatMoney(item.totalPayment, currency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.closingBalance, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ResultCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "ok" | "warn";
  value: string;
}) {
  return (
    <article
      className={`rounded-md border bg-white p-4 shadow-sm ${
        tone === "ok"
          ? "border-[#9bc9aa]"
          : tone === "warn"
            ? "border-[#d9a3a3]"
            : "border-[#d6d3c8]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#66727c]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </article>
  );
}

function InterpretationCard({ text, title }: { text: string; title: string }) {
  return (
    <article className="rounded-md border border-[#d6d3c8] bg-white p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5b6670]">{text}</p>
    </article>
  );
}

function FlowPill({ period, value }: { period: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ebe8df] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#66727c]">
        Periodo {period}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function periodRowClass(periodType: string) {
  if (periodType === "TOTAL_GRACE") {
    return "border-t border-[#d7e7d8] bg-[#f2faf3]";
  }

  if (periodType === "PARTIAL_GRACE") {
    return "border-t border-[#e8dcc4] bg-[#fff8ea]";
  }

  return "border-t border-[#ebe8df] bg-white";
}

function interpretVan(value: Decimal.Value) {
  const van = new Decimal(value);
  if (van.lt(0)) {
    return "El VAN es negativo desde el punto de vista del deudor: el valor presente de los pagos supera el desembolso recibido al COK ingresado.";
  }
  if (van.gt(0)) {
    return "El VAN es positivo desde el punto de vista del deudor: el financiamiento resulta favorable frente al COK ingresado.";
  }
  return "El VAN es neutro: los flujos descontados compensan exactamente el desembolso recibido.";
}

function interpretIrr(value: Decimal.Value) {
  return `La TIR mensual estimada es ${formatPercent(value)} y resume el costo financiero mensual de todos los flujos del cronograma.`;
}

function interpretTcea(value: Decimal.Value) {
  return `La TCEA es ${formatPercent(value)} e incluye cuota base, seguros, comision, ITF y cuota balon dentro del flujo completo.`;
}
