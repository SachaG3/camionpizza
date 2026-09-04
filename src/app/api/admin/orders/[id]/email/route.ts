import { after, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { processMailOutbox } from "@/lib/mail-outbox";
import { orderStore } from "@/lib/orders";

const resendSchema = z.object({ kind: z.enum(["confirmation", "invoice"]) });

export async function POST(request: Request, context: RouteContext<"/api/admin/orders/[id]/email">) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = resendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Type d’e-mail invalide." }, { status: 400 });
  const { id } = await context.params;
  const order = await orderStore.getById(id);
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (parsed.data.kind === "invoice" && order.status !== "picked_up") {
    return NextResponse.json({ error: "La facture est envoyée après récupération." }, { status: 409 });
  }

  orderStore.enqueue(id, parsed.data.kind);
  after(processMailOutbox);
  return NextResponse.json({ queued: true, order });
}
