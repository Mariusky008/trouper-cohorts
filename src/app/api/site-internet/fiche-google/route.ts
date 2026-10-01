// 🔎 RELIRE LA FICHE GOOGLE D'UNE PAGE DÉJÀ CRÉÉE — depuis la page elle-même.
//
// « J'ai l'impression que la fiche Google n'a pas du tout été consultée. »
//
// UNE PAGE FABRIQUÉE SANS SA FICHE LE RESTAIT POUR TOUJOURS : le diagnostic
// s'écrit une fois, à l'inscription. Si Apify avait un trou ce jour-là, le
// commerçant gardait une page sans avis ni photos. Cette route relit la fiche
// (même recette que l'inscription, `lib/site-internet/fiche-google.ts`) et ne
// fait QU'AJOUTER : un champ que Google ne rend pas laisse en place ce qui y
// était.
//
// PLAFONNÉE : une relecture toutes les dix minutes par page. Chaque relecture
// coûte des appels Apify, et l'adresse de la page est la seule clé — comme pour
// la photo ClikMe, c'est le plafond qui rend la porte sûre.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireFicheGoogle, raisonLisible } from "@/lib/site-internet/fiche-google";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const ATTENTE_MS = 10 * 60_000;

export async function POST(requete: Request) {
  let p: Record<string, unknown> = {};
  try {
    p = (await requete.json()) as Record<string, unknown>;
  } catch {
    /* corps vide */
  }
  const slug = s(p.slug);
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, address, google_place_id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return NextResponse.json({ erreur: "site introuvable" }, { status: 404 });
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;

  const derniere = Date.parse(s(diag.fiche_relue_at));
  if (Number.isFinite(derniere) && Date.now() - derniere < ATTENTE_MS) {
    const min = Math.ceil((ATTENTE_MS - (Date.now() - derniere)) / 60_000);
    return NextResponse.json({ ok: false, raison: `Votre fiche vient d'être relue. Réessayez dans ${min} min.` });
  }
  // ON NOTE LA TENTATIVE AVANT D'APPELER : deux appuis rapprochés n'en paient qu'une.
  const maintenant = new Date().toISOString();
  await supabase.from("human_vitrine_sites").update({ diagnostic: { ...diag, fiche_relue_at: maintenant } }).eq("id", s(row.id));

  const fiche = await lireFicheGoogle(
    s(process.env.APIFY_TOKEN),
    s(row.business_name),
    s(row.city),
    s(row.activite),
    s(row.google_place_id),
  );
  if (fiche.erreurs.length) console.warn("[fiche-google]", JSON.stringify({ slug, erreurs: fiche.erreurs }));

  const prendre = <T,>(nouveau: T[] | undefined, ancien: unknown): T[] | unknown =>
    nouveau && nouveau.length ? nouveau : ancien;
  const diagApres: Record<string, unknown> = {
    ...diag,
    fiche_relue_at: maintenant,
    fiche_erreurs: fiche.erreurs,
    places_found: fiche.trouvee || Boolean(diag.places_found),
    photos: prendre(fiche.photos, diag.photos),
    reviews_top: prendre(fiche.reviewsTop, diag.reviews_top),
    horaires: prendre(fiche.horaires, diag.horaires),
    phone: fiche.phone || diag.phone,
  };
  const maj: Record<string, unknown> = { diagnostic: diagApres };
  if (fiche.trouvee) {
    if (fiche.rating != null) maj.google_rating = fiche.rating;
    if (fiche.reviews != null) maj.google_reviews = fiche.reviews;
    if (fiche.placeId) maj.google_place_id = fiche.placeId;
    if (fiche.address && !s(row.address)) maj.address = fiche.address;
  }
  const { error } = await supabase.from("human_vitrine_sites").update(maj).eq("id", s(row.id));
  if (error) return NextResponse.json({ ok: false, raison: `enregistrement : ${error.message}` }, { status: 500 });

  return NextResponse.json({
    ok: fiche.trouvee,
    photos: fiche.photos.length,
    avis: fiche.reviewsTop.length,
    note: fiche.rating,
    raison: fiche.trouvee ? undefined : raisonLisible(fiche.erreurs[fiche.erreurs.length - 1] || "aucune fiche Google à ce nom"),
  });
}
