import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ params }: { params: { orderId: string } }) {
  const order = await db.order.findUnique({
    where: { displayId: params.orderId },
    include: { items: true, customer: true },
  });

  if (!order) notFound();

  const isPaid = order.status === "PAID";

  return (
    <main className="min-h-screen bg-cream-50 py-14">
      <div className="container-app max-w-lg">
        <div className="rounded-xl2 bg-white p-8 text-center shadow-soft">
          {isPaid ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h1 className="mt-4 font-serif text-2xl text-graphite-950">Pagamento confirmado!</h1>
              <p className="mt-2 text-graphite-800/75">
                Seu pedido será preparado para envio em até 5 dias úteis.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl text-graphite-950">Pedido {order.displayId}</h1>
              <p className="mt-2 text-graphite-800/75">Status atual: {order.status}</p>
            </>
          )}

          <div className="mt-6 rounded-xl border border-graphite-900/10 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite-800/50">Pedido</p>
            <p className="font-medium text-graphite-950">{order.displayId}</p>

            <ul className="mt-4 space-y-1.5">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm text-graphite-800/85">
                  <span>{item.name}</span>
                  <span>{formatBRL(item.totalCents)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex justify-between border-t border-graphite-900/10 pt-3 text-base font-semibold text-graphite-950">
              <span>Total</span>
              <span>{formatBRL(order.totalCents)}</span>
            </div>
          </div>

          <div className="mt-6 text-left text-sm text-graphite-800/75">
            <p className="font-medium text-graphite-950">Endereço de entrega</p>
            <p>
              {order.shippingAddress}, {order.shippingNumber}
              {order.shippingComplement ? ` - ${order.shippingComplement}` : ""}
            </p>
            <p>
              {order.shippingNeighborhood} — {order.shippingCity}/{order.shippingState}
            </p>
            <p>CEP {order.shippingZip}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
