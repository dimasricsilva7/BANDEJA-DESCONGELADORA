import Image from "next/image";
import Link from "next/link";
import Price from "@/components/Price";
import TrustBadges from "@/components/TrustBadges";

export default function Hero({
  priceCents,
  compareAtCents,
  heroImage,
}: {
  priceCents: number;
  compareAtCents: number;
  heroImage: string;
}) {
  return (
    <section className="relative overflow-hidden bg-cream-50">
      <div className="container-app grid gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="order-2 animate-fadeUp lg:order-1">
          <p className="eyebrow mb-4">Cozinha prática · Novidade</p>
          <h1 className="font-serif text-3xl leading-tight text-graphite-950 sm:text-4xl lg:text-[2.75rem]">
            Descongele seus alimentos com muito mais praticidade — sem precisar esperar horas.
          </h1>
          <p className="mt-5 max-w-lg text-base text-graphite-800/80 sm:text-lg">
            Uma solução prática para sua cozinha que facilita o preparo de carnes e alimentos
            congelados, para você organizar melhor o seu dia.
          </p>

          <div className="mt-7">
            <Price priceCents={priceCents} compareAtCents={compareAtCents} size="lg" />
            <p className="mt-1 text-sm text-graphite-800/60">
              à vista no PIX · frete grátis para todo o Brasil
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/checkout" className="btn-primary">
              QUERO MINHA BANDEJA POR {(priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </Link>
            <a href="#como-funciona" className="btn-secondary">
              VER COMO FUNCIONA
            </a>
          </div>

          <TrustBadges className="mt-8" />
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl2 bg-white shadow-soft ring-1 ring-graphite-900/5 sm:max-w-lg">
            <Image
              src={heroImage}
              alt="Bandeja de Descongelamento Rápido com Tampa"
              fill
              priority
              sizes="(max-width: 768px) 90vw, 520px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
