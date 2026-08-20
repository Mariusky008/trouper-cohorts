// ÉCRAN 2 — À SAISIR.
//
// Deux missions strictement distinctes, et c'est le point le plus important de
// toute l'application :
//
//   Le Direct  · tout ce qui se passe dans ma ville · exhaustif · chronologique
//   À saisir   · ce que Clikme a sélectionné pour moi · 8 cartes max · pertinence
//
// Si l'habitant ne perçoit pas la différence entre les deux onglets,
// l'architecture a échoué. Le titre, le compteur « x sur 8 » et le plein écran
// sont là pour la rendre évidente.
//
// Le tri est celui de la règle de dégradation : sans signal personnel, ce qui
// expire le plus tôt, puis le plus proche, puis le plus récent. C'est déjà utile
// et honnête. La personnalisation s'ajoutera sans changer cet écran.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { filDeVille, noterAffichages } from "@/lib/direct/publications";
import { calculerPouls, selection, repereSpatial } from "@/lib/direct/degradation";
import { configVille } from "@/lib/direct/ville";
import { habitantCourant, gardees, suivis } from "@/lib/direct/habitant";
import { ilYA } from "@/lib/site-internet/collectif";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { presse } from "@/lib/direct/fil";
import { cliksDeVille, faconsParPublication, mesParticipations } from "@/lib/direct/cliks";
import { faconsVue } from "@/lib/direct/facons-vue";
import { reactionsDesPublications } from "@/lib/direct/reactions";
import { histoiresDuJour } from "@/lib/direct/histoire";
import { boutonLien } from "@/lib/direct/mots-metier";
import { fichesDeSites } from "@/lib/direct/fiche-pro";
import { telephonesDeSites } from "@/lib/direct/menus-du-jour";
import type { CarteVue } from "../_ui/carte";
import { SelectionSwipe } from "./selection-swipe";
import { StylesSwipe } from "./styles-swipe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * CETTE PAGE S'INDEXE — ET AVEC UNE RÉSERVE QU'IL FAUT ÉCRIRE ICI.
 *
 * Elle portait `noindex`. On l'ouvre parce qu'elle répond à une intention que
 * le fil ne couvre pas : « ce qui part aujourd'hui », pas « ce qui se passe ».
 *
 * LA RÉSERVE : elle montre LES MÊMES publications que `/ville/<slug>`, dans une
 * autre forme. Deux adresses qui montrent le même contenu, c'est exactement ce
 * qui produit « Page en double » — le défaut qu'on vient de corriger ailleurs.
 * Trois choses l'en préservent, et il faut les garder ensemble :
 *   · un titre et une description qui décrivent une INTENTION différente, pas
 *     le même contenu autrement présenté ;
 *   · une canonique qui la désigne elle-même, assumée comme telle ;
 *   · et surtout `noindex` les jours où il n'y a rien à saisir — une page vide
 *     au titre alléchant est la meilleure façon d'apprendre à Google que nos
 *     titres ne tiennent pas leurs promesses.
 *
 * Si Search Console la range malgré tout en doublon du fil, c'est le fil qui
 * doit gagner : il faudra alors pointer la canonique d'ici vers `/ville/<slug>`.
 */
export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const supabase = createAdminClient();
  const cfg = await configVille(supabase, ville);
  const duJour = await filDeVille(supabase, cfg.slug);
  const title = `À saisir aujourd'hui à ${cfg.nom}`;
  const description = `Les places, offres et cartes du jour qui partent aujourd'hui à ${cfg.nom} — et qui auront disparu demain.`;
  return {
    title,
    description,
    alternates: { canonical: `/ville/${ville}/a-saisir` },
    openGraph: { title, description, type: "website" },
    robots: duJour.length ? undefined : { index: false },
  };
}

