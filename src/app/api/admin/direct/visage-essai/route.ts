// 📷 « TA FIGURINE, C'EST TON VISAGE » — L'ESSAI (le lot V0 ; `lib/direct/visage-essai-serveur.ts`,
// `docs/univers/decouvrir.md` section 28 ; la page `/admin/humain/visage`). L'administrateur seulement.
//
// GET                                          → { etat } : chaque personne, ses étapes, sa figurine, ses expressions
// POST { action: "ajouter", prenom, photo, accord, moi? } → { id, etat } : une personne (sa photo : une adresse `data:`)
// POST { action: "fabriquer", id }             → { fait?, etat } : un passage — sa figurine, sa découpe, une expression
// POST { action: "refaire", id, quoi }         → { etat } : `expressions`, ou `calques` (la découpe et les expressions)
// POST { action: "moi", id }                   → { etat } : c'est moi (ma figurine fera ma tête)
// POST { action: "effacer", id }               → { etat } : tout s'efface (la photo, la figurine, les expressions)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { ajouterPersonne, choisirMoi, effacerPersonne, etatEssaiVisage, fabriquerPersonne, refairePersonne } from "@/lib/direct/visage-essai-serveur";

export const dynamic = "force-dynamic";
// (une image : une minute environ)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatEssaiVisage(createAdminClient()) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403, headers: sansCache });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const supabase = createAdminClient();
  const r =
    p.action === "ajouter"
      ? await ajouterPersonne(supabase, p)
      : p.action === "fabriquer"
        ? await fabriquerPersonne(supabase, p.id, avant)
        : p.action === "refaire"
          ? await refairePersonne(supabase, p.id, p.quoi)
          : p.action === "moi"
            ? await choisirMoi(supabase, p.id)
            : p.action === "effacer"
              ? await effacerPersonne(supabase, p.id)
              : { erreur: "Action inconnue." };
  const etat = await etatEssaiVisage(supabase);
  if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: p.action === "fabriquer" && !/Qui \?/.test(r.erreur) ? 502 : 400, headers: sansCache });
  return NextResponse.json({ ok: true, ...("id" in r && r.id ? { id: r.id } : {}), ...("fait" in r && r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
}
