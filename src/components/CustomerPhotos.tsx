"use client";

import { useState } from "react";
import Image from "next/image";
import { X, BadgeCheck } from "lucide-react";

export type CustomerPhoto = {
  id: string;
  photoUrl: string;
  customerName: string;
  city: string | null;
  state: string | null;
  verifiedPurchase: boolean;
  productName: string | null;
};

export default function CustomerPhotos({ photos }: { photos: CustomerPhoto[] }) {
  const [active, setActive] = useState<CustomerPhoto | null>(null);

  if (photos.length === 0) return null;

  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Fotos reais</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
            Quem já recebeu
          </h2>
        </div>

        <div className="mt-10 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setActive(photo)}
              className="group relative aspect-square w-40 shrink-0 overflow-hidden rounded-xl2 shadow-card transition-transform hover:scale-[1.02] sm:w-auto sm:shrink"
            >
              <Image src={photo.photoUrl} alt={`Foto enviada por ${photo.customerName}`} fill sizes="240px" className="object-cover" />
              {photo.verifiedPurchase && (
                <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-sage-700 shadow">
                  <BadgeCheck className="h-3 w-3" /> Verificada
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-950/90 p-4"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setActive(null)}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square w-full overflow-hidden rounded-xl2 bg-graphite-900">
              <Image src={active.photoUrl} alt={`Foto enviada por ${active.customerName}`} fill sizes="400px" className="object-contain" />
            </div>
            <div className="mt-3 text-center text-cream-50">
              <p className="font-bold">{active.customerName}</p>
              {(active.city || active.state) && (
                <p className="text-sm text-cream-50/70">
                  {active.city}
                  {active.city && active.state ? "/" : ""}
                  {active.state}
                </p>
              )}
              {active.productName && <p className="mt-1 text-xs text-cream-50/60">{active.productName}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
