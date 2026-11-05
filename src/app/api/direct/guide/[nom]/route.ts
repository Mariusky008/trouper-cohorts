/**
 * 🧑 LES IMAGES DU GUIDE DE « MA COLLECTION » (`lib/direct/guide.ts`) — la figurine du patron de ClikMe.
 *
 * GET /api/direct/guide/<nom> : ses visages (`joie-n`, `joie-p`…), sa figurine seule (`seule`), ses tenues
 * (`edition-noel`…). Faite : l'image, gardée longtemps par le réseau (son adresse porte `?v=<VERSION_GUIDE>`).
 * Pas encore faite : son image de tous les jours (une redirection courte), et le moteur la fait après la réponse
 * (`guide-serveur.ts` : une fois, sous verrou). Personne n'attend la fabrication.
 */
import { after, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nomGuideValide } from "@/lib/direct/guide";
import { fabriquerLeGuide, imageDuGuide } from "@/lib/direct/guide-serveur";
import { IMAGES_DEMO } from "@/lib/direct/ma-figurine";

export const dynamic = "force-dynamic";
// (la fabrication, après la réponse : une image du moteur)
export const maxDuration = 300;

type RouteContext = { params: Promise<{ nom: string }> };

export async function GET(req: Request, ctx: RouteContext) {
  const debut = Date.now();
  const { nom } = await ctx.params;
  if (!nomGuideValide(nom)) return new NextResponse(null, { status: 404 });
  const supabase = createAdminClient();
  const image = await imageDuGuide(supabase, nom).catch(() => null);
  if (image)
    return new NextResponse(new Uint8Array(image), {
      headers: { "content-type": "image/webp", "cache-control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400" },
    });
  const origine = new URL(req.url).origin;
  after(() =>
    fabriquerLeGuide(supabase, origine, debut + (maxDuration - 20) * 1000)
      .then((r) => r.erreur && console.error("[guide]", r.erreur))
      .catch((e) => console.error("[guide]", e)),
  );
  const repli = nom.endsWith("-p") ? IMAGES_DEMO.parle : IMAGES_DEMO.neutre;
  return NextResponse.redirect(new URL(repli, req.url), { status: 307, headers: { "cache-control": "public, max-age=60, s-maxage=60" } });
}
