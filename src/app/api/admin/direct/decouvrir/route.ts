// 📺 LA SÉLECTION DU JOUR, CÔTÉ ADMINISTRATEUR (`lib/direct/selection-serveur.ts` ; `/admin/humain/decouvrir` ; le lot D0).
//
// GET                                  → { branche, jour, themes: [{ theme, adultes, jeunes }] } : la sélection du jour
// POST { action: "refaire", theme? }   → { faites } : refaire un thème (ou tous) maintenant — 300 unités YouTube par
//                                         variante, sur les 10 000 du jour
// POST { action: "retirer", theme, id } → elle disparaît de toutes les télés du jour, et ne revient plus
// POST { action: "ajouter", theme, lien } → { video } : en tête du thème (adultes et 15-17 ans)
// (le lot D8) GET rend aussi { chaines } : les chaînes suivies, les plus suivies d'abord ;
// POST { action: "retirer-chaine", id } → elle ne peut plus être suivie ; ses vidéos disparaissent de toutes les télés
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { jourParis } from "@/lib/jour-paris";
import { themeDe } from "@/lib/direct/decouvrir";
import { ajouterVideo, faireLaSelection, retirerVideo, selectionsDuJour, youtubeBranche } from "@/lib/direct/selection-serveur";
import { chainesSuivies, retirerChaine } from "@/lib/direct/chaines-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const jour = jourParis();
  const supabase = createAdminClient();
  const [themes, chaines] = await Promise.all([selectionsDuJour(supabase, jour), chainesSuivies(supabase).catch(() => [])]);
  return NextResponse.json({ ok: true, branche: youtubeBranche(), jour, themes, chaines }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const jour = jourParis();
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  if (p?.action === "refaire") {
    const t = p.theme == null ? null : themeDe(p.theme);
    if (p.theme != null && !t) return repondre({ error: "Ce thème n’existe pas." });
    const r = await faireLaSelection(supabase, { jour, ...(t ? { themes: [t.id] } : {}), fin: Date.now() + 280_000 });
    return repondre(r.error ? { error: r.error, statut: 503 } : {}, { faites: r.faites });
  }
  if (p?.action === "retirer") return repondre(await retirerVideo(supabase, jour, p.theme, p.id));
  if (p?.action === "retirer-chaine") return repondre(await retirerChaine(supabase, p.id));
  if (p?.action === "ajouter") {
    const r = await ajouterVideo(supabase, jour, p.theme, p.lien);
    return repondre(r, { video: r.video });
  }
  return repondre({ error: "Action inconnue." });
}
