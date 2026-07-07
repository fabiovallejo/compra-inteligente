import Link from "next/link";
import { FinancialProductCostType } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deactivateProductAction } from "@/modules/products/actions";
import { productCostValue } from "@/modules/products/costs";

export default async function FinancialProductDetailPage({
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
    <section className="mx-auto max-w-5xl">
      <Link
        className="text-sm font-semibold text-[#1f5f57]"
        href="/productos-financieros"
      >
        Volver a productos
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
              Producto financiero
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-sm text-[#66727c]">
              {product.active ? "Activo" : "Inactivo"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              className="rounded-md border border-[#c9c7bd] px-4 py-2 text-sm font-semibold"
              href={`/productos-financieros/${product.id}/editar`}
            >
              Editar
            </Link>
            {product.active ? (
              <form action={deactivateProductAction}>
                <input name="id" type="hidden" value={product.id} />
                <button
                  className="rounded-md border border-[#b65f5f] px-4 py-2 text-sm font-semibold text-[#8a1f1f]"
                  type="submit"
                >
                  Desactivar
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <Detail label="Moneda" value={product.currency} />
          <Detail
            label="Cuota inicial"
            value={`${product.defaultDownPaymentRate.toString()}%`}
          />
          <Detail
            label="Valor residual"
            value={`${product.defaultResidualValueRate.toString()}%`}
          />
          <Detail label="Plazo" value={`${product.defaultTermMonths} meses`} />
          <Detail
            label="Tipo de tasa"
            value={
              product.defaultRateType === "EFFECTIVE_ANNUAL" ? "TEA" : "TNA"
            }
          />
          <Detail
            label="Tasa anual"
            value={`${product.defaultAnnualRate.toString()}%`}
          />
          <Detail
            label="Capitalizacion"
            value={product.capitalization ?? "No aplica"}
          />
          <Detail label="COK" value={`${product.cok.toString()}%`} />
          <Detail
            label="Desgravamen"
            value={`${productCostValue(product.costs, FinancialProductCostType.DEBT_RELIEF_INSURANCE)}%`}
          />
          <Detail
            label="Seguro vehicular"
            value={`${productCostValue(product.costs, FinancialProductCostType.VEHICLE_INSURANCE)}%`}
          />
          <Detail
            label="Comision"
            value={productCostValue(
              product.costs,
              FinancialProductCostType.PERIODIC_COMMISSION,
            )}
          />
          <Detail
            label="ITF"
            value={`${productCostValue(product.costs, FinancialProductCostType.ITF)}%`}
          />
        </dl>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ebe8df] p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#66727c]">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium">{value}</dd>
    </div>
  );
}
