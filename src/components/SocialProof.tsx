import { ShieldCheck, PackageCheck, Lock } from "lucide-react";

export default function SocialProof() {
  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Confiança</p>
          <h2 className="font-serif text-2xl text-graphite-950 sm:text-3xl">
            Compra segura, do pedido à entrega.
          </h2>
          <p className="mt-4 text-graphite-800/75">
            Somos uma loja nova e preferimos ser transparentes: em breve você encontrará aqui
            avaliações reais de clientes. Por enquanto, veja como cuidamos da sua compra.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { icon: Lock, title: "Pagamento protegido", desc: "Checkout próprio com PIX processado por gateway certificado." },
            { icon: PackageCheck, title: "Pedido rastreado", desc: "Você acompanha o status do seu pedido do pagamento ao envio." },
            { icon: ShieldCheck, title: "Garantia total", desc: "Não ficou satisfeito? Seu dinheiro de volta." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl2 bg-white p-6 text-center shadow-card">
              <Icon className="mx-auto h-6 w-6 text-amber-700" strokeWidth={1.75} />
              <h3 className="mt-3 font-serif text-base text-graphite-950">{title}</h3>
              <p className="mt-1.5 text-sm text-graphite-800/75">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
