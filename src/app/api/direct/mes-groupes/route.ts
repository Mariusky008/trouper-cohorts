// 👥 MES GROUPES (le lot G1, 26 novembre 2026 ; `docs/univers/mes-groupes.md`) — le sien seulement (le cookie d'habitant).
//
// GET → { invitations, demandes, seances } : la rangée « Avec mes proches », faite de ce qui existait déjà —
//       🎬 les invitations devant la télé d'un proche (lot D2), 👯 les demandes de proche (lot D5), et les séances en
//       cours chez mes proches (lot F3). Les gestes (« Venir », « Pas maintenant », « Accepter », « Demander à les
//       rejoindre ») passent par la route des salons, comme avant.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { mesDemandes, mesInvitations, seancesDesProches } from "@/lib/direct/salons-ouverts-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const [invitations, demandes, seances] = await Promise.all([
    mesInvitations(supabase, moi).catch(() => []),
    mesDemandes(supabase, moi).catch(() => []),
    seancesDesProches(supabase, moi).catch(() => []),
  ]);
  return NextResponse.json({ ok: true, invitations, demandes, seances }, { headers: sansCache });
}
