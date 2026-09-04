import { NextResponse } from "next/server";
import { z } from "zod";

import { loyaltyStore, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/loyalty";
import { LoyaltyError } from "@/lib/loyalty-store";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(40),
  email: z.email().max(120),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vérifie ton prénom, ton e-mail et ton mot de passe (8 caractères minimum)." },
      { status: 400 },
    );
  }

  try {
    const { user, token } = await loyaltyStore.createAccount(parsed.data);
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    if (error instanceof LoyaltyError && error.code === "EMAIL_EXISTS") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
