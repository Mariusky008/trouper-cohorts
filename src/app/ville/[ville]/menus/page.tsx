// TOUS LES MENUS DU JOUR DE LA VILLE.
//
// LE BESOIN, dit par l'usage : dans le fil, voir les cartes de six restaurants
// demandait six fois le même travail — appuyer sur une photo, la lire, la
// fermer, faire défiler jusqu'au suivant. Or on ne choisit pas où déjeuner en
// examinant un menu, puis en l'oubliant, puis en examinant le suivant. On les
// COMPARE. Un écran qui les fait défiler d'un geste transforme six efforts en un
// seul, et c'est probablement la chose la plus utile que Le Direct sache faire à
// midi.
//
// CE N'EST PAS UN ANNUAIRE. Seules les cartes publiées aujourd'hui et encore
// valables paraissent ici. Le jour où personne n'en publie, la page est vide —
// parce que c'est alors la vérité, et qu'une page remplie de restaurants sans
// menu ferait perdre confiance en une semaine.
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { configVille } from "@/lib/direct/ville";
import { menusDuJour } from "@/lib/direct/menus-du-jour";
import { MenusDefile } from "./defile";
import { StylesMenus } from "./styles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** La ville et ses cartes du jour, cherchées une fois pour les deux passages
 *  (le titre a besoin de savoir s'il y a quelque chose à montrer). */
const laPage = cache(async (ville: string) => {
  const supabase = createAdminClient();
  const cfg = await configVille(supabase, ville);
  return { cfg, menus: await menusDuJour(supabase, cfg.slug) };
});

/**
 * CETTE PAGE S'INDEXE — ET C'EST UN CHANGEMENT DE DÉCISION.
 *
 * Elle portait `noindex`. C'était défendable — son contenu change tous les
 * jours et disparaît le soir — mais ça revenait à cacher la meilleure page du
 * produit : « les menus du jour à Dax » est mot pour mot ce qu'un Dacquois tape
 * dans Google à midi moins dix. Aucune autre page du site ne répond à une
 * intention aussi précise, ni aussi commerciale.
 *
 * MAIS ELLE NE S'INDEXE QUE SI ELLE A QUELQUE CHOSE À MONTRER. Le jour où
 * aucun restaurant ne publie, elle affiche « aucune carte publiée
 * aujourd'hui » : proposer ÇA à l'indexation, c'est offrir à Google une page
 * vide au titre alléchant. Il la classe « Explorée, actuellement non
 * indexée » — et, ce qui est pire, il apprend que nos titres ne tiennent pas
 * leurs promesses. Le `noindex` conditionnel dit la vérité du jour.
 */
export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const { cfg, menus } = await laPage(ville);
  const title = `Les menus du jour à ${cfg.nom}`;
  const description = menus.length
    ? `${menus.length} carte${menus.length > 1 ? "s" : ""} du jour publiée${menus.length > 1 ? "s" : ""} aujourd'hui par les restaurants de ${cfg.nom}. Ce qui est servi ce midi, à l'heure où vous choisissez.`
    : `Les cartes du jour publiées par les restaurants de ${cfg.nom}, mises à jour chaque matin.`;
  return {
    title,
    description,
    // La canonique sans `?carte=…` : ce paramètre ouvre le défilé sur un menu
    // partagé, il ne fait pas une autre page.
    alternates: { canonical: `/ville/${ville}/menus` },
    openGraph: { title, description, type: "website" },
    robots: menus.length ? undefined : { index: false },
  };
}

export default async function MenusPage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<{ carte?: string }>;
}) {
  const { ville } = await params;
  // `?carte=…` : l'adresse d'un menu partagé. Elle ouvre le défilé SUR cette
  // carte — recevoir « regarde ce midi » et tomber sur un autre restaurant,
  // c'est un lien qu'on n'ouvre pas deux fois.
  const { carte } = await searchParams;
  const { cfg, menus } = await laPage(ville);

  return (
    <>
      {/* La coque « .dir », ses styles et la barre d'onglets viennent du layout :
          les remonter ici donnerait deux coques imbriquées, et la barre du bas
          se retrouverait mesurée deux fois. */}
      <StylesMenus />
      <main className="menus">
        <div className="mn-tete">
          <Link href={`/ville/${ville}?onglet=dejeuner`} className="mn-retour" prefetch={false}>
            ← Le Direct
          </Link>
          <h1>
            Les cartes du jour
            {/* Le NOMBRE est au compteur, pas ici : deux endroits pour la même
                information, c'est un endroit qui finira par mentir. */}
            <span>à {cfg.nom}, aujourd&apos;hui</span>
          </h1>
        </div>

        {menus.length > 0 ? (
          <MenusDefile menus={menus} ville={ville} villeNom={cfg.nom} vise={carte ?? ""} />
        ) : (
          /* VIDE, ET DIT COMME TEL. Remplir cette page avec les restaurants qui
             n'ont rien publié serait la seule façon de la rendre inutile : on
             viendrait chercher un menu et on trouverait une liste de noms. */
          <div className="mn-vide">
            <h2>Aucune carte publiée aujourd&apos;hui</h2>
            <p>
              Cette page ne montre que les cartes du jour vraiment publiées par les restaurants de {cfg.nom} —
              jamais une liste de restaurants sans menu. Repassez à l&apos;heure du déjeuner.
            </p>
            <Link href={`/ville/${ville}`} prefetch={false}>Voir ce qui se passe à {cfg.nom} →</Link>
          </div>
        )}
      </main>
    </>
  );
}
