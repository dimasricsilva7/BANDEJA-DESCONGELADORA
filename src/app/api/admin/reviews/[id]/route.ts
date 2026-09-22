import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const updateSchema = z.object({
  customerName: z.string().min(2).optional(),
  city: z.string().optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional(),
  testimonial: z.string().min(3).optional(),
  photoUrl: z.string().url().optional().nullable(),
  productId: z.string().optional().nullable(),
  verifiedPurchase: z.boolean().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  reviewDate: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 422 });
  }

  const { reviewDate, ...rest } = parsed.data;
  const review = await db.review.update({
    where: { id: params.id },
    data: { ...rest, ...(reviewDate ? { reviewDate: new Date(reviewDate) } : {}) },
  });
  return NextResponse.json(review);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  await db.review.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
