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
      update: { passwordHash },
      create: { email: adminEmail, passwordHash, name: "Administrador" },
    });
    console.log(`Admin garantido (senha sincronizada com ADMIN_SEED_PASSWORD): ${adminEmail}`);
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
        "/images/produto-real-hero.jpg",
        "/images/produto-real-principal.jpg",
        "/images/produto-real-detalhe-1.jpg",
        "/images/produto-real-detalhe-2.jpg",
      ],
      type: "MAIN",
      active: true,
      featured: true,
      sortOrder: 0,
    },
  });

  const pegadores = await db.product.upsert({
    where: { slug: "kit-pegadores-silicone" },
    update: {},
    create: {
      name: "Kit com 2 Pegadores de Silicone",
      slug: "kit-pegadores-silicone",
      description: "Pegadores de silicone para manusear alimentos e utensílios quentes com mais segurança e praticidade.",
      priceCents: 1990,
      shortPitch: "Mais praticidade para manusear alimentos e utensílios quentes.",
      images: ["/images/kit-pegadores.jpg"],
      type: "COMPLEMENTARY",
      active: true,
      sortOrder: 1,
      orderBumpEnabled: true,
      orderBumpPriceCents: 1990,
      orderBumpHeadline: "Leve também um kit de pegadores de silicone para o dia a dia da cozinha.",
    },
  });

  const cuttingBoard = await db.product.upsert({
    where: { slug: "tabua-de-corte-antibacteriana" },
    update: {},
    create: {
      name: "Tábua de Corte Antibacteriana/Impermeável",
      slug: "tabua-de-corte-antibacteriana",
      description: "Tábua prática, impermeável e fácil de higienizar para o preparo do dia a dia.",
      priceCents: 3798,
      shortPitch: "Uma companheira prática para preparar seus alimentos.",
      images: ["/images/produto-real-tabua.jpg"],
      type: "COMPLEMENTARY",
      active: true,
      sortOrder: 2,
      orderBumpEnabled: true,
      orderBumpPriceCents: 2990,
      orderBumpHeadline: "Com apenas mais R$ 29,90, complete seu kit de preparo com uma tábua prática para sua cozinha.",
    },
  });

  const knives = await db.product.upsert({
    where: { slug: "lumai-jogo-de-facas-zurich" },
    update: {},
    create: {
      name: "LUMAI Jogo de Facas de Cozinha Zurich — Aço Inoxidável High Carbon Steel",
      slug: "lumai-jogo-de-facas-zurich",
      description: "Conjunto de facas em aço inoxidável de alto carbono para o preparo do dia a dia na cozinha.",
      priceCents: 7790,
      shortPitch: "Tenha um conjunto completo para facilitar o preparo das refeições.",
      images: ["/images/produto-real-facas.jpg"],
      type: "COMPLEMENTARY",
      active: true,
      sortOrder: 3,
      orderBumpEnabled: true,
      orderBumpPriceCents: 5990,
      orderBumpHeadline: "Com apenas mais R$ 59,90, leve também um jogo de facas completo para sua cozinha.",
    },
  });

  await db.product.upsert({
    where: { slug: "kit-cozinha-pratica" },
    update: {},
    create: {
      name: "Kit Cozinha Prática (Pegadores + Tábua de Corte)",
      slug: "kit-cozinha-pratica",
      description: "O combo perfeito para quem quer mais praticidade em cada preparo.",
      priceCents: pegadores.priceCents + cuttingBoard.priceCents,
      compareAtCents: pegadores.priceCents + cuttingBoard.priceCents,
      images: ["/images/produto-real-tabua.jpg"],
      type: "UPSELL",
      active: true,
      sortOrder: 4,
      upsellEnabled: true,
      upsellPriceCents: 4990,
      upsellHeadline: "Seu pedido foi confirmado! Aproveite esta condição especial antes de finalizar.",
    },
  });

  console.log("Seed concluído:", { main: main.slug, pegadores: pegadores.slug, cuttingBoard: cuttingBoard.slug, knives: knives.slug });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
