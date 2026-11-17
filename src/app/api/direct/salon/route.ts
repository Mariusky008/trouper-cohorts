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
 * 🚪 LA PIÈCE DU DUO (lot S2, section 4.13), pour les deux proches (le cookie d'habitant) :
 * GET ?pieces=<clé> → { catalogue } : les pièces prêtes, chacune avec sa scène (les figurines posées), celle qu'on propose
 *      d'abord (la sienne), celle du duo.
 * POST { action: "piece", cle, piece } → { piece } (la pièce change) ou { invitation } (l'autre est là : il est invité).
 * POST { action: "venir", cle, oui } → { piece } (« Venir ») ou { ok } (« Pas maintenant »).
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { cataloguePieces, choisirPieceDuo, noterVitesse, poserEmplacementsSalon, repondreInvitation, statsVitesse } from "@/lib/direct/salon-serveur";
import { calquesDeFigurine } from "@/lib/direct/calques-figurine-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  // 🚪 les pièces où s'installer (les deux proches)
  const pieces = new URL(request.url).searchParams.get("pieces");
  if (pieces) {
    const supabase = createAdminClient();
    const moi = await habitantCourant(supabase);
    if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 403, headers: sansCache });
    const r = await cataloguePieces(supabase, moi, pieces);
    return r.catalogue ? NextResponse.json({ ok: true, catalogue: r.catalogue }, { headers: sansCache }) : NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  }
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
  // 🚪 s'installer dans une pièce ; répondre à une invitation (la pièce change : le pouls bat, l'autre la verra)
  if (p?.action === "piece" || p?.action === "venir") {
    const moi = await habitantCourant(supabase);
    if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 403, headers: sansCache });
    const r = p.action === "piece" ? await choisirPieceDuo(supabase, moi, p.cle, p.piece) : await repondreInvitation(supabase, moi, p.cle, p.oui);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, ...("piece" in r && r.piece ? { piece: r.piece } : {}), ...("invitation" in r && r.invitation ? { invitation: true } : {}) }, { headers: sansCache });
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
