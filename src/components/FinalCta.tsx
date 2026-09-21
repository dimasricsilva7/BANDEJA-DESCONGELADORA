import Link from "next/link";
import Price from "@/components/Price";
import TrustBadges from "@/components/TrustBadges";

export default function FinalCta({
  priceCents,
  compareAtCents,
}: {
  priceCents: number;
  compareAtCents: number;
}) {
  return (
    <section className="section bg-graphite-950 text-cream-50">
      <div className="container-app max-w-xl text-center">
        <h2 className="font-serif text-2xl sm:text-3xl">
          Mais praticidade para preparar suas refeições.
        </h2>
        <div className="mt-6 flex justify-center">
          <Price priceCents={priceCents} compareAtCents={compareAtCents} size="lg" />
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/checkout" className="btn-primary bg-cream-50 text-graphite-950 hover:bg-cream-100">
            QUERO COMPRAR AGORA
          </Link>
        </div>
        <TrustBadges className="mt-8 justify-center text-cream-50/80 [&_svg]:text-amber-500" />
      </div>
    </section>
  );
}
