"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/pricing";

type Cart = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  orderId: string | null;
  cartValueCents: number;
  status: string;
  emailSentAt: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Em andamento",
  ABANDONED: "Abandonado",
  RECOVERED: "Recuperado",
};

export default function AbandonedCartsClient() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/abandoned-carts").then((r) => r.json()).then(setCarts).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function resend(id: string) {
    setSendingId(id);
    try {
      const res = await fetch(`/api/admin/abandoned-carts/${id}/resend`, { method: "POST" });
      const data = await res.json();
      if (!data.sent) alert("E-mail não enviado: configure EMAIL_PROVIDER_API_KEY na Vercel.");
      load();
    } finally {
      setSendingId(null);
    }
  }

  if (loading) return <p className="text-sm text-graphite-800/60">Carregando...</p>;

  return (
    <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-graphite-900/10 text-xs uppercase text-graphite-800/50">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">E-mail enviado</th>
            <th className="px-4 py-3">Criado em</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-graphite-900/5">
          {carts.map((cart) => (
            <tr key={cart.id}>
              <td className="px-4 py-3">
                <p>{cart.customerName}</p>
                <p className="text-xs text-graphite-800/50">{cart.email} · {cart.phone}</p>
              </td>
              <td className="px-4 py-3">{formatBRL(cart.cartValueCents)}</td>
              <td className="px-4 py-3">{STATUS_LABEL[cart.status] ?? cart.status}</td>
              <td className="px-4 py-3 text-xs text-graphite-800/60">
                {cart.emailSentAt ? new Date(cart.emailSentAt).toLocaleString("pt-BR") : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-graphite-800/60">{new Date(cart.createdAt).toLocaleString("pt-BR")}</td>
              <td className="px-4 py-3">
                <button
                  disabled={sendingId === cart.id || cart.status === "RECOVERED"}
                  onClick={() => resend(cart.id)}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  {sendingId === cart.id ? "Enviando..." : "Reenviar e-mail"}
                </button>
              </td>
            </tr>
          ))}
          {carts.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-graphite-800/50">Nenhum carrinho abandonado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
