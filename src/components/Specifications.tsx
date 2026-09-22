type Specs = {
  spec_material?: string;
  spec_dimensions?: string;
  spec_weight?: string;
  spec_capacity?: string;
  spec_battery?: string;
  spec_power?: string;
  spec_package_contents?: string;
  spec_cleaning?: string;
  spec_usage?: string;
};

const LABELS: Record<keyof Specs, string> = {
  spec_material: "Material",
  spec_dimensions: "Dimensões",
  spec_weight: "Peso",
  spec_capacity: "Capacidade",
  spec_battery: "Bateria",
  spec_power: "Alimentação / Carregamento",
  spec_package_contents: "Conteúdo da embalagem",
  spec_cleaning: "Forma de limpeza",
  spec_usage: "Uso recomendado",
};

export default function Specifications({ settings }: { settings: Specs }) {
  const entries = (Object.keys(LABELS) as (keyof Specs)[])
    .map((key) => ({ label: LABELS[key], value: settings[key]?.trim() }))
    .filter((item): item is { label: string; value: string } => Boolean(item.value));

  if (entries.length === 0) return null;

  return (
    <section className="section bg-white">
      <div className="container-app max-w-2xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Ficha técnica</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-graphite-950 sm:text-3xl">Detalhes do produto</h2>
        </div>

        <dl className="mt-10 divide-y divide-graphite-900/10 rounded-xl2 bg-cream-50 ring-1 ring-graphite-950/[0.04]">
          {entries.map((item) => (
            <div key={item.label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between">
              <dt className="text-sm font-bold text-graphite-950">{item.label}</dt>
              <dd className="text-sm text-graphite-700/85 sm:text-right">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
