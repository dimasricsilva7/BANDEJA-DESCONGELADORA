import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { findTransactionByExternalReference } from "@/lib/bravopay";
import { applyTransactionSnapshot } from "@/lib/order-status";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const tx = await findTransactionByExternalReference(order.displayId);
  await db.order.update({ where: { id: order.id }, data: { lastCheckedAt: new Date() } });

  if (!tx) {
    return NextResponse.json({ error: "Transação não encontrada na BravoPay", status: order.status }, { status: 404 });
  }

  const updated = await applyTransactionSnapshot(order.id, tx);
  return NextResponse.json({ ok: true, status: updated?.status, bravopayStatus: tx.status });
}
