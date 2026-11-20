// 🧭 SES PASSIONS (`lib/direct/decouvrir.ts`, `passions-serveur.ts` ; `docs/univers/decouvrir.md`, section 3 ; le lot D0).
//
// GET                         → { passions, themes, adulte } : ses passions, et les thèmes qu'il peut choisir (le salon
//                               des jeunes parents seulement s'il a dit ses 18 ans)
// POST { passions: [ids] }    → { passions } : de 3 à 5 ; sinon 400
// (le lot D9, `decouvrir.md` section 23.2) GET rend aussi { perso } : sa passion à soi ({ mots, refusee? }) ;
// POST { action: "perso", mots } → { perso, bientot? } : écrite librement, relue (400 : « Choisis une autre passion ») ;
//                               des mots vides l'enlèvent ; ses vidéos sont cherchées tout de suite s'il le faut
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { choisirPassions, vuePassions } from "@/lib/direct/passions-serveur";
import { choisirPassionPerso } from "@/lib/direct/passion-perso-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  return NextResponse.json({ ok: true, ...(await vuePassions(supabase, moi.id)) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (p?.action === "perso") {
    const r = await choisirPassionPerso(supabase, moi, p.mots ?? "");
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, perso: r.perso ?? null, ...(r.bientot ? { bientot: true } : {}) }, { headers: sansCache });
  }
  const r = await choisirPassions(supabase, moi.id, p?.passions);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, passions: r.passions }, { headers: sansCache });
}
