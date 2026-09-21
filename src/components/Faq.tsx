"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Como funciona a bandeja?",
    a: "Basta colocar o alimento congelado sobre a superfície da bandeja, tampar e seguir com o preparo da sua refeição com mais praticidade.",
  },
  {
    q: "Como faço o pagamento?",
    a: "O pagamento é feito via PIX, direto no nosso checkout. Você recebe o QR Code e o código copia e cola na hora.",
  },
  {
    q: "O pagamento é seguro?",
    a: "Sim. O processamento é feito por um gateway de pagamentos especializado em PIX, e nenhum dado sensível fica exposto no seu navegador.",
  },
  {
    q: "Qual o prazo de envio?",
    a: "Seu pedido é preparado para envio em até 5 dias úteis após a confirmação do pagamento.",
  },
  {
    q: "O frete é grátis?",
    a: "Sim, o frete é grátis para todo o Brasil nesta oferta.",
  },
  {
    q: "Como funciona a garantia?",
    a: "Se você não ficar satisfeito, devolvemos o seu dinheiro. Basta entrar em contato pelos nossos canais de atendimento.",
  },
  {
    q: "Posso comprar mais de uma unidade?",
    a: "No momento o checkout está configurado para uma unidade por pedido. Para comprar mais, é só finalizar pedidos separados.",
  },
  {
    q: "Como receberei a confirmação do pedido?",
    a: "Assim que o pagamento PIX for confirmado, você verá a confirmação na tela e poderá acompanhar o status pelo número do pedido.",
  },
  {
    q: "O que acontece se o PIX ficar pendente?",
    a: "O QR Code fica disponível dentro do prazo de expiração. Se expirar sem pagamento, o pedido é marcado como expirado e você pode gerar um novo.",
  },
  {
    q: "Como entrar em contato?",
    a: "Você pode falar com a gente pelo e-mail de contato disponível no rodapé do site.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section bg-white">
      <div className="container-app max-w-2xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Dúvidas frequentes</p>
          <h2 className="font-serif text-2xl text-graphite-950 sm:text-3xl">Perguntas frequentes</h2>
        </div>

        <div className="mt-10 divide-y divide-graphite-900/10 rounded-xl2 border border-graphite-900/10">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-graphite-950">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-graphite-800/60 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && <p className="px-5 pb-4 text-sm text-graphite-800/80">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
