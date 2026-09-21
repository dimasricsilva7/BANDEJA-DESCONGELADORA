import { formatBRL } from "@/lib/pricing";

export default function Price({
  priceCents,
  compareAtCents,
  size = "md",
}: {
  priceCents: number;
  compareAtCents?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-4xl sm:text-5xl",
  } as const;

  return (
    <div className="flex flex-wrap items-baseline gap-3">
      {compareAtCents && compareAtCents > priceCents && (
        <span className="text-graphite-900/40 line-through text-base">{formatBRL(compareAtCents)}</span>
      )}
      <span className={`font-serif font-semibold text-graphite-900 ${sizes[size]}`}>
        {formatBRL(priceCents)}
      </span>
    </div>
  );
}
