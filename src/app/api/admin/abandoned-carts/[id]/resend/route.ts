import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { sendAbandonedCartEmail } from "@/lib/email";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const cart = await db.abandonedCart.findUnique({ where: { id: params.id } });
  if (!cart) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const result = await sendAbandonedCartEmail({ to: cart.email, name: cart.customerName, orderId: cart.orderId });

  if (result.sent) {
    await db.abandonedCart.update({ where: { id: cart.id }, data: { emailSentAt: new Date() } });
  }

  return NextResponse.json(result);
}
