"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, Trash2, Loader2 } from "lucide-react";

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
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoError(null);
    setVideoUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/video/upload",
      });
      setSettings((s) => ({ ...s, demo_video_url: blob.url }));
    } catch {
      setVideoError("Falha ao enviar o vídeo. Tente novamente.");
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

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
      <div className="card-surface space-y-4 p-6">
        <div>
          <p className="text-sm font-bold text-graphite-950">Vídeo de demonstração</p>
          <p className="mt-1 text-xs text-graphite-800/60">
            Aparece logo abaixo da hero, na página inicial. Envie na vertical (formato 9:16), como um vídeo de celular. Formatos aceitos: MP4, MOV ou WEBM.
          </p>
        </div>

        {settings.demo_video_url && (
          <div className="flex items-start gap-4">
            <video src={settings.demo_video_url} className="h-48 w-auto rounded-lg bg-graphite-950" controls muted />
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, demo_video_url: "" }))}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </button>
          </div>
        )}

        <div>
          <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoUpload} className="hidden" id="video-upload-input" />
          <label
            htmlFor="video-upload-input"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-graphite-900/15 px-4 py-2.5 text-sm font-medium text-graphite-800 hover:bg-cream-50"
          >
            {videoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {videoUploading ? "Enviando..." : settings.demo_video_url ? "Trocar vídeo" : "Enviar vídeo"}
          </label>
          {videoError && <p className="mt-2 text-xs text-red-600">{videoError}</p>}
        </div>
        <p className="text-xs text-graphite-800/50">
          Depois de enviar, clique em &quot;Salvar configurações&quot; no fim da página para publicar.
        </p>
      </div>

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
