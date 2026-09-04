import { NextResponse } from "next/server";
import { z } from "zod";

import { loyaltyStore, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/loyalty";
import { LoyaltyError } from "@/lib/loyalty-store";

const loginSchema = z.object({
  email: z.email().max(120),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 400 });
  }

  try {
    const { user, token } = await loyaltyStore.login(parsed.data);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    if (error instanceof LoyaltyError && error.code === "INVALID_CREDENTIALS") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
