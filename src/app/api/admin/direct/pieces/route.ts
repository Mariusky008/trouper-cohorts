// 🏠 LES PIÈCES EN PANORAMA, L'ESSAI DU SALON (`lib/direct/pieces-serveur.ts`) — réservé à l'administrateur, sur SON
// univers (le cookie d'habitant de ce téléphone).
//
// GET                                   → { etat } : ce qui est fait (signé), ce qui reste, sa figurine assise
// POST { action: "fabriquer" }          → { fait?, etat } : un passage — la prochaine étape (le centre, la gauche, la
//                                         droite : une image du moteur ; le panorama : l'assemblage)
// POST { action: "refaire", etape }     → { etat } : l'étape et ce qui en dépend s'effacent
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { etatDuSalon, fabriquerLeSalon, refaireDuSalon } from "@/lib/direct/pieces-serveur";

export const dynamic = "force-dynamic";
// (un passage : une image du moteur)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };
const SANS_FIGURINE = { error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatDuSalon(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + (maxDuration - 20) * 1000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  if (p?.action === "fabriquer") {
    const r = await fabriquerLeSalon(supabase, moi.id, avant);
    const etat = await etatDuSalon(supabase, moi.id);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    const r = await refaireDuSalon(supabase, moi.id, p.etape);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400, headers: sansCache });
    return NextResponse.json({ ok: true, etat: await etatDuSalon(supabase, moi.id) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
