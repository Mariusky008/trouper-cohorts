// 🧸 LA NOUVELLE FIGURINE — chantier « Univers », lot 2 (`lib/direct/nouvelle-figurine.ts`,
// `nouvelle-figurine-serveur.ts`). D'ABORD RÉSERVÉE AU PROPRIÉTAIRE (une session d'administrateur) : les gens de Dax
// gardent leur figurine d'aujourd'hui jusqu'à son feu vert (l'interrupteur `univers-pour-tous.ts`).
//
// GET                                         → { etape, propositions, restantes, branche, figurine? }
// POST { action: "selfie", photo, moi, age, ville? } → { id } : son selfie (« C'est bien moi », « J'ai 15 ans ou plus ») ;
//                                               sans compte sur ce téléphone, sa ville (n'importe laquelle) ; sa
//                                               première proposition se fait après la réponse
// POST { action: "retoucher", de, demande }   → { id } : une retouche avec ses mots, sur une proposition
// POST { action: "refaire" }                  → { id } : « Elle ne me ressemble pas » (une nouvelle, d'après le selfie)
// POST { action: "valider", id }              → { version } : « C'est moi ! » — sa fiche est enregistrée ; ses autres
//                                               images (bouche ouverte, debout) et ses calques (le salon du duo, lot
//                                               S1) se font après la réponse
// Les images se font après la réponse : l'écran relit toutes les trois secondes.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { assurerHabitant, causeHabitant, habitantCourant } from "@/lib/direct/habitant";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { poserLePont } from "@/lib/direct/pont-univers-serveur";
import { villeEcrite } from "@/lib/direct/nouvelle-figurine";
import { motInterdit } from "@/lib/direct/mots-interdits";
import { villeSlug } from "@/lib/direct/ville";
import { calquesDeFigurine } from "@/lib/direct/calques-figurine-serveur";
import { envoyerSelfie, etatNouvelleFigurine, fabriquerProposition, fabriquerSesReferences, refaire, retoucher, valider } from "@/lib/direct/nouvelle-figurine-serveur";

export const dynamic = "force-dynamic";
// (une image à la fois après la réponse, une minute environ ; ses deux autres images après « C'est moi ! »)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Bientôt 🙂" };

export async function GET() {
  if (!(await universPermis())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  return NextResponse.json({ ok: true, ...(await etatNouvelleFigurine(supabase, moi?.id ?? null)) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await universPermis())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });

  if (p?.action === "selfie") {
    try {
      // 🏙️ (sans compte sur ce téléphone : sa ville, n'importe laquelle — elle le relie aux commerçants de la même ville)
      const deja = await habitantCourant(supabase);
      const ville = villeEcrite(p.ville);
      if (!deja && (!ville || motInterdit(ville))) return NextResponse.json({ error: "Dis-nous ta ville." }, { status: 400 });
      const moi = deja ?? (await assurerHabitant(supabase, villeSlug(ville)));
      if (!moi) {
        // (l'administrateur voit la cause sur l'écran même ; les autres, le message seul)
        const cause = (await isCurrentUserAdmin().catch(() => false)) ? ` (pour l’administrateur : ${causeHabitant() || "cause inconnue"})` : "";
        return NextResponse.json({ error: `Ton compte n’a pas pu être créé sur ce téléphone. Réessaie dans un instant.${cause}` }, { status: 502 });
      }
      const r = await envoyerSelfie(supabase, moi, p.photo, p.moi, p.age);
      const id = r.id;
      if (id) after(() => fabriquerProposition(supabase, moi.id, id, avant));
      return repondre(r, { id });
    } catch (e) {
      // (une erreur imprévue : sa cause dans les journaux du serveur, et un message qui dit l'étape)
      console.error("[nouvelle-figurine] selfie :", e instanceof Error ? e.stack || e.message : e);
      return NextResponse.json({ error: "Ton selfie n’a pas pu être reçu. Réessaie dans un instant." }, { status: 500 });
    }
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
    // (puis, l'interrupteur « Univers pour tous » allumé : elle devient sa figurine dans l'appli — `pont-univers-serveur.ts`)
    if (version) after(() => fabriquerSesReferences(supabase, moi.id, version, avant).then(() => poserLePont(supabase, moi)).catch(() => undefined));
    // (🎭 et ses calques — le corps, la tête, ses repères —, faits une fois pour le salon du duo et sa maison : `calques-figurine-serveur.ts`)
    if (version) after(() => calquesDeFigurine(supabase, moi.id).catch(() => null));
    return repondre(r, { version });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
