import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Truck, ShieldCheck, Mail, MapPin, Receipt, Clock3, type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import PurchaseTracker from "./PurchaseTracker";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Pedido confirmado", robots: { index: false, follow: false } };
}

export default async function OrderSuccessPage({ params }: { params: { orderId: string } }) {
  const order = await db.order.findUnique({
    where: { displayId: params.orderId },
    include: { items: { include: { product: true } }, customer: true },
  });

  if (!order) notFound();

  const isPaid = order.status === "PAID";
  const firstName = order.customer.name.trim().split(" ")[0];
  const paidAtLabel = order.paidAt
    ? new Date(order.paidAt).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })
    : null;

  // O pixel de Purchase do navegador só pode disparar UMA vez por pedido,
  // não a cada carregamento da página — senão qualquer pessoa que abra este
  // link (revisita, teste, print compartilhado) infla a contagem de compras
  // no Meta Ads. O "claim" abaixo é atômico: só a primeira requisição que
  // encontrar pixelPurchaseFiredAt vazio consegue marcá-lo e disparar o
  // pixel; todas as demais (inclusive concorrentes) não disparam nada.
  let shouldFirePixel = false;
  if (isPaid && !order.pixelPurchaseFiredAt) {
    const claim = await db.order.updateMany({
      where: { id: order.id, pixelPurchaseFiredAt: null },
      data: { pixelPurchaseFiredAt: new Date() },
    });
    shouldFirePixel = claim.count === 1;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-100 via-cream-50 to-cream-50 py-10 sm:py-16">
      <div className="container-app max-w-2xl">
        {shouldFirePixel && (
          <PurchaseTracker
            eventId={order.metaEventId ?? `purchase_${order.id}`}
            valueCents={order.totalCents}
            orderId={order.displayId}
          />
        )}

        {/* Hero de confirmação */}
        <div className="animate-fadeUp text-center">
          {isPaid ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={1.75} />
              </div>
              <p className="eyebrow mt-5">Pagamento aprovado</p>
              <h1 className="mt-2 text-3xl font-extrabold text-graphite-950 sm:text-4xl">
                Obrigado, {firstName}!
              </h1>
              <p className="mx-auto mt-3 max-w-md text-graphite-800/75">
                Seu pedido <span className="font-medium text-graphite-950">{order.displayId}</span> foi
                confirmado e já entra na fila de preparo para envio em até 5 dias úteis.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow mt-2">Pedido {order.displayId}</p>
              <h1 className="mt-2 text-2xl font-extrabold text-graphite-950">
                Estamos confirmando seu pagamento
              </h1>
              <p className="mx-auto mt-3 max-w-md text-graphite-800/75">
                Status atual: <span className="font-medium text-graphite-950">{order.status}</span>. Assim
                que o PIX for confirmado esta página é atualizada automaticamente.
              </p>
            </>
          )}
        </div>

        {/* Card principal do pedido */}
        <div className="mt-10 overflow-hidden rounded-xl2 bg-white shadow-soft ring-1 ring-graphite-900/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-900/10 bg-cream-50/60 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-graphite-800/50">
                Número do pedido
              </p>
              <p className="text-lg font-extrabold text-graphite-950">{order.displayId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-graphite-800/50">Status</p>
              <span
                className={`mt-0.5 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-600/10 text-amber-700"
                }`}
              >
                {isPaid ? "Pago" : order.status}
              </span>
            </div>
          </div>

          {/* Itens */}
          <div className="divide-y divide-graphite-900/5 px-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                  <Image
                    src={item.product?.images?.[0] ?? "/images/produto-hero.png"}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-graphite-950">{item.name}</p>
                  <p className="text-xs capitalize text-graphite-800/50">
                    {item.kind === "main" ? "Produto principal" : item.kind === "order_bump" ? "Item adicional" : "Upsell"}
                    {" · "}Qtd. {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-graphite-950">{formatBRL(item.totalCents)}</p>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="space-y-1.5 border-t border-graphite-900/10 px-6 py-5 text-sm">
            <div className="flex justify-between text-graphite-800/70">
              <span>Subtotal</span>
              <span>{formatBRL(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-graphite-800/70">
              <span>Frete</span>
              <span>{order.shippingCents > 0 ? formatBRL(order.shippingCents) : "Grátis"}</span>
            </div>
            <div className="flex justify-between border-t border-graphite-900/10 pt-2 text-base font-semibold text-graphite-950">
              <span>Total pago</span>
              <span>{formatBRL(order.totalCents)}</span>
            </div>
          </div>
        </div>

        {/* Cards de detalhes */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailCard icon={MapPin} title="Endereço de entrega">
            <p>
              {order.shippingAddress}, {order.shippingNumber}
              {order.shippingComplement ? ` — ${order.shippingComplement}` : ""}
            </p>
            <p>
              {order.shippingNeighborhood} · {order.shippingCity}/{order.shippingState}
            </p>
            <p>CEP {order.shippingZip}</p>
          </DetailCard>

          <DetailCard icon={Receipt} title="Pagamento">
            <p>PIX{paidAtLabel ? ` · confirmado em ${paidAtLabel}` : ""}</p>
            {order.bravopayTransactionId && (
              <p className="truncate text-xs text-graphite-800/50">ID: {order.bravopayTransactionId}</p>
            )}
          </DetailCard>

          <DetailCard icon={Mail} title="Contato">
            <p>{order.customer.email}</p>
            <p>{order.customer.phone}</p>
          </DetailCard>

          <DetailCard icon={Truck} title="Envio estimado">
            <p>Em até 5 dias úteis após a confirmação do pagamento.</p>
          </DetailCard>
        </div>

        {/* Rodapé de confiança */}
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-sm text-graphite-800/60">
            <ShieldCheck className="h-4 w-4 text-amber-700" />
            Garantia total ou seu dinheiro de volta
          </div>
          <div className="flex items-center gap-2 text-sm text-graphite-800/60">
            <Clock3 className="h-4 w-4 text-amber-700" />
            Você também pode acompanhar o status deste pedido voltando a esta mesma página
          </div>
          <Link href="/" className="btn-secondary mt-2">
            Voltar para a loja
          </Link>
        </div>
      </div>
    </main>
  );
}

function DetailCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card ring-1 ring-graphite-900/5">
      <div className="flex items-center gap-2 text-graphite-950">
        <Icon className="h-4 w-4 text-amber-700" strokeWidth={1.75} />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="mt-2 space-y-0.5 text-sm text-graphite-800/75">{children}</div>
    </div>
  );
}
