import { db } from "@/lib/db";
import { Prisma, type Order } from "@prisma/client";
import { findTransactionByExternalReference, type BravopayTransaction } from "@/lib/bravopay";
import { sendMetaCapiEvent } from "@/lib/meta-capi";

const STATUS_MAP: Record<BravopayTransaction["status"], Order["status"]> = {
  PENDING: "PENDING",
  PAID: "PAID",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED",
  CHARGEBACK: "CHARGEBACK",
  FAILED: "FAILED",
};

/**
 * Applies a BravoPay transaction snapshot onto our local order. This is the
 * single choke point that can mark an order PAID — called from the webhook
 * handler (push) and from the polling / manual reverify paths (pull). Never
 * call `db.order.update({ status: "PAID" })` anywhere else in the codebase.
 */
export async function applyTransactionSnapshot(orderId: string, tx: BravopayTransaction) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (!order) return null;

  const nextStatus = STATUS_MAP[tx.status] ?? order.status;
  const wasAlreadyPaid = order.status === "PAID";

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: nextStatus,
      bravopayTransactionId: tx.id,
      lastCheckedAt: new Date(),
      paidAt: nextStatus === "PAID" && !order.paidAt ? new Date() : order.paidAt,
    },
  });

  if (nextStatus === "PAID") {
    await db.payment.upsert({
      where: { bravopayTransactionId: tx.id },
      update: { status: tx.status, amountCents: tx.amount_cents, netCents: tx.net_cents, feeCents: tx.fee_cents },
      create: {
        orderId: order.id,
        bravopayTransactionId: tx.id,
        status: tx.status,
        amountCents: tx.amount_cents,
        netCents: tx.net_cents ?? null,
        feeCents: tx.fee_cents ?? null,
        method: tx.method,
        rawPayload: tx as unknown as Prisma.InputJsonValue,
      },
    });

    await db.abandonedCart.updateMany({
      where: { orderId: order.id },
      data: { status: "RECOVERED", recoveredAt: new Date() },
    });

    await db.trackingEvent.create({
      data: { orderId: order.id, eventName: "purchase", metadata: { transactionId: tx.id } },
    });

    if (!wasAlreadyPaid) {
      await sendMetaCapiEvent({
        eventName: "Purchase",
        eventId: order.metaEventId ?? `purchase_${order.id}`,
        eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/pedido/sucesso/${order.displayId}`,
        userData: {
          email: order.customer.email,
          phone: order.customer.phone,
          firstName: order.customer.name.split(" ")[0],
        },
        customData: {
          value: order.totalCents / 100,
          currency: "BRL",
          content_ids: [order.id],
          order_id: order.displayId,
        },
      }).catch(() => {});
    }
  } else if (nextStatus === "FAILED" || nextStatus === "EXPIRED") {
    await db.trackingEvent.create({
      data: { orderId: order.id, eventName: "purchase_failed", metadata: { status: nextStatus } },
    });
  }

  return updated;
}

/**
 * Pull-based sync used by frontend polling and the admin "reverify" button.
 * Throttled by `minIntervalMs` so a chatty client can't burn BravoPay's rate
 * limit (60 req/min per key, shared across the whole store).
 */
export async function syncOrderFromBravopay(order: Order, minIntervalMs = 4000) {
  const terminal: Order["status"][] = ["PAID", "REFUNDED", "CHARGEBACK"];
  if (terminal.includes(order.status)) return order;

  if (order.lastCheckedAt && Date.now() - order.lastCheckedAt.getTime() < minIntervalMs) {
    return order;
  }

  const tx = await findTransactionByExternalReference(order.displayId);
  if (!tx) {
    await db.order.update({ where: { id: order.id }, data: { lastCheckedAt: new Date() } });
    return order;
  }

  return applyTransactionSnapshot(order.id, tx);
}
