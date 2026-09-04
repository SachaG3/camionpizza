import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { createInvoicePdf } from "@/lib/order-mail";
import { orderStore } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/orders/[id]/invoice">) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Session requise." }, { status: 401 });
  const { id } = await context.params;
  const order = await orderStore.getById(id);
  if (!order || (order.userId !== user.id && user.role !== "admin")) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }
  if (order.status !== "picked_up") {
    return NextResponse.json({ error: "La facture sera disponible après récupération." }, { status: 409 });
  }
  const pdf = await createInvoicePdf(order);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="facture-${order.number}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
