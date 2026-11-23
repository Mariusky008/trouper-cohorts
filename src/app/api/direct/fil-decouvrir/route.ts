// 🎞️ DÉCOUVRIR, LE FIL « DE PIÈCE EN PIÈCE » (le lot F1, 23 novembre 2026 ; `lib/direct/fil-decouvrir.ts`, `fil-decouvrir-serveur.ts`,
// `docs/univers/fil.md`) — le sien seulement (le cookie d'habitant).
//
// GET → { fil } : sa figurine, ses pièces dans l'ordre (les salons où il y a quelqu'un, les figurines posées dans Autour,
//       l'humeur de ses proches), ce qui l'attend ailleurs (`invitation`, `demandes`) ; `age` : dire d'abord s'il a 18 ans.
// Réagir dans un salon passe par la route des salons (`entrer`, puis `ecrire` une réaction).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { filDecouvrir } from "@/lib/direct/fil-decouvrir-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  return NextResponse.json({ ok: true, fil: await filDecouvrir(supabase, moi) }, { headers: sansCache });
}
