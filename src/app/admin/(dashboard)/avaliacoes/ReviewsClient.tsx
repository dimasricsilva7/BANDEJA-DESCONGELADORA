"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Star, Upload, Trash2, Pencil, Eye, EyeOff } from "lucide-react";

type Product = { id: string; name: string };

type Review = {
  id: string;
  customerName: string;
  city: string | null;
  state: string | null;
  rating: number;
  testimonial: string;
  photoUrl: string | null;
  productId: string | null;
  product: { name: string } | null;
  verifiedPurchase: boolean;
  published: boolean;
  featured: boolean;
  reviewDate: string;
};

const emptyForm = {
  id: "",
  customerName: "",
  city: "",
  state: "",
  rating: 5,
  testimonial: "",
  photoUrl: "",
  productId: "",
  verifiedPurchase: true,
  published: true,
  featured: false,
  reviewDate: new Date().toISOString().slice(0, 10),
};

export default function ReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/reviews").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
    ])
      .then(([reviewsData, productsData]) => {
        setReviews(reviewsData);
        setProducts(productsData);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const total = reviews.length;
  const published = reviews.filter((r) => r.published).length;
  const pending = total - published;
  const avg = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "—";

  function openNew() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(r: Review) {
    setForm({
      id: r.id,
      customerName: r.customerName,
      city: r.city ?? "",
      state: r.state ?? "",
      rating: r.rating,
      testimonial: r.testimonial,
      photoUrl: r.photoUrl ?? "",
      productId: r.productId ?? "",
      verifiedPurchase: r.verifiedPurchase,
      published: r.published,
      featured: r.featured,
      reviewDate: r.reviewDate.slice(0, 10),
    });
    setShowForm(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/reviews/upload", { method: "POST", body });
      const data = await res.json();
      if (res.ok) setForm((f) => ({ ...f, photoUrl: data.url }));
      else alert(data.error ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        customerName: form.customerName,
        city: form.city || null,
        state: form.state || null,
        rating: Number(form.rating),
        testimonial: form.testimonial,
        photoUrl: form.photoUrl || null,
        productId: form.productId || null,
        verifiedPurchase: form.verifiedPurchase,
        published: form.published,
        featured: form.featured,
        reviewDate: form.reviewDate,
      };
      const url = form.id ? `/api/admin/reviews/${form.id}` : "/api/admin/reviews";
      const method = form.id ? "PATCH" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(r: Review) {
    await fetch(`/api/admin/reviews/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !r.published }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta avaliação?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={String(total)} />
        <StatCard label="Publicadas" value={String(published)} />
        <StatCard label="Pendentes" value={String(pending)} />
        <StatCard label="Nota média" value={avg} />
      </div>

      <button onClick={openNew} className="btn-primary">
        + Nova avaliação
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-surface space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-graphite-800/70">Nome do cliente</span>
              <input
                required
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                className="w-full rounded-lg border border-graphite-900/15 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-graphite-800/70">Produto comprado</span>
              <select
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                className="w-full rounded-lg border border-graphite-900/15 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-graphite-800/70">Cidade</span>
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="w-full rounded-lg border border-graphite-900/15 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-graphite-800/70">UF</span>
              <input maxLength={2} value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))} className="w-full rounded-lg border border-graphite-900/15 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-graphite-800/70">Nota</span>
              <select value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} className="w-full rounded-lg border border-graphite-900/15 px-3 py-2 text-sm">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrela{n > 1 ? "s" : ""}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-graphite-800/70">Data</span>
              <input type="date" value={form.reviewDate} onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))} className="w-full rounded-lg border border-graphite-900/15 px-3 py-2 text-sm" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-graphite-800/70">Depoimento</span>
            <textarea
              required
              rows={3}
              value={form.testimonial}
              onChange={(e) => setForm((f) => ({ ...f, testimonial: e.target.value }))}
              className="w-full rounded-lg border border-graphite-900/15 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-cream-100">
              {form.photoUrl && <Image src={form.photoUrl} alt="" fill className="object-cover" />}
            </div>
            <label className="btn-secondary cursor-pointer px-4 py-2 text-xs">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Enviando..." : "Foto do cliente"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-graphite-800/80">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.verifiedPurchase} onChange={(e) => setForm((f) => ({ ...f, verifiedPurchase: e.target.checked }))} />
              Compra verificada
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
              Publicada
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
              Destaque
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Salvando..." : "Salvar avaliação"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-graphite-900/10 text-xs uppercase text-graphite-800/50">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Nota</th>
                <th className="px-4 py-3">Depoimento</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Verificada</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-900/5">
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.photoUrl && (
                        <div className="relative h-8 w-8 overflow-hidden rounded-full">
                          <Image src={r.photoUrl} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{r.customerName}</p>
                        {(r.city || r.state) && <p className="text-xs text-graphite-800/50">{r.city}{r.city && r.state ? "/" : ""}{r.state}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-0.5 text-clay-600">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                    </span>
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-graphite-800/75">{r.testimonial}</td>
                  <td className="px-4 py-3 text-graphite-800/70">{r.product?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.verifiedPurchase ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.published ? "bg-sage-100 text-sage-700" : "bg-graphite-900/10 text-graphite-700"}`}>
                      {r.published ? "Publicada" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button title="Editar" onClick={() => openEdit(r)}><Pencil className="h-4 w-4 text-graphite-800/60" /></button>
                      <button title={r.published ? "Ocultar" : "Publicar"} onClick={() => togglePublished(r)}>
                        {r.published ? <EyeOff className="h-4 w-4 text-graphite-800/60" /> : <Eye className="h-4 w-4 text-graphite-800/60" />}
                      </button>
                      <button title="Excluir" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-red-600/70" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-graphite-800/50">Nenhuma avaliação cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-5">
      <p className="text-xs text-graphite-800/60">{label}</p>
      <p className="mt-1.5 text-xl font-extrabold text-graphite-950">{value}</p>
    </div>
  );
}
