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
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { configVille } from "@/lib/direct/ville";
import { menusDuJour } from "@/lib/direct/menus-du-jour";
import { MenusDefile } from "./defile";
import { StylesMenus } from "./styles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const cfg = await configVille(createAdminClient(), ville);
  return { title: `Les menus du jour à ${cfg.nom}`, robots: { index: false } };
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
  const supabase = createAdminClient();
  const cfg = await configVille(supabase, ville);
  const menus = await menusDuJour(supabase, cfg.slug);

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
