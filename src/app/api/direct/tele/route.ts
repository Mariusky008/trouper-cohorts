// 📺 LA TÉLÉ DE LA PIÈCE DU DUO (`lib/direct/tele.ts`, `tele-serveur.ts`, `docs/univers/piece-du-duo.md`) : ce qu'elle
// passe chez lui, avec ce proche.
//
// GET ?avec=<clé de profil> → { programme, secours } : le dernier lien vidéo qu'ils se sont envoyé (YouTube : lu dans
//                              l'écran ; TikTok, Instagram : son aperçu, « ▶ Ouvrir ») ; sinon le clip de secours du
//                              jour ; sinon, éteinte. `secours` : la liste, si une vidéo refuse d'être lue hors de YouTube.
// POST { avec, message }    → { programme } (lot S6, le salon du duo : « 📺 La mettre à la télé ? ») : une vidéo de leur
//                              conversation, ou un lien YouTube, TikTok ou Instagram, passe à leur télé, chez les deux ;
//                              le pouls bat. 404 : un message inconnu ; 422 : un message qui ne passe pas à la télé.
// Les règles du talkie : la session vérifiée, deux proches qui se sont ajoutés, sinon 403 ; jamais l'identifiant d'un
// habitant, seulement sa clé.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { mettreALaTele, teleDuDuo } from "@/lib/direct/tele-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 401, headers: sansCache });
  const r = await teleDuDuo(supabase, moi.id, new URL(request.url).searchParams.get("avec"));
  if (!r.programme) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, programme: r.programme, secours: r.secours ?? [] }, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 401, headers: sansCache });
  const corps = (await request.json().catch(() => null)) as { avec?: unknown; message?: unknown } | null;
  const r = await mettreALaTele(supabase, moi, corps?.avec, corps?.message);
  if (!r.programme) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, programme: r.programme }, { headers: sansCache });
}
