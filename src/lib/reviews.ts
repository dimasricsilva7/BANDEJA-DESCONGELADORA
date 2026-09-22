import { db } from "@/lib/db";

export async function getPublishedReviewStats() {
  const published = await db.review.findMany({
    where: { published: true },
    select: { rating: true },
  });
  const count = published.length;
  const avg = count > 0 ? published.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, avg: Math.round(avg * 10) / 10 };
}

export async function getPublishedReviews(limit = 12) {
  return db.review.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { reviewDate: "desc" }],
    take: limit,
    include: { product: { select: { name: true } } },
  });
}

export async function getPublishedReviewPhotos(limit = 12) {
  return db.review.findMany({
    where: { published: true, photoUrl: { not: null } },
    orderBy: [{ featured: "desc" }, { reviewDate: "desc" }],
    take: limit,
    select: { id: true, photoUrl: true, customerName: true, city: true, state: true, verifiedPurchase: true, product: { select: { name: true } } },
  });
}
