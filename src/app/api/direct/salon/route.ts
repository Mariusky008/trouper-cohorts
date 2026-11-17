/**
 * ⚡ LA VITESSE DU SALON (`docs/univers/salon-du-duo.md`, section 7.6 ; lot S0b ; `lib/direct/salon-serveur.ts`).
 *
 * POST { action: "vitesse", plaque?, pret, deja, ecran? } → { ok } : une ouverture mesurée par le téléphone (la plaque
 *      à l'écran et la scène prête, en ms depuis le toucher ; `deja` : conversation déjà vue sur ce téléphone). Envoyée
 *      une fois par ouverture, après l'animation d'arrivée. Une session d'habitant (ou d'administrateur).
 * GET ?vitesse=1 (administrateur) → { vitesse } : les sept derniers jours (médiane, 90 %, par appareil).
 * POST { action: "calques" } (lot S1) → { calques } : 🎭 les calques de sa figurine (le corps, la tête et ses repères),
 *      découpés une fois, à adresse stable — dans le cadre de la figurine (`figurine-calques.ts`).
 * POST { action: "emplacements", piece, fenetreCoins?, fentes? } (administrateur, lot S1) → { emplacements } : ✋ les
 *      carreaux de la fenêtre et les fentes de l'étagère d'une pièce, posés à la main — seulement ces deux-là changent
 *      dans son relevé.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { noterVitesse, poserEmplacementsSalon, statsVitesse } from "@/lib/direct/salon-serveur";
import { calquesDeFigurine } from "@/lib/direct/calques-figurine-serveur";

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
  if (p?.action === "calques") {
    const moi = await habitantCourant(supabase);
    if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 403, headers: sansCache });
    const f = await calquesDeFigurine(supabase, moi.id).catch(() => null);
    if (!f) return NextResponse.json({ error: "Ta figurine du nouveau style n’est pas encore faite." }, { status: 404, headers: sansCache });
    // (sans ses chemins dans le seau : l'écran n'a besoin que des adresses)
    return NextResponse.json({ ok: true, calques: { ...f, sources: undefined } }, { headers: sansCache });
  }
  if (!(await habitantCourant(supabase)) && !(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
  if (p?.action !== "vitesse") return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
  const ok = await noterVitesse(supabase, p, request.headers.get("user-agent") ?? "").catch(() => false);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400, headers: sansCache });
}
