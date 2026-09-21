import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { priceUpsell } from "@/lib/pricing";
import { createPixTransaction, BravopayError } from "@/lib/bravopay";
import { generateDisplayId } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  idempotencyKey: z.string().uuid(),
  parentOrderDisplayId: z.string(),
  upsellProductId: z.string(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`upsell:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  const input = parsed.data;

  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return NextResponse.json(toResponse(existing));

  const parent = await db.order.findUnique({ where: { displayId: input.parentOrderDisplayId }, include: { customer: true } });
  if (!parent || parent.status !== "PAID") {
    return NextResponse.json({ error: "Pedido original não encontrado ou ainda não confirmado" }, { status: 400 });
  }

  let priced;
  try {
    priced = await priceUpsell(input.upsellProductId);
  } catch {
    return NextResponse.json({ error: "Oferta indisponível" }, { status: 400 });
  }

  const bravopayProductId = priced.product.bravopayProductId ?? process.env.BRAVOPAY_PRODUCT_ID;
  if (!bravopayProductId) {
    return NextResponse.json({ error: "Produto de upsell não configurado" }, { status: 500 });
  }

  const displayId = generateDisplayId();
  let order;
  try {
    order = await db.order.create({
      data: {
        displayId,
        customerId: parent.customerId,
        idempotencyKey: input.idempotencyKey,
        status: "CREATED",
        isUpsellOrder: true,
        parentOrderId: parent.id,
        shippingZip: parent.shippingZip,
        shippingAddress: parent.shippingAddress,
        shippingNumber: parent.shippingNumber,
        shippingComplement: parent.shippingComplement,
        shippingNeighborhood: parent.shippingNeighborhood,
        shippingCity: parent.shippingCity,
        shippingState: parent.shippingState,
        subtotalCents: priced.priceCents,
        shippingCents: 0,
        discountCents: 0,
        totalCents: priced.priceCents,
        utmSource: parent.utmSource,
        utmMedium: parent.utmMedium,
        utmCampaign: parent.utmCampaign,
        utmContent: parent.utmContent,
        utmTerm: parent.utmTerm,
        fbclid: parent.fbclid,
        gclid: parent.gclid,
        items: {
          create: [{
            productId: priced.product.id,
            name: priced.product.name,
            kind: "upsell",
            quantity: 1,
            unitPriceCents: priced.priceCents,
            totalCents: priced.priceCents,
          }],
        },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const raced = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (raced) return NextResponse.json(toResponse(raced));
    }
    throw err;
  }

  try {
    const tx = await createPixTransaction({
      amountCents: order.totalCents,
      idempotencyKey: order.idempotencyKey,
      externalReference: order.displayId,
      description: `Upsell: ${priced.product.name}`,
      productId: bravopayProductId,
      customer: { name: parent.customer.name, email: parent.customer.email, cpf: parent.customer.cpf, phone: parent.customer.phone },
      metadata: { orderId: order.id, parentOrderId: parent.id },
    });

    order = await db.order.update({
      where: { id: order.id },
      data: {
        status: "PIX_GENERATED",
        bravopayTransactionId: tx.id,
        pixCopyPaste: tx.pix?.copy_paste,
        pixExpiresAt: tx.pix?.expires_at ? new Date(tx.pix.expires_at) : null,
      },
    });
  } catch (err) {
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    const message = err instanceof BravopayError ? err.message : "Falha ao gerar o PIX do upsell";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json(toResponse(order));
}

function toResponse(order: {
  displayId: string; status: string; totalCents: number; pixCopyPaste: string | null; pixExpiresAt: Date | null;
}) {
  return {
    orderId: order.displayId,
    status: order.status,
    totalCents: order.totalCents,
    pixCopyPaste: order.pixCopyPaste,
    pixExpiresAt: order.pixExpiresAt,
  };
}
