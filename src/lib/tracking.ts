export const TRACKING_COOKIE = "attribution";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
};

const PARAM_MAP: Record<keyof Attribution, string> = {
  utmSource: "utm_source",
  utmMedium: "utm_medium",
  utmCampaign: "utm_campaign",
  utmContent: "utm_content",
  utmTerm: "utm_term",
  fbclid: "fbclid",
  gclid: "gclid",
  ttclid: "ttclid",
};

export function attributionFromSearchParams(params: URLSearchParams): Attribution {
  const attribution: Attribution = {};
  (Object.keys(PARAM_MAP) as (keyof Attribution)[]).forEach((key) => {
    const value = params.get(PARAM_MAP[key]);
    if (value) attribution[key] = value;
  });
  return attribution;
}

export function mergeAttribution(a: Attribution, b: Attribution): Attribution {
  // Keep first-touch values; only fill in gaps from `b`.
  return {
    utmSource: a.utmSource ?? b.utmSource,
    utmMedium: a.utmMedium ?? b.utmMedium,
    utmCampaign: a.utmCampaign ?? b.utmCampaign,
    utmContent: a.utmContent ?? b.utmContent,
    utmTerm: a.utmTerm ?? b.utmTerm,
    fbclid: a.fbclid ?? b.fbclid,
    gclid: a.gclid ?? b.gclid,
    ttclid: a.ttclid ?? b.ttclid,
  };
}
