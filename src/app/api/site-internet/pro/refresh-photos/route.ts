// 📸 RAMENER LES PHOTOS GOOGLE D'UNE PAGE DÉJÀ FABRIQUÉE.
//
// ═══ POURQUOI CETTE ROUTE EXISTE ═══════════════════════════════════════════
//
// « Toutes les photos de couverture des pages commerçants sont absentes. Il
// manque toutes les photos recueillies sur la fiche Google, qui ont normalement
// leur propre section dans les infos du commerçant. »
//
// TROIS DÉFAUTS ONT ÉTÉ CORRIGÉS EN AMONT, ET AUCUN NE RÉPARE LE PASSÉ :
//
//   · `public-generate` ne perdait plus la photo du premier appel Apify quand
//     le second échouait ;
//   · le pont `carte-depuis-fiche` remplit enfin `sesPhotos`, que la galerie
//     lit depuis toujours ;
//   · et `enGrand` demande la grande image au lieu de la vignette.
//
// MAIS UNE PAGE FABRIQUÉE HIER GARDE SA LISTE VIDE. `diagnostic.photos` est
// écrit UNE FOIS, à la génération ; rien ne le relit jamais. Toutes les pages
// déjà envoyées à des commerçants resteraient donc sans photo jusqu'à ce que
// quelqu'un les refasse entièrement — c'est-à-dire en changeant leur adresse,
// donc en cassant les liens déjà distribués.
//
// CETTE ROUTE NE REFAIT PAS LA PAGE, ELLE LUI REND SES PHOTOS. Même acteur
// Apify que le diagnostic, même jeton privé, même prudence que
// `refresh-reviews` — dont elle suit le dessin ligne pour ligne, parce que deux
// routes qui font la même chose de deux façons différentes divergent toujours.
//
// ═══ CE QU'ELLE N'ÉCRIT JAMAIS ═════════════════════════════════════════════
//
// RIEN QUAND GOOGLE NE REND RIEN. Un appel qui échoue laisse la liste telle
// quelle : écraser des photos qui marchaient par une liste vide serait faire
// pire que l'état qu'on vient de corriger. C'est la même règle que dans
// `public-generate` — un appel faillible ne peut qu'améliorer.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apifyGoogleMaps, normName } from "@/lib/site-internet/apify";

export const dynamic = "force-dynamic";

/**
 * CE QU'ON GARDE D'UNE FICHE, ET LES DEUX CHAMPS COMPTENT.
 *
 * `imageUrls` n'est rempli que par un appel qui DEMANDE des images ;
 * `imageUrl` au singulier arrive toujours. C'est exactement la leçon du défaut
 * d'origine : la photo était sous la main, dans le champ qu'on ne lisait pas.
 */
function imagesDe(item: Record<string, unknown>): string[] {
  const brutes = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  const imgs = brutes.length ? brutes : [item.imageUrl].filter(Boolean);
  return imgs.map((u) => String(u)).filter((u) => /^https?:\/\//i.test(u)).slice(0, 8);
}

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const slug = String(payload?.slug || "").trim();
  const token = String(payload?.token || "").trim();
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, google_place_id, diagnostic, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const site = (row as Record<string, unknown> | null) ?? null;
  // LE JETON PRIVÉ EST LA SEULE PORTE. Une route qui ramène des données d'un
  // commerce doit savoir qui la demande, même quand ces données sont publiques.
  if (!site || !site.pro_token || String(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const diag = (site.diagnostic && typeof site.diagnostic === "object"
    ? (site.diagnostic as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const avant = (Array.isArray(diag.photos) ? diag.photos : []).map((p) => String(p));

  const apifyToken = process.env.APIFY_TOKEN || "";
  if (!apifyToken) return NextResponse.json({ error: "Actualisation indisponible." }, { status: 503 });

  const nom = String(site.business_name || "");
  const ville = String(site.city || "");
  const placeId = String(site.google_place_id || "").trim();

  /* ON CIBLE PAR `placeId` QUAND ON L'A — c'est le seul repère qui ne se
     trompe pas d'homonyme. Sinon on retombe sur le nom, et on choisit la fiche
     dont le titre correspond vraiment. */
  const res = placeId
    ? await apifyGoogleMaps(apifyToken, [], `${ville}, france`, 1, {
        maxImages: 12,
        maxReviews: 0,
        placeIds: [placeId],
      })
    : await apifyGoogleMaps(apifyToken, [`${nom} ${ville}`.trim()], `${ville}, france`, 4, {
        maxImages: 12,
        maxReviews: 0,
      });

  if (!res.ok || !res.items.length) {
    return NextResponse.json(
      { ok: false, error: "Google injoignable pour le moment. Réessayez plus tard.", photos: avant.length },
      { status: 200 },
    );
  }

  const cible = normName(nom);
  const best = placeId
    ? res.items[0]
    : res.items.find((it) => normName(String((it as Record<string, unknown>).title || "")) === cible) ||
      res.items.find((it) => {
        const t = normName(String((it as Record<string, unknown>).title || ""));
        return t && (t.includes(cible) || cible.includes(t));
      }) ||
      res.items[0];

  const apres = imagesDe(best as Record<string, unknown>);
  /* RIEN NE S'ÉCRASE POUR RIEN. Voir l'en-tête : un appel qui ne rend aucune
     image laisse en place celles qui étaient là. */
  if (!apres.length) {
    return NextResponse.json({ ok: true, inchange: true, photos: avant.length }, { status: 200 });
  }

  const { error } = await supabase
    .from("human_vitrine_sites")
    .update({
      diagnostic: { ...diag, photos: apres, photos_refreshed_at: new Date().toISOString() },
    })
    .eq("id", String(site.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, photos: apres.length, avant: avant.length });
}
