import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { sendOrderEmail } from "@/lib/order-mail";
import { orderStatuses } from "@/lib/order-store";
import { orderStore } from "@/lib/orders";

const statusSchema = z.object({ status: z.enum(orderStatuses) });

export async function PATCH(request: Request, context: RouteContext<"/api/admin/orders/[id]">) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  const { id } = await context.params;

  try {
    let order = await orderStore.updateStatus(id, parsed.data.status);
    if (order.status === "picked_up" && order.emails.invoice.status !== "sent") {
      try {
        const messageId = await sendOrderEmail(order, "invoice");
        order = await orderStore.recordEmail(order.id, "invoice", "sent", messageId);
      } catch (error) {
        order = await orderStore.recordEmail(order.id, "invoice", "failed", error instanceof Error ? error.message : "Échec SMTP");
      }
    }
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de modifier la commande." }, { status: 409 });
  }
}
