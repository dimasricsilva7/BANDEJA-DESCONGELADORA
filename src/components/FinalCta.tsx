import Link from "next/link";
import Price from "@/components/Price";
import TrustBar from "@/components/TrustBar";

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
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Mais praticidade para preparar suas refeições.
        </h2>
        <div className="mt-6 flex justify-center">
          <Price priceCents={priceCents} compareAtCents={compareAtCents} size="lg" />
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/checkout" className="btn-primary">
            COMPRAR AGORA
          </Link>
        </div>
        <TrustBar className="mt-8 justify-center text-cream-50/85 [&_svg]:text-clay-400" />
      </div>
    </section>
  );
}
