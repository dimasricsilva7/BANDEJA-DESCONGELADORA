"use client";

import { useEffect, useState, useCallback } from "react";
import { formatBRL } from "@/lib/pricing";
import { RefreshCw, X, Trash2 } from "lucide-react";

const STATUS_OPTIONS = ["", "CREATED", "PIX_GENERATED", "PENDING", "PAID", "EXPIRED", "CANCELLED", "REFUNDED", "CHARGEBACK", "FAILED"];

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  PIX_GENERATED: "bg-amber-100 text-amber-800",
  EXPIRED: "bg-graphite-900/10 text-graphite-700",
  CANCELLED: "bg-graphite-900/10 text-graphite-700",
  REFUNDED: "bg-red-100 text-red-800",
  CHARGEBACK: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
  CREATED: "bg-graphite-900/10 text-graphite-700",
};

type Order = {
  id: string;
  displayId: string;
  status: string;
  totalCents: number;
  createdAt: string;
  utmSource: string | null;
  utmCampaign: string | null;
  bravopayTransactionId: string | null;
  customer: { name: string; email: string; phone: string; cpf: string };
  items: { name: string }[];
};

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function reverify(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/orders/${id}/reverify`, { method: "POST" });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function cancelOrder(id: string) {
    if (!confirm("Cancelar este pedido?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm("Excluir este pedido permanentemente?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-graphite-900/15 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || "Todos os status"}</option>
          ))}
        </select>
        <input
          placeholder="Buscar por nome, e-mail, telefone, CPF, pedido..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="min-w-[260px] flex-1 rounded-lg border border-graphite-900/15 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-graphite-900/10 text-xs uppercase text-graphite-800/50">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-900/5">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium">{order.displayId}</td>
                <td className="px-4 py-3 text-graphite-800/70">{new Date(order.createdAt).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <p>{order.customer.name}</p>
                  <p className="text-xs text-graphite-800/50">{order.customer.email} · {order.customer.phone}</p>
                </td>
                <td className="px-4 py-3 text-graphite-800/70">{order.items.map((i) => i.name).join(", ")}</td>
                <td className="px-4 py-3 font-medium">{formatBRL(order.totalCents)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-graphite-800/60">{order.utmSource ?? "direto"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button title="Reverificar pagamento" disabled={busyId === order.id} onClick={() => reverify(order.id)}>
                      <RefreshCw className={`h-4 w-4 text-graphite-800/60 ${busyId === order.id ? "animate-spin" : ""}`} />
                    </button>
                    <button title="Cancelar" disabled={busyId === order.id} onClick={() => cancelOrder(order.id)}>
                      <X className="h-4 w-4 text-graphite-800/60" />
                    </button>
                    <button title="Excluir" disabled={busyId === order.id} onClick={() => deleteOrder(order.id)}>
                      <Trash2 className="h-4 w-4 text-red-600/70" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && !loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-graphite-800/50">Nenhum pedido encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-graphite-800/60">
        <span>{total} pedidos</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Anterior</button>
          <button disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Próxima</button>
        </div>
      </div>
    </div>
  );
}
