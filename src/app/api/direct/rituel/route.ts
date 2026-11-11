// ☀️ LE RITUEL DU JOUR — lot R1 : l'humeur du jour, et le mot des figurines sur cette humeur (`lib/direct/rituel.ts`,
// `rituel-serveur.ts`).
//
// GET                                → { jour, humeur, mots, ecrits, attente, parle, proches } : son humeur du jour, les
//                                       mots que les figurines de ses proches lui ont laissés, ce que SA figurine a écrit
//                                       en son nom, si elles sont en train d'écrire, « Ma figurine parle pour moi »
// GET ?avec=<clé>                    → { avec } : le rituel avec ce proche (leurs humeurs, le mot de chaque figurine à
//                                       l'autre), en haut de leur conversation
// POST { action: "humeur", visage }  → { humeur, ecrire } : il choisit son humeur ; `ecrire` : les figurines de ses
//                                       proches écrivent (après la réponse, quelques secondes)
// POST { action: "effacer", cle, id } → { ok } : il efface le mot que sa figurine a écrit à ce proche
// POST { action: "parle", oui }      → { parle } : « Ma figurine parle pour moi » (dans « Moi »)
// Un proche se désigne toujours par sa clé de profil, jamais par son identifiant.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { choisirHumeur, choisirParle, ecrireLesMots, effacerMot, monRituel, rituelAvec } from "@/lib/direct/rituel-serveur";

export const dynamic = "force-dynamic";
// (les figurines écrivent après la réponse : le petit modèle de texte, une demande pour toutes)
export const maxDuration = 60;

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine." };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 403 });
  const avec = new URL(request.url).searchParams.get("avec");
  if (avec) {
    const r = await rituelAvec(supabase, moi, avec);
    if (!r.avec) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, avec: r.avec }, { headers: sansCache });
  }
  return NextResponse.json({ ok: true, ...(await monRituel(supabase, moi)) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 403 });
  if (p?.action === "humeur") {
    const r = await choisirHumeur(supabase, moi, p.visage);
    if (!r.humeur) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    const humeur = r.humeur;
    // ✍️ les figurines de ses proches écrivent : après la réponse, jamais bloquant
    if (r.ecrire) after(() => ecrireLesMots(supabase, moi, humeur).catch(() => 0));
    return NextResponse.json({ ok: true, humeur, ecrire: Boolean(r.ecrire) }, { headers: sansCache });
  }
  if (p?.action === "effacer") {
    const r = await effacerMot(supabase, moi, p.cle, p.id);
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
  if (p?.action === "parle") return NextResponse.json({ ok: true, ...(await choisirParle(supabase, moi, p.oui)) }, { headers: sansCache });
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
