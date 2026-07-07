"use client";

export function PrintButton() {
  return (
    <button
      className="inline-flex h-10 items-center rounded-md border border-[#c9c7bd] px-4 text-sm font-semibold"
      onClick={() => window.print()}
      type="button"
    >
      Imprimir
    </button>
  );
}
