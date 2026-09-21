import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { TRACKING_COOKIE } from "@/lib/tracking";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  eventName: z.enum([
    "page_view",
    "view_content",
    "add_to_cart",
    "initiate_checkout",
    "lead",
    "checkout_abandoned",
  ]),
  eventId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const PIXEL_EVENT_MAP: Record<string, "ViewContent" | "AddToCart" | "InitiateCheckout" | "Lead" | null> = {
  view_content: "ViewContent",
  add_to_cart: "AddToCart",
  initiate_checkout: "InitiateCheckout",
  lead: "Lead",
  page_view: null,
  checkout_abandoned: null,
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`track:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { eventName, eventId, metadata } = parsed.data;

  let attribution: Record<string, string> = {};
  try {
    const raw = req.cookies.get(TRACKING_COOKIE)?.value;
    if (raw) attribution = JSON.parse(decodeURIComponent(raw));
  } catch {
    attribution = {};
  }

  await db.trackingEvent.create({
    data: {
      eventName,
      eventId: eventId ?? null,
      utmSource: attribution.utmSource ?? null,
      utmMedium: attribution.utmMedium ?? null,
      utmCampaign: attribution.utmCampaign ?? null,
      utmContent: attribution.utmContent ?? null,
      utmTerm: attribution.utmTerm ?? null,
      fbclid: attribution.fbclid ?? null,
      gclid: attribution.gclid ?? null,
      path: req.headers.get("referer"),
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  const pixelEvent = PIXEL_EVENT_MAP[eventName];
  if (pixelEvent) {
    const fbc = req.cookies.get("_fbc")?.value;
    const fbp = req.cookies.get("_fbp")?.value;
    await sendMetaCapiEvent({
      eventName: pixelEvent,
      eventId: eventId ?? crypto.randomUUID(),
      eventSourceUrl: req.headers.get("referer") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "",
      userData: {
        ip,
        userAgent: req.headers.get("user-agent") ?? undefined,
        fbc,
        fbp,
      },
      customData: metadata,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
