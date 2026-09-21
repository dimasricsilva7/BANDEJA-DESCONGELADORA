"use client";

import { useEffect } from "react";
import { trackPixel } from "@/components/MetaPixel";

export default function ViewContentTracker({
  productId,
  productName,
  priceCents,
}: {
  productId: string;
  productName: string;
  priceCents: number;
}) {
  useEffect(() => {
    trackPixel("ViewContent", {
      content_ids: [productId],
      content_name: productName,
      value: priceCents / 100,
      currency: "BRL",
    });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "view_content", metadata: { productId, productName } }),
      keepalive: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
