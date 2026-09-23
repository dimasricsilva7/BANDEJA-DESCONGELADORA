"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, Copy, Loader2, ShieldCheck, Lock, User, MapPin, ShoppingBag, FileText, Sparkles } from "lucide-react";
import { formatBRL } from "@/lib/pricing";
import { trackPixel } from "@/components/MetaPixel";
import { readAttribution } from "@/components/TrackingCapture";
import OfferTimer from "@/components/OfferTimer";

type OrderBump = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents?: number;
  image: string | null;
  featured?: boolean;
  headline: string;
};
type Product = { slug: string; name: string; priceCents: number; compareAtCents?: number; image: string };

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
      <main className="min-h-screen bg-cream-50 py-8 sm:py-14">
        <div className="container-app max-w-md">
          <div className="overflow-hidden rounded-xl2 bg-white shadow-lift ring-1 ring-graphite-950/[0.05]">
            <div className="flex items-center gap-3 border-b border-graphite-900/10 bg-cream-50/70 px-6 py-4">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                <Image src={product.image} alt={product.name} fill sizes="44px" className="object-contain" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-graphite-950">{product.name}</p>
                <p className="text-xs text-graphite-700/60">Pedido {pix.orderId}</p>
              </div>
            </div>

            <div className="p-6 text-center sm:p-8">
              {pix.status === "PENDING" || pix.status === "PIX_GENERATED" ? (
                <>
                  <h1 className="text-lg font-extrabold text-graphite-950">Pague com PIX para confirmar</h1>
                  <p className="mt-1 text-sm text-graphite-700/75">Escaneie o QR Code ou copie o código abaixo</p>

                  {qrDataUrl && (
                    <div className="mx-auto mt-5 w-fit rounded-xl2 bg-white p-3 ring-1 ring-graphite-950/[0.08]">
                      <Image src={qrDataUrl} alt="QR Code PIX" width={220} height={220} unoptimized />
                    </div>
                  )}
                  <p className="mt-5 text-3xl font-extrabold tracking-tight text-graphite-950">{formatBRL(pix.totalCents)}</p>

                  {secondsLeft !== null && (
                    <p className="mt-1 text-xs font-medium text-graphite-700/60">
                      {secondsLeft > 0
                        ? `Expira em ${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
                        : "PIX expirado — gere um novo pedido"}
                    </p>
                  )}

                  <button onClick={copyPix} className="btn-primary mt-6 w-full">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Código copiado!" : "COPIAR CÓDIGO PIX"}
                  </button>

                  <div className="mt-5 flex items-center justify-center gap-2 text-sm text-graphite-700/75">
                    <Loader2 className="h-4 w-4 animate-spin text-sage-600" />
                    Aguardando confirmação do pagamento...
                  </div>

                  <ol className="mt-7 space-y-2 rounded-xl2 bg-cream-50 p-4 text-left text-xs text-graphite-700/80">
                    <li className="flex gap-2"><span className="font-bold text-clay-600">1.</span> Abra o app do seu banco</li>
                    <li className="flex gap-2"><span className="font-bold text-clay-600">2.</span> Escolha pagar via PIX com QR Code ou copia e cola</li>
                    <li className="flex gap-2"><span className="font-bold text-clay-600">3.</span> Confirme o pagamento — a aprovação aqui é automática</li>
                  </ol>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-graphite-700/70">
                    <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-sage-600" /> Compra segura</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-sage-600" /> Garantia total ou seu dinheiro de volta</span>
                  </div>
                </>
              ) : (
                <p className="text-graphite-700/80">
                  Este pedido não está mais disponível para pagamento (status: {pix.status}).
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const selectedBumpList = orderBumps.filter((b) => selectedBumps.has(b.id));
  const featuredBumps = orderBumps.filter((b) => b.featured);
  const regularBumps = orderBumps.filter((b) => !b.featured);

  return (
    <main className="min-h-screen bg-cream-50 py-6 sm:py-10">
      <div className="container-app max-w-5xl">
        <div className="mb-6 flex items-center gap-2 text-sm text-graphite-700/70">
          <Link href="/" className="hover:text-graphite-950">Loja</Link>
          <span>/</span>
          <span className="font-medium text-graphite-950">Finalizar pedido</span>
        </div>

        <OfferTimer />

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-5">
            <SectionCard icon={User} step={1} title="Seus dados">
              <Input label="Nome completo" value={form.name} onChange={(v) => updateField("name", v)} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="CPF" value={form.cpf} onChange={(v) => updateField("cpf", v)} required placeholder="000.000.000-00" />
                <Input label="Telefone" value={form.phone} onChange={(v) => updateField("phone", v)} required placeholder="(00) 00000-0000" />
              </div>
              <Input label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} required />
            </SectionCard>

            <SectionCard icon={MapPin} step={2} title="Endereço de entrega">
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
            </SectionCard>

            {featuredBumps.length > 0 && (
              <SectionCard icon={Sparkles} step={3} title="Oferta especial" optional>
                <div className="space-y-3">
                  {featuredBumps.map((bump) => (
                    <BumpRow key={bump.id} bump={bump} checked={selectedBumps.has(bump.id)} onToggle={() => toggleBump(bump.id)} highlight />
                  ))}
                </div>
              </SectionCard>
            )}

            {regularBumps.length > 0 && (
              <SectionCard icon={ShoppingBag} step={featuredBumps.length > 0 ? 4 : 3} title="Produtos adicionais" optional>
                <div className="space-y-3">
                  {regularBumps.map((bump) => (
                    <BumpRow key={bump.id} bump={bump} checked={selectedBumps.has(bump.id)} onToggle={() => toggleBump(bump.id)} />
                  ))}
                </div>
              </SectionCard>
            )}

            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>

          <aside className="sticky top-4 space-y-4">
            <div className="overflow-hidden rounded-xl2 bg-white shadow-lift ring-1 ring-graphite-950/[0.05]">
              <div className="flex items-center gap-2 border-b border-graphite-900/10 px-5 py-3.5">
                <ShoppingBag className="h-4 w-4 text-sage-600" />
                <h2 className="text-sm font-extrabold text-graphite-950">Resumo do pedido</h2>
              </div>

              <div className="p-5">
                <div className="flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                    <Image src={product.image} alt={product.name} fill sizes="80px" className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-graphite-950">{product.name}</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      {product.compareAtCents && (
                        <span className="text-xs text-graphite-700/40 line-through">{formatBRL(product.compareAtCents)}</span>
                      )}
                      <span className="text-sm font-extrabold text-graphite-950">{formatBRL(product.priceCents)}</span>
                    </div>
                  </div>
                </div>

                {selectedBumpList.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-graphite-900/10 pt-4">
                    {selectedBumpList.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm text-graphite-700">
                        <span className="truncate pr-2">{b.name}</span>
                        <span className="shrink-0 font-medium text-graphite-950">{formatBRL(b.priceCents)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-1.5 border-t border-graphite-900/10 pt-4 text-sm">
                  <div className="flex justify-between text-graphite-700/80">
                    <span>Frete</span>
                    <span className="font-medium text-sage-700">Grátis</span>
                  </div>
                  <div className="flex justify-between text-lg font-extrabold text-graphite-950">
                    <span>Total</span>
                    <span>{formatBRL(total)}</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {submitting ? "Gerando PIX..." : "GERAR PIX"}
                </button>

                <p className="mt-3 flex items-center justify-center gap-2 text-xs text-graphite-700/60">
                  <ShieldCheck className="h-4 w-4 text-sage-600" /> Compra segura via PIX
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function BumpRow({
  bump,
  checked,
  onToggle,
  highlight,
}: {
  bump: OrderBump;
  checked: boolean;
  onToggle: () => void;
  highlight?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
        checked
          ? "border-clay-500 bg-clay-50"
          : highlight
            ? "border-sage-400 bg-sage-50 hover:border-sage-500"
            : "border-graphite-900/10 bg-cream-50 hover:border-graphite-900/20"
      }`}
    >
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 accent-clay-600"
        checked={checked}
        onChange={onToggle}
      />
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        {bump.image ? (
          <Image src={bump.image} alt={bump.name} fill sizes="48px" className="object-contain" />
        ) : (
          <FileText className="h-6 w-6 text-sage-600" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {highlight && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sage-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              <Sparkles className="h-2.5 w-2.5" /> OFERTA
            </span>
          )}
          <p className="truncate text-sm font-bold text-graphite-950">{bump.name}</p>
        </div>
        <p className="truncate text-xs text-graphite-700/70">{bump.headline}</p>
      </div>
      <div className="shrink-0 text-right">
        {bump.compareAtCents && (
          <p className="text-xs text-graphite-700/40 line-through">{formatBRL(bump.compareAtCents)}</p>
        )}
        <p className="text-sm font-extrabold text-graphite-950">{formatBRL(bump.priceCents)}</p>
      </div>
    </label>
  );
}

function SectionCard({
  icon: Icon,
  step,
  title,
  optional,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  step: number;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-graphite-950 text-xs font-bold leading-none text-cream-50">
          {step}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-sage-600" />
        <span className="text-sm font-extrabold leading-none text-graphite-950">{title}</span>
        {optional && <span className="text-xs font-normal leading-none text-graphite-700/50">(opcional)</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({
  label, value, onChange, onBlur, type = "text", required, placeholder, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  type?: string; required?: boolean; placeholder?: string; maxLength?: number;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-graphite-700/80">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full rounded-lg border border-graphite-900/15 bg-cream-50 px-3.5 py-2.5 text-sm text-graphite-950 outline-none ring-clay-500/30 focus:ring-2"
      />
    </label>
  );
}
