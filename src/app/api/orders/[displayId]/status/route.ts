import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncOrderFromBravopay } from "@/lib/order-status";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest, { params }: { params: { displayId: string } }) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`status:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const order = await db.order.findUnique({ where: { displayId: params.displayId } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const synced = (await syncOrderFromBravopay(order)) ?? order;

  return NextResponse.json({
    orderId: synced.displayId,
    status: synced.status,
    totalCents: synced.totalCents,
    pixExpiresAt: synced.pixExpiresAt,
  });
}
