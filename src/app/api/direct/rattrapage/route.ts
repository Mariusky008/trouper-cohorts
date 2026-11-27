// ⏪ LE RATTRAPAGE D'UNE SÉANCE (`lib/direct/rattrapage.ts`, `rattrapage-serveur.ts` ; `docs/univers/rattrapage.md`).
// Seulement pour quelqu'un de ClikMe (le cookie d'habitant).
//
// GET ?de=<groupe|proposition> → { seances } : les séances des sept derniers jours (qui était là, qui l'a rattrapée, le
//                                grand moment) ; un groupe : ses membres ; un essai : celui qui propose et ceux qui
//                                avaient leur place (403 sinon)
// GET ?seance=<clé>            → { seance } : de quoi la rejouer (ses vidéos, ses traces à leur seconde, les figurines) ;
//                                410 : plus de sept jours
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { laSeanceARattraper, seancesPourMoi } from "@/lib/direct/rattrapage-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const u = new URL(request.url).searchParams;
  const r = u.get("seance") ? await laSeanceARattraper(supabase, moi, u.get("seance")) : await seancesPourMoi(supabase, moi.id, u.get("de"));
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json(r, { headers: sansCache });
}
