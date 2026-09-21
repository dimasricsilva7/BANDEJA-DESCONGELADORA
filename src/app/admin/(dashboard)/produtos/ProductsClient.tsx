"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatBRL } from "@/lib/pricing";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  compareAtCents: number | null;
  images: string[];
  type: string;
  active: boolean;
  featured: boolean;
  orderBumpEnabled: boolean;
  orderBumpPriceCents: number | null;
  orderBumpHeadline: string | null;
  upsellEnabled: boolean;
  upsellPriceCents: number | null;
};

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/products").then((r) => r.json()).then(setProducts).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function save(product: Product) {
    setSavingId(product.id);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          active: product.active,
          featured: product.featured,
          orderBumpEnabled: product.orderBumpEnabled,
          orderBumpPriceCents: product.orderBumpPriceCents,
          orderBumpHeadline: product.orderBumpHeadline,
          upsellEnabled: product.upsellEnabled,
          upsellPriceCents: product.upsellPriceCents,
        }),
      });
      load();
    } finally {
      setSavingId(null);
    }
  }

  function update(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  if (loading) return <p className="text-sm text-graphite-800/60">Carregando...</p>;

  return (
    <div className="space-y-5">
      {products.map((product) => (
        <div key={product.id} className="rounded-xl2 bg-white p-5 shadow-card">
          <div className="flex gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cream-100">
              {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" />}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  className="w-full rounded-lg border border-graphite-900/15 px-3 py-1.5 text-sm font-medium"
                  value={product.name}
                  onChange={(e) => update(product.id, { name: e.target.value })}
                />
                <span className="whitespace-nowrap rounded-full bg-cream-100 px-2.5 py-1 text-xs text-graphite-800/60">{product.type}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PriceInput label="Preço (centavos)" value={product.priceCents} onChange={(v) => update(product.id, { priceCents: v })} />
                <PriceInput label="Preço antigo" value={product.compareAtCents ?? 0} onChange={(v) => update(product.id, { compareAtCents: v || null })} />
                <label className="flex items-center gap-2 text-xs text-graphite-800/70">
                  <input type="checkbox" checked={product.active} onChange={(e) => update(product.id, { active: e.target.checked })} />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-xs text-graphite-800/70">
                  <input type="checkbox" checked={product.featured} onChange={(e) => update(product.id, { featured: e.target.checked })} />
                  Destaque
                </label>
              </div>

              {product.type === "COMPLEMENTARY" && (
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-amber-600/5 p-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 text-xs text-graphite-800/70">
                    <input type="checkbox" checked={product.orderBumpEnabled} onChange={(e) => update(product.id, { orderBumpEnabled: e.target.checked })} />
                    Order bump ativo
                  </label>
                  <PriceInput label="Preço order bump" value={product.orderBumpPriceCents ?? 0} onChange={(v) => update(product.id, { orderBumpPriceCents: v || null })} />
                  <input
                    className="col-span-2 rounded-lg border border-graphite-900/15 px-3 py-1.5 text-xs sm:col-span-1"
                    placeholder="Texto do order bump"
                    value={product.orderBumpHeadline ?? ""}
                    onChange={(e) => update(product.id, { orderBumpHeadline: e.target.value })}
                  />
                </div>
              )}

              {product.type === "UPSELL" && (
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-amber-600/5 p-3">
                  <label className="flex items-center gap-2 text-xs text-graphite-800/70">
                    <input type="checkbox" checked={product.upsellEnabled} onChange={(e) => update(product.id, { upsellEnabled: e.target.checked })} />
                    Upsell ativo
                  </label>
                  <PriceInput label="Preço upsell" value={product.upsellPriceCents ?? 0} onChange={(v) => update(product.id, { upsellPriceCents: v || null })} />
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-graphite-800/50">
                  Pré-visualização: {formatBRL(product.priceCents)}
                  {product.compareAtCents ? ` (de ${formatBRL(product.compareAtCents)})` : ""}
                </p>
                <button onClick={() => save(product)} disabled={savingId === product.id} className="btn-secondary px-4 py-1.5 text-xs">
                  {savingId === product.id ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PriceInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-graphite-800/50">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-graphite-900/15 px-2.5 py-1.5 text-sm"
      />
    </label>
  );
}
