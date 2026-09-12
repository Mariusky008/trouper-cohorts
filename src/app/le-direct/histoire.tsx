"use client";

// 🏠 LA PAGE D'ACCUEIL — pour quelqu'un qui n'a jamais entendu parler de Clikme.
//
// ═══ CE QUI A CHANGÉ, ET POURQUOI TOUT A ÉTÉ REPRIS ════════════════════════
//
// « Le concept a changé, donc il va falloir la changer. Aujourd'hui c'est :
// regarder ce qui se passe dans votre ville à l'instant t, tous vos commerçants
// mettent en ligne des offres pour la journée, vous pouvez les regarder, les
// swiper, les partager, mais aussi et SURTOUT les essayer virtuellement avant
// de vous déplacer. »
//
// LA PAGE D'AVANT RACONTAIT QUATRE SITUATIONS — le midi, un désistement, un
// concert, un poste à pourvoir. Elles étaient vraies, bien écrites, et elles
// occupaient soixante pour cent de quinze mille points pour raconter ce que
// N'IMPORTE QUELLE application de ville pourrait raconter. Ce qui ne se trouve
// nulle part ailleurs — l'essai sur soi — arrivait après.
//
// ═══ L'ARBITRAGE QUI ORGANISE TOUTE LA PAGE ═══════════════════════════════
//
// L'ESSAI FAIT VENIR. LE DIRECT FAIT REVENIR.
//
// L'essayage est le seul geste que personne d'autre ne propose : visuel,
// démontrable en trois secondes, c'est l'hameçon. Mais on n'essaie pas une
// coupe tous les jours ; ce qui fait rouvrir l'application demain, c'est le
// désistement à deux cents mètres. UNE PAGE D'ACCUEIL EST UNE SURFACE
// D'ACQUISITION : l'essai prend donc le titre, et l'argument de retour arrive
// immédiatement derrière. Décidé avec le propriétaire du produit, pas supposé.
//
// ═══ QUATRE CHOSES QU'IMPOSE « IL NE CONNAÎT PAS CLIKME » ═════════════════
//
//   1. LE MOT « FANTÔME » SE GAGNE. Pour nous c'est l'unité du produit ; pour
//      un inconnu ça ne veut rien dire et ça sonne gadget. On montre le mur
//      d'abord, on le nomme après. Jamais avant qu'il en ait vu un.
//   2. « LE DIRECT » EST DU VOCABULAIRE D'INITIÉ. On montre ce qui change dans
//      la journée ; on ne le baptise pas en titre. La marque est CLIKME, et
//      « le direct » redevient le nom d'un écran à l'intérieur.
//   3. ON DIT QUE C'EST UNE MAQUETTE AVANT QU'IL OUVRE, pas dans le pied de
//      page. Sinon il entre, voit « Chez Bergine », et comprend tout seul qu'on
//      lui a raconté une histoire. Une ligne suffit, et elle est vraie : « les
//      commerces de la démo sont inventés, l'essai sur votre photo, non ».
//   4. IL N'A AUCUNE RAISON DE CONFIER SA PHOTO. Le chemin « voir avec une
//      photo d'exemple » est donc à côté du bouton, pas caché.
//
// ═══ ET LE BOUTON LIVRE LA PROMESSE, PAS UN PAQUET D'ANNONCES ═════════════
//
// `?essai=1` ouvre l'application DIRECTEMENT sur l'essai. Un bouton qui dit
// « Essayer sur moi » et livre « voici vingt-quatre annonces » perd la moitié
// des gens entre la promesse et la preuve.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MARQUE } from "@/lib/marque";
import { Miroir, LeMur } from "./essai-fantome";
import { TroisMoments, VitrineVivante } from "./vitrine";

/**
 * L'ADRESSE DU BOUTON, ÉCRITE UNE FOIS.
 *
 * `carte` CHOISIT LE COMMERCE, et ce choix appartient à cette page plutôt qu'à
 * l'application : c'est ici qu'on sait sur quelle promesse on vient d'appuyer.
 * Un coiffeur parce que c'est l'essai que tout le monde comprend sans effort —
 * on sait tous ce que c'est que d'hésiter devant une coupe.
 */
