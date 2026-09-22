"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Suporta múltiplas contas de anúncio ao mesmo tempo. A principal usa
// NEXT_PUBLIC_META_PIXEL_ID; contas adicionais usam _2, _3... (até 5).
// fbq('track', ...) sem um pixel específico dispara para TODOS os pixels
// inicializados na página — nenhuma outra mudança é necessária para os
// eventos já existentes (PageView, ViewContent, AddToCart, etc.).
const PIXEL_IDS = [1, 2, 3, 4, 5]
  .map((i) => process.env[`NEXT_PUBLIC_META_PIXEL_ID${i === 1 ? "" : `_${i}`}`])
  .filter((id): id is string => Boolean(id));

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPixel(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}

export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (PIXEL_IDS.length > 0) trackPixel("PageView");
  }, [pathname]);

  if (PIXEL_IDS.length === 0) return null;

  const initCalls = PIXEL_IDS.map((id) => `fbq('init', '${id}');`).join("\n");

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          ${initCalls}
        `}
      </Script>
      <noscript>
        {PIXEL_IDS.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
            alt=""
          />
        ))}
      </noscript>
    </>
  );
}
