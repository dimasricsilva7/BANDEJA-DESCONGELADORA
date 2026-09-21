import { sha256, sha256Digits } from "@/lib/hash";

const GRAPH_VERSION = "v20.0";

type UserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  ip?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
};

type CapiEventInput = {
  eventName: "PageView" | "ViewContent" | "InitiateCheckout" | "AddToCart" | "Purchase" | "Lead";
  eventId: string;
  eventSourceUrl: string;
  userData: UserData;
  customData?: Record<string, unknown>;
  actionSource?: "website";
};

export async function sendMetaCapiEvent(input: CapiEventInput): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CONVERSIONS_API_TOKEN;
  if (!pixelId || !token) return; // tracking is best-effort, never blocks the purchase flow

  const user_data: Record<string, string> = {};
  if (input.userData.email) user_data.em = sha256(input.userData.email);
  if (input.userData.phone) user_data.ph = sha256Digits(input.userData.phone);
  if (input.userData.firstName) user_data.fn = sha256(input.userData.firstName);
  if (input.userData.ip) user_data.client_ip_address = input.userData.ip;
  if (input.userData.userAgent) user_data.client_user_agent = input.userData.userAgent;
  if (input.userData.fbc) user_data.fbc = input.userData.fbc;
  if (input.userData.fbp) user_data.fbp = input.userData.fbp;

  const body = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: input.actionSource ?? "website",
        event_source_url: input.eventSourceUrl,
        user_data,
        custom_data: input.customData ?? {},
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[meta-capi] falha ao enviar evento", input.eventName, res.status, text);
    }
  } catch (err) {
    console.error("[meta-capi] erro de rede", err);
  }
}
