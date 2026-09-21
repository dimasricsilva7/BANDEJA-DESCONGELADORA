import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import Hero from "@/components/Hero";
import { ProblemSection, SolutionSection, HowItWorksSection } from "@/components/ProblemSolution";
import Benefits from "@/components/Benefits";
import Complementary from "@/components/Complementary";
import SocialProof from "@/components/SocialProof";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import StickyCta from "@/components/StickyCta";
import SiteFooter from "@/components/SiteFooter";
import ViewContentTracker from "@/components/ViewContentTracker";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, mainProduct, complementary] = await Promise.all([
    getSettings(),
    db.product.findFirst({ where: { type: "MAIN", active: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { type: "COMPLEMENTARY", active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!mainProduct) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-graphite-800/70">
          Nenhum produto ativo configurado ainda. Acesse o painel administrativo em{" "}
          <code>/admin</code> para cadastrar o produto principal.
        </p>
      </main>
    );
  }

  const priceCents = mainProduct.priceCents;
  const compareAtCents = mainProduct.compareAtCents ?? 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: mainProduct.name,
    description: mainProduct.description,
    image: mainProduct.images.map((img) => `${siteUrl}${img}`),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/checkout`,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "BRL" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          businessDays: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"] },
          maxTransitTime: 5,
        },
      },
    },
  };

  return (
    <main className="pb-16 sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ViewContentTracker productId={mainProduct.id} productName={mainProduct.name} priceCents={priceCents} />
      <Hero priceCents={priceCents} compareAtCents={compareAtCents} heroImage={mainProduct.images[0] ?? "/images/produto-hero.png"} />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <Benefits />
      <Complementary products={complementary} />
      <SocialProof />
      <Faq />
      <FinalCta priceCents={priceCents} compareAtCents={compareAtCents} />
      <SiteFooter storeName={settings.store_name} contactEmail={settings.contact_email} />
      <StickyCta priceCents={priceCents} />
    </main>
  );
}
