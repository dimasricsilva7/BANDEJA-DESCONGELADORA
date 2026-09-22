import { Lock, Truck, Wallet, ShieldCheck, type LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Lock,
    title: "Compra segura",
    desc: "Seus dados são tratados com segurança durante todo o processo.",
  },
  {
    icon: Truck,
    title: "Envio para todo o Brasil",
    desc: "Receba seu pedido no endereço informado, com frete grátis.",
  },
  {
    icon: Wallet,
    title: "Pagamento simples via PIX",
    desc: "Aprovação rápida, sem burocracia e sem cartão.",
  },
  {
    icon: ShieldCheck,
    title: "Garantia",
    desc: "Compra protegida conforme nossa política de garantia.",
  },
];

export function TrustSection() {
  return (
    <section className="section bg-white">
      <div className="container-app grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl2 bg-cream-50 p-5 ring-1 ring-graphite-950/[0.04]">
            <Icon className="h-5 w-5 text-sage-600" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-bold text-graphite-950">{title}</p>
            <p className="mt-1 text-sm text-graphite-700/85">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TrustBar({
  className = "",
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "full";
}) {
  if (variant === "compact") {
    return (
      <ul className={`flex flex-wrap gap-x-5 gap-y-2 ${className}`}>
        {ITEMS.map(({ icon: Icon, title }) => (
          <li key={title} className="flex items-center gap-1.5 text-sm text-graphite-700">
            <Icon className="h-4 w-4 shrink-0 text-sage-600" strokeWidth={2} />
            {title}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {ITEMS.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="rounded-xl2 bg-white p-5 shadow-card">
          <Icon className="h-5 w-5 text-sage-600" strokeWidth={1.75} />
          <p className="mt-3 text-sm font-bold text-graphite-950">{title}</p>
          <p className="mt-1 text-sm text-graphite-700/85">{desc}</p>
        </div>
      ))}
    </div>
  );
}
