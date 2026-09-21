import Image from "next/image";
import Price from "@/components/Price";
import AddToCartButton from "@/components/AddToCartButton";

type ComplementaryProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  images: string[];
};

export default function Complementary({ products }: { products: ComplementaryProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="section bg-white">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Complete sua cozinha</p>
          <h2 className="font-serif text-2xl text-graphite-950 sm:text-3xl">
            Produtos que combinam com a sua bandeja.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col overflow-hidden rounded-xl2 bg-cream-50 shadow-card">
              <div className="relative aspect-[4/3] w-full bg-cream-100">
                <Image
                  src={product.images[0] ?? "/images/kit-complementar.png"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 380px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-serif text-lg text-graphite-950">{product.name}</h3>
                {product.description && (
                  <p className="mt-1.5 text-sm text-graphite-800/75">{product.description}</p>
                )}
                <div className="mt-4">
                  <Price priceCents={product.priceCents} size="sm" />
                </div>
                <AddToCartButton
                  href={`/checkout?bump=${product.slug}`}
                  productId={product.id}
                  productName={product.name}
                  priceCents={product.priceCents}
                  className="btn-secondary mt-4"
                >
                  Adicionar ao carrinho
                </AddToCartButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
