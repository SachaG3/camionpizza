import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { orderStore } from "@/lib/orders";

export async function POST(_request: Request, context: RouteContext<"/api/orders/[id]/cancel">) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Session requise." }, { status: 401 });
  const { id } = await context.params;
  const order = await orderStore.getById(id);
  if (!order || order.userId !== user.id) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  try {
    return NextResponse.json({ order: await orderStore.updateStatus(id, "cancelled") });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Annulation impossible." }, { status: 409 });
  }
}
