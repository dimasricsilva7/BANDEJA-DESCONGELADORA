"use client";

import Link from "next/link";
import { trackPixel } from "@/components/MetaPixel";

export default function AddToCartButton({
  href,
  productId,
  productName,
  priceCents,
  className,
  children,
}: {
  href: string;
  productId: string;
  productName: string;
  priceCents: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackPixel("AddToCart", {
          content_ids: [productId],
          content_name: productName,
          value: priceCents / 100,
          currency: "BRL",
        });
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventName: "add_to_cart", metadata: { productId, productName } }),
          keepalive: true,
        }).catch(() => {});
      }}
    >
      {children}
    </Link>
  );
}
