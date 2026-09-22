import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET() {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  });
  return NextResponse.json(reviews);
}

const createSchema = z.object({
  customerName: z.string().min(2),
  city: z.string().optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  testimonial: z.string().min(3),
  photoUrl: z.string().url().optional().nullable(),
  productId: z.string().optional().nullable(),
  verifiedPurchase: z.boolean().default(false),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  reviewDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 422 });
  }

  const { reviewDate, ...rest } = parsed.data;
  const review = await db.review.create({
    data: { ...rest, reviewDate: reviewDate ? new Date(reviewDate) : new Date() },
  });
  return NextResponse.json(review, { status: 201 });
}
