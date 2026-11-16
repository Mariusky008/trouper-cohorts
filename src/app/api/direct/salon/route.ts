/**
 * ⚡ LA VITESSE DU SALON (`docs/univers/salon-du-duo.md`, section 7.6 ; lot S0b ; `lib/direct/salon-serveur.ts`).
 *
 * POST { action: "vitesse", plaque?, pret, deja, ecran? } → { ok } : une ouverture mesurée par le téléphone (la plaque
 *      à l'écran et la scène prête, en ms depuis le toucher ; `deja` : conversation déjà vue sur ce téléphone). Envoyée
 *      une fois par ouverture, après l'animation d'arrivée. Une session d'habitant (ou d'administrateur).
 * GET ?vitesse=1 (administrateur) → { vitesse } : les sept derniers jours (médiane, 90 %, par appareil).
 * POST { action: "emplacements", piece, fenetreCoins?, lampes?, table?, fentes? } (administrateur, lot S1) →
 *      { emplacements } : ✋ les emplacements du salon d'une pièce, posés à la main — seulement ces quatre-là changent
 *      dans son relevé.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { noterVitesse, poserEmplacementsSalon, statsVitesse } from "@/lib/direct/salon-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
  if (!new URL(request.url).searchParams.get("vitesse")) return NextResponse.json({ error: "Quoi ?" }, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, vitesse: await statsVitesse(createAdminClient()) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  if (p?.action === "emplacements") {
    if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
    const r = await poserEmplacementsSalon(supabase, p.piece, p);
    if (!r.emplacements) return NextResponse.json({ error: r.erreur }, { status: 400, headers: sansCache });
    return NextResponse.json({ ok: true, emplacements: r.emplacements }, { headers: sansCache });
  }
  if (!(await habitantCourant(supabase)) && !(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
  if (p?.action !== "vitesse") return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
  const ok = await noterVitesse(supabase, p, request.headers.get("user-agent") ?? "").catch(() => false);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400, headers: sansCache });
}
