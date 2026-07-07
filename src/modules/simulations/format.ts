import Decimal from "decimal.js";

export function formatMoney(value: Decimal.Value, currency: "PEN" | "USD") {
  return new Intl.NumberFormat("es-PE", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(new Decimal(value).toNumber());
}

export function formatPercent(value: Decimal.Value, digits = 6) {
  return `${new Decimal(value).mul(100).toFixed(digits)}%`;
}

export function periodLabel(periodType: string) {
  if (periodType === "TOTAL_GRACE") return "Gracia total";
  if (periodType === "PARTIAL_GRACE") return "Gracia parcial";
  return "Normal";
}

export function simulationStatusLabel(status: string) {
  if (status === "BORRADOR") return "Borrador";
  if (status === "CALCULADA") return "Calculada";
  if (status === "APROBADA") return "Aprobada";
  if (status === "ARCHIVADA") return "Archivada";
  return status;
}
