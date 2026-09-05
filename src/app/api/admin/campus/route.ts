import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CampusStore, CampusError } from "@/lib/campus-store";
const store = new CampusStore();
const schema = z.discriminatedUnion("action", [z.object({ action: z.literal("settings"), quiz: z.boolean(), battle: z.boolean(), club: z.boolean() }), z.object({ action: z.literal("close"), winner: z.enum(["burrata", "nduja"]).optional() }), z.object({ action: z.literal("reopen") })]);
function snapshot() { return NextResponse.json({ ...store.getState("admin"), settings: store.getSettings(), metrics: store.adminSummary() }, { headers: { "Cache-Control": "no-store" } }); }
export async function GET() { if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé." }, { status: 403 }); return snapshot(); }
export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== (request.headers.get("x-forwarded-host") || request.headers.get("host"))) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  try {
    const body = parsed.data;
    if (body.action === "settings") store.setSettings(body);
    if (body.action === "close") store.closeBattle("admin", body.winner);
    if (body.action === "reopen") store.reopenBattle();
    return snapshot();
  } catch (error) { if (error instanceof CampusError) return NextResponse.json({ error: error.message }, { status: error.status }); throw error; }
}
