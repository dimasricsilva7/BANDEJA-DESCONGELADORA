"use client";

import { useEffect, useState } from "react";

type Field = { key: string; label: string; textarea?: boolean; hint?: string };

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Loja",
    fields: [
      { key: "store_name", label: "Nome da loja" },
      { key: "contact_email", label: "E-mail de contato" },
      { key: "contact_whatsapp", label: "WhatsApp de contato (com DDD)" },
      { key: "shipping_days", label: "Prazo de envio (dias úteis)" },
    ],
  },
  {
    title: "Garantia (só aparece no site o que for preenchido aqui)",
    fields: [
      { key: "guarantee_text", label: "Frase principal da garantia" },
      { key: "guarantee_days", label: "Prazo (ex: 7 dias corridos)" },
      { key: "guarantee_conditions", label: "Condições", textarea: true },
      { key: "guarantee_how_to", label: "Como solicitar", textarea: true },
    ],
  },
  {
    title: "Especificações do produto (deixe em branco o que não se aplica)",
    fields: [
      { key: "spec_material", label: "Material" },
      { key: "spec_dimensions", label: "Dimensões" },
      { key: "spec_weight", label: "Peso" },
      { key: "spec_capacity", label: "Capacidade" },
      { key: "spec_battery", label: "Bateria" },
      { key: "spec_power", label: "Alimentação / Carregamento" },
      { key: "spec_package_contents", label: "Conteúdo da embalagem" },
      { key: "spec_cleaning", label: "Forma de limpeza" },
      { key: "spec_usage", label: "Uso recomendado" },
    ],
  },
  {
    title: "Políticas (rodapé — opcional)",
    fields: [
      { key: "policy_privacy", label: "Política de privacidade", textarea: true },
      { key: "policy_terms", label: "Termos de uso", textarea: true },
      { key: "policy_exchange", label: "Política de troca/devolução", textarea: true },
      { key: "policy_delivery", label: "Política de entrega", textarea: true },
      { key: "company_info", label: "Razão social / CNPJ (se aplicável)" },
    ],
  },
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
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {GROUPS.map((group) => (
        <div key={group.title} className="card-surface space-y-4 p-6">
          <p className="text-sm font-bold text-graphite-950">{group.title}</p>
          {group.fields.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs font-medium text-graphite-800/70">{field.label}</span>
              {field.textarea ? (
                <textarea
                  value={settings[field.key] ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-graphite-900/15 px-3.5 py-2.5 text-sm"
                />
              ) : (
                <input
                  value={settings[field.key] ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                  className="w-full rounded-lg border border-graphite-900/15 px-3.5 py-2.5 text-sm"
                />
              )}
            </label>
          ))}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && <span className="text-sm text-sage-700">Salvo!</span>}
      </div>
      <p className="text-xs text-graphite-800/50">
        Chaves de API e segredos (BravoPay, Meta, banco de dados) são gerenciados apenas por variáveis
        de ambiente na Vercel — nunca ficam expostos aqui.
      </p>
    </form>
  );
}
