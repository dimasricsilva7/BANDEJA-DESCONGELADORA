"use client";

import { useEffect } from "react";
import { attributionFromSearchParams, mergeAttribution, TRACKING_COOKIE, type Attribution } from "@/lib/tracking";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function TrackingCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = attributionFromSearchParams(params);

    let existing: Attribution = {};
    try {
      const raw = readCookie(TRACKING_COOKIE) ?? localStorage.getItem(TRACKING_COOKIE);
      if (raw) existing = JSON.parse(raw);
    } catch {
      existing = {};
    }

    const merged = mergeAttribution(existing, fromUrl);
    const serialized = JSON.stringify(merged);

    writeCookie(TRACKING_COOKIE, serialized);
    try {
      localStorage.setItem(TRACKING_COOKIE, serialized);
    } catch {
      // localStorage indisponível (modo privado) — cookie já cobre o caso
    }

    // fbclid -> fbc (formato exigido pela Meta) quando o cookie _fbc ainda não existe
    if (fromUrl.fbclid && !readCookie("_fbc")) {
      writeCookie("_fbc", `fb.1.${Date.now()}.${fromUrl.fbclid}`);
    }
  }, []);

  return null;
}

export function readAttribution(): Attribution {
  try {
    const raw = readCookie(TRACKING_COOKIE) ?? localStorage.getItem(TRACKING_COOKIE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function readClientCookie(name: string): string | null {
  return readCookie(name);
}
