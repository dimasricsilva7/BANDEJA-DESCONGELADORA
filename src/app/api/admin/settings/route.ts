import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { getSettings, setSetting } from "@/lib/settings";

export async function GET() {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const settings = await getSettings();
  return NextResponse.json(settings);
}

const schema = z.record(z.string());

export async function PATCH(req: NextRequest) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 422 });

  await Promise.all(Object.entries(parsed.data).map(([key, value]) => setSetting(key, value)));
  return NextResponse.json({ ok: true });
}