const ESSAYER = "/autour-de-moi?carte=coif-centre&essai=1";
const OUVRIR = "/autour-de-moi";

/** Un écran de l'application, avec sa légende. Jamais un dessin. */
type Ecran = { src: string; alt: string; titre: string; dit: string };

/**
 * COMMENT ÇA MARCHE — LE SEUL MODE D'EMPLOI DE LA PAGE, ET IL FAIT TROIS LIGNES.
 *
 * QUELQU'UN QUI NE CONNAÎT PAS LE PRODUIT A BESOIN DE SAVOIR CE QU'ON VA LUI
 * DEMANDER avant d'appuyer. Pas comment l'application est faite : ce qu'il aura
 * à faire, lui. Trois gestes, trois écrans, et on n'y revient plus.
 *
 * CE SONT DE VRAIES CAPTURES de l'application qui tourne — voir `capture-ld.mjs`
 * dans le brouillon. Une page d'accueil qui redessine son produit en plus joli
 * promet un écran qui n'existe pas, et la première ouverture dément la publicité.
 */
/**
 * LE TROISIÈME ÉCRAN EST CELUI DE LA CIRIÈRE, ET C'EST UNE CONTRAINTE HONNÊTE.
 *
 * Le rendu d'une coupe passe par un modèle d'image. Cet environnement n'a AUCUNE
 * clé : la capture sortait donc avec « L'essayage n'a pas abouti (fetch failed) »
 * en travers de l'écran, et on ne met pas un échec sur une page d'accueil.
 *
 * L'ESSAI D'UN OBJET POSÉ SE CALCULE DANS LE TÉLÉPHONE. La bougie sur la table
 * passe par `lib/direct/essai.ts`, sans réseau et sans clé : ce rendu-là est
 * vrai, il sort ici, et c'est exactement le même geste. On montre donc ce qu'on
 * peut prouver plutôt que de fabriquer ce qu'on voudrait montrer.
 */
const ETAPES: Ecran[] = [
  {
    src: "/le-direct/essai-1-photo.jpg",
    alt: "L’écran d’essai du salon : « Votre coupe, avant le rendez-vous », et un bouton pour se photographier.",
    titre: "Vous photographiez",
    dit: "Vous, ou l’endroit où la chose ira. Rien à installer, aucun compte à créer.",
  },
  {
    src: "/le-direct/essai-2-choisir.jpg",
    alt: "La grille des coupes proposées par le salon, avec leur prix.",
    titre: "Vous choisissez",
    dit: "Ce que ce commerçant-là propose aujourd’hui, avec son prix.",
  },
  {
    src: "/le-direct/essai-3-rendu.jpg",
    alt: "Le rendu : le trio de bougies posé sur la table du salon du client, avec la note en fantômes.",
    titre: "Vous voyez le résultat",
    dit: "Sur votre photo, pas sur un mannequin. Ensuite vous y allez — ou pas.",
  },
];

/**
 * CE QUI APPARAÎT QUAND ON ARRIVE DESSUS.
 *
 * Un seul observateur pour toute la page, et il LÂCHE ce qu'il a révélé :
 * l'animation ne se rejoue pas quand on remonte. Une page qui se réanime à
 * chaque passage donne le mal de mer et empêche de relire.
 */
function useRevelation() {
  const racine = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const cibles = el.querySelectorAll<HTMLElement>("[data-r]");
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      cibles.forEach((c) => c.classList.add("vu"));
      return;
    }
    const o = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("vu");
          o.unobserve(e.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    cibles.forEach((c) => o.observe(c));
    return () => o.disconnect();
  }, []);
  return racine;
}

