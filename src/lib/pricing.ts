import { db } from "@/lib/db";

export const SHIPPING_CENTS = 0; // frete grátis

export type PricedItem = {
  productId: string;
  name: string;
  kind: "main" | "order_bump";
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type PriceQuote = {
  items: PricedItem[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
};

/**
 * The frontend only sends product IDs and boolean flags for order bumps —
 * every price is re-derived here from the database. The browser can never
 * decide what gets charged.
 */
export async function priceCheckout(input: {
  mainProductSlug: string;
  orderBumpProductIds: string[];
}): Promise<PriceQuote> {
  const mainProduct = await db.product.findUnique({
    where: { slug: input.mainProductSlug },
  });
  if (!mainProduct || !mainProduct.active) {
    throw new Error("Produto principal indisponível");
  }

  const items: PricedItem[] = [
    {
      productId: mainProduct.id,
      name: mainProduct.name,
      kind: "main",
      quantity: 1,
      unitPriceCents: mainProduct.priceCents,
      totalCents: mainProduct.priceCents,
    },
  ];

  if (input.orderBumpProductIds.length > 0) {
    const bumps = await db.product.findMany({
      where: {
        id: { in: input.orderBumpProductIds },
        active: true,
        orderBumpEnabled: true,
      },
    });
    for (const bump of bumps) {
      const price = bump.orderBumpPriceCents ?? bump.priceCents;
      items.push({
        productId: bump.id,
        name: bump.name,
        kind: "order_bump",
        quantity: 1,
        unitPriceCents: price,
        totalCents: price,
      });
    }
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const shippingCents = SHIPPING_CENTS;
  const discountCents = 0;
  const totalCents = subtotalCents + shippingCents - discountCents;

  return { items, subtotalCents, shippingCents, discountCents, totalCents };
}

export async function priceUpsell(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.active || !product.upsellEnabled) {
    throw new Error("Oferta indisponível");
  }
  const priceCents = product.upsellPriceCents ?? product.priceCents;
  return { product, priceCents };
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
