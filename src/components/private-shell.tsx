import Link from "next/link";
import { logoutAction } from "@/server/auth/actions";
import type { AuthenticatedUser } from "@/server/auth/session";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/vehiculos", label: "Vehiculos" },
  { href: "/productos-financieros", label: "Productos financieros" },
  { href: "/simulaciones", label: "Simulaciones" },
  { href: "/ayuda", label: "Ayuda" },
];

export function PrivateShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthenticatedUser;
}) {
  return (
    <div className="min-h-screen bg-[#f4f5f1] text-[#1f2933]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-[#d6d3c8] bg-[#173d3a] text-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#a8d8cf]">
                Compra Inteligente
              </p>
              <p className="mt-2 text-lg font-semibold">{user.username}</p>
              <p className="text-sm text-white/70">{user.role}</p>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-4 py-4 lg:flex-1 lg:flex-col lg:overflow-visible">
              {navigationItems.map((item) => (
                <Link
                  className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-white/82 transition hover:bg-white/10 hover:text-white"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <form action={logoutAction} className="border-t border-white/10 p-4">
              <button
                className="w-full rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                type="submit"
              >
                Cerrar sesion
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
