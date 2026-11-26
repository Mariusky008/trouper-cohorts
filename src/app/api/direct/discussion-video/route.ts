// 💬 LA DISCUSSION D'UNE VIDÉO (`lib/direct/discussion-video.ts`, `discussion-video-serveur.ts` ;
// `docs/univers/discussions-video.md`, le lot A1). Seulement pour quelqu'un de ClikMe (le cookie d'habitant).
//
// GET ?video=<id>[&seance=<salon>] → { discussion } : la vidéo, ce que mes proches en ont dit (👯), les mots de ma
//                                    tranche (🌍 ; `null` tant que je n'ai pas dit si j'ai 18 ans) ; 404 : je ne peux
//                                    pas l'ouvrir (ni à ma télé, ni dans mon historique, ni ailleurs, et rien dit dessus)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { laDiscussion } from "@/lib/direct/discussion-video-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const q = new URL(request.url).searchParams;
  const r = await laDiscussion(supabase, moi, q.get("video"), q.get("seance"));
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ discussion: r.discussion }, { headers: sansCache });
}
