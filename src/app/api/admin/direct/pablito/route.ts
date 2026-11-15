// 🧑 PABLITO AU NOUVEAU STYLE, CÔTÉ ADMIN — la bascule « Univers pour tous » (`lib/direct/pablito-univers-serveur.ts`).
// Réservé à l'administrateur.
//
// GET                          → { etat } : adopté ou non, d'où (sa version), son image, les images faites, celles qui restent
// POST { action: "adopter" }   → { repris, etat } : SA figurine du nouveau style (celle de ce téléphone, son cookie
//                                d'habitant) devient Pablito ; ses visages déjà faits sont repris
// POST { action: "fabriquer" } → { fait?, etat } : un passage — la prochaine image qui manque (elles se font aussi
//                                d'elles-mêmes, à la première demande, une fois l'interrupteur allumé)
//
// 🏡 L'UNIVERS DE PABLITO, celui de la bienvenue (`lib/direct/chez-pablito-serveur.ts`) :
// GET ?chez=1                          → { chez } : adopté ou non, quand, et ce que la bienvenue montrera
// POST { action: "adopter-univers" }   → { chez } : SON univers (celui de ce téléphone) devient celui de Pablito
// POST { action: "retirer-univers" }   → { chez } : la bienvenue se passe de son univers
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { adopterSaFigurine, etatDePablito, fabriquerPablito } from "@/lib/direct/pablito-univers-serveur";
import { adopterSonUnivers, etatChezPablito, retirerSonUnivers } from "@/lib/direct/chez-pablito-serveur";

export const dynamic = "force-dynamic";
// (un passage : une image du moteur)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  if (new URL(request.url).searchParams.get("chez") === "1") return NextResponse.json({ ok: true, chez: await etatChezPablito(supabase) }, { headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatDePablito(supabase) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + (maxDuration - 20) * 1000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  if (p?.action === "adopter") {
    const moi = await habitantCourant(supabase);
    if (!moi) return NextResponse.json({ error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." }, { status: 400 });
    const r = await adopterSaFigurine(supabase, moi.id);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, repris: r.repris ?? 0, etat: await etatDePablito(supabase) }, { headers: sansCache });
  }
  if (p?.action === "adopter-univers") {
    const moi = await habitantCourant(supabase);
    if (!moi) return NextResponse.json({ error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." }, { status: 400 });
    const r = await adopterSonUnivers(supabase, moi.id);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, chez: await etatChezPablito(supabase) }, { headers: sansCache });
  }
  if (p?.action === "retirer-univers") {
    await retirerSonUnivers(supabase);
    return NextResponse.json({ ok: true, chez: await etatChezPablito(supabase) }, { headers: sansCache });
  }
  if (p?.action === "fabriquer") {
    const r = await fabriquerPablito(supabase, avant);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat: await etatDePablito(supabase) }, { status: 502 });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat: await etatDePablito(supabase) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
