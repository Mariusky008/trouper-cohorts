// 📺 LA TÉLÉ DU DUO — LES CLIPS DE SECOURS (`lib/direct/tele-serveur.ts`) : la courte liste que la télé passe quand le
// duo ne s'est encore envoyé aucun lien, choisie par le propriétaire (jamais par une session). Réservé à
// l'administrateur (la page d'essais).
//
// GET                                   → { secours } : la liste (ses cinq premiers clips, tant qu'il n'en a pas rangé
//                                          d'autre)
// POST { action: "secours", liens }     → { secours, refuses } : une adresse YouTube par ligne (huit au plus) ; ce qui
//                                          n'en est pas une est refusé, et rendu
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { ecrireSecours, lireSecours } from "@/lib/direct/tele-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  return NextResponse.json({ ok: true, secours: await lireSecours(createAdminClient()) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (p?.action !== "secours") return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
  const r = await ecrireSecours(createAdminClient(), p.liens);
  if (!r.clips.length) return NextResponse.json({ error: "Aucune vidéo YouTube dans ces lignes.", refuses: r.refuses }, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, secours: r.clips, refuses: r.refuses }, { headers: sansCache });
}
