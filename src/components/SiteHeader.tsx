import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function SiteHeader({ storeName }: { storeName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-graphite-900/[0.06] bg-cream-50/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-600 text-cream-50">
            <ChefHat className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-base font-extrabold tracking-tight text-graphite-950">{storeName}</span>
        </Link>
        <Link href="/checkout" className="btn-primary px-5 py-2.5 text-xs">
          Comprar
        </Link>
      </div>
    </header>
  );
}
