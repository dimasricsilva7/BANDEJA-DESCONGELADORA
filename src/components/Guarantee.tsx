import { ShieldCheck } from "lucide-react";

export default function Guarantee({
  text,
  days,
  conditions,
  howTo,
}: {
  text: string;
  days?: string;
  conditions?: string;
  howTo?: string;
}) {
  return (
    <section className="section bg-white">
      <div className="container-app max-w-2xl">
        <div className="rounded-xl2 bg-sage-50 p-8 ring-1 ring-sage-200 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-600 text-cream-50">
              <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="text-xl font-extrabold text-graphite-950 sm:text-2xl">Compra com garantia</h2>
          </div>

          <p className="mt-4 text-lg font-medium leading-relaxed text-graphite-800">
            {text}{days ? ` — ${days}.` : "."}
          </p>

          {conditions && (
            <div className="mt-5">
              <p className="text-base font-bold text-graphite-950">Condições</p>
              <p className="mt-1.5 text-base leading-relaxed text-graphite-700/90">{conditions}</p>
            </div>
          )}

          {howTo && (
            <div className="mt-5">
              <p className="text-base font-bold text-graphite-950">Como solicitar</p>
              <p className="mt-1.5 text-base leading-relaxed text-graphite-700/90">{howTo}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
