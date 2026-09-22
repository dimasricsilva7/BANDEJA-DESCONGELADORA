"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

const DURATION_MS = 15 * 60 * 1000;
const STORAGE_KEY = "checkout_offer_start";

export default function OfferTimer() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let start: number;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      start = stored ? Number(stored) : Date.now();
      if (!stored) sessionStorage.setItem(STORAGE_KEY, String(start));
    } catch {
      start = Date.now();
    }

    const tick = () => {
      const left = DURATION_MS - (Date.now() - start);
      setRemaining(Math.max(0, left));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (remaining === null || remaining <= 0) return null;

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-3 text-center text-sm font-bold text-white">
      <Flame className="h-4 w-4 shrink-0" />
      <span>
        Oferta por tempo limitado — termina em {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
