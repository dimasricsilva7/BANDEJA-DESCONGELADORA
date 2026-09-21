import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyWebhookSignature, type BravopayTransaction } from "@/lib/bravopay";
import { applyTransactionSnapshot } from "@/lib/order-status";

export const dynamic = "force-dynamic";

type WebhookPayload = {
  id: string;
  type: string;
  created: number;
  data: BravopayTransaction;
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("bravopay-signature") ?? req.headers.get("x-bravopay-signature");
  const secret = process.env.BRAVOPAY_WEBHOOK_SECRET;

  if (!secret || !verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Anti-replay + deduplicação: cada evento (`event.id`) só é processado uma vez.
  try {
    await db.webhookEvent.create({
      data: {
        eventId: payload.id,
        eventType: payload.type,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }

  // Responde rápido; o trabalho pesado (side effects) roda antes do retorno
  // mas é mínimo o suficiente para não violar o timeout do provedor.
  try {
    const tx = payload.data;
    const externalReference = tx.external_reference;
    if (externalReference) {
      const order = await db.order.findUnique({ where: { displayId: externalReference } });
      if (order) {
        await applyTransactionSnapshot(order.id, tx);
      }
    }
    await db.webhookEvent.update({ where: { eventId: payload.id }, data: { processedAt: new Date() } });
  } catch (err) {
    console.error("[webhook] erro ao processar evento", payload.type, err);
    // Ainda retornamos 200: o evento já foi persistido e pode ser reprocessado manualmente.
  }

  return NextResponse.json({ ok: true });
}
