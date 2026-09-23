import { db } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  store_name: "Cozinha Prática",
  main_price_cents: "14790",
  compare_at_cents: "28198",
  shipping_days: "5",
  guarantee_text: "Garantia total ou seu dinheiro de volta",
  guarantee_days: "",
  guarantee_conditions: "",
  guarantee_how_to: "",
  contact_email: "contato@cozinhapratica.com.br",
  contact_whatsapp: "",
  spec_material: "",
  spec_dimensions: "",
  spec_weight: "",
  spec_package_contents: "",
  spec_cleaning: "",
  spec_usage: "",
  spec_capacity: "",
  spec_power: "",
  spec_battery: "",
  policy_privacy: "",
  policy_terms: "",
  policy_exchange: "",
  policy_delivery: "",
  company_info: "",
  demo_video_url: "",
};

export type SettingsMap = Record<string, string> & typeof DEFAULT_SETTINGS;

export async function getSettings(): Promise<SettingsMap> {
  const rows = await db.setting.findMany();
  const map: SettingsMap = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSetting(key: string, value: string) {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
