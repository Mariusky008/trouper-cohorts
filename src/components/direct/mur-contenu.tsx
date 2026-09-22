"use client";

// 👻 LE MUR DU JOUR — la feuille qui monte sur la page du commerce.
//
// ═══ CE QUI A CHANGÉ, ET POURQUOI LA PREMIÈRE VERSION ÉTAIT À CÔTÉ ════════
//
// « J'ai l'impression qu'on est très très loin de ce que j'attends. »
//
// TROIS ERREURS, ET ELLES VENAIENT TOUTES DE LA MÊME : j'avais gardé la
// grammaire du paquet là où ce n'est pas un paquet.
//
//   1. CE N'EST PAS UNE PAGE, C'EST UNE FEUILLE. Elle monte PAR-DESSUS la page
//      du commerce, qui reste visible en haut — on ne quitte pas le commerce
//      pour voir son mur, on le regarde depuis chez lui.
//   2. LE MUR N'EST PAS UN PAQUET QU'ON BALAIE. C'est une grille : les fantômes
//      de la maison en grand, les clients du jour en dessous, tout visible d'un
//      coup. Un fantôme par écran obligeait à en traverser six pour savoir s'il
//      s'y passait quelque chose — or ce qu'on veut savoir en arrivant, c'est
//      justement : est-ce qu'il s'y passe quelque chose ?
//   3. DÉPOSER EST UN DEUXIÈME ÉCRAN, PAS UN BOUTON. Un verbe, une phrase, une
//      photo — et pour les métiers d'essai, autre chose encore.
//
// ═══ LES DEUX DÉPÔTS, ET C'EST LE LIEU QUI DÉCIDE ═════════════════════════
//
// ANNONCE — restaurant, bar, commerce : un verbe pris dans une liste fermée,
// cent cinquante signes, une photo facultative.
//
// ESSAI — bijou, ongles, coiffure, objet chez soi : LE CLIENT PHOTOGRAPHIE CE
// QUI VA RECEVOIR LA CHOSE. Son poignet pour un bracelet, sa main pour une pose,
// sa table de salon pour une bougie. La photo du commerçant vient s'y poser.
// C'est ce qui rend la mécanique possible SANS VISAGE : on ne photographie pas
// la personne, on photographie l'endroit où la chose va.
//
// L'IMAGE FINALE N'EST PLUS SIMULÉE, ET C'EST LE CHANGEMENT DE CETTE VERSION.
// Cette note disait qu'une composition demanderait « un modèle d'image, une
// facture par essai et quelques secondes d'attente ». C'était l'hypothèse, et
// elle était fausse : `lib/direct/essai.ts` la calcule DANS LE TÉLÉPHONE, en une
// soixantaine de millisecondes, sans clé, sans serveur et sans qu'un seul octet
// de la photo du client parte quelque part. L'écran affiche le temps réel du
// calcul plutôt qu'un adjectif.
//
// CE QU'ELLE NE FAIT TOUJOURS PAS, ET C'EST ÉCRIT LÀ-BAS EN DÉTAIL : les ongles,
// la coiffure et le vêtement. Il faut, pour ceux-là, savoir où est l'ongle, la
// mèche, l'épaule — donc un modèle, donc une facture. Le calcul gratuit couvre
// ce qui se POSE dans un lieu et ce qui CEINT un poignet ; le reste attend.
//
// ═══ CE QUE JE N'AI PAS SUIVI DANS LES MAQUETTES, ET IL FAUT EN PARLER ════
//
// LES VISAGES. Les deux maquettes montrent des portraits sur chaque carte.
// `public/direct/LISEZ-MOI.md` l'interdit — « aucun visage reconnaissable » — et
// le dépôt n'en contient aucun. Mais la raison de produit pèse plus lourd que la
// règle : une photo de son propre visage est un geste social lourd, et un mur
// qui l'exige reste vide. Les cartes montrent donc CE QUE LA PERSONNE MONTRE, et
// la personne est présente autrement — son prénom, son fantôme, son heure. Si
// c'est le portrait qui est voulu, il faudra de vraies photos consenties et
// changer la règle du dépôt : c'est une décision, pas un détail d'images.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  HEURES_PAR_DEFAUT,
  HUMEURS,
  MURS,
  QUOTA_DU_JOUR,
  VERBES,
  humeurDe,
  miseEnRelation,
  verbeDe,
  type Fantome,
  type Depot,
  type Mur as TypeMur,
  type Piece,
} from "@/lib/direct/fantomes";
import { composer, type Gabarit } from "@/lib/direct/essai";
import { fantomesDuLieu, mesFantomes, poserFantome, tempsRestant } from "@/lib/direct/mes-fantomes";
import { laMainEstPrete, poserVernis } from "@/lib/direct/ongles";
import { essayerSurMoi, estUnRendu } from "@/lib/direct/essai-genere";
import { prevenirPourEssai, numeroDeFiction } from "@/lib/direct/prevenir";
import { partagerLEssai, type Sortie } from "@/lib/direct/partager-essai";
import { jouer } from "@/lib/direct/sons";
import {
  ECHELLES,
  aMaTaille,
  abonnerMaTaille,
  abonnerTailles,
  chargerTailles,
  choisirMaTaille,
  maTaille,
  maTailleVide,
  phraseDesTailles,
  taillesDeLaPiece,
  taillesVides,
} from "@/lib/direct/tailles";
import {
  abonnerAlertesLooks,
  alertesLooksVides,
  basculerAlerteLook,
  chargerAlertesLooks,
} from "@/lib/direct/alertes-looks";
import { basculerPieceGardee } from "@/lib/direct/pieces-gardees";
import { rayonDuNom } from "@/lib/direct/rayons";
import { EcranGout } from "@/components/direct/gout-contenu";
import { EcranSoiree } from "@/components/direct/soiree-contenu";

/**
 * « CHEZ QUI », ÉCRIT COMME ON LE DIRAIT.
 *
 * Les commerces de la maquette sont des voisins anonymes — « Une prothésiste
 * ongulaire », « Un bar à vins » — et coller « à » devant donnait « à Une
 * prothésiste ongulaire ». Ce n'est pas un détail de style : c'est la première
 * ligne de l'écran, et une faute de français à cet endroit fait douter du reste.
 * Un nom propre prend « chez », un nom commun prend « chez » en minuscule, et
 * « Chez Margot » ne se redouble pas.
 */
function chezQui(lieu: string): string {
  if (/^Chez /i.test(lieu)) return lieu;
  if (/^(Un|Une|Le|La|Les|L’|L')\s?/i.test(lieu)) {
    return `chez ${lieu.charAt(0).toLowerCase()}${lieu.slice(1)}`;
  }
  return `chez ${lieu}`;
}

/**
 * LE MÊME LIEU, MAIS EN SUJET DE LA PHRASE.
 *
 * `chezQui` sert les compléments — « on en parle chez une cirière » — et c'est
 * exactement ce qu'il ne faut pas quand le lieu est le SUJET : « chez une
 * cirière est un commerce inventé » est une faute qu'on lisait à l'écran.
 * Ici on ne fait que décapitaliser l'article, pour que le nom s'insère au
 * milieu d'une phrase sans y planter une majuscule.
 */
function leLieu(lieu: string): string {
  return /^(Un|Une|Le|La|Les|L’|L')\s?/.test(lieu)
    ? `${lieu.charAt(0).toLowerCase()}${lieu.slice(1)}`
    : lieu;
}

/**
 * ═══ LE FANTÔME EN VOLUME, ET IL NE REMPLACE PAS LE TRACÉ ═══════════════════
 *
 * IL Y EN A DEUX, ET ILS NE FONT PAS LE MÊME MÉTIER. `Signe` est le tracé —
 * une forme, un trait, la couleur du texte autour : c'est lui qui va dans une
 * note de un à cinq, dans un bouton, dans une frise, partout où le fantôme est
 * un PICTOGRAMME et doit se fondre.
 *
 * CELUI-CI EST LE PERSONNAGE. Casquette, sourire, joues roses : c'est lui que
 * les maquettes mettent au centre de « Surprends-moi », de la recherche et de
 * la préparation — c'est-à-dire aux trois moments où l'écran ne demande rien et
 * où quelqu'un travaille pour vous. Le tracé y aurait été un logo ; le
 * personnage y est quelqu'un.
 *
 * ET C'EST LE FICHIER QUI EXISTE DÉJÀ, celui de la page d'accueil. Deux dessins
 * du même fantôme à deux endroits du produit, c'est deux fantômes.
 */
const FANTOME = "/clikme-fantome.png";

/**
 * ═══ LE FANTÔME QUI CHERCHE, ET SES QUATRE PIÈCES ═══════════════════════════
 *
 * IL TIENT SA LOUPE, ET C'EST UN SEUL DESSIN. Je l'avais fabriqué : le fantôme
 * d'un côté, une loupe tracée en SVG de l'autre, posée à côté de lui. Deux
 * objets qui ne se touchent jamais vraiment — on voyait un pictogramme flotter
 * près d'un personnage, et le manche passait tantôt devant, tantôt derrière.
 * Celui-ci est dessiné d'un bloc : la main tient le manche, le verre porte son
 * reflet, la lueur du tube éclaire le fantôme. Aucun assemblage ne rattrape ça.
 *
 * LES QUATRE PIÈCES SONT DÉTOURÉES, ET C'ÉTAIT LE DERNIER ÉCART. La maquette
 * montre une veste, un t-shirt, un jean, des baskets — des VÊTEMENTS, sur fond
 * sombre. J'affichais les photos du catalogue, c'est-à-dire des mannequins en
 * pied dans un décor de studio : quatre scènes entières autour d'un fantôme, là
 * où il fallait quatre objets. Assombries pour compenser, elles devenaient des
 * taches grises.
 *
 * CE SONT DES ACCESSOIRES DE SCÈNE, PAS LE STOCK, et il faut le dire : ces
 * quatre-là ne viennent d'aucune collection. L'écran dure quatre secondes et ne
 * promet rien — c'est la pièce qui SORT à la fin qui est vraie, tirée du
 * magasin. Montrer quatre vraies pièces ici reviendrait à faire croire que la
 * machine hésite entre celles-là, ce qui serait faux.
 */
const FANTOME_LOUPE = "/direct/clikme-fantome-loupe.png";
const LOOKS = [
  "/direct/look-veste.png",
  "/direct/look-tshirt.png",
  "/direct/look-baskets.png",
  "/direct/look-jean.png",
];

/**
 * ═══ CE QUE LE MODÈLE A LE DROIT DE REMPLACER, POUR CETTE PIÈCE-LÀ ══════════
 *
 * « L'essai a un peu raté : il reste le pantalon à droite, sous la robe que
 * j'ai essayée. »
 *
 * LE MODÈLE A FAIT EXACTEMENT CE QU'ON LUI DEMANDAIT. `essai.change` disait
 * « uniquement le vêtement porté sur le buste », une phrase écrite une fois
 * pour tout le métier : juste devant un pull, fausse devant une robe midi. Il a
 * donc habillé le buste et laissé le jean dessous, et on voyait une robe posée
 * par-dessus un pantalon.
 *
 * LA PHRASE SUIT MAINTENANT LA PIÈCE. Elle nomme la zone À REMPLACER **et** ce
 * qui doit disparaître avec — c'est cette seconde moitié qui manquait, et sans
 * elle « remplace la tenue entière » se lit encore comme « ajoute par-dessus ».
 *
 * LE REPLI EST LA PHRASE DU MÉTIER, INCHANGÉE. Une coupe, une monture, un
 * vernis n'ont pas de « jusqu'où » : la question ne se pose que sur un corps
 * qu'on habille. Voir `couvre` dans `lib/direct/fantomes.ts`.
 */
function zoneChangee(essai: TypeMur["essai"], piece: Piece | null): string | undefined {
  if (!piece?.couvre) return essai?.change;
  if (piece.couvre === "silhouette") {
    return (
      "la tenue entière portée sur le corps, du cou aux chevilles. Le vêtement " +
      "qui était porté auparavant — haut ET bas — disparaît complètement et est " +
      "remplacé par celui de l'image 2 ; il ne doit rester aucune trace du " +
      "pantalon, de la jupe ou du haut d'origine."
    );
  }
  if (piece.couvre === "bas") {
    return (
      "uniquement le bas de la tenue — pantalon ou jupe. Le haut porté sur le " +
      "buste reste exactement tel qu'il est sur l'image 1."
    );
  }
  return (
    "uniquement le vêtement porté sur le buste. Le bas de la tenue — pantalon, " +
    "jupe, chaussures — reste exactement tel qu'il est sur l'image 1."
  );
}

/**
 * L'ESSAI EN COURS, TEL QUE LE MUR A BESOIN DE LE CONNAÎTRE.
 *
 * TROIS CHOSES, ET PAS UNE DE PLUS : quelle pièce, à quoi ça ressemble sur soi,
 * et ce qu'on en a pensé. Le mur n'a rien à faire du reste — la photo d'origine,
 * la glissière, le commentaire — et le lui donner l'aurait couplé à l'intérieur
 * de l'essai, c'est-à-dire condamné à changer avec lui.
 */
type EssaiVu = { piece: Piece; image: string; note: number };

/**
 * ═══ CE QUE CLIKME DIT D'UNE PIÈCE, ET CE QU'IL NE DIT JAMAIS ═══════════════
 *
 * « ClikMe ne doit pas donner spontanément un jugement stylistique du type
 * "ça vous va", "ça ne vous va pas", "cette couleur ne vous convient pas".
 * L'utilisateur peut aimer une pièce même si l'IA estime qu'une autre coupe
 * serait plus adaptée. ClikMe ne doit pas devenir un juge du goût. »
 *
 * DEUX RÈGLES, ET ELLES TIENNENT TOUT CET ÉCRAN :
 *
 *   · QUAND C'EST LE CLIENT QUI A CHOISI, on se tait. L'avis ne sort que s'il
 *     est demandé, et il décrit la pièce sans la noter : « cette coupe apporte
 *     de la structure », jamais « cette pièce ne vous va pas ». On propose une
 *     alternative, on ne corrige pas un goût.
 *   · QUAND C'EST CLIKME QUI A CHOISI, il doit s'expliquer. Une machine qui
 *     désigne sans dire pourquoi demande une confiance qu'elle n'a pas gagnée.
 *
 * ET L'EXPLICATION NE PARLE PAS DU VISAGE DE LA PERSONNE. « Le kaki fonctionne
 * bien avec les tons de votre visage » suppose une analyse qu'aucun calcul de
 * cette maquette ne fait : l'écrire serait fabriquer la compétence qu'on est
 * en train de promettre. Elle parle donc de ce qui est VRAI ici — la pièce,
 * sa coupe, et la façon dont elle a été sortie de la collection.
 */
function avisNeutre(piece: Piece): { dit: string; sinon: string } {
  if (piece.couvre === "silhouette") {
    return {
      dit: "Cette pièce habille la silhouette entière : elle donne une ligne, et elle décide du reste de la tenue.",
      sinon: "Si vous préférez garder votre bas, je peux vous proposer un haut.",
    };
  }
  if (piece.couvre === "bas") {
    return {
      dit: "Cette pièce joue sur le bas : c'est elle qui donne l'allure, le haut reste libre.",
      sinon: "Si vous voulez changer le haut plutôt, je peux vous proposer autre chose.",
    };
  }
  return {
    dit: "Cette pièce apporte de la structure sur le buste, et elle se porte avec ce que vous avez déjà.",
    sinon: "Si vous voulez quelque chose de plus souple, je peux vous proposer une alternative.",
  };
}

/** Le dessin du fantôme. Une seule forme, trois tailles, jamais deux dessins. */
/**
 * LE MOMENT CHOISI, RECOLLÉ DANS UNE PHRASE.
 *
 * Les quatre choix sont écrits pour des BOUTONS — « J'y suis » se lit très bien
 * seul. Recollé derrière « ici », il donne « Vous pourrez retrouver Marc ici
 * J'y suis », ce qu'un test a sorti en clair. La conversion existait déjà dans
 * `Passage`, en dur ; elle est ici pour que tout le monde s'en serve.
 */
function quandDit(q: string): string {
  return q === "J’y suis" ? "maintenant" : q;
}

/**
 * ═══ LE FANTÔME DE LA NOTE, ET IL N'EST PAS CELUI DE LA BARRE ═══════════════
 *
 * « Attention aux fantômes, et respecte le design des fantômes : sur ce que tu
 * as fait, les fantômes sont un peu étranges. »
 *
 * IL AVAIT RAISON, ET J'AVAIS RÉUTILISÉ LE MAUVAIS DESSIN. `Signe` est le
 * PICTOGRAMME du produit : un corps allongé, deux yeux ovales ouverts, une
 * petite bouche. Il est fait pour vivre à dix-huit points dans une barre, où il
 * doit se reconnaître plus que s'exprimer. Agrandi à cinquante-huit points sur
 * une photo, ces mêmes yeux ronds fixes donnent un masque — et cinq masques
 * alignés sous son propre visage mettent mal à l'aise.
 *
 * CELUI DE LA MAQUETTE EST UN VISAGE HEUREUX. Dôme large, trois festons en bas,
 * YEUX FERMÉS EN ARC — le sourire des yeux, celui qu'on ne peut pas faire avec
 * deux ovales — et une grande bouche courbe. C'est un dessin fait pour être vu
 * grand, et pour qu'on ait envie de le toucher.
 *
 * LES DEUX COHABITENT, ET C'EST VOULU. Le tracé reste partout où le fantôme est
 * un signe ; celui-ci ne sert que là où il est un VISAGE : les cinq de la note.
 * Un seul dessin pour les deux emplois aurait mal fait les deux.
 */
function Frimousse({ classe, coeur }: { classe?: string; coeur?: boolean }) {
  return (
    <svg className={classe} viewBox="0 0 64 70" aria-hidden="true">
      {/* ═══ LE CORPS : UNE CLOCHE, PAS UN ŒUF ══════════════════════════════

          « Les fantômes ne sont pas comme ceux du mockup de départ. »

          IL AVAIT RAISON, ET L'ERREUR ÉTAIT DANS LA SILHOUETTE. Le mien était
          un dôme de largeur constante : un œuf posé sur trois bosses. Celui de
          la maquette S'ÉVASE — le crâne est étroit, les épaules s'écartent en
          descendant, et les deux lobes extérieurs débordent la largeur du
          dôme. C'est cet évasement qui donne le petit drap flottant ; sans lui
          on obtient un pictogramme, ce qui est exactement ce qu'on lui
          reprochait.

          ET IL EST PLUS HAUT QUE LARGE, de peu. Le cadre était 64×60, donc plus
          large que haut : le dôme s'aplatissait. Mesuré sur la maquette, le
          rapport est de 0,91. */}
      <path
        className="mu-f-corps"
        d="M32 2C20.6 2 12.4 7.6 7.4 16 3.6 22.4 2 30.2 2 38.6V51c0 6.6 4.5 11 10 11s10-4.4 10-11c0 6.6 4.5 11 10 11s10-4.4 10-11c0 6.6 4.5 11 10 11s10-4.4 10-11V38.6c0-8.4-1.6-16.2-5.4-22.6C51.6 7.6 43.4 2 32 2Z"
      />
      {coeur ? (
        <>
          {/* LES YEUX EN CŒUR DU CINQUIÈME. « Coup de cœur » n'est pas « cinq
              sur cinq », c'est autre chose, et il faut que ça se voie avant
              qu'on ait lu le mot. */}
          <path
            className="mu-f-oeil"
            d="M23.5 36 18.5 31a3.5 3.5 0 0 1 0-5 3.5 3.5 0 0 1 5 0 3.5 3.5 0 0 1 5 0 3.5 3.5 0 0 1 0 5Z"
          />
          <path
            className="mu-f-oeil"
            d="M40.5 36 35.5 31a3.5 3.5 0 0 1 0-5 3.5 3.5 0 0 1 5 0 3.5 3.5 0 0 1 5 0 3.5 3.5 0 0 1 0 5Z"
          />
        </>
      ) : (
        <>
          {/* LES YEUX FERMÉS, EN ARCHE. Deux arcs dont les bouts pointent vers
              le bas, comme sur la maquette : c'est le sourire des yeux. Deux
              ovales ouverts, à cette taille, font un regard fixe. */}
          <path className="mu-f-trait" d="M18.2 32.6C19.6 27.4 27.4 27.4 28.8 32.6" />
          <path className="mu-f-trait" d="M35.2 32.6C36.6 27.4 44.4 27.4 45.8 32.6" />
        </>
      )}
      {/* LA BOUCHE : UN VRAI U, PROFOND ET ÉPAIS. Le mien était un arc large et
          plat qui barrait tout le bas du visage ; celui de la maquette est
          court, creusé, et posé entre les deux yeux. */}
      <path className="mu-f-bouche2" d="M24.6 39.8C26.4 46.8 37.6 46.8 39.4 39.8" />
    </svg>
  );
}

function Signe({ classe, coeur }: { classe?: string; coeur?: boolean }) {
  return (
    <svg className={classe} viewBox="0 0 40 44" aria-hidden="true">
      <path
        className="mu-f-corps"
        d="M20 2.5c-8.7 0-15.6 6.6-15.6 15.1v18.6c0 2.2 2.3 3.3 3.9 1.9l2.4-2.1c.9-.8 2.2-.8 3.1 0l2.3 2c.9.8 2.2.8 3.1 0l2.3-2c.9-.8 2.2-.8 3.1 0l2.4 2.1c1.6 1.4 3.9.3 3.9-1.9V17.6C35.6 9.1 28.7 2.5 20 2.5Z"
      />
      {/* ═══ LES YEUX EN CŒUR, ET C'EST LE CINQUIÈME FANTÔME ═════════════════

          LA MAQUETTE LES DESSINE, ET CE N'EST PAS UN ORNEMENT. Les cinq notes
          se lisent normalement comme une échelle — un peu, beaucoup, passionné —
          et la cinquième n'en est pas une : « Coup de cœur » dit autre chose
          que « cinq sur cinq ». Cinq dessins identiques auraient rendu cette
          différence invisible ; deux cœurs à la place des yeux la disent avant
          qu'on ait lu le mot.

          ILS SONT LÀ MÊME ÉTEINT. Apparaître à la sélection les aurait rendus
          impossibles à anticiper — or c'est justement leur travail : donner
          envie d'aller jusqu'au bout de la rangée. */}
      {coeur ? (
        <>
          <path
            className="mu-f-oeil"
            d="M14.4 21.1 11.9 18.7a1.75 1.75 0 0 1 0-2.5 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 0 2.5Z"
          />
          <path
            className="mu-f-oeil"
            d="M25.6 21.1 23.1 18.7a1.75 1.75 0 0 1 0-2.5 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 0 2.5Z"
          />
        </>
      ) : (
        <>
          <ellipse className="mu-f-oeil" cx="14.4" cy="18.4" rx="2.1" ry="2.6" />
          <ellipse className="mu-f-oeil" cx="25.6" cy="18.4" rx="2.1" ry="2.6" />
        </>
      )}
      <path className="mu-f-bouche" d="M16.2 25.6c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" />
    </svg>
  );
}

/**
 * ═══ LES PICTOGRAMMES DU RITUEL ══════════════════════════════════════════════
 *
 * ILS SONT TRACÉS, PAS ÉCRITS. Un emoji arrive avec ses couleurs et change de
 * dessin d'un téléphone à l'autre — le calendrier d'Apple apporte sa date du
 * 17 juillet, ce qui se lit comme une information alors que ce n'en est pas
 * une, et le tee-shirt d'Android n'a rien à voir avec celui d'iOS. Sur un écran
 * qui donne QUATRE conseils de cadrage, quatre dessins imprévisibles auraient
 * plus distrait qu'aidé.
 *
 * MÊME GRILLE DE 24 ET MÊME ÉPAISSEUR QUE TOUT LE PRODUIT : ceux de la barre du
 * bas, ceux du rail de l'annonce, celui de « Proposer à mes amis ». C'est ce qui
 * fait qu'on ne les remarque pas, et c'est exactement ce qu'on leur demande.
 *
 * LA CLÉ VIENT DES DONNÉES, pas d'un test sur le métier : voir `Conseil` dans
 * `lib/direct/fantomes.ts`. Ajouter un métier, c'est écrire ses quatre conseils,
 * pas ouvrir ce composant.
 */
const TRACES: Record<string, string> = {
  visage: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8ZM8.8 10.6h.01M15.2 10.6h.01M8.8 15c.9 1.1 1.9 1.6 3.2 1.6s2.3-.5 3.2-1.6",
  corps: "M12 2.6a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM12 7.8v6.4M12 14.2 9 21.4M12 14.2l3 7.2M7.6 10.4h8.8",
  lumiere: "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2ZM12 1.8v2.4M12 19.8v2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M1.8 12h2.4M19.8 12h2.4M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7",
  vetement: "M8.6 3 5 5.2 3 9l3 1.6V21h12V10.6L21 9l-2-3.8L15.4 3M8.6 3a3.4 3.4 0 0 0 6.8 0",
  main: "M8.6 12V5.6a1.4 1.4 0 0 1 2.8 0M11.4 11V4.4a1.4 1.4 0 0 1 2.8 0V11M14.2 11.4V6.2a1.4 1.4 0 0 1 2.8 0v7.4c0 4-2.6 7-6.2 7-2.4 0-4-1.1-5.2-3L3 13.6a1.5 1.5 0 0 1 2.4-1.8l1.4 1.8",
  cadre: "M3.4 8.6V5.4a2 2 0 0 1 2-2h3.2M15.4 3.4h3.2a2 2 0 0 1 2 2v3.2M20.6 15.4v3.2a2 2 0 0 1-2 2h-3.2M8.6 20.6H5.4a2 2 0 0 1-2-2v-3.2",
  lieu: "M2.6 10.4h18.8M4.6 10.4V6.6a2 2 0 0 1 2-2h10.8a2 2 0 0 1 2 2v3.8M5.4 10.4V20M18.6 10.4V20M2.6 14.4h18.8",
  peau: "M6.6 2.8c-1.6 3.4-1.4 6.6.6 9.6 2 3 2.4 6.2 1.2 9.4M17.4 2.8c1.6 3.4 1.4 6.6-.6 9.6-2 3-2.4 6.2-1.2 9.4M12 6.2v11.6",
  agenda: "M3.2 5h17.6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3.2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM2.2 10h19.6M7.6 2.8v4.4M16.4 2.8v4.4",
  sac: "M4.4 7.6h15.2l1.2 12.4a1 1 0 0 1-1 1.2H4.2a1 1 0 0 1-1-1.2ZM8.4 10.4V6.2a3.6 3.6 0 0 1 7.2 0v4.2",
  boutique: "M3.4 9.4h17.2V20a1 1 0 0 1-1 1H4.4a1 1 0 0 1-1-1ZM2.6 9.4 4.4 3.6h15.2l1.8 5.8M9.4 21v-6.2h5.2V21",
  net: "M9.2 2.8 10.6 7l4.2 1.4-4.2 1.4-1.4 4.2-1.4-4.2L3.6 8.4 7.8 7ZM17.4 12.2l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9ZM4.8 17.2l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6Z",
  lunettes: "M7 9.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2ZM17 9.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2ZM10.6 13h2.8M3.4 12.4 2.2 8.2M20.6 12.4l1.2-4.2",
  photo: "M4 7.6h3.2l1.6-2.6h6.4l1.6 2.6H20a1.4 1.4 0 0 1 1.4 1.4v9.2a1.4 1.4 0 0 1-1.4 1.4H4a1.4 1.4 0 0 1-1.4-1.4V9A1.4 1.4 0 0 1 4 7.6ZM12 10.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z",
  /* LES TROIS PROMESSES DE L'ESSAYAGE, dans la colonne de gauche de la
     maquette : le calcul, le choix, la comparaison. */
  styles: "M12 2.6 2.6 7.4 12 12.2l9.4-4.8ZM2.6 12 12 16.8 21.4 12M2.6 16.6 12 21.4l9.4-4.8",
  comparer: "M4 4.4h16a1 1 0 0 1 1 1v13.2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5.4a1 1 0 0 1 1-1ZM12 3.2v17.6M6.6 9.6h2.8M6.6 13.4h2.8",
  coeur: "M12 20.4 4.4 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.9.9.9-.9a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7Z",
  partage: "M12 3.2v12M12 3.2 8.2 7M12 3.2 15.8 7M4.6 12.8v6.4a1.4 1.4 0 0 0 1.4 1.4h12a1.4 1.4 0 0 0 1.4-1.4v-6.4",
  /* LES TROIS DE LA RECHERCHE ET DE LA PRÉPARATION. `cintre` dit qu'on fouille
     un portant, `etoile` que la réponse arrive, `idee` que c'est un conseil et
     non un avertissement — une ampoule et un triangle ne se lisent pas du tout
     pareil sous le même paragraphe. */
  cintre: "M12 3.4a2.1 2.1 0 0 0-1.1 3.9c.4.2.7.7.7 1.2v.9M12 9.4 3.2 15.6a1.4 1.4 0 0 0 .8 2.6h16a1.4 1.4 0 0 0 .8-2.6L12 9.4Z",
  etoile: "M12 2.8 14.8 9l6.8.7-5.1 4.6 1.5 6.7L12 17.6 6 21l1.5-6.7L2.4 9.7 9.2 9Z",
  idee: "M9 18.4h6M10 21.4h4M12 2.6a6.4 6.4 0 0 0-3.8 11.6c.6.5 1 1.2 1 2v.2h5.6v-.2c0-.8.4-1.5 1-2A6.4 6.4 0 0 0 12 2.6Z",
  sablier: "M6.4 2.8h11.2M6.4 21.2h11.2M7.4 2.8v3.6c0 2 1.6 3.6 3.2 4.6.9.5.9 1.5 0 2-1.6 1-3.2 2.6-3.2 4.6v3.6M16.6 2.8v3.6c0 2-1.6 3.6-3.2 4.6-.9.5-.9 1.5 0 2 1.6 1 3.2 2.6 3.2 4.6v3.6",
  /* LA CLOCHE DE L'ALERTE, DANS SES DEUX ÉTATS. Muette, elle est POSÉE : le
     battant pend, rien n'est demandé. Armée, elle PENCHE et deux ondes en
     sortent — c'est la seule différence qui se lise à vingt points, et elle
     se lit même quand la couleur ne passe pas. Voir `lib/direct/alertes-looks`. */
  cloche: "M12 3.2a5.8 5.8 0 0 0-5.8 5.8c0 4-1.2 5.6-2 6.4a.9.9 0 0 0 .6 1.6h14.4a.9.9 0 0 0 .6-1.6c-.8-.8-2-2.4-2-6.4A5.8 5.8 0 0 0 12 3.2ZM10.2 20.2a2.2 2.2 0 0 0 3.6 0",
  "cloche-on": "M11 4.4a5.8 5.8 0 0 0-4.3 6.7c.7 3.9-.3 5.8-.9 6.8a.9.9 0 0 0 .8 1.4l14.2-2.5a.9.9 0 0 0 .3-1.7c-1-.6-2.5-1.9-3.2-5.8A5.8 5.8 0 0 0 11 4.4ZM11.8 21.6a2.2 2.2 0 0 0 3.5-.6M2.6 6.4C3.4 5 4.6 4 6 3.4M3.6 9.8c.4-.8 1-1.5 1.8-1.9",
  /* LES AUTRES, ET ILS SONT TROIS. Deux têtes se lisent comme un couple ;
     trois se lisent comme « des gens », ce qui est le mot du bouton. */
  gens: "M9 4.2a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4ZM2.8 20.4c0-3.4 2.8-6.2 6.2-6.2s6.2 2.8 6.2 6.2M16.4 5a3.2 3.2 0 0 1 0 6.2M17.8 14.8c2.1.7 3.6 2.6 3.6 5",
};

function Trace({ cle }: { cle: string }) {
  return (
    <svg className="mu-tr" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={TRACES[cle] ?? TRACES.cadre} />
    </svg>
  );
}

/**
 * ═══ LA SILHOUETTE DE L'ATTENTE ══════════════════════════════════════════════
 *
 * « Ton fantôme prépare ton essayage. »
 *
 * ELLE EST DESSINÉE, ET C'EST LE POINT. Les deux maquettes de préparation
 * montrent un buste au néon dont la MOITIÉ GAUCHE est un maillage et la moitié
 * droite une vraie pièce : c'est la seule image qui dise « on est en train de
 * l'habiller » plutôt que « patientez ». Le maillage se dessine, la pièce
 * arrive par la droite, et le trait de lumière entre les deux avance.
 *
 * DEUX CORPS, ET C'EST LE MAGASIN QUI DÉCIDE — jamais le client. Une boutique
 * de prêt-à-porter féminin n'a que des pièces de femme à montrer pendant
 * qu'elle travaille ; on ne demande son genre à personne pour lui poser une
 * veste. Voir `genre` dans `lib/direct/fantomes.ts`.
 *
 * `pathLength` À 100 REND LE TIRET INDÉPENDANT DE LA LONGUEUR DU TRACÉ : les
 * traits se dessinent tous à la même vitesse, quel que soit leur périmètre —
 * même raison, même réglage que le maillage du visage plus haut.
 */
function Silhouette({ genre }: { genre: "femme" | "homme" }) {
  const femme = genre === "femme";
  return (
    <svg className="mu-prep-sil" viewBox="0 0 200 250" aria-hidden="true" focusable="false">
      {/* LA TÊTE ET LES CHEVEUX. Aucun trait de visage : un œil ou une bouche
          esquissés feraient un PORTRAIT, et le portrait serait celui de
          quelqu'un d'autre au moment exact où l'on attend le sien. */}
      <ellipse className="mu-prep-t1" pathLength={100} cx="100" cy="42" rx="24" ry="30" />
      {femme ? (
        <path
          className="mu-prep-t1"
          pathLength={100}
          d="M74 40C70 18 84 8 100 8s30 10 26 32c-2-12-8-18-26-18s-24 6-26 18ZM75 44c-4 18-6 34-4 50M125 44c4 18 6 34 4 50"
        />
      ) : (
        <path className="mu-prep-t1" pathLength={100} d="M76 36c2-18 12-26 24-26s22 8 24 26c-6-10-14-14-24-14s-18 4-24 14Z" />
      )}
      {/* LE COU ET LES ÉPAULES. C'est la carrure qui distingue les deux, et
          rien d'autre : même hauteur, même pose, même cadrage. */}
      <path className="mu-prep-t2" pathLength={100} d={femme ? "M88 68v10M112 68v10" : "M88 68v8M112 68v8"} />
      <path
        className="mu-prep-t2"
        pathLength={100}
        d={
          femme
            ? "M100 78c-16 0-30 7-36 16l-8 52 14 5 4-38v70c0 4 3 7 7 7h38c4 0 7-3 7-7v-70l4 38 14-5-8-52c-6-9-20-16-36-16Z"
            : "M100 76c-19 0-35 8-42 18l-9 54 15 5 5-40v70c0 4 3 7 7 7h48c4 0 7-3 7-7v-70l5 40 15-5-9-54c-7-10-23-18-42-18Z"
        }
      />
      {/* LE BAS : une jupe évasée ou un pantalon droit. Il ne s'agit pas de
          dessiner un vêtement — celui-là arrive par la droite — mais de ne pas
          couper le corps à la taille, ce qui donnait un buste posé sur rien. */}
      <path
        className="mu-prep-t3"
        pathLength={100}
        d={
          femme
            ? "M74 190h52l10 56H64ZM100 190v56"
            : "M74 190h52v56h-22v-40h-8v40H74Z"
        }
      />
      {/* LE MAILLAGE, ET IL N'EST QUE SUR LA MOITIÉ GAUCHE. C'est ce qui rend
          la coupure lisible : à gauche on mesure encore, à droite c'est posé. */}
      <g className="mu-prep-maille">
        {Array.from({ length: 7 }, (_, k) => (
          <path key={`h${k}`} pathLength={100} d={`M56 ${92 + k * 22}H100`} />
        ))}
        {Array.from({ length: 4 }, (_, k) => (
          <path key={`v${k}`} pathLength={100} d={`M${58 + k * 14} 80V246`} />
        ))}
      </g>
    </svg>
  );
}

/** La pastille d'humeur : ce que la personne vient chercher ici. */
function Humeur({ cle }: { cle?: string }) {
  const h = humeurDe(cle);
  if (!h) return null;
  return (
    <span className={`mu-hum ${h.teinte}`}>
      <i aria-hidden="true">{h.emoji}</i>
      {h.mot}
    </span>
  );
}

/**
 * UNE CARTE DU MUR.
 *
 * DEUX TAILLES, ET C'EST LA HIÉRARCHIE DU MUR : la maison en grand, les clients
 * en dessous. Ce n'est pas une question de place, c'est la règle du démarrage —
 * un mur ne commence jamais vide, et ce qu'on voit en premier doit être le
 * commerce qui accueille.
 */
function Carte({
  depot,
  f,
  grande,
  quand,
  onDit,
  onParler,
}: {
  f: Fantome;
  grande?: boolean;
  /** Quand on a dit qu'on passait. Vide : on ne l'a pas encore dit. */
  quand?: string;
  onDit: (f: Fantome) => void;
  /**
   * CE QUE LE LIEU PROPOSE, PARCE QUE LE GESTE N'A PAS LE MÊME SENS.
   *
   * Chez un restaurant, s'intéresser à un fantôme veut dire « on pourra en
   * parler sur place ». Chez une onglerie, ça veut dire « je veux essayer la
   * même chose » — on ne vient pas y rencontrer celle qui a essayé le bordeaux,
   * on vient l'essayer soi-même. Une seule phrase pour les deux serait fausse
   * une fois sur deux.
   */
  depot?: Depot;
  /**
   * ═══ « EN PARLER », LE SECOND GESTE DE LA MAQUETTE ════════════════════════
   *
   * « Restaurant, bars et événements : respecter le design là aussi. »
   *
   * LA MAQUETTE MET DEUX BOUTONS SOUS CHAQUE MESSAGE, et ils ne disent pas la
   * même chose. « Ça m'intéresse » s'adresse AU LIEU : je signale que je
   * passerai, et on en parlera sur place. « En parler » s'adresse À MES AMIS :
   * j'emporte le message dans mon salon privé — « il y a une dégustation à
   * 19 h, qui vient ? ». Le premier remplit le bar, le second remplit la table.
   *
   * IL EST FACULTATIF, ET C'EST VOULU : sur la maquette de jugement des murs,
   * il n'y a pas de salon derrière. Un bouton qui n'ouvrirait rien serait pire
   * que pas de bouton.
   */
  onParler?: (f: Fantome) => void;
}) {
  const v = verbeDe(f.verbe);
  const essai = depot === "essai";
  /**
   * ON NE S'INTÉRESSE PAS À SON PROPRE FANTÔME.
   *
   * « Ça m'intéresse » veut dire « je veux en parler sur place avec cette
   * personne » — or cette personne, c'est soi. Le bouton s'affichait quand même,
   * et il devenait franchement absurde dans le panneau qui montre ce qu'on vient
   * de poser : un geste proposé sur sa propre trace, à la seconde où on l'a
   * laissée.
   *
   * LE TEST PORTE SUR LE PRÉNOM PARCE QUE C'EST LUI QUI FAIT FOI ICI : tout ce
   * qu'on dépose est signé « Vous », et rien d'autre ne l'est. Voir `poser`.
   */
  const mien = f.qui === "Vous";
  return (
    <article className={`mu-c${grande ? " grande" : ""}`}>
      <div className="mu-c-p">
        {f.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.photo} alt="" loading="lazy" />
        ) : (
          <div className="mu-c-vide" aria-hidden="true" />
        )}
        {/* LE FANTÔME EST L'AVATAR. C'est lui qui tient la place du portrait :
            la personne est là, sans que sa tête y soit. */}
        {essai && (
          <span className="mu-c-av">
            <Signe classe="mu-c-signe" />
          </span>
        )}
        {/* ═══ LA PASTILLE QUITTE LA PHOTO SUR UN MUR DE LIEU ═══════════════

            SUR LA GRILLE D'ESSAI ELLE RESTE OÙ ELLE EST : « ✨ Essayé ici »
            posé sur la vignette dit en un coup d'œil ce qu'on regarde, et la
            vignette est ce qu'on regarde.

            SUR UN MUR DE BAR, LA MAQUETTE LA MET EN TÊTE DU MESSAGE, avant le
            prénom — « STAFF · Marc · Chef ». Ce n'est pas le même travail :
            ici elle ne décrit pas une image, elle dit QUI PARLE, et cette
            information appartient à la ligne du nom. Posée sur une photo
            devenue vignette de soixante-dix points, elle la couvrait
            entièrement. */}
        {essai &&
          (f.maison ? (
            <span className="mu-c-b staff">Staff</span>
          ) : v ? (
            <span className="mu-c-b verbe">{v.mot}</span>
          ) : f.essai ? (
            <span className="mu-c-b essai">✨ Essayé ici</span>
          ) : null)}
        {/* ═══ QUI PORTE ÇA, ÉCRIT SUR LA PHOTO ═══════════════════════════

            « En mode téléphone, ces colonnes en longueur comme si elles
            étaient étendues, c'est très vilain. »

            LE DÉFAUT ÉTAIT DANS LA HAUTEUR, PAS DANS LA LARGEUR. Chaque
            vignette empilait la photo, puis le prénom, puis l'heure, puis la
            phrase, puis le motif, puis le délai : trois cent soixante-quatre
            points pour une carte de cent soixante-quatorze de large. Un mur
            dont on ne voit qu'une rangée et demie n'est pas un mur, c'est une
            file d'attente.

            LE PRÉNOM, L'HEURE ET LA NOTE REVIENNENT SUR L'IMAGE, où il y a de
            la place et où ils désignent ce qu'ils commentent. C'est ce que
            fait n'importe quel mur de photos, et ce que la maquette dessine :
            la vignette porte QUI, le texte dessous porte CE QU'ELLE EN DIT.

            IL EST ÉCRIT DEUX FOIS DANS LE DOCUMENT, ET C'EST DÉLIBÉRÉ. Les
            cartes de la maison, sur ce même mur, ne sont pas en grille : elles
            gardent leur ligne de nom. Une seule écriture aurait obligé à la
            déplacer par positionnement absolu depuis l'extérieur de la photo —
            c'est-à-dire à parier sur la hauteur exacte de l'image. Le doublon
            est caché à l'écran comme aux lecteurs d'écran, jamais les deux
            ensemble. */}
        {essai && (
          <span className="mu-c-sur" aria-hidden="true">
            <span className="mu-c-sur-q">
              <b>{f.qui}</b>
              {/* LA TAILLE PASSE DEVANT L'HEURE SUR UN MUR DE VÊTEMENTS.
                  « Il y a 2 jours » situe ; « Taille M » DÉCIDE — c'est la
                  seule chose qui dit si ce qu'on voit sur elle vaut pour soi.
                  L'heure reste quand il n'y a pas de taille : un vernis ou une
                  coupe n'en ont pas. */}
              <s>{f.taille ? `Taille ${f.taille}` : f.heure}</s>
            </span>
            {!!f.essai?.note && (
              <span className="mu-c-note">
                {Array.from({ length: 5 }, (_, k) => (
                  <Signe key={k} classe={k < f.essai!.note! ? "mu-c-ns on" : "mu-c-ns"} />
                ))}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="mu-c-t">

        {/* L'HEURE EST MONTEE SUR LA LIGNE DU NOM, ET C'EST UNE CORRECTION DE
            MESURE : a cote du bouton, elle lui prenait quarante points sur une
            carte qui en fait cent soixante-quatorze, et « Ca m'interesse »
            s'affichait « Ca m'i... 12 ». Un geste dont on ne lit pas le nom
            n'est plus un geste. */}
        <div className="mu-c-n">
          {/* ═══ QUI PARLE, SUR UNE SEULE LIGNE ═══════════════════════════════

              La maquette écrit « [fantôme] STAFF Marc · Chef » d'un trait, et
              c'est juste : ces trois choses répondent toutes à la même question.
              Écrites sur deux lignes, elles font croire à deux informations et
              volent quinze points de hauteur à chaque carte — sur huit cartes,
              une carte entière. */}
          {!essai && (
            <>
              <span className="mu-c-av2">
                <Signe classe="mu-c-signe" />
              </span>
              {f.maison ? (
                <span className="mu-c-b staff">Staff</span>
              ) : v ? (
                <span className="mu-c-b verbe">{v.mot}</span>
              ) : null}
            </>
          )}
          <b>{f.qui}</b>
          {f.role && <u>· {f.role}</u>}
          <s>{f.heure}</s>
        </div>
        <p>{f.mot}</p>
        {f.essai && (
          <span className="mu-c-e">
            {f.essai.quoi}
            {/* ═══ LA NOTE SE VOIT SUR LE MUR, ET C'EST SA RAISON D'ÊTRE ══════

                Noter pour soi seul n'aurait servi à rien. Ce qui rend la note
                utile, c'est que le SUIVANT la lise : « Karim a mis 5 à cette
                monture sur lui » vaut plus qu'une moyenne de boutique, parce
                qu'on voit la tête de Karim juste à côté.

                CINQ PETITS FANTÔMES, PAS UN CHIFFRE. « 4/5 » se lit comme une
                note de service ; quatre fantômes allumés sur cinq se lisent
                d'un coup d'œil et disent de quel produit on parle. */}
            {!!f.essai.note && (
              <b
                className="mu-c-note"
                aria-label={`${f.essai.note} fantômes sur 5 sur elle ou lui`}
              >
                {Array.from({ length: 5 }, (_, k) => (
                  <Signe key={k} classe={k < f.essai!.note! ? "mu-c-ns on" : "mu-c-ns"} />
                ))}
              </b>
            )}
          </span>
        )}
        <Humeur cle={f.humeur} />
        {/* ─── « CA M'INTERESSE » NE DIT PAS « JE REPONDS », IL DIT « JE PASSE » ───
            Voir le grand commentaire au-dessus de `Passage` : la mise en
            relation se fait SUR PLACE, chez le commercant, et pas dans une
            conversation. Une fois qu'on a dit quand on passe, le bouton porte
            l'heure — c'est un engagement, il doit rester lisible. */}
        {/* ═══ CE N'EST PAS UN LIKE, ET ÇA DOIT SE LIRE AVANT L'APPUI ═══

            « 👍 Ça m'intéresse · 6 ressemble énormément à un like. Or ce n'est
            absolument pas ce que tu veux. »

            C'ÉTAIT EXACT, ET LE CHIFFRE COLLÉ AU POUCE FAISAIT LE GROS DU MAL :
            un pouce suivi d'un nombre est la forme universelle du like, donc on
            lisait « six personnes ont aimé » au lieu de « six personnes veulent
            en parler sur place ». Trois corrections, toutes dans la même
            direction :

              · LE CHIFFRE QUITTE LE BOUTON. Il descend dessous, en toutes
                lettres — « 6 personnes intéressées » ne peut pas se confondre
                avec un compteur de pouces.
              · LE BOUTON DIT SA CONSÉQUENCE, pas son sentiment : « On pourra en
                parler sur place » est écrit SOUS le geste, avant qu'on appuie.
              · APRÈS L'APPUI, IL DEVIENT UN ENGAGEMENT et nomme la personne :
                « Vous pourrez retrouver Léa ici ce midi. » Le fantôme devient
                une présence différée — elle n'est plus là, je n'y suis pas
                encore, et pourtant on se retrouvera. */}
        <div className="mu-c-f">
          {mien ? (
            <em className="mu-int-d">
              {essai ? "Votre essai, visible par les autres." : "Votre trace, visible par les autres."}
            </em>
          ) : (
          <button
            type="button"
            className={`mu-int${quand ? " on" : ""}`}
            aria-pressed={!!quand}
            onClick={() => onDit(f)}
          >
            <i aria-hidden="true">{quand ? "✓" : "👍"}</i>
            {/* UN SEUL LIBELLÉ AVANT L'APPUI, DANS LES DEUX MÉTIERS.
                J'avais écrit « Ça m'intéresse aussi » chez l'onglerie : plus
                long, donc tronqué en « Ça m'intéresse … » sur une carte étroite
                — et un geste dont on ne lit pas le nom n'est plus un geste.
                C'est LA PHRASE DU DESSOUS qui porte la différence, et c'est sa
                place : « un seul concept ». */}
            <span>
              {quand
                ? essai
                  ? "Je veux l’essayer"
                  : "Je veux en parler sur place"
                : "Ça m’intéresse"}
            </span>
          </button>
          )}
          {!mien && (
          <em className="mu-int-d">
            {quand
              ? essai
                ? `${f.qui} l’a essayé ici. À vous d’essayer.`
                : `Vous pourrez retrouver ${f.qui} ici ${quandDit(quand)}.`
              : essai
                ? "Essayez la même chose sur vous"
                : "On pourra en parler sur place"}
          </em>
          )}
          {!mien && (f.interesses ?? 0) + (quand ? 1 : 0) > 0 && (
            <s className="mu-int-n">
              {/* ═══ LES VISAGES EMPILÉS DE LA MAQUETTE SONT DES FANTÔMES ════

                  La maquette empile trois portraits à gauche du compte. On n'a
                  pas de visages à empiler, et en inventer serait fabriquer
                  exactement la preuve sociale que ce compte sert à donner.
                  Trois fantômes disent la même chose et ne mentent pas — c'est
                  déjà la solution retenue en tête du mur d'essai. */}
              <span className="mu-int-v" aria-hidden="true">
                {Array.from(
                  { length: Math.min(3, (f.interesses ?? 0) + (quand ? 1 : 0)) },
                  (_, k) => (
                    <Signe key={k} classe="mu-int-vs" />
                  ),
                )}
              </span>
              {(f.interesses ?? 0) + (quand ? 1 : 0)} personne
              {(f.interesses ?? 0) + (quand ? 1 : 0) > 1 ? "s" : ""} intéressée
              {(f.interesses ?? 0) + (quand ? 1 : 0) > 1 ? "s" : ""}
            </s>
          )}
          {/* ═══ « EN PARLER » EST PARTI DES CARTES ══════════════════════════

              « Photo 5 : supprimer "en parler". »

              IL L'AVAIT DEMANDÉ, PUIS IL L'A REPRIS, ET LES DEUX FOIS IL AVAIT
              RAISON. Sa maquette le dessinait ; à l'écran, la carte disait trois
              fois la même chose en quatre centimètres — « Ça m'intéresse », « En
              parler », puis « On pourra en parler sur place » juste dessous. Le
              second bouton ne proposait rien que le premier ne fasse déjà : on
              signale qu'on passera, et c'est SUR PLACE qu'on en parle. C'est
              même la phrase fondatrice de ce mur.

              LE GESTE N'EST PAS PERDU : il vit au troisième temps de l'essai,
              où il a un objet — son propre rendu à montrer. Ici il n'en avait
              pas. */}
        </div>
        {f.jusqua && (
          <span className="mu-c-d">
            <i aria-hidden="true">⏳</i>
            {f.jusqua}
          </span>
        )}
      </div>
    </article>
  );
}

/* LA TROISIÈME COPIE DE LA TABLE DE ROUTAGE VIVAIT ICI, ET PERSONNE NE
   L'APPELAIT. Elle ignorait la fleuriste et l'artisan, comme celle de la
   maquette : trois copies, trois états différents. Une copie morte est pire
   qu'une copie vivante — elle ne fait rien de faux aujourd'hui, et elle attend
   qu'on l'appelle. Il ne reste que `modeleDeLaBranche` dans `fantomes.ts`. */

/**
 * LE CONTENU DU MUR — les deux écrans, et rien autour.
 *
 * ═══ POURQUOI IL EST SORTI DE LA PAGE ═════════════════════════════════════
 *
 * « Quand j'appuie sur le fantôme, ce n'est pas une pop-up qui monte, c'est
 * carrément une autre page qui n'a rien à voir avec l'annonce, et je vois
 * d'autres onglets avec d'autres annonces. Ce n'est pas du tout ce que je
 * veux. »
 *
 * IL AVAIT RAISON, ET C'ÉTAIT UNE ERREUR DE FORME AUTANT QUE DE FOND. Le mur
 * d'un commerce n'est pas une destination : c'est ce qu'on regarde SANS quitter
 * son annonce, exactement comme la feuille de « Proposer à mes amis ». Une page
 * emmène ailleurs ; une feuille laisse l'annonce dessous, et c'est elle qui
 * donne son sens au mot « ici », répété partout dans cet écran.
 *
 * CE FICHIER NE SAIT DONC PLUS OÙ IL S'AFFICHE. Il reçoit un mur, il rend ses
 * deux écrans, il rend sa feuille de style — et il sert aux deux endroits : la
 * feuille qui monte sur le paquet, et la maquette de jugement qui permet de
 * comparer cinq commerces côte à côte.
 */
/**
 * PAR OÙ ON ENTRE, ET ÇA DÉPEND DU MÉTIER.
 *
 * « Il y a trop de distraction ici avec le mur qui apparaît déjà, alors que ce
 * qu'on veut c'est juste essayer sur soi. Il faut vraiment mettre le focus sur
 * l'essayage dès le départ, sans avoir le mur — avec un seul bouton quelque part
 * qui dit voir le mur du commerçant. »
 *
 * CHEZ UN RESTAURANT, LE MUR EST LE PRODUIT : ce qu'on vient voir, ce sont les
 * gens qui sont passés. Chez une onglerie, un coiffeur, une boutique, le mur est
 * la PREUVE — il n'a d'intérêt qu'après qu'on a compris qu'on peut essayer. Le
 * montrer d'abord, c'est faire lire vingt vignettes avant la seule phrase qui
 * compte.
 */
/**
 * ═══ LE FANTÔME MÈNE À L'ESSAI, OU AU MUR ═══════════════════════════════════
 *
 * « N'oublie pas que le fantôme amène sur l'essayage quand personne n'a encore
 * essayé, mais quand une ou plusieurs personnes ont essayé, alors le fantôme
 * amène sur le mur des clients qui ont essayé. »
 *
 * IL MENAIT TOUJOURS À L'ESSAI, et sur un mur vide c'était le bon choix : un
 * mur qui n'a rien à montrer n'est pas une destination, c'est une déception.
 * Mais dès qu'il y a des gens dessus, l'ordre s'inverse — voir dix personnes
 * portant la chose donne bien plus envie de l'essayer que l'écran de prise de
 * vue, qui demande un effort avant d'avoir rien montré.
 *
 * ET C'EST LA SEULE RÈGLE : on ne choisit pas selon le métier, on regarde s'il
 * y a quelqu'un. Un mur se remplit tout seul, donc la porte change toute seule.
 */
const entree = (mur: TypeMur): "mur" | "depot" =>
  mur.depot === "essai" && mur.clients.length === 0 ? "depot" : "mur";

export function MurContenu({
  mur,
  onSalon,
  onFavori,
  favori,
  ouvrirSur,
  surprendre,
  piecePrechoisie,
  rayonPrechoisi,
  ouvrirSurGrille,
  onReserver,
}: {
  mur: TypeMur;
  /** Voir `VersLeSalon` : absent là où il n'y a pas de salon. */
  onSalon?: (o: VersLeSalon) => void;
  /**
   * METTRE EN FAVORI, ET C'EST LE GESTE DE LA CARTE.
   *
   * La maquette du troisième temps le pose à côté de « Prendre rendez-vous ».
   * Il est branché sur le MÊME `garderLeSommet` que le rail de l'annonce : un
   * second système de favoris pour l'essai aurait donné deux poches, et celle
   * qu'on ne regarde pas se vide toute seule.
   *
   * IL EST FACULTATIF, comme `onSalon` : sur le mur seul et sur la page du
   * commerce il n'y a pas de carte, donc pas de favori, donc pas de bouton.
   */
  onFavori?: () => void;
  /** L'annonce est-elle déjà gardée ? Le bouton le dit plutôt que de le taire. */
  favori?: boolean;
  /**
   * PAR OÙ ON ENTRE, QUAND L'APPELANT LE SAIT MIEUX QUE NOUS.
   *
   * `entree` choisit bien pour le fantôme de la barre, qui ne dit rien de ce
   * qu'on veut. Deux boutons, eux, le disent : « Essayer sur moi » promet
   * l'essai et doit y aller même si le mur est plein, et « 38 essayages de ce
   * pantalon » promet le mur et doit y aller même s'il est vide. Un bouton qui
   * ouvre autre chose que ce qu'il annonce est la promesse la plus concrète
   * qu'un écran puisse rompre.
   */
  ouvrirSur?: "mur" | "depot";
  /**
   * ═══ ON EST ENTRÉ PAR « SURPRENDS-MOI » ═══════════════════════════════════
   *
   * LE BOUTON EST SUR LA PAGE DU COMMERÇANT, LA RECHERCHE EST ICI, ET IL Y A
   * UNE PRISE DE VUE ENTRE LES DEUX. On ne peut pas partir chercher un look
   * avant d'avoir une photo sur quoi le poser ; mais on ne peut pas non plus
   * oublier en route que la personne a demandé une surprise, sinon elle
   * retombe sur la grille qu'elle venait précisément de refuser.
   *
   * L'INTENTION SE CONSOMME UNE FOIS, À LA VALIDATION DE LA PHOTO. Ensuite le
   * parcours est le parcours normal : « Je choisis moi-même » reste offert sur
   * l'écran de recherche, et rien n'est verrouillé.
   */
  surprendre?: boolean;
  /**
   * ═══ LA PIÈCE QU'ON A DÉSIGNÉE AVANT D'ENTRER ═════════════════════════════
   *
   * LA VITRINE DE LA PAGE DU COMMERÇANT LAISSE CHOISIR UNE PIÈCE, et jusqu'ici
   * ce choix se perdait en chemin : la page le gardait dans son état, ne le
   * transmettait à personne, et l'atelier s'ouvrait sur la grille comme si l'on
   * n'avait rien touché. On appuyait sur une veste et on retombait devant six
   * vestes.
   *
   * ELLE EST PRÉ-SÉLECTIONNÉE, PAS IMPOSÉE. La prise de vue reste le premier
   * écran — il faut une photo avant de poser quoi que ce soit — et c'est à sa
   * validation que le calcul part directement sur cette pièce-là. Les autres
   * restent à un geste, dans la bande des styles sous le rendu.
   */
  piecePrechoisie?: string;
  /**
   * ═══ LA FAMILLE DE PIÈCES DEMANDÉE DEPUIS LA VITRINE ══════════════════════
   *
   * « Robes », « Hauts », « Bas » : les pastilles de la page du commerce
   * ouvrent la collection déjà filtrée. Voir `lib/direct/rayons.ts`, qui dit
   * aussi pourquoi ces familles se lisent dans le NOM de la pièce et pas dans
   * les rayons du commerçant.
   *
   * ABSENT, LA GRILLE MONTRE TOUT, et c'est le cas normal — « Explorer la
   * collection » n'a pas de filtre.
   */
  rayonPrechoisi?: string;
  /**
   * ON OUVRE SUR LA GRILLE, PAS SUR LA PRISE DE VUE.
   *
   * « Explorer la collection » promet une collection : la faire précéder d'un
   * écran « prenez une photo de vous » serait tenir une autre promesse que
   * celle du bouton. La photo est demandée au moment où l'on DÉSIGNE une
   * pièce — c'est-à-dire quand elle sert enfin à quelque chose, et quand on
   * sait pourquoi on la donne. Voir `changerDeStyle`.
   */
  ouvrirSurGrille?: boolean;
  /**
   * CE QUE FAIT LA FIN DE L'AVANT-GOÛT.
   *
   * Le parcours se termine sur RÉSERVER, et ce bouton doit faire exactement ce
   * que fait « Réserver ma table » sur l'annonce — le même geste, le même
   * créneau, la même déduction de ce qu'il reste. Le brancher ailleurs aurait
   * fabriqué une seconde réservation qui ne décompte rien.
   *
   * ABSENT, LE PARCOURS S'ARRÊTE SUR L'ÉMOTION et ne dessine pas le bouton :
   * sur la maquette de jugement des murs il n'y a pas d'annonce derrière, donc
   * rien à réserver. Même règle que `onSalon` et `onFavori`.
   */
  onReserver?: () => void;
}) {
  /** Où l'on en est : le mur, ou le dépôt. Voir `entree` et `ouvrirSur`. */
  const [ecran, setEcran] = useState<"mur" | "depot">(() => ouvrirSur ?? entree(mur));
  /**
   * ═══ CE QU'ON VIENT D'ESSAYER, VU D'EN HAUT ═══════════════════════════════
   *
   * « Je ne suis pas certain que les gens comprennent que ce sont les gens qui
   * ont essayé virtuellement le MÊME article, parce qu'on voit différents
   * articles sur différentes femmes, ce qui n'est pas logique. »
   *
   * LE MUR NE SAVAIT PAS CE QU'ON VENAIT D'ESSAYER. Il montrait sept clientes
   * portant sept pièces différentes, sous un titre qui disait « essayages de ce
   * look » : le compte était vrai pour le MAGASIN et faux pour la PIÈCE, et rien
   * à l'écran ne disait laquelle des deux on regardait.
   *
   * L'ESSAI LE LUI DIT MAINTENANT, et c'est ce qui permet au mur de se
   * restreindre à cette pièce-là — « sur moi, et sur les autres » — avec le
   * magasin entier à un geste de distance.
   */
  const [essaiVu, setEssaiVu] = useState<EssaiVu | null>(null);
  /**
   * LE COMPTEUR QUI RAMÈNE AU CATALOGUE.
   *
   * L'essai reste monté pendant qu'on regarde le mur — c'est ce qui préserve le
   * rendu — donc lui dire « reviens à la grille » ne peut pas passer par un
   * changement d'écran : il est déjà là. Ce compteur s'incrémente, l'essai le
   * voit changer, et il repart sur le choix des pièces. Un booléen n'aurait
   * marché qu'une fois.
   */
  const [catalogue, setCatalogue] = useState(0);
  const [dits, setDits] = useState<Record<string, string>>({});
  /** Le fantôme sur lequel on vient d'appuyer, et à qui on dit quand on passe. */
  const [passage, setPassage] = useState<Fantome | null>(null);
  /**
   * LES FANTÔMES QU'ON A POSÉS ICI, ET ILS SURVIVENT MAINTENANT À LA FEUILLE.
   *
   * Ils vivaient dans cet état seul, remis à zéro à chaque changement de mur :
   * le fantôme disparaissait à la seconde où l'on quittait l'écran. « Le fantôme,
   * c'est vous quand vous n'êtes pas là » était donc exactement ce que la
   * maquette ne savait pas faire. Voir `lib/direct/mes-fantomes.ts`.
   */
  const [poses, setPoses] = useState<Fantome[]>([]);
  /** Combien de places il reste, comptées sur la mémoire et non sur l'écran. */
  const [dehors, setDehors] = useState(0);
  /** Le mur déplié : les rangées deviennent une grille, rien ne dépasse du bord. */
  const [tout, setTout] = useState(false);
  /**
   * « PASSER CETTE DÉCOUVERTE », ET ÇA NE FERME PAS LA FEUILLE.
   *
   * Quelqu'un qui veut juste l'adresse et l'heure ne doit pas avoir à jouer pour
   * les obtenir — un jeu obligatoire n'est plus un jeu. Mais le renvoyer à
   * l'annonce lui reprendrait tout : le mur de présence existe toujours, il
   * n'est plus que la porte de derrière. Passer l'avant-goût mène donc au mur.
   */
  const [goutPasse, setGoutPasse] = useState(false);
  /**
   * ET « PASSER » VAUT AUSSI POUR LA SOIRÉE, avec la même porte de derrière.
   *
   * DEUX ÉTATS ET NON UN SEUL, parce qu'un lieu peut changer de mécanique d'un
   * jour à l'autre — un bar qui n'a pas de soirée ce soir garde son mur. Un
   * drapeau commun ferait retomber sur le mur quelqu'un qui a seulement passé
   * l'autre écran, six heures plus tôt.
   */
  const [soireePassee, setSoireePassee] = useState(false);

  useEffect(() => {
    /**
     * LA MÊME RÈGLE QU'À L'ARRIVÉE, ET C'EST UNE CORRECTION.
     *
     * CET EFFET RÉÉCRIVAIT LA DÉCISION une milliseconde après l'avoir prise : il
     * portait sa propre copie de l'ancienne règle — « un mur d'essai ouvre
     * toujours sur le dépôt » — et il s'exécute AU MONTAGE, donc il écrasait et
     * `ouvrirSur` et `entree`. Le fantôme continuait d'ouvrir la prise de vue
     * sur un mur plein, et le module « 7 essayages » aussi.
     *
     * C'EST LA FAUTE CLASSIQUE DE LA RÈGLE ÉCRITE DEUX FOIS : l'une des deux
     * copies ne bouge pas quand l'autre change, et c'est toujours celle qu'on ne
     * regarde pas. Il n'y en a plus qu'une.
     */
    setEcran(ouvrirSur ?? entree(mur));
    setPassage(null);
    setDits({});
    setTout(false);
    setGoutPasse(false);
    // ON RELIT LA MÉMOIRE À CHAQUE MUR : ce qu'on a laissé ICI revient en tête,
    // et le quota se compte sur TOUS les lieux, pas sur celui-ci.
    setPoses(
      fantomesDuLieu(mur.cle).map((f) => ({
        id: f.id,
        qui: "Vous",
        photo: f.photo ?? mur.photoLieu,
        essai: f.essai,
        mot: f.mot,
        heure: new Date(f.depose).toTimeString().slice(0, 5),
        interesses: 0,
        jusqua: tempsRestant(f),
      })),
    );
    setDehors(mesFantomes().length);
    // `ouvrirSur` ET LE NOMBRE DE CLIENTS ENTRENT DANS LES DÉPENDANCES : ce sont
    // eux qui décident maintenant de la porte, et un effet qui lit une valeur
    // sans la déclarer se fige sur celle du premier rendu.
  }, [mur.cle, mur.photoLieu, mur.depot, mur.clients.length, ouvrirSur]);

  /**
   * CE QUE FAIT LE POUCE, ET ÇA DÉPEND DU MÉTIER.
   *
   * Chez un restaurant il ouvre « Vous passez quand ? » : la mise en relation se
   * fait SUR PLACE, et c'est tout le sens du geste.
   *
   * CHEZ UNE ONGLERIE, DEMANDER QUAND ON PASSE EST UN CONTRESENS. La carte dit
   * « Essayez la même chose sur vous » — si l'appui ouvre un choix d'horaire, la
   * phrase ment. Il envoie donc à l'essai, immédiatement, ce qui est aussi ce
   * qu'on veut mettre en avant partout sur ces murs-là.
   */
  const interesse = (f: Fantome) => {
    if (mur.depot === "essai") {
      setEcran("depot");
      return;
    }
    setPassage(f);
  };

  const clients = [...poses, ...mur.clients];
  const restants = Math.max(0, QUOTA_DU_JOUR - dehors);

  /**
   * L'AVANT-GOÛT PASSE DEVANT LE MUR DE PRÉSENCE.
   *
   * « Quand on clique sur le fantôme pour les restaurants, on va être différent
   * de ce qu'on avait imaginé, parce que "Faites savoir que vous êtes ici" ne
   * remporte pas le succès escompté. »
   *
   * IL NE REMPLACE PAS LE MUR, IL LE PRÉCÈDE — et c'est une distinction qui
   * compte. Le mur reste la destination de « Passer cette découverte », et il
   * reste l'écran des commerces qui n'ont pas de plat raconté. Ce qui change,
   * c'est ce qu'on trouve EN PREMIER derrière le fantôme d'un restaurant : pas
   * une question qui suppose qu'on ait déjà décidé d'y aller, mais un plat avec
   * lequel on joue.
   *
   * ET ÇA NE TOUCHE PAS LE DÉPÔT. Sur un mur d'essai — l'onglerie, l'opticien —
   * `entree` envoie sur la prise de vue et rien ici ne s'interpose : ces
   * métiers-là ont déjà leur « essayer », c'est le vrai.
   */
  const gout = !goutPasse && ecran === "mur" ? mur.gout : undefined;
  /**
   * ═══ LA SOIRÉE PASSE DEVANT TOUT LE RESTE ═══════════════════════════════
   *
   * « PAGE COMMERÇANT → 👻 ESSAYER → 👻 LAISSER MON FANTÔME → LIVE DE LA
   * SOIRÉE. »
   *
   * ELLE NE REMPLACE PAS LE MUR, ELLE LE PRÉCÈDE — exactement comme
   * l'Avant-goût, et pour la même raison : « qui est là ? » suppose qu'on ait
   * déjà décidé d'y aller, alors qu'à dix-huit heures la question est plus tôt.
   * « Passer » mène au mur, qui reste la porte de derrière.
   *
   * ET ELLE PASSE AUSSI DEVANT L'AVANT-GOÛT. Les deux ne cohabitent jamais chez
   * un même lieu — voir `lib/direct/soiree.ts` — mais l'ordre est écrit ici
   * quand même : le jour où quelqu'un remplit les deux par erreur, l'écran doit
   * en choisir un plutôt que d'en dessiner deux.
   */
  const soiree = !soireePassee && ecran === "mur" ? mur.soiree : undefined;

  return (
    <>
      <Styles />
      {/* ═══ CHEZ QUI SOMMES-NOUS ? ═══════════════════════════════════════════

          LA FEUILLE NE LE DISAIT NULLE PART. Elle monte par-dessus l'annonce,
          donc le nom est caché DERRIÈRE elle au moment précis où l'on en a
          besoin — et le mot « ici », répété à chaque ligne de cet écran, ne
          renvoyait visuellement à rien. Un bandeau, une ligne, deux niveaux :
          le nom, puis le métier et la distance. C'est la même information que la
          barre du haut de l'application, au même endroit, dans le même ordre. */}
      {/* ═══ ET SUR LE PARCOURS D'ESSAI, IL SE REDUIT A L'ENDROIT ═══════════

          « Je pense que cette partie peut être supprimée : Une boutique de la
          rue piétonne / Prêt-à-porter · Dax · 210 m. »

          IL A RAISON LA, ET IL AVAIT RAISON DE LE DEMANDER AVANT. Sur le MUR,
          ce bandeau répond à « chez qui suis-je ? » — la feuille monte par-
          dessus l'annonce et cache le nom au moment précis où l'on en a besoin.
          Sur l'ESSAI, on ne se pose plus cette question : on vient de choisir la
          monture, on voit sa photo, et l'écran demande la sienne. Le nom du
          commerce y prend deux lignes pour répéter ce qu'on sait déjà, juste
          au-dessus d'un écran dont sa maquette dit qu'il doit être immersif.

          IL RESTE L'ENDROIT, ET C'EST SA MAQUETTE QUI LE GARDE : « 📍 Dax ·
          350 m » sur une ligne. La distance décide encore quelque chose — on
          essaie avant d'y aller — alors que le nom ne décide plus rien à ce
          moment-là. */}
      {/* ET L'AVANT-GOÛT NE LE PORTE PAS DU TOUT. Même raison que l'essai, en
          plus net encore : son parcours écrit déjà « le lieu · la ville · la
          distance » en pied d'écran, et le plat doit occuper le haut. Deux
          bandeaux d'adresse sur un écran de sept lignes, c'est un écran qui
          parle de lui-même. */}
      {/* ET LA SOIRÉE NE LE PORTE PAS NON PLUS. Même raison que l'Avant-goût :
          son pied d'écran écrit déjà le lieu et l'heure, et le premier écran
          est fait pour être immersif. */}
      {!gout && !soiree && (
      <div className={`mu-chez${ecran === "depot" ? " court" : ""}`}>
        <i aria-hidden="true">📍</i>
        <span>
          {ecran === "depot" ? (
            <b>{[mur.ville, mur.distance].filter(Boolean).join(" · ")}</b>
          ) : (
            <>
              <b>{mur.lieu}</b>
              <em>{[mur.metier, mur.ville, mur.distance].filter(Boolean).join(" · ")}</em>
            </>
          )}
        </span>
      </div>
      )}
      {soiree ? (
        <EcranSoiree
          soiree={soiree}
          distance={mur.distance}
          onFermer={() => setSoireePassee(true)}
          /* « J'Y VAIS » EST LE MÊME GESTE QUE « RÉSERVER » SUR L'ANNONCE.
             Le quatrième temps de son cahier des charges ne fabrique pas un
             second chemin : il emmène là où l'annonce emmenait déjà. */
          onYAller={onReserver}
        />
      ) : gout ? (
        <EcranGout
          gout={gout}
          lieu={mur.lieu}
          ville={mur.ville}
          distance={mur.distance}
          onReserver={onReserver}
          onFermer={() => setGoutPasse(true)}
        />
      ) : null}

      {/* ═══ L'ESSAI RESTE MONTÉ PENDANT QU'ON REGARDE LE MUR ════════════════

          « À la fin de cette page on voit "Essayer sur moi — me photographier
          en buste" alors que je viens tout juste d'essayer ce produit. Ce CTA
          n'est pas bon : ça devrait me ramener à mon essai, parce que je n'ai
          plus de bouton nulle part pour revoir mon essayage. »

          IL AVAIT RAISON, ET LA CAUSE ÉTAIT STRUCTURELLE. Les deux écrans
          étaient les deux branches d'un même ternaire : passer au mur
          DÉMONTAIT l'essai, donc la pièce choisie, le rendu calculé, la note
          donnée — tout partait. Le bouton du bas ne pouvait alors rien proposer
          d'autre que de tout recommencer, parce qu'il n'y avait plus rien à
          quoi revenir.

          IL EST MAINTENANT CACHÉ, PAS DÉMONTÉ. `hidden` met l'écran hors du
          flux et hors du champ des lecteurs, mais React garde son état : on
          revient sur SON rendu, exactement là où on l'avait laissé. C'est la
          différence entre une application et un site.

          ET SEULEMENT SUR LES MURS D'ESSAI. Ailleurs — un bar, un restaurant —
          il n'y a pas de rendu à préserver, et garder deux écrans montés
          coûterait sans rien rendre. */}
      {!soiree && !gout && (
        <div hidden={ecran !== "mur"}>
        <EcranMur
          mur={mur}
          clients={clients}
          restants={restants}
          dits={dits}
          onDit={interesse}
          onDeposer={() => setEcran("depot")}
          // « EN PARLER » EMPORTE LE MESSAGE DANS LE SALON. La maquette met
          // deux boutons sous chaque message d'un mur de lieu, et ils ne
          // s'adressent pas aux mêmes gens : « Ça m'intéresse » parle AU LIEU
          // — je signale que je passerai — et « En parler » parle À MES AMIS :
          // « il y a une dégustation à 19 h, qui vient ? ». Il n'existe que là
          // où il y a un salon derrière : sur la maquette de jugement des murs,
          // `onSalon` est absent, donc le bouton ne se dessine pas — un geste
          // qui n'ouvre rien serait pire que pas de geste.
          onParler={
            onSalon
              ? (f) =>
                  onSalon({
                    quoi: f.mot,
                    image: f.photo ?? mur.photoLieu ?? "",
                    note: 0,
                    depuis: "mur",
                    qui: f.qui,
                  })
              : undefined
          }
          tout={tout}
          onTout={setTout}
          essaiVu={essaiVu}
          onRevoir={() => setEcran("depot")}
          onCatalogue={() => {
            setCatalogue(catalogue + 1);
            setEcran("depot");
          }}
        />
        </div>
      )}

      {!soiree && !gout && (
        <div hidden={ecran !== "depot"}>
        <EcranDepot
          mur={mur}
          clients={clients}
          restants={restants}
          dits={dits}
          onDit={interesse}
          onSalon={onSalon}
          onFavori={onFavori}
          favori={favori}
          surprendre={surprendre}
          piecePrechoisie={piecePrechoisie}
          rayonPrechoisi={rayonPrechoisi}
          ouvrirSurGrille={ouvrirSurGrille}
          onFerme={() => setEcran("mur")}
          onPose={(f) => {
            /**
             * ON ÉCRIT DANS LA MÉMOIRE AVANT D'AFFICHER.
             *
             * Un essai reste deux jours, une annonce quelques heures : la durée
             * vient du dépôt lui-même, pas d'une constante unique.
             */
            const heures = f.essai ? 48 : HEURES_PAR_DEFAUT;
            /* IL FLOTTE, DONC SON SON FLOTTE : une note tenue avec un souffle
               d'attaque, et non une percussion. C'est la seule voix du jeu qui
               ne frappe pas — voir `sons.ts`. */
            jouer("fantome");
            const reste = poserFantome(
              {
                id: f.id,
                souvenir: {
                  cle: mur.cle,
                  modele: mur.modele ?? mur.cle,
                  lieu: mur.lieu,
                  metier: mur.metier,
                  ville: mur.ville,
                  distance: mur.distance,
                  note: mur.note,
                  avis: mur.avis,
                  photoLieu: mur.photoLieu,
                },
                mot: f.mot,
                photo: f.photo,
                essai: f.essai,
                depose: Date.now(),
                jusqua: Date.now() + heures * 3600_000,
              },
              QUOTA_DU_JOUR,
            );
            setDehors(reste.length);
            setPoses((l) => [f, ...l]);
            /**
             * UN DÉPÔT D'ANNONCE FINIT SUR LE MUR ; UN ESSAI N'EN BOUGE PAS.
             *
             * Écrire une annonce puis voir sa carte apparaître au milieu des
             * autres, c'est la récompense du geste. Mais renvoyer au mur
             * quelqu'un qui vient de décider après un essai, c'est lui reprendre
             * son rendu pour lui montrer vingt vignettes — exactement la
             * distraction qu'on vient d'enlever de l'entrée. L'essai dit lui-même
             * que le rendu est parti sur le mur, et propose d'aller le voir.
             */
            if (mur.depot !== "essai") setEcran("mur");
          }}
          onEssai={setEssaiVu}
          catalogue={catalogue}
        />
        </div>
      )}

      {passage && (
        <Passage
          f={passage}
          mur={mur}
          quand={dits[passage.id]}
          onQuand={(q) => setDits((d) => ({ ...d, [passage.id]: q }))}
          onFerme={() => setPassage(null)}
        />
      )}
    </>
  );
}

/**
 * ON SE PARLE SUR PLACE, PAS DANS L'APPLICATION.
 *
 * ═══ LE DÉFAUT, ET IL ÉTAIT DE FOND ═══════════════════════════════════════
 *
 * « Je ne suis pas certain qu'on veuille que les gens se répondent. Ils doivent
 * se mettre en relation sur le lieu, non ? Sinon ils vont laisser leur fantôme
 * un peu partout où il y a du monde sans aller chez le commerçant, et ça
 * deviendrait juste des chats. »
 *
 * C'EST EXACT, ET C'ÉTAIT LE PLUS GRAVE DES QUATRE. Une conversation privée qui
 * s'ouvre depuis le mur rend le déplacement inutile : on obtient ce qu'on
 * voulait sans jamais pousser la porte. Le commerçant héberge alors une
 * messagerie et n'y gagne rien — et le jour où il s'en aperçoit, il retire son
 * mur.
 *
 * ═══ CE QUE « ÇA M'INTÉRESSE » VEUT DIRE MAINTENANT ═══════════════════════
 *
 *   « J'aimerais qu'on se parle quand on se verra sur place. »
 *
 * Le geste ne produit donc PAS un message : il produit UNE HEURE DE PASSAGE.
 * On dit quand on vient, la personne le sait, et la rencontre a lieu chez le
 * commerçant. C'est le seul dessin où les trois y gagnent : celui qui a laissé
 * le fantôme obtient une réponse, celui qui répond obtient une raison de
 * sortir, et le commerçant obtient la visite.
 *
 * ═══ ET PERSONNE N'EST FRUSTRÉ SI PERSONNE NE SE CROISE ══════════════════
 *
 * C'était le vrai risque de ce choix. Deux choses le tiennent :
 *
 *   · LE FANTÔME RESTE SUR LE MUR pendant qu'on y est. C'est lui qui sert de
 *     présentation — on arrive, on regarde le mur, on sait qui est là et à quoi
 *     ça ressemble. Sans lui, deux inconnus dans une salle ne se trouvent pas.
 *   · ON NE PROMET RIEN. Le mot est « vous passez », pas « rendez-vous ». Une
 *     promesse non tenue se paie ; une intention annoncée, non.
 */
function Passage({
  f,
  mur,
  quand,
  onQuand,
  onFerme,
}: {
  f: Fantome;
  mur: TypeMur;
  quand?: string;
  onQuand: (q: string) => void;
  onFerme: () => void;
}) {
  /**
   * QUATRE MOMENTS, ET PAS UN CALENDRIER. « Ce midi » se choisit en un appui ;
   * une date et une heure demandent de réfléchir, et on n'appuie pas deux fois
   * sur un écran qui fait réfléchir. Le dernier est volontairement vague : « un
   * de ces jours » vaut mieux qu'un faux rendez-vous.
   */
  const moments = ["J’y suis", "ce midi", "ce soir", "demain"];
  return (
    <>
      <button type="button" className="mu-fondu" aria-label="Fermer" onClick={onFerme} />
      <div className="mu-rel" role="dialog" aria-modal="true">
        <div className="mu-rel-t">
          <Signe classe="mu-rel-s" />
          <b>{quand ? "C’est noté" : "Vous passez quand ?"}</b>
        </div>

        {quand ? (
          <>
            <p className="mu-rel-q">
              {f.qui} saura que quelqu’un passe {quandDit(quand)}.
            </p>
            <p className="mu-rel-n">
              Vous verrez son fantôme sur le mur en arrivant — c’est comme ça que vous vous
              reconnaîtrez. ClikMe n’ouvre pas de conversation&nbsp;: ça se dit chez{" "}
              {mur.lieu.replace(/^Chez /, "")}.
            </p>
            <button type="button" className="mu-rel-b" onClick={onFerme}>
              Fermer
            </button>
          </>
        ) : (
          <>
            <p className="mu-rel-q">
              {f.mot.length > 90 ? `${f.mot.slice(0, 89).trimEnd()}…` : f.mot}
            </p>
            <p className="mu-rel-n2">
              Dites à {f.qui} quand vous serez {chezQui(mur.lieu)}&nbsp;: c’est là que vous vous
              parlerez.
            </p>
            <div className="mu-quand">
              {moments.map((m) => (
                <button key={m} type="button" onClick={() => onQuand(m)}>
                  {m}
                </button>
              ))}
            </div>
            <p className="mu-rel-n">
              ClikMe n’ouvre pas de conversation. Ce mur sert à se croiser, pas à s’écrire.
            </p>
          </>
        )}
        <button type="button" className="mu-rel-x" onClick={onFerme}>
          {quand ? "Voir le mur" : "Plus tard"}
        </button>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ÉCRAN 1 — LE MUR
   ════════════════════════════════════════════════════════════════════════ */

function EcranMur({
  mur,
  clients,
  restants,
  dits,
  onDit,
  onDeposer,
  onParler,
  tout,
  onTout,
  essaiVu,
  onRevoir,
  onCatalogue,
}: {
  tout: boolean;
  onTout: (v: boolean) => void;
  /** Ce qu'on vient d'essayer, quand on arrive d'un rendu. Voir `EssaiVu`. */
  essaiVu?: EssaiVu | null;
  /** Revenir à SON rendu — il n'a pas été démonté. Voir `MurContenu`. */
  onRevoir?: () => void;
  /** Revenir à la grille des pièces. */
  onCatalogue?: () => void;
  mur: TypeMur;
  clients: Fantome[];
  restants: number;
  dits: Record<string, string>;
  onDit: (f: Fantome) => void;
  onDeposer: () => void;
  /** Le second geste des cartes, sur un mur de lieu : voir `onParler`. */
  onParler?: (f: Fantome) => void;
}) {
  /**
   * ═══ SUR QUOI PORTE CE MUR ════════════════════════════════════════════════
   *
   * « Je ne suis pas certain que les gens comprennent que ce sont les gens qui
   * ont essayé virtuellement le MÊME article, parce qu'on voit différents
   * articles sur différentes femmes, ce qui n'est pas logique. »
   *
   * IL AVAIT RAISON, ET LE MUR MENTAIT SANS LE SAVOIR. Il affichait « 7
   * essayages de ce look » au-dessus de sept clientes portant sept pièces
   * DIFFÉRENTES : le compte était vrai pour le magasin et faux pour la pièce, et
   * rien à l'écran ne disait laquelle des deux on regardait.
   *
   * IL A DONC DEUX CADRAGES, ET ILS SONT NOMMÉS. « Cette pièce » quand on
   * arrive d'un essai — la même chose sur d'autres corps, c'est-à-dire la seule
   * comparaison qui aide à décider. « Tout le magasin » pour le reste, et là le
   * titre dit « pièces », au pluriel, parce que c'est ce qu'on voit.
   *
   * ON OUVRE SUR LA PIÈCE QUAND IL Y A UNE PIÈCE, et on retombe sur le magasin
   * quand personne d'autre ne l'a essayée : un cadrage nommé « Cette pièce » qui
   * ne montre rien apprend que le mur est vide, ce qui est faux.
   */
  const nomPiece = essaiVu?.piece.nom ?? null;
  const memePiece = useMemo(
    () => (nomPiece ? clients.filter((f) => f.essai?.quoi === nomPiece) : []),
    [clients, nomPiece],
  );
  /**
   * ═══ LE CADRAGE SE DÉDUIT, IL NE SE SYNCHRONISE PAS ═══════════════════════
   *
   * ON OUVRE SUR LA PIÈCE DÈS QU'ON ARRIVE D'UN ESSAI, même si personne d'autre
   * ne l'a essayée. Retomber sur le magasin quand le compte est nul paraissait
   * prévenant ; ça cachait surtout la mécanique — on ne découvrait jamais que
   * ce mur SAIT se restreindre à une pièce. Le vide se dit, il ne se contourne
   * pas : voir `mu-seule`.
   *
   * PREMIER JET : UN `useState` REMIS À JOUR PAR UN `useEffect` sur le nom de
   * la pièce. ESLint l'a refusé, et il avait raison — poser un état dans un
   * effet fait rendre deux fois, une fois avec l'ancien cadrage et une fois
   * avec le nouveau, et c'est exactement la seconde où l'on voit l'écran
   * changer d'avis.
   *
   * CE QU'ON GARDE EST LE CHOIX, PAS LE RÉSULTAT. L'état retient sur QUELLE
   * pièce on a touché une pastille ; le cadrage s'en déduit. Changer de pièce
   * périme le choix tout seul, sans que rien n'ait à le remettre à jour.
   */
  const [choix, setChoix] = useState<{ pour: string | null; cadre: "piece" | "tout" } | null>(null);
  const cadre =
    choix && choix.pour === nomPiece ? choix.cadre : nomPiece ? "piece" : "tout";
  const setCadre = (c: "piece" | "tout") => setChoix({ pour: nomPiece, cadre: c });
  const surPiece = cadre === "piece" && !!essaiVu;
  const vus = surPiece ? memePiece : clients;

  return (
    <>
      {/* ═══ UNE SEULE TÊTE, ET ELLE DIT POURQUOI ON REGARDE ═══

          « Une fois qu'on a cliqué sur le fantôme, c'est très compliqué à
          comprendre : il y a trop d'infos visuelles. »

          IL Y AVAIT TROIS TITRES ET DEUX INTRODUCTIONS AVANT LA PREMIÈRE CARTE :
          « Ton Fantôme », « Le mur du jour », « Les clients du jour », plus le
          quota et « Aujourd'hui ». Cinq façons de nommer une seule chose. Le
          vocabulaire a disparu : il ne reste QUE ce qui est vrai — des gens ont
          laissé quelque chose ici, et on peut leur répondre en venant.

          ET LES DEUX MÉTIERS NE DISENT PAS LA MÊME PHRASE, parce qu'ils ne
          proposent pas la même chose. Un restaurant propose de SE CROISER ; une
          onglerie propose d'ESSAYER. Voir `Depot` dans `lib/direct/fantomes.ts`. */}
      {mur.depot === "essai" ? (
        /* CE MUR-LÀ N'EST PLUS L'ENTRÉE, C'EST LA PREUVE. On n'y arrive que par
           le bouton du bas de l'essai — voir `entree` et `mots.mur`. Sa tête n'a
           donc plus à vendre l'essai : elle dit ce qu'on regarde, et elle rend le
           chemin du retour évident. */
        /* ═══ LA TÊTE DU MUR, D'APRÈS LA MAQUETTE ═══════════════════════════

           « 38 essayages de ce pantalon — Découvrez comment la communauté porte
           ce look. Des vraies clientes, de vrais avis. »

           ELLE DISAIT « Ce que les clients ont essayé ici », ce qui est vrai et
           ne dit rien : pas combien, pas de quoi, pas pourquoi on regarde. Le
           COMPTE est ce qui fait entrer — c'est lui qui dit qu'il y a quelque
           chose à voir — et il n'était nulle part.

           LE NOMBRE EST CELUI DU MUR, JAMAIS UN NOMBRE ÉCRIT ICI. Même règle
           que le module sous l'annonce : fabriquer « 38 » quand il y en a sept
           serait inventer la preuve sociale que ce mur existe justement pour
           montrer. */
        <div className="mu-haut essai">
          {/* ═══ LA PIÈCE DONT ON PARLE, EN TÊTE ═══════════════════════════

              LA MAQUETTE LA MET LÀ, et c'est ce qui manquait le plus : un
              bandeau qui dit DE QUOI ce mur parle. Sans lui, on arrivait sur
              une grille de vignettes sans savoir si on regardait une pièce, un
              magasin ou une ville — et la réponse changeait selon d'où l'on
              venait, ce que rien n'indiquait.

              ELLE NE SE DESSINE QUE QUAND ON ARRIVE D'UN ESSAI. Sans essai, il
              n'y a pas de pièce à nommer : le mur parle alors du magasin, et son
              titre le dit. */}
          {essaiVu && (
            <div className="mu-piece">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mu-piece-ph" src={essaiVu.piece.photo} alt="" />
              <div className="mu-piece-t">
                <b>{essaiVu.piece.nom}</b>
                <em>
                  {mur.lieu}
                  <i aria-hidden="true"> · </i>
                  {mur.ville} · {mur.distance}
                </em>
              </div>
              <span className="mu-piece-x">{essaiVu.piece.prix}</span>
            </div>
          )}
          <h2 className="mu-haut-n">
            <b>
              {vus.length} {mur.essai?.mots.essayage ?? "essayage"}
              {vus.length > 1 ? "s" : ""}
            </b>{" "}
            {surPiece ? "de cette pièce" : chezQui(mur.lieu)}
          </h2>
          <p>
            {surPiece
              ? "La même pièce, sur d’autres personnes. C’est ce qui dit comment elle tombe."
              : "Toutes les pièces essayées ici, sur de vraies personnes."}
          </p>

          {/* ELLE NE S'AFFICHE PLUS SOUS UN SEUL ESSAYAGE. Quatre fantômes
              empilés au-dessus de « De vraies clientes » alors qu'il y en a une
              certifient un nombre qui n'existe pas — et cette ligne-là est
              précisément celle qui promet de ne rien fabriquer. */}
          {vus.length > 1 && (
          <p className="mu-haut-vrai">
            <span aria-hidden="true">
              {vus.slice(0, 4).map((f) => (
                <Signe key={f.id} classe="mu-haut-vs" />
              ))}
            </span>
            {/* ELLE TIENT SUR UNE LIGNE, ET LA MAQUETTE L'ECRIT AINSI. Coupee
                en deux par une balise, elle donnait quarante-quatre points de
                hauteur a une pastille de garantie — posee juste au-dessus du
                mur, c'est-a-dire exactement la ou chaque point repousse ce
                qu'on est venu voir. */}
            <em>De vraies clientes, de vrais avis</em>
          </p>
          )}

          {/* ═══ LES DEUX CADRAGES, NOMMÉS ══════════════════════════════════

              « Il faudrait repenser l'expérience pour qu'il comprenne où il est
              déjà, et qu'il puisse revenir au catalogue des articles. »

              DEUX PASTILLES PLUTÔT QUE QUATRE FILTRES. La maquette en dessine
              quatre — morphologies, styles, lieux — et ils supposent des données
              qu'aucune cliente n'a saisies : les remplir de listes vides serait
              promettre un tri qui ne trie rien. Les deux qui existent vraiment
              répondent à la question posée : est-ce que je regarde CETTE pièce,
              ou tout le magasin ?

              LE CATALOGUE N'EST PAS UN TROISIÈME CADRAGE, DONC IL N'EST PAS
              ICI. Il ne restreint rien, il fait SORTIR du mur : sa place est en
              bas, à côté du geste qui ramène à l'essai. Serré entre les deux
              pastilles et le bord, il sortait de l'écran — mesuré à 414
              points — et on ne voyait qu'un demi-cintre. */}
          <div className="mu-cadre" role="tablist" aria-label="Ce que montre ce mur">
            {essaiVu && (
              <button
                type="button"
                role="tab"
                aria-selected={surPiece}
                className={surPiece ? "on" : undefined}
                onClick={() => setCadre("piece")}
              >
                Cette pièce <s>{memePiece.length}</s>
              </button>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={!surPiece}
              className={!surPiece ? "on" : undefined}
              onClick={() => setCadre("tout")}
            >
              Tout le magasin <s>{clients.length}</s>
            </button>
          </div>

          {/* « SUR VOUS » A QUITTÉ CETTE PLACE, et c'est la correction qui
              tient toute la page : il est devenu la PREMIÈRE TUILE du mur.
              Voir la grille plus bas. */}
        </div>
      ) : (
        /* ═══ LA TÊTE TENAIT CINQ BLOCS EMPILÉS ═══════════════════════════════

           « Pour les bars, restaurants et événements, quand on clique sur le
           fantôme c'est encore très confus. »

           IL FALLAIT DESCENDRE À TRAVERS CINQ CHOSES AVANT LA PREMIÈRE CARTE :
           le fantôme dessiné en grand et centré, le titre, une phrase, un cadre
           violet, puis le bouton. Chacune se défendait ; ensemble elles
           repoussaient le mur sous la ligne de flottaison, c'est-à-dire qu'elles
           cachaient ce qu'on était venu voir.

           LE FANTÔME ET LE TITRE PARTAGENT MAINTENANT UNE LIGNE, et le geste est
           une pastille à leur droite. Trois blocs deviennent un, et la première
           carte remonte de deux cents points. */
        <div className="mu-haut">
          {/* ═══ L'INVITATION DEVIENT UNE CARTE, D'APRÈS LA MAQUETTE ═════════

              « Restaurant, bars et événements : respecter le design là aussi.
              Le fantôme amène sur le mur du restaurant avec la possibilité de
              mettre son propre fantôme. »

              LE GESTE ÉTAIT UNE PASTILLE EN CONTOUR, coincée au bout d'une
              ligne avec le fantôme et le titre. Il tenait peu de place — c'est
              ce qu'on lui demandait à l'époque — mais il est LE geste de ce
              mur-là : chez un bar, on ne vient pas essayer quelque chose, on
              vient dire qu'on est là. La maquette lui donne son cadre, son
              dégradé et deux lignes, et elle a raison : une invitation qui a
              l'air d'un lien secondaire ne se prend pas.

              LE TITRE CHANGE AUSSI, ET C'EST LE MÊME ARBITRAGE. « Ce que les
              gens ont laissé ici » décrit le contenu ; « Faites savoir que vous
              êtes ici » demande quelque chose. Le premier est une légende, le
              second est une porte — et l'écran a besoin d'une porte avant
              d'avoir une légende. */}
          <div className="mu-inv">
            <Signe classe="mu-inv-f" />
            <div className="mu-inv-t">
              <h2>
                Faites savoir que <i>vous êtes ici</i>
              </h2>
              <p>
                Laissez un message, dites ce que vous cherchez ou simplement que vous êtes là.
              </p>
              <p>Les personnes présentes ou qui passent ici pourront vous répondre.</p>
            </div>
            <button type="button" className="mu-inv-b" onClick={onDeposer}>
              <Signe classe="mu-inv-bf" />
              <span>
                <b>JE SUIS ICI</b>
                <em>Laisser mon Fantôme</em>
              </span>
            </button>
          </div>
          {/* ET LA LÉGENDE REVIENT APRÈS, À SA VRAIE PLACE : au-dessus des
              cartes qu'elle décrit, et non à celle de la porte. */}
          {/* ═══ TROIS LIGNES DE MOINS, ET C'EST LUI QUI LES A COUPÉES ═══════

              « Supprimer ce paragraphe : Les Fantômes laissés ici aujourd'hui.
              🕐 Aujourd'hui. Quelque chose vous parle ? Signalez-le, et vous
              pourrez en parler sur place quand vous y serez. »

              LES TROIS DISAIENT LA MÊME CHOSE QUE LE TITRE OU QUE LES CARTES.
              « Les Fantômes laissés ici aujourd'hui » répète « Qui est là » au
              mot près ; la pastille du jour répète « aujourd'hui », déjà écrit
              deux fois au-dessus ; et la légende du pouce explique un geste
              qu'on n'a pas encore vu, à l'endroit exact où la première carte
              devrait commencer.

              CE QUI RESTE EST LE TITRE, ET IL SUFFIT. La légende du pouce, elle,
              n'a pas disparu du produit : chaque carte porte « On pourra en
              parler sur place » SOUS son propre bouton, c'est-à-dire au moment
              où la question se pose vraiment. */}
          <div className="mu-qui">
            <h3>Qui est là. Ce qu’ils ont à dire.</h3>
          </div>
          {/* ═══ LA LEGENDE DU POUCE PERD SON CADRE ═══════════════════════

              « Ça m'intéresse ressemble énormément à un like. Or ce n'est
              absolument pas ça : l'utilisateur dit qu'il s'y intéresse assez
              pour qu'ON EN PARLE SUR PLACE quand il y sera. »

              LA PHRASE RESTE, LE CADRE PART. La maquette n'a pas d'encadré à
              cet endroit, et il n'en avait pas besoin : posé entre le titre de
              section et la première carte, un bloc violet de deux lignes
              repoussait les cartes sous le pli pour expliquer un geste qu'on
              n'avait pas encore vu. En légende sous le titre, elle arrive au
              bon moment et ne coûte rien. */}

        </div>
      )}

      {/* ─── UN SEUL FLUX, SANS TITRE DE SECTION ───
          LES FANTÔMES DE LA MAISON RESTENT EN TÊTE : un mur ne démarre jamais
          vide, personne ne veut parler le premier dans une pièce silencieuse.
          Mais ils n'ont plus besoin d'un titre pour ça — leur pastille dit déjà
          « Chef », « Propriétaire », et cette pastille-là n'est pas du
          vocabulaire : c'est la garantie qu'un fantôme du patron ne passe jamais
          pour celui d'un client. */}
      {/* ═══ LA MAISON PASSE APRÈS LES CLIENTS SUR UN MUR D'ESSAI ═══════════

          ELLE PASSAIT DEVANT, ET C'ÉTAIT JUSTE : « un mur ne démarre jamais
          vide, personne ne veut parler le premier dans une pièce silencieuse ».
          Sur un mur d'essai, cette raison est tombée — il démarre avec sept
          clientes en grille, et ce sont ELLES qu'on vient voir. Deux cartes du
          commerçant en pleine largeur les repoussaient de trois cents points
          sous le pli, c'est-à-dire hors de l'écran.

          ELLE NE DISPARAÎT PAS POUR AUTANT : « les retouches sont offertes
          jusqu'à samedi » est exactement ce qu'on veut lire après avoir vu que
          ça tombe bien sur sept personnes. */}
      {mur.depot !== "essai" && (
        <div className={`mu-rang maison${tout ? " tout" : ""}`}>
          {mur.maison.map((f) => (
            <Carte
              key={f.id}
              f={f}
              grande
              quand={dits[f.id]}
              onDit={onDit}
              onParler={onParler}
              depot={mur.depot}
            />
          ))}
        </div>
      )}

      {/* ═══ LES ESSAIS EN GRILLE, ET LE RESTE EN LISTE ══════════════════════

          LA MAQUETTE MET TROIS COLONNES, et c'est le bon format pour ce mur-là :
          on vient y chercher UNE IMPRESSION D'ENSEMBLE — « ça donne quoi sur des
          gens ? » — avant de lire qui que ce soit. Une liste d'une carte par
          ligne oblige à faire défiler neuf fois pour se faire cette idée, et
          personne ne défile neuf fois pour une impression.

          DEUX COLONNES ET NON TROIS À 390 POINTS. Trois donnent 108 points par
          vignette : à cette taille on ne voit plus ce qu'on essaie, ce qui est
          le seul travail de cette grille. Trois reviennent dès 560 points.

          ET SEULEMENT SUR LES MURS D'ESSAI. Sur le mur d'un bar ou d'un
          restaurant, ce qui compte est ce que les gens ONT ÉCRIT — « qui vient
          ce soir ? » — et ça ne se lit pas dans une vignette carrée. */}
      {/* ═══ PERSONNE D'AUTRE NE L'A ENCORE ESSAYÉE, ET ON LE DIT ═══════════

          UNE GRILLE VIDE APPREND QUE LE MUR EST MORT, ce qui est faux : il est
          plein, simplement pas de cette pièce-là. La phrase le dit, et le geste
          juste est à côté — aller voir le reste du magasin. C'est la même règle
          que partout ici : on dit ce qu'on n'a pas plutôt que de le maquiller. */}
      {mur.depot === "essai" && surPiece && vus.length === 0 && (
        <p className="mu-seule">
          <Signe classe="mu-seule-f" />
          <span>
            {/* LA PHRASE NE PORTE AUCUN GENRE, ET C'EST EXPRÈS. « La première »
                est juste dans une boutique de femme et faux dans le rayon
                homme ; « la première personne » l'est partout, parce que
                « personne » reste féminin quel que soit celui qu'il désigne.
                Même règle que le plat du jour et que la suggestion du matin. */}
            <b>Vous êtes la première personne à l’essayer.</b>
            Votre essayage ouvrira le mur de cette pièce — et dira aux suivants
            comment elle tombe.
          </span>
          <button type="button" onClick={() => setCadre("tout")}>
            Voir tout le magasin →
          </button>
        </p>
      )}

      {/* ═══ UNE SEULE GALERIE, ET VOTRE ESSAI EN OUVRE LE BAL ══════════════

          « Le design de cette page est horrible, et visuellement on ne sait pas
          où regarder. Il faut refaire cette page pour donner davantage de
          structure et de lisibilité visuelle. »

          LA CAUSE ÉTAIT UN EMPILEMENT DE BLOCS DE MÊME POIDS. Le bandeau de la
          pièce, le titre, les deux pastilles, une large carte « Sur vous » en
          travers de l'écran, PUIS la grille, puis le panneau du commerçant :
          six choses qui se présentent toutes comme la principale. L'œil n'a
          nulle part où se poser parce qu'on ne lui a jamais dit où est le mur.

          « SUR VOUS » DESCEND DANS LA GRILLE, EN PREMIÈRE TUILE. Il garde tout
          ce qu'il avait — il nomme la pièce, il montre la note, il ramène à
          l'essai — et il cesse d'être une barre horizontale qui coupe la page
          en deux. Il y gagne même : posé à côté des autres, au même format, il
          fait ce que ce mur promet — VOUS, PUIS LES AUTRES, dans la même
          rangée, ce qui est la seule façon de comparer.

          ET IL RÉPARE LA TUILE ORPHELINE. Une seule cliente dans une grille à
          deux colonnes laissait une demi-page vide à droite : c'est ce qu'on
          voyait sur la capture. Avec votre essai devant, deux tuiles
          remplissent la rangée. Quand il n'y a personne d'autre, il prend la
          largeur entière plutôt que de rester seul dans sa colonne. */}
      <div
        className={`mu-rang${mur.depot === "essai" ? " grille" : ""}${tout ? " tout" : ""}`}
      >
        {mur.depot === "essai" && essaiVu && onRevoir && (
          <button
            type="button"
            className={`mu-moi${vus.length === 0 ? " seul" : ""}`}
            onClick={onRevoir}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={essaiVu.image} alt="" />
            <b className="mu-moi-e">
              <Signe classe="mu-moi-ef" /> Vous
            </b>
            <span className="mu-moi-t">
              <b>
                Sur vous
                {essaiVu.note > 0 && (
                  <span className="mu-moi-n" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, k) => (
                      <Signe key={k} classe={k < essaiVu.note ? "mu-c-ns on" : "mu-c-ns"} />
                    ))}
                  </span>
                )}
              </b>
              <em>{essaiVu.piece.nom}</em>
            </span>
            <s aria-hidden="true">Revoir →</s>
          </button>
        )}
        {vus.map((f) => (
          <Carte
            key={f.id}
            f={f}
            quand={dits[f.id]}
            onDit={onDit}
            onParler={onParler}
            depot={mur.depot}
          />
        ))}
      </div>

      {/* ═══ LE MOT DE LA BOUTIQUE ═══════════════════════════════════════════

          « Les conseils de "la vendeuse" et de "la boutique" : l'UX est très
          mauvaise, on a du mal à comprendre que ce sont des conseils du
          commerçant, et la cassure entre les annonces verticales et ces deux
          conseils horizontaux est très maladroite. »

          LA CAUSE ÉTAIT D'AVOIR RÉUTILISÉ LA CARTE DU CLIENT. Ces deux messages
          passaient par le même composant que les essayages — même vignette,
          même prénom, même heure, même bouton — avec pour seule différence une
          pastille « Staff » de neuf points sur la photo. Posés en pleine largeur
          sous une grille de vignettes carrées, ils cassaient le rythme sans rien
          gagner : on lisait deux cartes ratées plutôt qu'un message du magasin.

          CE N'EST PAS LE MÊME OBJET, DONC CE N'EST PLUS LA MÊME FORME. Un
          essayage est une PREUVE — une photo, une note, un avis — et sa forme
          est la vignette. Un mot du commerçant est une PAROLE : il a un
          émetteur, un rôle et une phrase, et sa forme est la bulle. Le panneau
          se nomme, il porte le nom du magasin, et chaque message y est signé.

          IL PASSE APRÈS LA GRILLE, ET C'EST INCHANGÉ : on vient voir les
          clientes, pas la boutique. « Les retouches sont offertes jusqu'à
          samedi » est exactement ce qu'on veut lire APRÈS avoir vu que ça tombe
          bien sur sept personnes. */}
      {mur.depot === "essai" && mur.maison.length > 0 && (
        <section className="mu-mot-b">
          <h3>
            <span className="mu-mot-b-e" aria-hidden="true">
              <Trace cle="boutique" />
            </span>
            <span>
              Le mot de la boutique
              <em>{mur.lieu}</em>
            </span>
          </h3>
          <ul>
            {mur.maison.map((f) => (
              <li key={f.id}>
                <div className="mu-mot-b-q">
                  <b>{f.qui}</b>
                  {f.role && <s>{f.role}</s>}
                  <i>{f.heure}</i>
                </div>
                <p>{f.mot}</p>
                {/* LE GESTE RESTE, MAIS IL DIT CE QU'IL FAIT. « Ça
                    m'intéresse » sous un message de commerçant se lisait comme
                    un « j'aime » ; ici il prévient la boutique qu'on passera. */}
                <button
                  type="button"
                  className={dits[f.id] ? "on" : undefined}
                  onClick={() => onDit(f)}
                >
                  {dits[f.id] ? `✓ Prévenus · ${dits[f.id]}` : "Je passerai les voir"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ═══ TROIS BLOCS DE PIED SUPPRIMÉS ═══════════════════════════════════

          « Supprimer cette section aussi : 6 Fantômes laissés ici aujourd'hui /
          Et ce n'est sûrement pas fini… ↑ / De la place, sans attendre / Plat +
          dessert / On vous installe · 16 € / Voir la carte → / 👥 Découvre aussi
          les autres murs des commerces et événements autour de toi. »

          LES TROIS RÉPÉTAIENT OU DÉTOURNAIENT :

            · LE COMPTE DU PIED redisait ce que le mur montre — les cartes sont
              là, on les voit, on n'a pas besoin qu'on nous dise combien.
            · LA CARTE DU COMMERCE ramenait l'annonce DANS le mur, c'est-à-dire
              l'écran qu'on venait justement de quitter pour voir les gens. Elle
              est à un balayage derrière ; la reposer ici fait revenir en
              arrière au moment où l'on avance.
            · « DÉCOUVRE AUSSI LES AUTRES MURS » envoyait ailleurs depuis le
              seul endroit où l'on est arrivé exprès.

          CE QUI DÉPLIAIT LE MUR ÉTAIT DANS LE COMPTE, et c'est la seule chose
          qu'il faut remplacer : voir `mu-tout` juste dessous. */}
      {vus.length + mur.maison.length > 3 && (
        <button
          type="button"
          className="mu-tout"
          aria-expanded={tout}
          onClick={() => onTout(!tout)}
        >
          {tout ? "Réduire" : "Voir tout le mur"}
          <i aria-hidden="true">{tout ? "↑" : "↓"}</i>
        </button>
      )}

      {/* ═══ ET DEPUIS CE MUR, ON DOIT POUVOIR ESSAYER ══════════════════════

          « Le fantôme amène sur l'essayage quand personne n'a encore essayé,
          mais quand une ou plusieurs personnes ont essayé, alors le fantôme
          amène sur le mur des clients. »

          LA RÈGLE EST BONNE ET ELLE A OUVERT UN TROU. Depuis qu'un mur rempli
          s'ouvre sur lui-même, il n'y avait PLUS AUCUN CHEMIN vers l'essai : on
          regardait sept clientes porter la pièce, et la seule chose qu'on ne
          pouvait pas faire était de la porter aussi. Le geste que ce mur donne
          envie de faire était le seul absent de l'écran.

          LA MAQUETTE LE MET EN BAS, FLOTTANT, ET C'EST LE BON ENDROIT. Posé
          sous la tête, il repoussait la grille de cent points : on payait le
          geste AVANT d'avoir vu ce qui donne envie de le faire. Collé au bas de
          l'écran, il ne coûte rien à la lecture et reste sous le pouce à la
          neuvième vignette — c'est-à-dire au moment exact où l'envie arrive.

          IL PORTE LES MOTS DU MÉTIER — « Essayer sur moi » chez un coiffeur,
          « Voir chez moi » chez une fleuriste — et c'est le même bouton que sur
          l'annonce : le rituel ne change pas de forme selon la porte par
          laquelle on entre. */}
      {/* ═══ ET IL NE PROPOSE PLUS DE REFAIRE CE QU'ON VIENT DE FAIRE ═══════

          « À la fin de cette page on voit "Essayer sur moi — me photographier en
          buste" alors que je viens tout juste d'essayer ce produit. Ce CTA n'est
          pas bon : ça devrait me ramener à mon essai. »

          IL DISAIT LA MÊME CHOSE DANS LES DEUX SITUATIONS, qui sont pourtant
          opposées. À quelqu'un qui n'a rien essayé, « Me photographier en
          buste » est le geste juste : c'est la porte. À quelqu'un qui sort d'un
          rendu, c'est une porte qui donne sur la pièce qu'il vient de quitter —
          et comme l'essai était démonté en chemin, c'était même la seule issue :
          tout recommencer. */}
      {/* LE CATALOGUE EST UNE SORTIE, DONC IL EST EN BAS. Il ne cadre pas le
          mur, il en fait sortir : sa place est à côté du geste qui ramène à
          l'essai, là où l'on cherche à aller ailleurs. */}
      {mur.depot === "essai" && onCatalogue && (
        <button type="button" className="mu-cat" onClick={onCatalogue}>
          <Trace cle="cintre" />
          Voir tout le catalogue
          <s aria-hidden="true">→</s>
        </button>
      )}

      {mur.depot === "essai" && (
        <div className="mu-bas">
          {essaiVu && onRevoir ? (
            <button type="button" className="mu-cta plein essai" onClick={onRevoir}>
              <Signe classe="mu-cta-f" />
              <span>
                <b>Revoir mon essayage</b>
                <em>{essaiVu.piece.nom}</em>
              </span>
              <s aria-hidden="true">→</s>
            </button>
          ) : (
            <button type="button" className="mu-cta plein essai" onClick={onDeposer}>
              <Signe classe="mu-cta-f" />
              <span>
                <b>{mur.essai?.mots.surMoi ?? "Essayer sur moi"}</b>
                <em>{mur.essai?.mots.geste}</em>
              </span>
              <s aria-hidden="true">→</s>
            </button>
          )}
        </div>
      )}

    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ÉCRAN 2 — LE DÉPÔT
   ════════════════════════════════════════════════════════════════════════ */

function EcranDepot({
  mur,
  clients,
  restants,
  dits,
  onDit,
  onFerme,
  onPose,
  onSalon,
  onFavori,
  favori,
  surprendre,
  piecePrechoisie,
  rayonPrechoisi,
  ouvrirSurGrille,
  onEssai,
  catalogue,
}: {
  mur: TypeMur;
  clients: Fantome[];
  restants: number;
  /** Les deux intentions d'entrée ne font que traverser. Voir `MurContenu`. */
  surprendre?: boolean;
  piecePrechoisie?: string;
  /** La famille demandée depuis la vitrine. Voir `MurContenu`. */
  rayonPrechoisi?: string;
  /** On entre par « Explorer la collection ». Voir `MurContenu`. */
  ouvrirSurGrille?: boolean;
  /** L'essai dit ce qu'il montre, pour que le mur sache de quoi parler. */
  onEssai?: (e: EssaiVu | null) => void;
  /** Il change quand on demande le catalogue depuis le mur. Voir `MurContenu`. */
  catalogue?: number;
  dits: Record<string, string>;
  onDit: (f: Fantome) => void;
  onFerme: () => void;
  onPose: (f: Fantome) => void;
  onSalon?: (o: VersLeSalon) => void;
  /** Voir `Essai` : le favori de la CARTE, pas un second système. */
  onFavori?: () => void;
  favori?: boolean;
}) {
  /**
   * ═══ L'ESSAI EST SEUL À L'ÉCRAN ═══════════════════════════════════════════
   *
   * « Ce qu'on veut c'est juste essayer sur soi, donc il faut vraiment mettre le
   * focus sur l'essayage et avoir une expérience parfaite, focus juste sur ça dès
   * le départ. »
   *
   * TOUT CE QUI SUIT A ÉTÉ RETIRÉ DE CET ÉCRAN-LÀ, et chaque ligne était un
   * regard volé à la seule chose qu'on demande : le grand fantôme dessiné et sa
   * phrase manuscrite, le titre « Laisse ton Fantôme chez… », la rangée de cinq
   * cartes du mur, et l'invitation à aller voir les autres commerces. Il reste
   * l'essai, et UN lien vers le mur — voir `mots.mur`.
   *
   * L'ANNONCE GARDE TOUT : là, le mur EST le produit, et le fantôme qu'on pose
   * n'a de sens qu'à côté de ceux des autres.
   */
  if (mur.depot === "essai") {
    return (
      <Essai
        mur={mur}
        restants={restants}
        onPose={onPose}
        onMur={onFerme}
        onSalon={onSalon}
        onFavori={onFavori}
        favori={favori}
        surprendre={surprendre}
        piecePrechoisie={piecePrechoisie}
        rayonPrechoisi={rayonPrechoisi}
        ouvrirSurGrille={ouvrirSurGrille}
        onEssai={onEssai}
        catalogue={catalogue}
      />
    );
  }

  return (
    <>
      <button type="button" className="mu-x" aria-label="Revenir au mur" onClick={onFerme}>
        ✕
      </button>

      {/* LE FANTOME ETAIT COUPE EN DEUX : la feuille commence a vingt-deux points
          du bord et le dessin, avec son ombre portee, en demande davantage. On
          lui donne sa place plutot que de le rapetisser — c'est la premiere
          chose qu'on voit en ouvrant cet ecran. */}
      <div className="mu-tete centre depot">
        <Signe classe="mu-gros" />
        <p className="mu-manus">
          Ton Fantôme laisse
          <br />
          une trace ici&nbsp;!<i aria-hidden="true">↙</i>
        </p>
      </div>

      <h2 className="mu-d-t">
        Laisse ton <b>Fantôme</b>
        <br />
        {chezQui(mur.lieu)}
      </h2>

      <Annonce mur={mur} restants={restants} onPose={onPose} />

      <div className="mu-sect">
        <Signe classe="mu-sect-s" />
        <h2>Le mur du jour</h2>
        <b className="mu-sect-j">{mur.lieu}</b>
        <span className="mu-sect-v">Voir tout →</span>
      </div>

      <div className="mu-rang">
        {[...mur.maison.slice(0, 1), ...clients].slice(0, 5).map((f) => (
          <Carte key={f.id} f={f} quand={dits[f.id]} onDit={onDit} />
        ))}
      </div>

      <p className="mu-ailleurs">
        <i aria-hidden="true">👥</i>
        Découvre aussi les autres murs des commerces et événements autour de toi.
        <b aria-hidden="true">→</b>
      </p>
    </>
  );
}

/** LE DÉPÔT PAR ANNONCE — un verbe, une phrase, une photo facultative. */
function Annonce({
  mur,
  restants,
  onPose,
}: {
  mur: TypeMur;
  restants: number;
  onPose: (f: Fantome) => void;
}) {
  const [verbe, setVerbe] = useState(mur.verbes[0] ?? "cherche");
  const [humeur, setHumeur] = useState(mur.humeurs[0] ?? "");
  const [texte, setTexte] = useState("");
  /**
   * LA PHOTO DE L'ANNONCE, ET ELLE N'EXISTAIT PAS.
   *
   * « Ajouter une photo » était un bouton SANS gestionnaire : il ne faisait
   * rien, et le fantôme déposé partait avec `mur.photoLieu` — la photo du
   * commerce. On publiait donc la vitrine du bar à la place de ce que la
   * personne voulait montrer, sans que rien ne le dise.
   *
   * C'est le même défaut que celui trouvé sur l'essai, au même endroit du
   * parcours, et il vaut la peine de le nommer : DANS UNE MAQUETTE, UN BOUTON
   * QUI NE FAIT RIEN NE SE VOIT PAS. Tout le reste répond, on suppose qu'il
   * répond aussi.
   */
  const [photo, setPhoto] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const verbes = VERBES.filter((v) => mur.verbes.includes(v.cle));
  const humeurs = HUMEURS.filter((h) => mur.humeurs.includes(h.cle));
  const pret = texte.trim().length > 3 && restants > 0;

  return (
    <>
      <p className="mu-d-i">
        Partage une annonce, une envie, une opportunité ou un petit besoin.
        <br />
        Ta trace sera visible ici et liée à ce lieu pendant {HEURES_PAR_DEFAUT} heures.
      </p>

      <div className="mu-verbes">
        {verbes.map((v) => (
          <button
            key={v.cle}
            type="button"
            className={v.cle === verbe ? "on" : ""}
            onClick={() => setVerbe(v.cle)}
          >
            <i aria-hidden="true">{v.emoji}</i>
            {v.mot}
          </button>
        ))}
      </div>

      {/* L'EXEMPLE SUIT LE VERBE, et c'est ce qui rend l'appui visible : une
          bordure qui change ne se remarque pas, une phrase qui change si. Elle
          apprend en meme temps quoi ecrire — voir `Verbe.exemple`. */}
      <div className="mu-champ">
        <textarea
          maxLength={150}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={`Ex. : ${verbeDe(verbe)?.exemple ?? ""}`}
        />
        <span className="mu-compte">{texte.length}/150</span>
        <input
          ref={fichier}
          type="file"
          accept="image/*"
          className="mu-fichier"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const lecteur = new FileReader();
            lecteur.onload = () => setPhoto(String(lecteur.result));
            lecteur.readAsDataURL(f);
            e.target.value = "";
          }}
        />
        <button type="button" className="mu-photo" onClick={() => fichier.current?.click()}>
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="mu-photo-v" />
              Changer la photo
            </>
          ) : (
            <>
              <i aria-hidden="true">🖼️</i>
              Ajouter une photo (optionnel)
            </>
          )}
        </button>
        {photo && (
          <button type="button" className="mu-photo-x" onClick={() => setPhoto(null)}>
            Retirer
          </button>
        )}
      </div>

      {/* L'HUMEUR EST FACULTATIVE ET ELLE EST APRES LE TEXTE : ce qu'on a a dire
          passe avant ce qu'on vient chercher. Elle n'est proposee que la ou le
          lieu en offre — un artisan n'en a pas. */}
      {humeurs.length > 0 && (
        <div className="mu-humeurs">
          <span>Et aujourd’hui, vous venez…</span>
          <div>
            {humeurs.map((h) => (
              <button
                key={h.cle}
                type="button"
                className={`${h.teinte}${h.cle === humeur ? " on" : ""}`}
                onClick={() => setHumeur(h.cle === humeur ? "" : h.cle)}
              >
                <i aria-hidden="true">{h.emoji}</i>
                {h.mot}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="mu-cta plein"
        disabled={!pret}
        onClick={() =>
          onPose({
            id: `pose-${Date.now()}`,
            qui: "Vous",
            // SA PHOTO D'ABORD. `mur.photoLieu` ne reste qu'un defaut quand la
            // personne n'en a pas mis — pas un remplacant silencieux.
            photo: photo ?? mur.photoLieu,
            verbe,
            humeur: humeur || undefined,
            mot: texte.trim(),
            heure: new Date().toTimeString().slice(0, 5),
            interesses: 0,
            jusqua: `encore ${HEURES_PAR_DEFAUT} h`,
          })
        }
      >
        <Signe classe="mu-cta-s" />
        <span>
          <b>Laisser mon Fantôme</b>
          {restants > 0 ? (
            <em>
              Il vous en reste {restants} aujourd’hui
            </em>
          ) : (
            <em>Vous n’en avez plus aujourd’hui</em>
          )}
        </span>
        <i aria-hidden="true">→</i>
      </button>
    </>
  );
}

/**
 * LE DÉPÔT PAR ESSAI.
 *
 * QUATRE ÉTAPES, ET LA PREMIÈRE EST LA MÉCANIQUE ENTIÈRE : le client
 * photographie CE QUI VA RECEVOIR LA CHOSE — son poignet, sa main, sa table de
 * salon — et la photo du commerçant vient s'y poser. C'est ce qui rend l'essai
 * possible sans visage : on ne photographie pas la personne.
 *
 * L'IMAGE FINALE EST SIMULÉE ICI, ET C'EST LE SEUL MORCEAU QUI L'EST. Poser un
 * bracelet sur un poignet demande un modèle d'image, une facture par essai et
 * quelques secondes d'attente. Le parcours, lui, est complet : cadrer, choisir,
 * attendre, décider — et le fantôme se pose sur le mur DANS LES DEUX CAS, pris
 * ou pas. « Cette pièce a été essayée par quatorze personnes, deux l'ont
 * prise » est un chiffre qu'aucun commerçant n'a jamais eu.
 */
/**
 * LE VISEUR, ET LE GABARIT DESSINÉ DEDANS.
 *
 * SANS CE DESSIN, LE GABARIT N'EXISTE QUE DANS LE CODE. On demanderait au
 * client de « poser son poignet à plat » et on espérerait qu'il tombe là où le
 * calcul l'attend — c'est-à-dire qu'on ferait reposer la gratuité de l'essai sur
 * un vœu. Deux traits, et la contrainte devient évidente : on met son poignet
 * ENTRE les traits, et à partir de là on sait tout ce qu'il faut savoir.
 *
 * ═══ POURQUOI UN SVG ET PAS DES DIV ═══════════════════════════════════════
 *
 * PARCE QUE LA PHOTO EST RECADRÉE. Le viseur est un rectangle fixe et la photo
 * n'a pas son rapport : `object-fit: cover` en rogne les bords. Des repères
 * posés en pourcentages du VISEUR se décaleraient donc de la photo — et un
 * gabarit décalé est pire qu'un gabarit absent.
 *
 * `preserveAspectRatio="xMidYMid slice"` EST L'ÉQUIVALENT EXACT DE `cover`. En
 * donnant au SVG le viewBox de la photo — d'où la lecture de sa taille réelle au
 * chargement — les deux subissent le même rognage, au pixel près.
 */
function Viseur({ photo, gabarit }: { photo?: string; gabarit?: Gabarit }) {
  const [dim, setDim] = useState<{ l: number; h: number } | null>(null);
  const guide = () => {
    if (!dim || !gabarit) return null;
    const { l, h } = dim;
    if (gabarit.forme === "cylindre") {
      const [[axn, ayn], [bxn, byn]] = gabarit.axe;
      const ax = axn * l;
      const ay = ayn * h;
      const bx = bxn * l;
      const by = byn * h;
      const a = Math.atan2(by - ay, bx - ax);
      const d = (gabarit.diametre * l) / 2;
      const nx = -Math.sin(a) * d;
      const ny = Math.cos(a) * d;
      return (
        <>
          {/* PAS DE REMPLISSAGE ENTRE LES DEUX TRAITS. Il a été essayé : sur un
              viseur court et une photo verticale, le rognage fait que la bande
              occupe tout le cadre, et le voile se lit comme un filtre posé sur
              la photo plutôt que comme un repère. Deux traits suffisent à dire
              « entre les deux ». */}
          <line
            x1={ax}
            y1={ay}
            x2={bx}
            y2={by}
            stroke="rgba(139,214,255,.45)"
            strokeWidth={Math.max(1.5, l / 300)}
            strokeDasharray={`${l / 80} ${l / 55}`}
          />
          {[1, -1].map((s) => (
            <line
              key={s}
              x1={ax + nx * s}
              y1={ay + ny * s}
              x2={bx + nx * s}
              y2={by + ny * s}
              stroke="rgba(139,214,255,.92)"
              strokeWidth={Math.max(2, l / 190)}
              strokeLinecap="round"
            />
          ))}
        </>
      );
    }
    if (gabarit.forme === "main" || gabarit.forme === "cadre") {
      /**
       * LE REPÈRE D'UNE MAIN N'EST PAS UN EMPLACEMENT, C'EST UNE MARGE.
       *
       * Mesuré, et c'est ce qui décide de tout : une main qui TOUCHE les bords du
       * cadre n'est pas reconnue — zéro détection, à tous les réglages. La même
       * photo avec un quart de marge autour est reconnue en quatre-vingt-dix
       * millisecondes. Le cadre dessiné ici est donc l'unique consigne qui
       * compte, et elle ne se devine pas : « toute la main, et de l'air autour ».
       */
      const mx = l * 0.14;
      const my = h * 0.14;
      return (
        <rect
          x={mx}
          y={my}
          width={l - 2 * mx}
          height={h - 2 * my}
          rx={Math.min(l, h) * 0.07}
          fill="none"
          stroke="rgba(139,214,255,.92)"
          strokeWidth={Math.max(2, l / 190)}
          strokeDasharray={`${l / 24} ${l / 40}`}
        />
      );
    }
    const px = gabarit.pied[0] * l;
    const py = gabarit.pied[1] * h;
    const rx = l * 0.15;
    return (
      <>
        <line
          x1={px}
          y1={py}
          x2={px}
          y2={py - gabarit.hauteur * h}
          stroke="rgba(139,214,255,.6)"
          strokeWidth={Math.max(2, l / 240)}
          strokeDasharray={`${l / 90} ${l / 70}`}
        />
        <ellipse
          cx={px}
          cy={py}
          rx={rx}
          ry={rx * 0.3}
          fill="rgba(139,214,255,.12)"
          stroke="rgba(139,214,255,.92)"
          strokeWidth={Math.max(2, l / 190)}
        />
      </>
    );
  };
  /**
   * LE CADRE D'UNE MAIN SE MONTRE EN ENTIER, ET C'EST LE SEUL QUI L'EXIGE.
   *
   * Le viseur rogne la photo pour remplir son rectangle, ce qui va très bien à un
   * repère posé AU MILIEU de l'image — un poignet, une table. Mais le repère
   * d'une main EST sa marge : rogné, il ne restait que ses deux côtés, et la
   * seule consigne qui compte devenait invisible.
   */
  const entier = gabarit?.forme === "main" || gabarit?.forme === "cadre";
  return (
    <div className={entier ? "mu-viseur entier" : "mu-viseur"}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          onLoad={(e) =>
            setDim({ l: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
        />
      )}
      {dim && gabarit && (
        <svg
          className="mu-viseur-g"
          viewBox={`0 0 ${dim.l} ${dim.h}`}
          preserveAspectRatio={entier ? "xMidYMid meet" : "xMidYMid slice"}
          aria-hidden="true"
        >
          {guide()}
        </svg>
      )}
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </div>
  );
}

/**
 * CE QU'ON DIT QUAND LE CALCUL N'A PAS PU SE FAIRE.
 *
 * Assez précis pour qu'on sache que ce n'est pas la photo qui est en cause, et
 * assez court pour tenir sous l'image.
 */
const SOUCI_MOTEUR = "L’essayage n’a pas pu se charger. Votre photo est intacte — réessayez dans un instant.";

/**
 * CE QU'ON ENVOIE AU SALON PRIVÉ DEPUIS L'ESSAI.
 *
 * « Un bouton qui envoie le résultat sur un salon privé, le même que le bouton
 * de l'annonce "proposer à mes amis" : il ouvre le salon, la photo s'y place,
 * et on invite nos amis. »
 *
 * LE MUR NE SAIT PAS OUVRIR UN SALON, ET IL NE DOIT PAS L'APPRENDRE. Les salons
 * vivent dans l'écran du paquet (`apercu-habitant.tsx`), avec leur mémoire,
 * leurs propositions et leur vote. Ce composant-ci est monté à trois endroits —
 * le paquet, le mur seul, la page du commerce — et deux d'entre eux n'ont
 * aucun salon. On passe donc un rappel plutôt qu'une dépendance : là où il y a
 * un salon, le bouton se dessine ; ailleurs il n'existe pas, ce qui vaut
 * infiniment mieux qu'un bouton qui ne fait rien.
 */
export type VersLeSalon = {
  /** Le nom de la pièce essayée — c'est le sujet de la conversation. */
  quoi: string;
  prix?: string;
  /** Le rendu lui-même, en `data:`. C'est lui qu'on montre à ses amis. */
  image: string;
  /** La note qu'on s'est donnée, de 0 (pas noté) à 5. */
  note: number;
  /**
   * ═══ D'OÙ VIENT CE QU'ON EMPORTE DANS LE SALON ═══════════════════════════
   *
   * DEUX GESTES DIFFÉRENTS ARRIVENT ICI, et la phrase écrite dans le salon
   * n'est pas la même. Depuis l'essai, on montre CE QU'ON A SUR SOI : « j'ai
   * essayé la combinaison beige, je mets 4/5, vous en pensez quoi ? ». Depuis
   * le mur d'un bar, on rapporte CE QUE QUELQU'UN A DIT : « Serge dit qu'il y a
   * une dégustation à 19 h — qui vient ? ».
   *
   * SANS CE CHAMP, LE SECOND EMPRUNTAIT LA PHRASE DU PREMIER et donnait « j'ai
   * essayé "Dégustation de trois blancs des Landes à partir de 19 h" sur moi.
   * Ça me va ou pas ? » — une phrase qui ne veut rien dire, envoyée à des amis.
   */
  depuis?: "essai" | "mur";
  /** Qui l'a dit, quand ça vient du mur d'un lieu. */
  qui?: string;
};

/**
 * LE RÉCIT DE L'ATTENTE, EN CINQ TEMPS.
 *
 * « Cette étape avant le résultat devrait être LE moment magique. »
 *
 * CINQ PHRASES PLUTÔT QU'UNE, ET CHACUNE DIT UNE ÉTAPE VRAIE du travail qui
 * s'accomplit : il regarde la photo, il prend la pièce, il la pose, il ajuste,
 * il montre. Ce n'est pas du décor — c'est littéralement ce que la consigne
 * envoyée au modèle lui demande de faire, dans l'ordre.
 *
 * POURQUOI ÇA CHANGE TOUT : une phrase fixe pendant douze secondes cesse d'être
 * lue au bout de trois, et l'écran redevient une salle d'attente. Une phrase
 * qui change dit que quelque chose avance, et transforme la patience en
 * curiosité — c'est-à-dire exactement ce qu'on veut au moment où la personne
 * est sur le point de se voir autrement.
 *
 * ELLES SONT AU PRÉSENT ET SANS POINT FINAL, parce qu'elles ne sont pas des
 * annonces mais des gestes en cours.
 */
/*
 * `MOTS_NOTE` EST PARTI AVEC L'ÉCRAN QUI L'AFFICHAIT.
 *
 * Il donnait l'écho de la note une fois posée — « Ça me va bien », sur sa
 * propre ligne sous les fantômes. Il avait une raison d'être tant que les cinq
 * fantômes étaient muets : trois sur cinq ne veut rien dire tant que personne
 * n'a écrit ce que trois signifie.
 *
 * DEPUIS QUE CHAQUE FANTÔME PORTE SON MOT, l'écho répétait ce qui était écrit
 * deux centimètres plus haut. Voir `MOTS_FANTOME`, qui dit la même chose au bon
 * endroit : AVANT le choix, sous le dessin qu'on va toucher.
 */

/**
 * CE QU'ON PROPOSE D'ÉCRIRE, ET ÇA DÉPEND DE CE QU'ON A MIS.
 *
 * UN CHAMP VIDE AVEC « Votre avis… » NE FAIT ÉCRIRE PERSONNE. Une phrase déjà
 * formée dans le ton de sa note donne le LA : on la remplace par la sienne, ou
 * on la laisse et on continue. C'est un exemple, pas un texte pré-rempli — il
 * disparaît au premier caractère et ne part jamais sur le mur tout seul.
 */
/**
 * ═══ LE MOT SOUS CHAQUE FANTÔME ══════════════════════════════════════════════
 *
 * CE NE SONT PAS LES MÊMES QUE `MOTS_NOTE`, ET LA DIFFÉRENCE EST DE PLACE.
 * `MOTS_NOTE` s'affiche APRÈS le choix, seul, sous la ligne : c'est un écho —
 * « Ça, c'est moi 🔥 ». Ceux-ci s'affichent AVANT, cinq à la fois, sous cinq
 * dessins identiques : ce sont des étiquettes, et une étiquette doit tenir en
 * deux mots sur un écran de téléphone.
 *
 * LE CINQUIÈME N'EST PAS UNE NOTE, ET C'EST VOULU. « Coup de cœur » ne veut pas
 * dire « cinq sur cinq », ça veut dire autre chose : c'est ce qu'on écrira sur
 * le mur, et ce que le commerçant lira. Une échelle de satisfaction s'arrête à
 * « j'adore » ; ce produit-là va un cran plus loin, parce que le cran d'après
 * est celui où l'on se déplace.
 */
const MOTS_FANTOME: Record<number, string> = {
  1: "Bof",
  2: "Pas sûr",
  3: "Ça me va",
  4: "J’adore",
  5: "Coup de cœur",
};

const MOTS_EXEMPLE: Record<number, string> = {
  1: "Pas du tout pour moi, mais au moins je sais.",
  2: "Bof sur moi. J’essaierai autre chose.",
  3: "Pourquoi pas. J’hésite encore.",
  4: "Ça me va bien, je ne pensais pas.",
  5: "J’adore ! C’est exactement ce que je cherchais.",
};

const ETAPES = [
  "Ton fantôme regarde ta photo…",
  "Il emporte la pièce avec lui…",
  "Il la pose sur toi…",
  "Il ajuste la lumière…",
  "Tu vas te voir autrement…",
];

/**
 * LES POINTS DU MAILLAGE DE L'ATTENTE, en centièmes de la scène.
 *
 * SOURCILS, YEUX, TEMPES, NEZ, BOUCHE, MÂCHOIRE — la constellation d'un visage
 * cadré au centre, c'est-à-dire ce qu'on vient de demander à la personne de
 * faire. Ils ne viennent PAS de MediaPipe : la détection tourne au même moment
 * et on ne va pas l'attendre pour animer une attente. Ce qu'ils montrent est
 * juste — une mesure est bien en train de se faire — sans prétendre être le
 * résultat de celle-là.
 */
const MAILLE: [number, number][] = [
  // L'ovale, dans le sens du tracé : les points s'allument en tournant.
  [50, 24], [63, 29], [71, 42], [72, 56], [66, 71], [55, 79],
  [45, 79], [34, 71], [28, 56], [29, 42], [37, 29],
  // Puis les traits : yeux, nez, bouche.
  [43, 45], [57, 45], [50, 55], [50, 69],
];

function Essai({
  mur,
  restants,
  onPose,
  onMur,
  onSalon,
  onFavori,
  favori,
  surprendre,
  piecePrechoisie,
  rayonPrechoisi,
  ouvrirSurGrille,
  onEssai,
  catalogue,
}: {
  mur: TypeMur;
  restants: number;
  /** On est entré par « Surprends-moi ». Voir `MurContenu`. */
  surprendre?: boolean;
  /** La pièce désignée dans la vitrine, avant d'entrer. Voir `MurContenu`. */
  piecePrechoisie?: string;
  /** La famille demandée depuis la vitrine. Voir `MurContenu`. */
  rayonPrechoisi?: string;
  /** On entre par « Explorer la collection ». Voir `MurContenu`. */
  ouvrirSurGrille?: boolean;
  /** Ce qu'on montre, pour que le mur sache de quoi parler. Voir `EssaiVu`. */
  onEssai?: (e: EssaiVu | null) => void;
  /** Il change quand le mur demande le catalogue. Voir `MurContenu`. */
  catalogue?: number;
  onPose: (f: Fantome) => void;
  /** Le seul chemin vers le mur depuis l'essai. Voir `mots.mur`. */
  onMur: () => void;
  /** Voir `VersLeSalon` : absent là où il n'y a pas de salon. */
  onSalon?: (o: VersLeSalon) => void;
  /**
   * METTRE EN FAVORI, ET C'EST LE GESTE DE LA CARTE.
   *
   * La maquette du troisième temps le pose à côté de « Prendre rendez-vous ».
   * Il est branché sur le MÊME `garderLeSommet` que le rail de l'annonce : un
   * second système de favoris pour l'essai aurait donné deux poches, et celle
   * qu'on ne regarde pas se vide toute seule.
   *
   * IL EST FACULTATIF, comme `onSalon` : sur le mur seul et sur la page du
   * commerce il n'y a pas de carte, donc pas de favori, donc pas de bouton.
   */
  onFavori?: () => void;
  /** L'annonce est-elle déjà gardée ? Le bouton le dit plutôt que de le taire. */
  favori?: boolean;
}) {
  /**
   * ═══ LE PARCOURS A TROIS TEMPS, ET LE TROISIÈME EST NOUVEAU ════════════════
   *
   * « Je te l'ai fait en maquettes pour que cet enchaînement soit
   * scrupuleusement respecté : il essaye sur lui, ensuite il note, ça va sur le
   * mur du commerçant, et ils en parlent avec leurs amis. »
   *
   * LE RENDU FAISAIT DEUX MÉTIERS À LUI SEUL. Sur un écran, il montrait le
   * résultat, demandait la note, proposait d'en essayer un autre, d'acheter, de
   * passer, d'en parler, de dire que c'était raté et de reprendre la photo. Huit
   * choses, et la note — la seule que ce produit soit seul à savoir recueillir —
   * était perdue au milieu.
   *
   * ILS SE SÉPARENT DONC. Le deuxième temps ne sert qu'à REGARDER : la
   * glissière, les autres styles, et un seul geste pour dire « celui-là ». Le
   * troisième ne sert qu'à DIRE CE QU'ON EN PENSE, et c'est de là que partent le
   * mur, le salon et la réservation.
   *
   * `cadrer` et `choisir` sont les deux moitiés du premier temps : on se
   * photographie, puis on choisit. Ils ne comptent que pour un dans la frise,
   * parce que du point de vue de celui qui regarde c'est un seul moment — « je
   * découvre ».
   */
  /**
   * ═══ LE CHEMIN SANS APPAREIL PHOTO VIT DANS L'ADRESSE ═════════════════════
   *
   * « Supprimer cette section en bas qui ne sert à rien : Voir avec la photo
   * d'exemple. »
   *
   * LE BOUTON EST PARTI DE L'ÉCRAN, ET LE CHEMIN EST RESTÉ. Ce n'était pas un
   * geste d'utilisateur — personne ne vient essayer une monture sur le visage
   * d'une inconnue — mais c'est le seul moyen d'ATTEINDRE le rendu sans se
   * photographier, et deux choses en dépendent : la démonstration qu'on fait
   * devant un commerçant, et cinq mesures de la suite de vérification, qui
   * n'ont pas d'appareil photo.
   *
   * LE RETIRER TOUT À FAIT AURAIT DONC SUPPRIMÉ LE BOUTON *ET* LA POSSIBILITÉ
   * DE VÉRIFIER L'ÉCRAN QU'IL OUVRE. `?exemple=1` fait ce que le bouton
   * faisait, sans rien poser sur l'écran de quelqu'un qui vient essayer.
   */
  /**
   * ═══ « RECHERCHE » S'INTERCALE, ET ELLE NE REMPLACE RIEN ══════════════════
   *
   * Le parcours avait un seul chemin entre le choix et le rendu : on désignait
   * une pièce, le calcul partait. « Surprends-moi » en ouvre un second, et il
   * demande un temps de plus — celui où ClikMe CHERCHE, avant de préparer.
   *
   * CE SONT DEUX ATTENTES DIFFÉRENTES, ET LES CONFONDRE AURAIT MENTI SUR LES
   * DEUX. La recherche fouille la collection : elle ne sait pas encore quoi
   * poser, donc elle ne peut pas montrer la pièce. La préparation, elle, SAIT
   * — et tout son numéro consiste justement à montrer la pièce qui tourne
   * autour de vous. Un seul écran pour les deux aurait dû taire la pièce
   * pendant toute la durée, c'est-à-dire renoncer à ce qui fait l'attente
   * supportable.
   */
  const [etape, setEtape] = useState<
    "cadrer" | "choisir" | "recherche" | "calcul" | "avis" | "agir"
  >(() => {
    // « EXPLORER LA COLLECTION » TIENT SA PROMESSE : on entre sur la grille.
    // Voir `ouvrirSurGrille` — la photo est demandée quand on désigne une
    // pièce, c'est-à-dire quand on sait à quoi elle va servir.
    if (ouvrirSurGrille) return "choisir";
    if (typeof window === "undefined") return "cadrer";
    try {
      return new URLSearchParams(window.location.search).get("exemple")
        ? "choisir"
        : "cadrer";
    } catch {
      return "cadrer";
    }
  });
  const [piece, setPiece] = useState<Piece | null>(null);
  /**
   * ═══ QUI A CHOISI CETTE PIÈCE ? ═══════════════════════════════════════════
   *
   * DEUX PIÈCES IDENTIQUES N'ONT PAS LE MÊME POIDS selon qui les a désignées.
   * Celle qu'on a choisie soi-même, on la connaissait déjà ; celle que ClikMe
   * a sortie de la réserve, on ne l'avait jamais vue — et c'est précisément ce
   * qu'il faut dire sur l'écran du résultat, sans quoi le client croit avoir
   * demandé ce qu'on lui montre.
   *
   * IL NE SERT QU'À PARLER. Rien du calcul, du rendu ou de l'avis n'en dépend :
   * un essai est un essai. Ce drapeau ne change que la phrase au-dessus de la
   * photo, et le bouton « Surprends-moi encore » en dessous.
   */
  const [surprise, setSurprise] = useState(false);
  const [pct, setPct] = useState(0);
  /**
   * LA NOTE QU'ON SE DONNE — DE UN À CINQ FANTÔMES.
   *
   * « On pourrait noter le résultat SUR SOI en mettant des étoiles ou des
   * fantômes, pour dire si on aime ou pas sur soi. »
   *
   * ET CE N'EST PAS UN AVIS SUR LE COMMERCE, C'EST TOUT L'INTÉRÊT. Une étoile
   * sur une fiche note une maison : une moyenne tirée sur des années, qui ne
   * dit rien à celui qui la lit. Ici on note UNE pièce SUR SOI, aujourd'hui —
   * « cette monture-là, sur mon visage à moi ». C'est la seule note de ce
   * produit qui soit à la fois personnelle et utile à quelqu'un d'autre : le
   * suivant qui a la même tête sait à quoi s'attendre, et le commerçant
   * apprend ce qui plaît AVANT d'avoir vendu.
   *
   * DES FANTÔMES PLUTÔT QUE DES ÉTOILES, et il proposait les deux. Le fantôme
   * est déjà l'unité de ce produit — on pose un fantôme, on a trois fantômes
   * par jour, le fantôme appelle depuis la barre. Une étoile serait empruntée à
   * tout le monde ; le fantôme n'est qu'à nous, et il dit en plus la bonne
   * chose : ce qu'on laisse de soi.
   *
   * ELLE EST FACULTATIVE, ET ELLE LE RESTE. Zéro veut dire « je n'ai pas
   * noté », pas « c'est mauvais ». Forcer la note pour continuer transformerait
   * un plaisir en péage.
   */
  const [note, setNote] = useState(0);
  /** Le fantôme survolé pendant qu'on choisit : il éclaire ceux d'avant. */
  const [noteVue, setNoteVue] = useState(0);
  /**
   * ═══ LE PETIT MOT, ET C'EST LUI QU'ON LIRA ═════════════════════════════════
   *
   * UNE NOTE SEULE NE DIT PAS POURQUOI. Sur le mur, ce n'est pas la note qu'on
   * lit en premier : c'est « Je ne pensais pas qu'il m'irait aussi bien » sous
   * la photo de Nathalie. Quatre fantômes disent qu'elle a aimé ; sa phrase dit
   * ce qui a décidé, et c'est elle qui décide le suivant.
   *
   * FACULTATIF, ET PLAFONNÉ À DEUX CENTS. Sans plafond on reçoit des pavés que
   * personne ne lit sous une vignette ; sans compteur, on écrit et on se fait
   * couper.
   */
  const [commentaire, setCommentaire] = useState("");
  /**
   * LE CHAMP DU PETIT MOT EST-IL DÉPLIÉ ?
   *
   * LA MAQUETTE DESSINE UNE PASTILLE FERMÉE — « + Ajouter un mot (optionnel) »
   * — et c'est la bonne forme. Un champ de texte ouvert DEMANDE d'écrire : il
   * prend cent points sous la photo, il attire le pouce, et il fait passer un
   * geste facultatif pour une étape du parcours. Fermé, il ne demande rien.
   */
  const [motOuvert, setMotOuvert] = useState(false);
  /**
   * LE DÉTAIL DU CHOIX, ET L'AVIS DEMANDÉ — DEUX PANNEAUX, DEUX PARCOURS.
   *
   * `pourquoi` n'existe que quand ClikMe a choisi : il justifie. `conseil`
   * n'existe que quand c'est le client qui a choisi : il conseille, et
   * seulement s'il est demandé. Les deux ne sont jamais ouverts ensemble,
   * parce qu'ils ne peuvent jamais être proposés ensemble.
   */
  const [pourquoi, setPourquoi] = useState(false);
  const [conseil, setConseil] = useState(false);
  /**
   * ═══ LA PIÈCE EST-ELLE MISE DE CÔTÉ, ET OÙ EN EST LE CŒUR ? ════════════════
   *
   * « Ça devrait rester sur la même page avec juste une animation qui fait
   * comprendre que ça a été mis de côté : un cœur qui part vers le haut. »
   *
   * DEUX ÉTATS PLUTÔT QU'UN, parce qu'ils ne durent pas pareil. `misDeCote`
   * reste : c'est ce que le bouton raconte tant qu'on est sur l'écran. `coeur`
   * ne dure qu'une seconde — c'est le vol — et il porte un COMPTEUR plutôt
   * qu'un booléen, pour que deux envols de suite rejouent l'animation au lieu
   * de la laisser figée sur la fin de la première.
   */
  const [misDeCote, setMisDeCote] = useState(false);
  /**
   * ═══ LA PHOTO SEULE, SANS RIEN AUTOUR ══════════════════════════════════════
   *
   * « Ici c'est un jean que j'ai essayé mais on ne le voit pas bien : est-ce que
   * je pourrais, d'une manière très intuitive, voir la photo en entier sans
   * rien autour — aucun texte ni icône — afin de voir les vêtements ? »
   *
   * L'ÉCRAN DE RÉSULTAT EST UN ÉCRAN DE DÉCISION, et il est plein de ce qu'il
   * faut pour décider : le titre, les cinq fantômes, trois gestes, deux liens.
   * Tout cela mange le bas de la photo — c'est-à-dire le pantalon, les
   * chaussures, la longueur d'une jupe. On ne peut pas à la fois demander un
   * avis et ne rien montrer.
   *
   * D'OÙ UN SECOND TEMPS, ET PAS UN COMPROMIS. Un appui sur la photo l'ouvre
   * SEULE, bord à bord, sans une ligne de texte ; un second appui la referme.
   * Rien n'est perdu entre les deux : la note, le mot écrit, tout attend.
   */
  const [plein, setPlein] = useState(false);
  const [coeur, setCoeur] = useState(0);
  /** Le cadre du résultat : c'est lui qui donne le repère au vol du cœur. */
  const cadreRes = useRef<HTMLDivElement>(null);
  /**
   * LA BULLE DE LA CLOCHE S'EFFACE TOUTE SEULE.
   *
   * « Quand j'appuie dessus j'ai bien un message, mais il devrait disparaître
   * au bout de 3 secondes pour avoir un visuel sur l'article. »
   *
   * ELLE DIT CE QUE LE PICTOGRAMME NE PEUT PAS DIRE, et une fois qu'elle l'a
   * dit elle n'est plus qu'un cache sur la photo. Trois secondes suffisent à
   * la lire, et le compteur repart à chaque appui sur la cloche — c'est la
   * réponse à CE geste-là qu'on veut voir, pas la précédente.
   */
  const [bulle, setBulle] = useState(0);
  /**
   * ═══ MON ESSAI REJOINT-IL LE MUR DU COMMERÇANT ? ═══════════════════════════
   *
   * « J'accepte éventuellement de partager ma projection : elle rejoint les
   * autres projections. »
   *
   * C'EST LA SEULE CASE À COCHER DE TOUT LE PRODUIT, et elle vaut la peine : le
   * mur n'existe que par elle. Sans case, on publiait la photo de quelqu'un sur
   * le mur d'un commerce parce qu'il avait noté — c'est-à-dire exactement le
   * contraire de ce que l'écran de la photo venait de promettre.
   *
   * COCHÉE D'AVANCE, ET C'EST UN CHOIX ASSUMÉ. Décochée par défaut, le mur reste
   * vide, donc personne ne voit ce que ça donne sur de vraies têtes, donc
   * personne n'essaie. Elle reste VISIBLE et se décoche d'un appui, au-dessus du
   * bouton et pas dans un réglage : c'est la différence entre un défaut assumé
   * et un défaut caché.
   */
  const [partage, setPartage] = useState(true);
  /**
   * LA RÉVÉLATION A-T-ELLE DÉJÀ EU LIEU ?
   *
   * ELLE NE SE REJOUE JAMAIS, ET C'EST LA RÈGLE DE TOUTE ANIMATION DE CE
   * PRODUIT. Le voile balaie l'image une fois, à l'arrivée du rendu. S'il
   * repassait à chaque rendu de la page — un appui sur « comparer », un
   * changement de note — il deviendrait un défaut d'écran au bout du troisième
   * tour, et l'écran clignoterait pendant qu'on réfléchit.
   *
   * ON POSE DONC UNE CLASSE, UNE FOIS, SUR LE CADRE : l'animation CSS se joue à
   * la pose et ne se rejoue pas tant que la classe reste. Elle retombe quand on
   * repart choisir, parce que le prochain rendu mérite sa propre révélation.
   */
  const [revele, setRevele] = useState(false);
  /**
   * OÙ L'ON EN EST DANS LE RÉCIT DE L'ATTENTE. Voir `ETAPES` et l'écran de
   * calcul : le texte avance avec le pourcentage, parce qu'une phrase fixe
   * pendant douze secondes cesse d'être lue au bout de trois.
   */
  const etapeDite = Math.min(ETAPES.length - 1, Math.floor(pct / (100 / ETAPES.length)));
  /**
   * L'ACTE EN COURS — voir la scène d'attente.
   *
   * IL SUIT L'AVANCEMENT RÉEL, et c'est la condition pour que la mise en scène
   * ne mente pas : le rideau ne se retire pas pendant qu'on attend encore la
   * réponse du modèle. Les seuils sont larges — un tiers, deux tiers — parce
   * qu'un acte qui dure trois secondes n'est pas un acte.
   */
  const acte = pct < 34 ? "a1" : pct < 72 ? "a2" : "a3";
  /**
   * LE RENDU CALCULÉ, ET IL A REMPLACÉ LE RENDU TOUT FAIT.
   *
   * Jusqu'ici l'écran affichait `piece.rendu` — une photo prise à l'avance, sur
   * un bras précis. C'était la maquette qui trichait, et c'était écrit. Ce que
   * ce champ contient maintenant est calculé PENDANT l'essai, dans le
   * navigateur, sur la photo `avant` du mur : voir `lib/direct/essai.ts`.
   *
   * `ms` est le temps réel du calcul, et il est affiché tel quel. Une promesse
   * d'instantanéité qu'on peut chiffrer vaut mieux qu'un adjectif.
   */
  const [rendu, setRendu] = useState<{
    image: string;
    ms: number;
    souci?: string;
    /** Vrai quand la photo a dû partir chez un tiers. L'écran doit le dire. */
    envoye?: boolean;
  } | null>(null);
  /** Vrai pendant le premier téléchargement du modèle de main. Voir `EcranCalcul`. */
  const [telecharge, setTelecharge] = useState(false);
  /**
   * LE VERDICT SUR LE RENDU LUI-MÊME, ET IL EST SÉPARÉ DE L'ACHAT.
   *
   * « Je passe » veut dire « la pièce ne me va pas ». « Le rendu n'est pas bon »
   * veut dire « je n'ai pas pu juger ». Ce sont DEUX choses, et les confondre
   * empoisonnerait la seule mesure qui nous dise si l'essai fonctionne : on
   * lirait un refus de produit là où il y a un défaut d'image.
   *
   * CELUI-CI NE PUBLIE RIEN ET NE COMPTE PAS. Il n'a pas à laisser de fantôme
   * sur le mur — un rendu raté n'est l'avis de personne sur rien.
   */
  const [rate, setRate] = useState(false);
  /**
   * LA PHOTO DE LA CLIENTE, ET C'EST ELLE QUI MANQUAIT.
   *
   * `null` veut dire « on n'a pas encore pris de photo », et l'écran retombe
   * alors sur l'exemple du mur — en le DISANT. Tout le reste de l'essai lit
   * `laPhoto` et jamais `mur.essai.avant` directement : le viseur, le calcul, et
   * la comparaison avant/après.
   */
  const [photo, setPhoto] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  /** Le champ qui ouvre l'appareil photo. Voir les deux champs, plus bas. */
  const appareil = useRef<HTMLInputElement>(null);
  const laPhoto = photo ?? mur.essai?.avant;
  /**
   * L'AVANT-APRÈS, SUR APPUI.
   *
   * C'EST LA SEULE CHOSE QUI PROUVE QUELQUE CHOSE. Un rendu montré seul se
   * regarde comme une photo de catalogue ; c'est le RETOUR à sa propre photo,
   * au même cadrage, qui fait comprendre que la pièce a été posée sur soi. On
   * touche l'image, elle revient à l'avant ; on relâche, elle repart.
   */
  const [avant, setAvant] = useState(false);
  /**
   * ═══ ET IL SE TIRE AUSSI AU DOIGT ══════════════════════════════════════════
   *
   * L'APPUI LONG RESTE, LA GLISSIÈRE S'AJOUTE, et les deux ne font pas la même
   * chose. L'appui long est le geste du COUP D'ŒIL : on veut revoir sa tête une
   * seconde, on relâche, on est revenu. La glissière est le geste de la
   * COMPARAISON : on s'arrête au milieu, on regarde la ligne de partage passer
   * sur son propre visage, et c'est là qu'on voit vraiment ce qui a changé.
   *
   * ON NE PEUT PAS DEMANDER À UN APPUI DE FAIRE LES DEUX. Maintenu, il ne
   * s'arrête nulle part ; relâché, il ne montre plus rien. La maquette demande
   * la glissière, et elle a raison : c'est elle qui laisse le temps de juger.
   *
   * `x` EST EN POURCENTAGE DE LA LARGEUR, comme sur la page d'accueil, et pour
   * la même raison : l'image change de taille avec l'écran, le trait doit rester
   * au même endroit de l'image.
   */
  const [x, setX] = useState(58);
  /**
   * LE RENDU EN GRAND, ET C'EST UN GESTE SÉPARÉ DE LA COMPARAISON.
   *
   * « Une fois qu'on a le résultat, qu'on peut agrandir si on le veut. »
   *
   * L'appui long compare, il ne peut donc pas aussi agrandir : un même doigt ne
   * peut pas faire deux choses sur la même image sans qu'on se trompe une fois
   * sur deux. L'agrandissement a son propre bouton, dans le coin, et il ouvre le
   * rendu plein écran — c'est là qu'on juge un vernis ou une mèche, pas dans une
   * vignette de trois centimètres.
   */
  const [loupe, setLoupe] = useState(false);
  /**
   * CE QUI RESTE À L'ÉCRAN QUAND ON A DÉCIDÉ.
   *
   * Le dépôt renvoyait au mur. On reste ici : le rendu est parti sur le mur tout
   * seul, l'écran le dit, et il propose les deux seules suites qui aient du sens
   * — réessayer autre chose, ou aller voir le mur.
   */
  /**
   * `essaye` EST LE TROISIÈME VERDICT, ET IL MANQUAIT.
   *
   * ON POSAIT SUR LE MUR EN ACHETANT OU EN RENONÇANT, et pas autrement. Or le
   * parcours qu'on vient de séparer se termine le plus souvent par « j'en parle
   * à mes amis » — ce qui n'est ni l'un ni l'autre, et ce qui doit tout de même
   * laisser une trace : « qu'il note, que ça aille sur le mur du commerçant ».
   * Sans ce troisième cas, demander leur avis à ses amis effaçait l'essai.
   */
  const [decide, setDecide] = useState<"pris" | "passe" | "essaye" | null>(null);
  /**
   * LE FANTÔME QU'ON VIENT DE POSER, POUR LE MONTRER PLUTÔT QUE LE DIRE.
   *
   * « Quand je prends une photo et que je dis "je prends rendez-vous" ou "je
   * passe", je n'ai pas l'impression que c'est sauvegardé sur le mur du
   * commerçant. »
   *
   * MESURÉ : IL L'ÉTAIT. La mémoire contenait bien le dépôt et « Vous »
   * figurait bien sur le mur — on ne le voyait simplement NULLE PART au moment
   * où l'on décidait. C'est moi qui ai fabriqué cette impression : en
   * supprimant le renvoi vers le mur pour garder le focus sur l'essai, j'ai
   * remplacé la preuve par la phrase « votre essai est sur le mur ».
   *
   * UNE PHRASE N'EST PAS UNE PREUVE, et c'est la même règle que partout
   * ailleurs ici : on ne dit jamais qu'une chose a eu lieu, on la montre. La
   * carte déposée s'affiche donc dans le panneau, telle qu'elle sera sur le
   * mur — même dessin, même vignette, même pastille.
   */
  const [pose, setPose] = useState<Fantome | null>(null);
  const minuteur = useRef<number | null>(null);

  /**
   * LE CALCUL, ET LE PLANCHER DE TEMPS QUI L'ACCOMPAGNE.
   *
   * LA COMPOSITION PREND DEUX CENTS MILLISECONDES. Passer de la grille des
   * pièces au résultat en un clignement ne se lit pas : on ne voit pas que
   * quelque chose a été fabriqué pour soi, on croit avoir ouvert une photo. On
   * garde donc la jauge, et on lui donne un plancher — assez pour que le geste
   * se voie, trop peu pour qu'on attende.
   *
   * ET LA JAUGE NE MENT PAS DEUX FOIS : elle avance pendant un vrai calcul, et
   * l'écran suivant affiche le temps que ce calcul a réellement pris.
   */
  /**
   * ═══ LA RECHERCHE, ET ELLE DURE VRAIMENT CE QU'ELLE DIT ═══════════════════
   *
   * TROIS TEMPS, QUATRE SECONDES ET DEMIE. La maquette les nomme : « Photo
   * analysée », « On cherche le bon look… », « Presque prêt ! ». Ils avancent à
   * heure fixe parce qu'il n'y a ici rien de vrai à mesurer — le tirage est
   * instantané, et prétendre en afficher l'avancement serait la jauge menteuse
   * qu'on a retirée de l'écran d'à côté.
   *
   * QUATRE SECONDES ET DEMIE, ET PAS DOUZE. C'est le temps d'un regard qui fait
   * le tour de l'écran : on lit le titre, on voit le fantôme tourner, on lit la
   * frise, et la réponse arrive. Plus long, on attendrait ; plus court, on
   * n'aurait pas eu le temps de comprendre qu'on nous cherche quelque chose.
   *
   * ET SI LA RÉSERVE EST VIDE, ON RETOURNE AU CHOIX plutôt que de rester sur un
   * écran qui cherche ce qui n'existe pas.
   */
  /**
   * ═══ L'ÉCRAN DU RÉSULTAT SE MET EN PLACE TOUT SEUL ════════════════════════
   *
   * IL ARRIVE APRÈS UNE ATTENTE, ET PERSONNE N'A DÉFILÉ PENDANT CE TEMPS-LÀ.
   * Le navigateur garde donc la position qu'avait l'écran de préparation — et
   * comme le nouvel écran est plus haut, on atterrissait au milieu, la question
   * « Alors, ça vous plaît ? » déjà passée au-dessus du bord.
   *
   * ET LA PAGE DU COMMERÇANT A UNE BARRE COLLANTE. Elle recouvre le haut de ce
   * qui passe dessous : la flèche de retour et la croix se retrouvaient
   * derrière les onglets, c'est-à-dire intouchables. On mesure donc la barre
   * plutôt que de deviner sa hauteur — elle change avec la taille de police du
   * téléphone, et elle n'existe pas du tout dans le fil.
   *
   * `requestAnimationFrame` PARCE QUE L'ÉLÉMENT VIENT DE NAÎTRE : mesuré dans
   * le même tour, il n'a pas encore sa hauteur, et le calcul tombe à zéro.
   */
  useEffect(() => {
    if (etape !== "avis") return;
    const t = requestAnimationFrame(() => {
      const bloc = document.querySelector<HTMLElement>(".mu-res");
      if (!bloc) return;
      const collante = document.querySelector<HTMLElement>(".bq-nav");
      const haut = collante ? collante.getBoundingClientRect().height : 0;
      const y = bloc.getBoundingClientRect().top + window.scrollY - haut - 8;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(t);
  }, [etape]);

  /**
   * ═══ L'ESSAI DIT AU MUR CE QU'IL MONTRE ═══════════════════════════════════
   *
   * ON N'ENVOIE QUE CE QUI EST VRAI, et donc rien tant que le rendu n'a pas
   * abouti : un mur qui annoncerait « votre essayage » au-dessus d'une photo de
   * catalogue montrerait la pièce de quelqu'un d'autre en disant qu'elle est la
   * vôtre. C'est exactement la faute que l'écran d'échec existe pour éviter.
   */
  useEffect(() => {
    if (!onEssai) return;
    if (!piece || !rendu?.image || rendu.souci) {
      onEssai(null);
      return;
    }
    onEssai({ piece, image: rendu.image, note });
  }, [onEssai, piece, rendu, note]);

  /**
   * LE MUR DEMANDE LE CATALOGUE, ET L'ESSAI Y RETOURNE.
   *
   * L'essai reste monté pendant qu'on regarde le mur — c'est ce qui préserve le
   * rendu — donc « reviens à la grille » ne peut pas passer par un changement
   * d'écran : il est déjà là. Le compteur change, l'essai le voit, il repart sur
   * le choix. On saute la prise de vue parce qu'il y a déjà une photo : y
   * renvoyer ferait recommencer ce qu'on vient de faire.
   */
  const premierCatalogue = useRef(catalogue);
  useEffect(() => {
    if (catalogue === premierCatalogue.current) return;
    premierCatalogue.current = catalogue;
    setEtape(laPhoto ? "choisir" : "cadrer");
    // `laPhoto` est lu à l'instant du geste, pas au montage : le relister ici
    // renverrait au catalogue chaque fois que la photo change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogue]);

  const RECHERCHE_MS = 4_500;
  const [cherche, setCherche] = useState(0);
  useEffect(() => {
    if (etape !== "recherche") return;
    setCherche(0);
    const pas = [
      window.setTimeout(() => setCherche(1), RECHERCHE_MS * 0.34),
      window.setTimeout(() => setCherche(2), RECHERCHE_MS * 0.72),
    ];
    const fin = window.setTimeout(() => {
      const tiree = piocher(piece);
      if (!tiree) {
        setEtape("choisir");
        return;
      }
      setPiece(tiree);
      setEtape("calcul");
    }, RECHERCHE_MS);
    return () => {
      for (const t of pas) window.clearTimeout(t);
      window.clearTimeout(fin);
    };
    // `piocher` et `piece` sont lus à l'expiration du minuteur, pas au montage :
    // les relister ici relancerait la recherche à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape]);

  const PLANCHER = 900;
  useEffect(() => {
    if (etape !== "calcul" || !piece) return;
    let vivant = true;
    const debut = Date.now();
    setPct(0);
    /**
     * ═══ LA JAUGE SUIT LE TEMPS, ET ELLE NE SE FIGE JAMAIS ════════════════════
     *
     * ELLE MONTAIT PAR PAS FIXES ET SE BLOQUAIT À QUATRE-VINGT-QUATORZE EN SIX
     * SECONDES. Or une édition d'image en haute qualité demande une minute, et
     * parfois deux. Le client voyait donc six secondes de mouvement, puis cent
     * dix secondes d'écran immobile à « 94 % » — c'est exactement l'écran qu'on
     * regarde en se demandant si l'application est morte, et c'est la vraie
     * raison pour laquelle l'attente paraissait si longue. Le numéro du fantôme
     * jouait ses trois actes en six secondes, puis tournait en boucle sur le
     * dernier pendant deux minutes.
     *
     * ELLE SE CALCULE MAINTENANT À PARTIR DU TEMPS ÉCOULÉ, EN S'APPROCHANT SANS
     * JAMAIS ATTEINDRE. `1 − e^(−t/τ)` monte vite au début — où l'on veut voir
     * que ça démarre — puis ralentit indéfiniment. Il n'y a plus d'instant où
     * elle s'arrête : à deux minutes elle avance encore, lentement, et c'est ce
     * mouvement résiduel qui dit « ça travaille » plutôt que « c'est planté ».
     *
     * τ VAUT VINGT-DEUX SECONDES parce que c'est l'ordre de grandeur d'un rendu
     * réussi : on passe la moitié de la jauge à peu près quand la moitié du
     * travail est faite. Ce n'est pas une mesure — le serveur ne dit pas où il
     * en est — mais c'est une honnêteté d'échelle, et elle suffit à ce que les
     * trois actes du fantôme se répartissent sur toute l'attente au lieu de se
     * bousculer dans les six premières secondes.
     *
     * LE PLAFOND RESTE À QUATRE-VINGT-QUATORZE. Les six derniers points
     * appartiennent à l'arrivée du rendu : une jauge qui atteint cent avant que
     * l'image soit là ment, et c'est le genre de mensonge qu'on remarque.
     */
    const TAU = 22_000;
    minuteur.current = window.setInterval(() => {
      const t = Date.now() - debut;
      setPct(Math.min(94, Math.round(94 * (1 - Math.exp(-t / TAU)))));
    }, 120);

    const finir = (r: { image: string; ms: number; souci?: string; envoye?: boolean } | null) => {
      const reste = Math.max(0, PLANCHER - (Date.now() - debut));
      window.setTimeout(() => {
        if (!vivant) return;
        setPct(100);
        setRendu(r);
        /* ═══ ON ARRIVE SUR L'AVIS, ET PLUS SUR UN ÉCRAN D'ATTENTE ════════

           « J'ai l'impression qu'on a une étape en trop : quand j'obtiens le
           résultat, j'arrive sur un écran au lieu d'arriver directement sur la
           maquette, et c'est l'étape d'après, après avoir cliqué sur "Je donne
           mon avis". Je pense que c'est inutile. »

           IL AVAIT RAISON, ET LA FAUTE ÉTAIT DE RYTHME. Le deuxième temps ne
           servait qu'à REGARDER : la photo, la bande des styles, puis un bouton
           « Je donne mon avis » qui ouvrait l'écran où l'on regarde la MÊME
           photo et où l'on note. Deux écrans pour une seule image, séparés par
           un clic qui ne décide rien — et le clic tombait à l'instant précis où
           la réaction est la plus vive, c'est-à-dire là où il fallait la
           recueillir.

           LA RÉACTION VIENT AVANT LA RÉFLEXION. On voit, on aime ou on n'aime
           pas, et c'est tout de suite. Un écran qui s'interpose entre les deux
           transforme un ressenti en décision, et une décision se donne moins
           volontiers qu'un ressenti. */
        setEtape("avis");
        /* ═══ ET C'EST ICI QUE LE SON DE LA RÉVÉLATION TOMBE ═══════════════
           SUR L'IMAGE, PAS SUR LA RÉPONSE DU SERVEUR. Entre les deux il y a
           le plancher d'attente et la recomposition du visage ; jouer à
           l'arrivée de la réponse ferait sonner l'écran avant qu'il montre
           quoi que ce soit, et un son qui précède ce qu'il annonce s'entend
           comme un défaut.
           ET L'ÉCHEC A LE SIEN, qui n'est pas un buzzer — voir `sons.ts`. */
        jouer(r?.image ? "revele" : "souci");
        /**
         * LA CLASSE EST POSÉE EN MÊME TEMPS QUE L'ÉCRAN, ET C'EST LA SEULE
         * FAÇON QUI MARCHE.
         *
         * PREMIER JET, ET IL NE S'EST JAMAIS JOUÉ : la classe était posée à
         * l'image suivante, dans un `requestAnimationFrame`, pour être sûr que
         * le navigateur voie un changement. Mais `setEtape("rendu")` RELANCE
         * cet effet-ci — il dépend de `etape` — donc son nettoyage passe et met
         * `vivant` à faux AVANT que l'image suivante arrive. La révélation
         * était donc annulée par le rendu qui la déclenchait. C'est exactement
         * la faute déjà payée sur l'appel du fantôme de la barre.
         *
         * ET LE DÉTOUR ÉTAIT INUTILE : le cadre `.mu-rendu` N'EXISTE PAS avant
         * cette seconde-là. Une animation CSS se joue à l'INSERTION de
         * l'élément, pas seulement au changement de classe — le monter déjà
         * marqué suffit, et c'est mesuré par la garde.
         */
        setRevele(true);
      }, reste);
    };

    const gabarit = mur.essai?.gabarit;

    /**
     * LE CHEMIN PRINCIPAL : LA PHOTO DU COMMERÇANT, POSÉE SUR LA VÔTRE.
     *
     * Il passe avant tous les autres parce qu'il est le seul à atteindre la barre
     * posée par le terrain : « si le résultat n'est pas parfait, ça n'ira pas —
     * on ne peut pas proposer quelque chose de mauvais ou de moyen. » Voir
     * `app/api/direct/essayer/route.ts` pour pourquoi le moteur géométrique ne
     * pouvait pas y arriver, et pourquoi on ne retombe pas dessus en cas de
     * panne.
     */
    if (piece.reference && laPhoto) {
      setTelecharge(false);
      essayerSurMoi({
        photo: laPhoto,
        reference: piece.reference,
        partie: mur.essai?.partie ?? "la zone concernée",
        // CE QUE CE MÉTIER-LÀ NE DOIT PAS TOUCHER. Voir `garder` dans
        // `fantomes.ts` : chez le coiffeur les lunettes restent, chez le
        // lunetier elles sont ce qui change.
        garder: mur.essai?.garder,
        // ET CE QU'IL A LE DROIT DE MODIFIER. Sans ce mot, la consigne disait
        // « reproduis la référence sur votre tête » — et le modèle refaisait
        // le visage, ce qui est exactement ce qui a été rapporté.
        //
        // LA PIÈCE PASSE DEVANT LE MÉTIER — voir `zoneChangee` : une robe et un
        // pull ne remplacent pas la même chose sur un corps, et la phrase du
        // métier ne pouvait dire que l'un des deux.
        change: zoneChangee(mur.essai, piece),
        // ET CE QUE CETTE PIÈCE-LÀ EST, EN TOUTES LETTRES. Sans elle, on
        // demandait au modèle de deviner la coupe sur la photo d'une autre
        // personne avant de la poser — et « la coupe sélectionnée n'a pas été
        // créée ». Voir `decrire` dans `fantomes.ts`.
        decrire: piece.decrire,
      })
        .then((r) =>
          estUnRendu(r)
            ? finir({ image: r.image, ms: r.ms, envoye: true })
            : finir({
                image: laPhoto,
                ms: 0,
                souci: r.pourquoi ? `${r.erreur} (${r.pourquoi})` : r.erreur,
              }),
        )
        .catch(() => finir({ image: laPhoto, ms: 0, souci: SOUCI_MOTEUR }));
      return () => {
        vivant = false;
        if (minuteur.current) window.clearInterval(minuteur.current);
      };
    }

    if (gabarit?.forme === "main" && piece.vernis && laPhoto) {
      // ON PRÉVIENT SI LE MODÈLE N'EST PAS ENCORE LÀ. Dix-neuf mégaoctets la
      // première fois : dire « ton fantôme prépare » pendant ce temps-là serait
      // mentir sur ce qui se passe, et sur ce que ça coûte à la cliente en 4G.
      setTelecharge(!laMainEstPrete());
      poserVernis({
        photo: laPhoto,
        vernis: piece.vernis,
        // `?reperes=1` DANS L'ADRESSE. Rien dans l'interface : c'est un outil de
        // mise au point pour comprendre une photo qu'on n'a pas sous la main, pas
        // une fonctionnalité. Voir `poserVernis`.
        reperes:
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("reperes") === "1",
      })
        .then((p) => finir({ image: p.image, ms: p.ms, souci: p.ongles ? undefined : p.souci }))
        // UN ÉCHEC MONTRE VOTRE PHOTO ET LE DIT — JAMAIS LE CATALOGUE.
        // C'est ce `catch` qui a fait le plus de dégâts : il retombait sur
        // `piece.photo`, donc sur des ongles impeccables photographiés chez la
        // prothésiste, présentés comme le résultat d'un essai qui n'avait pas
        // eu lieu. Un calcul raté doit ressembler à un calcul raté.
        .catch(() => finir({ image: laPhoto, ms: 0, souci: SOUCI_MOTEUR }));
      return () => {
        vivant = false;
        if (minuteur.current) window.clearInterval(minuteur.current);
      };
    }
    if (!gabarit || gabarit.forme === "main" || gabarit.forme === "cadre" || !piece.decoupe || !laPhoto) {
      // Pas de gabarit ou pas de découpe : on retombe sur ce que la pièce
      // fournit. C'est le cas de la paire vraie du bijoutier, qui reste
      // meilleure que tout calcul.
      finir(null);
    } else {
      composer({ lieu: laPhoto, piece: piece.decoupe, gabarit })
        .then((p) => finir({ image: p.image, ms: p.ms }))
        // Même règle ici : on rend SA photo et on dit que ça n'a pas marché.
        .catch(() => finir({ image: laPhoto, ms: 0, souci: SOUCI_MOTEUR }));
    }

    return () => {
      vivant = false;
      if (minuteur.current) window.clearInterval(minuteur.current);
    };
  }, [etape, piece, mur, laPhoto]);

  /**
   * CE QU'A FAIT LE PARTAGE, ET PAS CE QU'ON ESPÈRE QU'IL A FAIT.
   *
   * `null` tant qu'on n'a rien ouvert. Voir `partagerLEssai` : ni la feuille de
   * partage ni WhatsApp n'ENVOIENT — ils ouvrent. L'écran pose donc la question
   * au lieu d'annoncer.
   */
  const [envoi, setEnvoi] = useState<Sortie | null>(null);

  /**
   * PRÉVENIR LE COMMERÇANT AVEC LA PHOTO.
   *
   * « Quand je dis "je réserve ma place", j'ai cet écran au lieu d'avoir le
   * WhatsApp qui s'ouvre avec la photo et le message pré-rempli. »
   *
   * IL FAUT UN VRAI RENDU POUR QUE ÇA AIT UN SENS. Sur la photo d'exemple ou
   * après un échec, l'image n'est pas la sienne : l'envoyer au salon en disant
   * « voici le rendu » serait faux. On retombe alors sur le message sans photo,
   * qui reste vrai.
   */
  const prevenir = async (p: Piece) => {
    /**
     * ═══ ON N'OUVRE PAS WHATSAPP SUR UN NUMÉRO QUI N'EXISTE PAS ══════════════
     *
     * « Ça ouvre bien WhatsApp mais propose mon propre carnet d'adresses, pas le
     * téléphone du coiffeur par défaut. Bug ? »
     *
     * PAS UN BUG DE CODE : UN NUMÉRO DE FICTION. Le lien est bien construit avec
     * le numéro du commerce — mais ce commerce est inventé, donc son numéro
     * l'est aussi. `numeroDeFiction` existe précisément pour ça : tirer un
     * numéro au hasard en toucherait un vrai, chez quelqu'un. WhatsApp reçoit
     * donc une adresse valide dans sa forme mais absente de son annuaire, et il
     * fait ce qu'il fait toujours dans ce cas — il s'ouvre sur la liste des
     * conversations.
     *
     * CE QU'ON PEUT CORRIGER, C'EST DE NE PLUS L'OUVRIR. Montrer le message qui
     * PARTIRAIT, avec le numéro de fiction affiché, dit la vérité et laisse le
     * parcours lisible. Le jour où un commerçant déclare son numéro, le chemin
     * d'à côté s'ouvre tout seul : voir `mur.telFiction`.
     *
     * ET LE TEST PORTAIT SUR LA MAUVAISE CHOSE. Il lisait `!mur.telephone`,
     * or `murDeLaCarte` remplit TOUJOURS ce champ — avec le vrai numéro, ou
     * avec celui de fiction. La condition ne pouvait donc jamais être vraie,
     * et ce garde-fou n'a jamais rien gardé : WhatsApp s'ouvrait sur le carnet
     * d'adresses exactement comme avant. C'est `telFiction` qui distingue les
     * deux cas, et c'est lui qu'on lit.
     */
    const tel = mur.telephone || numeroDeFiction(mur.cle);
    if (mur.telFiction ?? !mur.telephone) {
      setEnvoi({ par: "fiction", telephone: tel });
      return;
    }
    const sienne = !!photo && !!rendu && !rendu.souci;
    const geste = (mur.essai?.mots.reserver ?? "Je réserve").replace(/^Je\s+/i, "Je ");
    const msg = prevenirPourEssai({
      telephone: tel,
      quoi: p.nom,
      geste,
      avecPhoto: sienne,
    });
    if (!sienne) {
      // Pas de rendu à soi : WhatsApp directement, avec le texte qui ne promet
      // aucune photo.
      window.open(msg.whatsapp, "_blank", "noopener,noreferrer");
      setEnvoi({ par: "whatsapp" });
      return;
    }
    const sortie = await partagerLEssai({
      image: rendu.image,
      nom: `essai-${p.id}`,
      texteAvecPhoto: msg.texte,
      whatsapp: prevenirPourEssai({ telephone: tel, quoi: p.nom, geste, avecPhoto: false }).whatsapp,
      // LE NUMÉRO D'ABORD : ce bouton écrit AU COMMERÇANT, dont on n'a pas le
      // numéro. La feuille de partage ouvrait la liste d'amis pour un message
      // adressé à un opticien. Voir `viser` dans `partager-essai.ts`.
      viser: "commercant",
    });
    setEnvoi(sortie);
  };

  /**
   * ENVOYER LA PHOTO, EN SECOND GESTE ET SEULEMENT SI ON LE DEMANDE.
   *
   * `wa.me` connaît le numéro mais ne transporte pas d'image ; la feuille de
   * partage transporte l'image mais ne connaît personne. On ne peut pas avoir
   * les deux d'un coup — alors on les fait l'un après l'autre, dans l'ordre qui
   * a du sens : d'abord le message arrive, ensuite la photo suit pour qui veut.
   */
  const envoyerLaPhoto = async (p: Piece) => {
    if (!rendu || rendu.souci) return;
    const tel = mur.telephone || numeroDeFiction(mur.cle);
    // MÊME RÈGLE QUE `prevenir` : sur un numéro de fiction, on ne propose pas
    // un chemin dont on sait qu'il finira dans le carnet d'adresses.
    if (mur.telFiction ?? !mur.telephone) {
      setEnvoi({ par: "fiction", telephone: tel });
      return;
    }
    const geste = (mur.essai?.mots.reserver ?? "Je réserve").replace(/^Je\s+/i, "Je ");
    const msg = prevenirPourEssai({ telephone: tel, quoi: p.nom, geste, avecPhoto: true });
    setEnvoi(
      await partagerLEssai({
        image: rendu.image,
        nom: `essai-${p.id}`,
        texteAvecPhoto: msg.texte,
        whatsapp: msg.whatsapp,
        viser: "quiconque",
      }),
    );
  };

  /**
   * PARTAGER CE QU'ON VIENT D'ESSAYER — le geste de droite dans la maquette.
   *
   * IL NE S'ADRESSE À PERSONNE EN PARTICULIER, et c'est ce qui le distingue du
   * bouton du troisième temps : celui-là écrit AU COMMERÇANT pour réserver,
   * celui-ci montre le rendu à qui l'on veut. D'où `viser: "quiconque"`, et
   * d'où l'absence de numéro — il n'y a pas de destinataire à connaître.
   *
   * IL N'EXISTE QUE SUR UN VRAI RENDU. Partager « son » essai alors que l'image
   * est la photo d'exemple du commerçant serait montrer la main de quelqu'un
   * d'autre en disant qu'elle est la sienne.
   */
  const partagerLeLook = async (p: Piece) => {
    if (!rendu || rendu.souci || !photo) return;
    setEnvoi(
      await partagerLEssai({
        image: rendu.image,
        nom: `essai-${p.id}`,
        texteAvecPhoto: `Regarde — je viens d’essayer « ${p.nom} » sur ClikMe.`,
        viser: "quiconque",
      }),
    );
  };

  /**
   * ═══ LA VITRINE ET LA RÉSERVE ═════════════════════════════════════════════
   *
   * « Le client ne voit surtout pas toute la collection au départ. ClikMe doit
   * réduire le choix, pas recréer un Zalando local. »
   *
   * LA GRILLE NE MONTRE QUE LA VITRINE — quatre à six pièces. La réserve, elle,
   * n'existe que pour « Surprends-moi », et c'est ce qui rend le bouton
   * intéressant : il sort des pièces que personne n'aurait vues. Voir `vitrine`
   * dans `lib/direct/fantomes.ts`.
   *
   * LE REPLI MONTRE TOUT, ET IL EST VOLONTAIRE. Un métier dont aucune pièce
   * n'est marquée — c'est le cas de tous ceux qui n'ont pas encore été repris —
   * garde exactement la grille qu'il avait. Un drapeau absent ne doit jamais
   * vider un écran qui marchait.
   */
  /**
   * CE QU'IL LUI RESTE, PIÈCE PAR PIÈCE.
   *
   * LU ICI PLUTÔT QUE PASSÉ EN PROPRIÉTÉ, pour la même raison que les alertes :
   * l'atelier s'ouvre depuis le fil, depuis la page du commerce et depuis le
   * relooking, et une donnée branchée à l'entrée aurait été oubliée par deux
   * de ces trois portes.
   */
  const taillesDites = useSyncExternalStore(abonnerTailles, chargerTailles, taillesVides);
  const taillesDe = (p: { id: string; tailles?: string[] }) =>
    taillesDeLaPiece(mur.cle, p, taillesDites);
  /* LA PHRASE EST CALCULÉE UNE FOIS POUR TOUTE LA GRILLE. Vingt-cinq vignettes
     qui relisent chacune le stockage, c'est vingt-cinq lectures par rendu —
     et la grille se redessine à chaque glissement du doigt. */
  const taillesDuLot = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of mur.essai?.pieces ?? []) {
      const t = taillesDeLaPiece(mur.cle, p, taillesDites);
      if (t) m[p.id] = phraseDesTailles(t);
    }
    return m;
  }, [mur.cle, mur.essai?.pieces, taillesDites]);

  const enVitrine = useMemo(() => {
    const toutes = mur.essai?.pieces ?? [];
    const choisies = toutes.filter((p) => p.vitrine);
    const base = choisies.length > 0 ? choisies : toutes;
    /**
     * LE RAYON DEMANDÉ DEPUIS LA VITRINE RESSERRE LA GRILLE — et il ne la vide
     * jamais. Une pastille « Robes » qui ouvre sur un écran vide apprend à ne
     * plus appuyer sur les pastilles ; quand le filtre ne trouve rien, on
     * montre la collection entière plutôt que le néant. Voir `rayons.ts`, qui
     * ne dessine d'ailleurs que les familles garnies.
     */
    if (!rayonPrechoisi) return base;
    const dedans = base.filter((p) => rayonDuNom(p.nom) === rayonPrechoisi);
    return dedans.length > 0 ? dedans : base;
  }, [mur.essai?.pieces, rayonPrechoisi]);

  /**
   * ═══ MA TAILLE ════════════════════════════════════════════════════════════
   *
   * C'EST LA SEULE CHOSE DE CET ÉCRAN QUI FASSE GAGNER DU TEMPS À QUELQU'UN
   * QUI CHERCHE VRAIMENT. Devant une vitrine, la question n'est pas « qu'est-ce
   * qui est joli » — on le voit — c'est « qu'est-ce qui existe dans ma
   * taille ». Personne d'autre ne peut y répondre, parce que personne d'autre
   * ne demande au commerçant ce qu'il lui reste.
   *
   * UNE SEULE TAILLE, GARDÉE DANS LE TÉLÉPHONE, JAMAIS ENVOYÉE. Pas de
   * mensurations, pas de profil : « je fais du 38 » suffit, et un tour de
   * poitrine ne servirait qu'à nous. Voir `maTaille` dans `lib/direct/tailles`.
   */
  const mienne = useSyncExternalStore(abonnerMaTaille, maTaille, maTailleVide);
  const [filtreTaille, setFiltreTaille] = useState(true);
  const [choisirSaTaille, setChoisirSaTaille] = useState(false);

  /**
   * LE BOUTON N'EXISTE QUE LÀ OÙ IL A DE QUOI RÉPONDRE.
   *
   * IL NE DÉPEND PAS DU MÉTIER MAIS DE CE QUI A ÉTÉ DÉCLARÉ, et c'est plus
   * juste qu'une liste de branches : un filtre par taille dans une boutique où
   * personne n'a rien rempli n'écarterait jamais rien, et un bouton qui ne fait
   * rien est le pire état d'un bouton.
   */
  const laTailleSeDemande = useMemo(
    () => enVitrine.some((p) => taillesDeLaPiece(mur.cle, p, taillesDites)),
    [enVitrine, mur.cle, taillesDites],
  );

  /**
   * TROIS CAS, PAS DEUX — et c'est toute la justesse du filtre.
   *
   *   · déclarée ET dans ma taille   → elle reste.
   *   · déclarée ET pas ma taille    → elle part. C'est ce qu'on a demandé.
   *   · PAS DÉCLARÉE                 → elle reste. Elle n'est pas « pas à ma
   *                                    taille » : on n'en sait rien. La cacher
   *                                    punirait le commerçant qui n'a pas
   *                                    encore rempli, et priverait le client
   *                                    d'une pièce qui lui allait peut-être.
   *
   * ET QUAND LE FILTRE NE LAISSE RIEN, ON NE TRICHE PAS. La grille du rayon se
   * rabat sur la collection entière quand elle ne trouve rien, parce qu'une
   * pastille n'est pas une demande. Une taille en est une : répondre « voilà
   * tout le magasin » à « qu'avez-vous en 38 » serait exactement le mensonge
   * qu'on est venu éviter. On dit qu'il n'y a rien, et on donne la sortie.
   */
  const grille = useMemo(() => {
    if (!mienne || !filtreTaille) return { pieces: enVitrine, ecartees: 0 };
    const gardees = enVitrine.filter(
      (p) => aMaTaille(taillesDeLaPiece(mur.cle, p, taillesDites), mienne) !== false,
    );
    return { pieces: gardees, ecartees: enVitrine.length - gardees.length };
  }, [enVitrine, mienne, filtreTaille, mur.cle, taillesDites]);

  /**
   * CE DANS QUOI « SURPRENDS-MOI » PIOCHE — la collection essayable entière.
   *
   * ON EN RETIRE CE QU'ON VIENT DE VOIR. Appuyer sur « Surprends-moi encore »
   * et retomber sur la même pièce est le seul résultat que ce bouton ne puisse
   * pas se permettre : il a promis une surprise, et il rend l'écran d'avant.
   * Quand il ne reste plus rien d'autre, on reprend tout plutôt que de ne rien
   * rendre — un bouton qui ne répond pas est pire qu'un bouton qui se répète.
   */
  /* `reste` COMPTAIT CE QUE LA VITRINE NE MONTRE PAS, pour la tuile
     « + N au hasard » qui terminait la bande des styles. La bande est partie
     avec l'écran qu'elle habitait ; le compte n'avait plus personne à qui le
     dire. Le chemin vers la réserve, lui, n'a pas bougé : c'est
     « Surprends-moi encore », sur l'écran du résultat. */

  /**
   * LES SIX PIÈCES QUI TOURNENT PENDANT LA RECHERCHE.
   *
   * ELLES VIENNENT DE LA COLLECTION ENTIÈRE, PAS DE LA VITRINE, et c'est
   * exactement ce qu'on veut montrer : il cherche AUSSI dans ce que vous
   * n'avez pas vu. Prises dans la vitrine, elles auraient rejoué les six
   * vignettes de l'écran précédent, et la fouille aurait eu l'air de tourner en
   * rond — littéralement.
   *
   * ELLES NE CHANGENT PAS PENDANT L'ANIMATION. Tirées à chaque rendu, elles
   * clignoteraient à chaque battement de la jauge ; figées au montage de
   * l'écran, elles tournent.
   */
  /**
   * QUELLE ATTENTE JOUER, ET C'EST LE MÉTIER QUI RÉPOND.
   *
   * Rempli, c'est la préparation des maquettes — un corps qu'on habille.
   * Vide, c'est le numéro en trois actes sur la photo du client, qui reste le
   * bon pour tout ce qui se pose sur une tête ou sur une main. Voir `genre`
   * dans `lib/direct/fantomes.ts`, et `Silhouette` plus haut.
   */
  const prepare: "femme" | "homme" | null =
    mur.essai?.genre === "femme" || mur.essai?.genre === "homme" ? mur.essai.genre : null;

  const piocher = (sauf?: Piece | null): Piece | null => {
    const toutes = (mur.essai?.pieces ?? []).filter((p) => !p.bientot);
    if (toutes.length === 0) return null;
    const autres = toutes.filter((p) => p.id !== sauf?.id);
    const dedans = autres.length > 0 ? autres : toutes;
    return dedans[Math.floor(Math.random() * dedans.length)];
  };

  /**
   * ═══ « SURPRENDS-MOI » ════════════════════════════════════════════════════
   *
   * « Lorsqu'un client potentiel manque d'imagination, alors il peut juste
   * laisser faire l'IA et choisir à sa place. »
   *
   * LE TIRAGE SE FAIT À L'ARRIVÉE, PAS AU DÉPART, et ce n'est pas un détail de
   * mise en œuvre. Tirer la pièce ici, puis jouer quatre secondes d'animation
   * de recherche par-dessus un choix déjà fait, serait une barre de progression
   * déguisée : l'écran jouerait une fouille dont le résultat est déjà dans la
   * mémoire. En tirant au bout, les quatre secondes sont le temps réel entre la
   * question et la réponse — court, mais vrai.
   */
  /** L'intention d'entrée a-t-elle déjà servi ? Voir `surprendre`. */
  const surpriseFaite = useRef(false);

  /**
   * ═══ « M'ALERTER POUR DES LOOKS SIMILAIRES ? » ════════════════════════════
   *
   * ELLE SE DÉCIDE ICI, ET NULLE PART AILLEURS. Une permission de notification
   * demandée dans un réglage ne veut rien dire : on ne sait pas de quoi on
   * parle. Demandée devant une pièce qu'on vient d'aimer, elle est évidente —
   * et elle reste explicable le jour où la notification tombe : « parce que
   * vous aviez adoré la veste kaki ». Voir `lib/direct/alertes-looks.ts`.
   */
  const alertes = useSyncExternalStore(
    abonnerAlertesLooks,
    chargerAlertesLooks,
    alertesLooksVides,
  );
  /* ON LIT LE STORE PLUTOT QU'UNE FONCTION DE LECTURE, pour que React sache de
     quoi dépend l'affichage : une fonction lirait le même cache sans rien
     déclarer, et la cloche ne se rallumerait qu'au rendu suivant. */
  const alerte = !!piece && alertes.some((x) => x.carte === mur.cle && x.piece === piece.id);

  /**
   * CE QUE LA PIÈCE FAIT SUR UN CORPS, EN UNE PROPOSITION.
   *
   * ELLE SERT DEUX FOIS SUR CET ÉCRAN — la bulle courte et le détail — et elle
   * dit un fait, jamais un jugement : ce que la pièce REMPLACE, pas si elle
   * « vous va ». Voir `couvre` dans `lib/direct/fantomes.ts` et `avisNeutre`.
   */
  const surLeCorps =
    piece?.couvre === "silhouette"
      ? "elle habille la silhouette entière"
      : piece?.couvre === "bas"
        ? "elle joue sur le bas, le haut reste libre"
        : "elle se porte sur le buste, avec ce que vous avez déjà";

  /**
   * LE CŒUR S'ENVOLE VERS LE COIN OÙ ON LE RETROUVERA.
   *
   * IL PART DU BOUTON, PAS DU MILIEU DE L'ÉCRAN, et c'est ce qui fait le lien :
   * on voit la chose qu'on vient de toucher monter vers le haut à droite, là où
   * vit la poche des gardés. Un cœur qui apparaît au centre dirait « bravo » ;
   * celui-ci dit OÙ C'EST PARTI.
   *
   * ON MESURE À L'INSTANT DU GESTE plutôt que d'écrire la trajectoire en dur :
   * le bouton n'est pas à la même place selon la longueur du libellé voisin, et
   * un départ écrit en points se décroche au premier changement de mot.
   */
  const lancerLeCoeur = (depuis: HTMLElement) => {
    const cadre = cadreRes.current?.getBoundingClientRect();
    const b = depuis.getBoundingClientRect();
    if (cadre && cadreRes.current) {
      const x = b.left + b.width / 2 - cadre.left;
      const y = b.top + b.height / 2 - cadre.top;
      // LE DÉPART, PUIS LE DÉPLACEMENT — et c'est le second qui compte. La
      // feuille de style ne peut pas soustraire le point de départ d'une cible
      // dans une même transformation sans que le calcul devienne illisible ;
      // on le fait ici, où l'on a les deux nombres sous la main. La cible est
      // le coin haut droit du cadre, à vingt-deux points des bords.
      const st = cadreRes.current.style;
      st.setProperty("--cx", `${Math.round(x)}px`);
      st.setProperty("--cy", `${Math.round(y)}px`);
      st.setProperty("--dx", `${Math.round(cadre.width - 22 - x)}px`);
      st.setProperty("--dy", `${Math.round(22 - y)}px`);
    }
    setCoeur((n) => n + 1);
  };

  const surprendsMoi = () => {
    if (!mur.essai?.pieces.some((p) => !p.bientot)) return;
    setRendu(null);
    setRate(false);
    setNote(0);
    setNoteVue(0);
    setCommentaire("");
    setMotOuvert(false);
    setPourquoi(false);
    setConseil(false);
    setMisDeCote(false);
    setEnvoi(null);
    setPlein(false);
    setBulle(0);
    setRevele(false);
    setAvant(false);
    setX(58);
    setSurprise(true);
    setEtape("recherche");
    jouer("essai");
  };

  /**
   * CHANGER DE STYLE SANS QUITTER SON VISAGE.
   *
   * LE MÊME GESTE SE FAIT DEPUIS DEUX ENDROITS — la bande des styles sous la
   * photo, et le nuancier de la carte flottante — et il doit remettre à zéro
   * exactement les mêmes choses. Écrit deux fois, il aurait fini par oublier la
   * note d'un côté : une note laissée sur la coupe précédente qui suivrait la
   * suivante serait un avis qu'on n'a pas donné, et il partirait sur le mur du
   * commerçant.
   */
  const changerDeStyle = (p: Piece) => {
    setPiece(p);
    // ON A DÉSIGNÉ CETTE PIÈCE-LÀ : ce n'est plus ClikMe qui a choisi, et
    // l'écran du résultat ne doit plus le prétendre.
    setSurprise(false);
    setAvant(false);
    setRendu(null);
    setRate(false);
    setNote(0);
    setNoteVue(0);
    setCommentaire("");
    setMotOuvert(false);
    setPourquoi(false);
    setConseil(false);
    setMisDeCote(false);
    setEnvoi(null);
    setPlein(false);
    setBulle(0);
    setRevele(false);
    setX(58);
    /**
     * ═══ LA PHOTO EST DEMANDÉE ICI, ET PAS AVANT ══════════════════════════
     *
     * DEPUIS QUE « EXPLORER LA COLLECTION » OUVRE LA GRILLE, on peut arriver
     * devant une pièce sans avoir rien donné. Lancer le calcul dans cet état
     * poserait le vêtement sur la photo de démonstration — c'est-à-dire sur
     * quelqu'un d'autre, et sans le dire.
     *
     * ET C'EST LE MEILLEUR MOMENT POUR LA DEMANDER. On vient de choisir une
     * pièce : la question « prenez une photo de vous » a enfin une réponse
     * évidente à « pour quoi faire ? ». Posée avant, elle demandait un visage
     * pour une raison qu'on n'avait pas encore.
     */
    setEtape(laPhoto ? "calcul" : "cadrer");
    // L'ESSAI PART : un glissement qui monte, et qui ne se referme pas.
    // C'est la révélation, une minute plus tard, qui finira la phrase.
    if (laPhoto) jouer("essai");
  };

  const poser = (verdict: "pris" | "passe" | "essaye") => {
    setDecide(verdict);
    // ON NE POSE QU'UNE FOIS. « Continuer » pose, et les gestes de l'écran
    // d'après — le salon, le rendez-vous, le favori — ne doivent pas reposer un
    // second fantôme sous le même prénom : le mur en afficherait trois pour un
    // seul essai. Voir `pose`, qui garde celui qu'on vient de laisser.
    if (pose) return;
    // ═══ POSER N'ÉCRIT PLUS AU COMMERÇANT ═══════════════════════════════
    //
    // « Quand j'appuie sur "mettre de côté", j'ai le texte d'un autre onglet
    // qui apparaît : "Son numéro appartient à la plage réservée à la
    // fiction…" »
    //
    // C'ÉTAIT VRAI TANT QUE LE BOUTON ROSE ÉTAIT « JE RÉSERVE ». Prévenir au
    // moment de poser évitait un écran intercalé, et Safari bloque un
    // `window.open` déclenché après un rendu. Mais ce bouton est devenu « Je
    // la mets de côté » — un geste qui ne demande rien à personne — et il
    // traînait la conversation derrière lui : on rangeait une pièce dans sa
    // poche, et un message pour le commerçant s'ouvrait.
    //
    // ÉCRIRE AU COMMERÇANT EST MAINTENANT UN GESTE À PART, et un seul :
    // « Réserver cet article ». Les métiers qui gardent l'écran « Et
    // maintenant ? » y ont leurs propres boutons pour ça.
    // ON CONSTRUIT LE FANTÔME UNE FOIS, ET ON S'EN SERT DEUX FOIS : la mémoire
    // le reçoit, l'écran le montre. Deux constructions séparées finiraient par
    // diverger — ce serait alors un aperçu qui ment sur ce qui a été posé.
    const f: Fantome = {
      id: `pose-${Date.now()}`,
      qui: "Vous",
      /**
       * LE FANTÔME PORTE VOTRE RENDU, PAS LA PHOTO DU CATALOGUE.
       *
       * Il portait `piece.photo` — l'image du produit chez le commerçant. Le mur
       * affichait donc une vignette de catalogue sous votre prénom, exactement
       * comme si vous n'aviez rien essayé. C'est le même défaut que le bouton
       * qui ne photographiait pas : ce qui est montré n'est pas ce qui a été
       * fait.
       *
       * ET C'EST TOUT L'INTÉRÊT DU MUR : ce qui donne envie d'essayer, c'est de
       * voir la chose sur QUELQU'UN, pas sur fond blanc. Un mur de vignettes
       * produit est un catalogue de plus.
       */
      photo: rendu?.image ?? piece?.rendu ?? piece?.photo ?? mur.photoLieu,
      // LA NOTE PART AVEC L'ESSAI, ET SEULEMENT SI ON EN A DONNÉ UNE. Zéro
      // n'est pas « mauvais », c'est « pas noté » : l'écrire comme une note
      // inventerait un avis que personne n'a donné.
      // `essaye` VEUT DIRE « ESSAYÉ, PAS ENCORE DÉCIDÉ » — c'est-à-dire `null`
      // dans la mémoire, qui connaît ce cas depuis le début : c'est celui des
      // fantômes des autres qu'on lit sur le mur sans savoir s'ils sont revenus.
      essai: {
        quoi: piece?.nom ?? "",
        verdict: verdict === "essaye" ? null : verdict,
        ...(note ? { note } : {}),
      },
      /**
       * CE QU'ON ÉCRIT SOUS SON PROPRE FANTÔME DÉPEND DE CE QU'ON A NOTÉ.
       *
       * SANS LA NOTE, IL NE RESTAIT QUE DEUX PHRASES POSSIBLES, et elles
       * disaient seulement si on avait acheté. Le mur affichait donc « je passe
       * la prendre » sous un rendu qu'on avait mis à cinq fantômes comme sous
       * un rendu qu'on avait mis à trois : deux essais très différents, un seul
       * mot. Avec la note, la phrase dit ce qu'on a pensé DE SOI dans cette
       * pièce-là — et c'est ça que le suivant vient lire.
       */
      // ═══ SES MOTS PASSENT DEVANT LES NÔTRES ═══
      //
      // La phrase écrite ici est un REPLI, pas un texte. Dès que quelqu'un a
      // écrit quelque chose, c'est le sien qui part sur le mur : « Je ne pensais
      // pas qu'il m'irait aussi bien » vaut tous les gabarits qu'on pourrait
      // composer, et c'est précisément ce que les autres viennent lire.
      mot: commentaire.trim() ||
        (verdict === "pris"
          ? note >= 4
            ? "Essayé à l’instant, et c’est exactement ça. Je passe la prendre."
            : "Essayé à l’instant, je passe la prendre."
          : verdict === "essaye"
            ? // ON NE FAIT PAS PARLER QUELQU'UN QUI N'A PAS TRANCHÉ. Il a essayé
              // et il demande autour de lui : la phrase dit exactement ça, et
              // rien de plus. Lui prêter « j'adore » ou « pas pour moi » serait
              // écrire un avis à sa place, sur le mur d'un commerçant.
              note >= 4
              ? "Essayé à l’instant. Ça me plaît — je demande leur avis à mes amis."
              : "Essayé à l’instant. J’en parle autour de moi avant de décider."
            : note && note <= 2
              ? "Essayé à l’instant. Pas pour moi du tout — au moins je sais."
              : "Essayé à l’instant. Pas pour moi, mais ça m’a évité de me tromper."),
      heure: new Date().toTimeString().slice(0, 5),
      interesses: 0,
      jusqua: "encore 2 jours",
    };
    /**
     * ET RIEN NE PART SI ON N'A PAS LAISSÉ LA CASE COCHÉE.
     *
     * C'EST LE SEUL ENDROIT OÙ LA CASE AGIT, et il faut qu'il n'y en ait qu'un :
     * l'écran de la photo promet que rien n'est partagé sans accord, et une
     * promesse tenue à deux endroits finit par n'être tenue qu'à un.
     *
     * ON NE GARDE MÊME PAS L'APERÇU. `pose` sert à MONTRER ce qui vient d'être
     * posé sur le mur — « voilà ce qui vient d'être posé, ici, pour deux
     * jours ». Le montrer alors que rien n'a été posé serait le mensonge exact
     * qu'on vient de corriger, en plus poli.
     */
    if (!partage) return;
    setPose(f);
    onPose(f);
  };

  /**
   * LES MOTS DU MÉTIER. Sans eux, cet écran n'a rien à dire : voir `Mur.essai`
   * dans `lib/direct/fantomes.ts`. Le garde est là pour le type, pas pour un cas
   * qui arrive — un mur d'essai sans mots ne compile pas.
   */
  const mots = mur.essai?.mots;
  if (!mur.essai || !mots) return null;

  /** Le lien vers le mur : un seul, discret, toujours au même endroit. */
  const versLeMur = (
    <button type="button" className="mu-e-mur" onClick={onMur}>
      {mots.mur}
      <i aria-hidden="true">→</i>
    </button>
  );

  return (
    <>
      {/* LE CHAMP DE FICHIER VIT AU-DESSUS DES ÉTAPES, ET PAS DANS L'UNE
          D'ELLES. Il était dans l'écran « cadrer » : depuis l'écran de rendu, où
          l'on propose maintenant de reprendre la photo, il n'existait plus.
          Un bouton qui pointe vers un champ démonté ne fait rien — et un bouton
          qui ne fait rien, on a déjà payé pour savoir que ça ne se voit pas. */}
      {/* ═══ DEUX CHAMPS, PARCE QUE LE MENU D'IOS NE SUFFIT PAS ═══════════════

          « Avec un téléphone, la prise de photo ne fonctionne pas. Je peux juste
          télécharger une photo de ma photothèque. »

          UN SEUL CHAMP `accept="image/*"` LAISSE LE TÉLÉPHONE DÉCIDER, et il
          décide mal : dans un cadre embarqué, Safari retire silencieusement
          « Prendre une photo » du menu — on ne voit qu'une entrée, et rien ne
          dit pourquoi. L'autorisation de l'iframe est corrigée par ailleurs,
          mais ça ne suffit pas : un menu à trois entrées dont la bonne dépend du
          contexte n'est pas une interface, c'est une loterie.

          DEUX BOUTONS, DEUX CHAMPS, DEUX INTENTIONS. `capture` sur le premier
          demande l'appareil photo directement — plus de menu du tout. Le second
          reste sans `capture` et ouvre la photothèque. Chacun dit ce qu'il fait
          avant qu'on appuie.

          ET LA CAMÉRA CHOISIE VIENT DU MÉTIER. On se photographie de face chez
          un coiffeur ou un lunetier — caméra avant ; on photographie sa main,
          son avant-bras ou sa table — caméra arrière. Le gabarit le sait déjà :
          « cadre » veut dire un visage ou un buste, tout le reste est à bout de
          bras. Une caméra qui s'ouvre du mauvais côté fait retourner le
          téléphone à chaque essai. */}
      <input
        ref={appareil}
        type="file"
        accept="image/*"
        capture={mur.essai?.gabarit?.forme === "cadre" ? "user" : "environment"}
        className="mu-fichier"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const lecteur = new FileReader();
          lecteur.onload = () => {
            setPhoto(String(lecteur.result));
            setRendu(null);
            setPiece(null);
            setRate(false);
            setEtape("cadrer");
          };
          lecteur.readAsDataURL(f);
          e.target.value = "";
        }}
      />
      <input
        ref={fichier}
        type="file"
        accept="image/*"
        className="mu-fichier"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const lecteur = new FileReader();
          lecteur.onload = () => {
            setPhoto(String(lecteur.result));
            setRendu(null);
            setPiece(null);
            setRate(false);
            // ON REVIENT TOUJOURS AU VISEUR, D'OÙ QUE PARTE LA REPRISE.
            //
            // La photo revient AVEC le repère par-dessus : c'est le seul moment
            // où l'on peut voir si son poignet, sa table ou sa main tombent là
            // où le calcul les attend, et reprendre sinon. Enchaîner directement
            // sur le choix rendrait le gabarit décoratif.
            //
            // ET C'EST INDISPENSABLE DEPUIS L'ÉCRAN DE RENDU, où l'on peut
            // désormais reprendre : sans ça, on restait sur « 3 · Décider » avec
            // une nouvelle photo et plus aucune pièce choisie — donc un écran
            // vide.
            setEtape("cadrer");
          };
          lecteur.readAsDataURL(f);
          e.target.value = "";
        }}
      />

      {/* ═══ LA FRISE DES TROIS TEMPS, ET ELLE REVIENT ═══════════════════════

          ELLE AVAIT ÉTÉ RETIRÉE, ET C'ÉTAIT JUSTE À L'ÉPOQUE. Elle disait
          « 1 · CADRER  2 · CHOISIR  3 · DÉCIDER » au-dessus d'un écran qui
          n'avait encore rien montré : trois mots de logiciel qui prévenaient
          qu'il allait falloir en faire trois. Un parcours court n'a pas besoin
          qu'on l'annonce quand chaque écran ne montre qu'une chose.

          CE QUI A CHANGÉ DEPUIS, ET QUI LA RAPPELLE : le parcours ne s'arrête
          plus au rendu. Il va jusqu'à l'avis, au mur du commerçant et au salon —
          « je vois, j'essaie, je note, on en parle ». Le troisième temps n'est
          plus une corvée annoncée, c'est la promesse qui donne envie de faire
          les deux premiers, et c'est lui qu'on ne devinait pas.

          ET LES MOTS SONT CEUX DE LA MAQUETTE : « Je découvre », « J'essaie »,
          « Je donne mon avis ». À la première personne, comme tout ce que dit ce
          produit, et jamais à l'infinitif d'un mode d'emploi.

          ELLE NE S'AFFICHE PAS PENDANT LE CALCUL. Ces douze secondes sont le
          moment qu'on a passé un échange entier à rendre mémorable ; une frise
          posée au-dessus y remettrait un logiciel en train de travailler. */}
      {etape !== "calcul" && etape !== "recherche" && etape !== "avis" && (
        <ol className="mu-frise" aria-label="Où vous en êtes">
          {(["Je découvre", "J’essaie", "Je donne mon avis"] as const).map((mot, k) => {
            // L'ACTION COMMERCIALE RESTE DANS LE TROISIEME TEMPS, ET CE N'EST
            // pas un raccourci : « Merci pour votre avis » est ce qui SUIT
            // l'avis, pas une quatrieme etape. Une frise a quatre temps aurait
            // annonce un parcours plus long qu'il ne l'est.
            const ou = etape === "agir" ? 2 : 0;
            return (
              <li
                key={mot}
                className={k === ou ? "ici" : k < ou ? "fait" : undefined}
                aria-current={k === ou ? "step" : undefined}
              >
                <i aria-hidden="true">{k < ou ? "✓" : k + 1}</i>
                <span>
                  {k + 1}. {mot}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* ═══ UNE PHRASE, ET C'EST TOUT ═══════════════════════════════════════

          « Là aussi c'est super compliqué. Il faut simplifier le message, pour
          que ce soit clair, simple et compréhensible immédiatement. »

          IL Y AVAIT QUATRE CHOSES À LIRE AVANT LE VISEUR : « Laisse ton Fantôme
          chez une prothésiste ongulaire », « Photographiez votre main,
          choisissez la pièce : votre fantôme l'essaie pour vous », « Il reste sur
          le mur que vous la preniez ou non », et la frise « 1 · CADRER
          2 · CHOISIR 3 · DÉCIDER ». Trois d'entre elles parlaient du fantôme et
          du mur — c'est-à-dire de ce qui se passe APRÈS, pour quelqu'un qui n'a
          pas encore compris ce qu'on lui propose.

          LA FRISE DES TROIS ÉTAPES EST PARTIE AVEC. Un parcours de trois écrans
          n'a pas besoin qu'on l'annonce : chaque écran ne montre qu'une chose,
          et la montrer suffit. Une frise numérotée sur un parcours aussi court ne
          rassure pas, elle prévient qu'il va falloir en faire trois.

          IL RESTE LE TITRE DU MÉTIER ET SA PHRASE. Elles ne sont pas écrites ici :
          elles viennent du mur, parce qu'un coiffeur et une onglerie ne disent pas
          la même chose. Voir `mots` dans `lib/direct/fantomes.ts`. */}
      {/* LE TITRE DU MÉTIER NE SERT QUE TANT QU'ON N'A RIEN VU. Sur le rendu il
          était déjà parti ; il part aussi de l'avis, pour la même raison et une
          de plus : cet écran POSE SA PROPRE QUESTION — « Alors, ça vous plaît ? »
          — et deux titres l'un au-dessus de l'autre font qu'on ne lit ni l'un ni
          l'autre. */}
      {/* ═══ UN SEUL TITRE PAR ÉCRAN ═════════════════════════════════════════

          LE RENDU N'EN AVAIT DÉJÀ PLUS, L'AVIS POSE LA SIENNE — « Alors, ça vous
          plaît ? » — et l'écran de la photo a maintenant la sienne aussi, qui
          dit exactement quoi photographier. Mesuré : on lisait « Cette bougie,
          chez vous » PUIS « Photographiez l'endroit où elle ira », l'un sous
          l'autre, avec leurs deux phrases. Deux titres empilés ne se lisent ni
          l'un ni l'autre, et le premier repoussait les conseils de cent points.

          IL NE RESTE DONC QUE `choisir`, qui n'a pas de titre à lui : c'est une
          grille, et « Choisissez la bougie » est ce qu'il faut y lire. */}
      {etape === "choisir" && (
        <div className="mu-e-tete">
          <h2>{mots.choisir}</h2>
          {/* LA DEUXIÈME LIGNE EST CE QUI OUVRE LA PORTE DU BOUTON D'À CÔTÉ.
              « Choisissez une pièce » seul présente un catalogue ; « ou laissez
              ClikMe choisir pour vous » annonce qu'il existe un autre chemin
              pour ceux qui n'ont rien en tête — c'est-à-dire la plupart des
              gens devant une vitrine. La maquette la met là, avant la carte,
              et c'est le bon ordre : on propose le raccourci à quelqu'un qui
              vient juste d'apprendre qu'il va devoir choisir. */}
          {mots.surprends && <p className="mu-e-ou">ou laissez ClikMe choisir pour vous</p>}
        </div>
      )}

      {etape === "cadrer" && (
        <div className="mu-cadrer">
          {/* ═══ L'ÉCRAN DE LA PHOTO, D'APRÈS LA MAQUETTE ═════════════════════

              IL NE DISAIT QU'UNE PHRASE, et c'était une phrase de trop et trois
              de moins. « Reculez d'un pas et cadrez la table entière » est un
              conseil ; il en faut quatre, parce que ce sont EUX qui décident de
              la qualité du rendu. Un cadrage moyen donne un rendu moyen, et
              c'est la dernière chose qu'on puisse encore corriger — après, il
              n'y a plus que « reprendre la photo ».

              ET CE NE SONT PAS LES MÊMES D'UN MÉTIER À L'AUTRE. « En pied si
              possible » n'a aucun sens devant une table de salon, « reculez d'un
              pas » n'en a aucun devant un visage. Ils sont donc écrits à côté
              des autres mots du métier, dans `fantomes.ts`, où une phrase fausse
              se voit en lisant la ligne du dessus.

              LES CONSEILS ET LA PHOTO PARTAGENT UNE LIGNE. La maquette les met
              côte à côte, et elle a raison : on lit un conseil, on regarde
              l'exemple, on revient. Empilés, il faut faire défiler entre les
              deux — c'est-à-dire les comparer de mémoire. */}
          <div className="mu-ph-tete">
            <h2>{mur.essai.mots.photoTitre}</h2>
            <p>{mur.essai.mots.photoSous}</p>
          </div>
          <div className="mu-ph">
            <ul className="mu-ph-l">
              {mur.essai.mots.conseils.map((c) => (
                <li key={c.titre}>
                  <i aria-hidden="true">
                    <Trace cle={c.picto} />
                  </i>
                  <span>
                    <b>{c.titre}</b>
                    <em>{c.detail}</em>
                  </span>
                </li>
              ))}
            </ul>
            {/* LE VISEUR EST POSE SUR LA PHOTO, PAS SUR DU VIDE. Un cadre vide
                demande d'imaginer ce qu'on photographie ; la photo dessous le
                montre, et c'est elle qui reviendra au rendu — meme bras, meme
                lumiere, meme fond. */}
            <div className="mu-ph-v">
              <Viseur photo={laPhoto} gabarit={mur.essai?.gabarit} />
              {/* ON DIT QUE CE N'EST PAS LA SIENNE, ET ON LE DIT SUR L'IMAGE.
                  Tant qu'aucune photo n'a été prise, celle du viseur vient du
                  dépôt : sans ce mot, on croit reconnaître un aperçu de soi. */}
              {!photo && <span className="mu-ph-x">Exemple de photo</span>}
            </div>
          </div>
          {/* LE BOUTON OUVRE VRAIMENT L'APPAREIL PHOTO.
              Il ne le faisait pas : il faisait avancer l'écran, et l'essai se
              calculait sur une photo du dépôt. « J'arrive sur photographier ma
              main, je clique, et j'ai le résultat sur la main de quelqu'un
              d'autre. » Tant que le rendu était simulé le défaut passait
              inaperçu ; du jour où il est calculé, il vide l'essai de son sens —
              tout ClikMe tient dans « SUR MOI ».
              Pas d'attribut `capture` : sur iPhone, le laisser force l'appareil
              et retire « Photothèque ». Or on veut les deux — une main à plat se
              photographie souvent mieux à deux mains, donc avant. */}
          {photo ? (
            <>
              <button
                type="button"
                className="mu-cta plein"
                onClick={() => {
                  // L'INTENTION SE CONSOMME ICI, ET UNE SEULE FOIS. Si l'on
                  // revient reprendre la photo après coup, on repart sur la
                  // grille : la surprise a déjà eu lieu.
                  if (surprendre && !surpriseFaite.current) {
                    surpriseFaite.current = true;
                    surprendsMoi();
                    return;
                  }
                  // ET SI LA PIÈCE EST DÉJÀ CHOISIE, ON NE REPASSE PAS PAR LA
                  // GRILLE. C'est le chemin de « Explorer la collection » : on
                  // a désigné une pièce, on nous a demandé la photo, on vient
                  // de la donner — il ne reste qu'à calculer. Renvoyer vers la
                  // grille ferait rechoisir ce qu'on a déjà choisi.
                  if (piece && !rendu) {
                    setEtape("calcul");
                    jouer("essai");
                    return;
                  }
                  // LA MÊME RÈGLE POUR LA PIÈCE DÉSIGNÉE DEPUIS LA VITRINE :
                  // une seule fois, et seulement si elle est essayable.
                  const voulue = mur.essai?.pieces.find(
                    (x) => x.id === piecePrechoisie && !x.bientot,
                  );
                  if (voulue && !surpriseFaite.current) {
                    surpriseFaite.current = true;
                    changerDeStyle(voulue);
                    return;
                  }
                  setEtape("choisir");
                }}
              >
                <i aria-hidden="true">👉</i>
                <span>
                  <b>{mots.choisir}</b>
                  <em>Vérifiez que le repère tombe bien sur {mur.essai.partie}</em>
                </span>
              </button>
              <button type="button" className="mu-exemple" onClick={() => appareil.current?.click()}>
                Reprendre la photo
              </button>
            </>
          ) : (
            <>
              {/* LE GESTE PORTE LE MOT DU MÉTIER. « Photographier votre main »
                  chez une onglerie, « Me prendre en photo » chez un coiffeur :
                  ce n'est pas du style, c'est ce qu'il faut faire, et ce n'est
                  pas le même geste. */}
              <button
                type="button"
                className="mu-cta plein essai"
                onClick={() => appareil.current?.click()}
              >
                <i aria-hidden="true">
                  <Trace cle="photo" />
                </i>
                <span>
                  <b>{mots.geste}</b>
                </span>
                <s aria-hidden="true">→</s>
              </button>
              {/* LA PHOTOTHÈQUE EST LE SECOND GESTE, ET ELLE EST NOMMÉE. Une
                  main à plat se photographie souvent mieux à deux mains, donc
                  avant : il faut pouvoir choisir une photo déjà prise. */}
              <button
                type="button"
                className="mu-exemple"
                onClick={() => fichier.current?.click()}
              >
                Choisir une photo de ma photothèque
              </button>
              {/* ═══ « VOIR AVEC LA PHOTO D'EXEMPLE » EST PARTI ═══════════════

                  « Supprimer cette section en bas qui ne sert à rien. »

                  C'ETAIT UN GESTE DE DEMONSTRATION, PAS UN GESTE D'UTILISATEUR.
                  Il servait à montrer la maquette sans sortir sa propre main —
                  utile en salon, inutile pour quelqu'un qui vient essayer une
                  monture sur lui. Il proposait surtout, sur l'écran qui demande
                  une photo, une troisième porte à côté des deux vraies : se
                  photographier, ou prendre une photo déjà faite.

                  LE CHEMIN N'EST PAS PERDU : la photo d'exemple reste celle du
                  viseur tant qu'on n'a rien pris, et le badge du rendu continue
                  de dire « Photo d'exemple — ce n'est pas la vôtre ». */}
            </>
          )}
          {/* ═══ CE QU'ON PROMET AVANT DE DEMANDER UNE PHOTO ══════════════════

              « 🔒 Vos photos sont privées et ne sont pas partagées sans votre
              accord. »

              C'EST LA PHRASE LA PLUS IMPORTANTE DE L'ÉCRAN, et elle était en
              petit sous le bouton, mêlée à « gratuit, sans rendez-vous ». On
              demande à quelqu'un de se photographier : c'est le seul moment du
              produit où l'on peut le perdre pour de bon, et la seule chose qu'il
              veut savoir est ce qu'on va faire de l'image.

              ELLE EST VRAIE DEUX FOIS, et c'est pour ça qu'on peut l'écrire :
              rien ne part sur le mur avant la case du troisième temps, et le
              rendu qui passe par un modèle d'image n'est pas conservé. */}
          {/* ═══ ET LA PHRASE SUR LA VIE PRIVEE PART AVEC, SUR SA DEMANDE ═══

              « Supprimer cette section en bas qui ne sert à rien : Voir avec la
              photo d'exemple / Vos photos sont privées et ne sont pas partagées
              sans votre accord. »

              JE LA SIGNALE PLUTOT QUE DE LA RETIRER EN SILENCE, parce que sa
              PROPRE maquette la garde sous le bouton, et parce que c'est le seul
              moment du produit où l'on demande à quelqu'un de se photographier.
              Elle se remet en une ligne le jour où il le veut : elle est ici, en
              commentaire, à l'endroit exact où elle vivait.

                <p className="mu-prive">
                  <i aria-hidden="true">🔒</i>
                  Vos photos sont privées et ne sont pas partagées sans votre accord.
                </p>
          */}
        </div>
      )}

      {/* ═══ LA CARTE « SURPRENDS-MOI » ══════════════════════════════════════

          « Le rôle de ce bouton, c'est lorsqu'un client potentiel manque
          d'imagination : alors il peut juste laisser faire l'IA et choisir à sa
          place. »

          ELLE PASSE DEVANT LA GRILLE, ET C'EST TOUT SON SENS. Posée en dessous,
          elle serait le lot de consolation de celui qui n'a rien trouvé —
          c'est-à-dire qu'il faudrait d'abord échouer à choisir pour la
          découvrir. Au-dessus, elle est la première réponse à la seule question
          que se pose vraiment quelqu'un devant une vitrine : « qu'est-ce qui
          m'irait ? »

          ELLE DIT L'AVEU À VOIX HAUTE. « Je ne sais pas quoi prendre » n'est pas
          un sous-titre, c'est une pastille qu'on peut se reconnaître — et c'est
          ce qui rend le geste facile. Un bouton qui demande d'admettre qu'on
          hésite doit l'admettre le premier.

          ELLE N'EXISTE QUE LÀ OÙ IL Y A DE QUOI PIOCHER. Un métier sans mots de
          surprise, ou dont aucune pièce n'est essayable, n'affiche pas un
          bouton qui ne pourrait que décevoir. Voir `surprends` dans
          `lib/direct/fantomes.ts`. */}
      {etape === "choisir" && mots.surprends && mur.essai.pieces.some((p) => !p.bientot) && (
        <button type="button" className="mu-surp" onClick={surprendsMoi}>
          <span className="mu-surp-f" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FANTOME} alt="" />
          </span>
          <span className="mu-surp-t">
            <b>
              <i aria-hidden="true">✨</i> SURPRENDS-MOI
            </b>
            <em>
              Laissez ClikMe choisir {mots.surprends.quoi} pour vous.
            </em>
            <s>{mots.surprends.aveu}</s>
          </span>
          <span className="mu-surp-g" aria-hidden="true">
            →
          </span>
        </button>
      )}

      {/* LE TITRE DE LA GRILLE VIENT APRÈS LA CARTE, PAS AVANT. Sans lui, les
          deux chemins se lisaient comme un seul bloc et la grille avait l'air
          d'être la suite de la carte. « Ou choisissez une pièce » les sépare en
          trois mots, et le « ou » fait tout le travail. */}
      {etape === "choisir" && mots.surprends && (
        <h3 className="mu-pieces-t">Ou choisissez {mots.surprends.quoi === "un look" ? "une pièce" : mots.surprends.quoi}</h3>
      )}

      {/* ═══ MA TAILLE ════════════════════════════════════════════════════════

          LE SEUL FILTRE DE TOUT LE PRODUIT, ET IL N'EST PAS LÀ POUR FAIRE
          NOMBRE. Devant une vitrine on voit tout seul ce qui est joli ; ce
          qu'on ne voit pas, c'est ce qui existe dans sa taille — et c'est la
          seule question qui empêche de repartir avec quelque chose.

          IL NE S'AFFICHE QUE QUAND IL PEUT RÉPONDRE. Dans une boutique où
          personne n'a rien déclaré, il n'écarterait jamais rien : voir
          `laTailleSeDemande`. */}
      {etape === "choisir" && laTailleSeDemande && (
        <div className="mu-mt">
          <button
            type="button"
            className={`mu-mt-b${mienne && filtreTaille ? " on" : ""}`}
            aria-pressed={!!mienne && filtreTaille}
            /* LE MÊME BOUTON REFERME LE PANNEAU QU'IL A OUVERT. Sans ça, qui
               l'ouvre par curiosité n'a plus que le choix de donner sa taille
               ou de quitter l'écran — et personne ne donne quoi que ce soit
               pour se débarrasser d'un panneau. */
            onClick={() =>
              mienne ? setFiltreTaille((v) => !v) : setChoisirSaTaille((v) => !v)
            }
          >
            <i aria-hidden="true">📏</i>
            {mienne ? `Ma taille · ${mienne}` : "Ma taille"}
          </button>
          {mienne && (
            <button
              type="button"
              className="mu-mt-c"
              onClick={() => setChoisirSaTaille(true)}
            >
              Changer
            </button>
          )}
          {/* CE QUE LE FILTRE A ÉCARTÉ SE DIT. Une grille qui rétrécit sans
              raison visible se lit comme un catalogue plus pauvre ; le compte
              dit que c'est nous qui avons rangé, et combien. */}
          {mienne && filtreTaille && grille.ecartees > 0 && (
            <em>
              {grille.ecartees} pièce{grille.ecartees > 1 ? "s" : ""} écartée
              {grille.ecartees > 1 ? "s" : ""}
            </em>
          )}
        </div>
      )}

      {/* LE CHOIX DE SA TAILLE : les trois échelles, une seule pastille
          retenue. Pas de mensurations, pas de profil — « je fais du 38 » répond
          à toute la question, et le reste ne servirait qu'à nous. */}
      {etape === "choisir" && choisirSaTaille && (
        <div className="mu-mt-p">
          <p>Quelle taille portez-vous&nbsp;?</p>
          {ECHELLES.filter((e) => e.cle !== "unique").map((e) => (
            <div key={e.cle} className="mu-mt-r">
              {e.tailles.map((x) => (
                <button
                  key={x}
                  type="button"
                  className={mienne === x ? "on" : undefined}
                  aria-pressed={mienne === x}
                  onClick={() => {
                    choisirMaTaille(x);
                    setFiltreTaille(true);
                    setChoisirSaTaille(false);
                  }}
                >
                  {x}
                </button>
              ))}
            </div>
          ))}
          <span className="mu-mt-f">
            Gardée dans votre téléphone, elle ne part nulle part.
            {mienne && (
              <button type="button" onClick={() => { choisirMaTaille(null); setChoisirSaTaille(false); }}>
                Oublier ma taille
              </button>
            )}
          </span>
        </div>
      )}

      {etape === "choisir" && (
        <div className="mu-pieces">
          {grille.pieces.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.bientot ? "bientot" : undefined}
              disabled={p.bientot}
              // LA GRILLE REFAISAIT LA REMISE À ZÉRO À LA MAIN, et elle en
              // oubliait deux : la position de la glissière avant/après, qui
              // restait donc celle de l'essai précédent, et maintenant le
              // drapeau « c'est ClikMe qui a choisi ». Deux copies d'une même
              // remise à zéro divergent toujours d'un champ ; il n'y en a plus
              // qu'une, et c'est `changerDeStyle`.
              onClick={() => changerDeStyle(p)}
            >
              {/* UNE VIGNETTE DE VERNIS MONTRE LE VERNIS, PAS UNE PHOTO VOISINE.
                  « C'est les ongles que j'ai choisis, mais le résultat est
                  complètement différent. » Il avait raison : la vignette du
                  bordeaux affichait la photo des ongles blancs à cœurs rouges du
                  mur. On choisissait donc des cœurs et on recevait un aplat.
                  Une teinte se dessine — elle est toujours exacte, elle ne peut
                  pas se désynchroniser de ce que le calcul va poser, et elle ne
                  coûte pas une image. */}
              {p.vernis ? (
                <span className="mu-teinte" style={{ background: p.vernis.couleur }} aria-hidden="true" />
              ) : p.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo} alt="" />
              ) : (
                /* UNE PIÈCE QUI N'A PAS ENCORE SA PHOTO N'EN EMPRUNTE PAS UNE.
                   `src=""` ne laisse pas un cadre vide : le navigateur redemande
                   LA PAGE COURANTE comme si c'était une image, ce qui coûte un
                   aller-retour et salit la console. La tuile se dessine donc,
                   et elle dit ce qu'elle est : un rayon annoncé, pas livré. */
                <span className="mu-avenir" aria-hidden="true">
                  <Trace cle="vetement" />
                </span>
              )}
              <b>{p.nom}</b>
              <em>{p.prix}</em>
              {/* CE QU'IL LUI RESTE, SOUS LE PRIX. « Taille 38 » sur une
                  vignette est la seule chose qui répond, avant l'essai, à la
                  question qui empêche d'acheter : et sur MOI ? Une pièce non
                  renseignée n'affiche rien — voir `lib/direct/tailles.ts`,
                  qui explique pourquoi on ne remplit pas ce silence. */}
              {taillesDuLot[p.id] ? (
                <span className="mu-tl">{taillesDuLot[p.id]}</span>
              ) : mienne && filtreTaille ? (
                /* ═══ POURQUOI CELLE-CI EST RESTÉE ═══════════════════════════

                   MESURE : en cherchant du 48, la grille gardait une pièce et
                   n'affichait rien dessous. Elle avait raison de la garder —
                   une pièce non déclarée n'est pas « pas à votre taille », on
                   n'en sait rien — mais son silence, sous un filtre allumé, se
                   lisait comme une confirmation : « celle-ci est en 48 ».

                   LE FILTRE ALLUMÉ REND DONC L'ABSENCE VISIBLE, et seulement
                   lui : hors filtre, personne n'a posé la question, et écrire
                   « non indiqué » sur la moitié d'une vitrine ne ferait
                   qu'afficher les devoirs du commerçant. */
                <span className="mu-tl vide">Taille non indiquée</span>
              ) : null}
              {/* ON DIT CE QU'ON N'A PAS. Une piece dont le rendu n'existe pas
                  encore se voit, se lit, et ne se choisit pas — plutot que de
                  servir une image collee qui prouverait le contraire de ce
                  qu'on veut prouver. Voir `Piece` dans lib/direct/fantomes. */}
              {p.bientot && <s>Bientôt essayable</s>}
            </button>
          ))}
        </div>
      )}

      {/* RÉPONDRE « VOILÀ TOUT LE MAGASIN » À « QU'AVEZ-VOUS EN 38 » SERAIT LE
          MENSONGE QU'ON EST VENU ÉVITER. Quand le filtre ne laisse rien, on le
          dit, et on rouvre la grille d'un appui. */}
      {etape === "choisir" && grille.pieces.length === 0 && (
        <p className="mu-mt-v">
          Rien en {mienne} dans cette vitrine aujourd’hui.
          <button type="button" onClick={() => setFiltreTaille(false)}>
            Voir toute la collection
          </button>
        </p>
      )}

      {etape === "choisir" && (
        <button type="button" className="mu-exemple" onClick={() => setEtape("cadrer")}>
          ← Reprendre la photo
        </button>
      )}

      {/* ═══ ON CHERCHE POUR VOUS ════════════════════════════════════════════

          « Ça doit tourner et avoir de beaux effets spéciaux pour donner
          l'impression qu'il est en train de rechercher. »

          CE QUI TOURNE, ET POURQUOI CE N'EST PAS UN SABLIER. Un cercle qui
          tourne dit « attendez » ; ici, ce sont des VÊTEMENTS qui tournent
          autour du fantôme, et c'est une phrase complète : il fouille le
          portant, il en sort un, il en repose un autre. Les six vignettes sont
          de vraies pièces de la collection de ce magasin — on voit donc passer
          ce dans quoi il cherche, ce qui est la seule chose capable de rendre
          l'attente désirable plutôt que subie.

          LES ANNOTATIONS MANUSCRITES SONT LA VOIX DU FANTÔME. « Peut-être
          ça ? », « On regarde votre style… », « Juste pour vous… » : trois
          demi-phrases, écrites à la main, qui apparaissent et s'effacent l'une
          après l'autre. Elles font ce qu'un texte de chargement ne fait jamais
          — elles donnent une intention à la machine.

          ET LA FRISE DIT OÙ L'ON EN EST SANS POURCENTAGE. Trois temps, trois
          pictogrammes : la photo est analysée (c'est fait), on cherche le bon
          look (c'est en cours), presque prêt. Un nombre aurait demandé d'être
          vrai ; ces trois mots-là le sont. */}
      {/* ═══ UN SEUL ÉCRAN D'ATTENTE QUAND C'EST CLIKME QUI CHERCHE ════════

          « Quand je clique sur "Surprends-moi", j'ai DEUX écrans de
          préparation au lieu d'un seul. »

          IL AVAIT RAISON, ET C'ÉTAIT UN DÉFAUT DE RACCORD. Les deux écrans
          existent pour deux travaux différents : « ClikMe cherche » pendant
          qu'il pioche dans la collection, « Ton fantôme prépare » pendant que
          le rendu se calcule. Enchaînés, ils racontent deux fois la même chose
          à la personne qui attend — et le second efface le premier au moment
          précis où l'on commençait à le lire.

          LA RECHERCHE TIENT DONC TOUTE L'ATTENTE. Elle reste à l'écran pendant
          le calcul, sa frise arrêtée sur « Presque prêt ! », qui est exactement
          ce qui se passe. Le parcours choisi, lui, ne passe jamais par la
          recherche — il n'y a rien à chercher — et garde sa préparation. */}
      {(etape === "recherche" || (etape === "calcul" && surprise)) && (
        <div className="mu-rech" aria-live="polite">
          {/* LE FOND EST LA BOUTIQUE, FLOUTÉE. On cherche DANS un magasin, et
              le magasin doit être derrière — sinon la scène pourrait se passer
              n'importe où, y compris sur un serveur. */}
          {mur.photoLieu && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="mu-rech-fond" src={mur.photoLieu} alt="" aria-hidden="true" />
          )}
          <div className="mu-rech-t">
            <h2>
              ClikMe cherche
              <br />
              <b>ce qui pourrait vous aller…</b>
            </h2>
            <p>On a une idée pour vous&nbsp;!</p>
          </div>

          {/* LA GOUTTIÈRE EST UN CALQUE À PART, ET ELLE FAIT TOUTE LA LARGEUR.
              Les mots manuscrits étaient posés au bord de la SCÈNE, qui n'en
              occupe que trois quarts : « On regarde votre style… » partait donc
              quarante points au-delà du bord de la carte, où `overflow:hidden`
              le coupait en deux. Ce calque-ci fait la largeur de la carte et la
              hauteur de la scène : les mots s'accrochent à ses bords, qui sont
              les bons. */}
          <div className="mu-rech-g">
          <div className={`mu-rech-s t${cherche}`} aria-hidden="true">
            {/* LES DEUX ANNEAUX. Ils tournent à des vitesses différentes et dans
                des sens opposés : deux cercles concentriques à la même vitesse
                se lisent comme un seul objet, et l'effet de profondeur tombe. */}
            {/* ═══ LES RUBANS DE LUMIÈRE, ET ILS REMPLACENT L'ANNEAU ═══════

                LA MAQUETTE N'A PAS DE CERCLE AUTOUR DE LA SCÈNE. Elle a DEUX
                RUBANS qui s'enroulent autour du fantôme — l'un passe derrière
                lui, l'autre devant — et c'est cette traversée qui donne la
                profondeur. Un anneau qui englobe tout met la scène dans une
                boîte ; un ruban qui passe derrière quelqu'un le met DANS la
                scène.

                D'OÙ DEUX CALQUES ET NON UN. Le même dessin ne peut pas être
                à la fois devant et derrière : l'un porte le haut de l'ellipse
                et vit sous le fantôme, l'autre porte le bas et vit dessus. */}
            <span className="mu-rech-halo" />
            <span className="mu-rech-r" />

            {/* LES PIÈCES EN ORBITE. Six emplacements fixes sur l'ellipse, une
                pièce par emplacement, chacune avec son propre retard : sans le
                décalage elles entrent toutes ensemble et l'œil voit un
                clignotement au lieu d'une fouille. */}
            {/* LES QUATRE PIÈCES DE LA MAQUETTE — des vêtements détourés sur
                fond sombre, pas des mannequins en pied. Voir `LOOKS`, qui dit
                aussi pourquoi ce sont des accessoires de scène et non le
                stock. */}
            <span className="mu-rech-orb">
              {LOOKS.map((src, k) => (
                <span key={src} className={`mu-rech-v v${k}`} style={{ "--k": k } as React.CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </span>
              ))}
            </span>

            {/* LE FANTÔME TIENT SA LOUPE, ET C'EST UN SEUL DESSIN. Voir
                `FANTOME_LOUPE` : la main tient le manche, le verre porte son
                reflet, la lueur du tube éclaire le fantôme. Assemblé à partir
                de deux objets, on voyait un pictogramme flotter près d'un
                personnage — et le manche passait tantôt devant, tantôt
                derrière. */}
            <span className="mu-rech-f">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FANTOME_LOUPE} alt="" />
            </span>

            {/* LE SECOND RUBAN : celui qui passe DEVANT. Voir la note du
                premier — c'est la même ellipse, vue de l'autre côté. */}
            <span className="mu-rech-r b" />

            {/* LES TROIS MOTS MANUSCRITS. Ils ne se lisent pas tous en même
                temps — chacun a son quart de seconde — sinon l'écran devient
                bavard au moment exact où il ne doit qu'être joli. */}
            <span className="mu-rech-etoiles">
              {Array.from({ length: 10 }, (_, k) => (
                <i key={k} style={{ "--k": k } as React.CSSProperties} />
              ))}
            </span>
          </div>
          <i className="mu-rech-m m1" aria-hidden="true">Peut-être ça&nbsp;?</i>
          <i className="mu-rech-m m2" aria-hidden="true">On regarde votre style…</i>
          <i className="mu-rech-m m3" aria-hidden="true">Juste pour vous…</i>
          </div>

          <ol className="mu-rech-frise">
            {[
              { cle: "photo", mot: "Photo analysée" },
              { cle: "cintre", mot: "On cherche\nle bon look…" },
              { cle: "etoile", mot: "Presque prêt !" },
            ].map((t, k) => (
              <li
                key={t.cle}
                className={k === cherche ? "ici" : k < cherche ? "fait" : undefined}
                aria-current={k === cherche ? "step" : undefined}
              >
                <i aria-hidden="true">
                  <Trace cle={t.cle} />
                </i>
                <span>{t.mot}</span>
              </li>
            ))}
          </ol>

          {/* ON DIT OÙ IL CHERCHE, ET C'EST CE QUI REND LA PROMESSE TENABLE.
              « Quelque chose pour vous » tout court laisserait croire à une
              recommandation venue d'ailleurs ; « dans la collection du
              magasin » dit que ce qui va sortir est à cinq cents mètres, en
              stock, aujourd'hui. C'est toute la différence entre ClikMe et une
              application de mode. */}
          <p className="mu-rech-note">
            <i aria-hidden="true">
              <Trace cle="idee" />
            </i>
            <span>
              ClikMe sélectionne une pièce dans {mots.surprends?.ou ?? "la collection du magasin"},
              spécialement pour vous.
            </span>
          </p>

          <button
            type="button"
            className="mu-exemple"
            onClick={() => {
              setSurprise(false);
              setEtape("choisir");
            }}
          >
            ← Je choisis moi-même
          </button>
        </div>
      )}

      {/* ═══ L'ATTENTE, ET ELLE EST DEVENUE LE MOMENT LE PLUS IMPORTANT ═══════

          « Cette étape avant le résultat devrait être LE moment magique avant la
          découverte. Il faut que ça devienne un moment très spécial de
          l'expérience ClikMe, mémorable, avec une super animation — peut-être
          que le fantôme a une place importante dedans. »

          IL A RAISON, ET C'EST UN POINT DE PRODUIT, PAS DE DÉCORATION. Ces
          douze secondes sont le seul endroit du parcours où l'on ne peut RIEN
          faire : la photo est prise, la pièce est choisie, il n'y a plus qu'à
          attendre. Une barre de progression y dit « ce logiciel travaille » —
          c'est-à-dire la seule chose dont personne n'a envie à ce moment-là.
          Elle transforme de l'anticipation en patience, et l'anticipation est
          justement ce qu'on a de plus précieux ici.

          CE QU'ON MONTRE À LA PLACE : LE FANTÔME EMPORTE LA PHOTO. Il traverse
          l'écran en tenant la pièce choisie, il tourne autour, la poussière
          d'étoiles le suit, et derrière lui la photo du client se devine,
          floutée, qui se révèle au fur et à mesure. On ne regarde plus une
          barre : on regarde quelqu'un travailler sur SA photo.

          ET LES PHRASES CHANGENT AVEC L'AVANCEMENT. Un texte fixe pendant douze
          secondes devient un texte qu'on ne lit plus au bout de trois. Chacune
          dit une étape vraie du travail — il regarde, il prépare, il pose, il
          ajuste — et la dernière annonce la révélation. C'est un compte à
          rebours déguisé en récit, et c'est la différence entre attendre et
          espérer.

          LE POURCENTAGE RESTE, EN PETIT. On l'a gardé parce qu'il répond à la
          seule question honnête de l'attente : « est-ce que ça avance ? » Le
          retirer entièrement aurait remplacé l'ennui par l'inquiétude. */}
      {/* ═══ LA PRÉPARATION, D'APRÈS LES DEUX MAQUETTES ══════════════════════

          « Ton fantôme prépare ton essayage. Dans quelques secondes, vous allez
          voir le résultat. »

          ELLE NE REMPLACE PAS L'AUTRE ATTENTE, ELLE LA DOUBLE POUR UN MÉTIER.
          Le numéro en trois actes — le faisceau qui mesure le visage, le
          fantôme qui tourne, le rideau qui se retire — a été écrit pour ce
          qu'on pose SUR UNE TÊTE : une coupe, une monture, un vernis. Il
          travaille sur la photo du client parce que c'est là que ça se passe.
          Devant un vêtement, la question n'est pas « où est votre visage » mais
          « comment ça tombe sur vous », et c'est un corps qu'il faut montrer.

          CE QUE LA MAQUETTE DEMANDE, EXACTEMENT : un grand cercle au néon, une
          silhouette dont la moitié gauche est un maillage et la moitié droite
          une vraie pièce, le fantôme qui gravite à gauche, trois vignettes
          empilées à droite, une frise de trois pastilles dont les deux
          premières sont cochées, et la promesse de confidentialité en bas.

          LES DEUX PREMIÈRES PASTILLES SONT COCHÉES PARCE QU'ELLES LE SONT
          VRAIMENT : la photo a été prise, la pièce a été choisie. La troisième
          ne se coche jamais — elle demande « Prêt ? », et la réponse est
          l'écran suivant. */}
      {etape === "calcul" && prepare && !surprise && (
        <div className={`mu-prep ${acte}`} aria-live="polite">
          <div className="mu-prep-tete">
            <h2>
              Ton fantôme <b>prépare</b>
              <br />
              ton essayage
            </h2>
            <p>Dans quelques secondes, vous allez voir le résultat.</p>
          </div>

          <div className="mu-prep-s" aria-hidden="true">
            <span className="mu-prep-halo" />
            <span className="mu-prep-anneau" />
            <span className="mu-prep-anneau b" />

            <div className="mu-prep-bulle">
              {/* LA MOITIÉ DROITE EST LA VRAIE PIÈCE, pas un dessin de pièce.
                  C'est ce qui rattache l'attente À CET ESSAI-LÀ : on reconnaît
                  la veste qu'on vient de choisir en train d'arriver sur un
                  corps, plutôt qu'une animation qui pourrait être celle de
                  n'importe quel chargement. */}
              {piece?.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="mu-prep-piece" src={piece.photo} alt="" />
              )}
              <Silhouette genre={prepare} />
              {/* LE TRAIT DE LUMIÈRE QUI SÉPARE LES DEUX MOITIÉS. Il descend,
                  remonte, et c'est lui qui fait croire que quelque chose
                  s'applique — un dégradé fixe au milieu aurait été une image. */}
              <span className="mu-prep-ligne" />
            </div>

            {/* LE FANTÔME GRAVITE À GAUCHE, comme sur les deux maquettes, et
                le cœur bat à côté de lui. Il ne travaille pas à l'écran : il
                attend avec vous, ce qui est très exactement son rôle. */}
            <span className="mu-prep-f">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FANTOME} alt="" />
              <i className="mu-prep-coeur">♥</i>
            </span>

            {/* LES TROIS VIGNETTES DE DROITE : la pièce, et deux états du
                corps. La maquette les empile en escalier ; elles montent l'une
                après l'autre. */}
            {/* DEUX VIGNETTES, ET LA MAQUETTE EN DESSINE TROIS. Elle en dessine
                trois parce qu'un croquis peut en dessiner trois ; ici il n'y a
                que DEUX choses vraies à montrer — la pièce, et la photo qu'on
                lui donne. La troisième répétait la deuxième à l'identique, et
                une vignette qui répète la précédente ne raconte pas un travail,
                elle remplit une place. */}
            <span className="mu-prep-v">
              {piece?.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={piece.photo} alt="" style={{ "--k": 0 } as React.CSSProperties} />
              )}
              {laPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={laPhoto} alt="" style={{ "--k": 1 } as React.CSSProperties} />
              )}
            </span>

            <span className="mu-prep-etoiles">
              {Array.from({ length: 14 }, (_, k) => (
                <i key={k} style={{ "--k": k } as React.CSSProperties} />
              ))}
            </span>
          </div>

          {/* ═══ ELLE AVANCE, ELLE N'EST PLUS DESSINÉE D'AVANCE ══════════════

              « L'animation commence à peine et déjà je suis directement sur
              "Prêt ?" au lieu de commencer sur "je regarde votre photo". »

              LES TROIS ÉTATS ÉTAIENT ÉCRITS EN DUR : deux cochés, le troisième
              allumé, dès la première image. La frise racontait donc la fin de
              l'attente pendant toute l'attente — et comme elle ne bougeait
              plus, elle ne disait plus rien du tout.

              ELLE SUIT MAINTENANT LES TROIS ACTES, qui suivent eux-mêmes
              l'avancement réel du rendu : voir `acte`. « Je regarde votre
              photo » pendant que la détection travaille, « J'ajuste la pièce »
              pendant la pose, « Prêt ? » quand l'anneau se referme. C'est le
              même découpage que la scène juste au-dessus, donc les deux
              racontent la même chose au même moment — sans quoi on lirait deux
              horloges qui ne sont pas d'accord. */}
          <ol className="mu-prep-frise">
            {[
              { cle: "photo", mot: "Je regarde\nvotre photo…" },
              { cle: "vetement", mot: "J’ajuste\nla pièce…" },
              { cle: "fantome", mot: "👻 Prêt ?" },
            ].map((t, k) => {
              const ou = acte === "a1" ? 0 : acte === "a2" ? 1 : 2;
              return (
                <li
                  key={t.cle}
                  className={k === ou ? "ici" : k < ou ? "fait" : undefined}
                  aria-current={k === ou ? "step" : undefined}
                >
                  <i aria-hidden="true">
                    {t.cle === "fantome" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={FANTOME} alt="" />
                    ) : (
                      <Trace cle={t.cle} />
                    )}
                  </i>
                  <span>{t.mot}</span>
                </li>
              );
            })}
          </ol>

          {/* LA PROMESSE EST RÉPÉTÉE ICI, ET C'EST LE SEUL ENDROIT DU PARCOURS
              OÙ LA RÉPÉTER SE JUSTIFIE : c'est la seule seconde où la photo
              QUITTE VRAIMENT le téléphone. La dire au cadrage engage, la dire
              ici rassure — et ce sont deux besoins différents. */}
          <p className="mu-prep-prive">
            <i aria-hidden="true">🔒</i>
            <span>
              {telecharge
                ? "Première pose : on installe l’essayage, 19 Mo une seule fois."
                : "Votre photo sert uniquement au rendu et n’est pas conservée."}
            </span>
          </p>
          <div className="mu-jauge" aria-hidden="true">
            <i style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </div>
      )}

      {etape === "calcul" && !prepare && (
        <div className="mu-calcul" aria-live="polite">
          {/* ═══ L'ATTENTE EST DEVENUE UN NUMÉRO EN TROIS ACTES ══════════════

              « Le temps que la coiffure ou la pose du vêtement apparaisse,
              c'est un peu long, donc il va falloir améliorer l'animation du
              fantôme pour que ça fasse passer le temps. Il va falloir que tu
              fasses quelque chose de spectaculaire et d'original. »

              IL A RAISON, ET LA CAUSE EST DE NOTRE FAIT : depuis qu'on rend en
              qualité haute pour ses démonstrations, l'attente a doublé. Une
              animation qui tenait dix secondes doit en tenir quarante — et une
              boucle de trois secondes qu'on regarde treize fois devient une
              salle d'attente.

              TROIS ACTES, PARCE QU'UNE BOUCLE UNIQUE LASSE ET QU'UNE SÉQUENCE
              RACONTE. Ils suivent l'avancement réel, donc ils ne mentent pas :

                · IL VOUS REGARDE — un faisceau balaie votre photo de haut en
                  bas, et les points du visage s'allument sur son passage. On
                  voit une mesure se faire, et c'est vrai : c'est exactement ce
                  que MediaPipe fait à cet instant.
                · IL ESSAIE — le fantôme tourne autour de votre tête en portant
                  la pièce, passe derrière, ressort, et sème des étincelles.
                · IL AJUSTE — le voile se retire par le bas comme un rideau, la
                  photo revient nette, et l'anneau se referme sur cent pour
                  cent.

              ET L'ANNEAU EST LA VRAIE JAUGE. Un cercle qui se referme autour de
              son propre visage dit « ça avance » sans qu'on ait à lire un
              nombre, et il occupe l'œil pendant que le reste joue. */}
          <div className={`mu-cal-scene ${acte}`} aria-hidden="true">
            {/* SA PHOTO EST DERRIÈRE ET ELLE SE DÉCOUVRE. C'est elle l'objet de
                l'attente — pas un logo, pas un cercle qui tourne. */}
            {laPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mu-cal-fond" src={laPhoto} alt="" />
            )}
            <span className="mu-cal-voile" />

            {/* ─── ACTE 1 · LE FAISCEAU ET LE MAILLAGE ─── */}
            <span className="mu-cal-scan" />
            <svg className="mu-cal-maille" viewBox="0 0 100 100" focusable="false">
              {/* LES TRAITS SE DESSINENT AU PASSAGE DU FAISCEAU. C'est le même
                  cycle de deux secondes six : sans cette synchronisation, on
                  verrait deux animations au lieu d'un geste. */}
              {/* UN VISAGE, ET PAS UNE CONSTELLATION. Premier jet : trois
                  lignes brisées posées les unes sur les autres. Ça brillait, ça
                  se dessinait joliment, et ça ne ressemblait à rien — donc ça ne
                  disait pas « on mesure VOTRE visage », qui est tout l'effet.
                  L'ovale d'abord, les traits ensuite : on reconnaît avant de
                  comprendre.
                  `pathLength` à 100 rend le tiret indépendant de la longueur du
                  tracé : les trois se dessinent à la même vitesse, quel que
                  soit leur périmètre. */}
              <path
                className="mu-cal-t1"
                pathLength={100}
                d="M50 24 C64 24 72 37 72 52 C72 68 62 80 50 80 C38 80 28 68 28 52 C28 37 36 24 50 24 Z"
              />
              <path
                className="mu-cal-t2"
                pathLength={100}
                d="M38 46 q5 -5 10 0 M52 46 q5 -5 10 0"
              />
              <path
                className="mu-cal-t3"
                pathLength={100}
                d="M50 50 L50 60 M43 68 q7 5 14 0"
              />
              {MAILLE.map(([x, y], k) => (
                <circle
                  key={k}
                  cx={x}
                  cy={y}
                  r="1.5"
                  className="mu-cal-pt"
                  style={{ "--k": k } as React.CSSProperties}
                />
              ))}
            </svg>

            {/* ─── ACTE 2 · LE FANTÔME TOURNE AUTOUR DE VOUS ───
                Il porte la pièce : c'est ce qui relie l'animation à CET
                essai-là plutôt qu'à un chargement qui pourrait être n'importe
                lequel. L'orbite passe derrière la tête — voir `mu-cal-orbite`,
                où l'échelle et l'opacité font la profondeur. */}
            <span className="mu-cal-orbite">
              <span className="mu-cal-f">
                <Signe classe="mu-cal-s" />
                {piece?.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mu-cal-piece" src={piece.photo} alt="" />
                )}
              </span>
            </span>
            {/* LA POUSSIÈRE. Douze points, chacun sur sa propre orbite et son
                propre retard : sans le décalage ils battent ensemble et l'œil
                voit une pulsation au lieu d'un scintillement. */}
            <span className="mu-cal-poudre">
              {Array.from({ length: 12 }, (_, k) => (
                <i key={k} style={{ "--k": k } as React.CSSProperties} />
              ))}
            </span>

            {/* ─── ACTE 3 · LE RIDEAU SE RETIRE ─── */}
            <span className="mu-cal-rideau" />

            {/* L'ANNEAU DE PROGRESSION, et il porte le vrai pourcentage.
                `pathLength` à 100 évite de calculer la circonférence : le tracé
                se compte alors en centièmes, donc l'avancement s'y écrit tel
                quel. */}
            <svg className="mu-cal-jauge" viewBox="0 0 100 100" focusable="false">
              <circle className="mu-cal-rail" cx="50" cy="50" r="46.5" pathLength={100} />
              <circle
                className="mu-cal-fil"
                cx="50"
                cy="50"
                r="46.5"
                pathLength={100}
                style={{ strokeDashoffset: 100 - Math.min(100, pct) }}
              />
            </svg>
          </div>
          {/* CE QU'ON DIT PENDANT L'ATTENTE DÉPEND DE CE QU'ON FAIT VRAIMENT. La
              première pose d'ongles télécharge dix-neuf mégaoctets ; annoncer
              « ton fantôme prépare » pendant ce temps-là mentirait sur ce qui se
              passe et sur ce que ça coûte en données. Une fois pour toutes, et
              on le dit. */}
          <b className="mu-cal-dit">
            {telecharge ? "Première pose : on installe l’essayage…" : ETAPES[etapeDite]}
          </b>
          {/* CE QU'ON ANNONCE PENDANT L'ATTENTE DOIT ÊTRE CE QU'ON FAIT. Le
              rendu part chez un modèle : quelques secondes, et la photo sort du
              téléphone. Promettre « instantané et hors ligne » sur ce chemin-là
              serait un mensonge de plus, et on en a déjà payé deux. */}
          <em className="mu-calcul-p">
            {telecharge
              ? "19 Mo, une seule fois — ensuite c’est instantané, et hors ligne"
              : "Votre photo part le temps du rendu, et n’est pas conservée"}
          </em>
          <div className="mu-jauge" aria-hidden="true">
            <i style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <em>{Math.min(100, pct)} %</em>
        </div>
      )}

      {/* ═══ LE RÉSULTAT, ET IL DEVAIT ÊTRE UN ÉVÉNEMENT ══════════════════════

          « Cette page résultat n'est pas très fun alors qu'elle devrait être
          très aboutie au niveau UX et UI. Elle manque de caractère, et on
          devrait être aussi surpris par le résultat que par la page elle-même. »

          CE QUI CLOCHAIT : l'image apparaissait d'un coup, posée à plat, suivie
          de deux boutons et de trois liens soulignés. Tout le parcours amène à
          CETTE seconde-là — on s'est photographié, on a choisi, on a attendu —
          et l'écran la traitait comme l'affichage d'un résultat de recherche.

          CE QUI CHANGE : LA PHOTO SE RÉVÈLE AU LIEU D'APPARAÎTRE. Un voile
          lumineux la balaie une fois, de haut en bas, et le cadre respire une
          fois — comme quelqu'un qui tourne un miroir vers vous. Ça dure sept
          cent cinquante millisecondes, ça ne se rejoue jamais, et c'est ce qui
          fait la différence entre « voici une image » et « regardez ».

          ET ON DEMANDE CE QU'ON EN PENSE, TOUT DE SUITE APRÈS. La note en
          fantômes est posée sous l'image, avant les boutons de décision : c'est
          la réaction qui vient en premier dans la tête, donc c'est elle qu'on
          recueille en premier à l'écran. */}
      {/* LES DEUX DERNIERS TEMPS PARTAGENT LE MÊME CADRE, et ce n'est pas une
          économie de lignes : on doit VOIR ce qu'on note. Une page d'avis qui
          n'affiche plus le rendu demande de se souvenir de ce qu'on jugeait, et
          c'est précisément à ce moment-là que la note devient approximative. */}
      {/* ═══ « ALORS, ÇA VOUS PLAÎT ? » — LA MAQUETTE, AU TRAIT ══════════════

          « On a une étape en trop : quand j'obtiens le résultat, j'arrive sur
          un écran au lieu d'arriver directement sur la maquette. Il faut
          respecter le design scrupuleusement pour que l'utilisateur ait un bon
          ressenti. »

          CE QUE LA MAQUETTE FAIT, ET QUE L'ANCIEN ÉCRAN NE FAISAIT PAS : LA
          PHOTO EST LE FOND. Bord à bord, du haut de l'écran au bas, et tout le
          reste est POSÉ DESSUS — le titre en haut, les fantômes qui mordent sur
          le bas de l'image, les deux gestes sous eux. L'ancien la rangeait dans
          une boîte arrondie au milieu d'une colonne, avec le texte en dessous :
          le même contenu, mis en page comme un formulaire. Une photo en plein
          est ce qui fait qu'on SE REGARDE ; une photo dans une boîte est ce
          qu'on parcourt.

          LES FANTÔMES CHEVAUCHENT LA PHOTO, ET C'EST VOULU. Posés en dessous,
          ils appartiendraient au formulaire ; posés sur l'image, à la hauteur
          des mains, ils appartiennent au moment. C'est ce qui fait qu'on les
          touche sans y penser — et toucher sans y penser est exactement ce
          qu'on demande d'une réaction.

          CE QUE J'AI GARDÉ CONTRE LA MAQUETTE, ET IL N'Y EN A QU'UN : la case
          qui autorise à publier l'essayage sur le mur du commerçant. La
          maquette ne la dessine pas ; sans elle, on publierait la photo de
          quelqu'un parce qu'il a touché un fantôme. Elle est réduite à une
          ligne, elle n'apparaît qu'une fois noté — c'est-à-dire au seul moment
          où quelque chose pourrait partir — et elle se décoche d'un appui. */}
      {etape === "avis" && piece && !rendu?.souci && !rate && (
        <div ref={cadreRes} className={`mu-res${revele ? " revele" : ""}`}>
          {/* LA PHOTO, EN FOND ET EN PLEIN. `object-position` la cadre sur le
              haut du corps : une photo en pied centrée dans un cadre vertical
              montre les genoux, et on ne juge pas un vêtement sur ses genoux. */}
          {/* ═══ LA PHOTO PREND TOUT L'ÉCRAN, ET LA TÊTE RESTE SOUS LE TITRE ═

              « J'aimerais que la photo prenne toute la place comme sur la
              maquette (très immersive), sans que le titre touche la tête. »

              LES DEUX ENSEMBLE SONT IMPOSSIBLES AVEC NOS PHOTOS, et il faut le
              dire : sur la maquette, le mannequin est cadré avec du ciel
              au-dessus de lui, si bien que la tête tombe naturellement au quart
              de l'image. Nos photos de catalogue commencent au sommet du crâne.
              Une image en plein cadre y met donc la tête tout en haut — c'est-
              à-dire sous le titre — et la descendre laissait une bande noire,
              ce qui est l'inverse d'immersif.

              LE FOND FLOU RÈGLE LES DEUX D'UN COUP. La même photo, agrandie et
              floutée, remplit le cadre entier ; la photo nette se pose dessus,
              descendue de ce qu'il faut. Plus de bande noire, plus de couture,
              la couleur du vêtement baigne tout l'écran — et la tête arrive
              enfin sous le sous-titre. C'est la grammaire des pochettes
              d'album, pour la même raison qu'elles l'emploient. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mu-res-fond"
            src={rendu?.image ?? piece.rendu ?? piece.photo}
            alt=""
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mu-res-ph"
            src={rendu?.image ?? piece.rendu ?? piece.photo}
            alt={`Essai : ${piece.nom}`}
          />
          {/* ═══ SEULE LA PASTILLE OUVRE LA PHOTO ══════════════════════════

              « Quand je veux laisser un message après avoir cliqué sur un
              fantôme, ou cliquer sur un bouton, je ne peux pas : ça ouvre la
              photo en entier. »

              LA SURFACE ENTIÈRE ÉTAIT LE GESTE, ET C'ÉTAIT UNE MAUVAISE IDÉE.
              Le raisonnement se tenait — on tape une photo d'instinct — mais
              cet écran-ci n'est pas une photo : c'est une photo AVEC cinq
              fantômes à noter, trois boutons et un champ de message. Un calque
              qui couvre les deux tiers du cadre pour un geste secondaire prend
              les appuis de tous les gestes principaux. Le confort d'un côté
              coûtait l'usage de l'autre.

              LA PASTILLE PORTE DONC LE GESTE, et elle est assez grande pour ne
              pas se viser : elle a ses mots à côté du signe, ce qui lui fait
              cent trente points de large. */}
          <button
            type="button"
            className={`mu-res-loupe${plein ? " on" : ""}`}
            aria-pressed={plein}
            onClick={() => setPlein((v) => !v)}
          >
            <i aria-hidden="true">{plein ? "✕" : "⤢"}</i>
            {plein ? "Revenir" : "Voir en entier"}
          </button>
          {/* DEUX VOILES, UN EN HAUT ET UN EN BAS, ET AUCUN AU MILIEU. Le titre
              et les gestes ont besoin d'un fond ; le visage n'a besoin de rien.
              Un voile uniforme aurait assombri la seule chose qu'on est venu
              voir. */}
          <span className="mu-res-voile" aria-hidden="true" />
          {/* LA RÉVÉLATION : un éclat qui balaie l'image UNE FOIS. Rejoué en
              boucle, il devient un défaut d'écran au troisième tour. */}
          <span className="mu-res-eclat" aria-hidden="true" />
          {/* LE CŒUR DE LA MISE DE CÔTÉ. Il naît sous le pouce et monte vers le
              coin haut droit — celui où vit la poche des gardés. Sa clé est le
              compteur d'envols, donc deux mises de côté de suite rejouent le
              vol au lieu de laisser le premier figé sur sa dernière image. */}
          {coeur > 0 && (
            <span key={coeur} className="mu-res-coeur" aria-hidden="true">
              <Trace cle="coeur" />
            </span>
          )}

          <div className="mu-res-haut">
            <button
              type="button"
              className="mu-res-rond"
              aria-label="Revenir au choix de la pièce"
              onClick={() => setEtape("choisir")}
            >
              ←
            </button>
            {/* LA BARRE DES TROIS TEMPS. Elle remplace la frise numérotée du
                haut de page, qui est masquée sur cet écran : deux indicateurs
                d'avancement pour un seul écran, c'est un de trop. Elle est aux
                deux tiers — on découvre, on essaie, on donne son avis, et c'est
                le troisième qui est en cours. */}
            <span className="mu-res-jauge" aria-hidden="true">
              <i />
            </span>
            {/* ═══ LA CLOCHE, ET CE QU'ELLE PROMET VRAIMENT ═══════════════

                « M'alerter quand une pièce dans cet esprit arrive. »

                ELLE SE DÉCIDE ICI ET NULLE PART AILLEURS. Une permission de
                notification demandée dans un réglage ne veut rien dire : on ne
                sait pas de quoi on parle. Demandée devant une pièce qu'on vient
                d'aimer, elle est évidente — et elle reste explicable le jour où
                la notification tombe : « parce que vous aviez adoré la veste
                kaki ». Voir `lib/direct/alertes-looks.ts`, qui dit aussi
                pourquoi elle ne garde pas un profil de goût. */}
            <button
              type="button"
              className={`mu-res-rond mu-res-cloche${alerte ? " on" : ""}`}
              aria-pressed={alerte}
              aria-label={
                alerte
                  ? "Ne plus m’alerter pour des pièces dans cet esprit"
                  : "M’alerter quand une pièce dans cet esprit arrive"
              }
              onClick={() => {
                basculerAlerteLook({
                  carte: mur.cle,
                  piece: piece.id,
                  nom: piece.nom,
                  note,
                });
                // ON REPART DE ZÉRO : c'est la réponse à CE geste qu'on veut
                // lire, pas la fin du compte à rebours du précédent.
                setBulle((n) => n + 1);
              }}
            >
              <Trace cle={alerte ? "cloche-on" : "cloche"} />
              <i aria-hidden="true">{alerte ? "✓" : "+"}</i>
            </button>
            <button
              type="button"
              className="mu-res-rond"
              aria-label="Fermer l’essayage"
              onClick={onMur}
            >
              ✕
            </button>
          </div>
          {/* LA BULLE DE LA CLOCHE. Elle dit ce que le pictogramme ne peut pas
              dire, et elle disparaît une fois la chose demandée — une infobulle
              qui reste après le geste devient une étiquette. */}
          {/* ═══ ELLE NE S'INVITE PAS DANS LE PARCOURS « SURPRENDS-MOI » ═════

              LES DEUX BULLES SE DISPUTAIENT LE MÊME COIN. Quand ClikMe a
              choisi, « Choix ClikMe » occupe déjà le haut de la photo et dit
              l'essentiel ; une seconde bulle posée par-dessus, pour expliquer
              une cloche qu'on n'a pas touchée, transforme l'écran en pile de
              messages. Là, la cloche se passe de légende — et si on l'appuie,
              la bulle revient pour ce geste-là, comme partout ailleurs.

              LA CLÉ PORTE LE COMPTEUR : changer de clé remonte l'élément, donc
              relance l'animation depuis son début. Sans elle, le second appui
              sur la cloche changeait le texte d'une bulle déjà effacée. */}
          {(!surprise || bulle > 0) && (
          <span
            key={bulle}
            className={`mu-res-bulle${alerte ? " on" : ""}`}
            aria-hidden="true"
          >
            {alerte
              ? "Je vous préviens quand il en arrive"
              : "M’alerter pour des looks similaires ?"}
          </span>
          )}

          <div className="mu-res-t">
            <h2>
              Alors, <b>ça vous plaît&nbsp;?</b>
            </h2>
            {/* ═══ DEUX PHRASES, UNE PAR PARCOURS — ET LA MAQUETTE LES ÉCRIT
                TOUTES LES DEUX ══════════════════════════════════════════════

                JE LES AVAIS FONDUES EN UNE SEULE, par peur que la plus longue
                passe sur le visage. C'était traiter la cause au mauvais
                endroit : la maquette du parcours choisi écrit bien « plus je
                vous connais, mieux je vous conseille » sur deux lignes, et
                celle de « Surprends-moi » écrit la courte. Ce qu'il fallait
                corriger, c'est la PLACE de la tête sous le titre — voir le
                fond flou de `.mu-res-fond` — pas la phrase. */}
            {/* LA MÊME PHRASE DANS LES DEUX PARCOURS. J'en avais écrit deux —
                la courte quand ClikMe avait choisi, en me disant que la bulle
                « Choix ClikMe » disait déjà le reste. Elle ne le dit pas : elle
                explique LA PIÈCE, pas à quoi sert la note. Ce que la note
                apporte est vrai des deux côtés, donc la phrase aussi. */}
            <p>Touchez un fantôme&nbsp;: plus je vous connais, mieux je vous conseille.</p>
            {/* ON DIT QUE C'EST CLIKME QUI A CHOISI, ET SEULEMENT ALORS. Sans
                cette ligne, une pièce sortie de la réserve se lit comme une
                pièce qu'on aurait demandée — et « Surprends-moi encore », plus
                bas, n'aurait plus de sens. */}
          </div>

          {/* L'ESPACE QUI POUSSE LE BAS EN BAS. C'est lui qui laisse la photo
              respirer quelle que soit la hauteur de l'écran, sans donner une
              hauteur fixe à l'image — laquelle recadrerait les grands
              téléphones et écraserait les petits. */}
          <div className="mu-res-vide" aria-hidden="true" />

          <div className="mu-res-bas">
          {/* ═══ POURQUOI CLIKME A CHOISI CELLE-LÀ ═══════════════════════════

                « La note de l'IA est en plein milieu de la photo et ça empêche
                d'apprécier le vêtement : on devrait avoir juste un bouton qui
                ouvre la pop-up, qu'on pourra fermer aussi pour voir le vêtement
                en entier. »

                DEUX FOIS J'AI DÉPLACÉ CE PANNEAU, ET DEUX FOIS IL A MANGÉ LA
                PHOTO — en haut à gauche, puis sous la photo. La cause n'était
                pas sa place : c'est qu'il est OUVERT d'office. Un texte de
                quatre lignes posé sur un écran dont le seul sujet est une image
                prend toujours trop de place, où qu'on le mette.

                IL SE RÉDUIT DONC À UNE PASTILLE, et l'explication vit dans une
                feuille qui se ferme. On voit « ✨ Choix ClikMe », on ouvre si on
                veut savoir, on referme et le vêtement est entier. La règle
                produit est intacte : quand c'est ClikMe qui a choisi, il rend
                des comptes — mais il ne s'impose pas devant la pièce.

                ET ELLE NE PARLE PAS DU VISAGE DE LA PERSONNE. « Le kaki
                fonctionne avec les tons de votre visage » suppose une analyse
                qu'aucun calcul de cette maquette ne fait. Elle parle de ce qui
                est vrai : la pièce, sa coupe, et d'où elle a été sortie. */}
            {surprise && (
              <button
                type="button"
                className={`mu-choix-p${pourquoi ? " on" : ""}`}
                aria-expanded={pourquoi}
                onClick={() => setPourquoi((v) => !v)}
              >
                <i aria-hidden="true">✨</i>
                <b>Choix ClikMe</b>
                <s aria-hidden="true" />
              </button>
            )}
            {/* ═══ CE QUE « RÉSERVER » A FAIT, ET IL FAUT BIEN LE MONTRER ═══

                « "Réserver cet article" ne marche pas et n'ouvre pas WhatsApp
                comme convenu. »

                IL MARCHAIT, ET IL NE SE VOYAIT PAS. Sur un numéro de fiction —
                et tous les commerces de la maquette en ont un — on n'ouvre
                jamais WhatsApp : composer un numéro tiré au hasard ferait
                sonner un vrai téléphone, chez quelqu'un. La fonction rangeait
                donc son résultat dans un état que SEUL L'ANCIEN ÉCRAN
                « Et maintenant ? » savait afficher, et cet écran-là ne fait
                plus partie du parcours vêtement. Le geste partait dans le vide.

                LE RÉSULTAT VIT MAINTENANT ICI, sur l'écran où l'on a appuyé :
                le message qui partirait, le numéro barré, et la raison. Sur un
                vrai numéro, WhatsApp s'ouvre et le panneau le confirme. */}
            {envoi && (
              <div className="mu-res-wa" role="status">
                <b>
                  {envoi.par === "fiction"
                    ? `${mur.lieu} est un commerce inventé.`
                    : envoi.par === "abandon"
                      ? "Vous avez refermé le partage."
                      : "WhatsApp s’est ouvert avec le message."}
                </b>
                {envoi.par === "fiction" && (
                  <>
                    <em>
                      Son numéro <s>{envoi.telephone}</s> appartient à la plage
                      réservée à la fiction&nbsp;: WhatsApp n’y trouve personne.
                      Voilà le message qui partirait chez un vrai commerçant.
                    </em>
                    <q>
                      Bonjour, je viens d’essayer «&nbsp;{piece.nom}&nbsp;» sur
                      ClikMe et ça me plaît.{" "}
                      {(mots.reserver ?? "Je réserve").replace(/^Je\s+/i, "Je ")}{" "}
                      — auriez-vous un créneau&nbsp;?
                    </q>
                  </>
                )}
                <button type="button" onClick={() => setEnvoi(null)}>
                  Fermer
                </button>
              </div>
            )}

            {surprise && pourquoi && (
              <div className="mu-choix" role="dialog" aria-label="Le choix de ClikMe">
                <b>
                  <i aria-hidden="true">✨</i> Choix ClikMe
                  <button
                    type="button"
                    className="mu-choix-x"
                    aria-label="Fermer"
                    onClick={() => setPourquoi(false)}
                  >
                    ✕
                  </button>
                </b>
                {/* PAS D'ARTICLE DEVANT LE NOM DE LA PIÈCE. « J'ai sorti robe à
                    volants corail de la collection » est ce que donnait la phrase
                    précédente : le français demande « la » ou « le », et la
                    collection ne dit nulle part le genre de chaque pièce. On
                    écrit donc le nom EN TÊTE, où il n'en a pas besoin — plutôt que
                    de deviner un genre une fois sur deux. */}
                <p>
                  <b>{piece.nom}</b> — {surLeCorps}.
                </p>
                <dl>
                  <dt>La pièce</dt>
                  <dd>{piece.decrire ?? piece.nom}</dd>
                  {/* IL DÉVELOPPE, IL NE RÉPÈTE PAS. La ligne du dessus porte
                      déjà `surLeCorps` : le redire ici mot pour mot se lisait
                      comme un défaut. `avisNeutre` dit la même chose en entier,
                      et sans jamais noter la pièce. */}
                  <dt>La coupe</dt>
                  <dd>{avisNeutre(piece).dit}</dd>
                  <dt>Comment je choisis</dt>
                  {/* ON DIT OÙ EN EST LA MACHINE, PLUTÔT QUE DE LUI PRÊTER UN
                      GOÛT QU'ELLE N'A PAS ENCORE. C'est exactement ce que le
                      produit promet : « j'apprends ce que vous aimez », et
                      non « je sais mieux que vous ce qui vous va ». */}
                  <dd>
                    Aujourd’hui, je pioche dans la collection en écartant ce que
                    vous venez de voir. Bientôt, je tiendrai compte de ce que
                    vous notez, de ce que vous faites mettre de côté et des
                    surprises que vous gardez.
                  </dd>
                </dl>
              </div>
            )}
            <div
              className="mu-note-f res"
              role="radiogroup"
              aria-label="Votre avis sur ce rendu, de un à cinq fantômes"
              onPointerLeave={() => setNoteVue(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={note === n}
                  aria-label={`${MOTS_FANTOME[n]} — ${n} fantôme${n > 1 ? "s" : ""} sur 5`}
                  className={(noteVue || note) >= n ? "on" : undefined}
                  onPointerEnter={() => setNoteVue(n)}
                  onFocus={() => setNoteVue(n)}
                  onBlur={() => setNoteVue(0)}
                  // ON PEUT SE DÉDIRE EN REVENANT SUR SON PROPRE FANTÔME. Sans
                  // ça, une note posée par erreur ne se retire plus.
                  // ═══ TOUCHER UN FANTÔME OUVRE LA BULLE DU MOT ═══════════
                  //
                  // LA MAQUETTE L'ANCRE SOUS LE FANTÔME TOUCHÉ, avec sa flèche,
                  // et c'est ce qui la rend évidente : elle répond à ce qu'on
                  // vient de faire — « J'adore ! Envie d'ajouter un mot ? » —
                  // au lieu d'attendre plus bas qu'on la trouve.
                  //
                  // SE DÉDIRE LA REFERME. Sans ça, une note posée par erreur ne
                  // se retire plus, et la bulle reste ouverte sur un avis qu'on
                  // vient d'annuler.
                  onClick={() => {
                    jouer("note");
                    const neuf = note === n ? 0 : n;
                    setNote(neuf);
                    setMotOuvert(neuf > 0);
                  }}
                >
                  <Frimousse classe="mu-note-s" coeur={n === 5} />
                  <em>{MOTS_FANTOME[n]}</em>
                </button>
              ))}
            </div>

            {/* ═══ LA BULLE DU MOT, ANCRÉE SOUS LE FANTÔME TOUCHÉ ═══════════

                LA MAQUETTE L'ACCROCHE AU FANTÔME, pas au bas de l'écran, et
                c'est ce qui change tout : elle répond à ce qu'on vient de
                faire. « J'adore ! — Envie d'ajouter un mot ? (optionnel) ».
                Posée plus bas, elle demandait de la trouver ; posée ici, elle
                se lit sans qu'on la cherche.

                SA FLÈCHE POINTE LE BON FANTÔME. Les cinq occupent cinq colonnes
                égales : le centre du n-ième est à `(n − 0,5) / 5` de la largeur.
                Une flèche qui pointe à côté annule tout le gain.

                ET C'EST ICI QUE LA CASE DU MUR VIT MAINTENANT. La maquette ne
                la dessine pas, et je ne peux pas la retirer : sans elle, on
                publierait la photo de quelqu'un parce qu'il a touché un
                fantôme. Elle est à sa vraie place — dans le panneau qui écrit
                ce qui partira, juste au-dessus du bouton qui l'envoie. */}
            {note > 0 && motOuvert && (
              <div
                className="mu-res-mot"
                style={{ "--i": note - 1 } as React.CSSProperties}
              >
                <div className="mu-res-mot-t">
                  <Frimousse classe="mu-res-mot-f" coeur={note === 5} />
                  <span>
                    <b>{MOTS_FANTOME[note]}&nbsp;!</b>
                    <em>Envie d’ajouter un mot&nbsp;? (optionnel)</em>
                  </span>
                  <button
                    type="button"
                    className="mu-res-mot-x"
                    aria-label="Fermer"
                    onClick={() => setMotOuvert(false)}
                  >
                    ✕
                  </button>
                </div>
                <label className="mu-res-champ">
                  <textarea
                    rows={2}
                    maxLength={120}
                    value={commentaire}
                    aria-label={`Un petit mot sur ${mots.ceci}`}
                    placeholder={MOTS_EXEMPLE[note]}
                    onChange={(e) => setCommentaire(e.target.value)}
                  />
                  <s>{commentaire.length}/120</s>
                </label>
                <button
                  type="button"
                  className={`mu-res-part${partage ? " on" : ""}`}
                  aria-pressed={partage}
                  onClick={() => setPartage((v) => !v)}
                >
                  <i aria-hidden="true">{partage ? "✓" : ""}</i>
                  <span>
                    Ajouter {mots.essayage === "projection" ? "ma" : "mon"} {mots.essayage} au
                    mur du commerçant
                  </span>
                </button>
                <button
                  type="button"
                  className="mu-res-valider"
                  onClick={() => setMotOuvert(false)}
                >
                  Valider
                </button>
              </div>
            )}

            {/* ═══ L'AVIS CLIKME, ET IL N'ARRIVE QUE S'IL EST DEMANDÉ ═══════

                « On peut éventuellement ajouter un lien secondaire discret :
                "Demander l'avis ClikMe". Et seulement si l'utilisateur clique
                dessus — il porte depuis un nom et un metier, voir plus bas.
                dessus, ClikMe peut donner un conseil neutre et non jugeant.
                Jamais : "cette pièce ne vous va pas". »

                IL DIT CE QUE LA PIÈCE FAIT, PAS CE QU'ELLE VAUT. Voir
                `avisNeutre` : la coupe, ce qu'elle remplace, et une porte de
                sortie qui PROPOSE au lieu de corriger — « si vous préférez
                garder votre bas, je peux vous proposer un haut ». C'est la
                différence entre un vendeur et un juge.

                ET SA SORTIE EST « SURPRENDS-MOI », pas un verdict. Un conseil
                qui se termine sans rien à faire laisse la personne seule avec
                un avis qu'elle n'avait pas demandé. */}
            {conseil && !surprise && (
              <div className="mu-conseil">
                {/* ═══ IL A UN NOM ET UN MÉTIER ══════════════════════════

                    « Au lieu de "L'avis ClikMe", mets plutôt : L'avis de Nadia
                    — experte en relooking. »

                    UN AVIS SIGNÉ NE SE LIT PAS COMME UN AVIS DE MACHINE. « Le
                    système pense que » se discute ; « Nadia pense que » se
                    reçoit — c'est quelqu'un, et c'est quelqu'un dont le métier
                    est écrit juste en dessous, ce qui dit pourquoi son avis
                    vaut la peine d'être lu.

                    ET ÇA NE CHANGE RIEN À CE QUI EST DIT. Le conseil reste
                    celui de `avisNeutre` : ce que la pièce FAIT, jamais ce
                    qu'elle vaut, et une porte de sortie qui propose au lieu de
                    corriger. Le nom n'autorise pas à juger. */}
                <b>
                  <Signe classe="mu-conseil-s" />
                  <span>
                    L’avis de Nadia
                    <em>experte en relooking</em>
                  </span>
                </b>
                <p>{avisNeutre(piece).dit}</p>
                <p className="mu-conseil-s2">{avisNeutre(piece).sinon}</p>
                <div className="mu-conseil-g">
                  {mots.surprends && (
                    <button type="button" className="mu-conseil-b" onClick={surprendsMoi}>
                      ✨ Proposez-moi une alternative
                    </button>
                  )}
                  <button type="button" onClick={() => setConseil(false)}>
                    Fermer
                  </button>
                </div>
              </div>
            )}

            {/* ═══ LES TROIS GESTES DE LA MAQUETTE, ET CHACUN OUVRE AILLEURS ═

                RÉSERVER emmène là où l'annonce emmenait déjà — l'offre du jour,
                son créneau, son décompte. METTRE DE CÔTÉ garde la pièce dans sa
                propre poche, sur place, avec le cœur qui monte. EN PARLER
                l'emporte chez ses amis, dans le salon qui existe déjà.

                UN SEUL APLAT, ET C'EST CELUI DU MILIEU. Trois aplats côte à
                côte ne désignent rien ; celui qui compte est celui qui fait
                partir la pièce.

                CHACUN DISPARAÎT S'IL N'OUVRE RIEN : pas d'annonce derrière,
                pas de créneau ; pas de rendu, rien à montrer. */}
            <div className="mu-res-g">
              {/* ═══ RÉSERVER MET LE CŒUR, IL N'EMMÈNE PLUS AILLEURS ═════════

                  « "Réserver cet article" devrait juste mettre l'article en
                  favori — le cœur qui est en haut à droite, partout dans
                  l'app. »

                  IL EMMENAIT SUR L'OFFRE DU JOUR, et c'était trop : on venait
                  de se voir habillé, et un bouton nous sortait de l'écran pour
                  une section qui parle d'autre chose. Le geste juste est celui
                  qui ne coûte rien et qu'on retrouve : la pièce rejoint la
                  poche du cœur, le cœur s'envole vers le coin où il vit, et la
                  photo ne bouge pas.

                  ET IL NE FAIT PLUS DOUBLON AVEC SON VOISIN. Les deux gestes
                  se ressemblaient ; ils se distinguent maintenant comme dans un
                  vrai commerce : RÉSERVER garde la pièce POUR SOI, dans sa
                  liste ; METTRE DE CÔTÉ demande au commerçant de la garder,
                  lui, et décompte ce qu'il reste. */}
              {/* ═══ RÉSERVER ÉCRIT AU COMMERÇANT ════════════════════════════

                  « "Réserver cet article" devrait ouvrir WhatsApp avec l'envoi
                  d'un message pro inscrit sur le WhatsApp du commerçant. »

                  C'EST LE SEUL GESTE DE CET ÉCRAN QUI SORT DE L'APPLICATION,
                  et il le fait parce que c'est la seule façon d'atteindre
                  quelqu'un qui n'est pas dessus : le commerçant lit WhatsApp,
                  pas notre base. Le message est déjà écrit — la pièce, le
                  geste du métier, une demande de créneau — et le rendu suit en
                  second temps quand il y en a un, parce qu'une adresse
                  « wa.me » ne transporte pas d'image.

                  SUR UN NUMÉRO DE FICTION, ON N'OUVRE RIEN et on montre le
                  message qui partirait. Ouvrir WhatsApp sur un numéro tiré au
                  hasard toucherait un vrai téléphone, chez quelqu'un. */}
              <button
                type="button"
                className="mu-res-c"
                onClick={() => void prevenir(piece)}
              >
                <i aria-hidden="true">
                  <Trace cle="etoile" />
                </i>
                <span>Réserver cet article</span>
              </button>
              {/* ═══ METTRE DE CÔTÉ NE CHANGE PAS D'ÉCRAN ════════════════════

                  On venait de se voir habillé, on faisait le geste le plus
                  engageant, et on était emmené ailleurs — c'est-à-dire qu'on
                  perdait la seule chose qu'on regardait. Le cœur s'envole vers
                  le coin où on le retrouvera, le bouton dit que c'est fait, la
                  photo n'a pas bougé. Le décompte, lui, n'a pas changé, et
                  `onFavori` remplit la MÊME poche que le cœur de l'annonce.

                  Les métiers dont le geste ENGAGE le commerçant — « Je réserve
                  ma séance » chez un coiffeur — gardent leur écran de
                  conversation. C'est la donnée qui le dit, avec `garde`. */}
              <button
                type="button"
                className={`mu-res-c plein${misDeCote ? " fait" : ""}`}
                onClick={(e) => {
                  if (!mots.garde) {
                    poser("pris");
                    setEtape("agir");
                    return;
                  }
                  if (misDeCote) return;
                  poser("pris");
                  // ═══ LE CŒUR PART QUELQUE PART, ET C'EST TOUT LE POINT ═══
                  //
                  // « Le cœur part, mais je ne retrouve pas cet article dans le
                  // cœur en haut à droite. » L'animation apprenait un endroit
                  // qui était vide : `onFavori` garde la CARTE du commerce, pas
                  // la pièce qu'on vient d'essayer. La poche des pièces existe
                  // maintenant pour de bon — voir `pieces-gardees.ts` — et
                  // c'est elle que le cœur du bandeau ouvre.
                  basculerPieceGardee({
                    carte: mur.cle,
                    lieu: mur.lieu,
                    piece: piece.id,
                    nom: piece.nom,
                    prix: piece.prix,
                    image: rendu && !rendu.souci ? rendu.image : piece.photo,
                    note,
                  });
                  // ON NE GARDE PLUS LE COMMERCE AU PASSAGE. « J'ai bien le
                  // commerçant à qui j'ai mis de côté l'article, mais quand je
                  // clique dessus ça m'amène sur son annonce, pas sur l'article
                  // que j'ai essayé. » `onFavori` range la CARTE du commerce
                  // dans l'autre poche : appelé ici, il ajoutait une ligne qui
                  // ne mène pas là où le cœur venait de promettre.
                  setMisDeCote(true);
                  lancerLeCoeur(e.currentTarget);
                }}
              >
                <i aria-hidden="true">
                  <Trace cle={misDeCote ? "coeur" : "sac"} />
                </i>
                <span>{misDeCote ? "C’est mis de côté" : mots.reserver}</span>
              </button>
              {/* ═══ EN PARLER AVEC MES AMIS ═════════════════════════════════

                  « Change "Partager" pour "En parler avec mes amis", qui amène
                  sur un salon de discussion où l'on invite ses amis, et qui
                  existe déjà. »

                  IL OUVRE LE SALON DE L'ANNONCE, avec ses propositions, son
                  vote et sa réservation : on n'en fabrique pas un second pour
                  l'essai. Le rendu, le prix et la note partent avec, et la
                  première phrase du salon est déjà écrite.

                  LÀ OÙ IL N'Y A PAS DE SALON — la page du commerce n'a pas la
                  mécanique du fil — il retombe sur la feuille de partage du
                  téléphone. Ce n'est pas un geste différent : c'est la même
                  intention, servie par ce que l'écran a sous la main. */}
              {!!rendu && !rendu.souci && (onSalon || !!photo) && (
                <button
                  type="button"
                  className="mu-res-c"
                  onClick={() => {
                    if (onSalon && rendu) {
                      onSalon({
                        quoi: piece.nom,
                        prix: piece.prix,
                        image: rendu.image,
                        note,
                      });
                      return;
                    }
                    void partagerLeLook(piece);
                  }}
                >
                  <i aria-hidden="true">
                    <Trace cle="partage" />
                  </i>
                  <span>En parler avec mes amis</span>
                </button>
              )}
            </div>

            {/* ═══ LA LIGNE DISCRÈTE, ET ELLE N'A PLUS QUE DEUX LIENS ═════════

                « Supprime "Autres pièces". » Elle faisait double emploi avec la
                flèche du haut, qui ramène déjà au choix de la pièce.

                LE PREMIER LIEN CHANGE SELON QUI A CHOISI : « Surprends-moi
                encore » quand c'est ClikMe, « L'avis de Nadia » quand c'est le
                client — et c'est bien un LIEN discret, jamais un bouton plein,
                parce qu'un avis qu'on n'a pas demandé n'est pas un geste du
                parcours.

                « SUR D'AUTRES » OUVRE LE MUR CADRÉ SUR LA PIÈCE, et le retour
                est garanti : l'essai reste MONTÉ pendant qu'on le regarde, donc
                « Revoir » ramène ici, note posée et mot écrit compris. */}
            <div className="mu-res-l">
              {surprise ? (
                mots.surprends && (
                  <button type="button" onClick={surprendsMoi}>
                    <i aria-hidden="true">✨</i>
                    <span>Surprends-moi encore</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className={conseil ? "on" : undefined}
                  aria-expanded={conseil}
                  onClick={() => setConseil((v) => !v)}
                >
                  <Trace cle="idee" />
                  <span>L’avis de Nadia</span>
                </button>
              )}
              <button type="button" onClick={onMur}>
                <Trace cle="gens" />
                <span>Voir sur d’autres</span>
              </button>
            </div>
          </div>

          {/* ═══ LA PHOTO ENTIÈRE, À LA TAILLE DE LA PHOTO ══════════════════

              « Ça ouvre la photo en immense et je ne peux pas tout voir. Il
              faudrait que je puisse la voir en entier, mais de la taille de la
              zone où il y a la photo, par-dessus les textes et les boutons. »

              C'ÉTAIT UN PLEIN ÉCRAN, ET UN PLEIN ÉCRAN NE MONTRE PAS PLUS. La
              photo y était agrandie à la hauteur du téléphone : une silhouette
              debout dans un cadre deux fois plus haut que large se retrouvait
              rognée sur les côtés, ou minuscule au milieu de deux bandes
              noires. On sortait de l'écran pour voir moins bien.

              ELLE RESTE DONC DANS SON CADRE, et c'est le calque qui change :
              le titre, les fantômes et les gestes s'effacent le temps qu'on
              regarde, et la photo passe en « contenir » — donc entière, sans
              rognage, à la place exacte qu'elle occupait. Le même bouton
              revient en arrière. */}
          {plein && piece && (
            <div
              className="mu-plein"
              role="dialog"
              aria-label={`${piece.nom}, en entier`}
              onClick={() => setPlein(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rendu?.image ?? piece.rendu ?? piece.photo}
                alt={`Essai : ${piece.nom}`}
              />
            </div>
          )}
        </div>
      )}

      {((etape === "avis" && (!!rendu?.souci || rate)) || etape === "agir") && piece && (
        <div
          className={`mu-rendu${revele ? " revele" : ""} avis${
            !rendu?.souci && !rate ? " plein court" : ""
          }`}
        >
          {/* ═══ LA GLISSIÈRE AVANT / APRÈS ══════════════════════════════════

              LA MAQUETTE LA DEMANDE, ET ELLE A RAISON CONTRE L'APPUI LONG. On
              avait « Maintenir pour comparer » : le geste du coup d'œil — on
              revoit sa tête une seconde, on relâche, on est revenu. C'est utile,
              et ça ne laisse RIEN JUGER, parce qu'il n'y a pas d'arrêt possible
              au milieu. La glissière s'arrête où l'on veut, la ligne de partage
              passe sur son propre visage, et c'est là qu'on voit ce qui a changé.

              LES DEUX RESTENT, ET ILS NE SE DISPUTENT PAS. L'appui long vit
              maintenant sur les deux PASTILLES — « Avant » et « Après » — au lieu
              de l'image entière : on appuie sur un mot, l'image y va, on relâche.
              La surface de l'image, elle, appartient à la glissière.

              LE « AVANT » EST DÉCOUPÉ, PAS RÉTRÉCI, et la nuance est tout.
              Écrit `width:var(--x)` avec `overflow:hidden`, le calque garde la
              bonne largeur mais la photo dedans se met en page dans cette
              largeur-là : on comparerait un visage comprimé à un visage normal,
              c'est-à-dire deux visages différents, c'est-à-dire rien. `clip-path`
              laisse le calque à la taille du cadre et masque seulement ce qui
              dépasse du trait. Même correction, même raison que sur la page
              d'accueil. */}
          {/* UN RENDU RATÉ N'A PAS D'« APRÈS », DONC PAS DE GLISSIÈRE. Quand le
              calcul n'a pas abouti, `rendu.image` est vide et l'écran retombe
              sur la photo de CATALOGUE de la pièce : comparer sa propre photo à
              celle du commerçant ne montrerait pas un essai raté, ça montrerait
              un essai réussi sur quelqu'un d'autre. On affiche donc la pièce
              seule, et la phrase du dessous dit ce qui s'est passé. */}
          {rendu?.souci ? (
            <div className="mu-mi">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mu-mi-i" src={piece.rendu ?? piece.photo} alt={piece.nom} />
            </div>
          ) : (
          <div
            className="mu-mi"
            style={{ "--x": `${avant ? 100 : x}%` } as React.CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="mu-mi-i"
              src={rendu?.image ?? piece.rendu ?? piece.photo}
              alt={`Essai : ${piece.nom}`}
            />
            <div className="mu-mi-av" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mu-mi-i" src={laPhoto} alt="" />
            </div>
            <span className="mu-mi-t" aria-hidden="true">
              <i>‹›</i>
            </span>
            {/* LE VOILE DE RÉVÉLATION. Il balaie l'image UNE FOIS et disparaît :
                une brillance qui repasse en boucle devient un défaut d'écran au
                bout du troisième tour. */}
            <span className="mu-rendu-eclat" aria-hidden="true" />
            {/* LA GLISSIÈRE EST UN VRAI CHAMP DE FORMULAIRE, posé transparent sur
                toute la surface : le clavier, la molette et les lecteurs d'écran
                marchent sans une ligne de plus, ce qu'une glissière écrite à la
                main n'aurait pas donné. */}
            <input
              className="mu-mi-r"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={x}
              aria-label="Comparer votre photo et le rendu"
              onChange={(e) => setX(Number(e.target.value))}
            />
            {/* LES DEUX PASTILLES DE LA MAQUETTE. Elles NOMMENT les deux moitiés
                — sans elles on ne sait pas laquelle est laquelle, et c'est la
                seule information dont cette image a besoin. Elles portent aussi
                l'ancien appui long : maintenir « Avant » ramène toute la photo. */}
            <button
              type="button"
              className={`mu-mi-e a${x < 12 ? " off" : ""}`}
              onPointerDown={() => setAvant(true)}
              onPointerUp={() => setAvant(false)}
              onPointerLeave={() => setAvant(false)}
            >
              Avant
            </button>
            <span className={`mu-mi-e b${x > 88 ? " off" : ""}`}>Après</span>
          </div>
          )}
          {/* ═══ LA MAQUETTE DE L'ESSAYAGE, SUIVIE AU TRAIT ═══════════════════

              « Le dernier écran, comme d'autres écrans avant, ne correspond pas
              aux écrans que je t'ai donnés niveau UX et UI : il faut respecter
              le design scrupuleusement. »

              CE QUI MANQUAIT, ET C'ÉTAIT LA MOITIÉ DE L'ÉCRAN. La maquette pose
              la photo EN PLEIN — bord à bord, sans cadre — et écrit par-dessus.
              À gauche, le titre « Votre essayage » et ce que la machine promet ;
              à droite, une carte flottante qui porte la pièce, son prix et les
              deux gestes de garde. On avait une photo dans une boîte arrondie,
              au milieu d'une colonne, avec le nom de la pièce en dessous : le
              même contenu, rangé comme un formulaire.

              CE N'EST PAS QU'UNE QUESTION DE GOÛT. Une photo en plein écran est
              ce qui fait qu'on se regarde ; une photo dans une boîte est ce
              qu'on parcourt. Tout l'écran existe pour le premier geste.

              LES TROIS LIGNES DE GAUCHE DISENT CE QUE L'ÉCRAN SAIT FAIRE, et
              chacune est vraie ici : le rendu est calculé, la bande des styles
              est juste en dessous, et la glissière compare au doigt. On n'y met
              pas « changez de taille » tant qu'aucune pièce ne porte de taille —
              une commande qui ne commande rien est le contraire d'une maquette
              respectée. */}
          {!rendu?.souci && !rate && (
            <>
              {/* ═══ LE TEXTE SUR LA PHOTO EST PARTI ═══════════════════════

                  « Les textes par-dessus l'image cassent totalement
                  l'immersion. Ceci ne sert à rien donc supprimer : Votre
                  essayage / Découvrez à quoi cette monture vous va, en quelques
                  secondes / Essayage réaliste par IA / Plusieurs styles / Avant
                  après au doigt. »

                  IL A RAISON, ET C'EST MOI QUI AVAIS MIS CE BLOC LA — en suivant
                  sa maquette, qui l'y dessinait. Ce que la maquette ne pouvait
                  pas montrer, c'est ce que ça donne SUR UN VISAGE : trois lignes
                  de promesse et un titre de trente et un points posés en travers
                  de sa propre tête, au moment exact où il se regarde. Un argument
                  de vente par-dessus le résultat qu'il vend.

                  ET CES TROIS LIGNES DISAIENT CE QUE L'ECRAN FAISAIT DEJA. « Essayage
                  réaliste par IA » est écrit en toutes lettres dans le badge du
                  bas, qui dit en plus sur QUELLE photo et en combien de temps.
                  « Plusieurs styles » est la bande de vignettes juste dessous.
                  « Avant / après au doigt » est la glissière qu'on a sous le
                  pouce. Trois légendes pour trois choses visibles à l'écran. */}
              {/* LA CARTE FLOTTANTE DE DROITE. Elle porte ce qu'on est en train
                  d'essayer — la photo du commerçant, le nom, le prix — et les
                  deux gestes qui ne décident rien : garder, montrer. Les gestes
                  qui décident sont au troisième temps, et nulle part ailleurs. */}
              {/* ═══ ET LA CARTE FLOTTANTE QUITTE LE RENDU ══════════════════

                  « Cette partie prend beaucoup de place sur la photo, donc
                  supprimer cette section pour une immersion totale. »

                  ELLE NE DISPARAIT QU'AU TEMPS DU RENDU, et c'est la nuance qui
                  compte : aux deuxième et troisième temps — choisir la monture,
                  donner son avis — il n'y a pas de visage dessous, la carte ne
                  recouvre rien, et elle porte des choses qu'on cherche vraiment
                  à ce moment-là : la distance, la note, les avis.

                  RIEN N'EST PERDU AU RENDU, et c'est ce qui permet de la
                  retirer. Le nom et le prix reviennent SOUS la photo, où ils
                  existaient déjà et où une règle les cachait justement parce que
                  la carte les portait. Les deux gestes — garder, montrer —
                  descendent avec eux. Ils gagnent au change : en pastille de
                  cent vingt-deux points sur une photo, « Ajouter aux favoris »
                  s'écrivait sur trois lignes. */}
              <aside className="mu-pl-d">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mu-pl-ph" src={piece.photo} alt="" />
                <b className="mu-pl-n">{piece.nom}</b>
                <em className="mu-pl-x">{piece.prix}</em>
                {/* ═══ LE NUANCIER DE LA CARTE EST PARTI AVEC ELLE ════════════

                    IL NE S'AFFICHAIT QU'AU TEMPS DU RENDU, et la carte vient de
                    quitter ce temps-là : il n'etait donc plus joignable nulle
                    part. TypeScript l'a dit avant moi — « cette comparaison n'a
                    aucun recouvrement » — ce qui est exactement la bonne façon
                    d'apprendre qu'on vient de laisser du code mort derrière soi.

                    ET ON NE LE DEPLACE PAS, PARCE QU'IL EXISTE DEJA EN BAS. La
                    bande des styles, sous la photo, liste toutes les pièces et
                    dessine un rond de couleur pour chaque vernis : c'était deux
                    nuanciers pour un seul choix, à deux cents points d'écart. */}
                {/* ═══ AUX DEUXIÈME ET TROISIÈME TEMPS, LA CARTE DIT OÙ C'EST ═══

                    LA MAQUETTE Y MET TROIS LIGNES — « Look complet », « En
                    stock », « À 350 m · Dax centre ». Deux d'entre elles
                    n'existent nulle part dans les données : aucune pièce ne
                    porte de stock, aucune ne dit si elle complète un ensemble.
                    Les écrire quand même aurait mis de fausses garanties sous
                    le nom d'un commerçant — la seule chose que cet écran ne
                    puisse pas se permettre.

                    ON GARDE DONC LES DEUX QUI SONT VRAIES : d'où c'est, et ce
                    que les gens en disent. Le jour où un commerçant déclare ses
                    stocks, la troisième ligne s'écrit ici. */}
                {/* LA GARDE `etape !== "rendu"` A DISPARU D'ICI : la carte
                    entière ne se dessine plus qu'aux autres temps, donc elle
                    était toujours vraie. Une condition toujours vraie ment sur
                    ce qu'elle protège. */}
                  <ul className="mu-pl-i">
                    <li>
                      <Trace cle="lieu" />
                      <span>
                        À {mur.distance}
                        <i>{mur.ville}</i>
                      </span>
                    </li>
                    <li>
                      <Trace cle="net" />
                      <span>
                        {mur.note} sur 5
                        <i>{mur.avis} avis</i>
                      </span>
                    </li>
                  </ul>
                <div className="mu-pl-r">
                  {onFavori && (
                    <button
                      type="button"
                      className={favori ? "on" : undefined}
                      onClick={onFavori}
                      aria-pressed={favori}
                    >
                      <Trace cle="coeur" />
                      <span>{favori ? "Gardé dans vos favoris" : "Ajouter aux favoris"}</span>
                    </button>
                  )}
                  {!!photo && !!rendu && !rendu.souci && (
                    <button type="button" onClick={() => void partagerLeLook(piece)}>
                      <Trace cle="partage" />
                      <span>Partager {mots.ceci}</span>
                    </button>
                  )}
                </div>
              </aside>
            </>
          )}
          {/* AGRANDIR EST UN BOUTON À PART, POSÉ SOUS L'IMAGE. Il ne peut pas
              être un appui sur l'image : celle-ci est devenue une glissière, et
              un appui dessus la déplace. */}
          <button
            type="button"
            className="mu-rendu-z"
            aria-label="Voir le rendu en grand"
            onClick={() => setLoupe(true)}
          >
            <i aria-hidden="true">⤢</i>
            Agrandir
          </button>
          {/* ═══ IL NE PARLE PLUS QUE QUAND IL A QUELQUE CHOSE À DIRE ════════

              « Sur le bas du résultat il y a encore trop de texte qui pollue
              l'expérience : "Sur VOTRE photo, en 20.8 s · votre photo a été
              envoyée pour le rendu, rien n'est conservé". »

              IL A RAISON, ET LA LIGNE ÉTAIT DEVENUE UN AVEU DE PLOMBERIE. Elle
              existait pour une bonne raison : « sans elle, un résultat
              impeccable sur la main d'une inconnue passe pour le sien ». Mais
              elle a grossi à chaque garantie qu'on a voulu donner — la photo
              d'origine, le temps de calcul, l'envoi, la non-conservation — et
              elle finit par dire QUATRE CHOSES sous une image qu'on regarde
              pour la première fois.

              LES DEUX CAS OÙ IL FAUT PARLER RESTENT : un ennui de rendu se dit,
              et une photo d'exemple s'avoue — c'est là, et là seulement, que
              se taire tromperait. Sur SA photo, l'image se suffit : c'est son
              visage, il le reconnaît, et on ne lui apprend rien en le lui
              chiffrant. Le temps de calcul appartenait à l'écran d'attente, qui
              l'a déjà montré ; la promesse de confidentialité est donnée AVANT
              la prise de vue, c'est-à-dire au moment où elle décide quelque
              chose. */}
          {(rendu?.souci || !photo) && (
            <span className="mu-rendu-b rate">
              {rendu?.souci ?? "Photo d’exemple — ce n’est pas la vôtre"}
            </span>
          )}
          {/* LA DIFFERENCE ENTRE LES DEUX MECANIQUES SE DIT, PARCE QU'ELLE SE
              VOIT. Pour les ongles, un modele CHERCHE la main : le cadrage est
              libre. Pour un bijou ou un objet, le gabarit est a coordonnees
              fixes — la piece se pose sur le repere, et sur une photo cadree
              autrement elle tombe a cote. Le dire ici, c'est donner le geste qui
              repare ; se taire, c'est laisser croire que le calcul s'est trompe. */}
          {photo && mur.essai?.gabarit && mur.essai.gabarit.forme !== "main" && mur.essai.gabarit.forme !== "cadre" && (
            <p className="mu-rendu-a">
              La pièce se pose sur le repère du viseur. Si elle tombe à côté,
              reprenez la photo en alignant {mur.essai.partie} sur les traits.
            </p>
          )}
          <div className="mu-rendu-t">
            <b>{piece.nom}</b>
            <em>{piece.prix}</em>
            {/* ═══ ET SUR MOI, ELLE EXISTE ? ════════════════════════════════

                C'EST ICI QUE LA QUESTION SE POSE VRAIMENT. On vient de voir la
                pièce sur soi, on la veut, et la seule chose qui décide du
                déplacement est de savoir s'il en reste une à sa taille. Cette
                ligne-là vaut tout l'écran qui la précède.

                « IL N'EN RESTE PLUS » S'AFFICHE AUSSI, et c'est volontaire :
                une réponse qui évite un déplacement pour rien est une bonne
                réponse. Voir `phraseDesTailles`. */}
            {taillesDe(piece) && (
              <s>{phraseDesTailles(taillesDe(piece)!)}</s>
            )}
          </div>
          {/* ═══ ET GARDER / PARTAGER SONT PARTIS AUSSI ═══════════════════

              « Supprimer cette partie de la page résultat. »

              IL LES AVAIT DEJA FAIT RETIRER DE LA PHOTO au tour precedent — ils
              vivaient dans la carte flottante, « ça prend beaucoup de place sur
              la photo ». Je les avais descendus sous l'image plutot que de les
              supprimer, pour ne pas perdre deux gestes reels. Il les designe une
              seconde fois : ce n'etait pas leur PLACE qui le genait, c'est leur
              presence sur cet ecran-la.

              ET IL A RAISON SUR LE FOND. Cet ecran repond a une seule question
              — « est-ce que ça me va ? » — et on y repond au troisieme temps, en
              donnant son avis. Garder et partager sont des gestes d'APRES la
              decision ; poses avant, ils proposent de ranger quelque chose dont
              on ne sait pas encore si on en veut.

              LE GESTE DE GARDER N'EST PAS PERDU : il vit sur l'annonce, dans le
              rail de droite, et au troisieme temps de l'essai. */}
          {/* ═══ LES AUTRES STYLES, SOUS L'IMAGE ══════════════════════════════

              LA MAQUETTE LES MET LÀ, ET C'EST LE PLUS GROS GAIN DE L'ÉCRAN. On
              ne choisit presque jamais la première coupe : le geste le plus
              fréquent après un rendu est « et celle-là, elle donnerait quoi ? ».
              Il coûtait deux écrans — revenir à la grille, rechoisir — et on
              perdait le rendu qu'on était en train de regarder, donc on ne
              comparait rien.

              ICI ON RESTE SUR SON VISAGE ET ON CHANGE DE COUPE. C'est ce que
              fait un coiffeur avec un nuancier, et c'est le geste que la
              maquette a vu juste.

              CELLES QUI NE S'ESSAIENT PAS ENCORE NE SONT PAS DANS LA BANDE. Sur
              la grille, une pièce marquée « bientôt » s'explique ; ici, en
              vignette de soixante points, elle ne serait qu'un bouton mort au
              milieu de boutons vivants. */}
          {/* ═══ LA BANDE DES STYLES EST PARTIE AVEC SON ÉCRAN ════════════════

              Elle vivait sous la photo du deuxième temps — celui qui ne servait
              qu'à regarder — et ce temps-là n'existe plus : on arrive
              directement sur l'avis. Elle n'avait donc plus de mur où
              s'accrocher.

              ET RIEN N'EST PERDU, PARCE QUE LA MAQUETTE OFFRE MIEUX. Changer de
              pièce depuis l'avis se fait par « Voir les autres pièces », qui
              ramène à la grille où on les voit en entier, ou par
              « Surprends-moi encore », qui pioche dans la réserve. Deux gestes
              nommés valent mieux qu'un rang de vignettes de soixante points
              sous son propre visage.
           */}
          {/* QUAND LE RENDU A RATÉ, ON NE DEMANDE PAS DE DÉCIDER.
              « On me dit que ma main n'est pas bien positionnée, mais on ne me
              propose pas d'en prendre une nouvelle : je dois sortir et
              recommencer tout le parcours. » Exact — et c'était doublement
              absurde, parce qu'on continuait à proposer « Je la prends » sous une
              image où la pièce n'a pas pu être posée. On ne peut pas juger une
              pièce qu'on n'a pas vue : le seul geste utile est de reprendre. */}
          {rendu?.souci ? (
            <>
              <button type="button" className="mu-cta plein" onClick={() => appareil.current?.click()}>
                <i aria-hidden="true">📷</i>
                <span>
                  <b>Reprendre la photo</b>
                  <em>{mur.essai?.consigne}</em>
                </span>
              </button>
              <button type="button" className="mu-exemple" onClick={() => setEtape("choisir")}>
                {mots.autres}
              </button>
            </>
          ) : rate ? (
            <p className="mu-rendu-r">
              C’est noté, et ça ne compte pas comme un avis sur la pièce.
              <br />
              <b>Rien n’a été publié.</b>
            </p>
          ) : etape === "agir" ? (
            /* ═══ CE QU'ON PEUT FAIRE MAINTENANT ═════════════════════════════

               « Merci pour votre avis ! Ce look vous plaît ? Voici ce que vous
               pouvez faire maintenant. » Puis : ouvrir un salon, l'action
               commerciale du métier, mettre en favori.

               CET ÉCRAN N'EXISTAIT PAS, ET SON ABSENCE COÛTAIT LES TROIS GESTES
               À LA FOIS. Ils étaient sous la note, dans le même écran : on
               demandait de juger et de décider en même temps, donc on faisait
               l'un des deux à moitié. Séparés, l'avis se donne vraiment, et les
               trois suites arrivent au moment où l'on vient justement de se dire
               « et maintenant ? ».

               LE SALON PASSE DEVANT, ET C'EST UN RENVERSEMENT. « Je réserve »
               était le geste plein depuis le début. On ne choisit pas une coupe,
               une monture ou un tatouage tout seul : celui qui demande finit par
               réserver, tandis que celui à qui l'on demande de réserver tout de
               suite referme.

               L'ACTION DU MILIEU CHANGE AVEC LE MÉTIER, et c'est la seule chose
               de ce rituel qui change. Prendre rendez-vous chez un coiffeur, se
               faire mettre de côté un vêtement, réserver un bouquet : voir
               `mots.agir` dans `fantomes.ts`. */
            <div className="mu-rendu-ok">
              {/* LE FANTÔME FÊTE, ET C'EST LE SEUL ENDROIT DU PRODUIT OÙ IL LE
                  FAIT. On vient de lui donner quelque chose que personne d'autre
                  n'a — un avis sur soi — et un écran qui enchaîne sur trois
                  boutons sans un merci traite ça comme une formalité. */}
              <span className="mu-fete" aria-hidden="true">
                <Signe classe="mu-fete-s" />
              </span>
              <h3 className="mu-fete-t">Merci pour votre avis&nbsp;!</h3>
              <p className="mu-fete-p">
                {partage
                  ? `Votre ${mots.essayage} rejoint le mur ${chezQui(mur.lieu)}.`
                  : "Rien n’a été publié : votre essai reste pour vous."}
                <br />
                Voici ce que vous pouvez faire maintenant.
              </p>

              <div className="mu-agir">
                {/* OUVRIR UN SALON — le geste plein. Il ouvre CELUI de l'annonce,
                    avec ses propositions, son vote et sa réservation : on n'en
                    fabrique pas un second pour l'essai. */}
                {onSalon && rendu && !rendu.souci && (
                  <button
                    type="button"
                    className="mu-agir-b plein"
                    onClick={() =>
                      onSalon({ quoi: piece.nom, prix: piece.prix, image: rendu.image, note })
                    }
                  >
                    <i aria-hidden="true">
                      <svg className="mu-tr" viewBox="0 0 24 24">
                        <path d="M9 8.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM2.8 20.2c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6M16.2 5.6a3.2 3.2 0 0 1 0 6M17.6 15.1c2.3.6 3.8 2.5 3.8 5.1" />
                      </svg>
                    </i>
                    <span>
                      <b>Ouvrir un salon</b>
                      <em>pour en discuter avec mes amis</em>
                    </span>
                    <s aria-hidden="true">→</s>
                  </button>
                )}
                {/* L'ACTION DU MÉTIER. Elle ouvre la conversation avec le
                    commerçant — voir `prevenir` — et c'est le seul endroit du
                    parcours où l'on demande quelque chose. */}
                <button
                  type="button"
                  className="mu-agir-b"
                  disabled={restants < 1}
                  onClick={() => void prevenir(piece)}
                >
                  <i aria-hidden="true">
                    <Trace cle={mots.agir.picto} />
                  </i>
                  <span>
                    <b>{mots.agir.titre}</b>
                    <em>{mots.agir.detail}</em>
                  </span>
                  <s aria-hidden="true">→</s>
                </button>
                {onFavori && (
                  <button
                    type="button"
                    className={`mu-agir-b${favori ? " on" : ""}`}
                    onClick={onFavori}
                  >
                    <i aria-hidden="true">
                      <svg className="mu-tr" viewBox="0 0 24 24">
                        <path d="M12 20.6S3.6 15.4 3.6 9.8a4.9 4.9 0 0 1 8.4-3.4 4.9 4.9 0 0 1 8.4 3.4c0 5.6-8.4 10.8-8.4 10.8Z" />
                      </svg>
                    </i>
                    <span>
                      <b>{favori ? "Dans vos favoris" : "Mettre en favori"}</b>
                      <em>Pour le retrouver plus tard</em>
                    </span>
                    <s aria-hidden="true">→</s>
                  </button>
                )}
              </div>

              {/* MÊME LA CONFIRMATION NOMME LE LIEU. « Le commerçant vous
                  attend » était la dernière phrase générique du parcours, et
                  c'est celle qu'on relit en arrivant sur place. */}
              {/* ═══ ON NE DIT JAMAIS « C'EST RÉSERVÉ » ═══

                  Ni la feuille de partage ni WhatsApp n'ENVOIENT : ils ouvrent,
                  et c'est encore à la personne d'appuyer sur « envoyer ». Dire
                  « on vous attend » avant ça lui ferait croire que c'est fait,
                  et le salon ne saurait rien — le défaut qu'on corrige, en pire,
                  parce que cette fois elle y croit. Même règle que les
                  croissants : voir `lib/direct/prevenir.ts`. */}
              {/* ═══ LA CONFIRMATION N'ARRIVE QU'APRÈS LE GESTE ══════════════

                  ELLE S'AFFICHAIT TOUT DE SUITE, et c'était devenu un mensonge :
                  depuis que l'écran d'action existe, on arrive ici sans avoir
                  rien demandé à personne, et l'écran annonçait quand même « On
                  prépare votre message… » sous trois boutons qu'on n'avait pas
                  touchés. Elle attend donc `envoi` — c'est-à-dire la preuve
                  qu'une conversation s'est vraiment ouverte.

                  ET ON NE DIT JAMAIS « C'EST RÉSERVÉ ». Ni la feuille de partage
                  ni WhatsApp n'ENVOIENT : ils ouvrent, et c'est encore à la
                  personne d'appuyer sur « envoyer ». Dire « on vous attend »
                  avant ça lui ferait croire que c'est fait, et le commerçant ne
                  saurait rien. */}
              {envoi && (
                <p className={`mu-envoi${envoi.par === "fiction" ? " fiction" : ""}`}>
                  <b>
                    {envoi.par === "fiction"
                      ? `${mur.lieu} est un commerce inventé.`
                      : envoi.par === "abandon"
                        ? "Vous avez refermé le partage."
                        : `Envoyez le message, et ${leLieu(mur.lieu)} vous répondra.`}
                  </b>
                  {/* ═══ ON MONTRE LE MESSAGE PLUTÔT QUE D'OUVRIR WHATSAPP ═══
                      Le numéro est une fiction — un numéro tiré au hasard en
                      toucherait un vrai, chez quelqu'un — donc WhatsApp ne
                      trouve personne et s'ouvre sur la liste des conversations.
                      Voilà ce qui partirait chez un vrai commerçant. */}
                  {envoi.par === "fiction" && piece && (
                    <>
                      <em>
                        Son numéro&nbsp;
                        <s>{envoi.telephone}</s> appartient à la plage réservée à
                        la fiction&nbsp;: WhatsApp n’y trouve personne et
                        s’ouvrirait sur votre carnet d’adresses. Voilà le message
                        qui partirait chez un vrai commerçant&nbsp;:
                      </em>
                      <q>
                        Bonjour, {(mots.reserver ?? "je réserve").toLowerCase()}{" "}
                        pour «&nbsp;{piece.nom}&nbsp;» que je viens d’essayer sur
                        ClikMe.
                      </q>
                    </>
                  )}
                  {envoi.par === "whatsapp" && (
                    <em>
                      WhatsApp s’est ouvert sur la conversation avec{" "}
                      {leLieu(mur.lieu)}, le message écrit. Une adresse WhatsApp ne
                      peut pas transporter d’image — le bouton ci-dessous envoie le
                      rendu à part.
                    </em>
                  )}
                </p>
              )}
              {/* CE QUI EST PARTI SUR LE MUR, MONTRÉ PLUTÔT QUE DIT. Il n'y a
                  rien à montrer quand la case a été décochée : `pose` est alors
                  vide, et cette phrase ne s'écrit pas. */}
              {pose && (
                <p className="mu-pose-t">
                  Voilà ce qui vient d’être posé sur le mur, ici, pour deux
                  jours&nbsp;:
                </p>
              )}
              {/* ═══ LA PREUVE, PAS L'ANNONCE ═══

                  « Je n'ai pas l'impression que c'est sauvegardé sur le mur du
                  commerçant. » Mesuré : ça l'était. La mémoire contenait le
                  dépôt et « Vous » figurait bien sur le mur — on ne le voyait
                  simplement nulle part au moment de décider.

                  C'EST LA MÊME CARTE QUE SUR LE MUR, pas un aperçu fabriqué
                  pour l'occasion : même composant, même fantôme, même vignette.
                  Un aperçu qui se dessine à part finit toujours par mentir sur
                  ce qui a été posé. */}
              {pose && (
                <div className="mu-rendu-preuve">
                  <Carte f={pose} depot="essai" onDit={onMur} />
                </div>
              )}
              {/* LE GESTE RESTE OFFERT TANT QU'IL N'A PAS ABOUTI. Une feuille
                  de partage refermée par erreur ne doit pas coûter tout le
                  parcours. */}
              {decide === "pris" && piece && envoi?.par !== "partage" && (
                <button
                  type="button"
                  className="mu-cta plein"
                  onClick={() => void prevenir(piece)}
                >
                  <i aria-hidden="true">💬</i>
                  <span>
                    <b>{envoi ? "Rouvrir la conversation" : mur.essai?.mots.reserver}</b>
                    <em>Sur WhatsApp, {chezQui(mur.lieu)}</em>
                  </span>
                </button>
              )}
              {/* ═══ LA PHOTO SUIT, EN SECOND GESTE ═══════════════════════════

                  ON NE PEUT PAS AVOIR LES DEUX D'UN COUP, et c'est une
                  contrainte du téléphone, pas un choix : une adresse `wa.me`
                  connaît le numéro mais ne transporte pas d'image ; la feuille
                  de partage transporte l'image mais ne connaît personne.

                  LE DÉFAUT ÉTAIT D'AVOIR TRANCHÉ EN FAVEUR DE L'IMAGE : « ça
                  ouvre WhatsApp mais sur mon répertoire, alors que je devrais
                  être mis en contact avec le commerçant dont je ne connais pas
                  le numéro ». On ouvrait une liste d'amis pour un message
                  adressé à un opticien — un cul-de-sac.

                  ON LES FAIT DONC L'UN APRÈS L'AUTRE : d'abord le message
                  arrive, ensuite la photo suit pour qui veut. Ce bouton
                  n'apparaît qu'une fois le premier chemin emprunté, sinon il
                  poserait la question avant qu'elle ait un sens. */}
              {decide === "pris" && piece && rendu && !rendu.souci && envoi?.par === "whatsapp" && (
                <button
                  type="button"
                  className="mu-exemple"
                  onClick={() => void envoyerLaPhoto(piece)}
                >
                  📎 Envoyer aussi le rendu
                </button>
              )}
              <button
                type="button"
                className="mu-e-autres"
                onClick={() => {
                  setDecide(null);
                  setEtape("choisir");
                }}
              >
                {mots.autres}
              </button>
            </div>
          ) : null}
          {!decide && (
            <p className="mu-rendu-n">
              {rate
                ? "Merci : c’est ce qui nous dit sur quels métiers l’essai tient debout."
                : etape === "avis"
                  ? // ELLE DISAIT « votre essai reste sur le mur, quoi que vous
                    // decidiez », ce qui est FAUX depuis qu'une case decide. Et
                    // la case le dit deja, trois centimetres plus haut.
                    ""
                  : "Rien n’est publié tant que vous n’avez pas donné votre avis."}
            </p>
          )}
        </div>
      )}

      {/* LE MUR, ET IL TIENT EN UN BOUTON. « Avec un seul bouton quelque part qui
          dit voir le mur du commerçant ou voir ce que les clients ont essayé. »
          Il est en bas, après l'essai, et il est le seul de l'écran à ne pas
          parler d'essayer. Pendant le calcul il disparaît : on ne propose pas de
          partir au milieu d'une attente de quelques secondes. */}
      {etape !== "calcul" && etape !== "recherche" && etape !== "avis" && versLeMur}

      {/* LE RENDU EN PLEIN ÉCRAN. Fond noir, aucune commande sauf fermer : ce
          qu'on vient juger, c'est une couleur et une forme, et tout ce qui est
          autour ment sur les deux. */}
      {loupe && piece && (
        <div
          className="mu-loupe"
          role="dialog"
          aria-modal="true"
          aria-label={`${piece.nom}, en grand`}
          onClick={() => setLoupe(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rendu?.image ?? piece.rendu ?? piece.photo} alt={`Essai : ${piece.nom}`} />
          <button type="button" className="mu-loupe-x" aria-label="Fermer">
            ✕
          </button>
          <span className="mu-loupe-n">{piece.nom}</span>
        </div>
      )}
    </>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine. */

        html:has(.mu),body:has(.mu){margin:0;background:#070B12;
          overscroll-behavior-y:none;}

        /* ─── LA COULEUR DU FANTOME ───
           VIOLET, ET C'EST LA SEULE CHOSE DU PRODUIT QUI LA PORTE. La menthe est
           la couleur du commerce (reserver, y aller), l'ambre celle de l'urgence
           (le flash, le prix). Le fantome n'est ni l'un ni l'autre : il est ce
           qu'on laisse de soi. Lui donner la menthe l'aurait range parmi les
           actions du commerce, et c'est exactement ce qu'il n'est pas. */
        .mu{--mu-fond:#0C121D;--mu-encre:#EAF0F6;--mu-pale:#8A9AAE;
          --mu-ligne:rgba(255,255,255,.08);--mu-carte:rgba(255,255,255,.045);
          --mu-v1:#8B7DF6;--mu-v2:#C77DF0;--mu-menthe:#3DE2A6;--mu-ambre:#FFC400;
          background:#070B12;color:var(--mu-encre);
          font-family:'Inter',system-ui,-apple-system,sans-serif;
          max-width:560px;margin:0 auto;min-height:100vh;
          -webkit-font-smoothing:antialiased;}
        .mu *{box-sizing:border-box;}

        .mu-maq{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
          background:#080D15;border-bottom:1px solid var(--mu-ligne);
          padding:calc(7px + env(safe-area-inset-top)) 10px 8px;}
        .mu-maq::-webkit-scrollbar{display:none;}
        .mu-maq button{flex:none;font-family:inherit;font-size:11.5px;font-weight:700;
          border:1px solid var(--mu-ligne);background:transparent;color:#93A3B6;
          border-radius:20px;padding:6px 11px;white-space:nowrap;cursor:pointer;}
        .mu-maq button.on{background:linear-gradient(120deg,var(--mu-v1),var(--mu-v2));
          color:#0B0714;border-color:transparent;}

        /* ─── LA PAGE DU COMMERCE, DERRIERE ───
           Elle n'est pas un decor : c'est elle qui donne son sens au mot « ici ».
           On ne quitte pas le commerce pour voir son mur. */
        /* 290 ET PAS 248 : les etiquettes du commerce passaient sous la feuille,
           qui remonte de vingt-six points. Une page qui coupe sa propre premiere
           ligne se lit comme une erreur de mise en page, pas comme une
           superposition voulue. */
        .mu-fond{position:relative;height:290px;overflow:hidden;}
        .mu-fond img{width:100%;height:100%;object-fit:cover;display:block;}
        .mu-fond-v{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(7,11,18,.62) 0%,rgba(7,11,18,.1) 34%,
            rgba(7,11,18,.72) 78%,rgba(7,11,18,.96) 100%);}
        .mu-fond-b{position:absolute;top:12px;left:12px;right:12px;z-index:2;
          display:flex;align-items:center;gap:10px;}
        .mu-fond-r,.mu-fond-c{flex:none;display:inline-flex;align-items:center;
          justify-content:center;width:36px;height:36px;border-radius:50%;
          text-decoration:none;font-size:16px;color:#EAF0F6;background:rgba(6,10,16,.55);
          -webkit-backdrop-filter:blur(9px);backdrop-filter:blur(9px);}
        .mu-fond-b>b{flex:1;text-align:center;font-size:16px;font-weight:700;
          text-shadow:0 2px 12px rgba(0,0,0,.7);}
        .mu-fond-t{position:absolute;left:16px;right:16px;bottom:36px;z-index:2;}
        .mu-fond-k{display:block;font-size:10px;font-weight:900;letter-spacing:.15em;
          text-transform:uppercase;color:var(--mu-pale);margin-bottom:2px;}
        .mu-fond-t h1{margin:0;font-size:26px;font-weight:800;line-height:1.08;
          text-shadow:0 2px 16px rgba(0,0,0,.75);}
        .mu-fond-t p{margin:5px 0 0;display:flex;align-items:center;gap:5px;
          font-size:12.5px;color:#C7D4E2;}
        .mu-fond-t p i{font-style:normal;}
        .mu-fond-t p i:first-child{color:var(--mu-ambre);}
        .mu-fond-t p b{font-weight:800;}
        .mu-fond-t p s{text-decoration:none;color:var(--mu-pale);margin-right:6px;}
        .mu-fond-e{display:flex;gap:7px;margin-top:8px;flex-wrap:wrap;}
        .mu-fond-e span{font-size:11.5px;font-weight:600;color:#C7D4E2;
          background:rgba(255,255,255,.1);border-radius:20px;padding:5px 11px;}

        /* ─── LA FEUILLE ───
           Elle MONTE sur la page, elle ne la remplace pas : les coins arrondis
           en haut et le retrait de la photo disent qu'il y a quelque chose
           dessous, et c'est ce qui evite qu'on la prenne pour un autre ecran. */
        .mu-feuille{position:relative;z-index:3;margin-top:-26px;
          background:var(--mu-fond);border-radius:26px 26px 0 0;
          border-top:1px solid rgba(139,125,246,.26);
          box-shadow:0 -24px 60px -30px rgba(0,0,0,.9);
          padding:22px 16px calc(26px + env(safe-area-inset-bottom));}

        .mu-x{position:absolute;top:16px;right:14px;z-index:4;width:34px;height:34px;
          border-radius:50%;border:none;cursor:pointer;font-size:14px;
          color:#C7D4E2;background:rgba(255,255,255,.09);}

        /* ─── LE FANTOME, EN TETE ─── */
        .mu-tete{display:flex;align-items:center;gap:14px;margin-bottom:12px;}
        .mu-tete.centre{flex-direction:column;gap:6px;text-align:center;}
        .mu-tete.centre.depot{padding-top:14px;}
        /* ─── PAS DE HALO SUR LE GRAND FANTOME ───
           Une ombre portee de vingt-six points deborde de la boite qui defile,
           et une boite qui defile coupe aussi en largeur : le halo se
           terminait par un BORD DROIT net, ce qui donnait un fantome
           « coupe sur sa partie droite ». Un dessin blanc sur un fond quasi
           noir n'a besoin d'aucune lueur pour se voir. */
        .mu-gros{width:74px;height:80px;flex:none;}
        .mu-gros .mu-f-corps{fill:#F3F0FF;}
        .mu-gros .mu-f-oeil{fill:#2A1E4D;}
        .mu-gros .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-tete>div>b{display:block;font-size:26px;font-weight:800;line-height:1.05;}
        .mu-tete>div>em{display:block;font-style:normal;font-size:15px;font-weight:600;
          color:var(--mu-pale);margin-top:3px;}

        /* L'ANNOTATION A LA MAIN. Elle n'est pas decorative : elle dit une chose
           que le produit doit dire et que personne ne lirait dans un paragraphe. */
        .mu-manus{margin:0;font-size:13.5px;line-height:1.35;font-style:italic;
          font-weight:600;color:#C9BCFF;transform:rotate(-3deg);position:relative;}
        .mu-manus i{font-style:normal;display:block;font-size:17px;margin-top:2px;}

        .mu-d-t{margin:2px 0 8px;font-size:26px;font-weight:800;line-height:1.15;
          text-align:center;}
        .mu-d-t b{background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));
          -webkit-background-clip:text;background-clip:text;color:transparent;}
        .mu-d-i{margin:0 0 16px;font-size:12.5px;line-height:1.55;text-align:center;
          color:var(--mu-pale);}

        /* ─── LE GESTE ─── */
        .mu-cta{display:flex;align-items:center;gap:12px;width:100%;
          font-family:inherit;cursor:pointer;border:none;border-radius:30px;
          padding:13px 18px 13px 13px;
          background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));color:#160D28;
          box-shadow:0 18px 42px -20px rgba(160,120,246,.95);
          transition:transform .12s ease,opacity .16s ease;}
        .mu-cta.plein{margin-top:14px;}
        .mu-cta:disabled{opacity:.42;cursor:default;box-shadow:none;}
        .mu-cta:not(:disabled):active{transform:scale(.98);}
        .mu-cta-s{width:34px;height:37px;flex:none;}
        .mu-cta-s .mu-f-corps{fill:#fff;}
        .mu-cta-s .mu-f-oeil{fill:#3B2A6B;}
        .mu-cta-s .mu-f-bouche{fill:none;stroke:#3B2A6B;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-cta>span{flex:1;min-width:0;text-align:left;}
        .mu-cta b{display:block;font-size:16px;font-weight:800;}
        .mu-cta em{display:block;font-style:normal;font-size:11.5px;font-weight:600;
          opacity:.72;margin-top:1px;}
        .mu-cta>i{flex:none;font-style:normal;font-size:19px;font-weight:700;}

        /* ─── LES INTITULES DE SECTION ─── */
        .mu-sect{display:flex;align-items:center;gap:8px;margin:24px 0 12px;}
        .mu-sect.petit{margin-top:20px;}
        .mu-sect-i{flex:none;font-size:13px;width:32px;height:32px;border-radius:11px;
          display:flex;align-items:center;justify-content:center;
          background:rgba(255,255,255,.07);}
        .mu-sect-s{flex:none;width:22px;height:24px;}
        .mu-sect-s .mu-f-corps{fill:#F3F0FF;}
        .mu-sect-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-sect-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-sect h2{margin:0;font-size:17px;font-weight:800;white-space:nowrap;}
        /* LE NOM DU LIEU EST COUPE, PAS LE TITRE. « Une prothesiste ongulaire »
           poussait « Le mur du jour » sur deux lignes : c'est l'intitule fixe
           qui doit tenir, et l'etiquette variable qui cede. */
        .mu-sect-j{min-width:0;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;font-size:12px;font-weight:700;color:#C9BCFF;
          font-style:italic;}
        .mu-sect-j::before{content:"◆ ";font-size:8px;vertical-align:middle;}
        .mu-sect-v{margin-left:auto;font-family:inherit;font-size:12px;font-weight:700;
          color:#C9BCFF;white-space:nowrap;cursor:pointer;border:none;
          background:rgba(139,125,246,.13);border-radius:20px;padding:6px 11px;}
        .mu-sect-v:active{transform:scale(.96);}
        /* ─── LE MUR DEPLIE ───
           La rangee qui defile de cote devient une grille de deux colonnes :
           tout est la, rien ne se cache derriere le bord droit. Les cartes de la
           maison gardent leur taille — c'est la hierarchie du mur. */
        /* ─── LE MUR : UNE SEULE LISTE, QUI DESCEND ───
           « Pour les bars, restaurants et evenements, quand on clique sur le
           fantome c'est encore tres confus ; je prefere un agencement plus
           clair. »
           IL Y AVAIT DEUX RANGEES QUI DEFILAIENT SUR LE COTE, a deux tailles
           differentes, et la deuxieme carte de chaque rangee etait COUPEE par le
           bord de l'ecran. On ne pouvait donc ni compter ce qu'il y avait, ni
           lire une carte en entier sans la faire glisser — et rien ne disait
           qu'il fallait la faire glisser. Une liste qui descend se lit avec le
           pouce, comme tout le reste du telephone.
           LA CARTE DEVIENT HORIZONTALE : la photo a gauche, ce qui est ecrit a
           droite. C'est ce qui permet d'en voir cinq d'un coup au lieu de deux et
           demie, et la photo garde une taille ou l'on voit de quoi il s'agit. */
        .mu-rang{display:flex;flex-direction:column;gap:10px;}
        /* « Voir tout » ne change plus la forme : tout est deja deplie et lisible.
           La classe reste pour le pied qui compte. */
        .mu-rang.tout{display:flex;}

        .mu-c{width:100%;background:var(--mu-carte);
          border:1px solid var(--mu-ligne);border-radius:18px;overflow:hidden;
          display:flex;flex-direction:row;align-items:stretch;}
        /* LA PHOTO NE S'ETIRE PAS AVEC LE TEXTE : un mot long ne doit pas
           agrandir l'image, sinon deux cartes voisines n'ont plus la meme. */
        .mu-c-p{position:relative;flex:none;width:114px;align-self:stretch;
          min-height:114px;background:#101825;}
        .mu-c.grande .mu-c-p{width:124px;min-height:124px;}
        .mu-c-p img{width:100%;height:100%;object-fit:cover;display:block;
          position:absolute;inset:0;}
        .mu-c-vide{width:100%;height:100%;
          background:linear-gradient(150deg,#1B2436,#0E141F);}
        /* LE FANTOME TIENT LA PLACE DU PORTRAIT : la personne est la, sans que
           sa tete y soit. Voir l'en-tete du fichier. */
        /* L'AVATAR RENTRE DANS LA PHOTO. Il debordait vers le bas quand la carte
           etait verticale ; sur une carte horizontale ce bas-la est le milieu du
           texte. Il se pose donc dans le coin de l'image. */
        .mu-c-av{position:absolute;left:7px;bottom:7px;width:30px;height:30px;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(150deg,#2A2150,#150F2C);
          border:1px solid rgba(139,125,246,.5);
          box-shadow:0 6px 16px -8px rgba(0,0,0,.9);}
        .mu-c-signe{width:16px;height:17px;}
        .mu-c-signe .mu-f-corps{fill:#E9E2FF;}
        .mu-c-signe .mu-f-oeil{fill:#2A1E4D;}
        .mu-c-signe .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:2;
          stroke-linecap:round;}
        /* LA PASTILLE PASSE EN HAUT A GAUCHE : a droite, elle tombait sur le
           bord de la photo, qui ne fait plus toute la largeur de la carte. */
        .mu-c-b{position:absolute;top:7px;left:7px;font-size:9px;font-weight:900;
          letter-spacing:.05em;text-transform:uppercase;border-radius:20px;
          padding:3px 7px;max-width:calc(100% - 14px);overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;}
        .mu-c-b.staff{background:var(--mu-menthe);color:#04150E;}
        .mu-c-b.verbe{background:linear-gradient(110deg,var(--mu-v1),var(--mu-v2));
          color:#150C26;}
        .mu-c-b.essai{background:rgba(109,40,217,.92);color:#F0E6FF;}

        .mu-c-t{flex:1;min-width:0;display:flex;flex-direction:column;
          padding:10px 11px 10px 12px;}
        .mu-c-n{display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;}
        .mu-c-n b{font-size:13.5px;font-weight:800;}
        .mu-c-n u{text-decoration:none;font-size:11.5px;font-weight:700;
          color:#C9BCFF;}
        .mu-c-n s{text-decoration:none;margin-left:auto;font-size:10.5px;
          color:var(--mu-pale);font-variant-numeric:tabular-nums;}
        .mu-c-t p{margin:5px 0 0;font-size:12.5px;line-height:1.4;color:#C7D4E2;}
        .mu-c-e{display:flex;flex-wrap:wrap;align-items:center;gap:7px;
          margin-top:5px;font-size:11px;font-weight:700;color:#C9BCFF;}
        /* LA NOTE SUR LE MUR : cinq fantomes de onze points, pas un chiffre.
           « 4/5 » se lit comme une note de service ; quatre fantomes allumes
           sur cinq se lisent d'un coup d'oeil et disent de quel produit on
           parle. */
        /* ELLE TENAIT SUR UNE COLONNE, ET C'EST UN DEFAUT DE MESURE ANCIEN.
           Ecrite display:inline-flex toute seule, elle est un ELEMENT FLEXIBLE
           de .mu-c-e, qui passe a la ligne — donc elle se faisait ecraser a
           dix points de large et ses cinq fantomes s'empilaient l'un sur
           l'autre. flex:none lui rend sa largeur : c'est la seule chose de
           cette ligne qui ne doit jamais retrecir. */
        .mu-c-e .mu-c-note{display:flex;flex:none;align-items:center;gap:1.5px;}
        .mu-c-ns{width:10px;height:11px;opacity:.26;}
        .mu-c-ns .mu-f-corps{fill:#5A6B7C;}
        .mu-c-ns .mu-f-oeil,.mu-c-ns .mu-f-bouche{display:none;}
        .mu-c-ns.on{opacity:1;}
        .mu-c-ns.on .mu-f-corps{fill:#C9BCFF;}
        /* LE PIED S'EMPILE, IL NE SE PARTAGE PLUS LA LIGNE.
           Le bouton et sa phrase etaient cote a cote : sur une carte de deux
           cents points, « On pourra en parler sur place » se repliait en colonne
           de deux mots a cote du pouce — illisible, et mesure a l'ecran. Le
           geste prend sa ligne, sa consequence prend la suivante. */
        .mu-c-f{margin-top:auto;padding-top:10px;}

        /* ═══ LA CARTE D'UN MUR DE LIEU, D'APRES LA MAQUETTE ═════════════════

           « Restaurant, bars et evenements : respecter le design la aussi. »

           LA PHOTO PASSE A DROITE ET DEVIENT UNE VIGNETTE. Elle occupait une
           colonne pleine hauteur a gauche : sur un mur de bar, ce n'est pas
           elle qu'on vient lire — c'est le message. Une photo de comptoir en
           cent quatorze points de large prenait un tiers de la carte pour dire
           « c'est un bar », ce que le titre de l'ecran dit deja.

           ET SUR LA GRILLE D'ESSAI, RIEN NE BOUGE : la vignette y EST le
           contenu, et elle garde toute la largeur de la carte. */
        .mu-rang:not(.grille) .mu-c{flex-direction:row-reverse;padding:12px;
          gap:11px;align-items:flex-start;}
        .mu-rang:not(.grille) .mu-c-p{width:72px;min-height:0;height:72px;
          align-self:flex-start;border-radius:14px;overflow:hidden;}
        .mu-rang:not(.grille) .mu-c.grande .mu-c-p{width:78px;height:78px;}
        .mu-rang:not(.grille) .mu-c-t{padding:0;min-width:0;flex:1;}

        /* LE FANTOME ET LA PASTILLE SUR LA LIGNE DU PRENOM. Sur la maquette
           elles precedent le nom — ici elles ne decrivent pas une image, elles
           disent QUI parle, et cette information appartient au texte. */
        .mu-c-av2{flex:none;width:30px;height:30px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:linear-gradient(150deg,#2A2150,#150F2C);
          border:1px solid rgba(139,125,246,.5);}
        .mu-c-av2 .mu-c-signe{width:17px;height:19px;}
        /* LA PASTILLE ETAIT POSEE SUR LA PHOTO, EN ABSOLU : rendue dans le
           texte, elle serait restee accrochee au coin de la carte. */
        .mu-rang:not(.grille) .mu-c-n .mu-c-b{position:static;flex:none;}
        .mu-rang:not(.grille) .mu-c-n{flex-wrap:wrap;gap:7px;}

        /* LES TROIS FANTOMES EMPILES ET LE COMPTE, SUR LA LIGNE DES GESTES.
           La maquette met le compte a gauche et les boutons a droite : le
           nombre est ce qui donne envie d'appuyer, il doit etre lu AVANT. */
        .mu-int-v{display:inline-flex;margin-right:7px;vertical-align:-5px;}
        .mu-int-vs{width:19px;height:21px;margin-left:-7px;}
        .mu-int-vs:first-child{margin-left:0;}
        .mu-int-vs .mu-f-corps{fill:#C9BCFF;}
        .mu-int-vs .mu-f-oeil{fill:#1A1040;}
        .mu-int-vs .mu-f-bouche{fill:none;stroke:#1A1040;stroke-width:2.4;
          stroke-linecap:round;}

        /* LE SECOND GESTE. Il est en contour et non en plein : « Ca m'interesse »
           s'adresse au lieu et c'est le geste principal de ce mur ; « En parler »
           emporte le message ailleurs, et deux boutons pleins cote a cote ne
           laisseraient plus voir lequel repond a l'ecran. */
        .mu-parler{display:inline-flex;align-items:center;gap:7px;
          padding:9px 14px;font:inherit;font-size:12.5px;font-weight:800;
          color:#D7E2EE;cursor:pointer;background:transparent;
          border:1px solid rgba(255,255,255,.2);border-radius:99px;}
        .mu-parler i{font-style:normal;font-size:12px;}

        /* ═══ LE PIED DE CARTE, DANS L'ORDRE DE LA MAQUETTE ══════════════════

           ELLE MET LE COMPTE A GAUCHE ET LES DEUX GESTES A DROITE, sur une
           ligne, puis la legende dessous. C'est le bon ordre de lecture : le
           nombre est ce qui donne envie d'appuyer, il doit se lire AVANT le
           bouton — empile dessous, il arrivait apres la decision.

           ON REORDONNE PLUTOT QUE DE REECRIRE LE DOM, parce que l'ordre du
           document est celui du lecteur d'ecran : le geste et sa consequence
           s'y suivent, et c'est ainsi qu'il faut les entendre. Seul l'oeil a
           besoin de l'autre ordre. */
        .mu-rang:not(.grille) .mu-c-f{display:flex;flex-wrap:wrap;
          align-items:center;gap:9px;}
        .mu-rang:not(.grille) .mu-c-f .mu-int-n{order:1;flex:1 1 100%;
          min-width:0;margin:0;}
        /* LES DEUX GESTES SE PARTAGENT LA LIGNE EN DEUX MOITIES EGALES.
           MESURE : la colonne de texte fait deux cent quarante-trois points une
           fois la vignette et les marges retirees, et les deux boutons a leur
           taille naturelle en faisaient deux cent soixante — ils passaient donc
           a la ligne l'un sous l'autre, ce qui n'est ni la maquette ni lisible.
           A cinquante pour cent chacun ils tiennent, et ils restent egaux : la
           maquette les met cote a cote parce qu'ils repondent a deux questions
           differentes, pas parce que l'un compte plus que l'autre. */
        .mu-rang:not(.grille) .mu-c-f .mu-int{order:2;
          flex:1 1 calc(50% - 5px);min-width:0;width:auto;
          justify-content:center;font-size:11px;padding:8px 10px;}
        .mu-rang:not(.grille) .mu-c-f .mu-int span{flex:none;}
        .mu-rang:not(.grille) .mu-c-f .mu-parler{order:3;
          flex:1 1 calc(50% - 5px);min-width:0;
          justify-content:center;font-size:11px;padding:8px 10px;}
        .mu-rang:not(.grille) .mu-c-f .mu-int-d{order:4;flex:1 1 100%;margin:0;}
        .mu-c-d{display:inline-flex;align-items:center;gap:4px;margin-top:6px;
          font-size:10.5px;font-weight:700;color:var(--mu-pale);}
        .mu-c-d i{font-style:normal;}

        /* ─── L'HUMEUR ───
           Quatre teintes, pas douze : au-dela, plus rien ne tranche. */
        .mu-hum{display:inline-flex;align-items:center;gap:5px;margin-top:8px;
          align-self:flex-start;font-size:10.5px;font-weight:800;
          border-radius:20px;padding:4px 9px;}
        .mu-hum i{font-style:normal;font-size:11px;}
        .mu-hum.menthe{background:rgba(61,226,166,.16);color:#7DF0C4;}
        .mu-hum.violet{background:rgba(139,125,246,.2);color:#C9BCFF;}
        .mu-hum.ambre{background:rgba(255,196,0,.16);color:#FFD866;}
        .mu-hum.bleu{background:rgba(93,160,255,.18);color:#9CC6FF;}

        /* ─── « CA M'INTERESSE » ───
           IL RESTE PETIT, ET C'EST LA REGLE. Le jour ou le chiffre devient gros,
           on a refabrique le like — et un like est gratuit, donc il ne veut rien
           dire. Celui-ci engage : on accepte d'etre mis en relation. */
        .mu-int{width:100%;display:flex;align-items:center;gap:6px;
          font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;
          border:1px solid rgba(139,125,246,.34);background:rgba(139,125,246,.1);
          color:#D6CCFF;border-radius:20px;padding:6px 9px;
          transition:transform .12s ease;}
        .mu-int i{font-style:normal;font-size:12px;}
        .mu-int span{flex:1;min-width:0;text-align:left;overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;}
        .mu-int:active{transform:scale(.96);}
        .mu-int.on{background:linear-gradient(110deg,var(--mu-v1),var(--mu-v2));
          color:#150C26;border-color:transparent;}

        /* LE QUOTA, ECRIT A LA MAIN, JUSTE AU-DESSUS DU MUR. */

        /* ─── LE CONTEXTE DU COMMERCE ───
           Le seul endroit de la feuille ou le commerce parle de ce qu'il vend, et
           il est en bas : la feuille appartient aux gens qui sont passes. */
        .mu-ctx{display:flex;align-items:center;gap:12px;margin-top:20px;
          background:var(--mu-carte);border:1px solid var(--mu-ligne);
          border-radius:18px;padding:11px;}
        .mu-ctx img{flex:none;width:78px;height:64px;border-radius:13px;
          object-fit:cover;display:block;}
        .mu-ctx>div{flex:1;min-width:0;}
        .mu-ctx span{display:block;font-size:10.5px;font-weight:800;
          letter-spacing:.08em;text-transform:uppercase;color:var(--mu-pale);}
        .mu-ctx b{display:block;font-size:15px;font-weight:800;margin-top:2px;}
        .mu-ctx em{display:block;font-style:normal;font-size:11.5px;color:var(--mu-pale);
          margin-top:1px;}
        .mu-ctx-b{flex:none;font-family:inherit;font-size:11.5px;font-weight:800;
          cursor:pointer;color:#EAF0F6;background:rgba(255,255,255,.09);
          border:1px solid var(--mu-ligne);border-radius:20px;padding:9px 12px;
          white-space:nowrap;}

        /* LA SORTIE : le lieu ancre, il n'enferme pas. */
        .mu-ailleurs{display:flex;align-items:center;gap:9px;margin:16px 0 0;
          font-size:12px;line-height:1.4;color:var(--mu-pale);
          background:rgba(255,255,255,.04);border:1px solid var(--mu-ligne);
          border-radius:18px;padding:13px 14px;}
        .mu-ailleurs i{font-style:normal;font-size:14px;}
        .mu-ailleurs b{margin-left:auto;font-size:15px;color:#C9BCFF;}

        /* ─── LE DEPOT PAR ANNONCE ─── */
        .mu-verbes{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;
          padding-bottom:3px;margin-bottom:12px;}
        .mu-verbes::-webkit-scrollbar{display:none;}
        .mu-verbes button{flex:none;display:inline-flex;flex-direction:column;
          align-items:center;gap:5px;font-family:inherit;font-size:11.5px;
          font-weight:700;cursor:pointer;color:#C7D4E2;
          background:rgba(255,255,255,.045);border:1px solid var(--mu-ligne);
          border-radius:16px;padding:11px 12px;min-width:88px;}
        .mu-verbes button i{font-style:normal;font-size:17px;}
        /* CHOISIE, ELLE EST PLEINE — pas seulement bordee. Le contour seul ne se
           voyait pas au soleil ni du coin de l'oeil, et l'appui semblait ne
           rien faire. */
        .mu-verbes button.on{border-color:transparent;color:#160D28;
          background:linear-gradient(120deg,var(--mu-v1),var(--mu-v2));
          box-shadow:0 10px 24px -14px rgba(160,120,246,.95);}
        .mu-verbes button.on i{filter:none;}

        .mu-champ{position:relative;background:rgba(255,255,255,.04);
          border:1px solid var(--mu-ligne);border-radius:18px;padding:13px 13px 9px;}
        .mu-champ textarea{width:100%;min-height:82px;resize:none;border:none;
          background:none;color:var(--mu-encre);font-family:inherit;font-size:14px;
          line-height:1.45;outline:none;}
        .mu-champ textarea::placeholder{color:#66748A;}
        /* EN BAS A DROITE, PAS EN HAUT : pose sur la premiere ligne, le compteur
           passait par-dessus l'exemple ecrit dans le champ et on lisait
           « ...le concert de0/150 ». */
        .mu-compte{position:absolute;right:14px;bottom:16px;font-size:10.5px;
          color:var(--mu-pale);font-variant-numeric:tabular-nums;}
        .mu-photo{display:inline-flex;align-items:center;gap:8px;font-family:inherit;
          font-size:12px;font-weight:600;cursor:pointer;color:var(--mu-pale);
          background:none;border:none;padding:6px 0 0;}
        .mu-photo i{font-style:normal;font-size:15px;width:28px;height:28px;
          border-radius:50%;display:inline-flex;align-items:center;
          justify-content:center;background:rgba(255,255,255,.07);}

        .mu-humeurs{margin-top:14px;}
        .mu-humeurs>span{display:block;font-size:11.5px;font-weight:700;
          color:var(--mu-pale);margin-bottom:7px;}
        .mu-humeurs>div{display:flex;gap:7px;flex-wrap:wrap;}
        .mu-humeurs button{display:inline-flex;align-items:center;gap:5px;
          font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;
          border-radius:20px;padding:6px 11px;border:1px solid transparent;}
        .mu-humeurs button i{font-style:normal;font-size:12px;}
        .mu-humeurs button.menthe{background:rgba(61,226,166,.13);color:#7DF0C4;}
        .mu-humeurs button.violet{background:rgba(139,125,246,.16);color:#C9BCFF;}
        .mu-humeurs button.ambre{background:rgba(255,196,0,.13);color:#FFD866;}
        .mu-humeurs button.bleu{background:rgba(93,160,255,.15);color:#9CC6FF;}
        .mu-humeurs button.on{border-color:currentColor;}

        /* ─── LE DEPOT PAR ESSAI ───
           LA FRISE 1-2-3 A ETE RETIREE avec son style : sur un parcours de trois
           ecrans qui ne montrent qu'une chose chacun, elle ne rassurait pas, elle
           prevenait qu'il allait falloir en faire trois. Il reste un titre et une
           phrase, tous deux ecrits par le metier. */
        .mu-e-tete{text-align:center;padding:2px 2px 15px;}
        .mu-e-tete h2{margin:0;font-size:25px;line-height:1.14;font-weight:850;
          letter-spacing:-.03em;color:#fff;}
        .mu-e-tete p{margin:9px 0 0;font-size:13.5px;line-height:1.5;
          color:var(--mu-pale);}

        /* LE SEUL LIEN VERS LE MUR. Il est volontairement sans couleur et sans
           fond : tout ce qui brille sur cet ecran doit mener a l'essai. */
        .mu-e-mur{display:flex;align-items:center;justify-content:center;gap:7px;
          width:100%;margin:20px 0 0;padding:11px 12px;font-family:inherit;
          font-size:12.5px;font-weight:700;color:#93A3B6;cursor:pointer;
          background:transparent;border:1px solid var(--mu-ligne);
          border-radius:13px;}
        .mu-e-mur i{font-style:normal;font-size:13px;}

        /* Essayer autre chose : le geste le plus frequent apres un rendu. */
        .mu-e-autres{display:block;width:100%;margin:9px 0 0;padding:10px 12px;
          font-family:inherit;font-size:13px;font-weight:800;color:#C9BCFF;
          cursor:pointer;background:rgba(139,125,246,.12);
          border:1px solid rgba(139,125,246,.3);border-radius:13px;}

        /* ═══ LA TÊTE DU MUR ═══ voir le composant EcranMur : une seule tête,
           deux phrases selon le métier, et plus aucun titre de section. */
        /* ─── CHEZ QUI ON EST ───
           En haut de la feuille, avant tout le reste, et dans les deux ecrans :
           l'annonce est cachee DERRIERE la feuille, donc « ici » ne renvoyait a
           rien. La croix de fermeture occupe le coin droit — d'ou la marge. */
        .mu-chez{display:flex;align-items:center;gap:8px;
          padding:0 44px 12px 2px;}
        .mu-chez>i{font-style:normal;font-size:14px;flex:none;}
        .mu-chez>span{min-width:0;display:flex;flex-direction:column;
          line-height:1.25;}
        .mu-chez b{font-size:15px;font-weight:850;color:#fff;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .mu-chez em{font-style:normal;font-size:11.5px;font-weight:700;
          color:var(--mu-pale);overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;}
        /* SUR LE PARCOURS D'ESSAI IL TIENT SUR UNE LIGNE, en petit : il n'est
           plus un titre, il est un repere. Voir le composant. */
        .mu-chez.court{padding-bottom:10px;}
        .mu-chez.court b{font-size:12.5px;font-weight:750;color:var(--mu-pale);}

        .mu-haut{text-align:center;padding:2px 2px 14px;}
        /* LE FANTOME, LE TITRE ET LE GESTE SUR UNE SEULE LIGNE. Voir le
           composant : cinq blocs empiles repoussaient le mur hors de l'ecran. */
        .mu-haut-r{display:flex;align-items:center;gap:11px;text-align:left;
          flex-wrap:wrap;}
        .mu-haut-r h2{flex:1;min-width:150px;margin:0;}
        .mu-haut-p{flex:none;display:inline-flex;align-items:center;gap:7px;
          padding:8px 13px 8px 9px;font-family:inherit;font-size:12.5px;
          font-weight:800;color:#EDE7FF;cursor:pointer;
          background:rgba(139,125,246,.16);
          border:1px solid rgba(139,125,246,.44);border-radius:99px;}
        .mu-haut-ps{width:18px;height:20px;flex:none;}
        .mu-haut-ps .mu-f-corps{fill:#EDE7FF;}
        .mu-haut-ps .mu-f-oeil{fill:#2A1E4D;}
        .mu-haut-ps .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:2.4;
          stroke-linecap:round;}
        .mu-haut-s{width:46px;height:50px;flex:none;display:block;}
        .mu-haut-s .mu-f-corps{fill:#F3F0FF;}
        .mu-haut-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-haut-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-haut h2{margin:9px 0 0;font-size:21px;line-height:1.14;
          font-weight:850;letter-spacing:-.03em;color:#fff;}
        .mu-haut h2 i{font-style:italic;color:var(--mu-v2);}
        .mu-haut>p{margin:10px 0 0;font-size:12.5px;line-height:1.5;
          text-align:left;color:var(--mu-pale);}
        /* ═══ L'INVITATION, D'APRES LA MAQUETTE ════════════════════════════

           « Restaurant, bars et evenements : respecter le design la aussi. Le
           fantome amene sur le mur du restaurant avec la possibilite de mettre
           son propre fantome. »

           ELLE ETAIT UNE PASTILLE EN CONTOUR au bout d'une ligne. Elle tenait
           peu de place — c'est ce qu'on lui demandait alors — mais elle est LE
           geste de ce mur-la : chez un bar on ne vient pas essayer, on vient
           dire qu'on est la. La maquette lui donne son cadre et son degrade,
           et elle a raison : une invitation qui a l'air d'un lien secondaire
           ne se prend pas.

           LE FANTOME PASSE A GAUCHE ET LE BOUTON A DROITE, en ligne tant que
           l'ecran le permet ; sous quatre cent vingt points le bouton descend
           en pleine largeur plutot que de se serrer a cote du texte. */
        .mu-inv{display:flex;align-items:center;gap:12px;flex-wrap:wrap;
          text-align:left;margin-top:2px;padding:13px;border-radius:20px;
          background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.12);}
        .mu-inv-f{width:52px;height:56px;flex:none;display:block;}
        .mu-inv-f .mu-f-corps{fill:#F3F0FF;}
        .mu-inv-f .mu-f-oeil{fill:#2A1E4D;}
        .mu-inv-f .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-inv-t{flex:1 1 160px;min-width:0;}
        .mu-inv-t h2{margin:0;font-size:17.5px;line-height:1.18;font-weight:850;
          letter-spacing:-.025em;color:#fff;}
        .mu-inv-t h2 i{font-style:normal;color:var(--mu-v2);}
        .mu-inv-t p{margin:6px 0 0;font-size:12px;line-height:1.42;
          color:var(--mu-pale);}
        .mu-inv-b{flex:0 0 auto;display:inline-flex;align-items:center;gap:9px;
          padding:11px 15px 11px 12px;font:inherit;cursor:pointer;border:0;
          border-radius:16px;color:#fff;text-align:left;
          background:linear-gradient(103deg,#6E5BF2,#C551E8);
          box-shadow:0 10px 26px rgba(110,91,242,.34);}
        .mu-inv-b b{display:block;font-size:12.5px;font-weight:900;
          letter-spacing:.045em;}
        .mu-inv-b em{display:block;margin-top:1px;font-style:normal;
          font-size:11px;font-weight:650;color:rgba(255,255,255,.82);}
        .mu-inv-bf{width:22px;height:24px;flex:none;}
        .mu-inv-bf .mu-f-corps{fill:#fff;}
        .mu-inv-bf .mu-f-oeil{fill:#4B2E8A;}
        .mu-inv-bf .mu-f-bouche{fill:none;stroke:#4B2E8A;stroke-width:2.4;
          stroke-linecap:round;}
        @media (max-width:419px){
          .mu-inv-b{flex:1 1 100%;justify-content:center;}
        }

        /* LA LEGENDE DES CARTES, A SA VRAIE PLACE : au-dessus d'elles, et non
           a celle de la porte. Le repere du jour a droite dit de QUAND on parle
           — un mur se lit par journee, et « aujourd'hui » revient six fois dans
           cet ecran sans que rien ne le montre. */
        /* LE TITRE DE SECTION, ET RIEN D'AUTRE. Le sous-titre repetait « Qui
           est la » au mot pres, la pastille repetait « aujourd'hui » deja ecrit
           deux fois au-dessus, et la legende du pouce expliquait un geste qu'on
           n'avait pas encore vu — a l'endroit exact ou la premiere carte devait
           commencer. */
        .mu-qui{margin-top:18px;text-align:left;}
        .mu-qui h3{margin:0;font-size:18px;line-height:1.16;font-weight:850;
          letter-spacing:-.028em;color:#fff;}

        /* CE QUI DEPLIE LE MUR. Le compte du pied faisait les deux — dire
           combien et deplier — et le compte redisait ce que les cartes
           montrent. Il ne reste que le geste, et il ne s'affiche que s'il y a
           vraiment quelque chose de plie. */
        .mu-tout{display:inline-flex;align-items:center;gap:7px;margin-top:16px;
          padding:10px 16px;font:inherit;font-size:13px;font-weight:800;
          color:#D7E2EE;cursor:pointer;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.16);border-radius:99px;}
        .mu-tout i{font-style:normal;font-size:13px;}

        /* La phrase qui donne son sens au pouce : elle est encadrée parce
           qu'elle explique le geste, elle ne le décore pas. */
        /* LA LEGENDE DU POUCE, SANS SON CADRE. La maquette n'en a pas, et il
           n'etait pas necessaire : pose entre le titre de section et la
           premiere carte, un bloc violet de deux lignes repoussait les cartes
           sous le pli pour expliquer un geste qu'on n'avait pas encore vu. */
        .mu-haut-cle{display:block;margin:7px 0 0;text-align:left;
          font-size:11.5px;line-height:1.45;font-weight:600;
          color:var(--mu-pale);}
        .mu-haut-b{display:inline-flex;align-items:center;gap:8px;margin-top:13px;
          padding:9px 15px 9px 10px;font-family:inherit;font-size:14px;
          font-weight:800;color:#fff;cursor:pointer;
          background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));
          border:none;border-radius:99px;}
        .mu-haut-bs{width:22px;height:24px;flex:none;}
        .mu-haut-bs .mu-f-corps{fill:#fff;}
        .mu-haut-bs .mu-f-oeil{fill:#2A1E4D;}
        .mu-haut-bs .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:2.4;
          stroke-linecap:round;}
        .mu-haut-b em{font-style:normal;font-size:11.5px;font-weight:700;
          opacity:.8;padding-left:3px;border-left:1px solid rgba(255,255,255,.32);
          margin-left:2px;}
        /* L'essai ne commence pas par une explication du fantôme : il commence
           par le produit sur soi. */
        .mu-haut.essai .mu-cta{margin-top:14px;text-align:left;}
        .mu-haut.essai .mu-cta>i{font-size:20px;}

        /* ═══ LE COMPTE EST CE QUI FAIT ENTRER ══════════════════════════════
           La tete disait « Ce que les clients ont essaye ici » : vrai, et ca ne
           dit rien — ni combien, ni de quoi, ni pourquoi on regarde. Le nombre
           est celui du mur, jamais un nombre ecrit ici. */
        .mu-haut-n{margin:0;font-size:24px;font-weight:850;letter-spacing:-.03em;
          line-height:1.12;color:var(--mu-pale);}
        .mu-haut-n b{color:#fff;font-weight:850;}
        .mu-haut.essai p{margin:6px 0 0;font-size:13px;color:var(--mu-pale);}
        /* LA PASTILLE PORTE DES FANTOMES PLUTOT QUE DES VISAGES : on n'a pas de
           visages a empiler, et en inventer serait fabriquer exactement ce que
           cette ligne certifie. Ils se chevauchent, comme une pile. */
        /* PERSONNE D'AUTRE NE L'A ENCORE ESSAYEE. Une grille vide apprend que
           le mur est mort, ce qui est faux : il est plein, simplement pas de
           cette piece-la. */
        .mu-seule{display:flex;align-items:center;gap:13px;flex-wrap:wrap;
          margin:16px 0 0;padding:16px 14px;border-radius:18px;
          background:rgba(139,125,246,.1);
          border:1px solid rgba(139,125,246,.28);}
        .mu-seule-f{flex:none;width:34px;height:38px;}
        .mu-seule-f .mu-f-corps{fill:#C9BCFF;}
        .mu-seule-f .mu-f-oeil{fill:#2A1E4D;}
        .mu-seule-f .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-seule span{flex:1 1 180px;min-width:0;font-size:13px;line-height:1.5;
          color:var(--mu-pale);}
        .mu-seule b{display:block;font-size:14.5px;font-weight:850;color:#fff;
          margin-bottom:4px;}
        .mu-seule button{flex:none;font:inherit;font-size:13px;font-weight:800;
          cursor:pointer;border-radius:999px;padding:11px 16px;color:#C9BCFF;
          background:transparent;border:1px solid rgba(201,188,255,.4);}

        /* ═══ LA PIECE DONT CE MUR PARLE ══════════════════════════════════

           C'est ce qui manquait le plus : un bandeau qui dit DE QUOI on parle.
           Sans lui, on arrivait sur une grille de vignettes sans savoir si on
           regardait une piece, un magasin ou une ville — et la reponse changeait
           selon d'ou l'on venait, ce que rien n'indiquait. */
        .mu-piece{display:flex;align-items:center;gap:12px;margin-bottom:16px;
          padding:10px;border-radius:18px;background:var(--mu-carte);
          border:1px solid var(--mu-ligne);}
        .mu-piece-ph{flex:none;width:52px;height:64px;object-fit:cover;
          object-position:center 22%;border-radius:11px;display:block;
          background:rgba(255,255,255,.05);}
        .mu-piece-t{flex:1 1 auto;min-width:0;}
        .mu-piece-t b{display:block;font-size:15px;font-weight:850;
          letter-spacing:-.015em;color:#fff;overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;}
        .mu-piece-t em{display:block;margin-top:3px;font-style:normal;
          font-size:12px;color:var(--mu-pale);overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;}
        .mu-piece-x{flex:none;font-size:16px;font-weight:900;
          letter-spacing:-.02em;color:var(--mu-ambre);}

        /* ═══ LES DEUX CADRAGES, ET LA SORTIE VERS LE CATALOGUE ════════════

           Deux pastilles plutot que quatre filtres : les quatre de la maquette
           supposent des donnees qu'aucune cliente n'a saisies — morphologie,
           style, lieu — et les remplir de listes vides serait promettre un tri
           qui ne trie rien. Les deux qui existent repondent a la question
           posee : cette piece, ou tout le magasin ?

           LE CATALOGUE EST A PART, avec son trait et son picto : il ne cadre
           rien, il fait SORTIR du mur. */
        .mu-cadre{display:flex;align-items:center;gap:8px;margin-top:14px;
          overflow-x:auto;scrollbar-width:none;padding-bottom:2px;}
        .mu-cadre::-webkit-scrollbar{display:none;}
        .mu-cadre button{flex:none;display:inline-flex;align-items:center;
          gap:7px;font:inherit;font-size:13px;font-weight:750;cursor:pointer;
          border-radius:999px;padding:9px 14px;color:var(--mu-pale);
          background:transparent;border:1px solid var(--mu-ligne);
          transition:color .16s ease,border-color .16s ease,background .16s ease;}
        .mu-cadre button s{text-decoration:none;font-size:11px;font-weight:850;
          border-radius:999px;padding:2px 7px;background:rgba(255,255,255,.08);}
        .mu-cadre button.on{color:#0A1210;background:#C9BCFF;
          border-color:#C9BCFF;font-weight:850;}
        .mu-cadre button.on s{background:rgba(10,18,16,.16);color:#0A1210;}
        /* LA SORTIE VERS LE CATALOGUE. En pleine largeur et en contour : elle
           ne dispute rien au geste plein du pied, et elle se lit comme une
           porte plutot que comme un filtre. */
        .mu-cat{display:flex;align-items:center;justify-content:center;gap:10px;
          width:100%;margin-top:18px;font:inherit;font-size:14px;
          font-weight:800;cursor:pointer;border-radius:999px;padding:14px 16px;
          color:#C9BCFF;background:transparent;
          border:1px solid rgba(201,188,255,.38);}
        .mu-cat .mu-tr{width:19px;height:19px;}
        .mu-cat s{text-decoration:none;font-size:16px;line-height:1;}
        .mu-cat:active{transform:scale(.99);}
        .mu-cat:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}
        .mu-cadre button:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}

        /* ═══ « SUR VOUS » EST UNE TUILE, PLUS UNE BARRE ═══════════════════

           IL PREND LE FORMAT DES AUTRES, et c'est tout l'interet : meme photo
           en quatre cinquiemes, meme bandeau pose dessus, meme coin arrondi.
           Posee en travers de la page, la barre coupait le mur en deux et se
           presentait comme un sixieme bloc de meme poids ; rangee dans la
           grille, elle fait ce que ce mur promet — vous, puis les autres, dans
           la meme rangee.

           IL RESTE RECONNAISSABLE SANS CRIER : un lisere violet, une pastille
           « Vous » en haut a gauche la ou les autres portent « Essaye ici », et
           « Revoir » en clair dans le bandeau. C'est la seule tuile qui emmene
           ailleurs, donc c'est la seule qui annonce ou. */
        .mu-moi{position:relative;display:flex;flex-direction:column;
          width:100%;padding:0;overflow:hidden;text-align:left;
          font-family:inherit;cursor:pointer;border-radius:18px;
          color:var(--mu-encre);background:rgba(22,18,44,.72);
          border:1.5px solid rgba(201,188,255,.55);
          box-shadow:0 10px 30px -18px rgba(139,125,246,.9);
          transition:transform .12s ease,border-color .16s ease;}
        .mu-moi:active{transform:scale(.985);}
        .mu-moi:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}
        .mu-moi img{display:block;width:100%;height:auto;aspect-ratio:4/5;
          object-fit:cover;object-position:center 14%;}
        /* LA PASTILLE, A LA PLACE OU LES AUTRES PORTENT « ESSAYE ICI ». */
        .mu-moi-e{position:absolute;top:9px;left:9px;display:inline-flex;
          align-items:center;gap:5px;font-size:10px;font-weight:900;
          letter-spacing:.08em;text-transform:uppercase;color:#1A1030;
          border-radius:999px;padding:4px 9px 4px 6px;background:#C9BCFF;}
        .mu-moi-ef{width:13px;height:13px;}
        .mu-moi-ef .mu-f-corps{fill:#1A1030;}
        /* LE BANDEAU DU BAS, COMME CELUI DES AUTRES TUILES : un degrade, le
           nom, la note. C'est ce qui fait que les deux se comparent au lieu de
           se suivre. */
        .mu-moi-t{position:absolute;left:0;right:0;bottom:30px;
          padding:18px 10px 7px;
          background:linear-gradient(180deg,rgba(10,7,22,0),rgba(10,7,22,.86) 46%,
            rgba(10,7,22,.96));}
        .mu-moi-t>b{display:flex;align-items:center;gap:7px;font-size:14px;
          font-weight:850;color:#fff;}
        .mu-moi-t em{display:block;margin-top:2px;font-style:normal;
          font-size:11.5px;font-weight:700;color:#C9BCFF;overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;}
        .mu-moi-n{display:flex;gap:2px;}
        /* LE RETOUR EST ECRIT EN TOUTES LETTRES, sur son propre bandeau : une
           tuile qui emmene ailleurs sans le dire se fait toucher par erreur. */
        .mu-moi s{display:flex;align-items:center;justify-content:center;
          gap:5px;height:30px;text-decoration:none;font-size:12px;
          font-weight:850;color:#1A1030;background:#C9BCFF;}
        .mu-moi:hover s{background:#DCD3FF;}
        /* SEUL SUR LE MUR, IL PREND LA RANGEE ENTIERE : une tuile orpheline
           dans une grille a deux colonnes laisse une demi-page vide, ce qui est
           exactement le defaut qu'on vient de corriger ailleurs. */
        .mu-moi.seul{grid-column:1/-1;}
        .mu-moi.seul img{aspect-ratio:16/11;object-position:center 12%;}

        /* ═══ LE MOT DE LA BOUTIQUE ════════════════════════════════════════

           « On a du mal a comprendre que ce sont des conseils du commercant, et
           la cassure entre les annonces verticales et ces deux conseils
           horizontaux est tres maladroite. »

           CE N'EST PLUS LA MEME FORME PARCE QUE CE N'EST PAS LE MEME OBJET. Un
           essayage est une PREUVE — une photo, une note, un avis — et sa forme
           est la vignette. Un mot du commercant est une PAROLE : un emetteur, un
           role, une phrase. Sa forme est la bulle, dans un panneau qui se nomme
           et qui porte l'enseigne. */
        .mu-mot-b{margin-top:22px;padding:16px 14px 14px;border-radius:20px;
          background:rgba(255,255,255,.035);
          border:1px solid rgba(255,255,255,.1);}
        .mu-mot-b h3{display:flex;align-items:center;gap:11px;margin:0 0 14px;
          font-size:14px;font-weight:850;letter-spacing:-.01em;color:#E8EFF6;}
        .mu-mot-b h3 em{display:block;margin-top:2px;font-style:normal;
          font-size:12px;font-weight:600;color:var(--mu-pale);}
        .mu-mot-b-e{flex:none;display:grid;place-items:center;width:34px;
          height:34px;border-radius:10px;color:#C9BCFF;
          background:rgba(139,125,246,.16);
          border:1px solid rgba(139,125,246,.35);}
        .mu-mot-b-e .mu-tr{width:19px;height:19px;}
        .mu-mot-b ul{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:10px;}
        /* LA BULLE : un coin carre en haut a gauche, les trois autres arrondis.
           C'est ce qui la distingue d'une carte au premier coup d'oeil, et c'est
           la grammaire de tout le monde pour « quelqu'un parle ». */
        .mu-mot-b li{padding:12px 14px;border-radius:4px 16px 16px 16px;
          background:rgba(139,125,246,.1);
          border:1px solid rgba(139,125,246,.22);}
        .mu-mot-b-q{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}
        .mu-mot-b-q b{font-size:13.5px;font-weight:850;color:#fff;}
        .mu-mot-b-q s{text-decoration:none;font-size:10px;font-weight:900;
          letter-spacing:.07em;text-transform:uppercase;border-radius:999px;
          padding:3px 8px;color:#0A1210;background:#C9BCFF;}
        .mu-mot-b-q i{margin-left:auto;font-style:normal;font-size:11.5px;
          color:var(--mu-pale);}
        .mu-mot-b li p{margin:8px 0 0;font-size:14px;line-height:1.45;
          color:#D9E3ED;}
        .mu-mot-b li button{margin-top:11px;font:inherit;font-size:12.5px;
          font-weight:800;cursor:pointer;border-radius:999px;padding:9px 15px;
          color:#C9BCFF;background:transparent;
          border:1px solid rgba(201,188,255,.4);}
        .mu-mot-b li button.on{color:var(--mu-menthe);
          border-color:rgba(61,226,166,.45);background:rgba(61,226,166,.1);}
        .mu-mot-b li button:focus-visible{outline:2px solid #C9BCFF;
          outline-offset:2px;}

        .mu-haut-vrai{display:inline-flex;align-items:center;gap:10px;
          margin:12px 0 0;padding:7px 13px 7px 9px;border-radius:999px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);}
        .mu-haut-vrai>span{display:flex;flex:none;}
        .mu-haut-vs{width:24px;height:26px;margin-left:-8px;}
        .mu-haut-vs:first-child{margin-left:0;}
        .mu-haut-vs .mu-f-corps{fill:#C9BCFF;}
        .mu-haut-vs .mu-f-oeil{fill:#1A1040;}
        .mu-haut-vs .mu-f-bouche{fill:none;stroke:#1A1040;stroke-width:2;
          stroke-linecap:round;}
        .mu-haut-vrai em{font-style:normal;font-size:11px;font-weight:750;
          line-height:1.25;color:#E8EFF6;text-align:left;}
        /* LE GESTE D'ESSAI, COLLE AU BAS DU MUR. Meme bouton, memes mots que
           sur l'annonce : le rituel ne change pas de forme selon la porte par
           laquelle on entre. Il flotte parce qu'il doit rester sous le pouce a
           la neuvieme vignette — c'est la que l'envie arrive, pas en tete. */
        .mu-bas{position:sticky;bottom:10px;z-index:8;margin-top:18px;
          padding-top:26px;
          background:linear-gradient(180deg,rgba(5,9,12,0),rgba(5,9,12,.94) 56%);}

        /* ═══ LES ESSAIS EN GRILLE ══════════════════════════════════════════
           On vient y chercher une IMPRESSION D'ENSEMBLE — « ca donne quoi sur
           des gens ? » — avant de lire qui que ce soit. Une liste d'une carte
           par ligne oblige a defiler neuf fois pour se faire cette idee, et
           personne ne defile neuf fois pour une impression.
           DEUX COLONNES A 390 POINTS, TROIS AU-DELA DE 560. Trois colonnes sur
           un petit telephone donnent 108 points par vignette : a cette taille on
           ne voit plus ce qu'on essaie, ce qui est le seul travail de la
           grille. */
        /* ─── LES CARTES NE S'ETIRENT PLUS LES UNES SUR LES AUTRES ───
           C'EST LA PLAINTE EXACTE : « ces colonnes en longueur comme si elles
           etaient etendues ». Une grille etire par defaut chaque element a la
           hauteur de la rangee, donc la carte la plus bavarde imposait sa
           hauteur a sa voisine, qui finissait avec un vide de quarante points
           sous son dernier mot. align-items:start rend a chacune la sienne.
           LES HAUTEURS SE RAPPROCHENT QUAND MEME, parce que la phrase est
           bornee a deux lignes plus bas : le damier reste regulier sans qu'on
           ait besoin de fabriquer du vide pour l'aligner. */
        .mu-rang.grille{display:grid;grid-template-columns:1fr 1fr;gap:10px;
          align-items:start;margin-top:16px;}
        @media (min-width:560px){
          .mu-rang.grille{grid-template-columns:1fr 1fr 1fr;}
        }
        /* ═══ LES TUILES ARRIVENT L'UNE APRES L'AUTRE ══════════════════════

           « Peut-etre meme mettre un peu d'animation pour lui donner de la
           modernite. »

           ELLE N'EST PAS DECORATIVE : c'est elle qui apprend a lire la page. Un
           damier qui apparait d'un bloc se regarde comme un fond ; le meme
           damier qui se remplit tuile par tuile designe son ordre — vous
           d'abord, puis les autres — et l'oeil suit ce mouvement au lieu de
           chercher ou se poser.

           HUIT RETARDS SUFFISENT. Au-dela, l'attente se verrait plus que
           l'arrivee, et les tuiles suivantes sont de toute facon sous le pli :
           elles heritent du dernier retard et arrivent ensemble, ce qui est
           exactement ce qu'on veut d'une neuvieme vignette. */
        .mu-rang.grille>*{animation:muTuile .42s cubic-bezier(.16,1,.3,1) both;}
        .mu-rang.grille>*:nth-child(1){animation-delay:0ms;}
        .mu-rang.grille>*:nth-child(2){animation-delay:55ms;}
        .mu-rang.grille>*:nth-child(3){animation-delay:110ms;}
        .mu-rang.grille>*:nth-child(4){animation-delay:165ms;}
        .mu-rang.grille>*:nth-child(5){animation-delay:220ms;}
        .mu-rang.grille>*:nth-child(6){animation-delay:275ms;}
        .mu-rang.grille>*:nth-child(7){animation-delay:330ms;}
        .mu-rang.grille>*:nth-child(n+8){animation-delay:385ms;}
        @keyframes muTuile{
          from{opacity:0;transform:translateY(14px) scale(.97);}
          to{opacity:1;transform:none;}}
        @media (prefers-reduced-motion:reduce){
          .mu-rang.grille>*{animation:none;}}
        .mu-rang.grille .mu-c{flex-direction:column;}
        /* LA VIGNETTE PREND TOUTE LA LARGEUR. QUATRE CINQUIEMES, PLUS TROIS
           QUARTS : le format precedent ajoutait vingt points de hauteur par
           carte pour ne rien montrer de plus — on cadre des mains, des coupes
           et des avant-bras, pas des portraits en pied. */
        .mu-rang.grille .mu-c-p{width:100%;aspect-ratio:4/5;flex:none;}
        .mu-rang.grille .mu-c-t{padding:9px 10px 10px;}
        /* ─── LE BANDEAU POSE SUR LA PHOTO ───
           Le prenom, l'heure et la note s'y lisent sur un voile degrade. Il ne
           s'affiche QUE dans la grille : ailleurs sur ce meme mur, les cartes
           de la maison gardent leur ligne de nom, et c'est le meme document. */
        .mu-c-sur{display:none;}
        .mu-rang.grille .mu-c-sur{position:absolute;left:0;right:0;bottom:0;
          display:flex;flex-direction:column;gap:2px;padding:16px 10px 7px;
          background:linear-gradient(180deg,rgba(6,10,16,0),rgba(6,10,16,.82) 46%,
            rgba(6,10,16,.94));}
        .mu-rang.grille .mu-c-sur-q{display:flex;align-items:baseline;gap:6px;
          min-width:0;}
        .mu-rang.grille .mu-c-sur-q b{flex:1;min-width:0;overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;
          font-size:13px;font-weight:850;color:#fff;
          text-shadow:0 1px 6px rgba(0,0,0,.7);}
        .mu-rang.grille .mu-c-sur-q s{text-decoration:none;flex:none;
          font-size:10.5px;color:#C4D2E0;font-variant-numeric:tabular-nums;
          text-shadow:0 1px 6px rgba(0,0,0,.8);}
        .mu-rang.grille .mu-c-sur .mu-c-note{display:flex;gap:1.5px;}
        /* LE FANTOME-AVATAR ET LA LIGNE DU NOM S'EN VONT AVEC LUI : l'un
           chevauchait le bandeau, l'autre repetait mot pour mot ce qu'il dit. */
        .mu-rang.grille .mu-c-av{display:none;}
        .mu-rang.grille .mu-c-n{display:none;}
        /* ─── LA PHRASE TIENT EN DEUX LIGNES ───
           Elle en prenait cinq dans une colonne de cent soixante-quatorze
           points — « J'hesite entre celui-ci et le nude tout simple. Vos
           avis ? » — et c'est ce qui faisait la carte si haute. Deux lignes
           suffisent a donner le ton ; le reste se lit en depliant. */
        .mu-rang.grille .mu-c-t p{font-size:12px;line-height:1.35;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .mu-rang.grille .mu-c-e{font-size:10px;gap:5px;}
        /* LA NOTE EST MONTEE SUR LA PHOTO : la laisser aussi sous le motif
           l'ecrivait deux fois a trente points d'ecart. */
        .mu-rang.grille .mu-c-e .mu-c-note{display:none;}
        /* ═══ LE COMPTE DES FANTOMES REVIENT ════════════════════════════════
           « Il manque des infos comme le nombre de fantomes. »
           IL AVAIT RAISON, ET C'EST MOI QUI L'AVAIS EMPORTE. Le compte vit dans
           le pied de la carte, avec le bouton ; en cachant le pied entier pour
           retirer le bouton, j'ai emporte la seule preuve que ce mur existe
           pour donner — combien de gens ont trouve cet essai interessant. On
           cache donc le GESTE, et plus le BLOC. */
        .mu-rang.grille .mu-c-f{display:block;margin-top:6px;padding-top:0;}
        .mu-rang.grille .mu-c-f .mu-int,
        .mu-rang.grille .mu-c-f .mu-int-d{display:none;}
        /* IL TIENT SUR UNE LIGNE, ET C'EST CE QUI L'A FAIT RENTRER. « 6
           personnes interessees » passait a la ligne dans une colonne de cent
           cinquante-quatre points utiles : deux lignes pour un compte, c'est
           quinze points perdus sur chaque carte du mur.
           ON RACCOURCIT LE DESSIN, JAMAIS LA PHRASE. Deux fantomes au lieu de
           trois et un demi-point de moins sur le texte suffisent. Ecrire « 6 »
           tout court aurait ete plus court encore, et aurait rendu au compte
           l'apparence de compteur de pouces qu'on a passe deux tours a lui
           retirer — « ca ressemble enormement a un like, or ce n'est
           absolument pas ca ». */
        .mu-rang.grille .mu-int-n{display:flex;align-items:center;
          text-decoration:none;font-size:9px;font-weight:750;color:#C9BCFF;
          white-space:nowrap;}
        /* IL RESTE DE LA MARGE POUR DEUX CHIFFRES. A neuf points et demi, « 4
           personnes interessees » finissait a trois points du bord : le mur du
           tatoueur, ou l'on compte jusqu'a douze, aurait deborde de la carte le
           jour ou quelqu'un passe de neuf a dix. */
        .mu-rang.grille .mu-int-v{margin-right:4px;vertical-align:0;}
        .mu-rang.grille .mu-int-vs{width:13px;height:15px;margin-left:-5px;}
        .mu-rang.grille .mu-int-vs:first-child{margin-left:0;}
        .mu-rang.grille .mu-int-vs:nth-child(3){display:none;}
        /* ─── LE DELAI SORT DE LA VIGNETTE ───
           « Encore 2 jours » dit jusqu'a quand cet essai a du sens. Sur le mur
           d'un bar, c'est capital : on decide d'y aller ou pas. Sur une grille
           d'essais, on regarde ce que ca donne sur des gens — la peremption
           d'un essai vieux de deux jours ne change rien a ce qu'on y voit, et
           elle coutait une seizieme ligne a chaque carte. */
        .mu-rang.grille .mu-c-d{display:none;}
        /* L'HUMEUR NON PLUS. « Je decouvre », « J'hesite » sont utiles sur le mur
           d'un bar, ou l'on cherche qui rencontrer ; sur une vignette d'essai
           elles disputent la place a la seule chose qu'on vient lire — la phrase
           de la personne et sa note. */
        .mu-rang.grille .mu-hum{display:none;}
        .mu-rang.maison.apres{margin-top:14px;}
        .mu-haut-q{display:block;margin-top:11px;font-size:11.5px;line-height:1.5;
          color:var(--mu-pale);}

        /* Le pied compte et déplie : voir EcranMur. */
        .mu-pied{display:flex;align-items:center;gap:10px;width:100%;
          margin-top:14px;padding:12px 14px;font-family:inherit;cursor:pointer;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);border-radius:17px;}
        .mu-pied>span{font-size:17px;}
        .mu-pied-t{flex:1;text-align:left;min-width:0;}
        .mu-pied b{display:block;font-size:13.5px;font-weight:800;color:#fff;}
        .mu-pied em{display:block;margin-top:2px;font-style:normal;font-size:11.5px;
          color:var(--mu-pale);}
        .mu-pied i{font-style:normal;font-size:15px;color:var(--mu-pale);}

        /* Le chiffre a quitté le bouton : voir le grand commentaire dans Carte. */
        .mu-int-d{display:block;margin-top:5px;font-style:normal;font-size:11px;
          line-height:1.4;color:var(--mu-pale);}
        .mu-int-n{display:block;margin-top:3px;text-decoration:none;
          font-size:11px;font-weight:700;color:#8BD6FF;}

        /* ═══ L'ECRAN DE LA PHOTO S'ALIGNE A GAUCHE ════════════════════════

           « Cette partie n'est pas bien designée, les textes partent dans tous
           les sens et ne sont pas centrés très bien. »

           LA CAUSE TENAIT EN UN MOT : text-align:center, pose sur tout l'ecran.
           Un titre de deux lignes centre, quatre conseils dont les libelles font
           de treize a vingt-cinq signes centres chacun sur sa propre largeur, et
           aucun bord commun nulle part — c'est exactement l'impression de textes
           qui partent dans tous les sens. Sa maquette, elle, aligne tout a
           gauche : le titre, les quatre conseils, et leurs deux niveaux.

           LES BOUTONS RESTENT CENTRES : ce sont des blocs flexibles, ils ne
           dependaient pas de cette regle. */
        .mu-cadrer{text-align:left;}
        /* LE VISEUR DIT CE QU'ON PHOTOGRAPHIE, ET C'EST LA MOITIE DE LA
           MECANIQUE : on ne cadre pas une personne, on cadre L'ENDROIT OU LA
           CHOSE VA. */
        .mu-viseur{position:relative;height:210px;border-radius:18px;overflow:hidden;
          background:repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 10px,
            transparent 10px 20px),rgba(255,255,255,.03);}
        /* Voir le composant Viseur : seul le gabarit « main » se montre entier. */
        .mu-viseur.entier{height:250px;background:#0B1220;}
        .mu-viseur.entier img{object-fit:contain;}
        .mu-viseur img{width:100%;height:100%;object-fit:cover;display:block;
          opacity:.9;}
        .mu-viseur span{position:absolute;width:26px;height:26px;
          border:2px solid rgba(139,125,246,.8);}
        .mu-viseur span:nth-child(1){top:14px;left:14px;border-right:none;
          border-bottom:none;border-radius:8px 0 0 0;}
        .mu-viseur span:nth-child(2){top:14px;right:14px;border-left:none;
          border-bottom:none;border-radius:0 8px 0 0;}
        .mu-viseur span:nth-child(3){bottom:14px;left:14px;border-right:none;
          border-top:none;border-radius:0 0 0 8px;}
        .mu-viseur span:nth-child(4){bottom:14px;right:14px;border-left:none;
          border-top:none;border-radius:0 0 8px 0;}
        /* LE GABARIT SE SUPERPOSE AU PIXEL PRES. Le meme rognage que la photo :
           voir le composant Viseur pour la raison. */
        .mu-viseur-g{position:absolute;inset:0;width:100%;height:100%;
          display:block;pointer-events:none;
          filter:drop-shadow(0 0 6px rgba(10,20,40,.55));}
        .mu-cadrer>p{margin:12px 0 0;font-size:12.5px;line-height:1.5;
          color:var(--mu-pale);}
        /* Le champ de fichier ne se voit jamais : c'est le bouton qui le
           declenche. Mais il reste DANS le flux et focalisable, sinon le clavier
           et les lecteurs d'ecran perdent le seul moyen de prendre la photo. */
        .mu-fichier{position:absolute;width:1px;height:1px;opacity:0;
          pointer-events:none;}
        .mu-photo-v{width:26px;height:26px;border-radius:7px;object-fit:cover;
          display:block;}
        .mu-photo-x{background:none;border:none;font-family:inherit;
          font-size:11.5px;font-weight:600;color:var(--mu-pale);cursor:pointer;
          padding:4px 6px;text-decoration:underline;text-underline-offset:3px;}
        .mu-exemple{display:block;margin:10px auto 0;padding:6px 4px;
          background:none;border:none;font-family:inherit;font-size:12.5px;
          font-weight:600;color:var(--mu-pale);cursor:pointer;
          text-decoration:underline;text-underline-offset:3px;}
        .mu-cadrer .mu-cta{text-align:left;}
        .mu-cadrer .mu-cta>i{font-size:20px;}

        /* ─── MA TAILLE ───
           UNE SEULE PASTILLE AU-DESSUS DE LA GRILLE, et elle change d'etat :
           eteinte elle propose, allumee elle filtre. Deux boutons separes —
           « choisir » et « filtrer » — auraient demande de comprendre la
           difference avant d'appuyer sur l'un des deux. */
        .mu-mt{display:flex;align-items:center;flex-wrap:wrap;gap:8px;
          margin:0 0 10px;}
        .mu-mt-b{display:inline-flex;align-items:center;gap:7px;font:inherit;
          font-size:13px;font-weight:800;cursor:pointer;border-radius:999px;
          padding:9px 14px;color:var(--mu-encre);background:var(--mu-carte);
          border:1px solid var(--mu-ligne);}
        .mu-mt-b i{font-style:normal;font-size:13px;}
        .mu-mt-b.on{color:#08150F;background:var(--mu-menthe);
          border-color:var(--mu-menthe);}
        .mu-mt-b:active{transform:scale(.97);}
        .mu-mt-c{font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;
          color:var(--mu-pale);background:none;border:0;padding:6px 2px;
          text-decoration:underline;}
        /* LE COMPTE DES ECARTEES EST EN RETRAIT, PAS EN ALERTE : c'est une
           precision sur ce qu'on vient de demander, pas un probleme. */
        .mu-mt em{font-style:normal;font-size:12px;
          color:var(--mu-pale);}
        /* LE CHOIX DE SA TAILLE. Il remplace la grille le temps d'un appui :
           pose a cote, il aurait fallu deux colonnes sur 375 points de large. */
        .mu-mt-p{margin:0 0 12px;padding:14px;border-radius:16px;
          background:var(--mu-carte);border:1px solid var(--mu-ligne);
          display:flex;flex-direction:column;gap:9px;}
        .mu-mt-p>p{margin:0;font-size:14px;font-weight:800;
          color:var(--mu-encre);}
        .mu-mt-r{display:flex;flex-wrap:wrap;gap:6px;}
        .mu-mt-r button{font:inherit;font-size:14px;font-weight:800;
          cursor:pointer;min-width:46px;padding:11px 12px;border-radius:999px;
          color:var(--mu-encre);background:rgba(255,255,255,.06);
          border:1px solid var(--mu-ligne);}
        .mu-mt-r button.on{color:#08150F;background:var(--mu-menthe);
          border-color:var(--mu-menthe);}
        .mu-mt-r button:active{transform:scale(.96);}
        .mu-mt-f{font-size:11.5px;line-height:1.5;color:var(--mu-pale);}
        .mu-mt-f button{font:inherit;font-size:11.5px;font-weight:700;
          cursor:pointer;color:var(--mu-pale);background:none;border:0;
          padding:0;margin-left:8px;text-decoration:underline;}
        /* LA GRILLE VIDE DIT POURQUOI ET DONNE LA SORTIE. Un ecran vide sans
           phrase se lit comme une panne. */
        .mu-mt-v{margin:0;padding:18px 14px;border-radius:16px;
          background:var(--mu-carte);border:1px dashed var(--mu-ligne);
          font-size:13.5px;line-height:1.5;color:var(--mu-pale);
          text-align:center;}
        .mu-mt-v button{display:block;margin:10px auto 0;font:inherit;
          font-size:13px;font-weight:800;cursor:pointer;color:var(--mu-encre);
          background:rgba(255,255,255,.07);border:1px solid var(--mu-ligne);
          border-radius:999px;padding:10px 16px;}
        .mu-pieces{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;
          padding-bottom:4px;}
        .mu-pieces::-webkit-scrollbar{display:none;}
        .mu-pieces button{flex:none;width:118px;font-family:inherit;cursor:pointer;
          background:var(--mu-carte);border:1px solid var(--mu-ligne);
          border-radius:16px;overflow:hidden;padding:0 0 10px;color:var(--mu-encre);}
        /* LA VIGNETTE CADRE LE HAUT DU SUJET, PAS SON MILIEU.
           DEFAUT MESURE SUR LES CINQ TENUES LIVREES : ce sont des photos EN
           PIED, verticales. Recadrees au centre dans 96 points de haut, elles
           ne montraient que les hanches — « Blouse imprimee et jean flare »
           affichait un pantalon. On ne choisit pas une tenue sur ses hanches.
           A 28 %, une photo en pied montre le buste et le vetement ; une photo
           deja serree (un vernis, une planche de flash, une chemise a plat)
           bouge a peine, parce que son sujet occupe tout le cadre.
           ET LA VIGNETTE A GRANDI DE SEIZE POINTS : une tenue entiere a besoin
           de plus de hauteur qu'un ongle, et le rang n'en tient pas moins. */
        .mu-pieces img{width:100%;height:104px;object-fit:cover;display:block;
          object-position:center 28%;}
        /* La teinte, dessinee en forme d'ongle : voir la vignette plus haut. */
        .mu-teinte{display:block;width:100%;height:104px;
          border-radius:0 0 46% 46%/0 0 30% 30%;
          box-shadow:inset 0 -14px 22px -12px rgba(0,0,0,.55),
            inset 0 12px 18px -10px rgba(255,255,255,.42);}
        .mu-pieces b{display:block;font-size:13px;font-weight:700;padding:9px 10px 0;
          text-align:left;}
        .mu-pieces em{display:block;font-style:normal;font-size:12.5px;font-weight:800;
          color:var(--mu-ambre);padding:3px 10px 0;text-align:left;}
        /* CE QU'IL LUI RESTE, SOUS LE PRIX DE LA VIGNETTE.
           ELLE EST EN MENTHE ET PAS EN AMBRE : l'ambre est la couleur du prix
           sur tout cet ecran, et deux lignes de la meme couleur l'une sous
           l'autre se lisent comme un seul bloc de chiffres. La menthe est
           ailleurs celle de ce qui est disponible — c'est exactement ce que
           cette ligne dit. */
        .mu-tl{display:block;font-size:11.5px;font-weight:800;
          color:var(--mu-menthe);padding:3px 10px 0;text-align:left;}
        /* CE QU'ON NE SAIT PAS N'A PAS LA COULEUR DE CE QU'ON SAIT. */
        .mu-tl.vide{color:var(--mu-pale);font-weight:700;}
        /* CE QU'ON N'A PAS ENCORE SE VOIT ET NE SE TOUCHE PAS. Grise, pas
           cachee : une piece absente du catalogue ferait croire qu'elle
           n'existe pas, alors qu'il manque seulement sa photo portee. */
        .mu-pieces button.bientot{opacity:.5;cursor:default;}
        .mu-pieces s{display:block;text-decoration:none;font-size:10.5px;
          font-weight:800;letter-spacing:.04em;text-transform:uppercase;
          color:#C9BCFF;padding:5px 10px 0;text-align:left;}

        /* UNE PIECE SANS PHOTO NE MONTRE PAS UN CADRE VIDE. Elle montre un
           cintre, sur le meme fond que les autres vignettes : on lit « c'est
           un vetement, il arrive » plutot que « il manque une image ». */
        .mu-avenir{display:grid;place-items:center;width:100%;height:104px;
          background:linear-gradient(150deg,rgba(139,125,246,.14),
            rgba(199,125,240,.07));}
        .mu-avenir .mu-tr{width:30px;height:30px;opacity:.45;}

        /* ═══ « SURPRENDS-MOI » ══════════════════════════════════════════════

           « Lorsqu'un client potentiel manque d'imagination, alors il peut
           juste laisser faire l'IA et choisir a sa place. »

           C'EST LE SEUL APLAT DE L'ECRAN, ET C'EST VOULU. La grille en dessous
           est faite de cartes sombres a filet fin ; cette carte-la est une
           surface pleine, chaude, qui rayonne. L'oeil s'y pose avant d'avoir lu
           quoi que ce soit — or c'est exactement la promesse du bouton : ne pas
           avoir a lire six etiquettes pour se decider.

           LE DEGRADE VA DU VIOLET AU ROSE, et il traverse la carte en biais.
           Le violet est la couleur du fantome dans tout le produit ; le rose est
           celle qu'on ne sort que pour la surprise. Les deux ensemble disent
           « c'est le fantome, et il va faire quelque chose d'inattendu ».

           LA PASTILLE DE L'AVEU EST EN BAS A GAUCHE, sous la phrase, et elle est
           deliberement plus sombre que le reste : c'est une chose qu'on se dit a
           soi-meme, pas un argument qu'on nous vend. */
        .mu-surp{display:flex;align-items:center;gap:10px;width:100%;
          text-align:left;font-family:inherit;cursor:pointer;
          margin:0 0 18px;padding:14px 14px 14px 8px;border:0;
          border-radius:22px;color:#fff;position:relative;overflow:hidden;
          background:linear-gradient(104deg,#8B2BE0 0%,#B227D6 42%,#F0269B 100%);
          box-shadow:0 18px 40px -16px rgba(200,40,170,.75),
            0 0 0 1px rgba(255,255,255,.14) inset;
          transition:transform .14s ease,box-shadow .2s ease;}
        .mu-surp:active{transform:scale(.985);}
        .mu-surp:focus-visible{outline:2px solid #fff;outline-offset:3px;}
        /* LA LUEUR QUI TRAVERSE. Elle passe UNE FOIS TOUTES LES CINQ SECONDES,
           pas en boucle serree : une carte qui brille sans arret devient une
           banniere publicitaire, et on apprend a ne plus la voir. */
        .mu-surp::after{content:"";position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(100deg,transparent 38%,
            rgba(255,255,255,.28) 50%,transparent 62%);
          transform:translateX(-120%);animation:muSurpLueur 5s ease-in-out infinite;}
        @keyframes muSurpLueur{0%,72%{transform:translateX(-120%);}
          88%,100%{transform:translateX(120%);}}
        .mu-surp-f{flex:none;width:76px;display:grid;place-items:center;
          position:relative;}
        .mu-surp-f img{width:76px;height:76px;object-fit:contain;display:block;
          filter:drop-shadow(0 6px 14px rgba(0,0,0,.35));
          animation:muSurpFlotte 3.4s ease-in-out infinite;}
        @keyframes muSurpFlotte{0%,100%{transform:translateY(0) rotate(-3deg);}
          50%{transform:translateY(-7px) rotate(3deg);}}
        .mu-surp-t{flex:1 1 auto;min-width:0;display:block;}
        .mu-surp-t b{display:flex;align-items:center;gap:6px;font-size:17.5px;
          font-weight:900;letter-spacing:-.005em;line-height:1.1;
          white-space:nowrap;}
        .mu-surp-t b i{font-style:normal;font-size:16px;}
        .mu-surp-t em{display:block;font-style:normal;margin-top:5px;
          font-size:14px;line-height:1.32;font-weight:600;
          color:rgba(255,255,255,.94);}
        .mu-surp-t s{display:inline-block;text-decoration:none;margin-top:9px;
          font-size:12px;font-weight:700;border-radius:999px;padding:6px 13px;
          background:rgba(0,0,0,.24);color:rgba(255,255,255,.92);
          border:1px solid rgba(255,255,255,.2);}
        .mu-surp-g{flex:none;width:44px;height:44px;border-radius:50%;
          display:grid;place-items:center;background:#fff;color:#E0219A;
          font-size:20px;font-weight:800;line-height:1;
          box-shadow:0 6px 16px -6px rgba(0,0,0,.5);}

        .mu-e-ou{margin:9px 0 0;font-size:14px;font-weight:650;
          color:#B9A9E8;}
        /* LE TITRE DE LA GRILLE. Il separe les deux chemins, et le « Ou » fait
           tout le travail : sans lui, la grille se lisait comme la suite de la
           carte violette. */
        .mu-pieces-t{margin:0 0 10px;font-size:17px;font-weight:850;
          letter-spacing:-.02em;color:#fff;}

        /* ═══ ON CHERCHE POUR VOUS ═══════════════════════════════════════════

           « Ca doit tourner et avoir de beaux effets speciaux pour donner
           l'impression qu'il est en train de rechercher. »

           CE QUI TOURNE N'EST PAS UN SABLIER, CE SONT DES VETEMENTS. Un cercle
           qui tourne dit « attendez » ; six pieces du magasin qui gravitent
           autour d'un fantome a la loupe disent « il fouille le portant ». La
           difference n'est pas decorative : dans le premier cas on subit une
           attente, dans le second on regarde quelqu'un travailler pour soi.

           TROIS COUCHES DE MOUVEMENT, ET AUCUNE A LA MEME VITESSE. Les anneaux
           tournent en sens inverse l'un de l'autre (9 s et 14 s), les pieces
           font le tour en 16 s, le fantome flotte sur 3,6 s. Des vitesses
           voisines auraient donne l'impression d'un seul bloc qui pivote ;
           ecartees, elles font une profondeur.

           LE FOND EST LA BOUTIQUE, FLOUTEE ET ASSOMBRIE. On cherche DANS un
           magasin, et sans lui la scene pourrait se passer sur un serveur. */
        .mu-rech{position:relative;text-align:center;
          padding:6px 0 10px;overflow:hidden;border-radius:22px;
          animation:muApres .4s ease both;}
        .mu-rech-fond{position:absolute;inset:-18px;width:calc(100% + 36px);
          height:calc(100% + 36px);object-fit:cover;z-index:0;
          filter:blur(22px) saturate(.75) brightness(.34);}
        .mu-rech>*:not(.mu-rech-fond){position:relative;z-index:1;}
        .mu-rech-t h2{margin:0;font-size:25px;line-height:1.16;font-weight:850;
          letter-spacing:-.03em;color:#fff;}
        .mu-rech-t h2 b{background:linear-gradient(96deg,#C9A6FF,#FF62C0 72%);
          -webkit-background-clip:text;background-clip:text;color:transparent;
          font-weight:900;}
        .mu-rech-t p{margin:9px 0 0;font-size:14.5px;font-weight:700;
          color:#9FC0F5;}

        .mu-rech-g{position:relative;margin:16px 0 6px;}
        .mu-rech-s{position:relative;width:min(330px,88vw);aspect-ratio:1/1;
          margin:0 auto;}
        /* ═══ LES RUBANS DE LUMIERE, ET ILS REMPLACENT L'ANNEAU ════════════

           « Ce n'est pas pareil que sur la maquette, c'est beaucoup moins
           beau. »

           LA MAQUETTE N'A PAS DE CERCLE AUTOUR DE LA SCENE, et c'est la
           difference qui se voyait le plus. Elle a DEUX RUBANS qui s'enroulent
           autour du fantome — l'un passe derriere lui, l'autre devant — et
           c'est cette traversee qui donne la profondeur. Un anneau qui englobe
           tout met la scene dans une boite ; un ruban qui passe derriere
           quelqu'un le met DANS la scene.

           CHAQUE RUBAN EST UNE ELLIPSE APLATIE dont on ne dessine qu'un bord :
           le premier son arc superieur, sous le fantome ; le second son arc
           inferieur, par-dessus. Ils sont inclines du meme angle, donc l'oeil
           les recolle en un seul ruban qui tourne autour de quelqu'un. */
        .mu-rech-r{position:absolute;z-index:0;top:50%;left:50%;
          width:88%;height:38%;margin:0;
          transform:translate(-50%,-50%) rotate(-15deg);
          border-radius:50%;border:5px solid transparent;
          border-top-color:#E24BD6;border-left-color:rgba(226,75,214,.55);
          filter:drop-shadow(0 0 16px rgba(226,75,214,.95))
            drop-shadow(0 0 34px rgba(160,60,240,.6));
          animation:muRuban 5.2s ease-in-out infinite;}
        .mu-rech-r.b{z-index:3;
          border-top-color:transparent;border-left-color:transparent;
          border-bottom-color:#B44BF6;border-right-color:rgba(180,75,246,.55);
          animation-delay:.4s;}
        @keyframes muRuban{0%,100%{transform:translate(-50%,-50%)
            rotate(-15deg) scale(1);opacity:.92;}
          50%{transform:translate(-50%,-50%) rotate(-11deg) scale(1.045);
            opacity:1;}}
        .mu-rech-halo{position:absolute;inset:16%;border-radius:50%;
          background:radial-gradient(circle,rgba(199,125,240,.4),transparent 66%);
          animation:muPulse 3.2s ease-in-out infinite;}
        @keyframes muPulse{0%,100%{transform:scale(1);opacity:.75;}
          50%{transform:scale(1.09);opacity:1;}}
        @keyframes muTourne{to{transform:rotate(360deg);}}

        /* ═══ LES QUATRE PIECES, AUX QUATRE COINS ══════════════════════════

           ELLES NE TOURNENT PLUS EN ROND. Six vignettes sur un cercle regulier
           donnaient un cadran d'horloge : l'oeil y lisait un mecanisme, pas
           quelqu'un qui fouille. La maquette les pose aux quatre coins,
           legerement inclinees, a des hauteurs differentes — c'est un etalage
           qui flotte, et c'est tout autre chose.

           ELLES FLOTTENT CHACUNE A SON RYTHME. Un meme mouvement pour les
           quatre redonnerait un bloc ; des retards differents donnent quatre
           objets qui existent separement. */
        .mu-rech-orb{position:absolute;inset:0;z-index:2;}
        /* ═══ ON DEVINE LE VETEMENT, ON NE LE REGARDE PAS ══════════════════

           « Les vetements derriere sont dans des carres assombris dont les
           bordures sont scintillantes et lumineuses, avec des vetements qu'on
           devine un peu dedans, noircis, en style bande dessinee. »

           MES VIGNETTES ETAIENT DES PHOTOS EN PLEINE LUMIERE, et c'est ce qui
           cassait la scene : quatre images nettes autour d'un fantome
           lumineux, chacune tirant l'oeil pour elle. La maquette les PLONGE
           DANS LE NOIR — on distingue une silhouette de veste, un jean, rien de
           plus — et ne garde de lumiere que sur le bord. La scene redevient
           alors ce qu'elle raconte : quelqu'un fouille dans une penderie
           sombre, et ce qu'il tient n'est pas encore choisi.

           TROIS FILTRES POUR Y ARRIVER : on baisse la lumiere, on pousse le
           contraste pour garder les contours — c'est ce qui donne le trait de
           bande dessinee — et on desature pour que la couleur ne revienne pas
           par la fenetre. Le voile violet par-dessus recolle les quatre a la
           meme scene. */
        .mu-rech-v{position:absolute;width:31%;aspect-ratio:1/1;
          border-radius:16px;overflow:hidden;background:#0B0618;
          border:2px solid rgba(226,110,244,.9);
          display:grid;place-items:center;
          opacity:0;animation:muRechV .55s ease both,
            muRechFlotte 4.4s ease-in-out infinite,
            muRechBord 2.6s ease-in-out infinite;
          animation-delay:calc(var(--k) * .11s),calc(.6s + var(--k) * .5s),
            calc(var(--k) * .42s);}
        /* LE BORD SCINTILLE, CHACUN A SON RYTHME. Ensemble, les quatre
           clignoteraient comme un avertissement ; decales, ils respirent. */
        @keyframes muRechBord{
          0%,100%{border-color:rgba(226,110,244,.72);
            box-shadow:0 0 18px -4px rgba(226,110,244,.7),
              0 0 40px -16px rgba(139,125,246,.6);}
          50%{border-color:rgba(255,150,255,1);
            box-shadow:0 0 30px 0 rgba(240,120,255,1),
              0 0 64px -10px rgba(160,90,250,.9);}}
        /* LE VOILE VIOLET PAR-DESSUS L'IMAGE : il recolle les quatre a la meme
           scene, et il acheve d'en faire des ombres plutot que des photos. */
        /* LE VOILE PASSE DERRIERE LE VETEMENT, PLUS DEVANT. Pose par-dessus,
           il eteignait l'objet qu'il devait mettre en valeur ; en fond, il
           donne au carre sa profondeur violette et laisse le vetement dessus. */
        .mu-rech-v::before{content:"";position:absolute;inset:0;
          pointer-events:none;
          background:linear-gradient(155deg,rgba(120,50,190,.42),
            rgba(10,6,22,.7) 58%,rgba(6,4,14,.9));}
        /* LES QUATRE COINS, ET AUCUN NE SE MARCHE DESSUS : le fantome occupe
           la moitie centrale, les mots manuscrits les bords gauches. */
        .mu-rech-v.v0{top:0;left:-2%;transform:rotate(-7deg);}
        .mu-rech-v.v1{top:13%;right:-3%;transform:rotate(6deg);}
        .mu-rech-v.v2{bottom:30%;left:-5%;transform:rotate(5deg);}
        .mu-rech-v.v3{bottom:3%;right:2%;transform:rotate(-6deg);}
        /* LE VETEMENT SE VOIT, ET C'EST LE CARRE QUI EST SOMBRE. Je les
           assombrissais a quatre dixiemes pour obtenir le « on devine » de la
           maquette — mais sur la maquette on RECONNAIT la veste marron, le jean
           bleu, les baskets blanches : c'est leur FOND qui est noir, pas eux.
           Avec des packshots detoures, il n'y a plus rien a masquer : l'objet
           tient tout seul sur le carre sombre, et il se pose dedans avec sa
           marge plutot que d'y etre recadre. */
        /* ELLE EST POSEE EN ABSOLU, ET C'EST CE QUI REND LE CARRE CARRE. En
           flux, une image a « height:100% » dans une boite dont la hauteur
           vient d'un « aspect-ratio » cree une dependance circulaire : le
           navigateur tranche en dimensionnant la boite sur le CONTENU, et le
           carre devenait un rectangle a la hauteur du jean — mesure a 117 sur
           190. Sortie du flux, l'image ne dit plus rien de la taille du carre,
           et le rapport reprend la main. */
        .mu-rech-v img{position:absolute;inset:10%;width:80%;height:80%;
          object-fit:contain;display:block;
          filter:drop-shadow(0 4px 12px rgba(0,0,0,.6));}
        .mu-rech-v .mu-tr{width:30px;height:30px;opacity:.6;}
        @keyframes muRechV{from{opacity:0;transform:scale(.7);}
          to{opacity:1;}}
        @keyframes muRechFlotte{0%,100%{translate:0 0;}
          50%{translate:0 -9px;}}
        @keyframes muOrbEntre{from{opacity:0;}to{opacity:1;}}

        /* IL DOMINE LA SCENE, ET C'EST LE SECOND ECART AVEC LA MAQUETTE.
           A cent vingt-huit points au milieu d'un cercle de vignettes, il
           n'etait qu'un element parmi d'autres ; la maquette lui donne pres de
           la moitie de la largeur et met tout le reste autour. On regarde
           QUELQU'UN chercher — c'est la seule chose que cet ecran doit dire
           pendant quatre secondes. */
        /* IL EST CENTRE, ET SON FLOTTEMENT NE LE DECENTRE PLUS. Le centrage
           passait par la transformation, que l'animation de flottement ECRASE :
           le fantome partait se poser en bas a droite des la premiere image. Le
           centrage vit donc dans les marges negatives, et le mouvement dans la
           propriete de translation, qui est independante. */
        /* IL EST PLUS LARGE QUE HAUT, PARCE QU'IL TIENT QUELQUE CHOSE. Le
           dessin fourni mesure 709 sur 573 : la loupe deborde a droite, et
           forcer un carre lui coupait le manche ou le rapetissait pour le faire
           entrer. Le rapport du fichier decide, et le centrage suit. */
        .mu-rech-f{position:absolute;z-index:2;top:50%;left:50%;
          width:64%;aspect-ratio:709/573;margin:0;
          translate:-50% -50%;
          display:grid;place-items:center;
          animation:muRechFlotteF 3.6s ease-in-out infinite;}
        @keyframes muRechFlotteF{0%,100%{translate:-50% -50%;rotate:-2.5deg;}
          50%{translate:-50% calc(-50% - 9px);rotate:2.5deg;}}
        .mu-rech-f img{width:100%;height:100%;object-fit:contain;display:block;
          filter:drop-shadow(0 0 26px rgba(199,125,240,.8))
            drop-shadow(0 0 62px rgba(139,125,246,.55));}
        /* LA LOUPE BALAIE. Elle ne tourne pas avec le fantome : elle va et
           vient, ce qui est le geste de quelqu'un qui cherche plutot que celui
           d'un objet qui pivote. */
        /* ═══ LES TROIS MOTS MANUSCRITS SE LISENT ENSEMBLE ═════════════════

           JE LES FAISAIS PASSER CHACUN SON TOUR, pour ne pas encombrer. La
           maquette les montre TOUS LES TROIS en meme temps, et elle a raison :
           ce ne sont pas trois messages, c'est UNE ambiance — trois
           chuchotements autour de quelqu'un qui cherche. Alternes, on lit trois
           phrases ; ensemble, on ne lit rien et on sent une presence, ce qui
           est exactement ce qu'on veut d'un ecran d'attente.

           ILS ARRIVENT DONC L'UN APRES L'AUTRE PUIS RESTENT : l'apparition
           echelonnee garde la vie, la permanence rend l'image. */
        /* ILS SONT MANUSCRITS, ET LA POLICE ETAIT DEJA CHARGEE. « Les phrases
           et la police de "peut-etre ca", "on regarde votre style", "juste pour
           vous" sont absentes. » Elles etaient la, mais en Poppins penche : une
           italique de labeur, alors que la maquette les ecrit A LA MAIN, dans
           la marge, comme des annotations au crayon. Le site charge Caveat
           depuis toujours sous --font-main-levee ; c'est exactement cette
           ecriture-la. Plus grandes de deux points, parce qu'une cursive se lit
           moins vite qu'une lineale. */
        .mu-rech-m{position:absolute;z-index:4;
          font-family:var(--font-main-levee),'Segoe Script',cursive;
          font-size:16px;font-weight:600;line-height:1.16;color:#EFA8E4;
          max-width:104px;
          text-shadow:0 2px 12px rgba(0,0,0,.95),0 0 22px rgba(0,0,0,.85);
          opacity:0;animation:muMot .7s ease both;}
        .mu-rech-m.m1{left:0;top:15%;text-align:left;animation-delay:.5s;}
        .mu-rech-m.m2{right:2%;top:5%;max-width:80px;text-align:right;
          color:#DDC4FF;animation-delay:1.1s;}
        .mu-rech-m.m3{left:0;bottom:6%;text-align:left;animation-delay:1.7s;}
        /* LA FLECHE COURBE SOUS CHAQUE MOT, comme sur la maquette : elle
           rattache le chuchotement a la piece qu'il designe. */
        .mu-rech-m::after{content:"";display:block;width:26px;height:14px;
          margin-top:3px;border-bottom:1.6px solid currentColor;
          border-right:1.6px solid currentColor;border-bottom-right-radius:14px;
          opacity:.8;}
        .mu-rech-m.m2::after{margin-left:auto;transform:scaleX(-1);}
        @keyframes muMot{from{opacity:0;transform:translateY(8px);}
          to{opacity:1;transform:none;}}

        .mu-rech-etoiles{position:absolute;inset:0;pointer-events:none;}
        .mu-rech-etoiles i{position:absolute;top:50%;left:50%;width:5px;height:5px;
          border-radius:50%;background:#fff;
          box-shadow:0 0 10px 3px rgba(255,255,255,.9);
          transform:rotate(calc(var(--k) * 36deg)) translate(0,-96px);
          animation:muEtincelle 2.4s ease-in-out infinite;
          animation-delay:calc(var(--k) * .17s);}
        /* UNE ETINCELLE SUR TROIS EST UN COEUR. La maquette en seme autour de
           la scene, et ils disent autre chose qu'une etoile : une etoile dit
           « magique », un coeur dit « pour vous ». C'est exactement le sujet de
           cet ecran-la. Ils sont dessines en CSS plutot qu'ecrits, pour que la
           lueur porte sur la forme et non sur un glyphe. */
        .mu-rech-etoiles i:nth-child(3n){width:9px;height:9px;border-radius:0;
          background:none;box-shadow:none;
          filter:drop-shadow(0 0 7px rgba(255,90,200,.95));}
        .mu-rech-etoiles i:nth-child(3n)::before,
        .mu-rech-etoiles i:nth-child(3n)::after{content:"";position:absolute;
          top:0;left:0;width:9px;height:9px;border-radius:9px 9px 0 0;
          background:#FF5AC8;transform:rotate(-45deg);
          transform-origin:0 100%;}
        .mu-rech-etoiles i:nth-child(3n)::after{left:auto;right:0;
          transform:rotate(45deg);transform-origin:100% 100%;}
        @keyframes muEtincelle{0%,100%{opacity:0;transform:rotate(calc(var(--k) * 36deg))
            translate(0,-88px) scale(.4);}
          50%{opacity:.95;transform:rotate(calc(var(--k) * 36deg))
            translate(0,-112px) scale(1);}}

        /* LA FRISE DE LA RECHERCHE. Trois pastilles reliees par un trait qui se
           remplit : c'est une jauge, mais une jauge qui NOMME ses etapes au lieu
           d'afficher un pourcentage qu'il faudrait rendre vrai. */
        .mu-rech-frise{display:flex;align-items:flex-start;justify-content:center;
          gap:0;list-style:none;margin:10px 0 0;padding:0;}
        .mu-rech-frise li{flex:1 1 0;min-width:0;display:flex;
          flex-direction:column;align-items:center;gap:8px;position:relative;
          font-size:12.5px;font-weight:650;line-height:1.28;color:#7C8CA0;
          white-space:pre-line;}
        .mu-rech-frise li+li::before{content:"";position:absolute;top:24px;
          right:calc(50% + 26px);left:calc(-50% + 26px);height:1.5px;
          background:rgba(255,255,255,.14);}
        .mu-rech-frise li.fait+li::before,.mu-rech-frise li.ici::before{
          background:linear-gradient(90deg,#8B7DF6,#F0269B);}
        .mu-rech-frise li i{width:48px;height:48px;border-radius:50%;
          display:grid;place-items:center;
          border:1.5px solid rgba(255,255,255,.16);
          background:rgba(255,255,255,.04);position:relative;}
        .mu-rech-frise li .mu-tr{width:22px;height:22px;}
        .mu-rech-frise li.fait i{border-color:#C77DF0;color:#E7D6FF;}
        /* LA PASTILLE COCHEE. Le rond rose en haut a droite est la coche de la
           maquette ; elle est dessinee en CSS plutot qu'en SVG parce qu'elle ne
           porte aucune information que le mot en dessous ne porte deja. */
        .mu-rech-frise li.fait i::after{content:"";position:absolute;top:-3px;
          right:-3px;width:16px;height:16px;border-radius:50%;background:#E4189C;
          box-shadow:0 0 0 2.5px #0C121D;}
        .mu-rech-frise li.ici i{border-color:#F0269B;color:#FFB8E4;
          box-shadow:0 0 18px -2px rgba(240,38,155,.85);
          animation:muPulse 1.9s ease-in-out infinite;}
        .mu-rech-frise li.ici{color:#F4A7DC;font-weight:800;}
        .mu-rech-frise li.fait{color:#B7C4D4;}

        .mu-rech-note{display:flex;align-items:flex-start;gap:11px;
          margin:16px 0 4px;padding:14px 16px;border-radius:18px;text-align:left;
          background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.1);
          font-size:13.5px;line-height:1.42;color:#C3D0DE;}
        .mu-rech-note i{flex:none;display:flex;color:#E7D6FF;}
        .mu-rech-note .mu-tr{width:22px;height:22px;}

        /* ═══ LA PREPARATION ═════════════════════════════════════════════════

           « Ton fantome prepare ton essayage. » Un grand cercle au neon, une
           silhouette a demi maillee et a demi habillee, le fantome a gauche,
           trois vignettes a droite, trois pastilles en bas.

           LA COUPURE EST VERTICALE ET ELLE AVANCE. A gauche du trait, le
           maillage ; a droite, la vraie piece. Le trait descend puis remonte, et
           c'est lui qui fait croire que quelque chose s'applique — un degrade
           fixe au milieu aurait ete une illustration, pas une preparation.

           LE CERCLE RESPIRE, IL NE TOURNE PAS. Un anneau qui tourne dit
           « ca charge » ; un anneau qui respire dit « ca vit ». C'est le meme
           choix que le halo du fantome, et pour la meme raison. */
        .mu-prep{text-align:center;padding:2px 0 8px;
          animation:muApres .4s ease both;}
        /* IL ETAIT TROP PETIT D'UN QUART, ET SA CHASSE TROP SERREE. Sur la
           maquette, « Ton fantome prepare ton essayage » occupe deux lignes
           pleines et tient tout le haut de l'ecran : c'est lui qui donne le
           ton avant que la scene ne demarre. A vingt-six points, il devenait
           une legende au-dessus d'une illustration. */
        .mu-prep-tete h2{margin:0;font-size:clamp(27px,7.6vw,34px);
          line-height:1.14;font-weight:800;letter-spacing:-.018em;color:#fff;}
        .mu-prep-tete h2 b{color:#F06FD8;font-weight:800;}
        /* ET LA PHRASE DU DESSOUS EST LAVANDE, PAS BLEUE. La maquette la pose
           dans le violet pale de tout l'ecran ; en bleu ciel elle appartenait
           a une autre palette. */
        .mu-prep-tete p{margin:10px 0 0;font-size:14.5px;font-weight:600;
          color:#CDC5FF;}

        .mu-prep-s{position:relative;width:min(320px,88vw);aspect-ratio:1/1;
          margin:14px auto 4px;}
        .mu-prep-halo{position:absolute;inset:8%;border-radius:50%;
          background:radial-gradient(circle,rgba(190,60,220,.4),
            rgba(120,40,200,.16) 58%,transparent 72%);
          animation:muPulse 3s ease-in-out infinite;}
        /* L'ANNEAU EST UN TUBE, PAS UN TRAIT. Sur la maquette c'est une
           enseigne epaisse dont la lueur deborde largement ; a trois points de
           bordure, le mien dessinait un cercle autour d'une image au lieu
           d'etre la chose lumineuse qui tient l'ecran. Six points, un degrade
           du magenta au violet, et le halo qui va avec. */
        .mu-prep-anneau{position:absolute;inset:11%;border-radius:50%;
          border:6px solid transparent;
          background:linear-gradient(#0A0616,#0A0616) padding-box,
            linear-gradient(145deg,#FF3FD0,#C33BF0 42%,#8B4BF6 72%,#FF2BB4)
              border-box;
          box-shadow:0 0 42px -4px rgba(240,38,155,.9),
            0 0 90px -16px rgba(160,60,240,.75),
            inset 0 0 34px -6px rgba(240,38,155,.55);
          animation:muPulse 3s ease-in-out infinite;}
        .mu-prep-anneau.b{inset:8%;border-width:1.5px;
          border-color:rgba(139,125,246,.75);
          box-shadow:0 0 22px -4px rgba(139,125,246,.8);
          animation:muTourne 11s linear infinite;
          border-left-color:transparent;border-bottom-color:transparent;}

        /* LA BULLE : le disque ou se joue l'habillage. Elle est fermee par
           overflow:hidden, sans quoi la piece de droite deborderait
           par-dessus l'anneau. */
        .mu-prep-bulle{position:absolute;inset:14%;border-radius:50%;
          overflow:hidden;background:radial-gradient(circle at 50% 30%,
            rgba(60,20,90,.55),rgba(10,6,22,.85) 76%);}
        /* LA MOITIE DROITE EST LA VRAIE PIECE. Elle entre par la droite une
           fois, puis reste : une piece qui entrerait en boucle donnerait
           l'impression qu'on recommence sans arret. */
        .mu-prep-piece{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;object-position:center 26%;
          clip-path:inset(0 0 0 50%);opacity:.92;
          animation:muPrepPiece 1.1s cubic-bezier(.22,1,.36,1) both;}
        @keyframes muPrepPiece{from{transform:translateX(38%);opacity:0;}
          to{transform:translateX(0);opacity:.92;}}
        .mu-prep-sil{position:absolute;inset:-2% 0;width:100%;height:104%;
          fill:none;stroke-linecap:round;stroke-linejoin:round;
          /* LE TRACE NE COUVRE QUE LA MOITIE GAUCHE quand il y a une piece a
             droite : superpose a la photo, il la barrait de traits roses. */
          clip-path:inset(0 50% 0 0);}
        .mu-prep-sil path,.mu-prep-sil ellipse{stroke:#F45BD2;stroke-width:2.8;
          filter:drop-shadow(0 0 5px rgba(244,91,210,.9));
          stroke-dasharray:100;stroke-dashoffset:100;
          animation:muTrait 1.5s ease forwards;}
        .mu-prep-sil .mu-prep-t1{animation-delay:.05s;}
        .mu-prep-sil .mu-prep-t2{animation-delay:.3s;}
        .mu-prep-sil .mu-prep-t3{animation-delay:.6s;}
        .mu-prep-maille path{stroke:rgba(199,125,240,.62);stroke-width:1.2;
          filter:none;animation:muTrait 2.2s ease forwards .5s;}
        @keyframes muTrait{to{stroke-dashoffset:0;}}
        .mu-prep-ligne{position:absolute;top:0;bottom:0;left:50%;width:2px;
          margin-left:-1px;
          background:linear-gradient(180deg,transparent,#FF7AE0,transparent);
          box-shadow:0 0 16px 3px rgba(255,122,224,.85);
          animation:muPrepLigne 2.6s ease-in-out infinite;}
        @keyframes muPrepLigne{0%,100%{transform:translateY(-32%);opacity:.5;}
          50%{transform:translateY(32%);opacity:1;}}

        .mu-prep-f{position:absolute;left:-2%;top:34%;width:96px;height:96px;
          display:grid;place-items:center;
          animation:muSurpFlotte 3.4s ease-in-out infinite;}
        .mu-prep-f img{width:88px;height:88px;object-fit:contain;display:block;
          filter:drop-shadow(0 0 18px rgba(199,125,240,.8));}
        .mu-prep-coeur{position:absolute;right:-2px;top:2px;font-style:normal;
          font-size:20px;color:#FF6FC6;
          filter:drop-shadow(0 0 8px rgba(255,111,198,.9));
          animation:muCoeur 2.2s ease-in-out infinite;}
        @keyframes muCoeur{0%,100%{transform:scale(1) translateY(0);opacity:.85;}
          50%{transform:scale(1.18) translateY(-4px);opacity:1;}}

        /* LES TROIS VIGNETTES DE DROITE, EN ESCALIER. Elles montent l'une apres
           l'autre : ensemble, elles auraient forme un bloc qui apparait, ce qui
           ne raconte rien. */
        .mu-prep-v{position:absolute;right:-1%;top:22%;display:flex;
          flex-direction:column;gap:7px;}
        .mu-prep-v img{width:56px;height:56px;object-fit:cover;border-radius:11px;
          display:block;background:rgba(20,10,40,.7);
          border:1.4px solid rgba(240,91,210,.55);
          box-shadow:0 0 14px -3px rgba(240,91,210,.8);
          transform:translateX(calc(var(--k) * 9px));
          opacity:0;animation:muPrepV .5s ease forwards;
          animation-delay:calc(.35s + var(--k) * .16s);}
        @keyframes muPrepV{from{opacity:0;transform:translateX(30px);}
          to{opacity:1;}}

        .mu-prep-etoiles{position:absolute;inset:0;pointer-events:none;}
        .mu-prep-etoiles i{position:absolute;top:50%;left:50%;width:3px;height:3px;
          border-radius:50%;background:#fff;
          box-shadow:0 0 7px 2px rgba(255,180,240,.9);
          animation:muPrepEt 3s ease-in-out infinite;
          animation-delay:calc(var(--k) * .21s);}
        @keyframes muPrepEt{
          0%,100%{opacity:0;transform:rotate(calc(var(--k) * 26deg))
            translate(0,-82px) scale(.3);}
          45%{opacity:1;transform:rotate(calc(var(--k) * 26deg))
            translate(0,-126px) scale(1);}}

        /* LA FRISE DE LA PREPARATION. Elle reprend la grammaire de celle de la
           recherche — meme pastilles, meme trait, meme coche — parce que ce sont
           deux moments du meme parcours et qu'ils ne doivent pas avoir l'air de
           venir de deux applications. */
        .mu-prep-frise{display:flex;align-items:flex-start;justify-content:center;
          list-style:none;margin:14px 0 0;padding:0;}
        .mu-prep-frise li{flex:1 1 0;min-width:0;display:flex;
          flex-direction:column;align-items:center;gap:8px;position:relative;
          font-size:13px;font-weight:700;line-height:1.28;color:#B9A9E8;
          white-space:pre-line;}
        /* LE TRAIT EST EN POINTILLES, comme la maquette : il relie sans
           promettre un remplissage progressif qu'on ne saurait pas mesurer. */
        .mu-prep-frise li+li::before{content:"";position:absolute;top:29px;
          right:calc(50% + 32px);left:calc(-50% + 32px);height:0;
          border-top:2px dashed rgba(199,125,240,.5);}
        .mu-prep-frise li{color:#6C7A90;}
        .mu-prep-frise li i{width:58px;height:58px;border-radius:50%;
          display:grid;place-items:center;position:relative;
          border:1.8px solid rgba(255,255,255,.14);
          background:rgba(255,255,255,.03);color:#6C7A90;
          transition:border-color .3s ease,color .3s ease;}
        /* CELLES QUI SONT PASSEES ET CELLE QUI SE JOUE. Une etape a venir reste
           grise : dessinee comme les autres, elle annoncerait un travail deja
           fait. */
        .mu-prep-frise li.fait,.mu-prep-frise li.ici{color:#B9A9E8;}
        .mu-prep-frise li.fait i,.mu-prep-frise li.ici i{
          border-color:rgba(199,125,240,.7);color:#D9C6FF;}
        .mu-prep-frise li:not(.fait):not(.ici) i img{opacity:.35;
          filter:grayscale(.7);}
        .mu-prep-frise li .mu-tr{width:26px;height:26px;}
        .mu-prep-frise li.fait i::after{content:"✓";position:absolute;top:-4px;
          right:-4px;width:20px;height:20px;border-radius:50%;background:#9333EA;
          color:#fff;font-size:11px;font-weight:900;display:grid;
          place-items:center;box-shadow:0 0 0 2.5px #0C121D;}
        .mu-prep-frise li.ici i{border-color:#F0269B;
          box-shadow:0 0 20px -2px rgba(240,38,155,.9);
          animation:muPulse 1.8s ease-in-out infinite;}
        /* ON APPROCHE, ET LE BATTEMENT S'ACCELERE. C'est la seule chose vraie
           que les trois actes sachent dire sur cet ecran : la jauge avance. */
        .mu-prep.a3 .mu-prep-frise li.ici i{animation-duration:.9s;}
        .mu-prep.a3 .mu-prep-anneau{animation-duration:1.4s;}
        .mu-prep-frise li.ici i img{width:40px;height:40px;object-fit:contain;}
        .mu-prep-frise li.ici{color:#fff;font-weight:800;}

        .mu-prep-prive{display:flex;align-items:center;justify-content:center;
          gap:8px;margin:18px 0 10px;font-size:12.5px;line-height:1.4;
          color:var(--mu-pale);}
        .mu-prep-prive i{font-style:normal;font-size:13px;flex:none;}


        /* ═══ L'ATTENTE, ET C'EST LE MOMENT LE PLUS IMPORTANT DE L'ESSAI ═════

           « Cette etape avant le resultat devrait etre LE moment magique avant
           la decouverte. Il faut que ca devienne un moment tres special de
           l'experience ClikMe, memorable, avec une super animation — peut-etre
           que le fantome a une place importante dedans. »

           CE QUE CES DOUZE SECONDES SONT VRAIMENT : le seul endroit du parcours
           ou l'on ne peut RIEN faire. La photo est prise, la piece est choisie,
           il n'y a plus qu'a attendre. Une barre de progression y dit « ce
           logiciel travaille », c'est-a-dire la seule chose dont personne n'a
           envie a ce moment-la. Elle transforme de l'anticipation en patience.

           CE QU'ON MONTRE A LA PLACE : sa propre photo, floutee, qui se devine
           derriere ; le fantome qui traverse en portant la piece choisie ; et
           une poussiere qui le suit. On ne regarde plus une barre — on regarde
           quelqu'un travailler sur SA photo. */
        /* LA SCENE EST RONDE, ET PLUS GRANDE QU'AVANT. Ronde parce que l'anneau
           de progression en fait le tour : un cadre carre avec un cercle dedans
           aurait deux geometries qui se disputent. Plus grande parce qu'on la
           regarde maintenant quarante secondes au lieu de dix. */
        .mu-cal-scene{position:relative;width:min(300px,84vw);aspect-ratio:1/1;
          margin:4px auto 0;border-radius:50%;overflow:hidden;
          background:radial-gradient(circle at 50% 42%,#3A1340,#120A1E 74%);
          box-shadow:0 28px 60px -34px rgba(0,0,0,.95),
            inset 0 0 0 1px rgba(255,255,255,.07);}
        /* SA PHOTO EST L'OBJET DE L'ATTENTE. Floutee et sombre, elle se devine
           sans distraire — et elle dit, sans un mot, que c'est bien SUR ELLE
           qu'on travaille. */
        /* ELLE DOIT SE DEVINER, PAS DISPARAITRE. Au premier jet, entre un flou de
           treize points, une opacite de 0,42 et un voile opaque a 88 %, on ne
           voyait plus rien du tout — donc la scene ne disait plus que c'est SUR
           SA PHOTO qu'on travaille, ce qui etait tout son propos. */
        /* ET ELLE SE FAIT DE PLUS EN PLUS NETTE. Le flou se retire acte apres
           acte : c'est la meme photo qui devient lisible, donc l'attente a une
           direction — on ne tourne pas en rond, on approche. */
        .mu-cal-fond{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;filter:blur(7px) saturate(.9);transform:scale(1.15);
          opacity:.72;transition:filter 1.2s ease,opacity 1.2s ease;}
        .mu-cal-scene.a2 .mu-cal-fond{filter:blur(4px) saturate(1);opacity:.85;}
        .mu-cal-scene.a3 .mu-cal-fond{filter:blur(1px) saturate(1.08);opacity:1;}
        .mu-cal-voile{position:absolute;inset:0;
          transition:opacity 1.2s ease;
          background:radial-gradient(circle at 50% 45%,rgba(10,18,16,.12),rgba(6,12,10,.8) 78%);}
        .mu-cal-scene.a3 .mu-cal-voile{opacity:.5;}

        /* ═══ ACTE 1 · LE FAISCEAU ════════════════════════════════════════
           UNE BARRE QUI DESCEND, AVEC SA TRAINEE. Le coeur est presque blanc et
           la trainee s'eteint vers le haut : c'est ce qui donne le sens de la
           marche. Elle sort du cadre en bas et rentre par le haut, donc le
           cycle ne montre jamais de saut. */
        .mu-cal-scan{position:absolute;left:-10%;right:-10%;height:34%;top:-34%;
          pointer-events:none;opacity:0;
          background:linear-gradient(180deg,rgba(255,138,214,0),
            rgba(255,138,214,.12) 62%,rgba(255,196,236,.85) 92%,rgba(255,255,255,.95));
          box-shadow:0 8px 26px 2px rgba(240,56,156,.55);
          animation:muScan 2.6s linear infinite;}
        @keyframes muScan{
          0%{transform:translateY(0);opacity:0;}
          12%{opacity:1;}
          88%{opacity:1;}
          100%{transform:translateY(400%);opacity:0;}
        }
        /* IL NE JOUE QU'AU PREMIER ACTE. Un faisceau qui balaie encore pendant
           qu'on ajuste la lumiere dirait qu'on recommence a mesurer. */
        /* IL S'ETEINT, IL NE S'ETEINT PAS D'UN COUP. Couper l'animation net
           arretait le faisceau EN PLEIN BALAYAGE : il disparaissait au milieu de
           l'ecran, ce qui se lit comme un defaut d'affichage et non comme une
           fin. On le laisse tourner et on le fait fondre — il finit sa course
           pendant qu'il s'efface. C'est la meme correction sur les trois
           couches de l'acte 1, et c'est la raison principale pour laquelle
           cette attente passait mal : trois ruptures seches a chaque acte. */
        .mu-cal-scan{transition:opacity .8s ease;}
        .mu-cal-scene.a2 .mu-cal-scan,
        .mu-cal-scene.a3 .mu-cal-scan{opacity:0;}

        /* ─── LE MAILLAGE ───
           Les traits se dessinent d'un bout a l'autre, les points s'allument
           l'un apres l'autre. Le meme cycle que le faisceau : c'est LUI qui
           semble les allumer, et c'est tout l'effet. */
        .mu-cal-maille{position:absolute;inset:0;width:100%;height:100%;
          overflow:visible;transition:opacity .9s ease;}
        .mu-cal-maille path{fill:none;stroke:rgba(255,186,232,.9);stroke-width:1.1;
          stroke-linecap:round;stroke-linejoin:round;
          filter:drop-shadow(0 0 2px rgba(255,120,200,.9));
          stroke-dasharray:100;stroke-dashoffset:100;
          animation:muMaille 2.6s ease-out infinite;}
        .mu-cal-t2{animation-delay:.3s;}
        .mu-cal-t3{animation-delay:.52s;}
        @keyframes muMaille{
          0%{stroke-dashoffset:100;opacity:0;}
          16%{opacity:1;}
          52%{stroke-dashoffset:0;opacity:1;}
          84%{opacity:.5;}
          100%{stroke-dashoffset:0;opacity:0;}
        }
        .mu-cal-pt{fill:#FFEAF7;opacity:0;
          filter:drop-shadow(0 0 3px rgba(255,120,200,1));
          animation:muPoint 2.6s ease-out infinite;
          animation-delay:calc(var(--k) * .07s);}
        @keyframes muPoint{
          0%,6%{opacity:0;transform:scale(.4);}
          22%{opacity:1;transform:scale(1.5);}
          46%{opacity:.9;transform:scale(1);}
          100%{opacity:0;transform:scale(.6);}
        }
        /* AU DEUXIEME ACTE IL S'ESTOMPE SANS DISPARAITRE : la mesure est prise,
           elle reste comme un calque de travail pendant qu'il essaie. */
        .mu-cal-scene.a2 .mu-cal-maille{opacity:.3;}
        .mu-cal-scene.a3 .mu-cal-maille{opacity:0;}

        /* ═══ ACTE 3 · LE RIDEAU ══════════════════════════════════════════
           Il se retire par le bas, comme une main qui decouvre. Il ne joue
           qu'une fois par acte et ne boucle pas : un rideau qui se rouvre
           n'est plus un devoilement. */
        .mu-cal-rideau{position:absolute;inset:0;pointer-events:none;opacity:0;
          background:linear-gradient(180deg,rgba(255,255,255,0) 40%,
            rgba(255,196,236,.55) 72%,rgba(255,255,255,.9));}
        .mu-cal-scene.a3 .mu-cal-rideau{animation:muRideau 1.4s ease-out both;}
        @keyframes muRideau{
          0%{opacity:.95;transform:translateY(0);}
          100%{opacity:0;transform:translateY(100%);}
        }

        /* ═══ L'ANNEAU DE PROGRESSION ═════════════════════════════════════
           Il fait le tour de son visage. L attribut pathLength a 100 fait que le trace se
           compte en centiemes : l'avancement s'y ecrit tel quel, sans calculer
           de circonference — donc sans se tromper le jour ou le rayon change. */
        .mu-cal-jauge{position:absolute;inset:0;width:100%;height:100%;
          transform:rotate(-90deg);}
        .mu-cal-rail{fill:none;stroke:rgba(255,255,255,.12);stroke-width:2.6;}
        .mu-cal-fil{fill:none;stroke:#F0389C;stroke-width:2.6;
          stroke-linecap:round;stroke-dasharray:100;
          transition:stroke-dashoffset .3s linear;
          filter:drop-shadow(0 0 6px rgba(240,56,156,.95));}
        /* L'ANNEAU RESPIRE. Trois secondes par cycle : plus vite, il presse ;
           plus lentement, on ne le voit pas bouger. */
        .mu-cal-anneau{position:absolute;left:50%;top:45%;
          width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;
          border:1px solid rgba(255,150,214,.34);
          animation:muRespire 3s ease-in-out infinite;}
        @keyframes muRespire{
          0%,100%{transform:scale(.88);opacity:.28;}
          50%{transform:scale(1.06);opacity:.7;}
        }
        /* LE FANTOME TRAVERSE, ET IL PORTE CE QU'ON A CHOISI. La vignette de la
           piece accrochee a lui est ce qui relie cette animation a CET essai-la
           plutot qu'a un chargement generique. */
        /* LE NOM EST « muCalFlotte » ET NON « muFlotte » : ce dernier existe
           deja plus bas, pour le fantome du depot. DEFAUT MESURE : ecrite sous
           le meme nom, la seconde declaration EFFACE la premiere — le fantome
           de l'attente perdait son translate(-50%,-50%) et se posait a
           soixante-cinq pour cent de large au lieu de cinquante. C'est la meme
           faute que deux classes homonymes, et la garde des styles la compte
           desormais pour les animations aussi. */
        /* ─── L'ORBITE ───
           DEUX ANIMATIONS EMBOITEES, ET IL LE FAUT. Le porteur tourne autour du
           centre ; le fantome, dedans, garde son flottement et son balancement.
           Ecrites sur le meme element, les deux se battraient pour la propriete transform
           et la derniere declaree effacerait l'autre — meme faute que les deux
           classes homonymes plus haut.
           ET IL PASSE DERRIERE LA TETE. L'echelle et l'opacite font la
           profondeur a mi-parcours : c'est ce qui donne le tour complet plutot
           qu'un va-et-vient a plat. */
        .mu-cal-orbite{position:absolute;left:50%;top:45%;width:0;height:0;
          animation:muOrbite 5.2s cubic-bezier(.45,0,.55,1) infinite;}
        @keyframes muOrbite{
          0%{transform:translate(-68px,14px) scale(1);opacity:1;}
          25%{transform:translate(0,-64px) scale(.72);opacity:.5;}
          50%{transform:translate(68px,14px) scale(1);opacity:1;}
          75%{transform:translate(0,52px) scale(1.12);opacity:1;}
          100%{transform:translate(-68px,14px) scale(1);opacity:1;}
        }
        /* IL NE TOURNE QU'AU DEUXIEME ACTE. Pendant la mesure il attend sur le
           cote, pendant l'ajustement il se pose au centre : trois positions,
           trois moments, et l'oeil suit une histoire. */
        .mu-cal-scene.a1 .mu-cal-orbite{animation:none;
          transform:translate(-68px,14px);}
        /* AU TROISIEME ACTE IL MONTE AU-DESSUS DE LA TETE, ET NE SE POSE PAS
           DESSUS. Pose au centre, il couvrait les yeux au moment precis ou la
           photo redevient nette — c'est-a-dire qu'il cachait ce qu'on venait
           d'attendre quarante secondes. */
        .mu-cal-scene.a3 .mu-cal-orbite{animation:none;transform:translate(0,-92px);
          transition:transform .9s cubic-bezier(.3,1.4,.5,1);}
        .mu-cal-f{position:absolute;left:0;top:0;
          display:block;width:74px;height:80px;
          animation:muCalFlotte 3.4s ease-in-out infinite;}
        .mu-cal-s{width:74px;height:80px;filter:drop-shadow(0 10px 22px rgba(0,0,0,.6));}
        .mu-cal-s .mu-f-corps{fill:#F3F0FF;}
        .mu-cal-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-cal-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        /* LE DECALAGE VIT DANS LES IMAGES-CLES, ET IL LE FAUT. Une animation
           qui touche la propriete transform ECRASE le transform statique de
           la regle : on
           ne peut pas centrer d'un cote et flotter de l'autre. Les deux se
           declarent donc ensemble, a chaque image. */
        @keyframes muCalFlotte{
          0%,100%{transform:translate(-50%,-50%) rotate(-3deg);}
          50%{transform:translate(-50%,-62%) rotate(3deg);}
        }
        .mu-cal-piece{position:absolute;right:-20px;bottom:-6px;
          width:46px;height:46px;object-fit:cover;border-radius:11px;
          border:2px solid rgba(243,240,255,.9);
          box-shadow:0 8px 18px rgba(0,0,0,.6);
          animation:muPorte 3.4s ease-in-out infinite;}
        @keyframes muPorte{
          0%,100%{transform:rotate(6deg) translateY(0);}
          50%{transform:rotate(-4deg) translateY(-4px);}
        }
        /* LA POUSSIERE. Chaque point a son propre retard (--k) : sans le
           decalage ils battent ensemble et l'oeil voit une pulsation au lieu
           d'un scintillement. */
        .mu-cal-poudre{position:absolute;inset:0;}
        /* ELLE ETAIT INVISIBLE AU PREMIER JET : quatre points de large, sans
           lueur, sur un fond presque noir — mesure faite, deux points sur
           douze depassaient dix pour cent d'opacite a un instant donne. Six
           points et un halo de la meme couleur suffisent a la rendre lisible
           sans qu'elle devienne un feu d'artifice. */
        .mu-cal-poudre i{position:absolute;left:50%;top:45%;width:5px;height:5px;
          margin:-2.5px 0 0 -2.5px;border-radius:50%;background:#E4DBFF;opacity:0;
          box-shadow:0 0 10px 2px rgba(228,219,255,.7);
          animation:muPoudre 2.8s ease-out infinite;
          animation-delay:calc(var(--k) * .23s);
          transform:rotate(calc(var(--k) * 30deg));}
        @keyframes muPoudre{
          0%{opacity:0;transform:rotate(calc(var(--k) * 30deg)) translateX(42px) scale(.4);}
          18%{opacity:1;}
          100%{opacity:0;transform:rotate(calc(var(--k) * 30deg)) translateX(104px) scale(.2);}
        }
        /* LA PHRASE CHANGE AVEC L'AVANCEMENT, et elle ne saute pas : une phrase
           qui se remplace d'un coup se lit comme un defaut d'affichage. */
        .mu-cal-dit{min-height:2.6em;display:flex;align-items:center;
          justify-content:center;animation:muDit .5s ease both;}
        @keyframes muDit{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}

        /* LA POUSSIERE SUIT LE FANTOME AU LIEU DE PARTIR DU CENTRE. Elle est
           posee dans l'orbite, donc elle nait la ou il est : des etincelles
           qu'il seme, et non un feu d'artifice qui part d'ailleurs. */
        .mu-cal-scene.a1 .mu-cal-poudre,
        .mu-cal-scene.a3 .mu-cal-poudre{opacity:.22;}

        @media (prefers-reduced-motion:reduce){
          .mu-cal-f,.mu-cal-piece,.mu-cal-anneau,.mu-cal-poudre i,.mu-cal-dit,
          .mu-cal-scan,.mu-cal-maille path,.mu-cal-pt,.mu-cal-orbite,
          .mu-cal-rideau{animation:none;}
          .mu-cal-poudre,.mu-cal-scan{display:none;}
          /* LE MAILLAGE RESTE, POSE. Il dit ce qui se passe sans bouger, et
             c'est exactement ce que ce reglage demande. */
          .mu-cal-maille path{stroke-dashoffset:0;}
          .mu-cal-pt{opacity:.9;}
        }

        .mu-calcul{text-align:center;padding:18px 0 6px;}
        .mu-calcul-s{width:56px;height:61px;
          animation:muCalFlotte 1.6s ease-in-out infinite;}
        .mu-calcul-s .mu-f-corps{fill:#F3F0FF;}
        .mu-calcul-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-calcul-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        @keyframes muFlotte{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
        .mu-calcul b{display:block;margin-top:10px;font-size:15px;font-weight:700;}
        .mu-jauge{height:7px;border-radius:20px;margin:13px auto 7px;max-width:230px;
          background:rgba(255,255,255,.09);overflow:hidden;}
        .mu-jauge i{display:block;height:100%;border-radius:20px;
          background:linear-gradient(90deg,var(--mu-v1),var(--mu-v2));
          transition:width .12s linear;}
        .mu-calcul em{font-style:normal;font-size:12px;font-weight:800;
          color:#C9BCFF;font-variant-numeric:tabular-nums;}

        /* ═══ LA REVELATION ══════════════════════════════════════════════════

           « Cette page resultat n'est pas tres fun alors qu'elle devrait etre
           tres aboutie. Elle manque de caractere, et on devrait etre aussi
           surpris par le resultat que par la page elle-meme. »

           CE QUI CLOCHAIT : l'image apparaissait d'un coup, posee a plat. Tout
           le parcours amene a CETTE seconde-la — on s'est photographie, on a
           choisi, on a attendu — et l'ecran la traitait comme l'affichage d'un
           resultat de recherche.

           LE CADRE S'OUVRE, ET UN VOILE LE BALAIE UNE FOIS. Sept cent cinquante
           millisecondes, jamais rejouees : c'est la difference entre « voici une
           image » et « regardez ». Une brillance qui repasserait en boucle
           deviendrait un defaut d'ecran au troisieme tour. */
        .mu-rendu.revele .mu-rendu-i,
        .mu-rendu.revele .mu-mi{animation:muOuvre .62s cubic-bezier(.16,1,.3,1) both;}
        @keyframes muOuvre{
          from{opacity:0;transform:scale(.94);}
          to{opacity:1;transform:none;}
        }
        .mu-rendu-eclat{position:absolute;inset:0;pointer-events:none;opacity:0;
          background:linear-gradient(105deg,transparent 38%,
            rgba(255,255,255,.34) 50%,transparent 62%);}
        .mu-rendu.revele .mu-rendu-eclat{
          animation:muEclat .75s cubic-bezier(.4,0,.2,1) .16s both;}
        @keyframes muEclat{
          0%{opacity:0;transform:translateY(-60%);}
          25%{opacity:1;}
          100%{opacity:0;transform:translateY(60%);}
        }
        /* LE NOM ET LE PRIX ARRIVENT APRES L'IMAGE, pas avec elle : on regarde
           d'abord, on lit ensuite. C'est l'ordre dans lequel ca se passe dans la
           tete, et le decalage de deux dixiemes suffit a le respecter. */
        .mu-rendu.revele .mu-rendu-t,
        .mu-rendu.revele .mu-styles,
        .mu-rendu.revele .mu-note{animation:muApres .5s ease .42s both;}
        @keyframes muApres{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}

        /* ═══ LA FRISE DES TROIS TEMPS ═══════════════════════════════════════

           ELLE AVAIT ETE RETIREE, ET C'ETAIT JUSTE A L'EPOQUE : « 1 · CADRER
           2 · CHOISIR  3 · DECIDER » au-dessus d'un ecran qui n'avait encore
           rien montre prevenait qu'il allait falloir en faire trois.

           CE QUI L'A RAPPELEE : le parcours ne s'arrete plus au rendu. Il va
           jusqu'a l'avis, au mur du commercant et au salon. Le troisieme temps
           n'est plus une corvee annoncee — c'est la promesse qui donne envie de
           faire les deux premiers, et c'est lui qu'on ne devinait pas. */
        .mu-frise{display:flex;align-items:center;gap:4px;list-style:none;
          margin:0 0 14px;padding:0;}
        .mu-frise li{flex:1 1 0;min-width:0;display:flex;align-items:center;
          gap:6px;font-size:11px;font-weight:750;line-height:1.15;
          color:var(--mu-pale);}
        .mu-frise li i{flex:none;display:grid;place-items:center;
          width:20px;height:20px;border-radius:50%;font-style:normal;
          font-size:10.5px;font-weight:850;
          background:rgba(255,255,255,.07);color:#8FA8B8;
          border:1px solid rgba(255,255,255,.14);
          transition:background .28s ease,color .28s ease,transform .28s ease;}
        /* UNE ETAPE TIENT SUR UNE LIGNE. MESURE : « 3. Je donne mon avis » se
           cassait en deux au troisieme temps, ce qui poussait toute la frise a
           deux lignes et faisait sauter la photo de dix-huit points a chaque
           changement d'ecran. */
        .mu-frise li span{min-width:0;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;}
        .mu-frise li.fait i{background:#8B7DF6;border-color:#8B7DF6;color:#fff;}
        .mu-frise li.fait{color:#B6AEE6;}
        .mu-frise li.ici i{background:#8B7DF6;border-color:#8B7DF6;color:#fff;
          transform:scale(1.12);}
        .mu-frise li.ici{color:#E8EFF6;font-weight:850;}
        /* A 390 POINTS, « Je donne mon avis » NE TIENT QU'EN COUPANT. On ne
           montre donc le mot que de l'etape EN COURS et de celles qui sont
           faites : les suivantes gardent leur numero, ce qui suffit a dire
           qu'il en reste. Trois libelles tronques ne disent rien du tout. */
        @media (max-width:409px){
          .mu-frise li:not(.ici):not(.fait) span{display:none;}
          .mu-frise li:not(.ici):not(.fait){flex:none;}
        }

        /* ═══ LA GLISSIERE AVANT / APRES ═════════════════════════════════════

           LA MAQUETTE LA DEMANDE, ET ELLE A RAISON CONTRE L'APPUI LONG. Celui-ci
           est le geste du coup d'oeil : on revoit sa tete une seconde, on
           relache, on est revenu. Il ne laisse RIEN JUGER, parce qu'il n'y a pas
           d'arret possible au milieu. La glissiere s'arrete ou l'on veut, la
           ligne de partage passe sur son propre visage, et c'est la qu'on voit
           ce qui a change.

           LE « AVANT » EST DECOUPE, PAS RETRECI. Ecrit width:var(--x) avec
           overflow:hidden, le calque garde la bonne largeur mais la photo dedans
           se met en page dans cette largeur-la : on comparerait un visage
           comprime a un visage normal, c'est-a-dire deux visages differents,
           c'est-a-dire rien. clip-path laisse le calque a la taille du cadre et
           masque seulement ce qui depasse du trait. */
        /* ═══ RIEN NE SE COUPE PLUS, NI LA TETE NI LES PIEDS ════════════════

           « Ton interface recadre aussi le resultat : le haut de la tete passe
           derriere le bandeau et la photo semble affichee en object-fit:cover.
           Meme une bonne image parait donc coupee. »

           LE DIAGNOSTIC EST JUSTE, ET LE CADRE CARRE EN EST LA MOITIE. Un cadre
           1:1 rempli en cover avec une photo en pied rogne le haut ET le bas :
           on perdait la tete et les chaussures, c'est-a-dire les deux extremites
           par lesquelles on juge un vetement.

           contain GARANTIT QU'ON VOIT TOUT, et le cadre passe en quatre
           cinquiemes — assez vertical pour qu'une photo en pied le remplisse
           presque, assez large pour qu'une main a plat n'y flotte pas. Ce qui
           reste de vide est du fond sombre, ce qui est toujours preferable a un
           membre coupe.

           LES DEUX CALQUES GARDENT LE MEME CADRE : la glissiere compare deux
           images superposees, et il suffirait qu'une seule se mette en page
           autrement pour qu'on compare deux cadrages au lieu de deux tenues. */
        .mu-mi{position:relative;width:100%;aspect-ratio:4/5;overflow:hidden;
          border-radius:18px;background:#0A1210;touch-action:pan-y;}
        .mu-mi-i{display:block;width:100%;height:100%;object-fit:contain;
          object-position:center;}
        .mu-mi-av{position:absolute;inset:0;
          clip-path:inset(0 calc(100% - var(--x,58%)) 0 0);}
        /* LE TRAIT ET SA POIGNEE NE RECOIVENT AUCUN APPUI : c'est la glissiere,
           dessous, qui les recoit tous. Sans ce mot, le trait volerait au doigt
           les appuis destines a la glissiere, precisement la ou l'on vise. */
        .mu-mi-t{position:absolute;top:0;bottom:0;left:var(--x,58%);width:2px;
          background:rgba(255,255,255,.92);pointer-events:none;z-index:3;
          box-shadow:0 0 0 1px rgba(0,0,0,.3);}
        .mu-mi-t i{position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;
          display:grid;place-items:center;font-style:normal;font-size:15px;
          font-weight:850;color:#0A1210;background:#fff;letter-spacing:-.06em;
          box-shadow:0 6px 18px rgba(0,0,0,.55);}
        .mu-mi-r{position:absolute;inset:0;z-index:4;width:100%;height:100%;
          margin:0;appearance:none;background:transparent;cursor:ew-resize;
          opacity:0;}
        .mu-mi-r::-webkit-slider-thumb{appearance:none;width:44px;height:100%;}
        .mu-mi-r::-moz-range-thumb{width:44px;height:100%;border:0;
          background:transparent;}
        .mu-mi-r:focus-visible{outline:2px solid #C9BCFF;outline-offset:-3px;}
        /* LES DEUX PASTILLES NOMMENT LES DEUX MOITIES. Sans elles on ne sait pas
           laquelle est laquelle, et c'est la seule information dont cette image
           a besoin. Chacune s'efface quand sa moitie disparait : une etiquette
           posee sur rien est une etiquette qui ment. */
        .mu-mi-e{position:absolute;bottom:11px;z-index:5;font:inherit;
          font-size:11px;font-weight:850;letter-spacing:.04em;color:#fff;
          border:0;border-radius:999px;padding:7px 14px;cursor:pointer;
          background:rgba(6,14,11,.68);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          transition:opacity .2s ease;}
        .mu-mi-e.a{left:11px;}
        .mu-mi-e.b{right:11px;color:#0A1210;background:#C9BCFF;cursor:default;}
        .mu-mi-e.off{opacity:0;pointer-events:none;}

        /* ═══ LA BANDE DES AUTRES STYLES ═════════════════════════════════════

           LA MAQUETTE LES MET SOUS L'IMAGE, ET C'EST LE PLUS GROS GAIN DE
           L'ECRAN. Le geste le plus frequent apres un rendu est « et celle-la,
           elle donnerait quoi ? » : il coutait deux ecrans — revenir a la
           grille, rechoisir — et on perdait le rendu qu'on regardait, donc on ne
           comparait rien. Ici on reste sur son visage et on change de coupe,
           comme un coiffeur avec un nuancier. */
        /* LA TUILE QUI COMPTE CE QUI RESTE, au bout de la bande. Elle a la
           taille d'une vignette et pas son contenu : c'est un nombre. */

        /* LA BANDE, SOUS UNE PHOTO EN PLEIN ECRAN. Elle passe en vignettes
           larges et SANS LEGENDE, comme la maquette : sous une photo qui occupe
           tout, on reconnait un style a son image, et deux lignes de texte sous
           chaque vignette rendraient la bande plus haute que ce qu'elle
           montre. */
        .mu-rendu.plein .mu-styles{gap:9px;margin-top:14px;}
        .mu-rendu.plein .mu-styles button{width:88px;}
        .mu-rendu.plein .mu-styles button img,
        .mu-rendu.plein .mu-styles button .mu-teinte{width:88px;height:76px;
          border-radius:15px;}
        .mu-rendu.plein .mu-styles button span{display:none;}
        .mu-rendu.plein .mu-styles-p{width:auto!important;min-width:88px;
          height:76px;}
        .mu-rendu.plein .mu-styles-p span{display:block;}

        /* ═══ LES TROISIEME ET QUATRIEME TEMPS GARDENT LA PHOTO EN PLEIN ══════

           LA MAQUETTE NE LA REMET JAMAIS DANS UNE BOITE : l'avis et l'action se
           donnent tous les deux DEVANT le rendu, parce que c'est lui qu'on note
           et lui qu'on va chercher. Elle raccourcit seulement, pour laisser la
           place a la question et aux gestes. */
        .mu-rendu.plein.court .mu-mi{height:min(44vh,380px);}
        /* LA CARTE MAIGRIT AVEC LA PHOTO. MESURE : a trois cent quatre-vingts
           points de haut, elle descendait huit points sous la pastille
           « Apres » et la cachait — l'etiquette qui nomme la moitie qu'on
           regarde. La vignette de la piece passe en carre, la carte perd
           quarante points, et la pastille redevient lisible. */
        .mu-rendu.plein.court .mu-pl-ph{aspect-ratio:1;}
        /* ET SUR UN ECRAN COURT, LA QUESTION DOIT RESTER VISIBLE AVEC LES CINQ
           FANTOMES : sous quarante-quatre pour cent, la photo les repousserait
           sous le pli, et une question qu'on ne voit pas ne recoit pas de
           reponse. */
        @media (max-height:700px){
          .mu-rendu.plein .mu-mi{height:56vh;}
          .mu-rendu.plein.court .mu-mi{height:38vh;}
        }

        /* LES LIGNES D'INFORMATION DE LA CARTE, aux temps ou les couleurs et le
           partage ont laisse la place : ou c'est, et ce qu'on en dit. */
        .mu-pl-i{list-style:none;margin:10px 0 0;padding:0;display:flex;
          flex-direction:column;gap:8px;}
        .mu-pl-i li{display:flex;align-items:center;gap:8px;}
        .mu-pl-i .mu-tr{flex:none;width:17px;height:17px;stroke:#9FB3C8;
          stroke-width:1.6;}
        .mu-pl-i span{min-width:0;font-size:11.5px;font-weight:750;
          line-height:1.2;color:#E8EFF6;}
        .mu-pl-i i{display:block;font-style:normal;font-size:10.5px;
          font-weight:600;color:var(--mu-pale);}

        /* ═══ LE TROISIEME TEMPS : JE DONNE MON AVIS ═════════════════════════

           C'EST L'ECRAN QUI N'EXISTAIT PAS. La note etait posee au milieu du
           rendu, entre une image et six boutons, et elle avait la taille d'un
           detail alors qu'elle est la seule chose que ce produit sache
           recueillir et que personne d'autre n'a. Ici elle est la question de
           l'ecran, et c'est d'elle que partent les trois suites. */
        /* CE QUI PLAIT, ET CE N'EST PAS LA MEME QUESTION QUE LA NOTE. Quatre
           fantomes apprennent au commercant que ca a plu ; ils ne lui disent pas
           si c'est la longueur ou la couleur, c'est-a-dire la seule chose qu'il
           puisse changer demain. */
        .mu-aime{margin-top:16px;text-align:left;
          animation:muApres .38s ease both;}
        .mu-aime p{margin:0 0 8px;font-size:13.5px;font-weight:800;color:#E8EFF6;}
        .mu-aime div{display:flex;flex-wrap:wrap;gap:7px;}
        .mu-aime button{font:inherit;font-size:12.5px;font-weight:750;
          color:var(--mu-pale);cursor:pointer;border-radius:999px;
          padding:9px 15px;background:transparent;
          border:1px solid rgba(255,255,255,.16);
          transition:color .16s ease,border-color .16s ease,background .16s ease;}
        .mu-aime button.on{color:#0A1210;background:#C9BCFF;
          border-color:#C9BCFF;font-weight:850;}
        .mu-aime button:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}
        /* ═══ L'ECRAN DU RESULTAT, D'APRES LA MAQUETTE ═══════════════════════

           « Alors, ca vous plait ? / Touchez un fantome pour donner votre
           avis. » Puis cinq fantomes nommes, un mot facultatif, et deux gestes.

           LES CINQ FANTOMES SONT NOMMES, ET C'EST CE QUI CHANGE TOUT. Cinq
           dessins identiques demandent de COMPTER pour savoir ce qu'on choisit ;
           avec un mot sous chacun, on reconnait le sien du premier coup d'oeil.
           Et les mots ne sont pas une echelle : « Coup de coeur » n'est pas
           « cinq sur cinq », c'est autre chose — c'est ce qui se lira sur le mur.

           ILS BRILLENT AU ROSE, PAS AU VIOLET. C'est la seule note du produit,
           et le rose est la couleur qu'on ne sort que pour ce qui touche — la
           surprise, le coup de coeur. Le violet reste celui du fantome qui
           travaille. */
        /* LES MOTS SOUS LES FANTOMES. La rangee devient une grille de cinq
           colonnes egales : en flex, « Coup de coeur » elargissait sa colonne et
           les cinq fantomes n'etaient plus a egale distance. */
        /* LE HALO ROSE N'EST PAS UNE OMBRE SUR LE BOUTON, C'EST UNE LUEUR SUR
           LE DESSIN. Pose sur le bouton, il faisait un carre lumineux autour
           d'une forme arrondie — mesure a l'ecran, et c'est tres laid. */
        /* LE CINQUIEME EST LE SEUL A CHANGER DE VISAGE — voir le composant
           Signe. Eteint,
           ses coeurs prennent un rouge sombre qui se lit sur le gris ; allume,
           le rose de la note. C'est le seul endroit du produit ou le fantome
           dit un sentiment plutot qu'une note. */

        /* LES DEUX GESTES DE LA MAQUETTE, COTE A COTE ET DE POIDS DIFFERENTS.
           A gauche « Surprends-moi encore », en contour : il ne decide rien.
           A droite le seul aplat de l'ecran, en rose : c'est la seule decision,
           et elle previent le commercant. */

        /* LES DEUX LIENS DU BAS. Ils ne decident rien, donc ils n'ont ni fond
           ni contour : montrer a quelqu'un, revenir choisir. Le trait vertical
           entre les deux vient de la maquette, et il fait le travail d'une
           separation sans en ajouter une. */

        /* LES DEUX GESTES SECONDAIRES SONT COTE A COTE, EN CONTOUR. La maquette
           les met la, et c'est le meme raisonnement que sur l'annonce : deux
           aplats de plus disputeraient l'oeil au seul geste plein de l'ecran. */
        /* LE GESTE PLEIN DE L'ESSAI EST VIOLET, comme le bouton de l'annonce et
           comme le halo de l'attente : l'essai a sa couleur dans tout le
           produit, et la menthe reste celle de ce qui engage. */
        .mu-cta.plein.essai{
          background:linear-gradient(112deg,#6D5BFF,#A855F7 58%,#D946B8);
          color:#fff;box-shadow:0 16px 34px -14px rgba(139,92,246,.8);}
        .mu-cta.plein.essai em{color:rgba(255,255,255,.8);}
        .mu-cta.plein.essai s{text-decoration:none;font-size:17px;line-height:1;
          flex:none;}
        /* LE FANTOME DU BOUTON PORTE SES PROPRES ENCRES. Signe ne fixe aucune
           couleur : ses trois pieces prennent celles que la feuille leur donne
           au voisinage. Posé sans regle sur le bouton violet, il sortait donc en
           NOIR — un aplat sombre au milieu d'un degrade clair, mesure a
           l'ecran. Le corps devient blanc, le visage prend l'encre du bouton. */
        /* ═══ L'ECRAN DE LA PHOTO ═══════════════════════════════════════════

           IL NE DISAIT QU'UNE PHRASE, et c'etait une de trop et trois de moins.
           « Reculez d'un pas et cadrez la table entiere » est un conseil ; il en
           faut quatre, parce que ce sont EUX qui decident de la qualite du
           rendu. Un cadrage moyen donne un rendu moyen, et c'est la derniere
           chose qu'on puisse encore corriger.

           LES CONSEILS ET L'EXEMPLE PARTAGENT UNE LIGNE. Empiles, il faut faire
           defiler entre les deux, c'est-a-dire les comparer de memoire. */
        .mu-ph-tete{margin-bottom:14px;}
        .mu-ph-tete h2{margin:0;font-size:26px;font-weight:850;
          letter-spacing:-.035em;line-height:1.06;color:#fff;}
        .mu-ph-tete p{margin:7px 0 0;font-size:13.5px;line-height:1.45;
          color:var(--mu-pale);}
        /* ─── LES CONSEILS ONT PLUS DE PLACE QUE LE VISEUR ───
           A deux colonnes egales, la colonne de texte gardait cent vingt-huit
           points une fois le pictogramme et son ecart retires : « Des vetements
           pres du corps » y tenait sur trois lignes quand ses voisins en
           prenaient deux. Le viseur, lui, n'a rien a gagner a etre plus large —
           c'est une photo verticale. */
        .mu-ph{display:grid;grid-template-columns:1.18fr 1fr;gap:12px;
          align-items:start;}
        .mu-ph-l{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:11px;}
        /* ─── LE PICTOGRAMME S'ALIGNE SUR LE TITRE, PAS SUR LE MILIEU ───
           align-items:center faisait descendre le carre a mi-hauteur des que le
           libelle passait a trois lignes : sur quatre conseils, un seul mal cale
           suffit a donner l'impression que rien n'est aligne. */
        .mu-ph-l li{display:flex;align-items:flex-start;gap:9px;min-width:0;}
        .mu-ph-l li i{flex:none;display:grid;place-items:center;
          width:34px;height:34px;border-radius:11px;font-style:normal;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);color:#D8E4EE;}
        .mu-ph-l li span{min-width:0;}
        .mu-ph-l li b{display:block;font-size:12.5px;font-weight:800;
          color:#E8EFF6;line-height:1.2;}
        .mu-ph-l li em{display:block;margin-top:1px;font-style:normal;
          font-size:11px;font-weight:650;color:var(--mu-pale);line-height:1.2;}
        .mu-tr{width:20px;height:20px;display:block;fill:none;
          stroke:currentColor;stroke-width:1.7;stroke-linecap:round;
          stroke-linejoin:round;}
        .mu-ph-v{position:relative;}
        .mu-ph-v .mu-viseur{margin:0;}
        /* ON DIT QUE CE N'EST PAS LA SIENNE, ET ON LE DIT SUR L'IMAGE. Tant
           qu'aucune photo n'a ete prise, celle du viseur vient du depot : sans
           ce mot, on croit reconnaitre un apercu de soi. */
        .mu-ph-x{position:absolute;left:50%;bottom:9px;transform:translateX(-50%);
          font-size:10.5px;font-weight:800;letter-spacing:.02em;color:#fff;
          background:rgba(6,14,11,.78);border-radius:999px;padding:5px 11px;
          white-space:nowrap;
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .mu-cta.plein.essai i .mu-tr{width:24px;height:24px;}
        /* ═══ CE QU'ON PROMET AVANT DE DEMANDER UNE PHOTO ═══
           C'est la phrase la plus importante de l'ecran, et elle etait en petit
           sous le bouton, melee a « gratuit, sans rendez-vous ». On demande a
           quelqu'un de se photographier : c'est le seul moment du produit ou
           l'on peut le perdre pour de bon, et la seule chose qu'il veut savoir
           est ce qu'on va faire de l'image. */
        .mu-prive{display:flex;align-items:flex-start;justify-content:center;
          gap:7px;margin:14px 0 0;font-size:11.5px;line-height:1.45;
          color:var(--mu-pale);text-align:center;}
        .mu-prive i{font-style:normal;font-size:11.5px;flex:none;}
        @media (max-width:359px){
          .mu-ph{grid-template-columns:1fr;}
          .mu-ph-v{max-width:220px;margin:0 auto;}
        }

        /* ═══ LE PETIT MOT, ET C'EST LUI QU'ON LIRA ═════════════════════════

           Sur le mur, ce n'est pas la note qu'on lit en premier : c'est « Je ne
           pensais pas qu'il m'irait aussi bien » sous la photo. Quatre fantomes
           disent qu'elle a aime ; sa phrase dit ce qui a decide. */

        /* ═══ LA SEULE CASE A COCHER DU PRODUIT ═════════════════════════════
           Le mur n'existe que par elle. Cochee d'avance — sinon le mur reste
           vide, donc personne ne voit ce que ca donne sur de vraies tetes, donc
           personne n'essaie — mais VISIBLE, et elle se decoche d'un appui. */

        /* ═══ CE QU'ON PEUT FAIRE MAINTENANT ════════════════════════════════

           « Merci pour votre avis ! Ce look vous plait ? Voici ce que vous
           pouvez faire maintenant. »

           LE FANTOME FETE, ET C'EST LE SEUL ENDROIT DU PRODUIT OU IL LE FAIT. On
           vient de lui donner quelque chose que personne d'autre n'a — un avis
           sur soi — et enchainer sur trois boutons sans un merci traite ca comme
           une formalite. */
        .mu-fete{display:grid;place-items:center;width:76px;height:76px;
          margin:2px auto 0;border-radius:50%;
          background:radial-gradient(circle,rgba(139,125,246,.42),
            rgba(139,125,246,0) 68%);
          animation:muFete .6s cubic-bezier(.34,1.56,.64,1) both;}
        .mu-fete-s{width:48px;height:53px;}
        .mu-fete-s .mu-f-corps{fill:#fff;}
        .mu-fete-s .mu-f-oeil{fill:#3B1E6E;}
        .mu-fete-s .mu-f-bouche{fill:none;stroke:#3B1E6E;stroke-width:1.9;
          stroke-linecap:round;}
        @keyframes muFete{
          0%{opacity:0;transform:scale(.4);}
          100%{opacity:1;transform:none;}
        }
        .mu-fete-t{margin:8px 0 0;font-size:23px;font-weight:850;
          letter-spacing:-.03em;color:#fff;}
        .mu-fete-p{margin:6px 0 0;font-size:13.5px;line-height:1.5;
          color:var(--mu-pale);}
        /* LE BLOC N'EST PLUS UNE CONFIRMATION VERTE, C'EST UN ECRAN. Il portait
           le fond et la bordure menthe de « c'est fait » ; on y arrive
           maintenant SANS avoir rien demande a personne, et une confirmation
           verte sous trois boutons qu'on n'a pas touches annonce une chose qui
           n'a pas eu lieu. */
        .mu-rendu-ok:has(.mu-agir){background:transparent;border:0;padding:0;}
        .mu-envoi{margin:16px 0 0;padding:13px 14px;border-radius:16px;
          text-align:left;background:rgba(61,226,166,.1);
          border:1px solid rgba(61,226,166,.34);}
        .mu-envoi b{display:block;font-size:14px;font-weight:850;color:#9FF3D2;}
        /* LE COMMERCE EST INVENTE : ce n'est pas une confirmation, c'est un aveu.
           La menthe de « c'est fait » serait un mensonge de plus. */
        .mu-envoi.fiction{background:rgba(240,180,41,.1);
          border-color:rgba(240,180,41,.34);}
        .mu-envoi.fiction b{color:#F7C948;}
        .mu-envoi q{display:block;margin-top:7px;padding:10px 12px;
          border-radius:12px;font-size:13px;line-height:1.45;color:#E8EFF6;
          background:rgba(0,0,0,.28);quotes:none;}
        .mu-envoi em{display:block;margin-top:5px;font-style:normal;
          font-size:12px;line-height:1.45;color:var(--mu-pale);}
        /* LE NUMERO SE LIT COMME UN NUMERO, et il est barre parce qu'il ne
           mene nulle part : c'est exactement ce que la phrase explique. */
        .mu-envoi em s{font-variant-numeric:tabular-nums;font-weight:750;
          color:#F7C948;text-decoration-color:rgba(247,201,72,.5);}
        .mu-pose-t{margin:16px 0 0;font-size:12.5px;color:var(--mu-pale);}
        .mu-agir{display:flex;flex-direction:column;gap:10px;margin-top:18px;}
        .mu-agir-b{display:flex;align-items:center;gap:12px;width:100%;
          font:inherit;cursor:pointer;text-align:left;border-radius:17px;
          padding:14px 15px;color:#E8EFF6;background:transparent;
          border:1px solid rgba(255,255,255,.18);
          transition:transform .12s ease,border-color .16s ease;}
        .mu-agir-b i{flex:none;display:flex;font-style:normal;}
        .mu-agir-b .mu-tr{width:24px;height:24px;stroke-width:1.8;}
        .mu-agir-b span{flex:1;min-width:0;}
        /* ILS PRENAIENT LA MENTHE DE LA CONFIRMATION, et le coupable est
           .mu-rendu-ok b, declare plus bas dans cette meme feuille : meme
           poids, donc c'est lui qui gagnait. « Ouvrir un salon » s'affichait en
           vert sur un bouton violet. Une couleur heritee d'un bloc qui dit
           « c'est fait » n'a rien a faire sur un bouton qui propose. */
        .mu-rendu-ok .mu-agir-b b{display:block;font-size:15px;font-weight:850;
          line-height:1.2;color:inherit;}
        .mu-rendu-ok .mu-agir-b em{color:var(--mu-pale);}
        .mu-rendu-ok .mu-agir-b.plein em{color:rgba(255,255,255,.82);}
        .mu-agir-b em{display:block;margin-top:2px;font-style:normal;
          font-size:12px;color:var(--mu-pale);line-height:1.25;}
        .mu-agir-b s{text-decoration:none;font-size:17px;line-height:1;
          flex:none;opacity:.6;}
        .mu-agir-b:active{transform:scale(.99);}
        .mu-agir-b:disabled{opacity:.38;cursor:default;}
        .mu-agir-b:disabled:active{transform:none;}
        .mu-agir-b.on{color:#FF8A9B;border-color:rgba(255,138,155,.5);
          background:rgba(255,138,155,.1);}
        .mu-agir-b.on .mu-tr{fill:currentColor;}
        /* LE SALON PASSE DEVANT, ET C'EST UN RENVERSEMENT. « Je reserve » etait
           le geste plein depuis le debut. On ne choisit pas une coupe, une
           monture ou un tatouage tout seul : celui qui demande finit par
           reserver, tandis que celui a qui l'on demande de reserver tout de
           suite referme. */
        .mu-agir-b.plein{border-color:transparent;color:#fff;
          background:linear-gradient(112deg,#6D5BFF,#A855F7 58%,#D946B8);
          box-shadow:0 16px 34px -14px rgba(139,92,246,.8);}
        .mu-agir-b.plein em{color:rgba(255,255,255,.82);}
        .mu-agir-b.plein s{opacity:1;}

        .mu-cta-f{width:30px;height:33px;flex:none;overflow:visible;}
        .mu-cta-f .mu-f-corps{fill:#fff;}
        .mu-cta-f .mu-f-oeil{fill:#3B1E6E;}
        .mu-cta-f .mu-f-bouche{fill:none;stroke:#3B1E6E;stroke-width:1.9;
          stroke-linecap:round;}

        /* ═══ LA NOTE, DE UN A CINQ FANTOMES ═════════════════════════════════

           « On pourrait noter le resultat SUR SOI en mettant des etoiles ou des
           fantomes — 1 a 5 fantomes pour dire si on aime ou pas sur soi. »

           DES FANTOMES PLUTOT QUE DES ETOILES : le fantome est deja l'unite de
           ce produit — on en pose un, on en a trois par jour, il appelle depuis
           la barre. Une etoile serait empruntee a tout le monde ; le fantome
           n'est qu'a nous, et il dit en plus la bonne chose — ce qu'on laisse
           de soi. */
        .mu-note{margin-top:13px;}
        .mu-note-q{margin:0 0 8px;font-size:13px;font-weight:800;color:#E8EFF6;}
        /* ═══ « ALORS, CA VOUS PLAIT ? » — L'ECRAN DU RESULTAT ══════════════

           « Il faut respecter le design scrupuleusement pour que l'utilisateur
           ait un bon ressenti. »

           LA PHOTO EST LE FOND, ET TOUT EST POSE DESSUS. C'est la seule chose
           que l'ancien ecran ne faisait pas : il rangeait l'image dans une boite
           arrondie au milieu d'une colonne, avec le texte dessous — le meme
           contenu, mis en page comme un formulaire. Une photo en plein est ce
           qui fait qu'on SE REGARDE.

           LA HAUTEUR SUIT L'ECRAN, ELLE N'EST PAS FIXEE. Une hauteur en points
           recadre les grands telephones et ecrase les petits ; une hauteur minimale
           en unites de vue laisse la photo respirer partout, et l'espace du milieu
           pousse les gestes en bas. */
        /* LA POLICE EST CELLE DE LA MAQUETTE, ET ELLE ETAIT DEJA LA. « La
           police de caractere n'est pas la meme que sur le mockup de depart. »
           La maquette est ecrite en Poppins, que le site charge deja sous le nom
           --font-clikme ; cet ecran heritait de la police du corps de page. On
           la pose sur le cadre entier : tout ce qui est dedans ecrit font:inherit
           ou font-family:inherit, donc les gestes du bas suivent. */
        .mu-res{position:relative;display:flex;flex-direction:column;
          min-height:min(880px,94vh);margin-top:0;border-radius:24px;
          overflow:hidden;background:#05070E;isolation:isolate;
          font-family:var(--font-clikme),'Inter',system-ui,sans-serif;}
        /* ELLE DESCEND D'UN DIXIEME, ET C'EST LA SEULE FACON DE DEGAGER LE
           TITRE. Une photo verticale dans un cadre plus vertical encore se
           recadre sur les COTES : la position de l'objet n'a alors aucune prise
           la hauteur, et la tete reste collee en haut — sous « Alors, ca vous
           plait ? », qui s'ecrivait donc en travers du visage. Mesure faite a
           414 points. On pousse l'image, et le dixieme liberee devient le fond
           sombre sur lequel le titre se lit. */
        /* LE FOND : LA MEME PHOTO, AGRANDIE ET FLOUTEE, SUR TOUT LE CADRE.
           C'est lui qui rend l'ecran immersif sans coller la tete au titre —
           voir la note du composant. Il est assombri, parce qu'il est un decor
           et non le sujet : a pleine lumiere il volait l'attention de la photo
           nette posee dessus. */
        .mu-res-fond{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;object-position:center 30%;z-index:0;
          filter:blur(26px) saturate(1.25) brightness(.52);
          transform:scale(1.18);}
        /* LA PHOTO NETTE, DESCENDUE DE CE QU'IL FAUT POUR QUE LA TETE TOMBE
           SOUS LE SOUS-TITRE. Son bord du haut se dissout dans le flou : sans
           le masque, on voyait une arete horizontale en travers de l'ecran,
           c'est-a-dire exactement ou la photo commence. */
        .mu-res-ph{position:absolute;left:0;right:0;top:15%;width:100%;
          height:100%;object-fit:cover;object-position:center top;z-index:0;
          -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 11%);
          mask-image:linear-gradient(180deg,transparent 0,#000 11%);}
        /* DEUX VOILES, UN EN HAUT ET UN EN BAS, ET RIEN AU MILIEU. Le titre et
           les gestes ont besoin d'un fond ; le visage n'a besoin de rien. Un
           voile uniforme aurait assombri la seule chose qu'on vient voir. */
        /* LE VOILE DU HAUT TIENT JUSQU'AU BAS DU SOUS-TITRE, ET C'EST LA
           SECONDE MOITIE DE LA CORRECTION. « Alors, ca vous plait ? » passait
           sur la tete de la personne : a dix-sept pour cent le voile n'etait
           deja plus qu'a moitie opaque, et le titre se lisait sur un visage.
           La zone du titre occupe les vingt-six premiers pour cent ; le voile
           les couvre, puis se retire d'un coup pour ne pas assombrir le
           vetement, qui est la seule chose qu'on est venu voir. */
        /* LE VOILE S'ALLEGE EN HAUT, PARCE QUE LE FOND FLOU FAIT DEJA LE
           TRAVAIL. Empiles, les deux donnaient un bandeau noir opaque la ou la
           maquette montre une image. Il ne reste que ce qu'il faut pour que le
           titre tienne, et le bas garde son aplat pour les gestes. */
        .mu-res-voile{position:absolute;inset:0;z-index:1;pointer-events:none;
          background:linear-gradient(180deg,rgba(5,7,14,.78) 0%,
            rgba(5,7,14,.6) 13%,rgba(5,7,14,.3) 23%,rgba(5,7,14,.08) 32%,
            transparent 40%,
            transparent 47%,rgba(5,7,14,.62) 63%,rgba(5,7,14,.94) 76%,
            #05070E 87%);}
        /* ═══ CE QUI EST DANS LE FLUX, NOMME UN PAR UN ════════════════════

           CETTE REGLE ETAIT UNE LISTE DE CE QUI N'EST PAS DANS LE FLUX, et
           c'est l'inverse qu'il fallait ecrire. Elle disait « tous les enfants
           SAUF la photo, le fond, le voile, l'eclat et la bulle sont en
           position relative » : autrement dit, tout calque ajoute plus tard
           tombait dedans et se faisait REPOSITIONNER SANS QU'ON LE DEMANDE.

           TROIS DEGATS, MESURES AU NAVIGATEUR, ET ILS ONT L'AIR DE TROIS
           DEFAUTS DIFFERENTS :

             1. La surface qui ouvre la photo en grand, mu-res-ouvrir,
                passait d'absolue a relative : hauteur ZERO. « Quand je touche
                la photo je ne la vois pas entierement » — normal, la zone
                n'existait plus.
             2. Sa legende, mu-res-loupe, devenait un bloc en pleine largeur
                DANS le flux. Ses coordonnees ne la placaient plus : elles la
                decalaient. Mesure : x=2 au lieu de 16, c'est-a-dire quatorze
                points HORS de l'ecran a gauche, sous le titre. « Le texte voir
                en entier est cache. »
             3. Et comme elle etait dans le flux, elle y prenait ses trente-deux
                points de hauteur, au-dessus de la barre du haut. C'est la
                « enorme perte de place en haut » : une bande vide creee par une
                pastille qu'on ne voyait pas.

           ON NOMME DONC LES QUATRE QUI SONT VRAIMENT DANS LE FLUX. Une liste
           blanche se trompe dans le sens sur : un calque oublie reste un
           calque, il ne devient pas une ligne de mise en page. */
        .mu-res-haut,.mu-res-t,.mu-res-vide,.mu-res-bas{
          position:relative;z-index:2;}

        /* LA REVELATION : un eclat qui balaie l'image UNE FOIS, puis disparait.
           En boucle, il devient un defaut d'ecran au troisieme tour. */
        .mu-res-eclat{position:absolute;inset:0;z-index:1;pointer-events:none;
          opacity:0;background:linear-gradient(168deg,transparent 34%,
            rgba(255,255,255,.34) 50%,transparent 66%);}
        .mu-res.revele .mu-res-eclat{animation:muResEclat .95s ease-out .1s both;}
        @keyframes muResEclat{0%{opacity:0;transform:translateY(-38%);}
          35%{opacity:1;}100%{opacity:0;transform:translateY(38%);}}
        .mu-res.revele .mu-res-ph{animation:muResOuvre .7s cubic-bezier(.16,1,.3,1) both;}
        @keyframes muResOuvre{from{transform:scale(1.06);opacity:0;}
          to{transform:scale(1);opacity:1;}}
        .mu-res.revele .mu-res-t,.mu-res.revele .mu-res-bas{
          animation:muApres .5s ease .4s both;}

        /* LA BARRE DU HAUT : la fleche, l'avancement, la croix. Elle remplace
           la frise numerotee de la page, masquee sur cet ecran — deux
           indicateurs d'avancement pour un seul ecran, c'est un de trop. */
        .mu-res-haut{display:flex;align-items:center;gap:14px;
          padding:16px 16px 0;}
        .mu-res-rond{flex:none;width:44px;height:44px;border-radius:50%;
          display:grid;place-items:center;font:inherit;font-size:19px;
          line-height:1;cursor:pointer;color:#fff;
          background:rgba(12,16,26,.62);border:1px solid rgba(255,255,255,.16);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .mu-res-rond:active{transform:scale(.94);}
        .mu-res-rond:focus-visible{outline:2px solid #fff;outline-offset:2px;}
        .mu-res-jauge{flex:1 1 auto;height:5px;border-radius:999px;
          background:rgba(255,255,255,.2);overflow:hidden;}
        .mu-res-jauge i{display:block;width:72%;height:100%;border-radius:999px;
          background:linear-gradient(90deg,#6D28D9,#9D4EDD 46%,#F0269B);}

        /* IL MONTE, ET IL N'ATTEND PLUS LA BULLE DE LA CLOCHE. « Place le
           titre et la phrase encore un peu plus haut. » La bulle etait dans le
           flux entre la barre et le titre, donc elle le poussait de quarante
           points ; elle est repassee en absolu, sous la cloche. */
        .mu-res-t{padding:6px 10px 0;text-align:center;}
        /* A HUIT POUR CENT DE LA LARGEUR IL PASSAIT A LA LIGNE — mesure a 414
           points : « Alors, ca vous / plait ? ». Un titre coupe en deux n'est
           plus un titre, et celui-la est la question de l'ecran. */
        /* LA CHASSE ET LA COULEUR SONT CELLES DE LA MAQUETTE. J'avais serre
           les lettres de trois centiemes et choisi un rose plus sourd : le
           titre paraissait condense et delave a cote de l'original, qui laisse
           les lettres respirer et pousse le fuchsia. */
        .mu-res-t h2{margin:0;font-size:clamp(25px,7.1vw,33px);line-height:1.1;
          font-weight:800;letter-spacing:-.008em;color:#fff;
          text-shadow:0 2px 18px rgba(0,0,0,.6);}
        .mu-res-t h2 b{color:#FB18AE;font-weight:800;}
        /* « Touchez un fantome pour donner votre avis » passait a la ligne a
           414 points, et « avis » restait seul sur la seconde. */
        .mu-res-t p{margin:7px auto 0;max-width:330px;font-size:13.5px;
          line-height:1.3;font-weight:600;color:#E3E9F3;
          text-shadow:0 1px 12px rgba(0,0,0,.85);}

        /* L'ESPACE QUI POUSSE LE BAS EN BAS. Il a une hauteur minimale pour que
           la photo garde de la place meme sur un ecran court : sans elle, les
           gestes remontent jusqu'au titre et l'image disparait. */
        /* IL POUSSE LES GESTES EN BAS, MAIS IL CEDE QUAND UN PANNEAU S'OUVRE.
           A cent cinquante points incompressibles, l'avis demande repoussait
           les fantomes par-dessus le visage plutot que de manger le vide. */
        .mu-res-vide{flex:1 1 auto;min-height:60px;}
        .mu-res-bas{padding:0 16px 14px;}

        /* ═══ LES CINQ FANTOMES, A CHEVAL SUR LA PHOTO ═════════════════════

           LA MAQUETTE LES POSE SUR L'IMAGE, a hauteur des mains, et ce n'est pas
           un effet : poses EN DESSOUS ils appartiendraient au formulaire ; poses
           DESSUS ils appartiennent au moment. C'est ce qui fait qu'on les touche
           sans y penser — et toucher sans y penser est exactement ce qu'on
           demande d'une reaction.

           CINQ COLONNES EGALES, ET PAS UN FLEX. « Coup de coeur » est deux fois
           plus long que « Bof » : en flex, sa colonne s'elargissait et les cinq
           fantomes n'etaient plus a egale distance. */
        .mu-note-f.res{display:grid;grid-template-columns:repeat(5,1fr);
          gap:4px;align-items:start;}
        .mu-note-f.res button{width:100%;height:auto;gap:6px;
          grid-auto-flow:row;padding:2px 0 0;}
        /* PLUS PETITS, ET C'EST DU VETEMENT QU'ON GAGNE. « Les fantomes
           pourraient etre un peu plus petits pour gagner de la place en bas. »
           A soixante-huit points ils occupaient, avec leur libelle, cent
           trente points de photo — c'est-a-dire le bas de la tenue. */
        .mu-note-f.res .mu-note-s{width:100%;max-width:54px;height:auto;
          aspect-ratio:64/70;}
        /* ═══ LE TUBE NEON, ET C'EST CE QUI MANQUAIT LE PLUS ════════════════

           SUR LA MAQUETTE, CHAQUE FANTOME ALLUME EST UNE ENSEIGNE : un corps
           presque blanc, un TRAIT MAGENTA tout autour, et la lueur du tube qui
           deborde. Le mien etait un aplat pale sans contour — la meme forme,
           mais eteinte, et c'est pour ca qu'ils paraissaient etranges.

           LE TRAIT EST DESSINE PAR-DESSUS LE REMPLISSAGE, donc sa moitie
           interieure mord sur le corps : c'est exactement ce que fait un tube
           de verre, et c'est ce qui evite le lisere fantome qu'on obtient en
           doublant la forme. */
        .mu-note-f.res .mu-f-corps{fill:#FBF0FB;stroke:#EE2BDE;stroke-width:2;
          stroke-linejoin:round;}
        /* L'ENCRE DU VISAGE EST UN VIOLET PROFOND, PAS UN BLEU D'ENCRE. La
           maquette les dessine dans le meme violet que l'enseigne assombrie ;
           en bleu marine, ils tiraient vers le pictogramme d'interface. */
        .mu-note-f.res .mu-f-trait{fill:none;stroke:#4A1060;stroke-width:3.4;
          stroke-linecap:round;}
        .mu-note-f.res .mu-f-bouche2{fill:none;stroke:#4A1060;stroke-width:3.8;
          stroke-linecap:round;}
        .mu-note-f.res .mu-f-oeil{fill:#4A1060;}
        .mu-note-f.res button em{font-style:normal;font-size:11.5px;
          line-height:1.16;font-weight:700;color:#D6DFEC;
          text-shadow:0 1px 8px rgba(0,0,0,.85);transition:color .16s ease;}
        .mu-note-f.res button.on em{color:#fff;font-weight:800;}
        /* ETEINT, LE FANTOME PERD SON TUBE ET SA LUEUR : c'est la seule chose
           qui separe les deux etats sur la maquette, ou le cinquieme est gris
           et plat pendant que les quatre autres brillent. */
        .mu-note-f.res .mu-note-s{opacity:.72;
          filter:drop-shadow(0 2px 10px rgba(0,0,0,.75));}
        .mu-note-f.res button:not(.on) .mu-note-s .mu-f-corps{fill:#C8CEDC;
          stroke:none;}
        /* LE HALO EST UNE LUEUR SUR LE DESSIN, PAS UNE OMBRE SUR LE BOUTON :
           pose sur le bouton, il faisait un carre lumineux autour d'une forme
           arrondie. ET IL EST SERRE : a vingt-quatre points de diffusion, les
           quatre lueurs voisines se rejoignaient en une seule tache rose en
           travers de la photo. */
        /* ET IL S'EST RESSERRE UNE FOIS DE PLUS. A sept points de diffusion
           sur un fantome de soixante, la lueur COMBLAIT les deux encoches du
           bas : les trois pieds se rejoignaient en un socle plat, et le
           fantome redevenait le dome qu'on lui reprochait. */
        .mu-note-f.res button.on .mu-note-s{opacity:1;
          filter:drop-shadow(0 0 4px rgba(238,43,222,.9))
            drop-shadow(0 0 11px rgba(238,43,222,.4));}
        /* LE CINQUIEME GARDE SES COEURS MEME ETEINT : c'est ce qui dit, avant
           meme qu'on lise le mot, qu'il ne fait pas partie de l'echelle. Sur la
           maquette ils sont rouge sombre sur le corps gris. */
        .mu-note-f.res button:last-child .mu-note-s .mu-f-oeil{fill:#6E0B3A;}
        .mu-note-f.res button.on:last-child .mu-note-s .mu-f-oeil{fill:#C4006A;}
        .mu-note-f.res button.on:last-child .mu-note-s .mu-f-corps{fill:#FDEFF8;}

        /* ═══ LA BULLE DU MOT, ANCREE SOUS LE FANTOME TOUCHE ═══════════════

           LA FLECHE POINTE LE BON FANTOME, et c'est tout l'interet de la
           maquette : la bulle repond a ce qu'on vient de toucher. Les cinq
           occupent cinq colonnes egales dans la meme largeur que la bulle, donc
           le centre du n-ieme est a (n + 0,5) x 20 % — --i vaut n a partir de
           zero. Une fleche qui pointe a cote annule le gain. */
        .mu-res-mot{position:relative;margin-top:16px;border-radius:22px;
          padding:14px;color:#EAF0F6;background:rgba(10,14,24,.82);
          border:1px solid rgba(255,255,255,.18);
          -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
          box-shadow:0 22px 44px -20px rgba(0,0,0,.85);
          animation:muResMot .28s cubic-bezier(.16,1,.3,1) both;}
        .mu-res-mot::before{content:"";position:absolute;top:-7px;
          left:calc((var(--i) + .5) * 20%);width:14px;height:14px;
          margin-left:-7px;transform:rotate(45deg);border-radius:3px;
          background:rgba(10,14,24,.82);
          border-left:1px solid rgba(255,255,255,.18);
          border-top:1px solid rgba(255,255,255,.18);}
        @keyframes muResMot{
          from{opacity:0;transform:translateY(-8px) scale(.97);}
          to{opacity:1;transform:none;}}
        @media (prefers-reduced-motion:reduce){
          .mu-res-mot{animation:none;}}

        /* LA TETE DE LA BULLE : le fantome qu'on vient de toucher, le mot qui va
           avec, et la croix. Le fantome REPETE le geste — c'est ce qui fait que
           la bulle se lit comme une reponse et non comme un formulaire. */
        .mu-res-mot-t{display:flex;align-items:center;gap:11px;}
        /* IL REPREND LE DESSIN DE L'ECHELLE, PAS SES COULEURS PAR DEFAUT. Les
           remplissages vivent sous .mu-note-f.res ; sans ces quatre lignes, le
           meme fantome sortait en silhouette noire dans la bulle. */
        .mu-res-mot-f{flex:none;width:38px;height:36px;}
        .mu-res-mot-f .mu-f-corps{fill:#F3F0FF;}
        .mu-res-mot-f .mu-f-oeil{fill:#2A1E4D;}
        .mu-res-mot-f .mu-f-trait{fill:none;stroke:#2A1E4D;stroke-width:3.2;
          stroke-linecap:round;stroke-linejoin:round;}
        .mu-res-mot-f .mu-f-bouche2{fill:none;stroke:#2A1E4D;stroke-width:3.4;
          stroke-linecap:round;}
        .mu-res-mot-t span{flex:1 1 auto;min-width:0;display:block;}
        .mu-res-mot-t b{display:block;font-size:15px;font-weight:900;
          color:#fff;line-height:1.15;}
        .mu-res-mot-t em{display:block;margin-top:2px;font-style:normal;
          font-size:12px;font-weight:650;color:#9FB0C4;line-height:1.25;}
        .mu-res-mot-x{flex:none;width:30px;height:30px;border-radius:50%;
          display:grid;place-items:center;font:inherit;font-size:13px;
          font-weight:800;cursor:pointer;color:#8A9AAE;background:none;
          border:1px solid rgba(255,255,255,.16);}
        .mu-res-mot-x:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}

        .mu-res-champ{position:relative;margin-top:12px;border-radius:16px;
          padding:11px 12px 8px;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.14);display:block;}
        .mu-res-champ textarea{display:block;width:100%;resize:none;
          font:inherit;font-size:14.5px;line-height:1.45;color:#EAF0F6;
          background:transparent;border:0;padding:0;}
        .mu-res-champ textarea::placeholder{color:#8496A8;}
        .mu-res-champ textarea:focus-visible{outline:none;}
        .mu-res-champ s{display:block;text-align:right;text-decoration:none;
          font-size:11px;font-weight:700;color:#7D8FA3;}
        .mu-res-champ:focus-within{border-color:rgba(201,188,255,.6);}

        /* LA SEULE CHOSE GARDEE CONTRE LA MAQUETTE : sans elle, on publierait
           la photo de quelqu'un sur le mur d'un commerce parce qu'il a touche un
           fantome. Elle vit DANS la bulle, juste au-dessus du bouton qui envoie
           — c'est-a-dire a l'endroit ou l'on decide ce qui partira. */
        .mu-res-part{display:flex;align-items:center;gap:10px;width:100%;
          margin-top:10px;font:inherit;font-size:12.5px;line-height:1.35;
          text-align:left;font-weight:650;cursor:pointer;color:#8FA0B4;
          background:none;border:0;padding:6px 2px;}
        .mu-res-part i{flex:none;display:grid;place-items:center;width:20px;
          height:20px;border-radius:6px;font-style:normal;font-size:12px;
          font-weight:900;color:#0A1210;background:transparent;
          border:1.5px solid rgba(255,255,255,.28);}
        .mu-res-part.on{color:#C3D0DE;}
        .mu-res-part.on i{background:#C9BCFF;border-color:#C9BCFF;}
        .mu-res-part:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}

        .mu-res-valider{display:block;width:100%;margin-top:4px;font:inherit;
          font-size:14.5px;font-weight:850;cursor:pointer;color:#231238;
          background:#F0EAFF;border:0;border-radius:999px;padding:12px;
          transition:transform .12s ease;}
        .mu-res-valider:active{transform:scale(.98);}
        .mu-res-valider:focus-visible{outline:2px solid #C9BCFF;
          outline-offset:3px;}

        /* ═══ LA CLOCHE, ET SA PASTILLE ════════════════════════════════════

           ELLE DIT SON ETAT SANS LA COULEUR. Muette, une croix ; armee, une
           coche et un aplat rose. Un bouton qui ne change que de teinte ne se
           lit pas sur une photo, ou le fond varie d'une image a l'autre. */
        .mu-res-cloche{position:relative;}
        .mu-res-cloche .mu-tr{width:21px;height:21px;}
        .mu-res-cloche i{position:absolute;right:-1px;bottom:-1px;width:17px;
          height:17px;border-radius:50%;display:grid;place-items:center;
          font-style:normal;font-size:10px;font-weight:900;color:#231238;
          background:#F0EAFF;border:2px solid rgba(10,14,24,.85);}
        .mu-res-cloche.on{border-color:rgba(240,38,155,.7);
          background:rgba(240,38,155,.22);}
        .mu-res-cloche.on i{background:#F0269B;color:#fff;}

        /* SA BULLE DIT CE QUE LE PICTOGRAMME NE PEUT PAS DIRE.

           ELLE EST DANS LE FLUX, SOUS LA BARRE, ET C'EST UNE CORRECTION. Posee
           en absolu sous la cloche, elle traversait « Alors, ca vous plait ? »
           en diagonale : a cette hauteur, la moitie droite de l'ecran
           appartient deja au titre. Rangee entre la barre et le titre, calee a
           droite, elle garde sa fleche sur la cloche et ne recouvre plus rien.

           ET ELLE NE DISPARAIT PAS, ELLE CHANGE DE PHRASE. Retiree une fois la
           chose demandee, elle aurait fait remonter le titre d'un cran au
           moment meme ou l'on regarde ailleurs. */
        /* ═══ LA BULLE DE LA CLOCHE : ELLE SE LAISSE LIRE, PUIS ELLE PART ══

           « La cloche en haut ne donne plus le message pour dire a quoi elle
           sert. » Elle le donnait, mais trop tot et trop peu : posee a la
           seconde zero, ses trois secondes s'ecoulaient PENDANT la revelation
           de la photo — quand personne ne regarde encore le coin superieur. Le
           temps d'arriver au bouton, elle etait deja partie.

           ELLE ATTEND DONC LA FIN DE LA REVELATION (une seconde), puis tient
           quatre secondes pleines. Et elle repart pour le meme tour a chaque
           appui sur la cloche, parce que c'est la reponse a CE geste-la qu'on
           veut lire.

           ET ELLE EST EN ABSOLU, SOUS LA CLOCHE. Rangee dans le flux entre la
           barre et le titre, elle poussait le titre de quarante points vers le
           bas — c'est-a-dire l'inverse de ce qu'on demandait. */
        /* SON BORD DROIT TOMBE SUR CELUI DE LA CLOCHE, ET SA POINTE SUR SON
           CENTRE. Calee sur le bord de la carte, elle passait sous la CROIX :
           l'infobulle designait le mauvais bouton, ce qui est pire que pas
           d'infobulle. Seize points de marge, plus la croix (quarante-quatre)
           et l'ecart (quatorze) : soixante-quatorze. */
        /* ELLE DESCEND SOUS LE SOUS-TITRE, PARCE QUE LE TITRE EST MONTE.
           Elle se posait a soixante points, c'est-a-dire juste sous la barre —
           l'endroit ou il n'y avait rien tant qu'une bande vide de trente-deux
           points separait la barre du titre. Cette bande etait un defaut, elle
           a ete corrigee, et la bulle s'est retrouvee en travers de « ca vous
           plait ? » : la question de l'ecran, masquee par une infobulle. Elle
           se pose maintenant sur le haut de la photo, ou elle ne cache que du
           flou, et sa fleche continue de designer la cloche. */
        .mu-res-bulle{position:absolute;z-index:9;top:146px;right:74px;
          width:max-content;max-width:150px;border-radius:14px;
          padding:8px 11px;font-size:11.5px;font-weight:700;line-height:1.3;
          color:#EDF2F8;background:rgba(10,14,24,.92);
          border:1px solid rgba(255,255,255,.18);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
          box-shadow:0 14px 30px -14px rgba(0,0,0,.9);
          pointer-events:none;animation:muResBulle 6s ease both;}
        @keyframes muResBulle{
          0%{opacity:0;transform:translateY(-6px);}
          16%{opacity:0;transform:translateY(-6px);}
          24%{opacity:1;transform:none;}
          88%{opacity:1;transform:none;}
          100%{opacity:0;transform:translateY(-4px);}}
        @media (prefers-reduced-motion:reduce){
          .mu-res-bulle{animation:muResBulleFixe 6s linear both;}
          @keyframes muResBulleFixe{0%,16%{opacity:0;}24%,88%{opacity:1;}
            100%{opacity:0;}}}
        /* ELLE EST COLLEE A LA CLOCHE, ET C'EST UNE CORRECTION. Je l'avais
           descendue sous le sous-titre pour qu'elle ne recouvre pas le titre :
           elle se retrouvait au milieu de l'ecran, sans rapport visible avec le
           bouton qu'elle explique — « etrangement situee, pas du tout a cote de
           la cloche ». Une infobulle detachee de sa chose n'explique plus rien.

           ELLE REPASSE DONC SOUS LA CLOCHE, ET ELLE PASSE PAR-DESSUS. Le titre
           est en dessous quatre secondes, puis elle s'efface : c'est ce que
           fait une infobulle, et c'est bien moins couteux que de la perdre. */
        .mu-res-bulle::after{content:"";position:absolute;top:-6px;right:16px;
          width:12px;height:12px;transform:rotate(45deg);border-radius:3px;
          background:rgba(10,14,24,.92);
          border-left:1px solid rgba(255,255,255,.18);
          border-top:1px solid rgba(255,255,255,.18);}
        .mu-res-bulle.on{color:#FFD9EE;border-color:rgba(240,38,155,.5);}

        /* ═══ POURQUOI CLIKME A CHOISI, ET L'AVIS QU'ON LUI DEMANDE ═════════

           DEUX PANNEAUX, DEUX PARCOURS, UNE SEULE FORME. Ils ne peuvent jamais
           apparaitre ensemble — l'un justifie un choix de la machine, l'autre
           repond a une question du client — donc ils partagent la mise en page
           et se distinguent par la couleur du liseré : violet quand ClikMe
           parle de lui, neutre quand il repond. */
        /* ═══ LA PHOTO SEULE, SANS RIEN AUTOUR ════════════════════════════

           « Est-ce que je pourrais voir la photo en entier sans rien autour —
           aucun texte ni icone — afin de voir les vetements ? »

           LA SURFACE EST LE GESTE, la pastille n'est que la legende. Un appui
           n'importe ou sur l'image l'ouvre : c'est ce qu'on fait d'instinct
           devant une photo. Le « ⤢ » du coin l'apprend a qui ne le tenterait
           pas ; il ne recoit aucun appui lui-meme, ce qui evite d'avoir a viser
           vingt points pour une chose qu'on veut faire avec le pouce.

           LA ZONE S'ARRETE AVANT LES GESTES. Elle couvre le haut de l'ecran,
           la ou il n'y a rien d'autre a toucher, et laisse les fantomes et les
           boutons tranquilles. */
        /* ELLE PORTE SES MOTS. Un « agrandir » seul est un symbole qu'il faut
           avoir appris ailleurs ; trois mots disent ce qui va se passer, et
           c'etait la demande — « d'une maniere tres intuitive et claire ». */
        /* ELLE SE POSE A GAUCHE, SUR LE HAUT DE LA PHOTO. La photo nette
           commence a quinze pour cent de la hauteur : la pastille se cale juste
           en dessous, ou il n'y a ni titre ni sous-titre — les deux sont
           centres et s'arretent avant les bords.
           A DROITE, ELLE RENCONTRAIT LA BULLE DE LA CLOCHE : mesure a la
           capture, les deux occupaient la meme bande de trente points. Le coin
           droit appartient a la cloche, qui y a son bouton et sa legende ; le
           gauche est libre. */
        /* ELLE PORTE LE GESTE, ET PLUS SEULEMENT SA LEGENDE. Elle recoit donc
           les appuis — et elle est la SEULE a les recevoir : la surface qui
           couvrait les deux tiers du cadre volait ceux des fantomes et des
           boutons. Cent trente points de large avec ses mots : on ne la vise
           pas, on la touche. */
        .mu-res-loupe{position:absolute;z-index:6;left:14px;top:calc(15% + 44px);
          display:inline-flex;align-items:center;gap:6px;cursor:pointer;
          height:34px;padding:0 13px 0 10px;border-radius:999px;font:inherit;
          font-size:12px;font-weight:700;letter-spacing:-.01em;color:#EAF0F6;
          background:rgba(10,14,24,.72);border:1px solid rgba(255,255,255,.24);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .mu-res-loupe.on{top:14px;color:#FFFFFF;background:#F0269B;
          border-color:rgba(255,255,255,.4);}
        .mu-res-loupe:active{transform:scale(.96);}
        .mu-res-loupe:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}
        .mu-res-loupe i{font-style:normal;font-size:15px;line-height:1;}

        /* ═══ ET LA VOICI, BORD A BORD ════════════════════════════════════

           RIEN D'AUTRE A L'ECRAN. Pas de titre, pas de fantomes, pas de
           gestes : c'est la seule facon de voir tomber un pantalon ou la
           longueur d'une jupe. La croix est la pour dire qu'on peut sortir ;
           l'appui se prend sur toute la surface. */
        /* IL COUVRE LA CARTE, PAS L'ECRAN. Un plein ecran ne montrait pas plus :
           une silhouette debout dans un cadre deux fois plus haut que large y
           etait rognee sur les cotes ou minuscule entre deux bandes noires. Ici
           la photo garde sa place et passe seulement en « contenir » — donc
           entiere — par-dessus le titre, les fantomes et les gestes. */
        .mu-plein{position:absolute;inset:0;z-index:5;display:grid;
          place-items:center;padding:12px;background:#05070E;cursor:zoom-out;
          border-radius:24px;animation:muApres .22s ease both;}
        .mu-plein img{max-width:100%;max-height:100%;width:auto;height:auto;
          object-fit:contain;border-radius:14px;display:block;}

        /* ═══ CE QUE « RESERVER » A FAIT ══════════════════════════════════

           « "Reserver cet article" ne marche pas et n'ouvre pas WhatsApp. »

           IL MARCHAIT, ET IL NE SE VOYAIT PAS : sur un numero de fiction — et
           tous les commerces de la maquette en ont un — on n'ouvre jamais
           WhatsApp, et le resultat partait dans un etat que seul l'ancien ecran
           « Et maintenant ? » savait afficher. Il s'ecrit donc ici, sur l'ecran
           ou l'on vient d'appuyer.

           LE MESSAGE EST MONTRE EN ENTIER, dans son cadre, parce que c'est lui
           la reponse : on veut savoir ce qui serait parti chez le commercant. */
        .mu-res-wa{border-radius:18px;padding:13px 15px;margin:0 0 14px;
          background:rgba(14,12,20,.94);border:1px solid rgba(255,255,255,.14);
          border-left:3px solid #25D366;
          -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
          box-shadow:0 18px 40px -18px rgba(0,0,0,.9);
          animation:muApres .3s ease both;}
        .mu-res-wa>b{display:block;font-size:13.5px;font-weight:850;
          color:#fff;line-height:1.3;}
        .mu-res-wa em{display:block;margin-top:7px;font-style:normal;
          font-size:12px;line-height:1.42;color:#A8B8CA;}
        .mu-res-wa em s{text-decoration:line-through;color:#8496A8;}
        .mu-res-wa q{display:block;margin-top:9px;border-radius:4px 14px 14px 14px;
          padding:10px 12px;font-size:12.6px;line-height:1.45;color:#E9F5EC;
          background:rgba(37,211,102,.12);
          border:1px solid rgba(37,211,102,.3);quotes:none;}
        .mu-res-wa>button{margin-top:11px;font:inherit;font-size:12.5px;
          font-weight:750;cursor:pointer;color:#9FB0C4;background:none;
          border:0;padding:5px 2px;text-decoration:underline;
          text-underline-offset:3px;}
        .mu-res-wa>button:focus-visible{outline:2px solid #C9BCFF;
          outline-offset:2px;}

        /* ═══ « CHOIX CLIKME » EST UNE PASTILLE, PUIS UNE FEUILLE ══════════

           « La note de l'IA est en plein milieu de la photo et ca empeche
           d'apprecier le vetement : on devrait avoir juste un bouton qui ouvre
           la pop-up, qu'on pourra fermer aussi pour voir le vetement en
           entier. »

           DEUX FOIS J'AI DEPLACE CE PANNEAU, ET DEUX FOIS IL A MANGE LA PHOTO.
           La cause n'etait pas sa place : c'est qu'il etait OUVERT d'office.
           Quatre lignes de texte sur un ecran dont le seul sujet est une image
           prennent toujours trop de place, ou qu'on les mette. */
        .mu-choix-p{display:inline-flex;align-items:center;gap:7px;
          margin:0 0 12px;font:inherit;font-size:12.5px;font-weight:800;
          cursor:pointer;color:#fff;border-radius:999px;padding:8px 13px;
          background:rgba(12,10,20,.78);border:1.5px solid #C84BD6;
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
          transition:background .16s ease;}
        .mu-choix-p i{font-style:normal;font-size:12px;}
        .mu-choix-p b{color:#FB18AE;font-weight:850;}
        /* LE CHEVRON EST DESSINE, PAS ECRIT : le caractere « › » de Poppins
           sort a la taille d'un point sur un fond sombre. Il se retourne quand
           la feuille est ouverte, pour dire que le meme bouton la referme. */
        .mu-choix-p s{display:block;width:6px;height:6px;flex:none;
          border-top:2px solid #FB18AE;border-right:2px solid #FB18AE;
          transform:rotate(135deg);margin-top:-3px;
          transition:transform .2s ease,margin .2s ease;}
        .mu-choix-p.on{background:rgba(200,75,214,.22);}
        .mu-choix-p.on s{transform:rotate(-45deg);margin-top:3px;}
        .mu-choix-p:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}

        /* LA FEUILLE : elle dit tout d'un coup, et elle se ferme. Plus de
           « Pourquoi ? » a deplier dans un panneau deja deplie — un seul
           niveau, une seule croix. */
        .mu-choix,.mu-conseil{position:relative;border-radius:18px;
          padding:13px 15px;margin:0 0 14px;
          background:rgba(14,12,20,.93);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
          box-shadow:0 18px 40px -18px rgba(0,0,0,.9);
          animation:muChoix .32s cubic-bezier(.16,1,.3,1) both;}
        @keyframes muChoix{
          from{opacity:0;transform:translateY(10px) scale(.98);}
          to{opacity:1;transform:none;}}
        @media (prefers-reduced-motion:reduce){
          .mu-choix,.mu-conseil{animation:none;}}
        .mu-choix>b,.mu-conseil>b{display:flex;align-items:center;gap:6px;
          font-size:13px;font-weight:850;letter-spacing:-.01em;color:#FB18AE;}
        .mu-conseil>b{color:#C9BCFF;align-items:flex-start;}
        /* LE METIER SOUS LE NOM, ET EN PLUS PETIT. C'est lui qui dit pourquoi
           cet avis vaut la peine d'etre lu ; ecrit sur la meme ligne, il
           passerait pour une precision entre parentheses. */
        .mu-conseil>b span{display:block;line-height:1.2;}
        .mu-conseil>b em{display:block;margin-top:1px;font-style:normal;
          font-size:10.5px;font-weight:700;letter-spacing:.01em;color:#9AA7BE;}
        .mu-conseil-s{margin-top:1px;}
        .mu-choix>b i{font-style:normal;font-size:13px;}
        .mu-choix-x{margin-left:auto;flex:none;width:26px;height:26px;
          border-radius:50%;display:grid;place-items:center;font:inherit;
          font-size:12px;font-weight:800;cursor:pointer;color:#9FB0C4;
          background:none;border:1px solid rgba(255,255,255,.16);}
        .mu-choix-x:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}
        .mu-conseil-s{flex:none;width:16px;height:16px;}
        .mu-conseil-s .mu-f-corps{fill:#C9BCFF;}
        .mu-conseil-s .mu-f-oeil{fill:#0A1018;}
        .mu-choix>p,.mu-conseil>p{margin:7px 0 0;font-size:12.8px;
          line-height:1.4;color:#F2F5FA;font-weight:600;}
        .mu-choix>p b{color:#fff;font-weight:850;}
        .mu-conseil-s2{color:#AFBDCE!important;font-size:12px!important;}
        .mu-choix dl{margin:10px 0 0;}
        .mu-choix dt{font-size:10.5px;font-weight:900;letter-spacing:.08em;
          text-transform:uppercase;color:#FB18AE;margin-top:9px;}
        .mu-choix dd{margin:3px 0 0;font-size:12.2px;line-height:1.4;
          color:#E4EAF2;font-weight:600;}
        .mu-conseil-g{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
        .mu-conseil-g>button:not(.mu-conseil-b){margin-top:11px;font:inherit;
          font-size:12.5px;font-weight:750;cursor:pointer;color:#9FB0C4;
          background:none;border:0;padding:5px 2px;text-decoration:underline;
          text-underline-offset:3px;}
        .mu-conseil-b{margin-top:11px;font:inherit;font-size:12.5px;
          font-weight:800;cursor:pointer;color:#fff;border-radius:999px;
          padding:8px 13px;background:transparent;border:1.5px solid #C84BD6;}
        .mu-conseil-b:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}

        /* ═══ LES DEUX PASTILLES DE LA MAQUETTE ════════════════════════════

           PLEINEMENT ARRONDIES, LE PICTOGRAMME A GAUCHE DU MOT, et le mot sur
           deux lignes s'il le faut. J'avais fait trois cartes en colonne,
           pictogramme au-dessus : ca donnait une rangee d'icones d'application
           la ou la maquette pose deux gestes qui se lisent comme des phrases.

           UN SEUL APLAT, ET C'EST CELUI QUI ENGAGE. Le contour de gauche ne
           decide rien — il redemande ou il explique ; le rose de droite fait
           partir la piece. Deux aplats cote a cote ne designeraient rien. */
        .mu-res-g{display:flex;gap:11px;align-items:stretch;margin-top:18px;}
        .mu-res-c{flex:1 1 0;min-width:0;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:7px;font:inherit;
          font-size:11px;font-weight:800;line-height:1.24;cursor:pointer;
          letter-spacing:-.018em;text-align:center;border-radius:22px;
          padding:13px 5px;
          color:#EAF0F6;background:rgba(12,16,28,.62);
          border:1px solid rgba(178,138,255,.42);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          transition:transform .12s ease,background .16s ease;}
        .mu-res-c i{flex:none;display:flex;font-style:normal;font-size:16px;
          line-height:1;}
        .mu-res-c .mu-tr{width:21px;height:21px;}
        /* A DEUX, ILS REPRENNENT LA PASTILLE COUCHEE DE LA MAQUETTE : le
           pictogramme a gauche du mot, comme sur l'ecran « Surprends-moi ».
           A trois, la meme mise en page donnait « Reserver cet article » sur
           trois lignes a cote d'un « Partager » d'une seule, et la rangee
           penchait. */
        .mu-res-g:has(.mu-res-c:nth-child(2):last-child) .mu-res-c{
          flex-direction:row;gap:10px;font-size:14.5px;text-align:left;
          border-radius:999px;padding:14px;}
        .mu-res-c.on{background:rgba(178,138,255,.2);
          border-color:rgba(199,125,240,.75);}
        .mu-res-c.plein{color:#fff;border-color:transparent;
          background:linear-gradient(104deg,#E4189C,#F0269B 58%,#FF3FB0);
          box-shadow:0 18px 38px -16px rgba(240,38,155,.95);}
        /* UNE FOIS MIS DE COTE, LE BOUTON SE CALME. Il garde sa place et son
           mot — « C'est mis de cote » — mais il cesse d'appeler : le geste est
           fait, et un aplat rose qui insiste apres coup se refait toucher. */
        /* UNE FOIS LE GESTE FAIT, LE BOUTON SE CALME. Il garde sa place et
           son mot, mais il cesse d'appeler : un bouton qui insiste apres coup
           se refait toucher. */
        .mu-res-c.fait{background:rgba(240,38,155,.14);
          border-color:rgba(240,38,155,.5);color:#FFD9EE;}
        .mu-res-c.plein.fait{background:rgba(240,38,155,.16);
          border:1px solid rgba(240,38,155,.55);color:#FFD9EE;
          box-shadow:none;cursor:default;}
        .mu-res-c:active{transform:scale(.97);}
        .mu-res-c:focus-visible{outline:2px solid #C9BCFF;outline-offset:3px;}

        /* ═══ LE COEUR QUI S'ENVOLE ════════════════════════════════════════

           IL PART DU BOUTON — les deux variables sont posees a l'instant du
           geste — et il MONTE VERS LE COIN HAUT DROIT, celui de la poche des
           gardes. La trajectoire est la moitie du message : un coeur qui
           grossit sur place dirait « bravo », celui-ci dit ou c'est parti. */
        .mu-res-coeur{position:absolute;z-index:4;left:var(--cx,50%);
          top:var(--cy,70%);width:30px;height:30px;margin:-15px 0 0 -15px;
          pointer-events:none;color:#FF52B8;
          filter:drop-shadow(0 0 10px rgba(240,38,155,.9));
          animation:muResCoeur 1s cubic-bezier(.3,0,.5,1) both;}
        .mu-res-coeur .mu-tr{width:100%;height:100%;fill:currentColor;
          stroke:none;}
        @keyframes muResCoeur{
          0%{opacity:0;transform:translate(0,0) scale(.5);}
          16%{opacity:1;transform:translate(0,-14px) scale(1.3);}
          100%{opacity:0;
            transform:translate(var(--dx,120px),var(--dy,-380px)) scale(.4);}}
        @media (prefers-reduced-motion:reduce){
          .mu-res-coeur{animation:muApres .5s ease both;}}

        /* ═══ LA LIGNE DISCRETE ════════════════════════════════════════════

           LE PICTOGRAMME EST SUR LA MEME LIGNE QUE LE MOT, comme la maquette,
           et les libelles sont courts pour que les trois tiennent sans passer
           a la ligne. Ni fond ni contour : ils ne decident rien. Le trait
           vertical entre eux vient de la maquette. */
        .mu-res-l{display:flex;align-items:stretch;margin-top:14px;}
        .mu-res-l button{flex:1 1 0;min-width:0;display:flex;
          align-items:center;justify-content:center;gap:6px;font:inherit;
          font-size:11px;font-weight:700;letter-spacing:-.02em;color:#C9D5E4;
          cursor:pointer;background:transparent;border:0;padding:9px 1px;
          line-height:1.2;}
        .mu-res-l button span{overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;}
        .mu-res-l button+button{border-left:1px solid rgba(255,255,255,.16);}
        .mu-res-l .mu-tr{width:15px;height:15px;flex:none;}
        .mu-res-l button:active{opacity:.7;}
        .mu-res-l button:focus-visible{outline:2px solid #C9BCFF;
          outline-offset:2px;border-radius:12px;}

        .mu-note-f{display:flex;justify-content:center;gap:6px;}
        .mu-note-f button{display:grid;place-items:center;width:44px;height:44px;
          padding:0;border:none;background:transparent;cursor:pointer;
          border-radius:12px;transition:transform .16s ease;}
        .mu-note-f button:active{transform:scale(.9);}
        .mu-note-f button:focus-visible{outline:2px solid #C9BCFF;outline-offset:1px;}
        /* ETEINT, LE FANTOME EST UN CONTOUR : on voit qu'il y a cinq places a
           remplir, ce qu'un fantome absent ne dirait pas. */
        .mu-note-s{width:30px;height:33px;opacity:.3;
          transition:opacity .16s ease,transform .16s ease,filter .16s ease;}
        .mu-note-s .mu-f-corps{fill:#5A6B7C;}
        .mu-note-s .mu-f-oeil{fill:#0A1210;}
        .mu-note-s .mu-f-bouche{fill:none;stroke:#0A1210;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-note-f button.on .mu-note-s{opacity:1;transform:scale(1.1);
          filter:drop-shadow(0 4px 10px rgba(201,188,255,.5));}
        .mu-note-f button.on .mu-note-s .mu-f-corps{fill:#F3F0FF;}
        .mu-note-f button.on .mu-note-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-note-f button.on .mu-note-s .mu-f-bouche{stroke:#2A1E4D;}
        .mu-note-m{display:block;margin-top:5px;font-style:normal;font-size:12px;
          font-weight:800;color:var(--mu-pale);min-height:1.3em;}

        /* DEMANDER A SES AMIS — le geste qui manquait entre « je prends » et
           « je passe ». On ne choisit pas une monture, une coupe ou un tatouage
           tout seul : c'est le genre de decision ou l'on demande. */
        .mu-e-salon{display:flex;align-items:center;gap:11px;width:100%;
          margin-top:10px;padding:12px 14px;font-family:inherit;cursor:pointer;
          text-align:left;border-radius:15px;
          background:rgba(139,125,246,.14);
          border:1px solid rgba(139,125,246,.4);color:#E5E0FF;}
        .mu-e-salon i{font-style:normal;font-size:19px;line-height:1;}
        .mu-e-salon b{display:block;font-size:14.5px;font-weight:850;}
        .mu-e-salon em{display:block;margin-top:2px;font-style:normal;
          font-size:11.5px;color:#B6AEE6;}
        .mu-e-salon:active{transform:scale(.99);}

        @media (prefers-reduced-motion:reduce){
          .mu-rendu.revele .mu-rendu-i,
          .mu-rendu.revele .mu-rendu-eclat,
          .mu-rendu.revele .mu-rendu-t,
          .mu-rendu.revele .mu-note{animation:none;}
        }

        .mu-rendu{text-align:center;position:relative;}
        .mu-rendu-i{position:relative;display:block;width:100%;padding:0;border:none;
          background:none;cursor:pointer;border-radius:20px;overflow:hidden;
          -webkit-tap-highlight-color:transparent;}
        /* LE RENDU NE SE ROGNE PLUS. Il etait en cover sur trois cents points
           de haut : sur une main a plat, ca coupait deux doigts ; sur un buste,
           la tete. On ne peut pas juger ce qu'on ne voit pas en entier, et c'est
           la seule chose que cet ecran ait a faire. */
        .mu-rendu-i img{width:100%;height:auto;max-height:58vh;object-fit:contain;
          display:block;background:#090D15;}
        /* LES DEUX ETIQUETTES DISENT CE QU'ON REGARDE ET CE QU'ON PEUT FAIRE.
           Sans la seconde, personne ne devine qu'on peut maintenir le doigt —
           et c'est justement le geste qui prouve tout. */
        /* L'ETIQUETTE TIENT DANS SA MOITIE. MESURE : « CARREE ECAILLE, VERRES
           DEGRADES » passait sous le bouton « Agrandir » pose en face — deux
           textes superposes, illisibles tous les deux. Les noms de pieces
           viennent des commercants : on ne peut pas parier sur leur longueur. */
        .mu-rendu-t2{position:absolute;left:10px;top:10px;font-size:10.5px;
          max-width:calc(100% - 128px);white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;
          font-weight:900;letter-spacing:.05em;text-transform:uppercase;
          color:#E9E2FF;background:rgba(20,12,38,.78);border-radius:20px;
          padding:5px 11px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        .mu-rendu-g2{position:absolute;right:10px;bottom:10px;font-size:10.5px;
          font-weight:700;color:#E9E2FF;background:rgba(20,12,38,.7);
          border-radius:20px;padding:5px 11px;
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        /* ON DIT QUE LE RENDU EST SIMULE. Une image presentee comme un essai
           reel alors qu'elle ne l'est pas ferait croire que la mecanique est
           branchee — et c'est la seule chose de cet ecran qui ne l'est pas. */
        /* LE BADGE EST PASSE SOUS L'IMAGE, ET C'EST LA GLISSIERE QUI L'A
           DEPLACE. Il montait de trente points pour se poser sur le bord bas du
           rendu ; ce bord porte maintenant les deux pastilles « Avant » et
           « Apres », et les trois se chevauchaient — mesure faite, la phrase
           « l'essayage n'est pas configure » passait par-dessus les deux mots
           qu'elle rendait illisibles. */
        .mu-rendu-b{display:inline-block;margin-top:10px;position:relative;
          font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;
          color:#E4DCFF;background:rgba(20,12,38,.82);border-radius:20px;
          padding:5px 11px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        /* LE PRIX NE SE COUPE PAS. MESURE : « 159 € » s'affichait « 159 » puis
           « € » a la ligne, parce que le nom de la piece prenait toute la
           largeur et que le prix se repliait comme du texte ordinaire. Un prix
           casse en deux se lit deux fois. */
        .mu-rendu-t{display:flex;align-items:baseline;justify-content:center;gap:9px;
          flex-wrap:wrap;
          margin-top:14px;}
        .mu-rendu-t b{font-size:17px;font-weight:800;}
        .mu-rendu-t em{white-space:nowrap;font-style:normal;font-size:15px;font-weight:800;
          color:var(--mu-ambre);}
        /* LA TAILLE, A COTE DU PRIX, SUR L'ECRAN DU RESULTAT. Elle passe a la
           ligne quand les trois ne tiennent pas — le conteneur se replie deja —
           et c'est le bon ordre : le nom, le prix, puis ce qu'il en reste. */
        .mu-rendu-t s{white-space:nowrap;text-decoration:none;font-size:12.5px;
          font-weight:800;color:var(--mu-menthe);
          background:rgba(61,226,166,.12);border-radius:999px;padding:4px 10px;}
        .mu-rendu-g{display:flex;gap:9px;margin-top:14px;}
        .mu-rendu-g button{flex:1;font-family:inherit;font-size:14px;font-weight:800;
          cursor:pointer;border-radius:24px;padding:14px 12px;border:none;}
        .mu-rendu-g .oui{background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));
          color:#160D28;}
        .mu-rendu-g .non{background:transparent;color:#C7D4E2;
          border:1px solid rgba(255,255,255,.2);}
        .mu-rendu-g button:disabled{opacity:.4;cursor:default;}
        /* LE TROISIEME BOUTON N'EST PAS UN TROISIEME CHOIX. Il repond a une
           autre question que les deux du dessus, donc il ne partage ni leur
           ligne, ni leur poids, ni leur couleur — juste un texte souligne. */
        .mu-rendu-b.rate{background:rgba(255,138,90,.18);color:#FFC9A8;
          border-color:rgba(255,138,90,.4);}
        .mu-calcul-p{display:block;margin-top:6px;font-style:normal;font-size:11.5px;
          font-weight:600;color:var(--mu-pale);}
        .mu-rendu-a{margin:10px 0 0;font-size:12px;line-height:1.5;
          color:#FFC9A8;background:rgba(255,138,90,.12);
          border:1px solid rgba(255,138,90,.28);border-radius:12px;padding:9px 11px;}
        .mu-rendu-r{margin:14px 0 0;font-size:13.5px;line-height:1.55;
          color:#DDE8F4;}
        .mu-rendu-r b{font-weight:800;}
        .mu-rendu-n{margin:12px 0 0;font-size:11.5px;line-height:1.5;
          color:var(--mu-pale);}

        /* AGRANDIR — pose sur le coin de l'image, en face de l'etiquette. */
        .mu-rendu-z{position:absolute;right:10px;top:10px;display:inline-flex;
          align-items:center;gap:5px;font-family:inherit;font-size:10.5px;
          font-weight:800;color:#E9E2FF;cursor:pointer;
          background:rgba(20,12,38,.78);border:none;border-radius:20px;
          padding:6px 11px;-webkit-backdrop-filter:blur(6px);
          backdrop-filter:blur(6px);}
        .mu-rendu-z i{font-style:normal;font-size:12px;}

        /* ═══ L'ESSAYAGE EN PLEIN ECRAN, COMME LA MAQUETTE ════════════════════

           « Le dernier ecran, comme d'autres ecrans avant, ne correspond pas aux
           ecrans que je t'ai donnes niveau UX et UI : il faut respecter le
           design scrupuleusement. »

           LA PHOTO SORT DE SA BOITE. Elle etait un carre arrondi au milieu d'une
           colonne, avec le nom de la piece dessous ; la maquette la pose BORD A
           BORD et ecrit par-dessus. Ce n'est pas qu'une question de gout : une
           photo en plein ecran est ce qui fait qu'on se regarde, une photo dans
           une boite est ce qu'on parcourt, et tout cet ecran existe pour le
           premier geste.

           LE DEBORDEMENT SE FAIT EN MARGES NEGATIVES, PAS EN POSITION FIXE. La
           feuille defile ; un calque fixe se serait decroche de la photo des le
           premier geste de defilement. Les seize points repris de chaque cote
           sont ceux de la feuille — voir .mu.

           ET SEULEMENT AU DEUXIEME TEMPS. Aux troisieme et quatrieme — l'avis,
           puis l'action — la meme photo redevient une vignette : on ne regarde
           plus, on repond. */
        .mu-rendu.plein{margin-left:-16px;margin-right:-16px;
          border-radius:0;}
        /* LA PHOTO S'ARRETE AVANT LE BAS DE L'ECRAN, ET C'EST VOULU. A
           soixante-quatorze pour cent de hauteur elle touchait le bord : rien
           ne disait qu'il y avait la bande des styles et le geste en dessous, et
           un ecran qui a l'air fini ne se fait pas defiler. */
        .mu-rendu.plein .mu-mi{border-radius:0;aspect-ratio:auto;
          height:min(62vh,540px);}
        /* AGRANDIR N'A PLUS DE RAISON D'ETRE : la photo EST en grand. Le bouton
           ne reste que la ou elle redevient une vignette — l'avis et l'action. */
        .mu-rendu.plein .mu-rendu-z{display:none;}
        .mu-rendu.plein .mu-mi-e.a{left:12px;bottom:12px;}
        .mu-rendu.plein .mu-mi-e.b{right:12px;bottom:12px;}
        /* LE NOM ET LE PRIX SONT MONTES DANS LA CARTE FLOTTANTE. Les laisser
           AUSSI sous la photo, c'est les ecrire deux fois a trente points
           d'intervalle. */
        /* IL ETAIT CACHE PARCE QUE LA CARTE FLOTTANTE LE PORTAIT. Elle a
           quitte le rendu ; le nom et le prix reprennent donc leur place sous
           la photo, ou ils ne recouvrent rien. Aux autres temps la carte est
           toujours la, et la regle tient toujours. */
        .mu-rendu.plein .mu-rendu-t{display:none;}
        /* « plein » SANS « court » EST DEJA LE TEMPS DU RENDU — voir la classe du
           conteneur. On ne rajoute pas un troisieme mot pour dire ce que les
           deux premiers disent. */
        .mu-rendu.plein:not(.court) .mu-rendu-t{display:flex;}
        /* TOUT LE RESTE REPREND SES SEIZE POINTS — ET ON LE DIT EN NEGATIF,
           PAS EN LISTE. Une liste de classes a marger aurait oublie la
           suivante : l'ecran de l'avis en ajoute huit — la question, les cinq
           fantomes, le petit mot, la case, le geste — et chacune se serait
           collee au bord le jour ou on l'a ecrite. La regle est donc « tout,
           sauf la photo et les deux calques qui flottent dessus ». */
        .mu-rendu.plein > *:not(.mu-mi):not(.mu-pl-g):not(.mu-pl-d){
          margin-left:16px;margin-right:16px;max-width:calc(100% - 32px);
          box-sizing:border-box;}

        /* LA COLONNE DE GAUCHE : le titre, la promesse, les trois lignes.
           Elle flotte sur la photo, donc elle porte son propre voile — sur une
           photo claire, du blanc sur du blanc ne se lit pas. */
        .mu-pl-g{position:absolute;left:14px;top:16px;z-index:6;max-width:54%;
          pointer-events:none;
          text-align:left;text-shadow:0 2px 14px rgba(0,0,0,.65);}
        .mu-pl-t{margin:0;font-size:31px;line-height:1.02;font-weight:900;
          letter-spacing:-.035em;color:#fff;}
        .mu-pl-t b{display:block;font-weight:900;
          background:linear-gradient(97deg,#C9A7FF,#E56BE0 78%);
          -webkit-background-clip:text;background-clip:text;color:transparent;}
        .mu-pl-p{margin:10px 0 0;font-size:13px;line-height:1.4;font-weight:600;
          color:#EDF2F7;}
        .mu-pl-l{list-style:none;margin:16px 0 0;padding:0;display:flex;
          flex-direction:column;gap:11px;}
        .mu-pl-l li{display:flex;align-items:center;gap:10px;font-size:12px;
          line-height:1.25;font-weight:700;color:#F2F6FA;}
        .mu-pl-l .mu-tr{flex:none;width:22px;height:22px;stroke:#fff;
          stroke-width:1.5;}

        /* LA CARTE FLOTTANTE DE DROITE : ce qu'on essaie, et les deux gestes
           qui ne decident rien. Elle est opaque et non translucide — pose sur
           une photo, un fond translucide laisse passer un motif qui rend son
           texte illisible une fois sur trois. */
        .mu-pl-d{position:absolute;right:10px;top:14px;z-index:7;width:122px;
          border-radius:20px;padding:9px;text-align:left;
          background:rgba(10,14,18,.92);border:1px solid rgba(255,255,255,.13);
          box-shadow:0 14px 38px rgba(0,0,0,.5);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .mu-pl-ph{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;
          border-radius:14px;background:#0A1210;}
        .mu-pl-n{display:block;margin-top:8px;font-size:13px;font-weight:800;
          line-height:1.25;color:#fff;}
        .mu-pl-x{display:block;margin-top:2px;font-style:normal;font-size:15px;
          font-weight:850;color:#D8A0FF;}
        .mu-pl-s{display:block;margin-top:9px;font-size:11px;font-weight:750;
          color:var(--mu-pale);}
        .mu-pl-c{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px;}
        .mu-pl-c button{width:24px;height:24px;border-radius:50%;padding:0;
          cursor:pointer;border:2px solid transparent;
          box-shadow:0 0 0 1px rgba(255,255,255,.22) inset;}
        .mu-pl-c button.on{border-color:#C9A7FF;
          box-shadow:0 0 0 1px rgba(0,0,0,.4) inset;}
        .mu-pl-r{margin-top:10px;padding-top:9px;
          border-top:1px solid rgba(255,255,255,.12);
          display:flex;flex-direction:column;gap:9px;}
        .mu-pl-r button{display:flex;align-items:center;gap:9px;width:100%;
          font:inherit;font-size:11.5px;font-weight:700;line-height:1.25;
          text-align:left;color:#E8EFF6;background:transparent;border:0;padding:0;
          cursor:pointer;}
        .mu-pl-r .mu-tr{flex:none;width:19px;height:19px;stroke:#E8EFF6;
          stroke-width:1.6;}
        .mu-pl-r button.on{color:#F7C948;}
        .mu-pl-r button.on .mu-tr{stroke:#F7C948;fill:#F7C948;}
        /* SUR UN ECRAN ETROIT, LA CARTE ET LE TITRE SE DISPUTENT LA LARGEUR.
           MESURE A 360 POINTS : cent cinquante pour la carte plus cinquante-sept
           pour cent pour le titre depassent la photo de dix-huit points, et le
           titre passait SOUS la carte. La carte maigrit, le titre aussi. */
        @media (max-width:379px){
          .mu-pl-d{width:110px;right:8px;}
          .mu-pl-g{max-width:52%;}
          .mu-pl-t{font-size:27px;}
        }

        /* CE QUI RESTE APRES LA DECISION. Menthe : c'est la couleur du commerce,
           et ce qui vient de se passer appartient au commerce. */
        .mu-rendu-ok{margin-top:15px;padding:14px 14px 13px;
          background:rgba(61,226,166,.1);border:1px solid rgba(61,226,166,.3);
          border-radius:16px;}
        .mu-rendu-ok b{display:block;font-size:15px;font-weight:850;color:#9CF3D0;}
        .mu-rendu-ok em{display:block;margin-top:5px;font-style:normal;
          font-size:12px;line-height:1.5;color:var(--mu-pale);}
        .mu-rendu-ok .mu-e-autres{margin-top:12px;}
        /* LA CARTE DEPOSEE, DANS LE PANNEAU. Elle garde son dessin de mur — le
           fond du panneau est deja menthe, donc la carte reprend le sien pour
           qu'on la reconnaisse comme ce qu'elle est : une carte du mur, pas une
           vignette de confirmation. */
        .mu-rendu-preuve{margin-top:10px;text-align:left;}
        .mu-rendu-preuve .mu-c{background:rgba(6,18,14,.55);
          border-color:rgba(61,226,166,.28);}

        /* ─── LE RENDU EN GRAND ───
           Plein ecran, fond noir, rien autour : on juge une couleur et une forme,
           et tout ce qui les entoure ment sur les deux. */
        .mu-loupe{position:fixed;inset:0;z-index:60;display:flex;
          align-items:center;justify-content:center;background:#05070B;
          padding:calc(12px + env(safe-area-inset-top)) 12px
            calc(12px + env(safe-area-inset-bottom));
          animation:muFondu .16s ease both;cursor:zoom-out;}
        .mu-loupe img{max-width:100%;max-height:100%;object-fit:contain;
          border-radius:14px;}
        .mu-loupe-x{position:absolute;right:12px;
          top:calc(12px + env(safe-area-inset-top));width:38px;height:38px;
          font-size:16px;color:#EAF0F6;cursor:pointer;
          background:rgba(255,255,255,.1);border:none;border-radius:50%;}
        .mu-loupe-n{position:absolute;left:0;right:0;
          bottom:calc(16px + env(safe-area-inset-bottom));text-align:center;
          font-size:12.5px;font-weight:800;color:#B9C6D6;}

        /* ─── LA MISE EN RELATION ─── */
        .mu-fondu{position:fixed;inset:0;z-index:40;border:none;padding:0;
          background:rgba(4,7,12,.66);cursor:pointer;
          -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
          animation:muFondu .18s ease both;}
        @keyframes muFondu{from{opacity:0;}to{opacity:1;}}
        .mu-rel{position:fixed;z-index:41;left:0;right:0;bottom:0;
          max-width:560px;margin:0 auto;
          background:linear-gradient(180deg,#1A1330,#0C0A18);
          border-top:1px solid rgba(139,125,246,.4);border-radius:26px 26px 0 0;
          padding:20px 18px calc(20px + env(safe-area-inset-bottom));
          animation:muMonte .24s cubic-bezier(.2,.8,.25,1) both;}
        @keyframes muMonte{from{transform:translateY(100%);}to{transform:translateY(0);}}
        .mu-rel-t{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
        .mu-rel-s{width:24px;height:26px;flex:none;}
        .mu-rel-s .mu-f-corps{fill:#E9E2FF;}
        .mu-rel-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-rel-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-rel-t b{font-size:12px;font-weight:900;letter-spacing:.12em;
          text-transform:uppercase;color:#C9BCFF;}
        .mu-rel-q{margin:0 0 16px;font-size:18px;line-height:1.35;font-weight:600;}
        .mu-rel-b{display:block;width:100%;font-family:inherit;font-size:15px;
          font-weight:900;cursor:pointer;border:none;border-radius:24px;
          padding:15px 16px;background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));
          color:#160D28;}
        .mu-rel-n{margin:12px 0 0;font-size:11.5px;line-height:1.5;text-align:center;
          color:var(--mu-pale);}
        .mu-rel-n2{margin:0 0 14px;font-size:13px;line-height:1.5;color:#C7D4E2;}
        /* QUATRE MOMENTS, EN UNE RANGEE. Un calendrier demanderait de reflechir,
           et on n'appuie pas deux fois sur un ecran qui fait reflechir. */
        .mu-quand{display:flex;gap:8px;flex-wrap:wrap;}
        .mu-quand button{flex:1;min-width:74px;font-family:inherit;font-size:13.5px;
          font-weight:800;cursor:pointer;border-radius:22px;padding:13px 10px;
          border:1px solid rgba(139,125,246,.4);background:rgba(139,125,246,.12);
          color:#E4DCFF;}
        .mu-quand button:active{transform:scale(.97);
          background:linear-gradient(120deg,var(--mu-v1),var(--mu-v2));color:#160D28;}
        .mu-rel-x{display:block;width:100%;margin-top:6px;font-family:inherit;
          font-size:13px;font-weight:700;cursor:pointer;border:none;background:none;
          color:var(--mu-pale);padding:10px;}

        @media (prefers-reduced-motion:reduce){
          .mu *{animation:none !important;transition:none !important;}
        }
      `,
      }}
    />
  );
}
