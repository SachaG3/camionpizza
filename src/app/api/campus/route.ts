import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { CampusStore, CampusError } from "@/lib/campus-store";

const store = new CampusStore();
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("vote"), choice: z.enum(["burrata", "nduja"]) }),
  z.object({ action: z.literal("quiz") }),
  z.object({ action: z.literal("claim") }),
  z.object({ action: z.literal("close"), winner: z.enum(["burrata", "nduja"]).optional() }),
]);
async function context() {
  const user = await currentUser();
  const jar = await cookies();
  const existing = jar.get("fourchette-campus")?.value;
  const token = existing && z.string().uuid().safeParse(existing).success ? existing : randomUUID();
  return { identity: user ? `user:${user.id}` : `visitor:${token}`, token, isAdmin: user?.role === "admin" };
}
function reply(state: object, ctx: Awaited<ReturnType<typeof context>>) {
  const response = NextResponse.json({ ...state, settings: store.getSettings(), isAdmin: ctx.isAdmin }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set("fourchette-campus", ctx.token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}
export async function GET() {
  const ctx = await context();
  return reply(store.getState(ctx.identity), ctx);
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (origin && (() => { try { return new URL(origin).host !== host; } catch { return true; } })()) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  const ctx = await context();
  try {
    const action = body.data;
    if (action.action === "close" && !ctx.isAdmin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
    const state = action.action === "vote" ? store.vote(ctx.identity, action.choice) : action.action === "quiz" ? store.completeQuiz(ctx.identity) : action.action === "claim" ? store.claim(ctx.identity) : store.closeBattle(ctx.identity, action.winner);
    return reply(state, ctx);
  } catch (error) {
    if (error instanceof CampusError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
