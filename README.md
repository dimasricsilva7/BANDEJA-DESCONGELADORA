# Bandeja de Descongelamento Rápido — Loja

E-commerce completo (Next.js 14 App Router + Prisma/Postgres) para um produto físico, com checkout
próprio, PIX via BravoPay, webhook + polling de confirmação, painel administrativo, tracking
(Meta Pixel + Conversions API, UTMs, fbclid/gclid) e recuperação de carrinho abandonado.

## Stack

- Next.js 14 (App Router, TypeScript, Server Components)
- Prisma + PostgreSQL
- Tailwind CSS
- BravoPay (PIX) — https://bravopay.club/docs
- Meta Pixel + Conversions API
- Resend (e-mail transacional, opcional)

## Configuração local

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha as variáveis (veja abaixo).
3. Rode as migrations: `npx prisma migrate dev --name init`
4. Popule o admin e os produtos: `npm run db:seed`
5. `npm run dev`

## Variáveis de ambiente

Veja `.env.example`. Resumo do que cada uma faz:

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão Postgres (Vercel Postgres/Neon/Supabase) |
| `BRAVOPAY_API_KEY` | Chave privada da BravoPay — **nunca** exposta ao frontend |
| `BRAVOPAY_WEBHOOK_SECRET` | Gerado no dashboard BravoPay ao cadastrar a URL do webhook |
| `BRAVOPAY_PRODUCT_ID` | `product_id` da BravoPay usado nas transações |
| `NEXT_PUBLIC_META_PIXEL_ID` | Pixel ID (público, usado no browser) |
| `META_CONVERSIONS_API_TOKEN` | Token da Conversions API — apenas backend |
| `AUTH_SECRET` | Usado indiretamente para sessões (string aleatória) |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Credenciais do primeiro admin (seed) |
| `EMAIL_PROVIDER_API_KEY` | Chave da Resend para e-mail de carrinho abandonado |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (CAPI, sitemap, schema.org) |

## Configurar o webhook da BravoPay

O cadastro do webhook é feito **apenas pelo dashboard** da BravoPay (não há endpoint de API para
isso): Dashboard → Integrações → cadastre `https://SEU_DOMINIO/api/webhooks/bravopay`. A BravoPay
gera um segredo `whsec_...` — copie para `BRAVOPAY_WEBHOOK_SECRET` na Vercel e faça um novo deploy.

## Fluxo de pagamento

1. Cliente finaliza o checkout → `POST /api/checkout` recalcula o preço no servidor (nunca confia
   no valor enviado pelo navegador), cria o pedido (`CREATED`) e chama a BravoPay para gerar o PIX
   (`Idempotency-Key` = chave do pedido, garante que retries de rede nunca dupliquem cobrança).
2. Tela de checkout mostra QR Code + copia-e-cola e faz **polling** (`GET /api/orders/[id]/status`)
   em intervalos crescentes até a confirmação.
3. `POST /api/webhooks/bravopay` valida a assinatura HMAC (`t=...,v1=...` sobre `${t}.${rawBody}`),
   deduplica pelo `event.id` e é a fonte de verdade que marca o pedido como `PAID`.
4. Painel admin tem um botão "Reverificar pagamento" que consulta a BravoPay diretamente
   (`GET /transactions?external_reference=...`) — nunca marca como pago manualmente sem essa
   confirmação.

## Painel administrativo

`/admin/login` — autenticação por e-mail/senha (bcrypt) com sessão em cookie `HttpOnly`. Abas:
Dashboard (métricas e gráficos), Pedidos (busca/filtros, reverificar, cancelar, excluir), Produtos
(preços, imagens, order bumps, upsell), Carrinhos abandonados (reenvio de e-mail), Configurações.

## Deploy

```bash
npm run build   # roda `prisma generate` e o build do Next
```

Configure as variáveis de ambiente na Vercel (Production/Preview) antes do primeiro deploy e rode
`npx prisma migrate deploy` apontando para o banco de produção.
