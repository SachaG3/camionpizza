import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { sendOrderEmail } from "@/lib/order-mail";
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

  try {
    const messageId = await sendOrderEmail(order, parsed.data.kind);
    return NextResponse.json({ order: await orderStore.recordEmail(id, parsed.data.kind, "sent", messageId) });
  } catch (error) {
    const updated = await orderStore.recordEmail(id, parsed.data.kind, "failed", error instanceof Error ? error.message : "Échec SMTP");
    return NextResponse.json({ error: "L’e-mail n’a pas pu être envoyé.", order: updated }, { status: 502 });
  }
}
