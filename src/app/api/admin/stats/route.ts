import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { computeDashboardStats, resolvePreset } from "@/lib/stats";

export async function GET(req: NextRequest) {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const { searchParams } = new URL(req.url);
  const range = resolvePreset(searchParams.get("preset"), searchParams.get("from"), searchParams.get("to"));
  const stats = await computeDashboardStats(range);

  return NextResponse.json(stats);
}
