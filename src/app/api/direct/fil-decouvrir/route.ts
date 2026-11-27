// 🎞️ DÉCOUVRIR, LE FIL « DE PIÈCE EN PIÈCE » (le lot F1, 23 novembre 2026 ; `lib/direct/fil-decouvrir.ts`, `fil-decouvrir-serveur.ts`,
// `docs/univers/fil.md`) — le sien seulement (le cookie d'habitant).
//
// GET → { fil } : sa figurine, ses pièces dans l'ordre (les salons où il y a quelqu'un, les figurines posées dans Autour,
//       l'humeur de ses proches), ce qui l'attend ailleurs (`invitation`, `demandes`) ; `age` : dire d'abord s'il a 18 ans.
// Réagir dans un salon passe par la route des salons (`entrer`, puis `ecrire` une réaction).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantOuPanne } from "@/lib/direct/habitant";
import { filDecouvrir } from "@/lib/direct/fil-decouvrir-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  const supabase = createAdminClient();
  // (27 novembre 2026) 401 : pas de figurine sur ce navigateur ; 503 : la base n'a pas répondu — l'écran dit lequel
  const { moi, panne } = await habitantOuPanne(supabase);
  if (panne) return NextResponse.json({ error: "Le serveur ne répond pas pour l’instant.", panne: true }, { status: 503, headers: sansCache });
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone.", sansFigurine: true }, { status: 401, headers: sansCache });
  try {
    return NextResponse.json({ ok: true, fil: await filDecouvrir(supabase, moi) }, { headers: sansCache });
  } catch (e) {
    console.error("[fil-decouvrir]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Le serveur ne répond pas pour l’instant.", panne: true }, { status: 503, headers: sansCache });
  }
}
