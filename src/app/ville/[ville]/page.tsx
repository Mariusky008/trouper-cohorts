// ÉCRAN 1 — LE DIRECT.
//
// Tout ce qui se passe dans la ville : le pouls, puis le fil trié PAR ORDRE DE
// DISPARITION — ce qui part le plus tôt d'abord, jamais par date. Ce
// n'est pas un catalogue, c'est le pouls de la ville en temps réel — le mot
// « catalogue » n'apparaît nulle part à l'écran, et aucune notion d'édition, de
// numéro ni de mois n'existe.
//
// Une publication expirée ne figure pas dans le fil. C'est la traduction directe
// du positionnement : mieux vaut un fil court et vrai qu'un fil rempli d'hier.
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { filDeVille, noterAffichages } from "@/lib/direct/publications";
import { calculerPouls, repereSpatial } from "@/lib/direct/degradation";
import { trierLeFil, presse } from "@/lib/direct/fil";
import { cliksDeVille, faconsParPublication, collectifDe } from "@/lib/direct/cliks";
import { faconsVue } from "@/lib/direct/facons-vue";
import { DEFS, dansOnglet, sousTitre, estOnglet, type Onglet } from "@/lib/direct/onglets";
import { configVille } from "@/lib/direct/ville";
import { habitantCourant, gardees } from "@/lib/direct/habitant";
import { ilYA } from "@/lib/site-internet/collectif";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { Carte, type CarteVue } from "./_ui/carte";
import { BoutonPosition } from "./_ui/bouton-position";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const cfg = await configVille(createAdminClient(), ville);
  const title = `Le Direct de ${cfg.nom}`;
  const description = `Tout ce qui se passe à ${cfg.nom} en ce moment : places qui se libèrent, offres du jour, événements.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    manifest: `/ville/${ville}/manifest.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: `Direct ${cfg.nom}` },
  };
}


