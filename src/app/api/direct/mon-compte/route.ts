// 👤 MON COMPTE — l'audit UX du 28 novembre 2026, lot 5 (`docs/audit-ux.md`, section 10 ; la page Moi, « Mon compte »).
//
// POST { action: "deconnecter" }              → { ok } : ce téléphone oublie sa figurine (le cookie part). Elle revient
//                                                avec « J'ai déjà une figurine » et le code reçu par e-mail, si elle est
//                                                sauvegardée ; sinon, elle est perdue (la page Moi l'a dit avant).
// POST { action: "supprimer", confirme: true } → { ok, fichiers, lignes, proches } : SON COMPTE SUPPRIMÉ, tout de suite et
//                                                pour de bon (`supprimer-compte-serveur.ts`) ; le cookie part ; le
//                                                balayage des espaces partagés commence juste après la réponse (la
//                                                suite, chaque nuit : `/api/cron/comptes-supprimes`).
import { NextResponse, after } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { COOKIE_HABITANT, habitantCourant } from "@/lib/direct/habitant";
import { balayerLesComptesSupprimes, supprimerLeCompte } from "@/lib/direct/supprimer-compte-serveur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function oublierCeTelephone() {
  const jar = await cookies();
  jar.delete(COOKIE_HABITANT);
}

export async function POST(req: Request) {
  const p = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (p.action === "deconnecter") {
    await oublierCeTelephone();
    return NextResponse.json({ ok: true });
  }
  if (p.action === "supprimer") {
    if (p.confirme !== true) return NextResponse.json({ error: "Coche « Je comprends que c’est définitif » pour confirmer." }, { status: 400 });
    const supabase = createAdminClient();
    const moi = await habitantCourant(supabase);
    if (!moi) return NextResponse.json({ error: "Aucun compte sur ce téléphone." }, { status: 401 });
    try {
      const bilan = await supprimerLeCompte(supabase, moi);
      await oublierCeTelephone();
      after(() => balayerLesComptesSupprimes(supabase, { fin: Date.now() + 45_000, seul: moi.id }).catch(() => undefined));
      return NextResponse.json({ ok: true, ...bilan });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "La suppression n’a pas abouti : réessaie." }, { status: 502 });
    }
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
