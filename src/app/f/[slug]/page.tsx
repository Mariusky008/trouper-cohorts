// 👻 « REJOINS MA FAMILLE DE FANTÔMES ! » — la page publique d'un commerce, `clikme.fr/f/<lien>`.
//
// C'est là que mène la fin de sa vidéo du jour (« Rejoins la famille à la fin de la vidéo ↓ »),
// le lien de sa bio et le QR de son comptoir. Sans compte et sans appli : on ouvre une cage, on
// dit son prénom (et, si on veut, un petit mot), et on entre dans sa famille — son numéro, la
// foule du jour, le record à battre, son écusson. Voir `lib/direct/famille.ts`.
//
// CE FICHIER CHARGE, `famille.tsx` DESSINE. Ce qu'il passe : le nom, le métier, la ville, sa
// vidéo (son annonce en cours, sinon sa dernière publication, sinon la page elle-même :
// `FILM_PAGE`), ses photos (jamais les images en `data:` de la galerie, trop lourdes), et le
// numéro WhatsApp de ClikMe s'il est réglé (`CLIKME_WHATSAPP`) — sans lui, pas de bouton.
//
// SEULEMENT POUR UN COMMERCE CLIENT DE CLIKME (`est_client`). Un prospect n'a rien demandé : on
// n'invite personne dans sa famille à sa place.
//
// CHAQUE OUVERTURE SE COMPTE (`compterLeJour(…, "famille")`) : la première marche de son parcours,
// au comptoir. Sauf la sienne, depuis son comptoir (`?moi=1`).
import type { Metadata } from "next";
import { after } from "next/server";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { couvertureAffichee, couvertureDuDiagnostic } from "@/lib/site-internet/couverture";
import { lirePhotosDuLieu } from "@/lib/site-internet/photos-du-lieu";
import { villeSlug } from "@/lib/direct/ville";
import { tenueDu } from "@/lib/direct/double-metiers";
import { numeroWhatsApp } from "@/lib/direct/cages";
import { FILM_PAGE } from "@/lib/direct/famille";
import { deNom } from "@/lib/echanges/echanges";
import { compterLeJour } from "@/lib/site-internet/compteurs-jour";
import { Famille, type CommerceFamille } from "./famille";

export const dynamic = "force-dynamic";

type Ligne = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();
const capWords = (t: string) => t.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
const web = (u: unknown) => (/^https:\/\//i.test(s(u)) ? s(u) : "");

const charger = cache(async (slug: string): Promise<(CommerceFamille & { siteId: string }) | null> => {
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("id, slug, business_name, city, activite, current_offer, diagnostic, metadata, est_client")
      .eq("slug", slug)
      .maybeSingle();
    const row = data as Ligne | null;
    if (!row || row.est_client !== true) return null;
    const nom = s(row.business_name);
    if (!nom) return null;
    const metier = s(row.activite);
    const branche = brancheDuMetier(metier);

    // SA VIDÉO : l'annonce en cours, sinon sa dernière publication filmée.
    let film = web((row.current_offer as Ligne | null)?.video);
    if (!film) {
      const { data: pubs } = await supabase
        .from("human_publications")
        .select("video, publie_le")
        .eq("site_id", s(row.id))
        .is("retire_le", null)
        .order("publie_le", { ascending: false })
        .limit(20);
      film = ((Array.isArray(pubs) ? pubs : []) as Ligne[]).map((p) => web(p.video)).find(Boolean) ?? "";
    }

    const lieu = lirePhotosDuLieu(row.metadata);
    const couverture = web(couvertureAffichee(couvertureDuDiagnostic(row.diagnostic)));
    return {
      siteId: s(row.id),
      slug: s(row.slug) || slug,
      nom,
      metier,
      branche,
      ville: capWords(s(row.city).split(",")[0].replace(/\d+/g, "").trim()),
      villeSlug: villeSlug(s(row.city)),
      film: film || FILM_PAGE,
      video: film,
      affiche: couverture || lieu.devanture?.url || lieu.interieur?.url || "",
      salle: lieu.interieur?.url || couverture || "",
      hote: `${tenueDu({ branche, metier })?.enPied ?? "/direct/double/pied/"}salut-1.webp`,
      whatsapp: numeroWhatsApp(s(process.env.CLIKME_WHATSAPP)) ?? "",
    };
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await charger((await params).slug);
  if (!c) return { title: "ClikMe", robots: { index: false } };
  const titre = `Rejoins la famille ${deNom(c.nom)} 👻`;
  const description = "Ouvre une cage et entre dans sa foule du jour. Ses fantômes ont les bons plans en premier. Sans compte, sans appli.";
  return {
    title: titre,
    description,
    robots: { index: false },
    openGraph: { title: titre, description, ...(c.affiche ? { images: [c.affiche] } : {}) },
  };
}

export default async function PageFamille({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ de?: string; moi?: string }>;
}) {
  const [{ slug }, { de, moi }] = await Promise.all([params, searchParams]);
  const charge = await charger(slug);
  if (!charge) notFound();
  const { siteId, ...commerce } = charge;
  if (!moi) after(() => compterLeJour(siteId, "famille"));
  return <Famille commerce={commerce} de={/^f[0-9a-f]{12}$/.test(s(de)) ? s(de) : ""} />;
}
