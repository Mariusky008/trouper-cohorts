// 🏠 « MA MAISON » : SES PIÈCES (`lib/direct/pieces-vivantes-serveur.ts`, `mesPieces`) — chacune entière, vivante (sa
// vue, sa vidéo, ses vedettes repérées), pour l'onglet « Ma maison » ; les siennes seulement (le cookie d'habitant).
//
// GET → { pieces: [{ piece, nom, vue, video?, objets?, vedettes }] } (aucune : une liste vide)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { habitantCourant } from "@/lib/direct/habitant";
import { mesPieces } from "@/lib/direct/pieces-vivantes-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  if (!(await universPermis())) return NextResponse.json({ error: "Bientôt 🙂" }, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  return NextResponse.json({ ok: true, pieces: moi ? await mesPieces(supabase, moi.id) : [] }, { headers: sansCache });
}
