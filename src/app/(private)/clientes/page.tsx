export default function ClientsPage() {
  return <PlaceholderPage title="Clientes" />;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <div className="mt-6 rounded-md border border-[#d6d3c8] bg-white p-5">
        <p className="text-sm text-[#5b6670]">
          Modulo privado preparado para la siguiente iteracion funcional.
        </p>
      </div>
    </section>
  );
}
