import Link from "next/link";
import { FinancialProductCostType } from "@prisma/client";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { prisma } from "@/lib/prisma";
import { productCostValue } from "@/modules/products/costs";
import { updateProductAction } from "@/modules/products/actions";

export default async function EditFinancialProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.financialProduct.findUnique({
    where: { id },
    include: { costs: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl">
      <Link
        className="text-sm font-semibold text-[#1f5f57]"
        href={`/productos-financieros/${product.id}`}
      >
        Volver al producto
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <h1 className="text-2xl font-semibold">Editar producto financiero</h1>
        <div className="mt-6">
          <ProductForm
            action={updateProductAction}
            initialValues={{
              id: product.id,
              name: product.name,
              currency: product.currency,
              defaultDownPaymentRate:
                product.defaultDownPaymentRate.toString(),
              defaultResidualValueRate:
                product.defaultResidualValueRate.toString(),
              defaultTermMonths: product.defaultTermMonths.toString(),
              defaultRateType: product.defaultRateType,
              defaultAnnualRate: product.defaultAnnualRate.toString(),
              capitalization: product.capitalization ?? "",
              cok: product.cok.toString(),
              debtReliefInsuranceRate: productCostValue(
                product.costs,
                FinancialProductCostType.DEBT_RELIEF_INSURANCE,
              ),
              vehicleInsuranceRate: productCostValue(
                product.costs,
                FinancialProductCostType.VEHICLE_INSURANCE,
              ),
              periodicCommission: productCostValue(
                product.costs,
                FinancialProductCostType.PERIODIC_COMMISSION,
              ),
              itfRate: productCostValue(
                product.costs,
                FinancialProductCostType.ITF,
              ),
            }}
            submitLabel="Guardar cambios"
          />
        </div>
      </div>
    </section>
  );
}
