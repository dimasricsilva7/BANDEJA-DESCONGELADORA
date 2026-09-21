"use client";

import { useEffect, useState } from "react";

const FIELDS: { key: string; label: string }[] = [
  { key: "store_name", label: "Nome da loja" },
  { key: "contact_email", label: "E-mail de contato" },
  { key: "contact_whatsapp", label: "WhatsApp de contato" },
  { key: "shipping_days", label: "Prazo de envio (dias úteis)" },
  { key: "guarantee_text", label: "Texto da garantia" },
];

export default function SettingsClient() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(setSettings).finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-graphite-800/60">Carregando...</p>;

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-4 rounded-xl2 bg-white p-6 shadow-card">
      {FIELDS.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1 block text-xs font-medium text-graphite-800/70">{field.label}</span>
          <input
            value={settings[field.key] ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
            className="w-full rounded-lg border border-graphite-900/15 px-3.5 py-2.5 text-sm"
          />
        </label>
      ))}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Salvo!</span>}
      </div>
      <p className="text-xs text-graphite-800/50">
        Chaves de API e segredos (BravoPay, Meta, banco de dados) são gerenciados apenas por variáveis
        de ambiente na Vercel — nunca ficam expostos aqui.
      </p>
    </form>
  );
}
