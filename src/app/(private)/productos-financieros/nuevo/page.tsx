import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { createProductAction } from "@/modules/products/actions";

export default function NewFinancialProductPage() {
  return (
    <section className="mx-auto max-w-4xl">
      <Link
        className="text-sm font-semibold text-[#1f5f57]"
        href="/productos-financieros"
      >
        Volver a productos
      </Link>
      <div className="mt-4 rounded-md border border-[#d6d3c8] bg-white p-6">
        <h1 className="text-2xl font-semibold">Crear producto financiero</h1>
        <div className="mt-6">
          <ProductForm
            action={createProductAction}
            submitLabel="Crear producto"
          />
        </div>
      </div>
    </section>
  );
}
