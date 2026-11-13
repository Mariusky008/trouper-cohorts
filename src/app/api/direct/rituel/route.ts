// ☀️ LE RITUEL DU JOUR — lots R1 et R2 : l'humeur du jour, le mot des figurines sur cette humeur, et le mot de la fin
// (`lib/direct/rituel.ts`, `rituel-serveur.ts`).
//
// GET                                → { jour, humeur, mots, ecrits, attente, parle, proches, fins, finsAttente } : son
//                                       humeur du jour, les mots que les figurines de ses proches lui ont laissés, ce que
//                                       SA figurine a écrit en son nom, si elles sont en train d'écrire, « Ma figurine
//                                       parle pour moi » ; 🌙 ses mots de la fin de cette nuit (lot R2) — à la première
//                                       ouverture du jour, ils se préparent après la réponse (`finsAttente`)
// GET ?avec=<clé>                    → { avec } : le rituel avec ce proche (leurs humeurs, le mot de chaque figurine à
//                                       l'autre), en haut de leur conversation
// POST { action: "humeur", visage }  → { humeur, ecrire, reponse } : il choisit son humeur ; `ecrire` : les figurines
//                                       de ses proches écrivent (après la réponse, quelques secondes) ; `reponse` : ☀️ ce
//                                       que SA figurine lui répond, tout de suite (lot R3, `humeur-reponse.ts`)
// (GET rend aussi `reponse` : celle d'aujourd'hui, pour la relire)
// POST { action: "effacer", cle, id } → { ok } : il efface le mot que sa figurine a écrit à ce proche
// POST { action: "parle", oui }      → { parle } : « Ma figurine parle pour moi » (dans « Moi »)
// POST { action: "effacer-fin", cle } → { ok } : 🌙 il efface leur mot de la fin de cette nuit (pour les deux)
// Un proche se désigne toujours par sa clé de profil, jamais par son identifiant.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { choisirHumeur, choisirParle, ecrireLesMots, effacerFin, effacerMot, monRituel, preparerSesFins, rituelAvec } from "@/lib/direct/rituel-serveur";
import { repondreAHumeur, reponseDuJour } from "@/lib/direct/humeur-reponse-serveur";
import { noterMesConversations } from "@/lib/direct/etagere-serveur";

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
  const [{ aPreparer, ...r }, reponse] = await Promise.all([monRituel(supabase, moi), reponseDuJour(supabase, moi.id).catch(() => null)]);
  // 🌙 ses mots de la fin de ce matin : préparés une fois, après la réponse
  if (aPreparer) after(() => preparerSesFins(supabase, moi.id).catch(() => []));
  // 📌 et leurs figurines lisent les échanges d'hier qui se sont posés (l'étagère, lot E1)
  if (aPreparer) after(() => noterMesConversations(supabase, moi).catch(() => 0));
  return NextResponse.json({ ok: true, ...r, reponse: reponse && reponse.humeur === r.humeur ? reponse : null }, { headers: sansCache });
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
    // ☀️ et SA figurine lui répond, tout de suite (des phrases écrites d'avance : ni IA, ni attente)
    const reponse = await repondreAHumeur(supabase, moi.id, humeur).catch(() => null);
    return NextResponse.json({ ok: true, humeur, ecrire: Boolean(r.ecrire), reponse }, { headers: sansCache });
  }
  if (p?.action === "effacer" || p?.action === "effacer-fin") {
    const r = p.action === "effacer" ? await effacerMot(supabase, moi, p.cle, p.id) : await effacerFin(supabase, moi, p.cle);
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
  if (p?.action === "parle") return NextResponse.json({ ok: true, ...(await choisirParle(supabase, moi, p.oui)) }, { headers: sansCache });
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
