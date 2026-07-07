import Decimal from "decimal.js";

export function isPositiveDecimal(value: string): boolean {
  try {
    return new Decimal(value).gt(0);
  } catch {
    return false;
  }
}

export function decimalString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return value.toString();
}
