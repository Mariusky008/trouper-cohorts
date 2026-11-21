// 📷 LES EXPRESSIONS DES HABITANTS (le lot V1 ; `lib/direct/expressions-figurine-serveur.ts`, `docs/univers/decouvrir.md`
// section 28.6 ; sur la page `/admin/humain/visage`). L'administrateur seulement.
//
// GET                          → { etat } : combien de figurines ont leurs cinq expressions, et les dernières
// POST { action: "rattraper" } → { rattrapage, etat } : le rattrapage de la nuit, tout de suite (huit figurines au plus)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { etatExpressionsHabitants, rattraperLesExpressions } from "@/lib/direct/expressions-figurine-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatExpressionsHabitants(createAdminClient()) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403, headers: sansCache });
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (p.action !== "rattraper") return NextResponse.json({ error: "Demande incomplète." }, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  const rattrapage = await rattraperLesExpressions(supabase, { fin: Date.now() + maxDuration * 1000 - 20_000 });
  return NextResponse.json({ ok: true, rattrapage, etat: await etatExpressionsHabitants(supabase) }, { headers: sansCache });
}
