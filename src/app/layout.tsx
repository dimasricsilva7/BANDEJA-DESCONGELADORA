import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import TrackingCapture from "@/components/TrackingCapture";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bandeja de Descongelamento Rápido com Tampa | Cozinha Prática",
    template: "%s | Cozinha Prática",
  },
  description:
    "Descongele alimentos com muito mais praticidade. Bandeja com tampa protetora, frete grátis, pagamento via PIX e garantia total ou seu dinheiro de volta.",
  openGraph: {
    title: "Bandeja de Descongelamento Rápido com Tampa",
    description:
      "Mais praticidade na cozinha: descongele alimentos sem esperar horas. Frete grátis e pagamento via PIX.",
    url: siteUrl,
    siteName: "Cozinha Prática",
    images: [{ url: "/images/produto-real-hero.jpg", width: 1024, height: 1024 }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bandeja de Descongelamento Rápido com Tampa",
    description: "Mais praticidade na cozinha, com frete grátis e pagamento via PIX.",
    images: ["/images/produto-real-hero.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body>
        <MetaPixel />
        <TrackingCapture />
        {children}
      </body>
    </html>
  );
}
