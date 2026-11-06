/**
 * 🏪 SON MÈME DU JOUR (`lib/direct/memes-commerces.ts`), contre son jeton pro :
 *   · `etat` : ses derniers mèmes, et ce qu'ils rapportent (vus, « Voir sa page », partagés) ;
 *   · `envoi` { type } : où envoyer la vidéo, fabriquée dans son téléphone → { id, seau, chemin, jeton } (cinq par jour) ;
 *   · `publier` { id, type (son annonce), texte, videoType, image?, voix? } : la vidéo est arrivée → rangée, sur sa page
 *     publique `/meme/<id>`, et dans « Découvrir » pour les gens de sa ville.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lienMemeCommerce } from "@/lib/direct/memes-commerces";
import { adresseEnvoiMemeCommerce, publierMemeCommerce, sesMemesCommerce, sitePro } from "@/lib/direct/memes-commerces-serveur";

export const dynamic = "force-dynamic";
const sansCache = { "cache-control": "private, no-store" };

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const site = await sitePro(supabase, p?.slug, p?.token);
  if (!site) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const action = String(p?.action ?? "etat");
  if (action === "etat") return NextResponse.json({ ok: true, memes: await sesMemesCommerce(supabase, site) }, { headers: sansCache });
  if (action === "envoi") {
    const r = await adresseEnvoiMemeCommerce(supabase, site, p?.type);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, id: r.id, seau: r.seau, chemin: r.chemin, jeton: r.jeton }, { headers: sansCache });
  }
  if (action === "publier") {
    const r = await publierMemeCommerce(supabase, site, { id: p?.id, type: p?.annonce, texte: p?.texte, videoType: p?.videoType, image: p?.image, voix: p?.voix });
    if (!r.meme) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, meme: r.meme, lien: lienMemeCommerce(r.meme.id) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
