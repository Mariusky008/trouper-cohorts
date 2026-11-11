// 🧪 LES ESSAIS DU LOT 0 (chantier « Univers »), CÔTÉ ADMIN — `/admin/humain/univers-essais`, voir
// `lib/direct/univers-essais.ts` et `univers-essais-serveur.ts`. Réservé à l'administrateur.
//
// GET                                               → { personnes, resultats, imagesDuJour, plafond, branche }
// POST { action: "personne", nom, accord, photo }   → { id } : une personne d'essai (l'accord coché, sinon rien) ; ses
//                                                     traits sont décrits après la réponse
// POST { action: "figurine", personne, variantes? } → { ids } : sa figurine du nouveau style, les variantes demandées
// POST { action: "constance", source, variantes? }  → { ids } : la même figurine, une chose qui change
// POST { action: "univers", fiches, directions, texte? } → { ids } : des décors (sans figurine) : fiches × directions
// POST { action: "retouche", decor, texte? }        → { ids } : le même décor, une chose qui change
// POST { action: "vedette", decor, figurine }       → { ids } : le moteur pose la figurine dans le décor
// POST { action: "avis", id, avis, note }           → { ok } : 👍 / 👎 et une note
// POST { action: "effacer", id }                    → { ok } : une image
// POST { action: "effacer-personne", id }           → { ok } : une personne, son selfie et toutes ses images
// Les images se font après la réponse (`after`) : la page relit toutes les cinq secondes.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import {
  ajouterPersonne,
  decrireSesTraits,
  demanderConstance,
  demanderFigurines,
  demanderRetouche,
  demanderUnivers,
  demanderVedette,
  donnerAvis,
  effacerPersonne,
  effacerResultat,
  etatEssais,
  fabriquer,
} from "@/lib/direct/univers-essais-serveur";

export const dynamic = "force-dynamic";
// (les images se font après la réponse : trois à la fois, une à deux minutes chacune)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  return NextResponse.json({ ok: true, ...(await etatEssais(createAdminClient())) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });

  if (p?.action === "personne") {
    const r = await ajouterPersonne(supabase, p.nom, p.accord, p.photo);
    const id = r.id;
    if (id) after(() => decrireSesTraits(supabase, id).catch(() => undefined));
    return repondre(r, { id });
  }
  if (p?.action === "figurine" || p?.action === "constance" || p?.action === "univers" || p?.action === "retouche" || p?.action === "vedette") {
    const r =
      p.action === "figurine"
        ? await demanderFigurines(supabase, p.personne, p.variantes)
        : p.action === "constance"
          ? await demanderConstance(supabase, p.source, p.variantes)
          : p.action === "univers"
            ? await demanderUnivers(supabase, p.fiches, p.directions, p.texte)
            : p.action === "retouche"
              ? await demanderRetouche(supabase, p.decor, p.texte)
              : await demanderVedette(supabase, p.decor, p.figurine);
    const demandes = r.demandes;
    if (demandes?.length) after(() => fabriquer(supabase, demandes).catch(() => undefined));
    return repondre(r, { ids: demandes?.map((d) => d.id) ?? [] });
  }
  if (p?.action === "avis") return repondre(await donnerAvis(supabase, p.id, p.avis, p.note));
  if (p?.action === "effacer") return repondre(await effacerResultat(supabase, p.id));
  if (p?.action === "effacer-personne") return repondre(await effacerPersonne(supabase, p.id));
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
