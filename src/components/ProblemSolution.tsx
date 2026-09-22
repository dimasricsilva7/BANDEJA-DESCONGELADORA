import Image from "next/image";

export function ProblemSection() {
  return (
    <section className="section bg-cream-50">
      <div className="container-app grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow mb-4">O problema</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            Seu jantar não deveria começar horas antes.
          </h2>
          <div className="mt-6 space-y-4 text-graphite-700">
            <p>Você ainda precisa esperar horas para descongelar a carne?</p>
            <p>
              Alimento esquecido no congelador, pia ocupada com água escorrendo, rotina corrida e o
              planejamento da refeição que nunca sai como esperado — situações comuns que roubam
              tempo do seu dia.
            </p>
            <p>Do congelador para o preparo, com muito mais praticidade.</p>
          </div>
        </div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl2 bg-cream-100 shadow-card">
          <Image
            src="/images/lifestyle-cozinha.png"
            alt="Cozinha organizada e prática"
            fill
            sizes="(max-width: 768px) 90vw, 480px"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", title: "Coloque", desc: "Posicione o alimento congelado sobre a bandeja do aparelho." },
  { n: "02", title: "Ajuste o tempo", desc: "Use o painel digital para definir o tempo, de 10 a 40 minutos." },
  { n: "03", title: "Aguarde", desc: "A ventilação por convecção faz o trabalho enquanto você segue com o preparo." },
  { n: "04", title: "Prepare", desc: "Siga com o preparo da sua refeição com muito mais praticidade." },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="section bg-white">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Como funciona</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            Descongelar pode ser mais simples.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="rounded-xl2 bg-cream-50 p-6 ring-1 ring-graphite-950/[0.04]">
              <span className="text-sm font-extrabold text-clay-600">{step.n}</span>
              <h3 className="mt-2 text-base font-bold text-graphite-950">{step.title}</h3>
              <p className="mt-1.5 text-sm text-graphite-700/85">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
