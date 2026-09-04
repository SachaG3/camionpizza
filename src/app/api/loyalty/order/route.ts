import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { loyaltyStore, SESSION_COOKIE } from "@/lib/loyalty";
import { LoyaltyError } from "@/lib/loyalty-store";

const orderSchema = z.object({ pizzaCount: z.number().int().min(1).max(30) });

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  try {
    const user = await loyaltyStore.addOrder(token, parsed.data.pizzaCount);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof LoyaltyError && error.code === "INVALID_SESSION") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
