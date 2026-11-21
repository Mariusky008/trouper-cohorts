// 🌙 LES EXPRESSIONS DE LA NUIT (le lot V1 ; `lib/direct/expressions-figurine-serveur.ts` ; `docs/univers/decouvrir.md`,
// section 28.6) : les figurines prêtes dont il manque des expressions (un passage raté, une nouvelle image, ceux qui avaient
// leur figurine avant le lot V1), par petits paquets — huit au plus, 280 secondes au plus. `vercel.json` l'appelle à
// 3 h 23 UTC (4 h 23 ou 5 h 23 à Paris).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { rattraperLesExpressions } from "@/lib/direct/expressions-figurine-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const r = await rattraperLesExpressions(createAdminClient(), { fin: Date.now() + 280_000 });
  return NextResponse.json({ ok: true, ...r });
}
