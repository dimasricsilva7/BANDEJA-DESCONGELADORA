export default function DemoVideo({ videoUrl }: { videoUrl?: string }) {
  if (!videoUrl) return null;

  return (
    <section className="section bg-white">
      <div className="container-app max-w-2xl text-center">
        <p className="eyebrow mb-4">Veja funcionando</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">
          Como funciona na prática
        </h2>

        <div className="mx-auto mt-8 w-full max-w-[380px] overflow-hidden rounded-xl2 bg-graphite-950 shadow-lift ring-1 ring-graphite-950/[0.08]">
          <video
            src={videoUrl}
            className="aspect-[9/16] h-auto w-full"
            controls
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
        </div>
      </div>
    </section>
  );
}
