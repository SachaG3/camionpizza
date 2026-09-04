import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { processMailOutbox } from "@/lib/mail-outbox";

export async function POST() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  await processMailOutbox();
  return NextResponse.json({ processed: true });
}
