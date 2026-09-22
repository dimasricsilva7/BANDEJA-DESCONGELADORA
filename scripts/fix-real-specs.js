const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  await db.product.updateMany({
    where: { type: "MAIN" },
    data: {
      description:
        "Descongelador elétrico compacto com painel digital, tampa protetora transparente e ventilação por convecção para um descongelamento uniforme. Timer ajustável de 10 a 40 minutos, bateria recarregável via USB-C e grande capacidade de 4,2L — ideal para carnes, peixes, frango e frutos do mar.",
    },
  });

  const specs = {
    spec_material: "ABS + Alumínio",
    spec_dimensions: "27 x 27 x 8,5 cm (largura x profundidade x altura)",
    spec_weight: "1,2 kg",
    spec_capacity: "4,2 litros",
    spec_battery: "2000 mAh, autonomia de até 120 minutos com carga completa",
    spec_power: "Entrada 5V ⎓ 2A, carregamento via USB-C",
    spec_package_contents: "1x Descongelador, 1x Cabo USB-C, 1x Manual de instruções",
    spec_cleaning: "Bandeja e tampa removíveis, fáceis de higienizar",
    spec_usage: "Timer ajustável de 10 a 40 minutos conforme o tipo e espessura do alimento",
  };

  for (const [key, value] of Object.entries(specs)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  console.log("Specs reais atualizadas.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
