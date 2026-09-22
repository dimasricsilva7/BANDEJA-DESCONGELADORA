import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/avaliacoes", label: "Avaliações" },
  { href: "/admin/carrinhos-abandonados", label: "Carrinhos abandonados" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="border-b border-graphite-900/10 bg-white">
        <div className="container-app flex items-center justify-between py-4">
          <div>
            <p className="text-lg font-extrabold text-graphite-950">Painel administrativo</p>
            <p className="text-xs text-graphite-800/50">{admin.email}</p>
          </div>
          <LogoutButton />
        </div>
        <nav className="container-app flex gap-1 overflow-x-auto pb-3 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-graphite-800/70 hover:bg-cream-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-app py-8">{children}</main>
    </div>
  );
}
