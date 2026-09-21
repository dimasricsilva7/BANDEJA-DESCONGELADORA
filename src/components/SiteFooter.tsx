export default function SiteFooter({
  storeName,
  contactEmail,
}: {
  storeName: string;
  contactEmail: string;
}) {
  return (
    <footer className="border-t border-graphite-900/10 bg-cream-50 py-10">
      <div className="container-app flex flex-col items-center gap-3 text-center text-sm text-graphite-800/70">
        <p className="font-serif text-base text-graphite-950">{storeName}</p>
        <p>Frete grátis · Pagamento via PIX · Envio em até 5 dias úteis</p>
        <a href={`mailto:${contactEmail}`} className="underline underline-offset-2">
          {contactEmail}
        </a>
        <p className="mt-2 text-xs text-graphite-800/50">
          © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
