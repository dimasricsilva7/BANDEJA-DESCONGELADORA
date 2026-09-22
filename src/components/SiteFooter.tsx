type FooterSettings = Record<string, string> & {
  store_name: string;
  contact_email: string;
};

function whatsappHref(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/55${digits}`;
}

export default function SiteFooter({ settings }: { settings: FooterSettings }) {
  const policyLinks = [
    { label: "Política de Privacidade", value: settings.policy_privacy },
    { label: "Termos de Uso", value: settings.policy_terms },
    { label: "Política de Troca/Devolução", value: settings.policy_exchange },
    { label: "Política de Entrega", value: settings.policy_delivery },
  ].filter((p) => p.value);

  return (
    <footer className="border-t border-graphite-900/10 bg-cream-50 py-12">
      <div className="container-app flex flex-col items-center gap-4 text-center text-sm text-graphite-700">
        <p className="text-base font-extrabold text-graphite-950">{settings.store_name}</p>
        <p>Frete grátis · Pagamento via PIX · Envio em até 5 dias úteis</p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href={`mailto:${settings.contact_email}`} className="underline underline-offset-2">
            {settings.contact_email}
          </a>
          {settings.contact_whatsapp && (
            <a href={whatsappHref(settings.contact_whatsapp)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              WhatsApp
            </a>
          )}
        </div>

        {policyLinks.length > 0 && (
          <div className="flex max-w-md flex-wrap items-center justify-center gap-2 text-xs text-graphite-700/70">
            {policyLinks.map((p) => (
              <details key={p.label} className="group">
                <summary className="cursor-pointer list-none underline underline-offset-2 marker:hidden">
                  {p.label}
                </summary>
                <p className="mt-2 max-w-sm text-left text-graphite-700/80">{p.value}</p>
              </details>
            ))}
          </div>
        )}

        {settings.company_info && <p className="text-xs text-graphite-700/50">{settings.company_info}</p>}

        <p className="mt-2 text-xs text-graphite-700/50">
          © {new Date().getFullYear()} {settings.store_name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
