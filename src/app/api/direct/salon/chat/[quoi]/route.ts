/**
 * 🐾 LE CHAT DU SALON, À ADRESSE STABLE (`lib/direct/salon-chat-serveur.ts` ; `docs/univers/salon-du-duo.md`, sections
 * 4.5 et 7.2 ; lot S3).
 *
 * GET /api/direct/salon/chat/<boucle> (ou `son`) → renvoie (302) vers la vidéo (ou le son) signée pour sept jours ; le
 * téléphone garde ce renvoi six jours (`private, max-age=518400`) : le chat ne se retélécharge pas à chaque conversation.
 * Une session d'habitant (ou d'administrateur) suffit : le chat est le même pour tous.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { GARDE_RENVOI_S, QUOI_CHAT, adresseDuChat } from "@/lib/direct/salon-chat-serveur";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ quoi: string }> };
const sansCache = { "cache-control": "private, no-store" };

export async function GET(_request: Request, { params }: RouteContext) {
  const { quoi } = await params;
  if (!QUOI_CHAT.test(quoi)) return NextResponse.json({ error: "Ce fichier n’existe pas." }, { status: 404, headers: sansCache });
  const supabase = createAdminClient();
  if (!(await habitantCourant(supabase)) && !(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
  const url = await adresseDuChat(supabase, quoi);
  if (!url) return NextResponse.json({ error: "Ce fichier n’existe pas." }, { status: 404, headers: sansCache });
  return new NextResponse(null, { status: 302, headers: { location: url, "cache-control": `private, max-age=${GARDE_RENVOI_S}` } });
}