export default async function ASaisirPage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const supabase = createAdminClient();
  const [cfg, habitant] = await Promise.all([configVille(supabase, ville), habitantCourant(supabase)]);

  const duJour = await filDeVille(supabase, cfg.slug);
  const large = calculerPouls(duJour, { seuil: cfg.seuilCompteur, ville: cfg.nom }).fenetreLarge;
  const publications = large ? await filDeVille(supabase, cfg.slug, { fenetreLarge: true }) : duJour;

  const [mesGardees, mesSuivis] = habitant
    ? await Promise.all([gardees(supabase, habitant.id), suivis(supabase, habitant.id)])
    : [new Set<string>(), []];

  // Les signaux personnels n'entrent que s'ils existent. Ils déplacent le
  // classement, ils ne remplacent pas le socle objectif.
  const choisies = selection(publications, {
    suivis: new Set(mesSuivis.map((s) => s.siteId)),
    categories: habitant?.categories.length ? new Set(habitant.categories) : undefined,
  });

  // Seules les huit retenues comptent, pas tout le fil relu pour les choisir.
  void noterAffichages(supabase, choisies);

  // Les façons des annonces retenues : sans les prix, on glisse au hasard.
  const cliksParPub = faconsParPublication(await cliksDeVille(supabase, cfg.slug));

  const ctx = { moi: null, quartierHabitant: habitant?.quartier, ville: cfg.nom };
  // Les réactions des annonces affichées, en UNE lecture : une requête par
  // carte multiplierait les allers-retours par le nombre d'annonces.
  const reacts = await reactionsDesPublications(supabase, choisies.map((p) => p.id), habitant?.id ?? null);

  // LA PETITE HISTOIRE DU JOUR de chaque commerce affiché, en UNE lecture.
  // Elle est portée par le COMMERCE, pas par l'annonce : deux annonces du même
  // boulanger montrent la même histoire, parce qu'il ne s'en passe qu'une chez
  // lui aujourd'hui.
  const histoires = await histoiresDuJour(supabase, choisies.map((p) => p.siteId ?? ""));

  // CE QUE J'AI DÉJÀ PRIS. En une lecture pour tout le fil : la carte ne doit
  // pas reproposer une façon qu'on a rejointe dix minutes plus tôt — elle
  // donnait l'impression qu'il fallait recommencer.
  const miennes = await mesParticipations(
    supabase,
    choisies.flatMap((p) => (cliksParPub.get(p.id) ?? []).map((c) => c.id)),
    habitant?.id ?? null
  );


  // LA FICHE ET LE NUMÉRO DE CHAQUE COMMERCE AFFICHÉ, en deux lectures pour
  // tout l'écran. Sans le numéro, le panneau « je réserve » n'a personne à
  // prévenir et se tait ; sans la fiche, celui du pro n'a rien à montrer. Les
  // charger carte par carte multiplierait les allers-retours par le nombre
  // d'annonces, pour des panneaux qu'on n'ouvrira peut-être jamais.
  const siteIds = choisies.map((p) => p.siteId ?? "").filter(Boolean);
  const [fichesParSite, telsParSite] = await Promise.all([
    fichesDeSites(supabase, siteIds),
    telephonesDeSites(supabase, siteIds),
  ]);

  const cartes: CarteVue[] = choisies.map((p) => ({
    id: p.id,
    famille: p.famille,
    texte: p.texte,
    photo: p.photo,
    video: p.video,
    lien: p.lien,
    auteurNom: p.auteurNom,
    auteurMetier: p.auteurMetier,
    auteurSlug: p.auteurSlug,
    repere: repereSpatial(p, ctx),
    lat: p.lat,
    lng: p.lng,
    fraicheur: ilYA(p.publieLe),
    echeance: echeanceCourte(p.expireLe),
    urgent: presse(p.expireLe),
    // LES FAÇONS S'AFFICHENT ICI AUSSI, mais SANS LIEN : la carte se manipule
    // au glissement, et une bande cliquable posée dedans se déclencherait à
    // chaque geste raté. On montre les prix — sans eux on glisse au hasard —
    // et le glissement vers le haut reste le seul geste qui engage.
    facons: faconsVue(cliksParPub.get(p.id), miennes),
    reste: p.reste,
    ardoise: p.ardoise,
    ardoiseLabel: boutonLien(p.auteurMetier),
    telephone: (p.siteId && telsParSite.get(p.siteId)) || "",
    histoire: (p.siteId && histoires.get(p.siteId)) || null,
    reactions: reacts.get(p.id) ?? { compte: {}, miennes: [] },
  }));

  return (
    <>
      <StylesSwipe />
      {cartes.length > 0 ? (
        <SelectionSwipe
          cartes={cartes}
          ville={ville}
          villeNom={cfg.nom}
          gardeesInitiales={cartes.filter((c) => mesGardees.has(c.id)).map((c) => c.id)}
          // Rangées par identifiant d'ANNONCE et non de commerce : le composant
          // ne connaît que ses cartes, et deux annonces du même commerçant
          // doivent trouver la même fiche sans avoir à faire la conversion.
          fiches={Object.fromEntries(
            choisies
              .map((p) => [p.id, p.siteId ? fichesParSite.get(p.siteId) : null] as const)
              .filter((e): e is readonly [string, NonNullable<(typeof e)[1]>] => Boolean(e[1]))
          )}
          prenom={habitant?.prenom ?? ""}
        />
      ) : (
        <div className="asx-fin">
          <h2>Rien à saisir pour l&apos;instant</h2>
          <p>
            La sélection ne retient que ce qui est encore vrai maintenant à {cfg.nom}. Dès qu&apos;un commerçant
            publie une place, une offre ou un événement, il apparaît ici.
          </p>
        </div>
      )}
    </>
  );
}
