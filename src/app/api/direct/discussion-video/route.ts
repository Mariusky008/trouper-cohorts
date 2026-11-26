// 💬 LA DISCUSSION D'UNE VIDÉO (`lib/direct/discussion-video.ts`, `discussion-video-serveur.ts` ;
// `docs/univers/discussions-video.md`, le lot A1). Seulement pour quelqu'un de ClikMe (le cookie d'habitant).
//
// GET ?video=<id>[&seance=<salon>] → { discussion } : la vidéo, ce que mes proches en ont dit (👯), les mots de ma
//                                    tranche (🌍 ; `null` tant que je n'ai pas dit si j'ai 18 ans) ; 404 : je ne peux
//                                    pas l'ouvrir (ni à ma télé, ni dans mon historique, ni ailleurs, et rien dit dessus)
// (lot A2, ✍️ les mots écrits sous la vidéo, 🌍)
// POST { action: "publier", id, texte, repond?, accord: true, salon? } → { ecrit } : 90 signes, la modération des salons
//                                    ouverts (400 `refus`) ; `repond` : l'id d'un mot écrit, ou `mot:<q>` (un mot dit)
// POST { action: "effacer", id, ecrit }  → { ok } : le mien, partout
// POST { action: "signaler", id, ecrit } → { ok, cache } : plus chez moi ; trois personnes : chez personne
// (lot A3) POST { action: "suivre", id, cercle: "proches"|"tous", niveau: "prevenir"|"discret"|"non" } → { niveau }
// (lot A6, 👥) GET …&groupe=<id> : le cercle de ce groupe (j'en suis membre), même vide ; `discussion.groupes`.
//              POST publier / effacer avec `groupe` : dans le cercle du groupe (ses membres seulement, sans accord) ;
//              POST suivre { cercle: "groupe", groupe, niveau }
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { effacerEcrit, laDiscussion, publierEcrit, nePlusVoirDansLaDiscussion, signalerEcrit, suivreDiscussion } from "@/lib/direct/discussion-video-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const q = new URL(request.url).searchParams;
  const r = await laDiscussion(supabase, moi, q.get("video"), q.get("seance"), q.get("groupe"));
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ discussion: r.discussion }, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const r = p.action === "publier" ? await publierEcrit(supabase, moi, p) : p.action === "effacer" ? await effacerEcrit(supabase, moi, p) : p.action === "signaler" ? await signalerEcrit(supabase, moi, p) : p.action === "suivre" ? await suivreDiscussion(supabase, moi, p) : p.action === "ne-plus-voir" ? await nePlusVoirDansLaDiscussion(supabase, moi, p) : { error: "Demande inconnue.", statut: 400 };
  if (r.error) {
    const x = r as { refus?: string; age?: true };
    return NextResponse.json({ error: r.error, ...(x.refus ? { refus: x.refus } : {}), ...(x.age ? { age: true } : {}) }, { status: r.statut ?? 400, headers: sansCache });
  }
  return NextResponse.json({ ok: true, ...r }, { headers: sansCache });
}
