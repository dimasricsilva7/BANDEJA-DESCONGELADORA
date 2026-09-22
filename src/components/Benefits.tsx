import { Gauge, Timer, BatteryCharging, Layers, Droplets, Ruler } from "lucide-react";

const benefits = [
  {
    icon: Gauge,
    title: "Painel digital fácil de usar",
    desc: "Display simples para acompanhar e ajustar o tempo de descongelamento.",
  },
  {
    icon: Timer,
    title: "Tempo ajustável",
    desc: "De 10 a 40 minutos, conforme o tipo e a espessura do alimento.",
  },
  {
    icon: BatteryCharging,
    title: "Recarregável via USB-C",
    desc: "Bateria de 2000 mAh, com autonomia de até 120 minutos por carga.",
  },
  {
    icon: Layers,
    title: "Grande capacidade",
    desc: "4,2 litros de espaço, dá para descongelar mais de um alimento por vez.",
  },
  {
    icon: Droplets,
    title: "Fácil de limpar",
    desc: "Bandeja e tampa removíveis, pensadas para facilitar a higienização.",
  },
  {
    icon: Ruler,
    title: "Design compacto",
    desc: "Cabe bem na sua cozinha, sem ocupar espaço extra na bancada.",
  },
];

export default function Benefits() {
  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Benefícios</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            Feita para simplificar sua rotina na cozinha.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl2 bg-white p-6 shadow-card">
              <Icon className="h-6 w-6 text-sage-600" strokeWidth={1.75} />
              <h3 className="mt-4 text-base font-bold text-graphite-950">{title}</h3>
              <p className="mt-1.5 text-sm text-graphite-700/85">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
