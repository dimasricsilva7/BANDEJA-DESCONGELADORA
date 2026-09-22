"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, Copy, Loader2 } from "lucide-react";
import { formatBRL } from "@/lib/pricing";

const POLL_SCHEDULE = [0, 3000, 6000, 10000, 15000, 20000, 30000, 45000, 60000];

type Product = { id: string; name: string; image: string; compareAtCents: number; priceCents: number; headline: string };
type PixState = { orderId: string; status: string; totalCents: number; pixCopyPaste: string | null; pixExpiresAt: string | null };

export default function UpsellClient({ parentOrderId, product }: { parentOrderId: string; product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const pollIndexRef = useRef(0);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function acceptOffer() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey, parentOrderDisplayId: parentOrderId, upsellProductId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível gerar o PIX da oferta.");
        return;
      }
      setPix(data);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pix?.pixCopyPaste) {
      QRCode.toDataURL(pix.pixCopyPaste, { width: 240, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    }
  }, [pix?.pixCopyPaste]);

  useEffect(() => {
    if (!pix || pix.status === "PAID") return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/orders/${pix!.orderId}/status`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status && data.status !== pix!.status) setPix((prev) => (prev ? { ...prev, status: data.status } : prev));
        if (data.status === "PAID") return;
      } catch {
        // retry no próximo ciclo
      }
      const idx = pollIndexRef.current;
      const delay = POLL_SCHEDULE[idx] ?? 60000;
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
    if (pix?.status === "PAID") router.push(`/pedido/sucesso/${parentOrderId}`);
  }, [pix?.status, parentOrderId, router]);

  function copyPix() {
    if (!pix?.pixCopyPaste) return;
    navigator.clipboard.writeText(pix.pixCopyPaste).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main className="min-h-screen bg-cream-50 py-14">
      <div className="container-app max-w-md">
        <div className="rounded-xl2 bg-white p-7 text-center shadow-soft">
          <h1 className="text-xl font-extrabold text-graphite-950">{product.headline}</h1>

          {!pix && (
            <>
              <div className="relative mx-auto mt-5 aspect-square w-40 overflow-hidden rounded-xl bg-cream-100">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </div>
              <p className="mt-4 font-medium text-graphite-950">{product.name}</p>
              <div className="mt-2 flex items-baseline justify-center gap-2">
                <span className="text-graphite-900/40 line-through">{formatBRL(product.compareAtCents)}</span>
                <span className="text-2xl font-extrabold text-graphite-950">{formatBRL(product.priceCents)}</span>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <button onClick={acceptOffer} disabled={loading} className="btn-primary mt-6 w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Gerando PIX..." : "SIM, QUERO APROVEITAR"}
              </button>
              <button onClick={() => router.push(`/pedido/sucesso/${parentOrderId}`)} className="btn-secondary mt-3 w-full">
                Não, obrigado
              </button>
            </>
          )}

          {pix?.pixCopyPaste && pix.status !== "PAID" && (
            <>
              {qrDataUrl && <Image src={qrDataUrl} alt="QR Code PIX" width={200} height={200} className="mx-auto mt-6 rounded-lg" unoptimized />}
              <p className="mt-4 text-2xl font-extrabold">{formatBRL(pix.totalCents)}</p>
              <button onClick={copyPix} className="btn-primary mt-5 w-full">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Código copiado!" : "COPIAR CÓDIGO PIX"}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-graphite-800/70">
                <Loader2 className="h-4 w-4 animate-spin" /> Aguardando pagamento...
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
