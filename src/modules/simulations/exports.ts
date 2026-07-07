import type { CreditSimulation, FinancialIndicator, PaymentScheduleItem } from "@prisma/client";
import { formatMoney, formatPercent, periodLabel } from "./format";

type SimulationExport = CreditSimulation & {
  financialIndicator: FinancialIndicator | null;
  paymentScheduleItems: PaymentScheduleItem[];
  client: { firstNames: string; lastNames: string; dni: string };
  vehicle: { brand: string; model: string; vin: string };
  financialProduct: { name: string; currency: "PEN" | "USD" };
};

const scheduleHeaders = [
  "periodo",
  "tipo de periodo",
  "saldo inicial",
  "interes",
  "cuota base",
  "amortizacion",
  "seguro de desgravamen",
  "seguro vehicular",
  "comision",
  "ITF",
  "cuota balon",
  "total a pagar",
  "saldo final",
  "flujo de caja del deudor",
];

export function simulationToCsv(simulation: SimulationExport) {
  const currency = simulation.financialProduct.currency;
  const rows = [
    ["Simulacion", simulation.id],
    [
      "Cliente",
      `${simulation.client.dni} - ${simulation.client.firstNames} ${simulation.client.lastNames}`,
    ],
    [
      "Vehiculo",
      `${simulation.vehicle.vin} - ${simulation.vehicle.brand} ${simulation.vehicle.model}`,
    ],
    ["Producto", simulation.financialProduct.name],
    ["Monto financiado", formatMoney(simulation.financedAmount, currency)],
    ["Cuota base", formatMoney(simulation.basePayment, currency)],
    ["Cuota balon", formatMoney(simulation.balloonPayment, currency)],
    [
      "TCEA",
      simulation.financialIndicator
        ? formatPercent(simulation.financialIndicator.tcea)
        : "",
    ],
    [],
    scheduleHeaders,
    ...simulation.paymentScheduleItems.map((item) => [
      item.periodNumber,
      periodLabel(item.periodType),
      item.openingBalance,
      item.interest,
      item.basePayment,
      item.amortization,
      item.debtReliefInsurance,
      item.vehicleInsurance,
      item.commission,
      item.itf,
      item.balloonPayment,
      item.totalPayment,
      item.closingBalance,
      item.debtorCashFlow,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function simulationToPdf(simulation: SimulationExport) {
  const currency = simulation.financialProduct.currency;
  const lines = [
    "Compra Inteligente - Cronograma",
    `Simulacion: ${simulation.id}`,
    `Cliente: ${simulation.client.firstNames} ${simulation.client.lastNames}`,
    `Vehiculo: ${simulation.vehicle.brand} ${simulation.vehicle.model}`,
    `Monto financiado: ${formatMoney(simulation.financedAmount, currency)}`,
    `Cuota base: ${formatMoney(simulation.basePayment, currency)}`,
    `Cuota balon: ${formatMoney(simulation.balloonPayment, currency)}`,
    "",
    "Periodo | Tipo | Saldo inicial | Interes | Cuota base | Total | Saldo final",
    ...simulation.paymentScheduleItems.map((item) =>
      [
        item.periodNumber,
        periodLabel(item.periodType),
        formatMoney(item.openingBalance, currency),
        formatMoney(item.interest, currency),
        formatMoney(item.basePayment, currency),
        formatMoney(item.totalPayment, currency),
        formatMoney(item.closingBalance, currency),
      ].join(" | "),
    ),
  ];

  return buildSimplePdf(lines);
}

function csvCell(value: unknown) {
  const text = value?.toString() ?? "";
  return `"${text.replace(/"/g, '""')}"`;
}

function buildSimplePdf(lines: string[]) {
  const escapedLines = lines.map((line) =>
    line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"),
  );
  const content = [
    "BT",
    "/F1 9 Tf",
    "40 800 Td",
    ...escapedLines.flatMap((line, index) =>
      index === 0 ? [`(${line}) Tj`] : ["0 -13 Td", `(${line}) Tj`],
    ),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(chunks.join("")));
    chunks.push(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`);
  }

  const xrefOffset = Buffer.byteLength(chunks.join(""));
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  for (const offset of offsets.slice(1)) {
    chunks.push(`${offset.toString().padStart(10, "0")} 00000 n \n`);
  }
  chunks.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return Buffer.from(chunks.join(""), "utf8");
}