export function Histoire() {
  const racine = useRevelation();

  /**
   * L'APPLICATION S'OUVRE DANS LA PAGE, ET NON À LA PLACE.
   *
   * LE DÉFAUT, ET IL EST DE CEUX QUI COÛTENT TOUT : « quand je clique dessus
   * je pars sur une autre page et je ne peux pas revenir facilement, et sur
   * téléphone on sait que si la personne part elle ne reviendra plus ». C'est
   * exact. Une page d'accueil dont le seul bouton est une porte de sortie sans
   * poignée de retour dépense en une seconde tout ce qu'elle a mis deux
   * minutes à construire.
   *
   * L'ESSAI SE POSE DONC PAR-DESSUS, plein écran, avec une seule chose en
   * plus : « ✕ Fermer ». On essaie, on ferme, on est exactement là où on
   * s'était arrêté — même position dans la page, même section.
   *
   * LE LIEN RESTE UN VRAI LIEN. On intercepte l'appui, mais l'adresse est
   * écrite : un appui long, un clic du milieu ou « ouvrir dans un nouvel
   * onglet » continuent de marcher, et la page reste utilisable sans
   * JavaScript.
   */
  const [essai, setEssai] = useState<string | null>(null);
  useEffect(() => {
    if (!essai) return;
    /* LA PAGE NE DOIT PAS DÉFILER DERRIÈRE — sur téléphone, le doigt qui
       balaie une carte de l'application ferait autrement glisser la page
       d'accueil sous elle.

       ON LA FIGE À SA POSITION, ON NE COUPE PAS SON DÉFILEMENT. DÉFAUT MESURÉ
       PAR LE TEST : overflow:hidden sur le corps de page suffit à bloquer,
       mais il fait retomber le document à zéro — mesuré, 968 avant, 0 après.
       Quelqu'un qui essayait l'application depuis la section du coiffeur la
       refermait tout en haut de la page, c'est-à-dire nulle part. C'est
       exactement le défaut qu'on venait de corriger, déplacé d'un cran.
       On décale donc le corps de sa propre hauteur de défilement, et on la
       rend en fermant. */
    const y = window.scrollY;
    const avant = {
      position: document.body.style.position,
      top: document.body.style.top,
      largeur: document.body.style.width,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEssai(null);
    };
    window.addEventListener("keydown", auClavier);
    return () => {
      document.body.style.position = avant.position;
      document.body.style.top = avant.top;
      document.body.style.width = avant.largeur;
      // INSTANTANÉ, ET C'EST NÉCESSAIRE : la feuille globale du site pose
      // scroll-behavior:smooth sur la racine. Sans ce mot, refermer l'essai
      // déclenchait un défilement animé d'une seconde depuis le haut de la
      // page — mesuré : 75 points à 200 ms, 420 à 1 200 ms. On revient d'où
      // l'on vient, on n'y retourne pas en voiture.
      window.scrollTo({ top: y, behavior: "instant" });
      window.removeEventListener("keydown", auClavier);
    };
  }, [essai]);

  /** Ouvre l'adresse par-dessus la page. On laisse passer tout ce qui veut un autre onglet. */
  const ouvrir = (url: string) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setEssai(url);
  };

  return (
    <div ref={racine}>
      {/* ─── LA BARRE ───
          Elle ne sert qu'à deux choses : dire de quelle application on parle,
          et donner la porte. Une page qui commence par un menu de six entrées
          fait attendre son sujet. */}
      <header className="ld-nav">
        <span className="ld-marque">
          <i aria-hidden="true">⚡</i>
          {MARQUE}
        </span>
        <Link href={ESSAYER} className="ld-cta petit" onClick={ouvrir(ESSAYER)}>
          Essayer
        </Link>
      </header>

      {/* ═══ 1 · L'ACCROCHE ═══════════════════════════════════════════════════

          LE TITRE EST UN BÉNÉFICE, PAS UN MÉCANISME. « Le direct de votre
          ville » était vrai et ne disait rien à quelqu'un qui ne connaît pas :
          ça décrivait notre technologie, pas son problème à lui. « Avant d'y
          aller, voyez ce que ça donne sur vous » est sa phrase, pas la nôtre.

          ET LE SOUS-TITRE PORTE LES QUATRE FAITS EN UNE PHRASE : c'est local,
          c'est aujourd'hui, c'est sur SA photo, c'est avant de se déplacer.
          Aucun des quatre ne peut manquer, et aucun cinquième n'a sa place. */}
      <section className="ld-hero">
        <div className="ld-halo" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="ld-hero-mot">
          <p className="ld-oeil" data-r>
            L’application de votre ville
          </p>
          <h1 className="ld-t1" data-r style={{ "--d": "80ms" } as React.CSSProperties}>
            Avant d’y aller, voyez ce que ça donne sur vous.
          </h1>
          <p className="ld-s" data-r style={{ "--d": "160ms" } as React.CSSProperties}>
            Une coupe, une monture, une tenue, un tatouage&nbsp;: les commerçants de
            votre ville publient ce qu’ils proposent <b>aujourd’hui</b>, et vous le
            voyez <b>sur votre photo</b> avant de vous déplacer.
          </p>
        </div>

        {/* LE MIROIR EST MONTÉ DANS L'ACCROCHE, ET C'EST TOUT LE CHANGEMENT.
            Il était un chapitre au milieu de la page ; or c'est LA promesse du
            titre, et une promesse ne se démontre pas trois écrans plus bas.

            ET C'EST LE SEUL OBJET ANIMÉ DE CET ÉCRAN. La vitrine tournait ici
            en même temps que lui : deux choses qui bougent se volent le regard,
            et on finit par ne regarder aucune des deux. La vitrine descend au
            chapitre 3, où elle a un tout autre travail à faire. */}
        <div className="ld-miroir-h" data-r style={{ "--d": "240ms" } as React.CSSProperties}>
          <Miroir />
        </div>

        <div className="ld-hero-b" data-r style={{ "--d": "320ms" } as React.CSSProperties}>
          <Link href={ESSAYER} className="ld-cta grand" onClick={ouvrir(ESSAYER)}>
            Essayer sur moi
          </Link>
          {/* CE N'EST PAS UN LIEN, DONC CE N'EST PLUS EN GRAS. Le gras le
              faisait passer pour un second bouton, et un faux bouton sous le
              vrai coûte un appui dans le vide au moment précis où l'on venait
              de décider. La photo d'exemple attend à l'intérieur, une tape
              plus loin — on l'annonce, on ne la promet pas ici. */}
          <p className="ld-n">
            Sans compte, rien à installer. Une photo d’exemple vous attend si
            vous préférez.
          </p>
          {/* ═══ ON DIT QUE C'EST UNE MAQUETTE, ET ON LE DIT AVANT ═══

              C'ÉTAIT DANS LE PIED DE PAGE, DONC APRÈS. Quelqu'un qui ouvre
              l'application et tombe sur « Chez Bergine » et « Le Bocal de
              Margot » comprend tout seul qu'on lui a raconté une histoire — et
              il ne le découvre jamais au bon moment.

              DIT ICI, LE POINT FAIBLE DEVIENT UNE PREUVE. Les commerces sont
              inventés parce qu'aucun vrai commerçant n'a encore signé ; l'essai,
              lui, calcule vraiment sur la photo qu'on lui donne. La seule phrase
              de la page qui désamorce la déception d'après. */}
          <p className="ld-aveu" data-r>
            Les commerces de la démo sont inventés.
            <b> L’essai sur votre photo, non.</b>
          </p>
        </div>
      </section>

      {/* ═══ 2 · COMMENT ÇA MARCHE ════════════════════════════════════════════
          Trois gestes, trois vraies captures, et on n'y revient plus. Quelqu'un
          qui ne connaît pas le produit a besoin de savoir ce qu'on va lui
          demander AVANT d'appuyer — pas comment l'application est faite. */}
      <section className="ld-cas t-essai" aria-labelledby="t-comment">
        <div className="ld-cas-h">
          <p className="ld-quand" data-r>
            <i aria-hidden="true">●</i>
            En trois gestes
          </p>
          <h2 id="t-comment" className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
            Vous n’installez rien.
            <span>Vous prenez une photo.</span>
          </h2>
        </div>
        <ol className="ld-etapes">
          {ETAPES.map((e, i) => (
            <li key={e.src} data-r style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
              <div className="ld-tel">
                <span className="ld-rang">{i + 1}</span>
                <Image
                  src={e.src}
                  alt={e.alt}
                  width={780}
                  height={1688}
                  sizes="(max-width:760px) 70vw, 280px"
                  className="ld-img"
                />
              </div>
              <b>{e.titre}</b>
              <em>{e.dit}</em>
            </li>
          ))}
        </ol>
        <p className="ld-chute" data-r>
          Douze secondes entre la photo et le résultat.
        </p>
      </section>

      {/* ═══ 3 · CHEZ QUI ═════════════════════════════════════════════════════
          LA VITRINE A CHANGÉ DE TRAVAIL EN CHANGEANT DE PLACE. Dans l'accroche
          elle concurrençait le miroir ; ici elle répond à la seule question qui
          reste après la démonstration — « d'accord, mais chez qui ? » — et elle
          y répond sans un mot, en passant d'un métier à l'autre. */}
      <section className="ld-cas t-menthe" aria-labelledby="t-chezqui">
        <div className="ld-cas-h">
          <p className="ld-quand" data-r>
            <i aria-hidden="true">●</i>
            Dix métiers
          </p>
          <h2 id="t-chezqui" className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
            Et pas seulement chez le coiffeur.
          </h2>
          <p className="ld-s" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
            Le tatoueur, l’opticien, la prothésiste ongulaire, la boutique, la
            friperie, la fleuriste, la créatrice de bijoux&nbsp;— <b>et le
            restaurant d’en face</b>, qui n’a rien à faire essayer mais qui a un
            plat du jour.
          </p>
        </div>
        <VitrineVivante />
      </section>

      {/* ═══ 4 · CE QUI CHANGE DANS LA JOURNÉE ════════════════════════════════
          L'ESSAI FAIT VENIR, CECI FAIT REVENIR. Trois vraies cartes à trois
          heures : voir `TroisMoments`. C'est l'argument de rétention, et il
          arrive juste derrière l'hameçon — jamais devant. */}
      <section className="ld-cas t-or" aria-labelledby="t-journee">
        <div className="ld-cas-h">
          <p className="ld-quand" data-r>
            <i aria-hidden="true">●</i>
            Aujourd’hui
          </p>
          <h2 id="t-journee" className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
            Et ça change toute la journée.
          </h2>
          <p className="ld-s" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
            Ce ne sont pas des fiches d’annuaire. Chaque commerçant publie ce
            qu’il a <b>maintenant</b>&nbsp;: un plat à midi, une place qui se
            libère à quatorze heures, les derniers bouquets à dix-sept.
          </p>
        </div>
        <TroisMoments />
        <p className="ld-chute" data-r>
          Un désistement à quatorze heures se sait à quatorze heures deux.
          Ailleurs, il reste vide.
        </p>
      </section>

      {/* ═══ 5 · CE QUE VOUS LAISSEZ ══════════════════════════════════════════
          Le mur des fantômes. Il arrive ICI et pas plus tôt : on ne peut pas
          expliquer à quelqu'un ce qu'il laisse avant de lui avoir montré ce
          qu'il essaie. Et c'est le chapitre qui fait passer de « joli gadget »
          à « endroit » — la centième personne y a une meilleure expérience que
          la première, ce qui est la définition d'un réseau. */}
      <LeMur />

      {/* ═══ 6 · ON DÉCIDE RAREMENT SEUL ══════════════════════════════════════

          LE SALON PUBLIC À SEUIL A ÉTÉ RETIRÉ DE CETTE PAGE, et c'est une
          décision, pas un oubli. Il portait la mention « Bientôt » : sur une
          page qui doit convaincre quelqu'un qui ne connaît rien, une promesse
          non livrée coûte plus qu'elle ne rapporte. Il reviendra le jour où il
          existe dans l'application. */}
      <section className="ld-cas t-rose" aria-labelledby="t-salon">
        <div className="ld-cas-h">
          <p className="ld-quand" data-r>
            <i aria-hidden="true">●</i>
            À plusieurs
          </p>
          <h2 id="t-salon" className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
            On ne choisit pas une coupe tout seul.
          </h2>
          <p className="ld-s" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
            Votre essai part dans une conversation privée, avec les gens que vous
            choisissez. Ils voient le rendu, ils répondent, et la réservation se
            fait depuis la conversation. <b>Elle vit le temps de l’annonce, puis
            elle s’éteint.</b>
          </p>
        </div>
        <div className="ld-bande une">
          <figure className="ld-ec fin" data-r>
            <div className="ld-tel">
              <Image
                src="/le-direct/resto-salon.jpg"
                alt="Une conversation privée sur une annonce : trois amis répondent, et la table est réservée pour quatre."
                width={720}
                height={1502}
                sizes="(max-width:760px) 66vw, 280px"
                className="ld-img"
              />
            </div>
            <figcaption className="ld-dit">
              <b className="ld-fin-b">
                <i aria-hidden="true">✓</i>
                Décidé, et réservé
              </b>
              Chacun voit ce que les autres proposent, et la conversation reste
              collée à l’annonce.
            </figcaption>
          </figure>
          <ul className="ld-atouts">
            {[
              ["🔒", "Avec les gens que vous choisissez", "Pas un fil public. Un salon par annonce, et il s’éteint avec elle."],
              ["🎪", "Il n’y a pas que les commerces", "Les concerts, les brocantes, les postes à pourvoir dans la rue d’à côté, et ce que les habitants se disent entre eux."],
              ["🕊️", "Un prénom suffit", "Pas de profil, pas d’abonnés, rien qui quitte votre téléphone sans vous."],
            ].map(([i, t, d], k) => (
              <li key={t} data-r style={{ "--d": `${k * 70}ms` } as React.CSSProperties}>
                <i aria-hidden="true">{i}</i>
                <span>
                  <b>{t}</b>
                  {d}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ LE BOUTON, À NOUVEAU ═════════════════════════════════════════════
          Le même mot qu'en haut, vers la même adresse. Deux libellés différents
          pour un même geste feraient croire à deux choses différentes. */}
      <section className="ld-final">
        <p className="ld-oeil" data-r>
          La différence
        </p>
        <h2 className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
          Partout ailleurs, on choisit sur une photo de mannequin.
          <span>Ici, sur la vôtre.</span>
        </h2>
        <Link href={ESSAYER} className="ld-cta grand" data-r onClick={ouvrir(ESSAYER)}>
          Essayer sur moi
        </Link>
        <p className="ld-n" data-r>
          Sans compte, rien à installer.
        </p>
        <Link href={OUVRIR} className="ld-second" data-r onClick={ouvrir(OUVRIR)}>
          Ou voir ce qui se passe à Dax maintenant →
        </Link>
        <p className="ld-n" data-r>
          Dax aujourd’hui. Votre ville ensuite.
        </p>
      </section>

      {/* ─── L'APPLICATION, PAR-DESSUS ───
          Même origine que cette page, donc le cadre est autorisé : la règle
          d'en-têtes du site pose frame-ancestors 'self' sur /autour-de-moi.
          Il n'est monté qu'à l'ouverture — une application entière chargée
          d'avance dans une page d'accueil coûterait à tout le monde le prix
          de ceux qui l'essaient. */}
      {essai && (
        <div className="ld-essai" role="dialog" aria-modal="true" aria-label={MARQUE}>
          <iframe src={essai} title={`${MARQUE} — essayer sur soi`} />
          <button type="button" className="ld-essai-x" onClick={() => setEssai(null)}>
            <i aria-hidden="true">✕</i>
            Fermer
          </button>
        </div>
      )}

      {/* ─── LE PIED DE PAGE ─── */}
      <footer className="ld-pied">
        <div className="ld-pied-h">
          <span className="ld-marque grand">
            <i aria-hidden="true">⚡</i>
            {MARQUE}
          </span>
          <p>Ce qui se passe dans votre ville, essayé sur vous.</p>
        </div>
        {/* TROIS LIENS, ET ILS EXISTENT TOUS. Un pied de page qui promet une
            page « commerçants » qui n'est pas écrite fait un 404 au moment
            précis où quelqu'un s'intéresse assez pour cliquer. */}
        <nav className="ld-pied-l" aria-label="Pied de page">
          <Link href={OUVRIR} onClick={ouvrir(OUVRIR)}>Ouvrir l’application</Link>
          <Link href="/essai-annonce">L’annonce, de près</Link>
          <Link href="/">Le site</Link>
        </nav>
        <p className="ld-pied-n">
          Maquette jouable&nbsp;: les commerces, les prénoms et les heures sont
          inventés. Aucun compte, aucune donnée ne quitte votre téléphone — sauf
          la photo de l’essai, le temps du rendu, et elle n’est pas conservée.
        </p>
      </footer>
    </div>
  );
}
