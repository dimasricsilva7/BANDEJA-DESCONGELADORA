"use client";

import { useEffect } from "react";
import { trackPixel } from "@/components/MetaPixel";

export default function PurchaseTracker({
  eventId,
  valueCents,
  orderId,
}: {
  eventId: string;
  valueCents: number;
  orderId: string;
}) {
  useEffect(() => {
    trackPixel(
      "Purchase",
      { value: valueCents / 100, currency: "BRL", content_ids: [orderId] },
      eventId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
