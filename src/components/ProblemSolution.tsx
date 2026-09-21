import Image from "next/image";

const hooks = [
  "Você ainda precisa esperar horas para descongelar a carne?",
  "Do congelador para o preparo com muito mais praticidade.",
  "Uma solução simples para um dos momentos mais chatos da cozinha.",
];

export function ProblemSection() {
  return (
    <section className="section bg-white">
      <div className="container-app grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow mb-4">O problema</p>
          <h2 className="font-serif text-2xl text-graphite-950 sm:text-3xl">
            Seu jantar não deveria começar horas antes.
          </h2>
          <div className="mt-6 space-y-4 text-graphite-800/85">
            <p>{hooks[0]}</p>
            <p>
              Carne esquecida no congelador, pia ocupada, descongelamento improvisado sob água
              corrente e o planejamento da refeição que nunca sai como esperado — situações comuns
              que roubam tempo da sua rotina.
            </p>
            <p>{hooks[2]}</p>
          </div>
        </div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl2 bg-cream-100 shadow-card">
          <Image
            src="/images/lifestyle-cozinha.png"
            alt="Cozinha organizada"
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
  { title: "Coloque", desc: "Posicione o alimento congelado sobre a superfície da bandeja." },
  { title: "Tampe", desc: "Use a tampa protetora para manter a praticidade e a organização da cozinha." },
  { title: "Prepare", desc: "Siga com o preparo da sua refeição com muito mais agilidade." },
];

export function SolutionSection() {
  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-4">{hooks[1]}</p>
          <h2 className="font-serif text-2xl text-graphite-950 sm:text-3xl">
            Mais praticidade na cozinha começa antes mesmo de ligar o fogão.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-xl2 bg-white p-7 text-center shadow-card">
              <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-graphite-900 font-serif text-sm text-cream-50">
                {i + 1}
              </span>
              <h3 className="font-serif text-lg text-graphite-950">{step.title}</h3>
              <p className="mt-2 text-sm text-graphite-800/75">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const items = [
    "Retire o alimento do congelador",
    "Coloque na bandeja",
    "Prepare sua refeição com mais praticidade",
  ];
  return (
    <section id="como-funciona" className="section bg-white">
      <div className="container-app grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl2 bg-cream-100 shadow-card lg:order-2">
          <Image
            src="/images/produto-detalhe.png"
            alt="Uso da bandeja de descongelamento"
            fill
            sizes="(max-width: 768px) 90vw, 480px"
            className="object-cover"
          />
        </div>
        <div className="lg:order-1">
          <p className="eyebrow mb-4">Como funciona</p>
          <h2 className="font-serif text-2xl text-graphite-950 sm:text-3xl">Simples assim.</h2>
          <ol className="mt-6 space-y-5">
            {items.map((item, i) => (
              <li key={item} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-graphite-900/15 font-serif text-sm text-graphite-900">
                  {i + 1}
                </span>
                <p className="pt-1 text-graphite-800/85">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
