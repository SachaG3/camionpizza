import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { orderStore } from "@/lib/orders";

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  return NextResponse.json({ orders: await orderStore.listAll() });
}
