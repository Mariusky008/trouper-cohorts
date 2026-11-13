// 🧹 REMETTRE L'APPLI À ZÉRO, CÔTÉ ADMIN (`lib/direct/remise-a-zero-serveur.ts`) — réservé à l'administrateur.
//
// GET                                   → { compte } : ce qui partirait, table par table et seau par seau (rien n'est effacé)
// POST { confirmation: "EFFACER" }      → { fichiers, lignes, reste } : un lot (les fichiers d'abord, puis les lignes) ;
//                                         la page rappelle tant que `reste`
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { compterLaRemise, effacerUnLot } from "@/lib/direct/remise-a-zero-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  return NextResponse.json({ ok: true, compte: await compterLaRemise(createAdminClient()) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const p = (await request.json().catch(() => null)) as { confirmation?: unknown } | null;
  const r = await effacerUnLot(createAdminClient(), p?.confirmation);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 500, headers: sansCache });
  return NextResponse.json({ ok: true, fichiers: r.fichiers ?? 0, lignes: r.lignes ?? 0, reste: Boolean(r.reste) }, { headers: sansCache });
}
