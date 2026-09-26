"use client";

/**
 * ✂️ LE PARCOURS COIFFURE, EN QUATRE ÉCRANS — d'après ses maquettes 2 à 5.
 *
 * ═══ SA COQUE, LA MÊME AUX QUATRE ÉTAPES ═══════════════════════════════════
 *
 * Le logo en haut, la pastille du salon sous lui à gauche, le fantôme qui
 * veille en haut à droite, la frise des quatre pas au milieu. Et sous tout ça,
 * la photo, qui prend l'écran entier.
 *
 * C'EST PLUS JUSTE QUE LA COQUE DU PARCOURS MODE, et c'est lui qui l'a dessinée
 * ainsi : on sait EN PERMANENCE chez qui on est. Le parcours mode ne le dit
 * qu'une étape sur deux, et il faudra l'y porter.
 *
 * ═══ LES QUATRE ÉTAPES ═════════════════════════════════════════════════════
 *
 *   1/4 — LA COUPE. « Et si vous l'essayiez sur vous ? »
 *   2/4 — L'ESSAYAGE. Avant et après, coupés au milieu, avec la mention de
 *         simulation — la seule mention qui reste sur ce produit.
 *   3/4 — LES AUTRES COUPES du salon, avec leur nom et leur prix.
 *   4/4 — LE SALON. « Envie de la faire pour de vrai ? »
 *
 * RIEN N'EST INVENTÉ : le nom du salon, sa distance, sa ville, le nom de la
 * coupe et son prix viennent du salon de la démo et de sa journée. Voir
 * `parcours-coiffure.ts`.
 */

