import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deactivateProductAction } from "@/modules/products/actions";

export const dynamic = "force-dynamic";

export default async function FinancialProductsPage() {
  const products = await prisma.financialProduct.findMany({
    include: { costs: true },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
            Configuracion financiera
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Productos financieros</h1>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#1f5f57] px-4 text-sm font-semibold text-white transition hover:bg-[#184c46]"
          href="/productos-financieros/nuevo"
        >
          Crear producto
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-[#d6d3c8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-[#f7f7f2] text-left text-[#53616b]">
              <tr>
                <th className="px-5 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 font-semibold">Moneda</th>
                <th className="px-5 py-3 font-semibold">Inicial</th>
                <th className="px-5 py-3 font-semibold">Residual</th>
                <th className="px-5 py-3 font-semibold">Plazo</th>
                <th className="px-5 py-3 font-semibold">Tasa</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#66727c]" colSpan={8}>
                    No hay productos financieros registrados.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr className="border-t border-[#ebe8df]" key={product.id}>
                    <td className="px-5 py-4 font-medium">{product.name}</td>
                    <td className="px-5 py-4">{product.currency}</td>
                    <td className="px-5 py-4">
                      {product.defaultDownPaymentRate.toString()}%
                    </td>
                    <td className="px-5 py-4">
                      {product.defaultResidualValueRate.toString()}%
                    </td>
                    <td className="px-5 py-4">
                      {product.defaultTermMonths} meses
                    </td>
                    <td className="px-5 py-4">
                      {product.defaultRateType === "EFFECTIVE_ANNUAL"
                        ? "TEA"
                        : "TNA"}{" "}
                      {product.defaultAnnualRate.toString()}%
                    </td>
                    <td className="px-5 py-4">
                      {product.active ? "Activo" : "Inactivo"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-md border border-[#c9c7bd] px-3 py-1.5 font-medium"
                          href={`/productos-financieros/${product.id}`}
                        >
                          Ver
                        </Link>
                        <Link
                          className="rounded-md border border-[#c9c7bd] px-3 py-1.5 font-medium"
                          href={`/productos-financieros/${product.id}/editar`}
                        >
                          Editar
                        </Link>
                        {product.active ? (
                          <form action={deactivateProductAction}>
                            <input name="id" type="hidden" value={product.id} />
                            <button
                              className="rounded-md border border-[#b65f5f] px-3 py-1.5 font-medium text-[#8a1f1f]"
                              type="submit"
                            >
                              Desactivar
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
