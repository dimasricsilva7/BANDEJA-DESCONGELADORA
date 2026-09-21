import { Resend } from "resend";

export async function sendAbandonedCartEmail(input: { to: string; name: string; orderId?: string | null }) {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Loja <pedidos@example.com>";
  if (!apiKey) {
    console.warn("[email] EMAIL_PROVIDER_API_KEY não configurada — e-mail não enviado");
    return { sent: false, reason: "missing_api_key" as const };
  }

  const resend = new Resend(apiKey);
  const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/checkout`;

  await resend.emails.send({
    from,
    to: input.to,
    subject: "Você esqueceu algo no carrinho — finalize seu pedido",
    html: `
      <p>Olá, ${input.name}!</p>
      <p>Notamos que você não concluiu o pagamento do seu pedido${input.orderId ? ` <strong>${input.orderId}</strong>` : ""}.</p>
      <p>Sua bandeja de descongelamento rápido ainda está reservada. Finalize agora com frete grátis e pagamento via PIX:</p>
      <p><a href="${checkoutUrl}">Finalizar minha compra</a></p>
    `,
  });

  return { sent: true as const };
}
