// 🧸 LA NOUVELLE FIGURINE — chantier « Univers », lot 2 (`lib/direct/nouvelle-figurine.ts`,
// `nouvelle-figurine-serveur.ts`). D'ABORD RÉSERVÉE AU PROPRIÉTAIRE (une session d'administrateur) : les gens de Dax
// gardent leur figurine d'aujourd'hui jusqu'à son feu vert.
//
// GET                                         → { etape, propositions, restantes, branche, figurine? }
// POST { action: "selfie", photo, moi, age }  → { id } : son selfie (« C'est bien moi », « J'ai 15 ans ou plus ») ; sa
//                                               première proposition se fait après la réponse
// POST { action: "retoucher", de, demande }   → { id } : une retouche avec ses mots, sur une proposition
// POST { action: "refaire" }                  → { id } : « Elle ne me ressemble pas » (une nouvelle, d'après le selfie)
// POST { action: "valider", id }              → { version } : « C'est moi ! » — sa fiche est enregistrée ; ses autres
//                                               images (bouche ouverte, debout) se font après la réponse
// Les images se font après la réponse : l'écran relit toutes les trois secondes.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { envoyerSelfie, etatNouvelleFigurine, fabriquerProposition, fabriquerSesReferences, refaire, retoucher, valider } from "@/lib/direct/nouvelle-figurine-serveur";

export const dynamic = "force-dynamic";
// (une image à la fois après la réponse, une minute environ ; ses deux autres images après « C'est moi ! »)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Bientôt 🙂" };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  return NextResponse.json({ ok: true, ...(await etatNouvelleFigurine(supabase, moi?.id ?? null)) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });

  if (p?.action === "selfie") {
    const moi = await assurerHabitant(supabase, "dax");
    if (!moi) return NextResponse.json({ error: "Ça n’a pas marché. Réessaie." }, { status: 502 });
    const r = await envoyerSelfie(supabase, moi, p.photo, p.moi, p.age);
    const id = r.id;
    if (id) after(() => fabriquerProposition(supabase, moi.id, id, avant));
    return repondre(r, { id });
  }
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Envoie d’abord ton selfie." }, { status: 400 });
  if (p?.action === "retoucher" || p?.action === "refaire") {
    const r = p.action === "retoucher" ? await retoucher(supabase, moi.id, p.de, p.demande) : await refaire(supabase, moi.id);
    const id = r.id;
    if (id) after(() => fabriquerProposition(supabase, moi.id, id, avant));
    return repondre(r, { id });
  }
  if (p?.action === "valider") {
    const r = await valider(supabase, moi.id, p.id);
    const version = r.version;
    if (version) after(() => fabriquerSesReferences(supabase, moi.id, version, avant));
    return repondre(r, { version });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
