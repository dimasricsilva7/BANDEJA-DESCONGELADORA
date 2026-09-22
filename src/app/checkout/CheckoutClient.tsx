"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, Copy, Loader2, ShieldCheck } from "lucide-react";
import { formatBRL } from "@/lib/pricing";
import { trackPixel } from "@/components/MetaPixel";
import { readAttribution } from "@/components/TrackingCapture";

type OrderBump = { id: string; slug: string; name: string; priceCents: number; headline: string };
type Product = { slug: string; name: string; priceCents: number; image: string };

const POLL_SCHEDULE = [0, 3000, 6000, 10000, 15000, 20000, 30000, 45000, 60000];
const POLL_STEADY_STATE = 60000;

type PixState = {
  orderId: string;
  status: string;
  totalCents: number;
  pixCopyPaste: string | null;
  pixExpiresAt: string | null;
};

export default function CheckoutClient({ product, orderBumps }: { product: Product; orderBumps: OrderBump[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(() => {
    const preselect = searchParams.get("bump");
    const match = orderBumps.find((b) => b.slug === preselect);
    return new Set(match ? [match.id] : []);
  });

  const [form, setForm] = useState({
    name: "", email: "", cpf: "", phone: "",
    zip: "", address: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const purchaseEventId = useMemo(() => crypto.randomUUID(), []);
  const pollIndexRef = useRef(0);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total =
    product.priceCents + orderBumps.filter((b) => selectedBumps.has(b.id)).reduce((s, b) => s + b.priceCents, 0);

  useEffect(() => {
    trackPixel("InitiateCheckout", { value: total / 100, currency: "BRL" });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "initiate_checkout" }),
      keepalive: true,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleBump(id: string) {
    setSelectedBumps((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCepBlur() {
    const digits = form.zip.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          address: data.logradouro || f.address,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    } catch {
      // preenchimento automático é best-effort — usuário pode digitar manualmente
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const attribution = readAttribution();

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          mainProductSlug: product.slug,
          orderBumpProductIds: Array.from(selectedBumps),
          customer: { name: form.name, email: form.email, cpf: form.cpf, phone: form.phone },
          shipping: {
            zip: form.zip, address: form.address, number: form.number, complement: form.complement,
            neighborhood: form.neighborhood, city: form.city, state: form.state,
          },
          utm: attribution,
          eventId: purchaseEventId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível gerar o PIX. Tente novamente.");
        setSubmitting(false);
        return;
      }
      setPix(data);
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (pix?.pixCopyPaste) {
      QRCode.toDataURL(pix.pixCopyPaste, { width: 280, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    }
  }, [pix?.pixCopyPaste]);

  useEffect(() => {
    if (!pix?.pixExpiresAt) return;
    const tick = () => {
      const diff = new Date(pix.pixExpiresAt!).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(diff / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pix?.pixExpiresAt]);

  // Polling de fallback: webhook é a fonte de verdade, mas aqui cobrimos
  // o caso do webhook atrasar ou não chegar.
  useEffect(() => {
    if (!pix || pix.status === "PAID") return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${pix!.orderId}/status`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status && data.status !== pix!.status) {
          setPix((prev) => (prev ? { ...prev, status: data.status } : prev));
        }
        if (data.status === "PAID") return; // stop polling
      } catch {
        // tenta de novo no próximo ciclo
      }
      const idx = pollIndexRef.current;
      const delay = POLL_SCHEDULE[idx] ?? POLL_STEADY_STATE;
      pollIndexRef.current = Math.min(idx + 1, POLL_SCHEDULE.length);
      pollTimeoutRef.current = setTimeout(poll, delay);
    }

    poll();
    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix?.orderId, pix?.status]);

  useEffect(() => {
    // O evento Purchase do Pixel é disparado na página de obrigado
    // (/pedido/sucesso), não aqui — assim a conversão é registrada mesmo que
    // o cliente feche o checkout e volte depois pelo link do pedido.
    if (pix?.status === "PAID") {
      router.push(`/upsell/${pix.orderId}`);
    }
  }, [pix?.status, pix?.orderId, router]);

  function copyPix() {
    if (!pix?.pixCopyPaste) return;
    navigator.clipboard.writeText(pix.pixCopyPaste).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (pix?.pixCopyPaste) {
    return (
      <main className="min-h-screen bg-cream-50 py-10">
        <div className="container-app max-w-md">
          <div className="rounded-xl2 bg-white p-6 shadow-soft text-center">
            <h1 className="font-serif text-xl text-graphite-950">Pague com PIX para confirmar seu pedido</h1>
            <p className="mt-1 text-sm text-graphite-800/70">Pedido {pix.orderId}</p>

            {pix.status === "PENDING" || pix.status === "PIX_GENERATED" ? (
              <>
                {qrDataUrl && (
                  <Image src={qrDataUrl} alt="QR Code PIX" width={220} height={220} className="mx-auto mt-6 rounded-lg" unoptimized />
                )}
                <p className="mt-4 text-2xl font-semibold font-serif">{formatBRL(pix.totalCents)}</p>

                {secondsLeft !== null && (
                  <p className="mt-1 text-xs text-graphite-800/60">
                    {secondsLeft > 0
                      ? `Expira em ${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
                      : "PIX expirado — gere um novo pedido"}
                  </p>
                )}

                <button onClick={copyPix} className="btn-primary mt-5 w-full">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Código copiado!" : "COPIAR CÓDIGO PIX"}
                </button>

                <div className="mt-5 flex items-center justify-center gap-2 text-sm text-graphite-800/70">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>

                <ol className="mt-6 space-y-1.5 text-left text-xs text-graphite-800/60">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escolha pagar via PIX com QR Code ou copia e cola</li>
                  <li>3. Confirme o pagamento — a confirmação aqui é automática</li>
                </ol>
              </>
            ) : (
              <p className="mt-6 text-graphite-800/80">
                Este pedido não está mais disponível para pagamento (status: {pix.status}).
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-50 py-10">
      <div className="container-app grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="space-y-8 rounded-xl2 bg-white p-6 shadow-soft sm:p-8">
          <div>
            <h1 className="font-serif text-2xl text-graphite-950">Finalizar pedido</h1>
            <p className="mt-1 text-sm text-graphite-800/70">Preencha seus dados para gerar o PIX.</p>
          </div>

          <fieldset className="space-y-4">
            <legend className="mb-1 text-sm font-semibold text-graphite-900">Seus dados</legend>
            <Input label="Nome completo" value={form.name} onChange={(v) => updateField("name", v)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="CPF" value={form.cpf} onChange={(v) => updateField("cpf", v)} required placeholder="000.000.000-00" />
              <Input label="Telefone" value={form.phone} onChange={(v) => updateField("phone", v)} required placeholder="(00) 00000-0000" />
            </div>
            <Input label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} required />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-1 text-sm font-semibold text-graphite-900">Endereço de entrega</legend>
            <Input label="CEP" value={form.zip} onChange={(v) => updateField("zip", v)} onBlur={handleCepBlur} required placeholder="00000-000" />
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Input label="Endereço" value={form.address} onChange={(v) => updateField("address", v)} required />
              <Input label="Número" value={form.number} onChange={(v) => updateField("number", v)} required />
            </div>
            <Input label="Complemento (opcional)" value={form.complement} onChange={(v) => updateField("complement", v)} />
            <Input label="Bairro" value={form.neighborhood} onChange={(v) => updateField("neighborhood", v)} required />
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <Input label="Cidade" value={form.city} onChange={(v) => updateField("city", v)} required />
              <Input label="UF" value={form.state} onChange={(v) => updateField("state", v.toUpperCase())} required maxLength={2} />
            </div>
          </fieldset>

          {orderBumps.length > 0 && (
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-semibold text-graphite-900">Aproveite e leve também</legend>
              {orderBumps.map((bump) => (
                <label
                  key={bump.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-600/30 bg-amber-600/5 p-4"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-amber-700"
                    checked={selectedBumps.has(bump.id)}
                    onChange={() => toggleBump(bump.id)}
                  />
                  <span className="text-sm text-graphite-800/90">
                    {bump.headline}{" "}
                    <span className="font-semibold text-graphite-950">{formatBRL(bump.priceCents)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Gerando PIX..." : "GERAR PIX"}
          </button>

          <p className="flex items-center justify-center gap-2 text-xs text-graphite-800/60">
            <ShieldCheck className="h-4 w-4 text-amber-700" /> Pagamento processado com segurança
          </p>
        </form>

        <aside className="h-fit rounded-xl2 bg-white p-6 shadow-soft">
          <h2 className="font-serif text-lg text-graphite-950">Resumo do pedido</h2>
          <div className="mt-4 flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-100">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium text-graphite-950">{product.name}</p>
              <p className="text-sm text-graphite-800/70">{formatBRL(product.priceCents)}</p>
            </div>
          </div>

          {orderBumps
            .filter((b) => selectedBumps.has(b.id))
            .map((b) => (
              <div key={b.id} className="mt-3 flex justify-between text-sm text-graphite-800/80">
                <span>{b.name}</span>
                <span>{formatBRL(b.priceCents)}</span>
              </div>
            ))}

          <div className="mt-4 space-y-1.5 border-t border-graphite-900/10 pt-4 text-sm">
            <div className="flex justify-between text-graphite-800/70">
              <span>Frete</span>
              <span>Grátis</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-graphite-950">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Input({
  label, value, onChange, onBlur, type = "text", required, placeholder, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  type?: string; required?: boolean; placeholder?: string; maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-graphite-800/70">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full rounded-lg border border-graphite-900/15 bg-cream-50 px-3.5 py-2.5 text-sm text-graphite-950 outline-none ring-amber-600/30 focus:ring-2"
      />
    </label>
  );
}
