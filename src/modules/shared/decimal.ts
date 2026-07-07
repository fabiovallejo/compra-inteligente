import Decimal from "decimal.js";

export function isPositiveDecimal(value: string): boolean {
  try {
    return new Decimal(value).gt(0);
  } catch {
    return false;
  }
}

export function isNonNegativeDecimal(value: string): boolean {
  try {
    return new Decimal(value).gte(0);
  } catch {
    return false;
  }
}

export function isPercentageAtLeastZeroBelowHundred(value: string): boolean {
  try {
    const decimal = new Decimal(value);
    return decimal.gte(0) && decimal.lt(100);
  } catch {
    return false;
  }
}

export function isPercentageAboveZeroBelowHundred(value: string): boolean {
  try {
    const decimal = new Decimal(value);
    return decimal.gt(0) && decimal.lt(100);
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
