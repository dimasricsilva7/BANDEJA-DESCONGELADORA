import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getPublishedReviewStats, getPublishedReviews, getPublishedReviewPhotos } from "@/lib/reviews";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import { ProblemSection, HowItWorksSection } from "@/components/ProblemSolution";
import ProductGallery from "@/components/ProductGallery";
import Benefits from "@/components/Benefits";
import Specifications from "@/components/Specifications";
import Complementary from "@/components/Complementary";
import Reviews from "@/components/Reviews";
import CustomerPhotos from "@/components/CustomerPhotos";
import Guarantee from "@/components/Guarantee";
import { TrustSection } from "@/components/TrustBar";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import StickyCta from "@/components/StickyCta";
import SiteFooter from "@/components/SiteFooter";
import ViewContentTracker from "@/components/ViewContentTracker";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, mainProduct, complementary, reviewStats, reviews, reviewPhotos] = await Promise.all([
    getSettings(),
    db.product.findFirst({ where: { type: "MAIN", active: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { type: "COMPLEMENTARY", active: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPublishedReviewStats(),
    getPublishedReviews(),
    getPublishedReviewPhotos(),
  ]);

  if (!mainProduct) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-graphite-700/80">
          Nenhum produto ativo configurado ainda. Acesse o painel administrativo em{" "}
          <code>/admin</code> para cadastrar o produto principal.
        </p>
      </main>
    );
  }

  const priceCents = mainProduct.priceCents;
  const compareAtCents = mainProduct.compareAtCents ?? 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const productJsonLd: Record<string, unknown> = {
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
          businessDays: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
          maxTransitTime: 5,
        },
      },
    },
  };

  if (reviewStats.count > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewStats.avg,
      reviewCount: reviewStats.count,
    };
  }

  return (
    <main className="pb-16 sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ViewContentTracker productId={mainProduct.id} productName={mainProduct.name} priceCents={priceCents} />
      <SiteHeader storeName={settings.store_name} />
      <Hero
        priceCents={priceCents}
        compareAtCents={compareAtCents}
        heroImage={mainProduct.images[0] ?? "/images/produto-hero.png"}
        reviewStats={reviewStats}
      />
      <TrustSection />
      <ProblemSection />
      <HowItWorksSection />
      <ProductGallery />
      <Benefits />
      <Specifications settings={settings} />
      <Complementary products={complementary} />
      <Reviews reviews={reviews} stats={reviewStats} />
      <CustomerPhotos
        photos={reviewPhotos
          .filter((r) => r.photoUrl)
          .map((r) => ({
            id: r.id,
            photoUrl: r.photoUrl as string,
            customerName: r.customerName,
            city: r.city,
            state: r.state,
            verifiedPurchase: r.verifiedPurchase,
            productName: r.product?.name ?? null,
          }))}
      />
      <Guarantee
        text={settings.guarantee_text}
        days={settings.guarantee_days || undefined}
        conditions={settings.guarantee_conditions || undefined}
        howTo={settings.guarantee_how_to || undefined}
      />
      <Faq />
      <FinalCta priceCents={priceCents} compareAtCents={compareAtCents} />
      <SiteFooter settings={settings} />
      <StickyCta priceCents={priceCents} />
    </main>
  );
}
