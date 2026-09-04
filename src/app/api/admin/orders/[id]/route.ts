import { after, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { processMailOutbox } from "@/lib/mail-outbox";
import { orderStatuses } from "@/lib/order-store";
import { orderStore } from "@/lib/orders";

const statusSchema = z.object({ status: z.enum(orderStatuses) });

export async function PATCH(request: Request, context: RouteContext<"/api/admin/orders/[id]">) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  const { id } = await context.params;

  try {
    const order = await orderStore.updateStatus(id, parsed.data.status);
    if (order.status === "ready") orderStore.enqueue(order.id, "ready");
    if (order.status === "picked_up" && order.emails.invoice.status !== "sent") orderStore.enqueue(order.id, "invoice");
    after(processMailOutbox);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de modifier la commande." }, { status: 409 });
  }
}
