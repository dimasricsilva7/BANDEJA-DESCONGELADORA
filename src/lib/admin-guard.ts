import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { admin: null, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { admin, response: null };
}
