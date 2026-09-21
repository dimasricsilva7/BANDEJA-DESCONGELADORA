import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.admin.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, passwordHash, name: "Administrador" },
    });
    console.log(`Admin garantido: ${adminEmail}`);
  } else {
    console.warn("ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD ausentes — nenhum admin criado.");
  }

  const main = await db.product.upsert({
    where: { slug: "bandeja-descongelamento-rapido-com-tampa" },
    update: {},
    create: {
      name: "Bandeja de Descongelamento Rápido com Tampa",
      slug: "bandeja-descongelamento-rapido-com-tampa",
      description:
        "Bandeja inteligente para descongelar alimentos com muito mais praticidade, com tampa protetora, fácil de limpar e usar no dia a dia da cozinha.",
      priceCents: 14790,
      compareAtCents: 28198,
      bravopayProductId: process.env.BRAVOPAY_PRODUCT_ID ?? null,
      images: [
        "/images/produto-hero.png",
        "/images/produto-detalhe.png",
        "/images/lifestyle-cozinha.png",
      ],
      type: "MAIN",
      active: true,
      featured: true,
      sortOrder: 0,
    },
  });

  const thermometer = await db.product.upsert({
    where: { slug: "termometro-digital-para-carnes" },
    update: {},
    create: {
      name: "Termômetro Digital para Carnes",
      slug: "termometro-digital-para-carnes",
      description: "Acompanhe o ponto certo de preparo das suas carnes com leitura digital rápida.",
      priceCents: 4990,
      images: ["/images/kit-complementar.png"],
      type: "COMPLEMENTARY",
      active: true,
      sortOrder: 1,
      orderBumpEnabled: true,
      orderBumpPriceCents: 2990,
      orderBumpHeadline:
        "Com apenas mais R$ 29,90, leve também um termômetro digital para acompanhar o preparo das suas carnes.",
    },
  });

  const cuttingBoard = await db.product.upsert({
    where: { slug: "tabua-de-corte-antibacteriana" },
    update: {},
    create: {
      name: "Tábua de Corte Antibacteriana/Impermeável",
      slug: "tabua-de-corte-antibacteriana",
      description: "Tábua prática, impermeável e fácil de higienizar para o preparo do dia a dia.",
      priceCents: 5990,
      images: ["/images/kit-complementar.png"],
      type: "COMPLEMENTARY",
      active: true,
      sortOrder: 2,
      orderBumpEnabled: true,
      orderBumpPriceCents: 3990,
      orderBumpHeadline: "Complete seu kit de preparo adicionando uma tábua prática para sua cozinha.",
    },
  });

  await db.product.upsert({
    where: { slug: "kit-cozinha-pratica" },
    update: {},
    create: {
      name: "Kit Cozinha Prática (Termômetro + Tábua de Corte)",
      slug: "kit-cozinha-pratica",
      description: "O combo perfeito para quem quer mais praticidade em cada preparo.",
      priceCents: 10980,
      compareAtCents: 10980,
      images: ["/images/kit-complementar.png"],
      type: "UPSELL",
      active: true,
      sortOrder: 3,
      upsellEnabled: true,
      upsellPriceCents: 6990,
      upsellHeadline: "Seu pedido foi confirmado! Aproveite esta condição especial antes de finalizar.",
    },
  });

  console.log("Seed concluído:", { main: main.slug, thermometer: thermometer.slug, cuttingBoard: cuttingBoard.slug });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
