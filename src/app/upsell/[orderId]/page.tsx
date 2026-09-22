import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import UpsellClient from "./UpsellClient";

export const dynamic = "force-dynamic";

export default async function UpsellPage({ params }: { params: { orderId: string } }) {
  const order = await db.order.findUnique({ where: { displayId: params.orderId } });
  if (!order) notFound();

  if (order.status !== "PAID") {
    redirect(`/pedido/sucesso/${order.displayId}`);
  }

  const upsellProduct = await db.product.findFirst({ where: { type: "UPSELL", active: true, upsellEnabled: true } });
  if (!upsellProduct) {
    redirect(`/pedido/sucesso/${order.displayId}`);
  }

  return (
    <UpsellClient
      parentOrderId={order.displayId}
      product={{
        id: upsellProduct.id,
        name: upsellProduct.name,
        image: upsellProduct.images[0] ?? "/images/kit-complementar.jpg",
        compareAtCents: upsellProduct.compareAtCents ?? upsellProduct.priceCents,
        priceCents: upsellProduct.upsellPriceCents ?? upsellProduct.priceCents,
        headline: upsellProduct.upsellHeadline ?? "Oferta especial só para quem acabou de comprar.",
      }}
    />
  );
}
