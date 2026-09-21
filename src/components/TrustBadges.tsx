import { Truck, ShieldCheck, QrCode, Clock } from "lucide-react";

const badges = [
  { icon: Truck, label: "Frete grátis" },
  { icon: QrCode, label: "Pagamento via PIX" },
  { icon: Clock, label: "Envio em até 5 dias úteis" },
  { icon: ShieldCheck, label: "Garantia total ou seu dinheiro de volta" },
];

export default function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-3 ${className}`}>
      {badges.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-sm text-graphite-800/80">
          <Icon className="h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} />
          {label}
        </li>
      ))}
    </ul>
  );
}
