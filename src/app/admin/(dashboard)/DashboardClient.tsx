"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatBRL } from "@/lib/pricing";

const PRESETS = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
];

const CLAY = "#AB5C2F";
const GRAPHITE = "#3C382F";

type Stats = {
  grossCents: number;
  netCents: number;
  feeCents: number;
  ticketCents: number;
  paidCount: number;
  pendingCount: number;
  expiredCount: number;
  conversionRate: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByDay: { date: string; orders: number }[];
  salesBySource: { name: string; value: number }[];
  productsSold: { name: string; qty: number }[];
};

export default function DashboardClient() {
  const [preset, setPreset] = useState("30d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?preset=${preset}`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [preset]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              preset === p.value ? "bg-graphite-900 text-cream-50" : "bg-white text-graphite-800/70"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading || !stats ? (
        <p className="text-sm text-graphite-800/60">Carregando...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Faturamento bruto" value={formatBRL(stats.grossCents)} />
            <Card label="Faturamento líquido" value={formatBRL(stats.netCents)} />
            <Card label="Ticket médio" value={formatBRL(stats.ticketCents)} />
            <Card label="Taxa de conversão" value={`${(stats.conversionRate * 100).toFixed(1)}%`} />
            <Card label="Pedidos pagos" value={String(stats.paidCount)} />
            <Card label="Pedidos pendentes" value={String(stats.pendingCount)} />
            <Card label="Pedidos expirados" value={String(stats.expiredCount)} />
            <Card label="Taxas (gateway)" value={formatBRL(stats.feeCents)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Faturamento por dia">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                  <Line type="monotone" dataKey="revenue" stroke={CLAY} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Pedidos pagos por dia">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" fill={GRAPHITE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Origem das vendas">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.salesBySource} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                  <Bar dataKey="value" fill={CLAY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Produtos vendidos">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.productsSold} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d3" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="qty" fill={GRAPHITE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card">
      <p className="text-xs text-graphite-800/60">{label}</p>
      <p className="mt-1.5 text-xl font-extrabold text-graphite-950">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card">
      <p className="mb-2 text-sm font-medium text-graphite-900">{title}</p>
      {children}
    </div>
  );
}
