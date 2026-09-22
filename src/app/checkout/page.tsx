import { Suspense } from "react";
import { db } from "@/lib/db";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [mainProduct, bumps] = await Promise.all([
    db.product.findFirst({ where: { type: "MAIN", active: true } }),
    db.product.findMany({ where: { orderBumpEnabled: true, active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!mainProduct) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p>Produto indisponível no momento.</p>
      </main>
    );
  }

  return (
    <Suspense fallback={null}>
      <CheckoutClient
        product={{
          slug: mainProduct.slug,
          name: mainProduct.name,
          priceCents: mainProduct.priceCents,
          compareAtCents: mainProduct.compareAtCents ?? undefined,
          image: mainProduct.images[0] ?? "/images/produto-hero.png",
        }}
        orderBumps={bumps.map((b) => ({
          id: b.id,
          slug: b.slug,
          name: b.name,
          priceCents: b.orderBumpPriceCents ?? b.priceCents,
          compareAtCents: b.priceCents !== (b.orderBumpPriceCents ?? b.priceCents) ? b.priceCents : undefined,
          image: b.images[0] ?? "/images/kit-complementar.png",
          headline: b.orderBumpHeadline ?? `Adicionar ${b.name}`,
        }))}
      />
    </Suspense>
  );
}
