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
          image: mainProduct.images[0] ?? "/images/produto-hero.png",
        }}
        orderBumps={bumps.map((b) => ({
          id: b.id,
          slug: b.slug,
          name: b.name,
          priceCents: b.orderBumpPriceCents ?? b.priceCents,
          headline: b.orderBumpHeadline ?? `Adicionar ${b.name}`,
        }))}
      />
    </Suspense>
  );
}
