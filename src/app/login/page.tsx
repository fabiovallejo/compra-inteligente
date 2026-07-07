import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-[#f4f5f1] text-[#1f2933] lg:grid-cols-[1fr_480px]">
      <section className="flex min-h-[42vh] items-end bg-[#173d3a] px-6 py-10 text-white lg:min-h-screen lg:px-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#a8d8cf]">
            Sistema de credito vehicular
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Compra Inteligente
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/78">
            Acceso seguro para registrar clientes, vehiculos, productos
            financieros y simulaciones con cronogramas auditables.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-md border border-[#d6d3c8] bg-white p-6 shadow-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-semibold">Iniciar sesion</h2>
            <p className="mt-2 text-sm leading-6 text-[#5b6670]">
              Ingresa tus credenciales para continuar.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
