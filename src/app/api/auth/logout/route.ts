import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { loyaltyStore, SESSION_COOKIE } from "@/lib/loyalty";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await loyaltyStore.logout(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
