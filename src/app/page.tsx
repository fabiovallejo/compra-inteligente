const foundations = [
  "Metodo frances vencido ordinario",
  "Tasas normalizadas a TEM",
  "Cuota balon configurable",
  "Gracia total y parcial sin superposicion",
  "VAN, TIR mensual, TIR anual y TCEA",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] px-6 py-10 text-[#1f2933]">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="border-b border-[#c9c7bd] pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#3d6f63]">
            Sistema financiero vehicular
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[#1f2933]">
            Compra Inteligente
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#4b5563]">
            Base tecnica inicial para construir el simulador de creditos
            vehiculares con PostgreSQL, Prisma y calculos financieros de alta
            precision.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foundations.map((item) => (
            <article
              className="rounded-md border border-[#d6d3c8] bg-white p-4 shadow-sm"
              key={item}
            >
              <h2 className="text-base font-semibold">{item}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
