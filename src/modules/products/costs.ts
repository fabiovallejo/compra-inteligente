import {
  FinancialProductCost,
  FinancialProductCostType,
} from "@prisma/client";

export function productCostValue(
  costs: FinancialProductCost[],
  type: FinancialProductCostType,
): string {
  const cost = costs.find((item) => item.costType === type);

  return (cost?.rate ?? cost?.fixedAmount ?? "0").toString();
}
