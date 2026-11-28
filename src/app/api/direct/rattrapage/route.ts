// ⏪ LE RATTRAPAGE D'UNE SÉANCE (`lib/direct/rattrapage.ts`, `rattrapage-serveur.ts` ; `docs/univers/rattrapage.md`).
// Seulement pour quelqu'un de ClikMe (le cookie d'habitant).
//
// GET ?de=<groupe|proposition> → { seances } : les séances des sept derniers jours (qui était là, qui l'a rattrapée, le
//                                grand moment) ; un groupe : ses membres ; un essai : celui qui propose et ceux qui
//                                avaient leur place (403 sinon)
// GET ?seance=<clé>            → { seance } : de quoi la rejouer (ses vidéos, ses traces à leur seconde, les figurines) ;
//                                410 : plus de sept jours
// (lot T3) POST { action: "reagir", seance, sorte: "reaction"|"texte", cle?, n?, texte?, ou: { video, t } } → { trace } :
//                                réagir en décalé (« ⏪ vu en rattrapage ») ; 400 `refus` (la modération), 429 (le rythme)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { laSeanceARattraper, reagirEnDecale, seancesPourMoi } from "@/lib/direct/rattrapage-serveur";

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

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const r = p.action === "reagir" ? await reagirEnDecale(supabase, moi, p) : { error: "Demande inconnue.", statut: 400 };
  if (r.error) return NextResponse.json({ error: r.error, ...((r as { refus?: string }).refus ? { refus: (r as { refus?: string }).refus } : {}) }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, ...r }, { headers: sansCache });
}