export default async function LeDirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ville } = await params;
  const sp = await searchParams;
  // L'onglet demandé. Un paramètre inconnu retombe sur « tout » plutôt que de
  // vider le fil : un lien partagé qui donne un écran vide se lit comme une
  // panne, pas comme une faute de frappe.
  const brut = String(Array.isArray(sp.f) ? sp.f[0] : sp.f || "");
  const onglet: Onglet = estOnglet(brut) ? brut : "tout";

  const supabase = createAdminClient();
  const [cfg, habitant] = await Promise.all([configVille(supabase, ville), habitantCourant(supabase)]);

  // Deux lectures plutôt qu'une : la première décide si la ville a le volume qui
  // rend un fil du jour intéressant, la seconde applique la fenêtre qui en
  // découle. On ne peut pas connaître la fenêtre avant d'avoir compté, et
  // compter sur la mauvaise fenêtre fausserait le seuil.
  const duJour = await filDeVille(supabase, cfg.slug);
  const poulsInitial = calculerPouls(duJour, { seuil: cfg.seuilCompteur, ville: cfg.nom });
  const publications = poulsInitial.fenetreLarge
    ? await filDeVille(supabase, cfg.slug, { fenetreLarge: true })
    : duJour;
  const pouls = calculerPouls(publications, { seuil: cfg.seuilCompteur, ville: cfg.nom });

  const mesGardees = habitant ? await gardees(supabase, habitant.id) : new Set<string>();

  // Les Cliks en cours dans la ville, indexés par annonce. Une lecture de plus,
  // mais elle change l'ordre du fil autant que son contenu : sans elle, un
  // groupe à 5/6 se noie au milieu des annonces ordinaires.
  const cliksParPub = faconsParPublication(await cliksDeVille(supabase, cfg.slug));

  const ctx = { moi: null, quartierHabitant: habitant?.quartier, ville: cfg.nom };
  // LE FILTRE SUIT L'INTENTION, pas notre taxonomie. On ne cherche pas « une
  // publication de famille place », on cherche à déjeuner ou un créneau chez le
  // coiffeur. C'est le MÉTIER qui décide, pas la famille : un restaurant qui
  // annonce une place libre relève quand même du déjeuner.
  const visibles = publications.filter((p) => dansOnglet(p, onglet));

  // L'ORDRE DU FIL — la règle du §3, à la place du simple ordre chronologique.
  // Ce qui expire dans l'heure passe devant, puis les collectifs proches du
  // seuil, puis les nouveautés.
  //
  // La DISTANCE reste vide, et c'est volontaire plutôt qu'oublié : elle ne se
  // connaît qu'au navigateur, la position n'étant jamais envoyée au serveur.
  //
  // Le rang « presque » est désormais alimenté : un collectif à qui il manque
  // deux personnes passe devant une nouveauté. C'est le seul cas où l'habitant
  // peut changer le résultat pour tout le monde, et le fil doit le mettre là où
  // ça se voit.
  //
  // L'horloge est lue DANS `trierLeFil`, pas ici : un `Date.now()` dans le corps
  // du composant rend le rendu impur, et la règle `react-hooks/purity` le refuse
  // — à raison, puisque deux rendus du même état donneraient deux résultats.
  const triees = trierLeFil(
    visibles.map((p) => {
      // Parmi les façons, seule la « table à partager » peut basculer : c'est
      // elle que le rang « presque » du §3 doit voir.
      return { ...p, distanceM: null, collectif: collectifDe(cliksParPub.get(p.id)) };
    })
  );

  const cartes: CarteVue[] = triees.map((p) => ({
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
    // LES FAÇONS, MISES EN FORME CÔTÉ SERVEUR. La carte ne reçoit pas les
    // campagnes mais ce qu'elle affiche. Le calcul dépend de l'heure
    // (« Arrivée avant 12 h 47 ») : fait dans la carte, qui est un composant
    // client, il divergerait entre le rendu serveur et l'hydratation.
    facons: faconsVue(cliksParPub.get(p.id)),
  }));

  // Après avoir décidé ce qui s'affiche, pas avant : on ne compte que ce qui est
  // réellement passé sous les yeux, filtre compris. Sans `await` bloquant le
  // rendu — un compteur légèrement bas vaut mieux qu'une page qui attend.
  void noterAffichages(supabase, triees);

  const maj = publications.length ? ilYA(publications[0].publieLe) : "";
  const def = DEFS.find((d) => d.cle === onglet) ?? DEFS[0];

  return (
    <>
      {/* LE TITRE SUIT L'ONGLET. « Ce qui se passe maintenant à Dax » et « On
          mange quoi maintenant ? » ne sont pas la même question, et l'écran
          doit répondre à celle qu'on vient de poser. Un titre fixe au-dessus
          d'un filtre qui change donne l'impression d'un tableau de bord ; un
          titre qui suit donne l'impression d'avoir été compris. */}
      <header className="fhead">
        <div className="live"><span className="dot" aria-hidden="true" />En direct · {cfg.nom}</div>
        <h1>
          {def.titre(cfg.nom).split("\n").map((l, i) => (
            <span key={i} className="lg">{l}</span>
          ))}
        </h1>
        <div className="upd">
          {/* Le sous-titre est COMPTÉ, jamais annoncé : un chiffre inventé se
              démonte au premier coup d'œil au fil, et c'est la seule chose que
              cette application vend — que ce qui est écrit soit vrai. */}
          {sousTitre(visibles, onglet) || `Tout ce qui se passe à ${cfg.nom}`}
          {maj ? ` · mis à jour ${maj}` : ""}
        </div>
      </header>

      <section className="pulse" aria-label="Le pouls de la ville">
        <div className="n">{pouls.phrase}</div>
        <div className="sub">{pouls.sous}</div>

        {/* Un sous-compteur à zéro se lit comme « il n'y a rien » : on n'affiche
            que ceux qui portent une information. */}
        {(pouls.pres > 0 || pouls.bientot > 0 || pouls.places > 0) && (
          <div className="rows">
            {pouls.pres > 0 && <div className="r"><b>{pouls.pres}</b><span>près de vous</span></div>}
            {pouls.bientot > 0 && <div className="r"><b>{pouls.bientot}</b><span>finissent bientôt</span></div>}
            {pouls.places > 0 && <div className="r"><b>{pouls.places}</b><span>places libres</span></div>}
          </div>
        )}

        {/* LE PONT entre les deux premiers onglets, et le seul. Si l'habitant ne
            perçoit pas la différence entre Le Direct et À saisir, l'architecture
            a échoué — ce bouton est ce qui la rend évidente. */}
        {publications.length > 0 && (
          <Link href={`/ville/${ville}/a-saisir`} className="cta">
            Voir ce qui vaut le coup maintenant →
          </Link>
        )}
      </section>

      <nav className="chips" aria-label="Ce que vous cherchez">
        {DEFS.map((d) => (
          <Link
            key={d.cle}
            href={d.cle === "tout" ? `/ville/${ville}` : `/ville/${ville}?f=${d.cle}`}
            className={`chip${onglet === d.cle ? " on" : ""}`}
            scroll={false}
          >
            {d.label}
          </Link>
        ))}
        <BoutonPosition />
      </nav>

      {cartes.length > 0 ? (
        <>
          <div className="sect">
            <div className="st">Le fil</div>
            <div className="ss">
              {/* Le libellé suit le tri réel. Il annonçait « du plus récent au
                  plus ancien » alors que le fil part désormais de ce qui
                  disparaît le plus tôt — un écran qui décrit mal son propre
                  ordre est pire qu'un écran muet. */}
              ce qui part en premier
              {pouls.fenetreLarge ? " · les sept derniers jours" : ""}
            </div>
          </div>
          <div className="feed">
            {cartes.map((c) => (
              <Carte key={c.id} p={c} gardee={mesGardees.has(c.id)} ville={ville} />
            ))}
          </div>
        </>
      ) : (
        <div className="vide">
          <h3>{cfg.active ? "Rien de neuf pour l'instant" : `${cfg.nom} n'est pas encore couverte`}</h3>
          <p>
            {cfg.active
              ? onglet !== "tout"
                ? "Rien dans cette catégorie en ce moment. Le fil ne garde que ce qui est encore vrai — essayez « Tout », ou revenez tout à l'heure."
                : "Le fil ne garde que ce qui est encore vrai aujourd'hui. Les commerçants publient au fil de la journée : revenez tout à l'heure."
              : "Aucun commerce n'a encore rejoint Le Direct ici. C'est en train de se construire, ville par ville."}
          </p>
        </div>
      )}
    </>
  );
}
