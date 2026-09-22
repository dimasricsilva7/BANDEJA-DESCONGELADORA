import Image from "next/image";
import { Star, BadgeCheck } from "lucide-react";

export type ReviewItem = {
  id: string;
  customerName: string;
  city: string | null;
  state: string | null;
  rating: number;
  testimonial: string;
  photoUrl: string | null;
  verifiedPurchase: boolean;
  reviewDate: Date;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Reviews({
  reviews,
  stats,
}: {
  reviews: ReviewItem[];
  stats: { count: number; avg: number };
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="section bg-white">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Avaliações reais</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            O que nossos clientes estão dizendo
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="flex text-clay-600">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(stats.avg) ? "fill-current" : "fill-none"}`} strokeWidth={1.5} />
              ))}
            </span>
            <span className="text-sm font-bold text-graphite-950">{stats.avg.toFixed(1).replace(".", ",")}/5</span>
            <span className="text-sm text-graphite-700/70">
              · {stats.count} {stats.count === 1 ? "avaliação" : "avaliações"}
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="flex flex-col rounded-xl2 bg-cream-50 p-5 ring-1 ring-graphite-950/[0.04]">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage-100 text-sm font-bold text-sage-700">
                  {review.photoUrl ? (
                    <Image src={review.photoUrl} alt={review.customerName} fill className="object-cover" />
                  ) : (
                    initials(review.customerName)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-graphite-950">{review.customerName}</p>
                  {(review.city || review.state) && (
                    <p className="text-xs text-graphite-700/60">
                      {review.city}
                      {review.city && review.state ? "/" : ""}
                      {review.state}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-clay-600">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>

              <p className="mt-2 flex-1 text-sm text-graphite-700/90">&ldquo;{review.testimonial}&rdquo;</p>

              <div className="mt-4 flex items-center justify-between text-xs text-graphite-700/50">
                {review.verifiedPurchase ? (
                  <span className="flex items-center gap-1 font-medium text-sage-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> Compra verificada
                  </span>
                ) : (
                  <span />
                )}
                <time dateTime={review.reviewDate.toISOString()}>
                  {review.reviewDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                </time>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
