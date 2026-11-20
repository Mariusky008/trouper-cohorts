// 📷 LE SALON D'ESSAI DU VISAGE (le lot V0 ; `lib/direct/visage-essai-serveur.ts`, `docs/univers/decouvrir.md`
// section 28 ; la page `/univers/visage`) — l'administrateur seulement, comme les autres adresses d'essai.
//
// GET → { salon } : les figurines prêtes (« moi » d'abord), le décor (un gradin validé), une vidéo pour commencer
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { salonEssai } from "@/lib/direct/visage-essai-serveur";

export const dynamic = "force-dynamic";
const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
  return NextResponse.json({ ok: true, salon: await salonEssai(createAdminClient()) }, { headers: sansCache });
}
