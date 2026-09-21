import { Sparkles, LayoutGrid, Hand, Droplets, Ruler, ShieldCheck, CalendarClock } from "lucide-react";

const benefits = [
  { icon: Sparkles, title: "Mais praticidade", desc: "Menos espera, mais tempo para o que importa." },
  { icon: LayoutGrid, title: "Mais organização", desc: "Um lugar certo para descongelar, sem bagunça na pia." },
  { icon: Hand, title: "Fácil de usar", desc: "Sem manual complicado — coloque, tampe e prepare." },
  { icon: Droplets, title: "Fácil de limpar", desc: "Superfície simples de higienizar após o uso." },
  { icon: Ruler, title: "Design compacto", desc: "Cabe bem na sua cozinha, sem ocupar espaço extra." },
  { icon: ShieldCheck, title: "Tampa protetora", desc: "Mantém o alimento protegido durante o processo." },
  { icon: CalendarClock, title: "Ideal para a rotina", desc: "Pensada para o dia a dia de quem cozinha em casa." },
];

export default function Benefits() {
  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Benefícios</p>
          <h2 className="font-serif text-2xl text-graphite-950 sm:text-3xl">
            Feita para simplificar sua rotina na cozinha.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl2 bg-white p-6 shadow-card">
              <Icon className="h-6 w-6 text-amber-700" strokeWidth={1.75} />
              <h3 className="mt-4 font-serif text-base text-graphite-950">{title}</h3>
              <p className="mt-1.5 text-sm text-graphite-800/75">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
