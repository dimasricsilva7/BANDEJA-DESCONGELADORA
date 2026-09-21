import Link from "next/link";
import { formatBRL } from "@/lib/pricing";

export default function StickyCta({ priceCents }: { priceCents: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite-900/10 bg-cream-50/95 p-3 backdrop-blur sm:hidden">
      <Link href="/checkout" className="btn-primary w-full">
        COMPRAR AGORA — {formatBRL(priceCents)}
      </Link>
    </div>
  );
}
