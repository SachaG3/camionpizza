import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { loyaltyStore, SESSION_COOKIE } from "@/lib/loyalty";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? await loyaltyStore.getUserByToken(token) : null;
  return NextResponse.json({ user });
}
