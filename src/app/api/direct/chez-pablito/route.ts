// 🏡 CHEZ PABLITO — l'univers de Pablito, celui de la bienvenue (`lib/direct/chez-pablito-serveur.ts`). Ouvert à tous :
// la bienvenue se joue avant tout compte.
//
// GET → { univers: { decor, figurine?, place?, hote?, cles, saison?, decorVivant? } | null } — `null` tant que le
//       propriétaire n'a pas adopté son univers comme celui de Pablito (la bienvenue garde alors son ancienne scène)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { universDePablito } from "@/lib/direct/chez-pablito-serveur";

export const dynamic = "force-dynamic";

export async function GET() {
  const univers = await universDePablito(createAdminClient()).catch(() => null);
  // (les adresses signées valent une heure : gardé cinq minutes au plus, en route comme dans le téléphone)
  return NextResponse.json({ ok: true, univers }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}
