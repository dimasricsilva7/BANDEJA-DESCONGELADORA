import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().positive().optional(),
  compareAtCents: z.number().int().positive().optional().nullable(),
  images: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  orderBumpEnabled: z.boolean().optional(),
  orderBumpPriceCents: z.number().int().positive().optional().nullable(),
  orderBumpHeadline: z.string().optional().nullable(),
  upsellEnabled: z.boolean().optional(),
  upsellPriceCents: z.number().int().positive().optional().nullable(),
  upsellHeadline: z.string().optional().nullable(),
  bravopayProductId: z.string().optional().nullable(),
  shortPitch: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 422 });

  const product = await db.product.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  await db.product.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
