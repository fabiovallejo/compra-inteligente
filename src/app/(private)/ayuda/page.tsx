const glossary = [
  {
    term: "TEA",
    text: "Tasa Efectiva Anual. Representa el rendimiento o costo efectivo de un ano y se convierte a TEM antes de calcular el cronograma.",
  },
  {
    term: "TNA",
    text: "Tasa Nominal Anual. No se usa directamente; requiere una frecuencia de capitalizacion para convertirse a tasa efectiva mensual.",
  },
  {
    term: "TEM",
    text: "Tasa Efectiva Mensual. Es la tasa base del sistema porque los periodos del credito son mensuales.",
  },
  {
    term: "Capitalizacion",
    text: "Frecuencia con la que una tasa nominal incorpora intereses al capital. Es obligatoria cuando se trabaja con TNA.",
  },
  {
    term: "Metodo frances",
    text: "Sistema de amortizacion de cuotas base constantes. En Compra Inteligente considera el valor futuro de la cuota balon.",
  },
  {
    term: "Cuota balon",
    text: "Pago residual realizado al final del credito. Se calcula como porcentaje del valor del vehiculo.",
  },
  {
    term: "Gracia total",
    text: "Periodo en el que no se paga cuota ni cargos. Los intereses se capitalizan y aumentan el saldo.",
  },
  {
    term: "Gracia parcial",
    text: "Periodo en el que se pagan intereses y cargos, pero no se amortiza capital.",
  },
  {
    term: "VAN",
    text: "Valor Actual Neto. Descuenta los flujos del credito con el COK y los interpreta desde el punto de vista del deudor.",
  },
  {
    term: "TIR",
    text: "Tasa Interna de Retorno. Tasa mensual que hace cero el VAN del flujo de caja del deudor.",
  },
  {
    term: "TCEA",
    text: "Tasa de Costo Efectivo Anual. Costo anual real del credito, incluyendo cuota, seguros, comision, ITF y cuota balon.",
  },
];

export default function HelpPage() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f65]">
          Centro de ayuda
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Ayuda y glosario financiero</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6670]">
          Consulta rapida para operar el sistema Compra Inteligente y revisar
          los conceptos usados por el motor financiero.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HelpCard
          title="Flujo recomendado"
          text="Registra cliente y vehiculo, configura o selecciona un producto financiero, crea la simulacion con el asistente y revisa la pantalla de resultados antes de aprobarla."
        />
        <HelpCard
          title="Exportacion"
          text="Desde el detalle de resultados puedes descargar el cronograma en CSV, exportarlo a PDF o imprimirlo directamente."
        />
        <HelpCard
          title="Auditoria"
          text="Las creaciones, ediciones, recalculos, desactivaciones y cambios de estado se registran en AuditLog."
        />
      </div>

      <div className="rounded-md border border-[#d6d3c8] bg-white">
        <div className="border-b border-[#ebe8df] px-5 py-4">
          <h2 className="text-lg font-semibold">Glosario financiero</h2>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {glossary.map((item) => (
            <article className="rounded-md border border-[#ebe8df] p-4" key={item.term}>
              <h3 className="font-semibold text-[#1f5f57]">{item.term}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5b6670]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HelpCard({ text, title }: { text: string; title: string }) {
  return (
    <article className="rounded-md border border-[#d6d3c8] bg-white p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5b6670]">{text}</p>
    </article>
  );
}
