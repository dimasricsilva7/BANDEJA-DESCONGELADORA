import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import Price from "@/components/Price";
import TrustBar from "@/components/TrustBar";

export default function Hero({
  priceCents,
  compareAtCents,
  heroImage,
  reviewStats,
}: {
  priceCents: number;
  compareAtCents: number;
  heroImage: string;
  reviewStats: { count: number; avg: number };
}) {
  return (
    <section className="relative overflow-hidden bg-cream-50">
      <div className="container-app grid gap-10 py-8 sm:py-12 lg:grid-cols-2 lg:items-center lg:py-16">
        <div className="order-2 animate-fadeUp lg:order-1">
          <span className="inline-flex items-center rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-700">
            Bandeja de Descongelamento
          </span>

          <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.15] tracking-tight text-graphite-950 sm:text-4xl lg:text-[2.7rem]">
            Descongele em minutos, sem sujar a pia e sem esperar horas.
          </h1>
          <p className="mt-4 max-w-lg text-base text-graphite-700 sm:text-lg">
            Descongelador elétrico com painel digital e tempo ajustável, tampa protetora e fácil de
            limpar — pensado para acelerar o preparo das suas refeições no dia a dia.
          </p>

          <div className="mt-6">
            <Price priceCents={priceCents} compareAtCents={compareAtCents} size="lg" />
            <p className="mt-1 text-sm text-graphite-700/80">à vista no PIX · frete grátis para todo o Brasil</p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/checkout" className="btn-primary">
              GARANTIR MEU PEDIDO
            </Link>
            <a href="#como-funciona" className="btn-secondary">
              Ver como funciona
            </a>
          </div>

          {reviewStats.count > 0 && (
            <div className="mt-5 flex items-center gap-2 text-sm text-graphite-700">
              <span className="flex text-clay-600">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(reviewStats.avg) ? "fill-current" : "fill-none"}`} strokeWidth={1.5} />
                ))}
              </span>
              <span className="font-bold text-graphite-950">{reviewStats.avg.toFixed(1).replace(".", ",")}/5</span>
              <span className="text-graphite-700/70">· avaliações de clientes reais</span>
            </div>
          )}

          <TrustBar className="mt-7" variant="compact" />
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl2 bg-white shadow-lift ring-1 ring-graphite-950/[0.05] sm:max-w-lg">
            <Image
              src={heroImage}
              alt="Descongelador elétrico com tampa sobre bancada de cozinha"
              width={1145}
              height={370}
              priority
              sizes="(max-width: 768px) 90vw, 520px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
