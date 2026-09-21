import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET() {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const products = await db.product.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(products);
}

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  compareAtCents: z.number().int().positive().optional().nullable(),
  images: z.array(z.string()).default([]),
  type: z.enum(["MAIN", "COMPLEMENTARY", "ORDER_BUMP", "UPSELL"]),
  bravopayProductId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 422 });

  const product = await db.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
