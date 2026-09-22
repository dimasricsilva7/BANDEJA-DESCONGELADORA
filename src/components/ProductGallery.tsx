import Image from "next/image";

const images = [
  { src: "/images/produto-hero.png", alt: "Bandeja de Descongelamento Rápido com Tampa, vista geral" },
  { src: "/images/produto-detalhe.png", alt: "Detalhe da bandeja com a tampa ao lado" },
  { src: "/images/lifestyle-cozinha.png", alt: "Bandeja utilizada em uma cozinha real" },
];

export default function ProductGallery() {
  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Conheça o produto</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            Feita para o uso real na sua cozinha.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-card sm:col-span-2 sm:row-span-2 sm:aspect-auto">
            <Image src={images[0].src} alt={images[0].alt} fill sizes="(max-width: 768px) 90vw, 620px" className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-card">
            <Image src={images[1].src} alt={images[1].alt} fill sizes="(max-width: 768px) 45vw, 300px" className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-card">
            <Image src={images[2].src} alt={images[2].alt} fill sizes="(max-width: 768px) 45vw, 300px" className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
