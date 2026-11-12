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
import { fabriquerPablito, imageDePablito, pablitoAuNouveauStyle, pablitoDeTousLesJours } from "@/lib/direct/pablito-univers-serveur";
import { universPourTous } from "@/lib/direct/univers-pour-tous";

export const dynamic = "force-dynamic";
// (la fabrication, après la réponse : une image du moteur)
export const maxDuration = 300;

type RouteContext = { params: Promise<{ nom: string }> };

export async function GET(req: Request, ctx: RouteContext) {
  const debut = Date.now();
  const { nom } = await ctx.params;
  if (!nomGuideValide(nom)) return new NextResponse(null, { status: 404 });
  const supabase = createAdminClient();
  const webp = (octets: Buffer, cache: string) => new NextResponse(new Uint8Array(octets), { headers: { "content-type": "image/webp", "cache-control": cache } });
  // 🧑 PABLITO AU NOUVEAU STYLE (l'interrupteur allumé, et adopté depuis l'admin : `pablito-univers-serveur.ts`) — ce qui
  // manque se fait après la réponse ; en attendant, sa figurine assise de tous les jours (gardée une minute)
  if (await pablitoAuNouveauStyle(supabase).catch(() => false)) {
    const neuve = await imageDePablito(supabase, nom).catch(() => null);
    if (neuve) return webp(neuve, "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400");
    after(() =>
      fabriquerPablito(supabase, debut + (maxDuration - 20) * 1000)
        .then((r) => r.erreur && console.error("[pablito]", r.erreur))
        .catch((e) => console.error("[pablito]", e)),
    );
    const enAttendant = await pablitoDeTousLesJours(supabase, nom.endsWith("-p")).catch(() => null);
    if (enAttendant) return webp(enAttendant, "public, max-age=60, s-maxage=60");
  }
  // (son image de tous les jours, quand il n'est pas — ou pas encore — au nouveau style)
  if (nom === "neutre-n" || nom === "neutre-p") return NextResponse.redirect(new URL(nom === "neutre-p" ? IMAGES_DEMO.parle : IMAGES_DEMO.neutre, req.url), { status: 307 });
  const image = await imageDuGuide(supabase, nom).catch(() => null);
  // (l'interrupteur allumé mais Pablito pas encore adopté : gardé un jour seulement — il changera)
  if (image) return webp(image, universPourTous() ? "public, max-age=3600, s-maxage=86400" : "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400");
  const origine = new URL(req.url).origin;
  after(() =>
    fabriquerLeGuide(supabase, origine, debut + (maxDuration - 20) * 1000)
      .then((r) => r.erreur && console.error("[guide]", r.erreur))
      .catch((e) => console.error("[guide]", e)),
  );
  const repli = nom.endsWith("-p") ? IMAGES_DEMO.parle : IMAGES_DEMO.neutre;
  return NextResponse.redirect(new URL(repli, req.url), { status: 307, headers: { "cache-control": "public, max-age=60, s-maxage=60" } });
}
