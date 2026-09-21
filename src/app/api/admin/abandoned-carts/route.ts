import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const ABANDON_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutos sem pagamento

export async function GET() {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  // Auto-promove carrinhos OPEN antigos, ainda não pagos, para ABANDONED.
  await db.abandonedCart.updateMany({
    where: {
      status: "OPEN",
      createdAt: { lt: new Date(Date.now() - ABANDON_THRESHOLD_MS) },
    },
    data: { status: "ABANDONED" },
  });

  const carts = await db.abandonedCart.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(carts);
}
