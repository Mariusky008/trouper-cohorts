// 🚪 LES VISITES ET LES SOUVENIRS — chantier « Univers », lot 6 (`lib/direct/visites.ts`, `visites-serveur.ts`).
//
// GET ?cle=<clé de profil>                        → { vue } : ce que voit celui qui entre (selon qui peut entrer)
// GET ?moi=1                                       → { visites } : chez moi — qui est passé, les souvenirs, qui entre
// GET ?publics=1                                   → { publics } : les univers ouverts à tous (« Découvrir », lot 7)
// POST { action: "frapper", cle }                  → frapper à la porte (il est prévenu, une fois par jour)
// POST { action: "souvenir", cle, objet, mot? }    → laisser un souvenir (ses proches seulement ; il l'accepte ou non)
// POST { action: "signaler", cle }                 → signaler un univers (pour l'équipe)
// POST { action: "decider", id, oui }              → chez moi : accepter (il se pose) ou refuser un souvenir
// POST { action: "retirer", id }                   → chez moi : retirer un souvenir posé
// POST { action: "vu" }                            → chez moi : j'ai découvert qui est passé (plus « nouveau »)
// POST { action: "visibilite", visibilite, adulte? } → chez moi : qui peut entrer (« tous » : 18 ans ou plus déclarés)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { choisirVisibilite, deciderSouvenir, frapper, laisserSouvenir, marquerVisitesVues, mesVisites, retirerSouvenir, signalerUnivers, universPublics, visiterUnivers } from "@/lib/direct/visites-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine." };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  const q = new URL(request.url).searchParams;
  if (q.get("publics")) return NextResponse.json({ ok: true, publics: await universPublics(supabase) }, { headers: sansCache });
  if (q.get("moi")) {
    if (!moi) return NextResponse.json(SANS_COMPTE, { status: 403 });
    const v = await mesVisites(supabase, moi.id);
    return v ? NextResponse.json({ ok: true, visites: v }, { headers: sansCache }) : NextResponse.json({ error: "Crée d’abord ton univers." }, { status: 404, headers: sansCache });
  }
  return NextResponse.json({ ok: true, vue: await visiterUnivers(supabase, moi, q.get("cle")) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 403 });
  const r =
    p?.action === "frapper"
      ? await frapper(supabase, moi, p.cle)
      : p?.action === "souvenir"
        ? await laisserSouvenir(supabase, moi, p.cle, p.objet, p.mot)
        : p?.action === "signaler"
          ? await signalerUnivers(supabase, moi, p.cle)
          : p?.action === "decider"
            ? await deciderSouvenir(supabase, moi.id, p.id, p.oui)
            : p?.action === "retirer"
              ? await retirerSouvenir(supabase, moi.id, p.id)
              : p?.action === "visibilite"
                ? await choisirVisibilite(supabase, moi.id, p.visibilite, p.adulte)
                : p?.action === "vu"
                  ? await marquerVisitesVues(supabase, moi.id)
                  : { error: "Demande incomplète.", statut: 400 };
  return NextResponse.json(r.error ? { error: r.error } : { ok: true }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
}
