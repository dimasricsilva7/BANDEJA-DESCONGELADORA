import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { priceCheckout } from "@/lib/pricing";
import { createPixTransaction, BravopayError } from "@/lib/bravopay";
import { generateDisplayId } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMetaCapiEvent } from "@/lib/meta-capi";

const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  mainProductSlug: z.string().min(1),
  orderBumpProductIds: z.array(z.string()).default([]),
  customer: z.object({
    name: z.string().trim().min(3).max(150),
    email: z.string().trim().email().max(200),
    cpf: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length === 11, "CPF inválido"),
    phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
  }),
  shipping: z.object({
    zip: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length === 8, "CEP inválido"),
    address: z.string().trim().min(2).max(200),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(100).optional().default(""),
    neighborhood: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().length(2),
  }),
  utm: z
    .object({
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      utmContent: z.string().optional(),
      utmTerm: z.string().optional(),
      fbclid: z.string().optional(),
      gclid: z.string().optional(),
      ttclid: z.string().optional(),
    })
    .partial()
    .optional(),
  eventId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`checkout:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante e tente novamente." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;

  // Reidratação idempotente: se este idempotencyKey já gerou um pedido
  // (duplo clique, retry de rede, refresh), devolve o pedido existente
  // em vez de criar um novo ou cobrar duas vezes.
  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) {
    return NextResponse.json(toResponse(existing));
  }

  let quote;
  try {
    quote = await priceCheckout({
      mainProductSlug: input.mainProductSlug,
      orderBumpProductIds: input.orderBumpProductIds,
    });
  } catch {
    return NextResponse.json({ error: "Produto indisponível" }, { status: 400 });
  }

  const bravopayProduct = await db.product.findFirst({ where: { type: "MAIN" } });
  const productId = bravopayProduct?.bravopayProductId ?? process.env.BRAVOPAY_PRODUCT_ID;
  if (!productId) {
    return NextResponse.json({ error: "Loja não configurada corretamente" }, { status: 500 });
  }

  const customer = await db.customer.upsert({
    where: { email: input.customer.email },
    update: { name: input.customer.name, phone: input.customer.phone, cpf: input.customer.cpf },
    create: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      cpf: input.customer.cpf,
    },
  });

  const displayId = generateDisplayId();

  let order;
  try {
    order = await db.order.create({
      data: {
        displayId,
        customerId: customer.id,
        idempotencyKey: input.idempotencyKey,
        status: "CREATED",
        shippingZip: input.shipping.zip,
        shippingAddress: input.shipping.address,
        shippingNumber: input.shipping.number,
        shippingComplement: input.shipping.complement || null,
        shippingNeighborhood: input.shipping.neighborhood,
        shippingCity: input.shipping.city,
        shippingState: input.shipping.state.toUpperCase(),
        subtotalCents: quote.subtotalCents,
        shippingCents: quote.shippingCents,
        discountCents: quote.discountCents,
        totalCents: quote.totalCents,
        utmSource: input.utm?.utmSource,
        utmMedium: input.utm?.utmMedium,
        utmCampaign: input.utm?.utmCampaign,
        utmContent: input.utm?.utmContent,
        utmTerm: input.utm?.utmTerm,
        fbclid: input.utm?.fbclid,
        gclid: input.utm?.gclid,
        ttclid: input.utm?.ttclid,
        metaEventId: input.eventId,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            kind: item.kind,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalCents: item.totalCents,
          })),
        },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // corrida entre duas requisições simultâneas com a mesma idempotencyKey
      const raced = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (raced) return NextResponse.json(toResponse(raced));
    }
    throw err;
  }

  await db.abandonedCart.create({
    data: {
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email,
      phone: customer.phone,
      orderId: order.id,
      cartValueCents: order.totalCents,
      status: "OPEN",
    },
  });

  try {
    const tx = await createPixTransaction({
      amountCents: order.totalCents,
      idempotencyKey: order.idempotencyKey,
      externalReference: order.displayId,
      description: "Bandeja de Descongelamento Rápido com Tampa",
      productId,
      customer: {
        name: customer.name,
        email: customer.email,
        cpf: customer.cpf,
        phone: customer.phone,
      },
      metadata: { orderId: order.id, displayId: order.displayId },
      utm: {
        source: input.utm?.utmSource,
        medium: input.utm?.utmMedium,
        campaign: input.utm?.utmCampaign,
        content: input.utm?.utmContent,
        term: input.utm?.utmTerm,
        fbclid: input.utm?.fbclid,
        gclid: input.utm?.gclid,
        ttclid: input.utm?.ttclid,
      },
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

    await db.trackingEvent.create({
      data: { orderId: order.id, eventName: "pix_generated" },
    });

    await sendMetaCapiEvent({
      eventName: "InitiateCheckout",
      eventId: `initiate_${order.id}`,
      eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/checkout`,
      userData: { email: customer.email, phone: customer.phone, firstName: customer.name.split(" ")[0] },
      customData: { value: order.totalCents / 100, currency: "BRL", content_ids: [order.id] },
    }).catch(() => {});
  } catch (err) {
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    await db.trackingEvent.create({
      data: { orderId: order.id, eventName: "purchase_failed", metadata: { reason: "bravopay_error" } },
    });
    const message = err instanceof BravopayError ? err.message : "Falha ao gerar o PIX";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json(toResponse(order));
}

function toResponse(order: {
  displayId: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  pixCopyPaste: string | null;
  pixExpiresAt: Date | null;
}) {
  return {
    orderId: order.displayId,
    status: order.status,
    totalCents: order.totalCents,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    pixCopyPaste: order.pixCopyPaste,
    pixExpiresAt: order.pixExpiresAt,
  };
}
