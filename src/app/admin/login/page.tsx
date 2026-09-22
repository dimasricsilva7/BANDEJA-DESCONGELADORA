import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-graphite-950 p-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-8 shadow-soft">
        <h1 className="text-xl font-extrabold text-graphite-950">Painel administrativo</h1>
        <p className="mt-1 text-sm text-graphite-800/60">Acesso restrito.</p>
        <LoginForm />
      </div>
    </main>
  );
}
