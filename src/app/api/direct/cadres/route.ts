// 🖼️ LES CADRES DE LA PIÈCE DU DUO (`lib/direct/cadres.ts`, `cadres-serveur.ts`, `docs/univers/salon-du-duo.md` 4.9 ; le
// lot S6) : les photos de leur conversation accrochées au mur.
//
// GET ?avec=<clé de profil>         → { cadres } : ce qui est accroché (numéro du cadre, la photo signée, par qui, quand).
// POST { avec, message, cadre }     → { cadres } : accrocher une photo de leur conversation dans un cadre (de 0 à 3 ;
//                                     celle qui y était s'en va), chez les deux ; le pouls bat. 404 : un message inconnu ;
//                                     422 : ce n'est pas une photo ; 400 : pas de cadre.
// Les règles du talkie : la session vérifiée, deux proches qui se sont ajoutés, sinon 403 ; jamais l'identifiant d'un
// habitant, seulement sa clé.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { accrocher, lesCadres } from "@/lib/direct/cadres-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 401, headers: sansCache });
  const r = await lesCadres(supabase, moi.id, new URL(request.url).searchParams.get("avec"));
  if (!r.cadres) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, cadres: r.cadres }, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 401, headers: sansCache });
  const corps = (await request.json().catch(() => null)) as { avec?: unknown; message?: unknown; cadre?: unknown } | null;
  const r = await accrocher(supabase, moi, corps?.avec, corps?.message, corps?.cadre);
  if (!r.cadres) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, cadres: r.cadres }, { headers: sansCache });
}
