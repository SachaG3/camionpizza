import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import { z } from "zod";

import { locations } from "@/data/locations";

import { loyaltyStore, SESSION_COOKIE } from "@/lib/loyalty";
import { processMailOutbox } from "@/lib/mail-outbox";
import { orderStore } from "@/lib/orders";

export const runtime = "nodejs";

const money = z.number().finite().min(0).max(1000);
const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(80).optional(),
  customerEmail: z.email().max(120).optional(),
  locationName: z.string().trim().min(2).max(100),
  pickupLabel: z.string().trim().min(2).max(120),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/),
  instructions: z.string().trim().max(160).optional(),
  items: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    quantity: z.number().int().min(1).max(20),
    unitPrice: money,
    details: z.array(z.string().trim().max(80)).max(12),
  })).min(1).max(30),
  addons: z.array(z.object({ name: z.string().trim().min(1).max(80), unitPrice: money })).max(2),
  discount: money.max(20),
});

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? await loyaltyStore.getUserByToken(token) : null;
  if (!user) return NextResponse.json({ error: "Session requise." }, { status: 401 });
  return NextResponse.json({ orders: await orderStore.listForUser(user.id) });
}

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Commande invalide." }, { status: 400 });

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? await loyaltyStore.getUserByToken(token) : null;
  const customerEmail = user?.email ?? parsed.data.customerEmail;
  if (!customerEmail) {
    return NextResponse.json({ error: "Ton e-mail est nécessaire pour recevoir la commande." }, { status: 400 });
  }

  const location = locations.find((item) => item.name === parsed.data.locationName);
  if (!location || !location.acceptingOrders || !location.slots.includes(parsed.data.pickupTime)) {
    return NextResponse.json({ error: "Ce passage ne prend plus de commandes." }, { status: 409 });
  }
  if (orderStore.slotAvailability(parsed.data.locationName, parsed.data.pickupTime).full) {
    return NextResponse.json({ error: "Ce créneau est complet. Choisis-en un autre." }, { status: 409 });
  }

  const order = await orderStore.create({
    ...parsed.data,
    userId: user?.id ?? null,
    customerName: user?.name ?? parsed.data.customerName ?? "Client Fourchette",
    customerEmail,
    estimatedMinutes: orderStore.estimateMinutes(),
  });

  let updatedUser = user;
  if (user && token) updatedUser = await loyaltyStore.addOrder(token, parsed.data.items.reduce((sum, item) => sum + item.quantity, 0));

  orderStore.enqueue(order.id, "confirmation");
  after(processMailOutbox);

  return NextResponse.json({ order: await orderStore.getById(order.id), user: updatedUser }, { status: 201 });
}
