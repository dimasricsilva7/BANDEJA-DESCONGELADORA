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

type PixelCredential = { pixelId: string; token: string };

/**
 * Suporta múltiplas contas de anúncio simultaneamente. Cada pixel exige seu
 * próprio token de Conversions API (o token é emitido por pixel/BM, não é
 * compartilhável entre contas). Configure a segunda conta com
 * NEXT_PUBLIC_META_PIXEL_ID_2 / META_CONVERSIONS_API_TOKEN_2, a terceira com
 * _3, e assim por diante — sem precisar alterar código.
 */
function getConfiguredPixels(): PixelCredential[] {
  const pairs: PixelCredential[] = [];

  const primaryPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const primaryToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (primaryPixel && primaryToken) pairs.push({ pixelId: primaryPixel, token: primaryToken });

  for (let i = 2; i <= 5; i++) {
    const pixelId = process.env[`NEXT_PUBLIC_META_PIXEL_ID_${i}`];
    const token = process.env[`META_CONVERSIONS_API_TOKEN_${i}`];
    if (pixelId && token) pairs.push({ pixelId, token });
  }

  return pairs;
}

export async function sendMetaCapiEvent(input: CapiEventInput): Promise<void> {
  const pixels = getConfiguredPixels();
  if (pixels.length === 0) return; // tracking is best-effort, never blocks the purchase flow

  const user_data: Record<string, string> = {};
  if (input.userData.email) user_data.em = sha256(input.userData.email);
  if (input.userData.phone) user_data.ph = sha256Digits(input.userData.phone);
  if (input.userData.firstName) user_data.fn = sha256(input.userData.firstName);
  if (input.userData.ip) user_data.client_ip_address = input.userData.ip;
  if (input.userData.userAgent) user_data.client_user_agent = input.userData.userAgent;
  if (input.userData.fbc) user_data.fbc = input.userData.fbc;
  if (input.userData.fbp) user_data.fbp = input.userData.fbp;

  // META_TEST_EVENT_CODE (opcional): quando definido, os eventos passam a
  // aparecer na aba "Eventos de teste" do Gerenciador de Eventos. Sem essa
  // variável (comportamento padrão em produção), os eventos de servidor
  // continuam sendo enviados normalmente, só não ficam visíveis nessa aba.
  const testEventCode = process.env.META_TEST_EVENT_CODE;

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
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  // Cada pixel recebe a chamada de forma independente (endpoint e token
  // próprios). O mesmo event_id é enviado para todos — isso é seguro: a
  // deduplicação do Meta é por conta/pixel, então usar o mesmo ID em contas
  // diferentes não causa contagem duplicada em nenhuma delas.
  await Promise.all(
    pixels.map(async ({ pixelId, token }) => {
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
          console.error(`[meta-capi] falha ao enviar evento (pixel ${pixelId})`, input.eventName, res.status, text);
        }
      } catch (err) {
        console.error(`[meta-capi] erro de rede (pixel ${pixelId})`, err);
      }
    })
  );
}