import { useMemo, useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { FantomeAccueil } from "@/components/direct/fantome-accueil";
import { essaiDuCommerce, essayeursDu, photoDeLaCarte } from "@/lib/direct/plaque-parcours";
import { useRevelation } from "@/lib/direct/revelation";
import { DemandeRdv } from "@/components/direct/demande-rdv";
import { MurEssayeurs } from "@/components/direct/mur-essayeurs";
import { momentEnCours, toutesLesCartes } from "@/lib/direct/apercu-habitant";
import {
  APRES_COIFFURE,
  AVANT_COIFFURE,
  COMMERCE_COIFFURE,
  ETAPES_COIFFURE,
  VISAGES_COIFFURE,
} from "@/lib/direct/parcours-coiffure";

/** L'appareil photo des deux boutons pleins de ses maquettes. */
function Appareil() {
  return (
    <svg className="pc-i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.4 8.4h3.4l1.6-2.6h7.2l1.6 2.6h3.4a1.4 1.4 0 0 1 1.4 1.4v8.2a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 18V9.8a1.4 1.4 0 0 1 1.4-1.4Z" />
      <circle cx="12" cy="13.6" r="3.6" />
    </svg>
  );
}

export function ParcoursCoiffure({
  onFermer,
  /* ═══ LA BONNE TÊTE POUR LA BONNE COUPE ════════════════════════════════

     « Pour chaque coupe, on va quand même mettre la bonne tête. »

     LE PARCOURS MONTRAIT UN SEUL AVANT/APRÈS pour les quatre salons : on
     choisissait un dégradé chez le barbier et on voyait un carré sur une
     femme. C'est le même défaut que les lasagnes du restaurant, vu de l'autre
     paquet, et il se répare de la même façon — par une paire de photos par
     commerce, dans `plaque-parcours.ts`. */
  commerce,
}: {
  onFermer: () => void;
  commerce?: string;
}) {
  const [etape, setEtape] = useState(1);
  /* ELLE OUVRE SUR LA PERSONNE, PAS AU MILIEU — voir `revelation.ts`. Un
     demi-visage coiffe a cote d'un demi-visage qui ne l'est pas ne se lit pas
     comme un essayage : il faut DEJA savoir ce que la poignee fait. */
  const [glissiere, setGlissiere] = useState(6);
  const cadre = useRef<HTMLDivElement>(null);

  const heure = useMemo(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }, []);

  const cle = commerce || COMMERCE_COIFFURE;
  const { salon, coupe } = useMemo(() => {
    const s = toutesLesCartes().find((c) => c.id === cle);
    /* LA COUPE EST LE MOMENT DONT LA PHOTO EST CELLE DU PARCOURS. Il n'y en a
       pas pour la paire avant/après — ce sont des photos d'accueil, pas des
       moments — donc on prend l'offre en cours du salon : c'est bien la coupe
       qu'il propose à cette heure-ci, et son prix est le sien. */
    const m = s
      ? (s.moments ?? []).find((x) => x.photo === APRES_COIFFURE) ??
        (s.moments ?? []).find((x) => x.photo)
      : undefined;
    return { salon: s, coupe: m ?? (s ? momentEnCours(s, heure) : null) };
  }, [heure, cle]);

  /* LA PAIRE DE CE SALON-LÀ. L'avant est celui de la même personne d'un salon
     à l'autre ; chez le barbier, la personne change, donc les deux photos. */
  const { avant: AVANT, apres: APRES } = essaiDuCommerce(cle, {
    avant: AVANT_COIFFURE,
    apres: APRES_COIFFURE,
  });

  /* LES AUTRES COUPES DU QUARTIER ONT QUITTE LA TROISIEME ETAPE. Elles y
     tenaient lieu des trois portraits qu'on n'avait pas ; les portraits sont
     arrives, et l'ecran repond enfin a la question qu'il pose. Voir
     `VISAGES_COIFFURE`. */

  /* ═══ LES CROCHETS PASSENT AVANT LE RETOUR ANTICIPE ══════════════════

     `useRevelation` etait appele APRES `if (!salon) return null;`. Un crochet qui ne
     s'execute pas a tous les rendus casse l'ordre sur lequel React compte : le
     jour ou ce commerce n'existe pas — une faute de frappe dans un
     identifiant — le composant ne rendrait pas une page vide, il planterait.
     Ca ne se voyait pas parce que le commerce est toujours trouve ; la garde
     eslint `rules-of-hooks`, elle, l'a vu.

     RIEN ICI N'A BESOIN DU COMMERCE : les pas se comptent a partir de la cle et
     de l'etape, qui sont connues des le premier rendu. */
  /* CHAQUE SALON A SES TROIS ESSAYEURS — voir `ESSAYEURS`. Le salon du centre
     garde ses trois portraits d'origine, qui portent deja un prenom, un mot et
     une note ; les trois autres ont les leurs depuis qu'il les a fournis. */
  const essayeurs = essayeursDu(cle);
  /* LE SALON DU CENTRE GARDE SES TROIS PORTRAITS D'ORIGINE, convertis au meme
     format : ils portent deja un prenom, un mot et une note, et ce sont des
     essais — ils viennent de `VISAGES_COIFFURE`, pas d'un passage au salon. */
  const essayeursMontres =
    essayeurs.length > 0
      ? essayeurs
      : VISAGES_COIFFURE.map((v) => ({
          photo: v.photo,
          qui: v.qui,
          mot: v.mot,
          note: v.note,
          ou: `${v.ou} · ${v.avec}`,
          preuve: "essai" as const,
        }));
  const aLesAutres = cle === COMMERCE_COIFFURE || essayeurs.length > 0;
  const total = aLesAutres ? ETAPES_COIFFURE : ETAPES_COIFFURE - 1;
  /** Le pas reellement joue : on saute « les autres » quand on ne l'a pas. */
  const ici = !aLesAutres && etape >= 3 ? etape + 1 : etape;

  /* L'ESSAYAGE SE JOUE TOUT SEUL EN ARRIVANT : la personne, une seconde, puis
     la coupe qui se pose sur elle. Le premier doigt l'arrete. */
  const arreter = useRevelation({ actif: ici === 2, poser: setGlissiere, depart: 6, fin: 94 });

  if (!salon) return null;

  const nom = salon.nom;
  const titre = coupe?.titre ?? "";
  /**
   * LE NOM DE LA COUPE, ET NON L'ANNONCE.
   *
   * SA MAQUETTE TITRE « Le carré souple de Camille » : le nom de la COUPE. Nos
   * moments, eux, sont des annonces — « Une place vient de se libérer » — et
   * c'est ce qui s'affichait. On n'essaie pas une place qui se libère.
   *
   * LA COUPE EST DANS LA PREMIERE LIGNE DU MOMENT : « Coupe + brushing ».
   * L'annonce redescend en sous-titre, la où elle dit ce qu'elle a toujours
   * dit — pourquoi c'est maintenant. À défaut de première ligne, le titre de
   * l'annonce reprend sa place : mieux vaut une annonce en grand que rien.
   */
  const laCoupe = coupe?.lignes?.[0] ?? titre;
  const prix = coupe?.prix ?? "";
  const ou = `${salon.distance}${salon.ville ? ` · ${salon.ville}` : ""}`;

  const suivant = () => setEtape((e) => Math.min(total, e + 1));

  const bouger = (x: number) => {
    const r = cadre.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setGlissiere(Math.min(94, Math.max(6, ((x - r.left) / r.width) * 100)));
  };

  /** Le fond plein écran de l'étape courante. */

  /* ═══ « LE MEME CARRE SUR D'AUTRES VISAGES » N'EST PAS VRAI PARTOUT ════
     Les trois portraits sont ceux d'UNE coupe — le carre du salon du centre.
     Les montrer sous un degrade de barbier dirait « voici la meme coupe » en
     affichant trois femmes coiffees autrement. On ne le dit donc que la ou
     c'est vrai, et le parcours des autres salons a une etape de moins. Meme
     regle que le rideau du restaurant : l'etape existe si sa matiere existe. */

  /* ═══ L'ETAPE 1 MONTRE LE MODELE DE L'ANNONCE, PAS LE RESULTAT ════════

     « Etape 1 : il faut que ce soit la meme personne que la personne de
     l'annonce de depart, puisque la personne n'a pas encore essaye. A l'etape
     2 c'est celle qui essaye. Et etape 3, il faut que ce soit la personne qui
     vient d'essayer, donc de l'etape 2. »

     IL A RAISON SUR LA CHRONOLOGIE, ET C'EST UNE FAUTE DE RECIT. Le premier
     ecran ouvrait sur l'APRES : on voyait le resultat de l'essayage avant
     d'avoir appuye sur « essayer ». Les deux ecrans suivants ne montraient donc
     plus rien de neuf, et la glissiere avant/apres perdait son effet — on avait
     deja vu la reponse.

     TROIS TEMPS, TROIS VISAGES : la coupe telle que le salon l'annonce, puis
     elle sur vous, puis sur d'autres que vous. `photoAnnonce` est exactement
     celle de la carte du paquet — voir `photoDeLaCarte`. */

  const photoAnnonce = photoDeLaCarte(cle) ?? salon.photo ?? APRES;
  /* ET LE DERNIER ECRAN GARDE L'ESSAI DERRIERE LUI. Il montrait la devanture
     du salon : on demandait « cette coupe vous plait SUR VOUS ? » devant une
     vitrine. La reponse est la tete qu'on vient de voir, pas l'adresse. */
  const fond = ici === 1 ? photoAnnonce : APRES;

  return (
    <div className={`pc pc-e${ici}`}>
      {/* L'ÉTAPE 2 remplace le fond par sa glissière : c'est le seul écran où
          la photo n'est pas une photo mais une comparaison. */}
      {etape !== 2 && (
        <>
          {/* ═══ DEUX COUCHES, POUR VOIR TOUTE LA COUPE ════════════════════
              « On ne voit pas la coupe quasiment, il y a un trop gros
              close-up. »
              MESURÉ : `coiffure-homme-face.jpg` FAIT 590 × 590 et le cadre du
              téléphone 420 × 900. En `cover`, la photo est agrandie jusqu'à
              900 points de large pour remplir la hauteur — on n'en voyait donc
              que 47 % de la largeur, et les cheveux sortaient des deux côtés.
              LA PHOTO ENTIÈRE SE POSE SUR UNE COPIE FLOUE D'ELLE-MÊME. Le
              cadre reste plein, rien n'est coupé, et le flou derrière fait un
              fond de studio au lieu de deux bandes noires. */}
          <div className="pc-fond flou" style={{ backgroundImage: `url("${fond}")` }} aria-hidden="true" />
          <div className="pc-fond entier" style={{ backgroundImage: `url("${fond}")` }} />
          <div className="pc-voile" />
        </>
      )}

      {/* ═══ LA COQUE, IDENTIQUE AUX QUATRE ÉTAPES ═══════════════════════ */}
      <header className="pc-haut">
        {/* LE VRAI LOGO, PAS UN MOT EN GRAS. « Clikme » n'a pas de k :
            il a un curseur a sa place, et c'est tout le nom — on clique,
            et c'est moi. Ecrit au clavier, le mot perdait la seule chose
            qui en fait une marque. Le curseur est un trace, donc il suit
            la taille et la couleur de la ligne. Voir `mot-marque.tsx`. */}
        <p className="pc-logo">
          <MotMarque />
        </p>
        <div className="pc-pas" aria-label={`Étape ${etape} sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <s key={i} className={i + 1 <= etape ? "on" : ""} />
          ))}
          <em>
            {etape}/{total}
          </em>
        </div>
        {/* ═══ LE FANTÔME EST LA PORTE DE L'ACCUEIL ═══════════════════════

            « Placer partout sur tous les écrans la petite maison pour revenir
            à l'accueil en haut à droite — ou mieux encore, il faut qu'on
            comprenne que le petit fantôme en haut à droite est fait pour
            revenir à l'accueil. »

            SA SECONDE IDÉE EST LA BONNE, et elle coûte moins cher que la
            première : le Fantôme est déjà là, à cette place, sur chaque écran
            de chaque parcours. Lui donner la fonction évite d'ajouter une
            sixième icône à un en-tête qui en porte déjà trois.

            CE QUI MANQUAIT POUR QU'ON LE COMPRENNE : que ça se voie. Il est
            donc un BOUTON — il réagit au doigt, il porte un nom pour les
            lecteurs d'écran, et la petite maison se pose sur son épaule pour
            dire où il mène. Une mascotte cliquable sans aucun signe reste une
            mascotte. */}
        <FantomeAccueil onClick={onFermer} classe="pc-f" />
      </header>

      {/* ═══ LA PASTILLE DU SALON A QUITTÉ LE MILIEU DE LA PHOTO ═══════════

          « "Un salon du centre" est là aussi en plein milieu, donc supprimer
          cette section. »

          ELLE ÉTAIT POSÉE EN ABSOLU SOUS L'EN-TÊTE, donc en plein sur le
          visage — la même faute que la bulle du parcours mode, au même endroit,
          pour la même raison : une position écrite à la main vaut pour une
          photo et pas pour la suivante.

          CHEZ QUI ON EST N'EST PAS PERDU : le premier écran le dit dans son
          bloc du bas, là où rien ne peut être recouvert, et le dernier écran
          est celui du salon. Ce qui disparaît est une étiquette qui répétait à
          toutes les étapes une information déjà donnée.

          ET LA PORTE VERS L'ACCUEIL PASSE DANS LE FANTÔME — voir l'en-tête. */}

      {/* ───────────────────────── 1/4 · LA COUPE ───────────────────────── */}
      {ici === 1 && (
        <section className="pc-bas">
          <h1 className="pc-t">
            {laCoupe.split(" ").slice(0, -1).join(" ")}{" "}
            <em>{laCoupe.split(" ").slice(-1)[0]}</em>
          </h1>
          <p className="pc-sous">Et si vous l’essayiez sur vous ?</p>
          {/* L'ANNONCE REDESCEND ICI : c'est elle qui dit pourquoi maintenant,
              et elle n'a jamais eu vocation a nommer la coupe. */}
          {titre && titre !== laCoupe && <p className="pc-annonce">{titre}</p>}
          {prix && <p className="pc-prix">{prix}</p>}
          {/* CHEZ QUI, DANS LE BLOC DU BAS. La pastille qui le disait en
              permanence tombait sur le visage ; ici la ligne ne peut rien
              recouvrir, et elle suffit — le dernier écran est celui du salon. */}
          <p className="pc-chez">
            Chez <b>{nom}</b> <i aria-hidden="true">📍</i>
            {ou}
          </p>
          <button type="button" className="pc-go" onClick={suivant}>
            <Appareil />
            Essayer cette coupe
            <s aria-hidden="true">→</s>
          </button>
          {/* ═══ LE SECOND BOUTON EST PARTI DES QUATRE ÉCRANS ══════════════

              « "Prendre rendez-vous" : trop tôt pour l'afficher, donc
              supprimer. Étape 3 : "Revenir à mon essai", supprimer. Étape 4 :
              "Revenir au choix", supprimer. »

              C'EST LA MÊME FAUTE QUATRE FOIS, ET C'EST LA MIENNE. Chaque écran
              portait un second bouton de la taille du premier : deux
              propositions côte à côte ne se choisissent pas, elles se comptent.
              Et l'une d'elles demandait un rendez-vous à quelqu'un qui n'a pas
              encore vu la coupe sur lui — c'est-à-dire avant d'avoir la seule
              raison de le prendre.

              RECULER RESTE POSSIBLE : la flèche du haut est là pour ça, et le
              Fantôme ramène à l'accueil. Ce qui disparaît est la deuxième porte
              au milieu du chemin, pas le chemin de retour. */}
        </section>
      )}

      {/* ──────────────────────── 2/4 · L'ESSAYAGE ──────────────────────── */}
      {ici === 2 && (
        <>
          <div
            className="pc-gliss"
            ref={cadre}
            style={{ "--pc-g": `${glissiere}%` } as React.CSSProperties}
            onPointerDown={(e) => {
              arreter();
              e.currentTarget.setPointerCapture(e.pointerId);
              bouger(e.clientX);
            }}
            onPointerMove={(e) => e.buttons > 0 && bouger(e.clientX)}
          >
            <div className="pc-g-img" style={{ backgroundImage: `url("${APRES}")` }} />
            {/* ON DÉCOUPE, ON NE REDIMENSIONNE PAS : la boîte garde ses
                dimensions, donc les deux moitiés restent cadrées pareil. */}
            <div className="pc-g-img avant" style={{ backgroundImage: `url("${AVANT}")` }} />
            <span className="pc-g-trait" aria-hidden="true" />
            <span className="pc-g-et g">Sa photo</span>
            <span className="pc-g-et d">Avec la coupe</span>
          </div>
          <div className="pc-voile" />
          <section className="pc-bas">
            <h1 className="pc-t court">
              Cette coupe, <em>sur vous.</em>
            </h1>
            {/* LA SEULE MENTION QUI RESTE SUR CE PRODUIT. Elle ne dit pas « ceci
                est une démonstration » — tout l'écran en est une — elle dit
                « cette image n'est pas une photo de vous ». */}
            {/* CE QUE FAIT L'ECRAN, EN UNE LIGNE. « Il faut que cette etape
                soit comprehensible : c'est quelqu'un qui met sa photo et qui
                veut voir ce que la coupe donne sur lui. » L'animation le
                montre ; cette ligne le nomme, pour qui arrive apres elle. */}
            {/* NEUTRE, PARCE QUE LE BARBIER COIFFE DES HOMMES. « Elle a envoyé
                sa photo » s'affichait sous un visage d'homme : la phrase
                nomme maintenant le geste, pas la personne. */}
            <p className="pc-geste">Sa photo, et la coupe posée dessus. Tirez pour comparer.</p>
            <p className="pc-simu">Simulation · résultat indicatif</p>
            <button type="button" className="pc-go" onClick={suivant}>
              <Appareil />
              Voir d’autres essais
              <s aria-hidden="true">→</s>
            </button>
          </section>
        </>
      )}

      {/* ───────────────────── 3/4 · LES AUTRES COUPES ──────────────────── */}
      {/* ═══ 3/4 · TROIS GRANDS VISAGES, QU'ON FAIT DÉFILER ═════════════

          « Rendre l'écran beaucoup plus visuel. Aujourd'hui les témoignages
          sont petits et le grand portrait ressemble encore à une image de
          campagne. Je montrerais trois grands visages différents portant cette
          coupe, que l'on peut faire défiler. »

          LE PLUS GRAND ESPACE ALLAIT À CE QU'ON AVAIT DÉJÀ VU — le portrait de
          l'étape d'avant — et le plus petit à ce qu'on venait montrer. Les
          trois prennent maintenant l'écran, une à la fois. Voir
          `mur-essayeurs.tsx`, qui porte aussi la distinction des deux preuves. */}
      {ici === 3 && (
        <section className="pc-bas pc-mur">
          <h1 className="pc-t court">
            La même coupe, <em>sur d’autres que vous.</em>
          </h1>
          <MurEssayeurs essayeurs={essayeursMontres} classe="pc" cadrage="visage" />
          <button type="button" className="pc-go" onClick={suivant}>
            <Appareil />
            Je la veux sur moi
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ───────────────────────── 4/4 · LE SALON ───────────────────────── */}
      {/* ═══ 4/4 · LA DEMANDE DE RENDEZ-VOUS ════════════════════════════

          « Je remplacerais le dernier écran par : "Cette coupe vous plaît sur
          vous ? Coupe homme · 22 € · Un barbier de la halle · Demander un
          rendez-vous →". »

          CE QUI ÉTAIT LÀ NE FAISAIT RIEN. « Envie de la faire pour de vrai ? »
          félicitait, puis proposait un itinéraire — c'est-à-dire la seule chose
          que n'importe quelle fiche Google donne déjà. Tout le parcours menait
          à ce que ClikMe n'apporte pas.

          L'ÉCRAN EST LE MÊME SUR LES TROIS PARCOURS. Voir `demande-rdv.tsx` :
          la suite — quand, ce que le commerçant reçoit, et ses trois chiffres —
          y est écrite une fois pour la mode, la beauté et la déco. */}
      {ici === 4 && (
        <section className="pc-bas">
          <DemandeRdv
            metier="coiffure"
            commerce={cle}
            quoi={laCoupe}
            prix={prix}
            nom={nom}
            essai={APRES}
            classe="pc"
          />
        </section>
      )}
    </div>
  );
}
