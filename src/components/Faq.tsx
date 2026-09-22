"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Como funciona o descongelador?",
    a: "Basta colocar o alimento congelado sobre a bandeja, ajustar o tempo no painel digital (de 10 a 40 minutos) e aguardar. A ventilação por convecção faz o trabalho enquanto você segue com o preparo.",
  },
  {
    q: "Como faço o pagamento?",
    a: "O pagamento é feito via PIX, direto no nosso checkout. Você recebe o QR Code e o código copia e cola na hora, com aprovação automática.",
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
    q: "Como acompanho meu pedido?",
    a: "Assim que o pagamento é confirmado você recebe os detalhes do pedido na tela de confirmação. Guarde o número do seu pedido para consultar o status quando quiser.",
  },
  {
    q: "Como funciona a garantia?",
    a: "Sua compra é protegida pela nossa política de garantia. Veja os detalhes na seção de garantia desta página ou entre em contato pelos nossos canais de atendimento.",
  },
  {
    q: "Posso comprar mais de uma unidade?",
    a: "No momento o checkout está configurado para uma unidade por pedido. Para comprar mais, é só finalizar pedidos separados.",
  },
  {
    q: "Como receberei a confirmação do pedido?",
    a: "Assim que o pagamento PIX for confirmado, você verá a confirmação imediatamente na tela, com todos os detalhes do seu pedido.",
  },
  {
    q: "O que acontece se o PIX ficar pendente?",
    a: "O QR Code fica disponível dentro do prazo de expiração mostrado na tela. Se expirar sem pagamento, o pedido é marcado como expirado e você pode iniciar um novo pedido normalmente.",
  },
  {
    q: "Como entrar em contato?",
    a: "Você pode falar com a gente pelo e-mail de contato disponível no rodapé do site.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section bg-cream-50">
      <div className="container-app max-w-2xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Dúvidas frequentes</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">Perguntas frequentes</h2>
        </div>

        <div className="mt-10 divide-y divide-graphite-900/10 rounded-xl2 bg-white ring-1 ring-graphite-950/[0.05]">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-graphite-950">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-graphite-700/60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid overflow-hidden transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-graphite-700/85">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
