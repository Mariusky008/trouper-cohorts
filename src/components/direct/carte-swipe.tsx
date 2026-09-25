// LA CARTE DU DIRECT, EN MODE SWIPE — le seul écran qu'un habitant regarde.
//
// POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'EST PAS DANS LA DÉMO.
//
// La démonstration faite au commerçant racontait Le Direct sans jamais le
// MONTRER : on lui disait « votre annonce circule », et il voyait un encadré
// stylisé qui ne ressemblait à rien de ce que ses clients verront. Or c'est le
// mode swipe qui fait comprendre le système d'un coup d'œil — une carte plein
// écran, une photo, un prix, et trois gestes.
//
// Cette carte est donc écrite UNE fois, ici, et servie à deux endroits :
//   · la démonstration du site (ce qu'on promet au commerçant) ;
//   · le fil de la ville (ce que l'habitant reçoit réellement).
//
// C'est la seule façon d'être sûr que la promesse et le produit ne divergent
// pas. Le jour où la carte change de forme, elle change aux deux endroits — et
// il devient IMPOSSIBLE de montrer en démonstration un écran qui n'existe pas.
//
// Composant PRÉSENTATIONNEL : il ne fait que rendre ce qu'on lui donne. Les
// gestes appartiennent à l'écran qui l'utilise.
//
// ═══ SAUF UN, ET IL EST DÉLIBÉRÉ : QUELLE PHOTO EST AU MUR ═════════════════
//
// « Quand on appuie sur une photo, elle se met à la place de la grande photo
// plein écran qu'on a déjà quand on arrive sur l'annonce. »
//
// CE CHOIX-LÀ NE SORT JAMAIS DE LA CARTE. Il ne change rien au paquet, rien à
// ce qui est réservé, rien à ce qui remonte au commerçant : c'est un regard,
// pas une décision. Le faire remonter à l'écran porteur aurait obligé celui-ci
// à retenir une photo par carte et à l'oublier au bon moment — pour une
// information qui n'a de sens que tant que la carte est à l'écran.
//
// LA RÈGLE RESTE ENTIÈRE POUR TOUT LE RESTE : ce qui engage remonte, ce qui
// regarde reste.
"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/**
 * SÉPARER LE QUALIFICATIF DU MONTANT.
 *
 * « à partir de 12 € » → { avant: "à partir de", nombre: "12 €" }
 * « 15 € »             → { avant: "",            nombre: "15 €" }
 * « Gratuit »          → { avant: "",            nombre: "Gratuit" }
 *
 * ON COUPE AU PREMIER CHIFFRE, et rien d'autre. Une liste de préfixes connus
 * (« dès », « à partir de », « environ ») se serait fait prendre en défaut au
 * premier commerçant qui écrit « à partir seulement de » — et un prix qu'on ne
 * sait pas découper doit s'afficher entier, jamais amputé.
 */
/**
 * ═══ LE SIGNE EURO NE PART JAMAIS SEUL À LA LIGNE ═════════════════════════
 *
 * « Le prix aussi : parfois le signe euro est à la ligne quand le chiffre fait
 * par exemple 8,40. »
 *
 * MESURÉ, ET LA CAUSE EST UNE ESPACE ORDINAIRE. La typographie française met
 * une espace entre le nombre et son unité — « 8,40 € » — et une espace
 * ordinaire est un endroit où le navigateur a le droit de couper. À quatre
 * chiffres, « 8,40 » remplit la ligne et le « € » tombe tout seul dessous : un
 * prix cassé en deux se lit deux fois, et le second morceau ne veut rien dire.
 *
 * ON REMPLACE DONC L'ESPACE PAR UNE INSÉCABLE, à la source, pour tous les prix
 * de toutes les cartes. C'est la même correction que « 210 m » dans la ligne du
 * commerce, qui laissait un « m » seul sur la ligne suivante — même faute, même
 * remède, et c'est pour ça qu'elle se fait ici et non dans une feuille de
 * style : `white-space: nowrap` sur le bloc empêcherait AUSSI le qualificatif
 * de passer à la ligne, et « à partir de 12 € » tiendrait alors sur une ligne
 * de cent points.
 */
/**
 * ═══ ET LA RÈGLE NE MARCHAIT PAS POUR L'EURO ══════════════════════════════
 *
 * « J'ai toujours les chiffres qui ne sont pas collés au sigle €, j'ai le
 * nombre et dessous le sigle qui lui est à la ligne. »
 *
 * IL AVAIT SIGNALÉ CE DÉFAUT DEUX FOIS, ET J'AVAIS RÉPONDU DEUX FOIS QU'IL
 * ÉTAIT CORRIGÉ. Il ne l'était pas : la règle finissait par `\b`, qui demande
 * une frontière de MOT après le signe. `€` et `%` ne sont pas des caractères de
 * mot, et il n'y a rien derrière eux en fin de chaîne — la condition était donc
 * toujours fausse, et « 8,40 € » ressortait inchangé. Vérifié : sur sept cas,
 * les trois seuls qui passaient étaient `m`, `h` et `min`, c'est-à-dire les
 * trois unités écrites avec des lettres.
 *
 * UNE MESURE QUI SEMBLE MARCHER PARCE QU'ELLE MARCHE AILLEURS EST PIRE QU'UNE
 * MESURE ABSENTE : la distance se collait, donc la fonction avait l'air vivante,
 * et j'ai cru le sujet clos pendant deux tours.
 *
 * LA FRONTIÈRE NE S'EXIGE PLUS QUE POUR LES UNITÉS EN LETTRES, où elle sert
 * vraiment — sans elle, « 3 heures » deviendrait « 3 heures » avec l'espace
 * collée après un `h` qui n'est pas l'unité.
 */
function insecable(t: string): string {
  return t
    .replace(/\s+([€%])/g, "\u00a0$1")
    .replace(/\s+(euros?|km|min|m|h)\b/gi, "\u00a0$1");
}

function qualifie(prix?: string): { avant: string; nombre: string } {
  const t = insecable((prix ?? "").trim());
  const m = /^(\D*?)\s*(\d.*)$/.exec(t);
  if (!m || !m[1]) return { avant: "", nombre: t };
  return { avant: m[1].trim(), nombre: m[2] };
}

export type CarteDirect = {
  /** La photo, plein cadre. Sans elle, un fond dégradé et l'emoji du métier. */
  photo?: string;
  /**
   * OÙ REGARDER DANS LA PHOTO — la valeur verticale de `background-position`.
   *
   * Le bas de la carte est recouvert par le voile qui porte le nom et le prix :
   * un sujet centré s'y fait avaler à moitié. Quand la photo est plus haute que
   * le cadre, on peut choisir la tranche qu'on garde. « 50% » (le défaut) prend
   * le milieu ; une valeur plus grande descend dans l'image, une plus petite
   * remonte.
   *
   * Utile surtout pour les photos des commerçants, dont on ne maîtrise pas le
   * cadrage : c'est le seul réglage qui rattrape une image sans la retoucher.
   */
  cadrage?: string;
  /**
   * ═══ SES AUTRES PHOTOS, EN BANDE SOUS L'ANNONCE ═══════════════════════════
   *
   * « Ça peut n'être que 3 photos ou 5, donc il faudra ajuster en fonction de
   * ce que le commerçant aura mis. Et s'il n'y a qu'une seule photo, alors
   * aucune miniature n'apparaît et ça fait gagner de la place sur l'annonce. »
   *
   * LE NOMBRE N'EST PAS UN RÉGLAGE, C'EST UNE CONSÉQUENCE. Trois, cinq, ou
   * aucune : la bande compte ce qu'il y a. C'est la même règle que partout
   * ailleurs dans ce produit — on n'affiche pas un emplacement vide en
   * attendant que quelqu'un le remplisse.
   *
   * ET ZÉRO MINIATURE EST UN CAS À PART ENTIÈRE, pas un cas dégradé. Un
   * commerçant qui n'a qu'une photo ne doit pas voir une bande d'une seule
   * vignette — qui ne servirait à rien, puisqu'elle montre ce qui est déjà
   * plein cadre au-dessus — mais une annonce PLUS COURTE. La place gagnée
   * remonte le prix et le geste sous le pouce.
   *
   * LA PREMIÈRE EST TOUJOURS CELLE DE L'ANNONCE, et c'est ce qui rend le
   * retour possible : on peut regarder la salle, puis revenir à ce qui est
   * proposé aujourd'hui. Sans elle, on sortirait de l'offre sans pouvoir y
   * rentrer.
   */
  photos?: { src: string; quoi: string }[];
  /**
   * LE FILM DE L'ANNONCE, PLEIN CADRE — et il passe devant la photo.
   *
   * « Le plat qui sort du four se filme mieux qu'il ne se photographie » :
   * c'est pour ça que le bouton existe dans l'assistante. Il manquait la
   * moitié du chemin — ce qui est filmé doit s'afficher.
   *
   * `affiche` est l'image d'attente : la photo du moment si elle existe, sinon
   * celle du commerce. Sans elle, la carte est noire une demi-seconde, ce qui
   * sur un paquet qu'on balaie est exactement une carte vide.
   */
  film?: { mp4: string; affiche?: string };
  /** Le nom du commerce, tel qu'il l'écrit. */
  nom: string;
  /** « Restaurant », « Boulangerie »… */
  metier: string;
  /**
   * SON EMOJI DE MÉTIER — et il n'est pas décoratif.
   *
   * « Quand on est sur l'app on ne sait pas trop ce qu'on regarde : on n'a
   * aucune indication rapide si c'est un magasin de vêtements, une boucherie ou
   * un coiffeur. » C'était vrai, et la cause tenait à une seule ligne : la
   * nature de l'annonce REMPLAÇAIT le métier. « MENU DU JOUR » ou « −30 % » ne
   * disent pas chez qui l'on est, et l'en-tête ne le dit plus non plus depuis
   * qu'on ouvre sur toute la ville.
   *
   * Un pictogramme se lit avant un mot, et les deux ensemble se lisent avant
   * n'importe quelle phrase : c'est la seule information de la carte qui doit
   * arriver en moins d'une seconde.
   */
  metierEmoji?: string;
  ville: string;
  /** Ce qui reste avant que ça disparaisse : « Jusqu'à 14 h », « 2 h 10 ». */
  reste?: string;
  /**
   * ⚡ CE QUI SE PÉRIME DANS QUELQUES MINUTES — voir `flash.ts`.
   *
   * QUATRE CHAMPS, ET AUCUNE MÉCANIQUE. La carte ne sait pas ce qu'est un
   * Flash : elle sait le temps qui reste, la part écoulée, l'avantage à
   * afficher et, le cas échéant, ce qui continue derrière lui. Le prix barré,
   * l'étiquette et le titre passent par les champs qui existent déjà. Une carte
   * qui connaîtrait la mécanique serait une carte à modifier le jour où la
   * mécanique change.
   */
  flash?: {
    reste: string;
    part: number;
    /** « −20 % », « Le dessert offert » — la raison de se lever maintenant. */
    avantage?: string;
    /** « Le menu du jour continue » — ce que le Flash ne remplace pas. */
    continue?: string;
  };
  /** L'emoji et l'intitulé de ce qui est proposé. */
  /**
   * COMBIEN IL EN RESTE — le nombre que le commerçant a donné, jamais un
   * autre. Absent quand il ne l'a pas dit : « il reste 4 tables » a déjà été
   * retiré une fois du produit parce qu'on ne peut pas le savoir.
   */
  combien?: number;
  icone: string;
  quoi: string;
  /** Le détail — les lignes d'un menu, par exemple. */
  lignes?: string[];
  /**
   * SON CONSEIL DU JOUR, ET QUI LE DIT — voir `Voix` côté données.
   *
   * IL REMPLACE LE DÉTAIL, IL NE S'AJOUTE PAS À LUI. « Salade de saison ·
   * Prêtes tout de suite, à emporter » est une ligne écrite par le produit,
   * que personne ne lit ; « Prenez les lasagnes, la pâte est de ce matin —
   * Margot » est quelqu'un qui parle. Même place, même hauteur, et l'annonce
   * cesse d'être une fiche produit.
   *
   * ABSENT, TOUT REDEVIENT COMME AVANT. C'est la règle de la fonction : un
   * commerçant qui ne veut rien dire ne perd pas une ligne.
   */
  conseil?: string;
  /**
   * QUI PARLE. Le portrait est facultatif ; la vidéo l'est encore plus.
   *
   * LA VIDÉO N'EST DONNÉE QUE SUR LA CARTE DU DESSUS. Trente vidéos qui se
   * chargent dans un paquet qu'on balaie rendent l'application inutilisable en
   * 4G dans la rue et vident la batterie. L'écran retire donc le champ des
   * cartes qui ne sont pas devant — voir `carteDe` côté application.
   */
  voix?: {
    prenom: string;
    role?: string;
    portrait?: string;
    video?: { mp4: string; webm?: string; affiche?: string };
  };
  prix?: string;
  /** Le prix d'avant, barré. */
  prixBarre?: string;
  /** L'étiquette jaune : « GRATUIT », « -30 % ». */
  etiquette?: string;
  /**
   * ÇA VIENT DE TOMBER — « à l'instant », « il y a 12 min ».
   *
   * LA SEULE CHOSE QU'UNE FICHE GOOGLE NE SAURA JAMAIS DIRE. Des horaires, une
   * adresse, un menu : tout le monde les a. « Il vient de se passer quelque
   * chose, il y a douze minutes, à trois cents mètres » n'existe nulle part —
   * et c'est pour ça que ça se lit AVANT le métier, tout en haut de la carte.
   *
   * ET CE N'EST PAS UNE ÉTIQUETTE DE PLUS. L'étiquette jaune dit ce que
   * l'offre EST (« −30 % ») ; celle-ci dit QUAND elle a été dite. Les deux
   * peuvent coexister sur une carte sans se répéter — mais rarement, parce
   * qu'une annonce fraîche est rare par construction (voir `FRAICHEUR_MIN`).
   */
  frais?: string;
  /** Ce que d'autres ont déjà fait : « 3 ont réservé ». Jamais inventé. */
  social?: string;
  /**
   * À QUELLE DISTANCE C'EST — « 400 m », « 1,2 km ».
   *
   * C'est l'information qui manquait le plus à la carte, et elle décide plus
   * souvent que le prix : à midi, on ne choisit pas un restaurant, on choisit
   * un restaurant OÙ ON A LE TEMPS D'ALLER. Sans elle, l'habitant lisait une
   * belle photo sans savoir si c'était à deux rues ou à l'autre bout de Dax.
   *
   * Elle vient de `repereSpatial` (voir `degradation.ts`), qui la calcule
   * quand l'habitant a autorisé sa position et retombe sinon sur le quartier
   * puis sur la ville. Vide, la ligne se contente du métier et de la ville —
   * on n'affiche jamais une distance qu'on n'a pas.
   */
  distance?: string;
  /**
   * L'ITINÉRAIRE, quand on sait où c'est. Voir `lienItineraire`.
   *
   * Absent, le bouton n'existe pas : un « Y aller » qui ouvre une carte vide
   * coûte plus cher que son absence.
   */
  itineraire?: string;
  /**
   * LE LANGAGE DU MÉTIER — voir `lib/direct/personnalites.ts`.
   *
   * « Pour bien reconnaître un type de commerçant d'un autre et ne pas avoir
   * l'impression que c'est le même type de commerçant. »
   *
   * IL NE PORTE QUE TROIS CHOSES, ET C'EST VOULU : la couleur d'accent, la
   * personnalité du titre, et le mot de ce qu'on compte. La STRUCTURE ne s'en
   * sert jamais — l'ordre des blocs, la place de la photo, du prix et du pied
   * est la même pour les neuf. On veut un système qui parle neuf langages, pas
   * neuf applications.
   *
   * ABSENT, LA CARTE EST EXACTEMENT CELLE D'AVANT. C'est la règle : un appelant
   * qui ne sait pas de quel métier il s'agit ne doit pas obtenir un métier au
   * hasard — c'est la faute qui a donné le mur des bougies à un hypnothérapeute.
   */
  langage?: {
    cle: string;
    accent: string;
    encre: string;
    halo: string;
    titre: "gras" | "editorial" | "clair";
    unite: [string, string];
  };
  /**
   * ═══ LES QUATRE LIGNES D'INFORMATION DE LA MAQUETTE ═══════════════════════
   *
   * « Le design des restaurants, bars et événements n'a pas été modifié comme
   * sur le screenshot que je t'avais donné. »
   *
   * SA MAQUETTE POSE QUATRE LIGNES SOUS LE PRIX, chacune avec son pictogramme :
   * ce qu'il reste, où c'est, combien de gens y sont allés, et la note. Trois
   * existaient déjà dans le produit, éparpillées — « Il reste 8 parts » sous le
   * prix, le nom et la distance plus bas, la note nulle part sur la carte. La
   * quatrième, le nombre de clients du mois, n'existait pas.
   *
   * ENSEMBLE ELLES RÉPONDENT AUX QUATRE QUESTIONS QU'ON SE POSE DEVANT UNE
   * ANNONCE, dans l'ordre où on se les pose : est-ce qu'il en reste, est-ce que
   * c'est loin, est-ce que d'autres y vont, est-ce que c'est bien. Séparées,
   * chacune se lisait comme un détail ; alignées, elles se lisent comme une
   * fiche.
   */
  /** La note du commerce et son nombre d'avis : « 4,8 », 312. */
  note?: string;
  avis?: number;
  /**
   * COMBIEN DE GENS Y SONT ALLÉS CE MOIS-CI.
   *
   * IL VIENT DES DONNÉES DE LA DÉMONSTRATION, comme la note et le nombre
   * d'avis — les commerces d'ici sont inventés, leurs chiffres le sont aussi,
   * et ils sont DÉCLARÉS dans le catalogue plutôt que tirés au rendu. C'est la
   * différence qui compte : un nombre écrit dans la donnée reste le même d'un
   * écran à l'autre et se remplace le jour où le vrai arrive ; un nombre
   * fabriqué à l'affichage change à chaque passage et ne se remplace jamais.
   */
  clientsMois?: number;
  /** Combien de personnes l'ont mise de côté, et combien l'ont partagée. */
  gardes?: number;
  partages?: number;
};

/**
 * LE BANDEAU DU HAUT — la marque, la ville, ce qu'on a gardé.
 *
 * Il ne sert pas à décorer : c'est lui qui dit à quel écran on est. Sans lui,
 * la carte pourrait aussi bien être une publicité.
 */
export function BarreDirect({
  marque,
  ville,
  agenda,
  gardees,
}: {
  marque: string;
  ville: string;
  /** Combien de choses réservées, en haut à droite. */
  agenda?: number;
  /** Combien de commerces gardés. */
  gardees?: number;
}) {
  return (
    <div className="cd-barre">
      <span className="cd-marque">{marque}</span>
      <span className="cd-puce"><i aria-hidden="true">📍</i>{ville}</span>
      {agenda != null && (
        <span className="cd-puce"><i aria-hidden="true">📅</i><b>{agenda}</b></span>
      )}
      {gardees != null && (
        <span className="cd-puce vert"><i aria-hidden="true">💚</i>Ma carte<b>{gardees}</b></span>
      )}
    </div>
  );
}

/**
 * LES TROIS GESTES, sous la carte.
 *
 * `action` est le libellé du bouton du milieu, et il change avec le métier :
 * on « réserve » une table, on « veut » une fournée. Un intitulé unique
 * obligerait l'habitant à traduire.
 */
export function GestesDirect({
  action = "Je veux",
  actif,
}: {
  action?: string;
  /** Le geste mis en avant, le temps d'une démonstration. */
  actif?: "passer" | "veux" | "pro";
}) {
  return (
    <div className="cd-gestes">
      <span className={`cd-g${actif === "passer" ? " on" : ""}`}>
        <i aria-hidden="true">✕</i>
        <em>Passer</em>
      </span>
      <span className={`cd-g grand${actif === "veux" ? " on" : ""}`}>
        <i aria-hidden="true">♥</i>
        <em>{action}</em>
      </span>
      <span className={`cd-g${actif === "pro" ? " on" : ""}`}>
        <i aria-hidden="true">↑</i>
        <em>Le pro</em>
      </span>
    </div>
  );
}

/**
 * LES DEUX FAÇONS DE DESSINER LA MÊME CARTE.
 *
 * `fiche` est la face historique : le nom du commerce en gros, puis le métier,
 * puis ce qui est proposé, puis le prix. Elle se lit comme une fiche — de haut
 * en bas, à gauche — et c'est ce qu'il faut là où la carte est un exemple posé
 * dans une page (la démonstration commerçant, la page d'accueil).
 *
 * `seconde` est la face de l'application : ce qu'on doit comprendre en une
 * seconde, et rien d'autre. LE DÉFAUT QU'ELLE CORRIGE A ÉTÉ RELEVÉ SUR L'ÉCRAN
 * RÉEL : « on a du mal à lire correctement le message… normalement on devrait
 * comprendre en une seconde le menu grâce à la photo et grâce aux textes ».
 * La raison tenait à la hiérarchie : le NOM DU COMMERCE était la plus grosse
 * ligne de la carte, alors que ce qu'on choisit à midi, c'est un plat. Ici
 * l'ordre est celui de la décision — ce que c'est, ce que c'est vraiment, ce
 * que ça coûte, chez qui, jusqu'à quand — et c'est centré, parce qu'un bloc
 * centré sur une photo se lit d'un coup et non ligne à ligne.
 *
 * POURQUOI LES DEUX COHABITENT ICI PLUTÔT QUE DANS DEUX FICHIERS. C'est la
 * raison d'être de ce fichier : une seule carte, un seul jeu de classes, un
 * seul type. Deux fichiers, ce serait de nouveau deux cartes qui divergent.
 *
 * CE QUI RESTE À FAIRE LE JOUR OÙ LA DÉMONSTRATION L'ADOPTERA : `carteDirectHtml`
 * ne sait dessiner que `fiche`. Elle sert des scènes remplies par `innerHTML`,
 * qui ne montrent aujourd'hui que la face historique. Le jour où la promesse
 * faite au commerçant montre la nouvelle face, cette fonction doit suivre —
 * sans quoi on aurait exactement ce que ce fichier existe pour empêcher.
 */
export type FaceCarte = "fiche" | "seconde";

/**
 * JUSQU'OÙ LA PHOTO DESCEND, EN PART DE LA HAUTEUR DE LA CARTE.
 *
 * On la veut à soixante-deux pour cent. À pleine largeur, une image verticale
 * y arrive toute seule ; une image carrée ou panoramique n'y arrive qu'en
 * perdant de la largeur, et LE PLAFOND EST LE CŒUR DE LA RÈGLE : au-delà d'un
 * quart de la largeur — douze et demi par bord — on renonce à la cible plutôt
 * qu'au sujet.
 *
 * ELLE REND UNE PART, PAS DES POINTS. La carte n'a pas la même hauteur dans la
 * démonstration du site et dans le fil de la ville ; un nombre de points calé
 * sur l'une décadrerait l'autre.
 */
export function partDeLaPhoto(l: number, h: number): number {
  if (!l || !h) return 1;
  const CIBLE = 0.62;
  const ROGNAGE_MAX = 0.25;
  /* LA PART QU'ELLE PREND À PLEINE LARGEUR, sur une carte au format d'un
     téléphone — neuf sur dix-neuf et demi, le rapport de tous nos écrans. */
  const pleine = h / l / (19.5 / 9);
  if (pleine >= CIBLE) return Math.min(1, pleine);
  return Math.min(CIBLE, pleine / (1 - ROGNAGE_MAX));
}

/**
 * LA COULEUR MOYENNE DU BAS D'UNE IMAGE, ASSOMBRIE.
 *
 * ON NE LIT QU'UN PIXEL SUR SEIZE : la moyenne ne bouge pas d'un point et le
 * calcul coûte seize fois moins.
 *
 * ET ON ASSOMBRIT DE PLUS DE MOITIÉ, ce qui n'est pas qu'une question de
 * lisibilité. À soixante-dix pour cent de la teinte d'origine, le bas d'une
 * photo de studio donnait un gris-beige moyen — exactement la couleur d'une
 * image FLOUTÉE. À quarante-cinq, la même teinte devient un PANNEAU : elle
 * appartient toujours à l'image, mais plus personne ne la confond avec elle.
 */
export function basDeLImage(img: HTMLImageElement): string {
  try {
    const l = Math.min(img.naturalWidth, 240);
    const h = Math.max(1, Math.round((l / img.naturalWidth) * img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = l;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return "";
    g.drawImage(img, 0, 0, l, h);
    const depuis = Math.max(0, h - Math.max(2, Math.round(h * 0.08)));
    const d = g.getImageData(0, depuis, l, h - depuis).data;
    let r = 0;
    let v = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 16) {
      r += d[i];
      v += d[i + 1];
      b += d[i + 2];
      n++;
    }
    if (!n) return "";
    const t = (x: number) => Math.round((x / n) * 0.45);
    return `rgb(${t(r)}, ${t(v)}, ${t(b)})`;
  } catch {
    /* UNE TOILE QUE LE NAVIGATEUR REFUSE DE LIRE N'EST PAS UNE PANNE : sans
       couleur, la carte garde son fond d'avant. */
    return "";
  }
}

export function CarteSwipe({
  carte,
  style,
  className = "",
  variante = "fiche",
  children,
  anneau,
}: {
  carte: CarteDirect;
  style?: CSSProperties;
  className?: string;
  /** Voir `FaceCarte`. Par défaut la face historique : personne ne change sans le demander. */
  variante?: FaceCarte;
  /**
   * CE QUE L'ÉCRAN QUI L'UTILISE AJOUTE AU BAS DE LA CARTE.
   *
   * POURQUOI UN POINT D'EXTENSION PLUTÔT QU'UN CHAMP DE PLUS. La maquette
   * habitant a besoin d'une ligne « les avis sur le plat » sous le prix. La
   * ranger dans `CarteDirect` reviendrait à embarquer, dans la carte du VRAI
   * produit et dans son type, un bloc qui n'existe nulle part ailleurs — du
   * code mort partout sauf à un endroit, et une promesse de plus dans le type
   * que lit quiconque veut comprendre ce qu'une carte affiche.
   *
   * Ici, la carte ne sait rien de ce qu'on lui glisse : elle réserve une place,
   * en bas, après le prix. Le jour où les avis deviennent un vrai morceau du
   * produit, ils remonteront dans le type — pas avant.
   */
  children?: ReactNode;
  /**
   * L'ANNEAU POSÉ SUR LA PHOTO, À DROITE.
   *
   * IL A DEUX VIES, ET UNE SEULE FORME. Sur un Flash, la carte le dessine
   * elle-même : le temps qui reste est une donnée de la carte, et personne ne
   * clique dessus. Le reste du temps, il devient une PORTE — « Voir la carte »,
   * « Voir la journée » — et une porte appartient à l'écran qui sait où elle
   * mène, pas à la carte. L'écran la glisse donc ici, et elle prend exactement
   * la place et l'allure du chrono : un seul objet à cet endroit, jamais deux.
   */
  anneau?: ReactNode;
}) {
  const c = carte;
  const sec = variante === "seconde";

  /**
   * ═══ LA BANDE, ET CE QU'ELLE CONTIENT VRAIMENT ═════════════════════════════
   *
   * LA PHOTO DE L'ANNONCE OUVRE LA LISTE, puis viennent les siennes. On
   * DÉDOUBLONNE sur l'adresse du fichier, parce que le cas se produit dès le
   * premier commerce : la photo du jour est souvent déjà dans ses photos de
   * fiche, et la bande aurait montré deux fois la même image côte à côte.
   *
   * UNE SEULE ENTRÉE VEUT DIRE PAS DE BANDE. C'est sa demande, et c'est aussi
   * la seule lecture juste : une vignette unique ne propose aucun choix, elle
   * répète en petit ce qui est déjà plein cadre.
   */
  const photos = (() => {
    const vues = new Set<string>();
    const l: { src: string; quoi: string }[] = [];
    if (c.photo) {
      vues.add(c.photo);
      l.push({ src: c.photo, quoi: c.quoi });
    }
    for (const p of c.photos ?? []) {
      if (!p.src || vues.has(p.src)) continue;
      vues.add(p.src);
      l.push(p);
    }
    return l.length > 1 ? l : [];
  })();

  /**
   * ═══ CE QUI EST AU MUR, ET POURQUOI ÇA SE REMET EN PLACE TOUT SEUL ════════
   *
   * LE PAQUET RÉUTILISE SES CARTES. React garde le même composant monté et lui
   * passe la carte suivante : sans remise à zéro, on aurait balayé vers « La
   * formule du midi » en regardant encore la salle du restaurant précédent —
   * la photo d'un commerce sur l'annonce d'un autre, ce qui est le pire défaut
   * possible sur cet écran.
   *
   * L'EFFET DÉPEND DE L'ADRESSE DE LA PHOTO, pas de l'objet `carte` : celui-ci
   * est reconstruit à chaque rendu — le décompte des réservations en fabrique
   * un neuf — et l'effet se serait relancé sans fin.
   */
  const photoAnnonce = c.photo ?? "";
  const [regardee, setRegardee] = useState("");
  useEffect(() => {
    setRegardee("");
  }, [photoAnnonce]);
  const auMur = regardee || photoAnnonce;

  /**
   * ═══ LA PHOTO N'EST PLUS ROGNÉE SUR LES CÔTÉS ════════════════════════════
   *
   * « On voit la coupe encore une fois qu'en partie, mais pas vraiment
   * clairement et totalement. »
   *
   * « cover » REMPLIT LE CADRE EN COUPANT CE QUI DÉPASSE — et sur un téléphone,
   * ce qui dépasse est TOUJOURS la largeur. Une photo carrée y perdait vingt-
   * six pour cent de chaque côté : les côtés de la coupe, les manches du
   * vêtement, les doigts de la main. C'est exactement ce qu'on vient regarder.
   *
   * ON VISE DONC UNE HAUTEUR, ET ON ROGNE LE MINIMUM POUR L'ATTEINDRE. La
   * photo descend jusqu'à soixante-deux pour cent de la carte quand elle le
   * peut ; si son format ne le permet qu'en coupant, on coupe — mais jamais
   * plus de douze et demi pour cent par bord. Une photo panoramique n'atteint
   * pas la cible, et c'est voulu : mieux vaut une image courte qu'amputée.
   *
   * ET CE QUI RESTE DESSOUS N'EST PAS UN VIDE : c'est la couleur moyenne du
   * bas de l'image, assombrie de plus de moitié pour qu'elle se lise comme un
   * panneau et non comme une photo floutée. Le raccord finit exactement au
   * dernier point de la photo — voir `.cd-raccord` — donc il n'y a pas de
   * bord à voir.
   *
   * TANT QUE LA MESURE N'A PAS EU LIEU, RIEN NE CHANGE. La classe `mesuree`
   * n'arrive qu'avec elle : une image qui ne charge pas, un rendu serveur, un
   * navigateur qui refuse la toile — et la carte garde le cadrage d'avant.
   */
  const [cadre, setCadre] = useState<{ h: number; fond: string } | null>(null);
  useEffect(() => {
    if (!auMur) {
      setCadre(null);
      return;
    }
    let vivant = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!vivant || !img.naturalWidth || !img.naturalHeight) return;
      setCadre({ h: partDeLaPhoto(img.naturalWidth, img.naturalHeight), fond: basDeLImage(img) });
    };
    img.src = auMur;
    return () => {
      vivant = false;
    };
  }, [auMur]);

  return (
    /* ⚡ UNE CARTE FLASH NE RESSEMBLE À AUCUNE AUTRE — c'est la demande, et
       c'était le défaut : « l'annonce ne fait pas différente d'une autre alors
       qu'elle devrait être très différente pour montrer l'exceptionnel de ce
       moment ». Une pastille ambre sur une carte identique ne suffit pas : on
       balaie, et rien n'arrête l'œil. La classe teinte la carte ENTIÈRE. */
    /* L'ACCENT DU MÉTIER VOYAGE EN VARIABLE, PAS EN CLASSE. Neuf classes
       auraient demandé neuf blocs de style dupliqués ; une variable se pose une
       fois et sert partout dans la carte — et elle ne touche AUCUN bouton
       d'action : la menthe veut dire « ceci vous engage » dans tout le produit.
       Voir `lib/direct/personnalites.ts`. */
    <div
      /* ═══ LE ROND MONTE EN FACE DU TITRE ══════════════════════════════════

         « Le cercle, dans le cas où le texte le permet, pourrait être en face
         du texte tout en haut, pour gagner de l'espace plus bas et ne pas être
         en face du prix. »

         MESURE : le rond tenait de 245 à 349 points, c'est-à-dire exactement en
         face de la fiche — « Il reste 4 parts », « À 250 m » — et juste sous le
         prix. Il volait cent quatre points de largeur à la seule zone de
         l'écran où l'on lit des chiffres, alors que la bande du titre, au-dessus,
         était vide sur sa moitié droite.

         « QUAND LE TEXTE LE PERMET » EST LA BONNE CONDITION, et elle se mesure :
         un titre court s'écrit en très gros corps — soixante-dix points — et
         remplit toute la largeur ; lui retirer cent seize points le casserait en
         quatre lignes. Un titre moyen ou long, lui, s'écrit plus petit et laisse
         la place. Le rond ne monte donc que là. */
      className={`cd-carte${sec ? " sec" : ""}${c.flash ? " flash" : ""}${
        c.quoi.length > 14 ? " hautrond" : ""
      }${cadre ? " mesuree" : ""}${
        c.langage ? ` m-${c.langage.cle}` : ""
      } ${className}`}
      style={
        {
          ...style,
          ...(c.langage
            ? {
                "--cd-accent": c.langage.accent,
                "--cd-accent-encre": c.langage.encre,
                "--cd-halo": c.langage.halo,
              }
            : {}),
          /* LA MESURE VOYAGE EN VARIABLES — voir `partDeLaPhoto`. Sans elle, la
             classe `mesuree` n'est pas posée et aucune de ces deux lignes ne
             sert : la carte garde le cadrage d'avant. */
          ...(cadre
            ? { "--cd-photo-h": `${(cadre.h * 100).toFixed(2)}%`, "--cd-fond": cadre.fond || "#0D1A15" }
            : {}),
        } as React.CSSProperties
      }
    >
      {/* DEUX COUCHES, PAS UNE, et c'est un filet de sécurité.
          L'image est empilée SUR un dégradé. Si le fichier manque ou tarde, la
          couche du dessous reste : la carte est sombre et propre au lieu d'être
          blanche et cassée. Avec une seule couche, un `background-image` en 404
          efface aussi la couleur de fond — on aurait un trou en plein milieu de
          l'écran qui doit convaincre. */}
      <div
        className={`cd-photo${c.photo ? "" : " sans"}`}
        style={
          auMur
            ? {
                backgroundImage: `url("${encodeURI(auMur)}"), linear-gradient(155deg,#22463A,#0D1A15 70%)`,
                /* LE CADRAGE NE SUIT QUE LA PHOTO DE L'ANNONCE. Il a été réglé
                   pour ELLE — « le sujet est bas, remonte de dix pour cent » —
                   et l'appliquer à une autre image la décadre. Les siennes
                   prennent le milieu, qui ne trahit aucune. */
                /* LE CADRAGE VERTICAL NE SERT QU'AU MODE D'AVANT. Quand la
                   photo est mesurée, elle est entière : il n'y a plus de
                   hauteur à choisir, donc plus rien à remonter. */
                backgroundPosition: cadre
                  ? "center top"
                  : `center ${regardee ? "50%" : c.cadrage || "50%"}`,
              }
            : undefined
        }
      >
        {/* ═══ SI C'EST UN FILM, IL PASSE DEVANT LA PHOTO ═══

            LE DÉFAUT MESURÉ : « j'ai créé avec Léa une annonce et au lieu de
            mettre une photo j'ai mis une vidéo, mais l'annonce n'affiche rien,
            ni photo ni vidéo. »

            LE FILM ÉTAIT BIEN ENREGISTRÉ, ET IL N'ARRIVAIT NULLE PART. La carte
            n'avait qu'un fond CSS, c'est-à-dire une image et rien d'autre : un
            commerçant qui filmait son plat au lieu de le photographier publiait
            une annonce sans aucun visuel — le pire des trois résultats
            possibles, puisqu'il croyait avoir fait le geste le plus généreux.

            MUET, EN BOUCLE, SANS COMMANDES. Une annonce qu'on traverse en
            balayant ne peut pas démarrer un son ni demander qu'on appuie sur
            « lire » : elle a une seconde pour se faire comprendre. `playsInline`
            n'est pas décoratif — sans lui, iOS ouvre le lecteur plein écran
            par-dessus le paquet dès que la vidéo démarre.

            ET LA PHOTO RESTE DESSOUS. `poster` couvre le temps de chargement,
            et le dégradé couvre le poster s'il manque : trois couches pour que
            l'écran ne soit jamais vide. */}
        {c.film && (
          <video
            className="cd-film"
            poster={c.film.affiche}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            style={{ objectPosition: `center ${c.cadrage || "50%"}` }}
          >
            <source src={c.film.mp4} type="video/mp4" />
          </video>
        )}
        {/* ─── ET IL Y A TOUJOURS QUELQUE CHOSE SOUS LE FILM ───
            Une vidéo qui ne se décode pas ne peint RIEN — pas une erreur, pas
            un cadre gris : un rectangle transparent. Sans couche en dessous,
            l'écran serait noir de bord à bord, ce qui est exactement le défaut
            qu'on est en train de corriger, déplacé d'un cran. Le dégradé et
            l'emoji du métier restent donc là, sous le film, sur toutes les
            cartes qui n'ont pas de photo. On ne les voit jamais quand tout va
            bien : ils ne servent que le jour où ça ne va pas. */}
        {!c.photo && <span className="cd-ph" aria-hidden="true">{c.icone}</span>}
      </div>
      {/* Le voile n'est pas un effet : sans lui, un texte blanc posé sur une
          photo claire devient illisible une fois sur deux. */}
      <div className="cd-voile" aria-hidden="true" />
      {/* LE RACCORD ENTRE LA PHOTO ET LE PANNEAU. Il tient ENTIÈREMENT dans la
          photo et atteint la couleur du fond à son dernier point : sous ce
          point, c'est la même couleur, donc il n'y a pas de bord à voir. Mis
          en travers du bord — un peu avant, un peu après — il laissait un
          écart de quinze pour cent, et quinze pour cent font un trait. */}
      {cadre && <div className="cd-raccord" aria-hidden="true" />}

      {/* ═══ L'ANNEAU ═══
          « Le chrono devrait être très différent, comme l'acteur principal. »
          Il l'est enfin : un disque cerclé de rouge, posé à cheval sur la
          photo, à la hauteur du regard. Sans Flash, le même disque porte ce que
          le commerçant propose en ce moment — l'écran le fournit. */}
      {sec && c.flash && (
        <div className="cd-anneau chrono" aria-label={`Il reste ${c.flash.reste}`}>
          {/* ═══ LE CADRAN EST DESSINÉ, PLUS BRICOLÉ ═══
              « Le rond flash est très mal réalisé, il faut revoir le visuel
              pour que ce soit parfait. »

              IL ÉTAIT FAIT DE BORDURES ET DE MASQUES. Un cercle en `border`, un
              second en dégradé conique masqué par un radial : trois techniques
              empilées pour dessiner deux cercles, avec un demi-pixel de décalage
              entre elles selon la densité de l'écran — d'où l'aspect sale.

              DEUX CERCLES SVG FONT LA MÊME CHOSE, EXACTEMENT. Une piste, un arc
              qui la recouvre sur la part écoulée, tracés au même rayon, sur la
              même grille : aucun décalage possible, et l'arc part de midi et
              tourne dans le sens des aiguilles, comme sur une montre. */}
          <svg className="cd-an-c" viewBox="0 0 100 100" aria-hidden="true">
            {/* L'ARC N'EST PAS D'UNE SEULE COULEUR : il chauffe en descendant,
                comme la lumiere du soir sur la maquette. Un degre de plus, et
                l'oeil suit le sens de rotation sans y penser. */}
            <defs>
              {/* ─── ORANGE VERS ROUGE FEU, COMME LA MAQUETTE ───
                  « La couleur du cercle devrait etre un degrade orange rouge
                  feu comme sur la photo originale. » Le premier degrade partait
                  d'un abricot pale : sur une photo de plat, deja chaude et deja
                  claire, il se fondait dedans. Il part maintenant d'un orange
                  franc et finit sur un rouge, et c'est ce contraste-la qui fait
                  qu'un cadran se voit avant d'etre lu. */}
              <linearGradient id="cdAnG" x1="0" y1="0" x2=".85" y2="1">
                <stop offset="0%" stopColor="#FFB02E" />
                <stop offset="48%" stopColor="#FF6A1F" />
                <stop offset="100%" stopColor="#F5232E" />
              </linearGradient>
            </defs>
            <circle className="cd-an-p" cx="50" cy="50" r="44.5" />
            <circle
              className="cd-an-a"
              cx="50"
              cy="50"
              r="44.5"
              style={{
                // 2 pi r, avec r = 44.5 : le rayon a baisse d'un point pour que
                // le trait epaissi tienne dans la boite, la circonference suit.
                strokeDasharray: `${(1 - c.flash.part) * 279.6} 279.6`,
              }}
            />
          </svg>
          <span className="cd-an-t">Il reste</span>
          <b>{c.flash.reste.replace(/[^0-9]/g, "") || "0"}</b>
          <em>min</em>
          {/* LA PART ÉCOULÉE FAIT LE TOUR DU DISQUE. Une barre droite disait le
              temps qui passe ; sur un disque, le tour est plus fort — on lit un
              cadran sans avoir à lire un chiffre. */}
          {/* ─── ET LA RARETÉ RESTE ÉCRITE ───
              « Il faudrait quelque chose qui permette en une seconde de
              comprendre que c'est une annonce spéciale ET RARE. » Le compte à
              rebours dit « c'est urgent » ; rien ne dit « ça n'arrive presque
              jamais », et la rareté est la moitié de la valeur.

              LA MAQUETTE N'EN VOULAIT PLUS DANS LE TITRE, et elle a raison —
              c'était la quatrième ligne d'un bloc qui en avait déjà trois. Elle
              descend donc sous l'anneau, en petit : elle annote l'objet dont
              elle parle, et ne dispute plus rien au plat. */}
          <s className="cd-an-r">3 fois par semaine, pas plus</s>
        </div>
      )}
      {sec && !c.flash && anneau}

      {/* LA PASTILLE DU HAUT N'EXISTE QUE SUR LA FICHE. Sur la seconde face,
          « jusqu'à quand » est descendu dans le bloc central, avec le reste de
          la décision : une échéance lue à l'autre bout de l'écran du prix ne
          se rattache à rien, et elle occupait le seul coin qui pouvait rester
          vide. */}
      {c.reste && !sec && (
        <span className="cd-reste"><i aria-hidden="true">⏳</i>{c.reste}</span>
      )}
      {/* « Y ALLER » EN HAUT À DROITE, à l'opposé du compte à rebours : c'est
          la seule action de la carte qui ne concerne pas le swipe, et la mettre
          en bas la ferait confondre avec les trois gestes. */}
      {/* IL N'EXISTE PAS NON PLUS SUR LA SECONDE FACE. Un itinéraire est un
          outil, pas une décision : il se prend une fois qu'on a choisi, et il
          est déjà en bas de la fiche, pleine largeur. Posé sur la photo, il
          faisait le troisième objet coloré d'un écran qui n'en veut qu'un —
          et sur un événement, où la troisième action de la barre DEVIENT
          « Y aller », on le lisait deux fois. */}
      {c.itineraire && !sec && (
        <a className="cd-aller" href={c.itineraire} target="_blank" rel="noreferrer noopener">
          <i aria-hidden="true">↗</i>Y aller
        </a>
      )}

      <div className="cd-bas">
        {sec ? (
          /* ─── L'ORDRE DE LA DÉCISION ───
             Ce que c'est (la nature), ce que c'est vraiment (l'offre), ce que
             ça coûte, chez qui, jusqu'à quand. Cinq lignes, dans cet ordre-là,
             et rien entre elles.

             LA NATURE RETOMBE SUR LE MÉTIER quand l'annonce n'en porte pas :
             « BOULANGERIE » au-dessus de « La tourte de seigle » se lit aussi
             bien que « SORTIE DU FOUR », et le métier ne se répète pas plus
             bas — la ligne du commerce ne porte que son nom, sa ville et sa
             distance. */
          <div className="cd-dit">
            {/* ─── LE MOMENT, ET IL PASSE AVANT LE MÉTIER ───
                Un point qui bat, et l'heure. Rien d'autre : le mot « direct »
                a été écarté exprès — il promet une caméra allumée, donc
                quelqu'un qui parle, donc une performance, c'est-à-dire tout ce
                qui fait fuir un commerçant. Ici on ne lui demande rien de plus
                que ce qu'il fait déjà ; c'est le produit qui date ce qu'il
                dit. */}
            {/* ═══ ⚡ LE TEMPS QUI PASSE EST L'INFORMATION ═══
                « Le minuteur est essentiel. Mais attention : pas un gros
                compteur anxiogène façon site de e-commerce. Quelque chose de
                très simple : encore 23 min, avec une petite barre qui descend.
                Le temps qui passe devient lui-même une information. »

                PAS DE SECONDES, ET C'EST LE POINT. Un chronomètre à la seconde
                transforme une bonne nouvelle en pression — le genre de pression
                qu'on ne pardonne pas à un commerce de son quartier. La minute
                suffit à faire comprendre qu'il faut décider maintenant.

                ET IL REMPLACE LA FRAÎCHEUR. « Il y a 12 min » et « encore
                23 min » sont deux comptes de temps qui vont dans des directions
                opposées ; posés l'un sur l'autre, on ne sait plus lequel
                compte. Sur un Flash, un seul compte : celui qui descend. */}
            {/* ─── LE CHRONO EST LE PERSONNAGE PRINCIPAL ───
                « Le chrono devrait être très différent, comme l'acteur
                principal, et le prix aussi. » C'est juste : sur un Flash, la
                seule question est « est-ce que j'ai le temps ? ». Le nombre de
                minutes est donc écrit à la taille d'un prix, l'unité en petit à
                côté, et la barre passe dessous sur toute la largeur du bloc.
                Ce qui était une pastille de douze points devient le premier
                objet que l'œil rencontre. */}
            {/* ─── ⚡ ET « IL Y A N MIN » A DISPARU ───
                « Il y a 1 h : cette indication n'a aucun intérêt, donc à
                supprimer en haut de l'annonce. »

                C'est juste, et on l'avait déjà à moitié admis en la réduisant à
                un texte discret. Ce qui intéresse quelqu'un devant une annonce
                n'est pas depuis quand elle existe, c'est si c'est encore
                disponible — et ça, la journée juste dessous le dit heure par
                heure. Une information qu'on garde parce qu'elle est vraie, et
                non parce qu'elle sert, finit par occuper la place de celles qui
                servent.

                LE COMPTE À REBOURS DU FLASH, LUI, RESTE : il ne dit pas depuis
                quand, il dit COMBIEN DE TEMPS ENCORE. Ce sont deux mesures de
                temps opposées, et une seule fait décider. */}
            {/* ═══ « ÇA VIENT DE TOMBER ! » ═══
                La maquette met en haut, centrée, une pastille ambre à éclair.
                Elle dit en trois mots ce que l'ancien bloc disait en quatre
                lignes empilées — Flash, « 3 fois par semaine », le nombre de
                minutes, une barre. Le compte à rebours, lui, a quitté le texte
                pour devenir un objet : l'anneau, à droite, posé sur la photo.
                Deux objets qui se voient de loin, au lieu d'un paragraphe. */}
            {c.flash && (
              <span className="cd-tombe">
                {/* LES ÉTINCELLES DE LA MAQUETTE — trois traits de chaque côté,
                    comme un « pop » de bande dessinée. Elles ne disent rien de
                    plus que la pastille ; elles disent qu'il faut la regarder,
                    et c'est exactement ce qu'on lui demande. */}
                <b aria-hidden="true" />
                <i aria-hidden="true">⚡</i>
                Ça vient de tomber !
                <b aria-hidden="true" />
              </span>
            )}
            {/* ─── LE MÉTIER DESCEND, L'ÉTIQUETTE RESTE ───
                LA MAQUETTE NE VEUT PAS DE « RESTAURANT » AU-DESSUS DU TITRE, et
                elle a raison : c'est une ligne qu'on lit avant celle qui
                compte. Le métier n'est pas perdu pour autant — « quand on est
                sur l'app on ne sait pas trop ce qu'on regarde, si c'est un
                magasin de vêtements, une boucherie ou un coiffeur » — il
                descend dans la fiche du commerce, à côté de sa note, là où l'on
                répond à « chez qui ».

                L'ÉTIQUETTE, ELLE, NE BOUGE PAS. « OFFERT », « MENU DU JOUR » ne
                disent pas chez qui : elles disent ce QU'EST cette annonce, et
                leur place est donc collée au titre. Retirées avec le métier,
                elles emportaient « OFFERT » — c'est-à-dire la seule mention qui
                change le sens d'un prix. */}
            {/* ═══ « EN CE MOMENT » PASSE EN TÊTE, ET C'EST LA MAQUETTE ═════

                ELLE EN FAIT LA PREMIÈRE CHOSE QU'ON LIT, avant même le titre :
                une pastille rose avec un éclair, tout en haut à gauche. C'était
                la DERNIÈRE du bloc, sous le nom du commerce, en gris — donc
                sous le pli sur la moitié des cartes, alors que c'est elle qui
                répond à la seule question que « le direct » pose : est-ce que
                ça se passe MAINTENANT ?

                ELLE DIT AUSSI « DEMAIN », et c'est ce qui la rend honnête. Un
                commerce fermé le soir montre le programme qu'il a déjà donné,
                marqué du lendemain — voir `momentsRestants`. La pastille change
                alors de couleur en même temps que de mot : on ne fait pas
                passer un programme de demain pour un moment en cours. */}
            {c.reste && (
              <span
                className={`cd-quand${/^demain/i.test(c.reste) ? " demain" : " vif"}`}
              >
                <i aria-hidden="true">{/^demain/i.test(c.reste) ? "🌙" : "⚡"}</i>
                {c.reste}
              </span>
            )}
            {(c.etiquette || (!sec && c.metier)) && (
              <p className="cd-nature">
                {!sec && c.metier && (
                  <b>
                    {c.metierEmoji && <i aria-hidden="true">{c.metierEmoji}</i>}
                    {c.metier}
                  </b>
                )}
                {c.etiquette && <s>{c.etiquette}</s>}
              </p>
            )}
            {/* LE TITRE CHANGE DE TON, PAS DE PLACE NI DE TAILLE.
                `gras` crie l'offre (un plat, une tournée), `editorial` la
                présente (une pièce, une coupe, un bouquet), `clair` l'annonce
                (un concert, un poste). Trois tons, pas neuf polices : une police
                par métier ferait neuf applications. Voir `Personnalite.titre`. */}
            <h2
              className={`cd-offre t-${c.langage?.titre ?? "gras"}${
                c.quoi.length > 22 ? " long" : c.quoi.length > 14 ? " moyen" : ""
              }`}
            >
              {/* ═══ « LA FOURNÉE DE 7 H » NE LAISSE PLUS SON « H » TOUT SEUL ══

                  VU SUR LA MÊME CAPTURE QUE LE ROND. Le titre s'écrivait « LA
                  FOURNÉE DE 7 » sur la première ligne et « H » sur la seconde
                  — une lettre isolée en capitales de soixante points, ce qui se
                  lit comme un bug avant de se lire comme une heure.

                  LA RÈGLE EXISTAIT DÉJÀ, elle n'était simplement pas appliquée
                  ici : `insecable` colle l'unité à son nombre, et c'est elle
                  qui a réparé « 8,40 € » coupé avant son euro. Un titre est
                  exactement le même cas, en plus gros — donc en pire. */}
              {insecable(c.quoi)}
            </h2>
            {/* LE DÉTAIL RESTE, MAIS IL A CESSÉ D'ÊTRE UN BLOC. Sur une
                invitation, c'est le mot du commerçant : le supprimer ferait
                d'un message adressé une annonce de plus. Sur un menu, c'est la
                composition du plat. Deux lignes au maximum, et petites : entre
                le titre en serif et le prix, il n'a aucune chance de prendre
                le dessus. */}
            {/* ─── SA VOIX PREND LA PLACE DU DÉTAIL ───
                Et seulement si elle existe : sans conseil, la ligne de détail
                est exactement celle d'avant. Le conseil est en serif et entre
                guillemets — c'est quelqu'un qui parle, pas une description —
                et il est signé d'un rond et d'un prénom. Dans un paquet de
                huit restaurants, celui qui a un visage et une phrase est le
                seul qu'on retient. */}
            {/* ─── LA CITATION A DESCENDU D'UNE COUCHE ───
                « Dans une interface où l'utilisateur est déjà confronté à
                beaucoup d'informations, ce n'est pas prioritaire. » Elle
                passait AVANT le prix et l'heure — avant les deux choses qui
                font décider — et elle coûtait cinquante points sur la seule
                zone où l'on choisit d'y aller ou non. On la retrouve sous le
                pli, dans « Ce qu'il en dit », au moment où l'on veut en savoir
                plus. Le FILM, lui, reste : ce n'est pas une phrase à lire,
                c'est un visage qui bouge, et il se regarde en une demi-seconde
                sans rien coûter à la lecture. */}
            {c.conseil && c.voix?.video ? (
              <p className={`cd-conseil${c.voix.video ? " film" : ""}`}>
                {/* ─── LE ROND, ET CE QU'IL Y A DEDANS ───
                    Trois états, du plus riche au plus pauvre, et le dernier
                    est celui de presque tout le monde : sa vidéo, sa photo,
                    ou son initiale.

                    ET LA TAILLE SUIT CE QU'IL Y A DEDANS. Une initiale n'a
                    rien à montrer : trente-quatre pixels lui suffisent, et
                    plus grand elle deviendrait un bandeau. Une vidéo a
                    quelque chose à montrer, et à trente-quatre pixels elle ne
                    le montrait pas — « on ne voit quasiment rien ». Le rond
                    double donc quand il y a un film, et seulement là. */}
                <span
                  className={`cd-tete${c.voix.video ? " film" : ""}`}
                  aria-hidden="true"
                >
                  {c.voix.video ? (
                    <video
                      poster={c.voix.video.affiche}
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="metadata"
                    >
                      {c.voix.video.webm && (
                        <source src={c.voix.video.webm} type="video/webm" />
                      )}
                      <source src={c.voix.video.mp4} type="video/mp4" />
                    </video>
                  ) : c.voix.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.voix.portrait} alt="" />
                  ) : (
                    c.voix.prenom.slice(0, 1)
                  )}
                </span>
                <span>
                  <em>{c.conseil}</em>
                  <s>
                    {c.voix.prenom}
                    {c.voix.role ? `, ${c.voix.role}` : ""}
                  </s>
                </span>
              </p>
            ) : (
              !!c.lignes?.length && (
                <p className="cd-detail">{c.lignes.slice(0, 2).join(" · ")}</p>
              )
            )}
            {/* ─── ET LE PRIX PORTE LA MÊME EXCEPTION ───
                Sur un Flash, l'ancien prix n'est pas une mention légale : c'est
                la MOITIÉ de l'information. Il passe donc à gauche, gros et
                barré, et le nouveau à droite en ambre — on lit la chute, pas un
                prix avec une note de bas de page. */}
            {/* ─── L'AVANTAGE, ENFIN À SA TAILLE ───
                Il vivait dans le détail : « −20 % » en gris clair de douze
                points, sous le titre, au milieu des ingrédients. C'est
                pourtant la seule chose qui fasse sortir de chez soi dans les
                trente minutes qui viennent. Ambre comme le chrono — l'un dit
                combien de temps il reste, l'autre dit pourquoi se lever, et
                ils ne se lisent pas l'un sans l'autre. */}
            {c.flash?.avantage && <p className="cd-flash-a">{c.flash.avantage}</p>}
            {/* ─── L'AMBRE EST RÉSERVÉE À UNE VRAIE CHUTE ───
                Un prix ambre sur un Flash veut dire « voilà ce que ça coûte
                MAINTENANT ». Quand le commerçant n'a pas donné de prix
                d'après — son avantage est « le dessert offert » —, le seul
                nombre affiché est le prix habituel : le peindre en ambre sous
                « −20 % » le ferait passer pour le prix remisé. Il reste donc
                blanc, comme sur n'importe quelle autre carte, et c'est
                l'avantage juste au-dessus qui porte la couleur. */}
            {(c.prix || c.prixBarre) && (
              /* ═══ UN SALAIRE N'EST PAS UN PRIX, ET IL NE S'ECRIT PAS PAREIL ══

                  « 480 € net par mois » occupait TROIS LIGNES de soixante-dix
                  points et mangeait la moitie de la carte. Le corps d'affiche a
                  ete choisi pour « 8,40 € » — un nombre qu'on lit d'un coup, de
                  loin, et qui fait lever de sa chaise. Une offre d'emploi ecrit
                  une PHRASE : le montant, ce qu'il est net ou brut, et par quoi
                  il se divise. Les trois comptent, et aucune ne se crie.

                  DEUX PALIERS, MESURES SUR LE NOMBRE DE SIGNES, exactement comme
                  le titre juste au-dessus — c'est la meme regle et il n'y a
                  aucune raison qu'elle change de forme d'un element a l'autre. */
              <p
                className={`cd-prixg${c.flash && c.prixBarre ? " flash" : ""}${
                  (c.prix ?? "").length > 18 ? " long" : (c.prix ?? "").length > 11 ? " moyen" : ""
                }`}
              >
                <b>
                  {/* ═══ « À PARTIR DE » N'EST PAS UN PRIX ═══

                      MESURE : « à partir de 12 € » s'affichait en quatre-vingts
                      points, débordait sur deux lignes et passait sous l'anneau
                      du métier. Le nombre, lui, tient en un mot.

                      LE QUALIFICATIF EST UNE CONDITION, PAS UN MONTANT. « Dès »,
                      « environ », « à partir de » disent COMMENT lire le chiffre ;
                      les composer à la taille du chiffre, c'est crier une nuance.
                      Il passe en petit au-dessus, le nombre garde sa taille
                      d'affiche, et la carte cesse de déborder — sans qu'on ait
                      rapetissé le seul élément qui fait décider. */}
                  {qualifie(c.prix).avant ? <u>{qualifie(c.prix).avant}</u> : null}
                  {qualifie(c.prix).nombre}
                  {/* L'ASTÉRISQUE DE LA MAQUETTE. Un prix d'annonce a toujours
                      une condition — dans la limite du stock, sur place, pendant
                      le Flash — et l'astérisque est le signe que tout le monde
                      lit sans y penser. Ce qu'il annonce est écrit juste
                      dessous, en toutes lettres : « il en reste 8 », « ensuite,
                      au prix habituel ». */}
                  {c.prixBarre && <em>*</em>}
                </b>
                {c.prixBarre && <s>{insecable(c.prixBarre)}</s>}
              </p>
            )}
            {/* ─── CE QUE LE FLASH NE REMPLACE PAS ───
                « Quand il y a le menu du jour affiché et qu'en même temps il y
                a un Flash, y a-t-il deux annonces séparées ou une seule, et
                alors que montre-t-on ? » Une seule : un commerce n'occupe
                jamais deux cartes. Pendant le Flash, la carte EST le Flash — et
                cette ligne dit ce qui l'attend derrière, pour qu'on ne croie
                pas que le reste de la journée a été annulé. */}
            {/* ─── COMBIEN IL EN RESTE, SOUS LE PRIX ───
                La maquette l'écrit petit, juste sous le chiffre, avec le
                nombre en ambre : « Il en reste 8 ». C'est la troisième
                question de quelqu'un qui regarde une annonce — après « c'est
                quoi » et « c'est combien » — et elle n'avait sa réponse que
                sous le pli. Elle ne s'affiche que si le commerçant l'a dite :
                on ne compte jamais à sa place. */}
            {/* ON DIT TROIS QUOI. « Il en reste 3 » est vrai partout et ne veut
                rien dire nulle part : trois tables, trois bouquets, trois
                créneaux ? Le mot compte plus que le nombre — il dit ce qu'on
                vient chercher. Voir `Personnalite.unite`. */}
            {/* ═══ LES QUATRE LIGNES DE LA MAQUETTE ════════════════════════

                « Le design des restaurants, bars et événements n'a pas été
                modifié comme sur le screenshot que je t'avais donné. »

                ELLES RÉPONDENT AUX QUATRE QUESTIONS QU'ON SE POSE DEVANT UNE
                ANNONCE, dans l'ordre où on se les pose : est-ce qu'il en reste,
                est-ce que c'est loin, est-ce que d'autres y vont, est-ce que
                c'est bien. Trois existaient, éparpillées — le compte sous le
                prix, la distance en pied de carte, la note nulle part. Séparées,
                chacune se lisait comme un détail ; alignées avec leur
                pictogramme, elles se lisent comme une fiche.

                CHAQUE LIGNE NE S'ÉCRIT QUE SI SA DONNÉE EXISTE. Un commerçant
                qui n'a pas dit combien il en reste n'a pas de première ligne —
                on ne compte jamais à sa place, et une fiche à trous vaut mieux
                qu'une fiche inventée. */}
            <ul className="cd-infos">
              {c.combien != null && c.combien > 0 && (
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9.2" />
                    <path d="M12 6.6V12l3.6 2.2" />
                  </svg>
                  {/* ═══ « IL RESTE N », ET PAS « N RESTANTES » ═══════════════

                      DEUX RAISONS, ET LA PREMIÈRE EST UNE FAUTE. « 12 bouquets
                      restantes » : le mot du métier vient des données — part,
                      place, bouquet, créneau, pièce — et son genre avec lui.
                      Accorder l'adjectif ici revenait à parier, et le pari
                      était toujours au féminin. « Il reste » ne s'accorde avec
                      rien.

                      LA SECONDE EST QUE CE NOMBRE DOIT SE LIRE COMME UN
                      DÉCOMPTE. « Il reste 12 » dit qu'il en restait treize ;
                      « 12 restantes » décrit un stock. C'est la même
                      information et ce n'est pas la même phrase. */}
                  <span>
                    Il reste <b>{c.combien}</b>
                    {c.langage ? ` ${c.langage.unite[c.combien > 1 ? 1 : 0]}` : ""}
                  </span>
                </li>
              )}
              {!!c.distance && (
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21.4s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
                    <circle cx="12" cy="10.2" r="2.6" />
                  </svg>
                  <span>
                    À {c.distance.replace(/ /g, "\u00a0")}
                    <i>{c.ville}</i>
                  </span>
                </li>
              )}
              {/* ═══ DEUX LIGNES SUPPRIMÉES, ET C'EST LUI QUI LES A COUPÉES ═══

                  « +347 clients ce mois-ci : supprimer, on ne peut pas le
                  savoir et ce n'est pas une info très intéressante. »

                  IL A DOUBLEMENT RAISON. Le nombre était de la fiction déclarée
                  — assumée — mais aucune de ces deux lignes ne se lit : la
                  première ne change aucune décision (on ne choisit pas un
                  restaurant parce que trois cents personnes y sont allées le
                  mois dernier), et un nombre qu'on ne saura jamais compter en
                  vrai est un nombre qu'il faudra retirer le jour du lancement.

                  « 4,9 (47 avis) : supprimer puisqu'on a déjà l'info plus bas. »
                  Elle est écrite deux fois sur le même écran, à trois cents
                  points d'écart. Une information répétée n'est pas deux fois
                  plus lue ; elle prend deux fois la place.

                  IL RESTE LES DEUX QUI DÉCIDENT : combien il en reste, et à
                  quelle distance c'est. */}
            </ul>
            {c.flash?.continue && <p className="cd-flash-s">{c.flash.continue}</p>}
            {/* LE NOM DU COMMERCE EST LISIBLE, ET IL N'EST PLUS LE TITRE.
                Demande explicite, et elle est juste : « si c'est un restaurant
                que je n'aime pas, alors quoi qu'il serve je n'irai pas, donc
                j'ai besoin de le savoir ». C'est une information de décision —
                elle a la taille d'une information. */}
            <p className="cd-chez">
              {c.nom}
              <s>
                {" · "}
                {c.ville}
                {/* L'ESPACE DE « 210 m » EST INSÉCABLE, et ce n'est pas du
                    zèle : sur une enseigne un peu longue, la ligne se coupait
                    entre le nombre et son unité et laissait un « m » tout seul
                    sur la ligne suivante. Vu sur « Une boutique de la rue
                    piétonne · Dax · 210 m », à 390 points. */}
                {c.distance ? ` · ${c.distance.replace(/ /g, " ")}` : ""}
              </s>
            </p>
            {c.social && <span className="cd-social">💚 {c.social}</span>}
            {/* ═══ SES AUTRES PHOTOS, SOUS L'ANNONCE ═══════════════════════

                « Quand on appuie sur une photo, elle se met à la place de la
                grande photo plein écran qu'on a déjà quand on arrive sur
                l'annonce. »

                POURQUOI ICI ET PAS PLUS HAUT. La bande est le dernier étage de
                la carte : au-dessus se trouve tout ce qui décide — ce qui est
                proposé, le prix, ce qu'il reste, où c'est. Les photos de sa
                fiche ne décident de rien, elles rassurent. Posées avant le
                prix, elles auraient repoussé sous le pli la seule ligne pour
                laquelle on s'est arrêté.

                LE GESTE S'ARRÊTE LÀ. `stopPropagation` sur l'appui, parce que
                la carte entière est une surface de balayage : sans lui, choisir
                une vignette faisait glisser le paquet d'un commerce, et on
                regardait la photo d'à côté. */}
            {photos.length > 0 && (
              <ul
                className="cd-bande"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {photos.map((p) => (
                  <li key={p.src}>
                    <button
                      type="button"
                      className={`cd-vig${p.src === auMur ? " vue" : ""}`}
                      aria-pressed={p.src === auMur}
                      aria-label={p.quoi}
                      title={p.quoi}
                      onClick={() => setRegardee(p.src)}
                      style={{ backgroundImage: `url("${encodeURI(p.src)}")` }}
                    />
                  </li>
                ))}
              </ul>
            )}
            {/* CE QU'ON REGARDE EST NOMMÉ, ET C'EST LA MOITIÉ DU TRAVAIL. « La
                salle » et « Axoa de veau, un AUTRE JOUR » ne disent pas la même
                chose : sans la légende, on ne sait pas si le plat à l'écran est
                servi aujourd'hui — exactement la confusion qu'une carte du jour
                existe pour éviter. Elle n'apparaît qu'une fois qu'on a choisi :
                sur la photo de l'annonce, le titre juste au-dessus le dit
                déjà. */}
            {!!regardee && (
              <p className="cd-bande-l">
                {photos.find((p) => p.src === regardee)?.quoi}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="cd-nom">{c.nom}</div>
            <div className="cd-ou">
              <i aria-hidden="true">📍</i>{c.metier} · {c.ville}
              {c.distance && <b>{c.distance}</b>}
            </div>
            {c.social && <div className="cd-social"><i aria-hidden="true">💚</i>{c.social}</div>}

            <div className="cd-quoi"><i aria-hidden="true">{c.icone}</i>{c.quoi}</div>
            {!!c.lignes?.length && (
              <div className="cd-lignes">
                {c.lignes.map((l) => (<span key={l}>{l}</span>))}
              </div>
            )}
            {(c.prix || c.etiquette) && (
              <div className="cd-prix">
                {c.prix && <b>{c.prix}</b>}
                {c.prixBarre && <s>{insecable(c.prixBarre)}</s>}
                {c.etiquette && <em>{c.etiquette}</em>}
              </div>
            )}
          </>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * LA MÊME CARTE, EN CHAÎNE DE CARACTÈRES.
 *
 * POURQUOI CETTE SECONDE ÉCRITURE EXISTE. La démonstration du site joue ses
 * séquences dans une scène qu'elle remplit par `innerHTML` : une minuterie
 * remplace le contenu toutes les deux secondes, sans repasser par React. On ne
 * peut donc pas y monter `<CarteSwipe>`.
 *
 * Elle vit ICI, collée à la version JSX et à la feuille de styles, parce que
 * l'alternative — un dessin de carte écrit dans le fichier de la démo — est
 * exactement ce qu'on vient de supprimer : deux cartes différentes, celle qu'on
 * promet et celle qu'on livre. Deux rendus, UN seul jeu de classes et UN seul
 * type de données : le style ne peut plus diverger, seul l'ordre des blocs
 * pourrait, et il tient sur un écran.
 *
 * Tout ce qui vient du commerçant passe par `esc` — cette chaîne finit dans un
 * `innerHTML`, et un nom de commerce est une donnée, pas du balisage.
 */
export function carteDirectHtml(c: CarteDirect): string {
  const fond = c.photo
    ? ` style="background-image:url(&quot;${esc(encodeURI(c.photo))}&quot;),linear-gradient(155deg,#22463A,#0D1A15 70%);background-position:center ${esc(c.cadrage || "50%")}"`
    : "";
  return (
    `<div class="cd-carte">` +
      `<span class="cd-photo${c.photo ? "" : " sans"}"${fond}>${c.photo ? "" : `<span class="cd-ph">${esc(c.icone)}</span>`}</span>` +
      `<span class="cd-voile"></span>` +
      (c.reste ? `<span class="cd-reste"><i>⏳</i>${esc(c.reste)}</span>` : "") +
      (c.itineraire ? `<span class="cd-aller"><i>↗</i>Y aller</span>` : "") +
      `<span class="cd-bas">` +
        `<span class="cd-nom">${esc(c.nom)}</span>` +
        `<span class="cd-ou"><i>📍</i>${esc(c.metier)} · ${esc(c.ville)}${c.distance ? `<b>${esc(c.distance)}</b>` : ""}</span>` +
        (c.social ? `<span class="cd-social"><i>💚</i>${esc(c.social)}</span>` : "") +
        `<span class="cd-quoi"><i>${esc(c.icone)}</i>${esc(c.quoi)}</span>` +
        (c.lignes?.length
          ? `<span class="cd-lignes">${c.lignes.map((l) => `<span>${esc(l)}</span>`).join("")}</span>`
          : "") +
        (c.prix || c.etiquette
          ? `<span class="cd-prix">${c.prix ? `<b>${esc(c.prix)}</b>` : ""}${c.prixBarre ? `<s>${esc(c.prixBarre)}</s>` : ""}${c.etiquette ? `<em>${esc(c.etiquette)}</em>` : ""}</span>`
          : "") +
      `</span>` +
    `</div>`
  );
}

/** Les trois gestes, en chaîne — même raison, même contrat que ci-dessus. */
export function gestesDirectHtml(action = "Je veux"): string {
  return (
    `<div class="cd-gestes">` +
      `<span class="cd-g"><i>✕</i><em>Passer</em></span>` +
      `<span class="cd-g grand"><i>♥</i><em>${esc(action)}</em></span>` +
      `<span class="cd-g"><i>↑</i><em>Le pro</em></span>` +
    `</div>`
  );
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * LES STYLES DE LA CARTE, posés une seule fois par écran.
 *
 * Ils voyagent avec le composant plutôt que de vivre dans la feuille de la
 * démonstration : c'est ce qui permet au fil de la ville de servir exactement
 * la même carte, sans recopier trois cents lignes qui divergeraient au premier
 * ajustement.
 */
export function StylesDirect() {
  return (
    <style
      /* UNE SEULE FOIS DANS LA PAGE, ET TOUJOURS AVANT LES SCÈNES.
         La page d'aperçu monte ce composant à deux endroits — la visite guidée
         et l'assistante — et les deux feuilles se retrouvaient dans le corps du
         document, la seconde APRÈS les styles de la visite. À spécificité
         égale, c'est la dernière qui gagne : `.cd-carte{max-width:340px}`
         écrasait le `.ph-carte{max-width:196px}` de l'acte 5, et la carte
         sortait de l'écran par le bas. Mesuré au navigateur : 340 px partout.
         `href` + `precedence` demandent à React de la remonter dans l'en-tête
         et de n'en garder qu'une. Les scènes gardent en plus une spécificité
         supérieure — l'ordre ne doit jamais être le seul garde-fou. */
      href="direct-carte-swipe"
      precedence="default"
      dangerouslySetInnerHTML={{
        __html: `
        .cd-barre{display:flex;align-items:center;gap:7px;width:100%;max-width:340px;margin:0 auto;
          font-family:'Inter',system-ui,sans-serif;}
        /* LE NOM SE COUPE PLUTÔT QUE DE PASSER PAR-DESSUS LES PASTILLES.
           Il portait un min-width nul sans rien pour retenir son texte : dans un
           cadre plus étroit que 340 px, « Clikme » débordait de sa case et
           s'imprimait SUR « votre ville » — vu sur la page d'accueil, où
           l'écran fait 280 px. */
        .cd-marque{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
          font-size:17px;font-weight:850;letter-spacing:-.03em;color:#fff;}
        .cd-puce{display:flex;align-items:center;gap:5px;flex:none;font-size:11.5px;font-weight:700;color:#D6DEE4;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 10px;}
        .cd-puce i{font-style:normal;font-size:11px;line-height:1;}
        .cd-puce b{font-weight:850;color:#fff;}
        .cd-puce.vert{color:#8FE9C4;border-color:rgba(126,230,192,.28);background:rgba(18,185,129,.14);}

        /* LA CARTE. Format portrait, comme un écran de téléphone tenu à la
           main : c'est la forme qui dit « ça se regarde en marchant ». */
        /* text-align:left EST INDISPENSABLE, pas cosmétique : la carte est
           servie dans des scènes qui centrent tout leur contenu (l'acte 3 de la
           visite guidée, par exemple). Sans elle, le menu s'affichait centré
           dans la démonstration et à gauche dans le vrai fil — deux cartes
           différentes, ce que ce fichier existe précisément pour empêcher. */
        /* ─── L'ACCENT DU METIER, POSE ICI ET NULLE PART AILLEURS ───
           IL SE LIT SUR LE METIER ET SOUS LE NOM DU COMMERCE, jamais sur un
           bouton : la menthe veut dire « ceci vous engage » dans tout le
           produit. Deux points d'ancrage suffisent pour qu'une friperie et un
           bar ne se ressemblent pas, sans qu'aucun des deux cesse d'etre
           ClikMe. Voir lib/direct/personnalites.ts.
           LA VALEUR PAR DEFAUT EST LE BLANC D'AVANT : une carte sans langage
           est exactement celle d'hier. */
        .cd-carte{--cd-accent:#EAF2EC;--cd-accent-encre:#0B141E;
          --cd-halo:rgba(61,226,166,.5);
          position:relative;width:100%;max-width:340px;aspect-ratio:3/4.15;border-radius:26px;overflow:hidden;
          text-align:left;
          background:#0C1310;box-shadow:0 40px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);
          font-family:'Inter',system-ui,sans-serif;isolation:isolate;}
        .cd-photo{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;}
        /* LE FILM OCCUPE EXACTEMENT LA PLACE DE LA PHOTO — meme cadre, meme
           recouvrement. « La photo doit rester la star » vaut pour lui aussi :
           il est le fond, jamais un lecteur pose dessus. */
        .cd-film{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;border:0;background:transparent;pointer-events:none;}
        .cd-photo.sans{display:flex;align-items:center;justify-content:center;
          background:linear-gradient(155deg,#22463A,#0D1A15 70%);}
        .cd-ph{font-size:74px;opacity:.5;}
        /* ═══ LE DEGRADE SERT LE TEXTE, IL N'ASSOMBRIT PAS LA PHOTO ═══
           « Je ne chercherais pas a assombrir fortement l'image. Le risque est
           que ClikMe perde justement ce qui fait son interet : voir le commerce
           reel. Le degrade sert le texte, il ne devient pas un element graphique
           en lui-meme. La photo doit rester la star. »

           CE QUI CHANGE : le haut de l'image etait deja voile a 30 % pour rien —
           il n'y a aucun texte la-haut. Il redevient transparent. Le bas
           s'assombrit plus TARD et plus FRANCHEMENT, la ou le texte commence :
           on gagne un tiers d'image visible ET du contraste sous les mots. */
        .cd-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(4,8,6,0) 0%,rgba(4,8,6,0) 38%,
            rgba(4,8,6,.34) 55%,rgba(4,8,6,.82) 76%,rgba(4,8,6,.97) 100%);}
        .cd-reste{position:absolute;left:14px;top:14px;display:flex;align-items:center;gap:6px;
          font-size:12px;font-weight:800;color:#fff;background:rgba(8,12,10,.62);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 11px;}
        .cd-reste i{font-style:normal;font-size:11px;line-height:1;}

        .cd-bas{position:absolute;left:0;right:0;bottom:0;padding:16px 16px 18px;display:flex;flex-direction:column;gap:5px;}
        /* Le nom en serif : c'est le seul mot de la carte qui appartient au
           commerçant, et il doit se lire comme une enseigne, pas comme une
           ligne de base de données. */
        .cd-nom{font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.06;font-weight:700;color:#fff;
          text-shadow:0 2px 18px rgba(0,0,0,.7);}
        .cd-ou{display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:#CBD7D0;}
        .cd-ou i{font-style:normal;font-size:11px;line-height:1;}
        /* La distance est le seul chiffre de cette ligne : elle a droit au
           blanc, le reste est en gris. */
        .cd-ou b{font-weight:850;color:#fff;font-variant-numeric:tabular-nums;}
        .cd-ou b::before{content:"·";margin-right:5px;color:#7E938A;font-weight:600;}
        .cd-aller{position:absolute;right:14px;top:14px;z-index:3;display:flex;align-items:center;gap:5px;
          font-size:12px;font-weight:850;color:#04150E;text-decoration:none;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;padding:7px 12px;
          box-shadow:0 10px 24px -10px rgba(18,185,129,.9);}
        .cd-aller i{font-style:normal;font-size:11px;line-height:1;}
        .cd-social{align-self:flex-start;display:flex;align-items:center;gap:6px;margin-top:3px;
          font-size:12px;font-weight:800;color:#8FE9C4;background:rgba(18,185,129,.16);
          border:1px solid rgba(126,230,192,.3);border-radius:999px;padding:5px 11px;}
        .cd-social i{font-style:normal;font-size:11px;line-height:1;}
        .cd-quoi{display:flex;align-items:center;gap:7px;margin-top:8px;font-size:14.5px;font-weight:750;color:#fff;}
        .cd-quoi i{font-style:normal;font-size:14px;line-height:1;flex:none;}
        .cd-lignes{display:flex;flex-direction:column;gap:2px;padding-left:22px;}
        .cd-lignes span{font-size:12.5px;line-height:1.35;color:#C4D2CA;}
        .cd-prix{display:flex;align-items:baseline;gap:9px;margin-top:7px;}
        .cd-prix b{font-size:26px;font-weight:850;letter-spacing:-.035em;color:#3DE2A6;line-height:1;}
        .cd-prix s{font-size:13px;color:#93A79C;}
        .cd-prix em{font-style:normal;font-size:10.5px;font-weight:850;letter-spacing:.08em;color:#3A2A00;
          background:#FFC400;border-radius:6px;padding:4px 8px;}

        /* ═══ LA SECONDE FACE — CE QU'ON DOIT COMPRENDRE EN UNE SECONDE ═══
           Voir le type FaceCarte, plus haut, pour ce qu'elle corrige.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS.

           LE VOILE NE COUVRE PLUS LA PHOTO, IL MONTE SOUS LE TEXTE. Un voile
           uniforme eteignait la seule chose qui donne faim ; celui-ci laisse
           le milieu de l'image en pleine lumiere et ne s'epaissit que la ou
           il y a des mots. Il garde un souffle en haut, parce que le bandeau
           des filtres et les deux pastilles y vivent.

           IL N'EST PAS UNE PREFERENCE, C'EST UNE CONDITION. Mesure faite sur
           la meme annonce avec une photo de commercant ordinaire — claire,
           plate, au neon : sans voile, le titre et le prix se perdent dans
           l'assiette. La face ne tient que parce que ce degrade est la. */
        /* LE VOILE A SUIVI LE TEXTE. Il s'epaississait en bas, parce que le
           bloc y vivait ; le titre est remonte en haut a gauche et le voile
           avec lui. Le milieu de l'image reste en pleine lumiere — c'est la
           seule chose qui donne faim — et il redescend sous la fiche du
           commerce. Mesure faite sur une terrasse en plein soleil, la photo la
           plus claire du paquet : sans ces deux epaisseurs, « Il en reste 3 »
           et le nom du commerce disparaissent. */
        /* ═══ LA PHOTO EST UN FOND, PLUS UNE BANDE ═══

           CETTE REGLE A ETE ECRITE DEUX FOIS, DANS LES DEUX SENS, ET LES DEUX
           FOIS SUR MAQUETTE. La precedente disait « le texte est pose sur du
           NOIR, et la photo commence nettement en dessous » : un volet opaque de
           zero a trente-quatre pour cent, une ouverture franche, un second volet
           a partir de soixante-dix. Mesure de ce que ca donnait : LA PHOTO
           N'ETAIT VISIBLE QUE SUR VINGT ET UN POUR CENT DE LA HAUTEUR.

           « La photo aussi est entiere depuis le haut, alors que pour l'instant
           elle est au centre et cachee en haut ? » — exact, et c'est le chiffre
           ci-dessus. Chez un fleuriste, un boulanger, un restaurant, LA PHOTO
           EST LA DECISION : en cacher les quatre cinquiemes pour qu'un titre
           soit propre est un prix trop eleve.

           LE REMEDE N'EST NI LE VOLET NI LE TEXTE NU. Un volet garantit la
           lisibilite mais tue l'image ; du blanc pose sur une photo claire
           devient illisible des qu'on tombe sur une assiette blanche ou une
           terrasse en plein soleil — mesure deja faite, c'est ce qui avait
           justifie le volet. Un degrade CONTINU fait les deux : dense sur le
           premier tiers ou vit le titre, transparent au milieu, et se refermant
           sous la fiche du commerce. La photo court du haut de l'ecran jusqu'aux
           boutons, sans coupure. */
        .cd-carte.sec .cd-voile{background:linear-gradient(180deg,
          rgba(5,8,7,.74) 0%,rgba(5,8,7,.58) 12%,rgba(5,8,7,.34) 24%,
          rgba(5,8,7,.12) 34%,rgba(5,8,7,0) 44%,rgba(5,8,7,0) 57%,
          rgba(5,8,7,.42) 67%,rgba(5,8,7,.78) 78%,
          rgba(5,8,7,.94) 89%,#050807 100%);}

        /* ═══ LA NOUVELLE ORGANISATION : LE TITRE EN HAUT, A GAUCHE ═══

           CE QUI CHANGE, ET POURQUOI. Le bloc etait centre et pose en bas de la
           photo : « un bloc centre se lit d'un coup », ce qui etait vrai tant
           qu'il tenait en quatre lignes moyennes. La maquette demande autre
           chose, et c'est plus juste — un titre d'AFFICHE, cale en haut a
           gauche, ou l'oeil commence. Centre, un titre de deux mots flotte ;
           cale a gauche, il a un bord, donc une force.

           ET LE BAS SE LIBERE POUR LA FICHE DU COMMERCE. Le nom, ses avis, son
           programme et sa photo forment maintenant un rectangle pose sur la
           photo — voir .ap-fiche dans l'ecran habitant. Le haut dit CE QUE C'EST
           ET COMBIEN, le bas dit CHEZ QUI. Deux blocs, deux questions, et
           plus rien d'empile. */
        .cd-carte.sec .cd-bas{inset:0;justify-content:flex-start;
          align-items:stretch;text-align:left;gap:0;
          padding:calc(8px + env(safe-area-inset-top)) 16px 14px;}
        /* LE TITRE EN HAUT, LE RESTE EN BAS, ET LA PHOTO RESPIRE ENTRE LES DEUX.
           La marge automatique fait tout le travail : ce qui suit le bloc de
           tete est pousse au bas de la carte, quel que soit son nombre. */
        .cd-dit{display:flex;flex-direction:column;align-items:flex-start;
          width:100%;min-width:0;flex:none;margin-bottom:auto;}
        /* LE METIER PORTE SON PICTOGRAMME ET SA COULEUR ; la nature de l'annonce
           suit, separee par un point, en plus discret. On lit « chez qui » avant
           « quoi », et c'est le bon ordre : on ne va pas chez une boucherie pour
           un menu du jour. */
        .cd-nature b{display:inline-flex;align-items:center;gap:5px;
          font-weight:850;color:var(--cd-accent);}
        .cd-nature b i{font-style:normal;font-size:13px;letter-spacing:0;}
        .cd-nature s{text-decoration:none;color:#9DB0A6;}
        .cd-nature s::before{content:" · ";}
        /* SEULE SUR LA FACE « UNE SECONDE » : l'etiquette n'a plus de metier
           devant elle, donc plus de point de separation a porter. */
        .cd-carte.sec .cd-nature s::before{content:none;}
        .cd-nature{margin:0;font-size:11px;font-weight:800;letter-spacing:.24em;
          text-transform:uppercase;color:#EFEAD9;opacity:.92;}
        /* ═══ CA VIENT DE TOMBER ═══
           UNE QUATRIEME COULEUR, ET LES TROIS AUTRES ETAIENT PRISES. Le vert
           veut dire GARDER, le corail #FF6B6B veut dire PASSER — c'est le
           tampon qui apparait sous le doigt quand on balaie — et l'ambre veut
           dire « c'est a vous ». Les trois parlent d'une ACTION. La fraicheur
           n'est pas une action mais un ETAT, et le premier essai l'avait mise
           en corail : la pastille se retrouvait a deux centimetres d'un tampon
           « PASSER » de la meme couleur, ce qui revenait a dire « nouveau » et
           « refuser » avec le meme signe.
           LE VIOLET EST LIBRE SUR LA CARTE, et c'est la couleur du direct dans
           le vocabulaire que tout le monde connait deja — celui de Twitch, cite
           par le produit lui-meme quand le rond video est ne. */
        /* ─── LA FRAICHEUR A CESSE D'ETRE UNE PASTILLE ───
           « Depuis combien de temps l'annonce existe n'est pas ce qui interesse
           le client. Ce qui l'interesse est : est-ce encore disponible ?
           IL Y A 16 MIN → une petite indication, beaucoup plus discrete. »

           C'etait le TROISIEME signal de temps de la meme carte, et le plus
           gros des trois : une pastille violette a bord lumineux au-dessus de
           l'etiquette qui, elle, dit ce qui compte — « il en reste 8 ». Elle
           garde son point qui bat, parce que c'est lui qui dit que la carte est
           vivante ; elle perd son cadre, ses majuscules et sa couleur. */
        .cd-frais{display:inline-flex;align-items:center;gap:6px;
          margin:0 0 7px;padding:0;
          font-size:10.5px;font-weight:750;letter-spacing:.04em;
          color:rgba(234,242,236,.62);text-shadow:0 1px 6px rgba(0,0,0,.75);}
        .cd-frais i{width:6px;height:6px;border-radius:50%;background:#C4A0FF;
          box-shadow:0 0 0 0 rgba(185,140,255,.75);animation:cdBat 2s ease-out infinite;}
        /* IL BAT, IL NE CLIGNOTE PAS. Un clignotement fait fermer une
           application ; une pulsation lente se remarque sans agresser, et
           s'arrete net pour qui a demande moins d'animations. */
        @keyframes cdBat{
          0%{box-shadow:0 0 0 0 rgba(185,140,255,.75);}
          70%{box-shadow:0 0 0 7px rgba(185,140,255,0);}
          100%{box-shadow:0 0 0 0 rgba(185,140,255,0);}
        }
        @media (prefers-reduced-motion:reduce){
          .cd-frais i{animation:none;}
        }
        /* LE PLAT EST LA PLUS GROSSE LIGNE DE LA CARTE. C'est tout le
           correctif : avant, c'etait le nom du commerce. */
        /* ═══ SANS-SERIF, ET UNE VRAIE HIERARCHIE DE GRAISSES ═══
           « Police sans-serif geometrique et moderne : oui. Mais attention au
           mot "grasse" — si tout est gras, plus rien n'est important. »

           LE TEST QU'IL DEMANDE : comprendre « 40 PIECES SORTIES CE MATIN » en
           moins d'une seconde, sans s'arreter. Une serif elegante se lit ligne
           par ligne ; une sans-serif epaisse se lit d'un coup, et c'est ce
           qu'il faut pour un ecran qu'on balaie. La serif reste ou elle a du
           sens — le mot du commercant, sous le pli, qui est une VOIX et pas une
           information.

           TROIS GRAISSES, ET PAS UNE : le message a 900, le nom du commerce a
           650, la ville et la distance a 400. C'est la hierarchie qui fait lire
           vite, pas l'epaisseur. */
        /* ═══ LE TITRE EST UNE AFFICHE ═══
           Une grotesque compacte (voir --font-affiche), en capitales, sur deux
           lignes au plus. La graisse 900 d'Inter tenait la meme force mais
           prenait un tiers de plus en largeur : « La cote de boeuf maturee »
           passait sur trois lignes et se lisait comme un paragraphe. Ici le
           titre garde la taille d'un titre meme quand il est long.
           Le -0.01em de chasse n'est pas du gout : cette fonte est deja tres
           serree, et sans lui les capitales se touchent aux grandes tailles. */
        /* SA TAILLE SUIT SA LONGUEUR. « 8 LASAGNES » tient en un souffle a
           58 points ; « La cote de boeuf maturee » n'y tient pas, et un titre
           coupe par des points de suspension ne dit plus rien du tout — c'est
           le defaut qu'on repare, pas un detail de gout. Trois paliers, poses
           par la carte selon le nombre de caracteres. */
        .cd-offre{margin:6px 0 0;
          font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-weight:400;font-size:clamp(46px,14.5vw,70px);line-height:.88;
          letter-spacing:.004em;text-transform:uppercase;color:#fff;
          text-shadow:0 2px 10px rgba(0,0,0,.72),0 4px 30px rgba(0,0,0,.55);
          display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;
          overflow:hidden;}
        /* ═══ LE TITRE NE PASSE PLUS SOUS L'ANNEAU ═══
           MESURE : « BOUQUET DU JOUR » s'affichait « BOUQUET DU J », et
           « 40 PIECES SORTIES CE MATIN » perdait son S — l'anneau du metier est
           pose en absolu a droite, a 29 % de hauteur, sur 104 points, et rien ne
           lui reservait sa place. Le titre passait DESSOUS, ce qui ne se voit
           pas en relisant le code : les deux blocs sont corrects chacun de son
           cote.
           ON RESERVE, ON NE RAPETISSE PAS. Le titre garde sa taille et passe a
           la ligne plus tot : deux lignes lisibles valent mieux qu'une ligne
           coupee. Le detail juste dessous tombe dans la meme bande, donc il
           recoit la meme reserve ; le prix et le reste sont plus bas que
           l'anneau et gardent toute la largeur. */
        .cd-offre,.cd-detail{padding-right:114px;}
        /* ═══ LE TITRE NE SE COUPE PAS ══════════════════════════════════════

           « Le texte en haut est tronqué. » MESURE : « De la place, sans
           attendre » — vingt-cinq signes — tombait dans le palier « moyen », a
           quarante-trois points sur un ecran de trois cent quatre-vingt-dix, et
           demandait QUATRE lignes pour un cadre qui en autorise trois. Il
           s'affichait « DE LA PLACE, SANS… ».

           LE TITRE EST L'OFFRE. C'est la seule ligne de la carte qui dit ce
           qu'on vient chercher : la couper en plein milieu enleve sa moitie
           utile. Deux corrections plutot qu'une, parce qu'aucune ne suffit
           seule :

             · LES PALIERS DESCENDENT. Vingt-deux signes suffisent a faire
               passer au petit corps — c'est la ou la mesure place la rupture,
               pas a trente-quatre.
             · LE PETIT CORPS GAGNE UNE QUATRIEME LIGNE. A trente points, quatre
               lignes tiennent dans la meme hauteur que trois a quarante-trois :
               on ne prend la place de rien. */
        .cd-offre.moyen{font-size:clamp(34px,10vw,48px);}
        .cd-offre.long{font-size:clamp(28px,8vw,38px);line-height:.96;
          -webkit-line-clamp:4;}
        /* ─── TROIS TONS DE TITRE, MEME PLACE ET MEME TAILLE ───
           « La structure UX est quasiment sacree ; le contenu et la personnalite
           visuelle peuvent evoluer selon le metier. » On ne touche donc ni a la
           position, ni au nombre de lignes, ni aux tailles calculees au-dessus :
           seules la chasse et la casse changent.
           GRAS : l'affiche d'origine, serree et en capitales — un plat, une
           tournee, ce qui se crie.
           EDITORIAL : capitales aerees, une fraction de taille en moins. Un
           vetement, une coupe, un bouquet se presentent, ils ne se crient pas.
           CLAIR : casse normale, pas d'espacement. Un concert municipal ou une
           offre d'emploi cries se lisent comme une publicite — et une offre
           d'emploi qui ressemble a une publicite a l'air d'une arnaque. */
        .cd-offre.t-editorial{letter-spacing:.05em;
          font-size:clamp(38px,11.6vw,56px);line-height:.98;}
        .cd-offre.t-editorial.moyen{font-size:clamp(32px,9.4vw,45px);}
        .cd-offre.t-editorial.long{font-size:clamp(26px,7.6vw,36px);line-height:1.04;}
        .cd-offre.t-clair{text-transform:none;letter-spacing:-.01em;
          font-family:'Inter',system-ui,-apple-system,sans-serif;font-weight:800;
          font-size:clamp(34px,10.4vw,48px);line-height:1.04;}
        .cd-offre.t-clair.moyen{font-size:clamp(29px,8.4vw,40px);}
        .cd-offre.t-clair.long{font-size:clamp(24px,6.8vw,32px);line-height:1.12;}
        /* ─── LE GRAIN D'AFFICHE ───
           « Beaucoup plus de caractere. » Une lettre pleine et lisse est une
           lettre d'application ; une lettre legerement mangee est une lettre
           IMPRIMEE — c'est ce que la maquette montre, et c'est ce qui donne
           l'impression d'une ardoise plutot que d'un ecran.
           C'EST UN MASQUE, PAS UNE COULEUR : si le navigateur ne le comprend
           pas, le titre reste blanc plein. Un titre invisible pour un grain
           serait un tres mauvais marche. */
        @supports (-webkit-mask-image:url("")) or (mask-image:url("")){
          .cd-offre,.cd-prixg b{
            -webkit-mask-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/><feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .17 0 0 0 .83'/></filter><rect width='220' height='220' filter='url(%23g)'/></svg>");
            mask-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/><feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .17 0 0 0 .83'/></filter><rect width='220' height='220' filter='url(%23g)'/></svg>");
            -webkit-mask-size:220px 220px;mask-size:220px 220px;}
        }
        .cd-detail{margin:7px 0 0;max-width:31ch;font-size:12.5px;
          line-height:1.35;color:#D9E4DC;text-wrap:balance;
          text-shadow:0 2px 10px rgba(4,8,6,.8);
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        /* ─── SA VOIX ───
           Meme place et meme hauteur que le detail qu'elle remplace : on ne
           gagne pas un pixel, on remplace du texte mort par quelqu'un. Le
           serif et les guillemets font la difference entre une description et
           une parole ; le rond a gauche donne le visage que les fiches Google
           n'ont jamais. */
        .cd-conseil{margin:7px 0 0;max-width:33ch;display:flex;align-items:center;
          gap:9px;font-family:Georgia,'Times New Roman',serif;font-size:13.5px;
          line-height:1.32;color:#EAF2EC;text-align:left;}
        .cd-conseil>span:last-child{min-width:0;}
        /* QUAND IL Y A UN FILM, LA COLONNE DE TEXTE NE DOIT PAS PAYER LE ROND.
           La largeur maximale porte sur la ligne entiere : garder 33ch avec un
           rond deux fois plus large aurait rendu la phrase deux fois plus
           haute. On rend au texte ce que le rond a pris. */
        .cd-conseil.film{max-width:40ch;gap:12px;}
        /* LES GUILLEMETS ENCADRENT LA PHRASE, PAS LA SIGNATURE. Sans
           l'element intermediaire, le guillemet fermant se serait pose apres
           « — Serge, boucher », c'est-a-dire au mauvais endroit. */
        .cd-conseil em{font-style:normal;}
        .cd-conseil em::before{content:"\\201C";}
        .cd-conseil em::after{content:"\\201D";}
        .cd-conseil>span:last-child s{display:block;margin-top:3px;
          text-decoration:none;font-family:inherit;font-size:11px;
          font-style:italic;color:#9FB5AA;}
        .cd-conseil>span:last-child s::before{content:"— ";}
        /* L'INITIALE QUAND IL N'Y A PAS DE PHOTO — et c'est le cas de toute la
           maquette : LISEZ-MOI.md interdit les visages reconnaissables, et
           c'est aussi la degradation du vrai produit pour celui qui ne veut
           pas donner sa tete. */
        .cd-tete{flex:none;width:34px;height:34px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;overflow:hidden;
          font-family:system-ui,sans-serif;font-size:15px;font-weight:850;
          color:#04150E;background:linear-gradient(140deg,#7EE6C0,#3DE2A6);
          box-shadow:0 2px 10px rgba(0,0,0,.4);}
        .cd-tete img,.cd-tete video{width:100%;height:100%;object-fit:cover;}
        /* ─── LE ROND QUAND IL Y A UN FILM ───
           « La video est minuscule, on ne voit quasiment rien. » Soixante-
           dix pixels au lieu de trente-quatre : quatre fois la surface, donc
           un geste enfin lisible sans que le rond devienne un lecteur video.
           L'anneau vert dit qu'il y a quelque chose a regarder — c'est la
           seule chose qui distingue un film d'une photo tant qu'on n'a pas
           appuye. */
        .cd-tete.film{width:70px;height:70px;
          box-shadow:0 0 0 2px rgba(61,226,166,.5),0 3px 14px rgba(0,0,0,.45);}
        /* ═══ LE PRIX EST LE SECOND ACTEUR, ET IL A LA TAILLE DU TITRE ═══
           La maquette l'ecrit aussi gros que « 8 LASAGNES », dans la meme
           fonte d'affiche, avec l'ancien prix BARRE EN ROUGE juste a cote —
           petit, decale, comme sur une ardoise de marche. C'est la lecture la
           plus rapide qui existe pour une remise : on voit la chute avant
           d'avoir lu les chiffres. */
        /* ═══ LE PRIX N'EST PLUS BLANC ═══
           « Le chiffre devrait etre d'une autre couleur pour attirer
           l'attention, comme le chiffre en dessous "il en reste 12". »

           IL AVAIT LA COULEUR DE TOUT LE RESTE. Titre blanc, prix blanc, nom du
           commerce blanc : sur une carte ou tout est blanc, la taille est le
           seul rang, et la taille se lit APRES la couleur. Le prix est pourtant
           la deuxieme question de celui qui regarde — juste apres « c'est
           quoi » — et rien ne le designait.
           C'EST L'AMBRE DE « IL EN RESTE 12 », le meme code exactement. Deux
           ambres differents pour deux chiffres voisins auraient fait croire a
           deux natures d'information. */
        .cd-prixg{margin:2px 0 0;display:flex;align-items:baseline;gap:10px;
          font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:clamp(52px,16.5vw,80px);font-weight:400;
          letter-spacing:.004em;line-height:.96;color:#FFC400;
          text-shadow:0 2px 10px rgba(0,0,0,.72),0 4px 30px rgba(0,0,0,.55);
          font-variant-numeric:tabular-nums;}
        /* ─── ET LE PRIX NE SE COUPE PAS, MEME SI LA POLICE CHANGE ───
           L'espace insecable empeche la coupure A L'ENDROIT DE L'ESPACE. Elle
           ne protege pas d'un overflow-wrap herite, ni d'une police de repli
           plus large que celle qu'on a mesuree — et c'est sur SON telephone que
           le defaut se voyait, pas ici. white-space:nowrap ferme la question :
           le montant et son signe sont un seul bloc, qui se reduit avec le
           clamp plutot que de se casser en deux. */
        /* ─── ET IL PEUT COUPER ENTRE DEUX MOTS, MAIS JAMAIS AVANT SON SIGNE ───
           J'avais mis white-space:nowrap ici faute de reproduire la coupure sur
           son telephone. C'etait de trop, et ca s'est vu tout de suite sur une
           offre d'emploi : « 480 € net par mois » ne peut pas tenir sur une
           ligne en soixante-dix points, et interdire toute coupure le faisait
           sortir de l'ecran par la droite.
           LA VRAIE CORRECTION EST AILLEURS, et elle est prouvee : l'espace
           insecable n'etait JAMAIS posee avant le « € », parce que la regle
           finissait par une frontiere de mot que « € » ne peut pas former. Elle
           l'est maintenant. Le prix coupe donc entre « net » et « par », comme
           n'importe quelle phrase, et jamais entre le nombre et son signe.
           LES DEUX PROPRIETES SONT ECRITES EN TOUTES LETTRES parce qu'un
           overflow-wrap herite d'ailleurs casserait a l'interieur des mots —
           y compris au travers d'une espace insecable. */
        /* LES DEUX PALIERS DU PRIX. « 1 800 € net + le partage du pot » fait
           trente et un signes : a soixante-dix points il prenait trois lignes.
           A trente-deux, il en prend deux et laisse la photo respirer. */
        .cd-prixg.moyen{font-size:clamp(34px,10vw,48px);line-height:1;}
        .cd-prixg.long{font-size:clamp(26px,7.4vw,34px);line-height:1.04;
          letter-spacing:-.01em;}
        .cd-prixg b{font-weight:inherit;overflow-wrap:normal;word-break:normal;}
        .cd-prixg s{overflow-wrap:normal;word-break:normal;}
        /* LE QUALIFICATIF EST PETIT ET SUR SA LIGNE : il dit comment lire le
           chiffre, il n'est pas le chiffre. Pas de soulignement — la balise
           porte le sens, pas le trait. */
        .cd-prixg u{display:block;text-decoration:none;
          font-family:'Inter',system-ui,-apple-system,sans-serif;
          font-size:12.5px;font-weight:800;letter-spacing:.04em;
          text-transform:uppercase;line-height:1.1;margin-bottom:1px;
          color:rgba(255,196,0,.78);}
        /* MEME RESERVE QUE LE TITRE : l'anneau du metier couvre la bande
           245-349 points, et le prix y tombe. Mesure sur iPhone a 390 points —
           « a partir de 12 € » passait dessous. */
        .cd-prixg{padding-right:114px;}
        /* L'ASTERISQUE EST EN EXPOSANT ET PETIT : il signale, il n'annonce pas. */
        .cd-prixg b em{font-style:normal;font-size:.42em;vertical-align:super;
          margin-left:.04em;color:rgba(255,196,0,.7);}
        .cd-prixg s{margin:0;font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:clamp(20px,6vw,28px);font-weight:400;
          color:#FF6B6B;text-decoration-color:#FF6B6B;
          text-decoration-thickness:2.5px;}
        /* ⚡ SUR UN FLASH, L'ANCIEN PRIX EST LA MOITIE DE L'INFORMATION — il
           reste a cote du neuf, et c'est le meme dessin : une seule facon
           d'ecrire un prix dans tout le produit. */
        .cd-prixg.flash{color:#FFC400;}
        /* COMBIEN IL EN RESTE : petit, sous le prix, le nombre en ambre. */
        .cd-encore{margin:6px 0 0;font-size:13px;font-weight:800;
          color:#EAF2EC;text-shadow:0 2px 12px rgba(4,8,6,.9);}
        .cd-encore b{font-weight:850;color:#FFC400;}
        /* LE NOM A 650, LA VILLE ET LA DISTANCE A 400 : trois niveaux avec le
           titre. « Si tout est gras, plus rien n'est important. » */
        /* LE NOM DU COMMERCE PORTE UN FILET A SA COULEUR. C'est le second point
           d'ancrage de l'accent : la derniere chose lue avant de decider. */
        .cd-chez{margin:11px 0 0;padding-left:9px;font-size:14.5px;font-weight:650;
          line-height:1.25;color:#EAF2EC;text-wrap:balance;
          border-left:2.5px solid var(--cd-accent);}
        .cd-chez s{text-decoration:none;font-weight:400;color:#A9BDB2;}
        .cd-carte.sec .cd-social{align-self:center;margin-top:9px;}

        /* ═══ LA BANDE DE SES PHOTOS ════════════════════════════════════════

           « Ca peut n'etre que 3 photos ou 5, donc il faudra ajuster en
           fonction de ce que le commercant aura mis. Et s'il n'y a qu'une seule
           photo, alors aucune miniature n'apparait et ca fait gagner de la
           place sur l'annonce. »

           ELLE S'ADAPTE SANS COMPTER, et c'est ce qui la rend juste pour trois
           comme pour huit. Les vignettes ont une taille FIXE et la bande defile
           horizontalement quand elles depassent : une grille qui partage la
           largeur aurait donne des timbres-poste a partir de six. A cinquante-
           six points, on reconnait une salle, un plat, une devanture — c'est
           tout ce qu'on demande a une miniature.

           LA BANDE N'EXISTE PAS DU TOUT QUAND IL N'Y A QU'UNE PHOTO : c'est
           decide dans le composant, pas ici. Une regle de style qui la cache
           laisserait sa marge, et la place gagnee est justement ce qu'il
           demande. */
        .cd-bande{display:flex;gap:7px;align-self:stretch;margin:11px 0 0;
          padding:0 0 2px;list-style:none;overflow-x:auto;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .cd-bande::-webkit-scrollbar{display:none;}
        .cd-bande li{flex:none;}
        .cd-vig{width:56px;height:56px;padding:0;border-radius:13px;
          background-color:#101825;background-size:cover;background-position:center;
          border:1.5px solid rgba(255,255,255,.16);cursor:pointer;
          box-shadow:0 6px 16px -10px rgba(0,0,0,.9);
          transition:border-color .16s ease,transform .16s ease,opacity .16s ease;
          opacity:.72;}
        .cd-vig:active{transform:scale(.94);}
        /* CELLE QU'ON REGARDE SE VOIT, ET C'EST LA SEULE FACON DE REVENIR.
           Sans marque, on ne sait plus laquelle est au mur — donc on ne sait
           plus laquelle ramene a l'offre du jour. */
        .cd-vig.vue{opacity:1;border-color:var(--cd-accent,#EAF2EC);
          box-shadow:0 0 0 2px rgba(0,0,0,.45),0 6px 18px -10px rgba(0,0,0,.9);}
        .cd-bande-l{align-self:stretch;margin:7px 0 0;font-size:11.5px;
          font-weight:700;line-height:1.3;color:rgba(255,255,255,.72);}
        /* « JUSQU'A QUAND » EST LA SEULE RARETE QU'ON PUISSE ECRIRE SANS
           L'INVENTER. On ne sait pas combien il reste de parts — un commercant
           photographie son ardoise le matin et ne decompte rien pendant le
           service. L'heure, elle, on la connait sans rien demander a personne. */
        /* ⚡ LE FLASH SE VOIT DE LOIN, ET IL EST LE SEUL AMBRE DE LA CARTE.
           « Il faut que ce soit completement identifiable dans le Direct. » Le
           vert est la couleur de tout le reste ; l'ambre ne sert qu'ici et sur
           l'engagement. Une carte Flash ne se confond avec aucune autre, meme
           en balayant vite. */
        /* ═══ ⚡ LA CARTE ENTIERE EST DIFFERENTE ═══
           « L'annonce ne fait pas differente d'une autre alors qu'elle devrait
           etre TRES differente pour montrer l'exceptionnel de ce moment. »

           UNE PASTILLE NE SUFFIT PAS, ET C'EST LA LECON. On balaie ce paquet a
           la seconde ; un petit objet ambre sur une carte par ailleurs
           identique ne se voit pas. Ce qui se voit, c'est une CARTE d'une autre
           couleur : un liseré ambre tout autour, une lueur chaude, et un voile
           qui rechauffe la photo. On sait que c'est autre chose avant d'avoir
           lu un seul mot. */
        /* LE LISERE EST A L'INTERIEUR, ET C'EST UNE CORRECTION MESUREE : la
           carte du dessus occupe tout l'ecran, donc un contour POSE AUTOUR
           tombe hors du cadre et ne se voit jamais. Vu sur la capture — la
           regle etait ecrite, l'effet invisible. La lueur exterieure reste pour
           la carte du dessous, qui, elle, a des marges. */
        /* ═══ ELLE RESPIRE, ET C'EST CE QUI LA REND VIVANTE ═══
           « Il faudrait que ça fasse beaucoup plus SPECIAL. » Un liseré fixe se
           regarde comme un cadre ; un liseré qui respire se regarde comme
           quelque chose qui SE PASSE. Deux secondes et demie par cycle — le
           rythme d'une respiration calme, pas d'une alarme : on veut donner
           envie, pas mettre la pression. */
        .cd-carte.flash{animation:cdFlashVit 2.6s ease-in-out infinite;}
        @keyframes cdFlashVit{
          0%,100%{box-shadow:inset 0 0 0 2px rgba(247,201,72,.72),
            inset 0 0 90px -20px rgba(240,180,41,.42),
            0 26px 60px -24px rgba(240,180,41,.6);}
          50%{box-shadow:inset 0 0 0 3px rgba(255,215,94,1),
            inset 0 0 120px -18px rgba(240,180,41,.72),
            0 26px 70px -22px rgba(240,180,41,.95);}
        }
        .cd-carte.flash .cd-voile{background:linear-gradient(180deg,
          rgba(60,32,0,.42) 0%,rgba(24,14,2,.66) 46%,rgba(10,6,1,.92) 100%);}

        /* ─── LE CHRONO EST L'ACTEUR PRINCIPAL ───
           « Le chrono devrait etre tres different, comme l'acteur principal. »
           Le nombre de minutes est ecrit a la taille d'un prix ; c'est la seule
           question qu'on se pose devant un Flash — est-ce que j'ai le temps ? */
        .cd-flash{display:flex;flex-direction:column;align-items:center;gap:2px;
          margin:0 0 10px;padding:9px 18px 11px;border-radius:20px;
          background:rgba(60,36,0,.5);border:1px solid rgba(247,201,72,.65);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .cd-flash-t{display:flex;flex-direction:column;align-items:center;gap:2px;
          font-size:11.5px;font-weight:850;letter-spacing:.28em;
          text-transform:uppercase;color:#F7C948;}
        /* L'ECLAIR CLIGNOTE COMME UN ECLAIR : deux battements secs, puis rien.
           C'est le seul element anime du paquet, et c'est voulu — il ne sert a
           rien de crier partout si on veut etre entendu quelque part. */
        .cd-flash-t i{font-style:normal;font-size:15px;letter-spacing:0;
          margin-bottom:1px;animation:cdEclair 2.6s ease-in-out infinite;}
        @keyframes cdEclair{
          0%,14%,100%{opacity:1;transform:scale(1);}
          6%{opacity:.25;transform:scale(.86);}
          10%{opacity:1;transform:scale(1.22);}
        }
        /* LA RARETE, ECRITE. Le compte a rebours dit « c'est urgent » ; cette
           ligne dit « ca n'arrive presque jamais ». Sans elle, un Flash se lit
           comme une promotion de plus. */
        .cd-flash-t s{text-decoration:none;font-size:8.5px;font-weight:750;
          letter-spacing:.1em;color:rgba(255,215,94,.72);}
        .cd-flash-n{display:flex;align-items:baseline;gap:7px;}
        .cd-flash-n b{font-size:38px;font-weight:850;letter-spacing:-.04em;
          line-height:1;color:#FFD75E;font-variant-numeric:tabular-nums;}
        .cd-flash-n em{display:flex;flex-direction:column;align-items:flex-start;
          font-style:normal;font-size:13px;font-weight:850;line-height:1.05;
          color:#FFD75E;}
        .cd-flash-n em s{text-decoration:none;font-size:9.5px;font-weight:700;
          letter-spacing:.1em;text-transform:uppercase;color:rgba(255,215,94,.7);}
        /* LA BARRE QUI DESCEND. Elle ne clignote pas et ne change pas de couleur
           en fin de course : le temps qui passe est une information, pas une
           alarme. */
        .cd-flash-j{display:block;width:100%;height:4px;margin-top:7px;
          border-radius:2px;background:rgba(255,255,255,.18);overflow:hidden;}
        .cd-flash-j u{display:block;height:100%;text-decoration:none;
          background:linear-gradient(90deg,#FFD75E,#F0B429);
          transition:width .9s linear;}
        /* ─── L'AVANTAGE : LE SECOND ACTEUR ───
           Il est ambre comme le chrono, et presque aussi gros que le titre.
           Aucune autre carte du produit ne porte d'ambre a cette taille : c'est
           ce qui fait qu'un Flash se reconnait de loin, avant meme d'etre lu.
           Il reste sous le titre en taille : le titre dit QUOI, l'avantage dit
           combien on gagne — dans cet ordre. */
        .cd-flash-a{margin:7px 0 0;font-family:'Inter',system-ui,-apple-system,sans-serif;
          font-size:clamp(20px,6.2vw,27px);font-weight:900;letter-spacing:-.02em;
          line-height:1.05;color:#FFD75E;
          text-shadow:0 2px 14px rgba(4,8,6,.6);}
        /* ET CE QUI CONTINUE DERRIERE, a la taille d'une note de bas de page :
           c'est une reponse a une inquietude, pas une seconde offre. */
        .cd-flash-s{margin:7px 0 0;font-size:12px;font-weight:650;
          line-height:1.3;color:#A9BDB2;}
        /* ═══ « CA VIENT DE TOMBER ! » ═══
           En haut, centree, ambre pleine sur noir : c'est la premiere chose que
           l'oeil rencontre, et elle dit la seule chose qu'aucune fiche Google
           ne saura jamais dire. Elle remplace un bloc de quatre lignes — le mot
           Flash, la rarete, le nombre de minutes, une barre — dont le compte a
           rebours est parti former l'anneau. */
        .cd-tombe{position:relative;align-self:center;display:inline-flex;
          align-items:center;gap:7px;margin:4px 0 6px;padding:9px 18px;
          border-radius:999px;
          font-size:13px;font-weight:850;letter-spacing:.03em;
          text-transform:uppercase;color:#2A1C00;
          background:linear-gradient(140deg,#FFD75E,#F0B429);
          box-shadow:0 6px 22px rgba(240,180,41,.45);
          animation:cdTombe 2.8s ease-in-out infinite;}
        .cd-tombe i{font-style:normal;font-size:14px;line-height:1;}
        /* LES ETINCELLES : trois traits en eventail, de chaque cote. Dessines
           par un fond conique masque plutot que par six elements — un « pop »
           de bande dessinee ne merite pas six noeuds dans le DOM. */
        .cd-tombe b{position:absolute;top:50%;width:20px;height:26px;
          margin-top:-13px;pointer-events:none;
          background:
            linear-gradient(#F7C948,#F7C948) center/100% 2.4px no-repeat,
            linear-gradient(#F7C948,#F7C948) center/100% 2.4px no-repeat,
            linear-gradient(#F7C948,#F7C948) center/100% 2.4px no-repeat;
          background-position:0 4px, 0 13px, 0 22px;
          border-radius:2px;opacity:.9;}
        .cd-tombe b:first-child{right:calc(100% + 6px);
          transform:scaleX(-1);
          -webkit-mask:linear-gradient(90deg,#000 40%,transparent);
          mask:linear-gradient(90deg,#000 40%,transparent);}
        .cd-tombe b:last-child{left:calc(100% + 6px);
          -webkit-mask:linear-gradient(90deg,#000 40%,transparent);
          mask:linear-gradient(90deg,#000 40%,transparent);}
        @keyframes cdTombe{0%,88%,100%{transform:none;}
          92%{transform:rotate(-2.2deg) scale(1.04);}
          96%{transform:rotate(2.2deg) scale(1.04);}}

        /* ═══ L'ANNEAU ═══
           « Le chrono devrait etre tres different, comme l'acteur principal. »
           Un disque de cent points, cercle de rouge, pose a cheval sur la photo
           a hauteur de regard. Le tour du disque montre la part qui reste — un
           cadran se lit sans qu'on ait a lire un chiffre. Sans Flash, le meme
           disque porte une porte : « Voir la carte », « Voir la journee ». Un
           seul objet a cet endroit, jamais deux. */
        /* IL EST HAUT, SOUS LE PRIX, COMME DANS LA MAQUETTE — et pas au milieu
           de l'ecran, ou il tombait sur l'etiquette « Glissez pour proposer »
           des trois premieres cartes. Deux objets poses au meme endroit, c'est
           toujours le plus recent qui a tort. */
        /* ═══ L'ANNEAU ═══
           « Le rond flash est tres mal realise encore, il faut revoir le
           visuel pour que ce soit parfait visuellement. »

           CE QUI CLOCHAIT N'ETAIT PAS LA COULEUR, C'ETAIT LA CONSTRUCTION.
           Le cadran etait fait de trois techniques empilees : une bordure en
           degrade sur deux fonds (padding-box + border-box), puis un second
           cercle en degrade conique decoupe par un masque radial exprime EN
           PIXELS. Trois grilles differentes pour dessiner deux cercles : sur
           un ecran a 2x ou 3x, le masque tombait a un demi-pixel de la
           bordure, et ce demi-pixel se voyait comme une bavure tout autour.
           D'ou l'aspect sale, qui revenait quel que soit le reglage.

           MAINTENANT LE CADRAN EST DESSINE, EN SVG, DANS UNE SEULE GRILLE.
           Une piste et un arc, memes centre et meme rayon, tracees par le
           moteur vectoriel : aucun decalage possible a aucune densite. L'arc
           part de midi et tourne dans le sens des aiguilles, comme une montre
           que tout le monde sait lire, et il s'arrondit au bout au lieu de se
           couper net. Le fond redevient un simple disque sombre : plus de
           bordure a faire coincider avec quoi que ce soit.

           LES DEUX ETATS ONT LE MEME DESSIN : le chrono et la porte de la
           carte ne different que par ce qu'ils contiennent. */
        /* ═══ LE ROND MONTE EN FACE DU TITRE ════════════════════════════════
           Voir le commentaire au-dessus de hautrond dans le composant. MESURE :
           a 29 % il tenait de 245 a 349 points, c'est-a-dire en face de la fiche
           — « Il reste 4 parts », « A 250 m » — et juste sous le prix. La bande
           du titre, au-dessus, etait vide sur sa moitie droite.
           ET LE TITRE LUI FAIT PLACE quand il monte : sans ce rembourrage a
           droite, la troisieme ligne du titre passerait dessous. Les seize
           points de plus que le rond sont l'ecart qui empeche les lettres de le
           toucher. */
        /* ═══ ET IL PASSAIT SOUS LA BARRE DU HAUT, SUR UN VRAI TELEPHONE ════

           « Le rond est en dehors tout en haut, donc le mettre au bon endroit
           plus bas. »

           LE POURCENTAGE ETAIT LA FAUTE, ET IL NE POUVAIT PAS SE VOIR ICI. La
           barre de l'application descend de l'encoche — son rembourrage vaut
           « 8px + env(safe-area-inset-top) » — et cette valeur vaut ZERO dans un
           navigateur de bureau. Le rond, lui, se posait a un pourcentage de la
           CARTE, qui ne connait pas l'encoche. Mesure a 430 points avec une
           encoche de cinquante-neuf : la barre descend a 115, le rond reste a
           65, et il recouvre la cloche des notifications — qui est un GESTE,
           donc inatteignable.

           IL SE POSE DONC SOUS LA BARRE, PAS A UN POURCENTAGE DE LA CARTE. Le
           calcul reprend exactement le rembourrage de la barre, et les quatorze
           points qui restent sont l'ecart voulu entre les deux. Sans encoche il
           ne bouge presque pas ; avec, il descend d'autant qu'elle. */
        .cd-carte.hautrond .cd-anneau{top:calc(70px + var(--ap-encoche,0px));}
        .cd-carte.hautrond .cd-offre{padding-right:120px;}
        .cd-anneau{position:absolute;right:18px;top:29%;z-index:3;
          width:104px;height:104px;border-radius:50%;
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:0;text-align:center;
          font:inherit;color:#fff;cursor:default;border:0;padding:0;
          background:radial-gradient(circle at 50% 38%,
            rgba(30,16,13,.93) 0%, rgba(7,10,8,.95) 72%);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          box-shadow:0 12px 34px rgba(0,0,0,.55),
            0 0 26px -6px rgba(255,110,90,.45);}
        /* LE CADRAN. Il deborde de deux points sur le disque : la lueur de
           l'arc a besoin de place pour ne pas etre coupee au bord. */
        .cd-an-c{position:absolute;inset:0;width:100%;height:100%;
          transform:rotate(-90deg);overflow:visible;pointer-events:none;}
        /* ET LE TRAIT EST PLUS EPAIS. « L'epaisseur du cercle devrait etre un
           peu plus epaisse. » A trois points, l'anneau etait un filet : juste
           au bord de disparaitre sur une photo chargee, et surtout trop leger
           pour un objet qui est cense etre l'acteur principal de la carte.
           A cinq, il redevient un cadran. */
        .cd-an-p{fill:none;stroke:rgba(255,255,255,.16);stroke-width:5;}
        .cd-an-a{fill:none;stroke:url(#cdAnG);stroke-width:5.4;
          stroke-linecap:round;
          filter:drop-shadow(0 0 5px rgba(255,106,31,.8));
          transition:stroke-dasharray .9s linear;}
        /* LE TEXTE DEDANS EST GRAS, COMME SUR LA MAQUETTE. Il etait deja a 850
           mais en petit et en clair : sur un fond sombre, un caractere fin et
           pale se lit comme une legende, pas comme une etiquette. Un cran de
           plus, plus grand, et blanc casse. */
        .cd-anneau .cd-an-t{display:flex;align-items:center;gap:4px;
          margin-bottom:1px;
          font-size:9.5px;font-weight:900;letter-spacing:.12em;
          text-transform:uppercase;color:#FFD2C4;}
        .cd-anneau .cd-an-t i{font-style:normal;font-size:9.5px;}
        .cd-anneau b{font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:38px;font-weight:400;line-height:.92;letter-spacing:.01em;
          font-variant-numeric:tabular-nums;
          text-shadow:0 2px 12px rgba(0,0,0,.6);}
        .cd-anneau em{font-style:normal;font-size:10px;font-weight:900;
          margin-top:2px;
          letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.86);}
        /* LA RARETE, SOUS L'ANNEAU. Deux lignes de neuf points, centrees sur le
           disque : on ne la lit pas d'abord, on la trouve quand on s'arrete. */
        .cd-an-r{position:absolute;top:calc(100% + 7px);left:-14px;right:-14px;
          text-decoration:none;font-size:9px;font-weight:800;line-height:1.25;
          letter-spacing:.05em;text-transform:uppercase;text-align:center;
          color:rgba(255,215,94,.82);text-shadow:0 2px 10px rgba(4,8,6,.9);}
        /* LA PORTE DE LA CARTE : le meme disque, en vert — la couleur de ce
           qu'on peut faire — et la meme structure a trois etages que le chrono.
           Son cercle est un trait interieur, pas une bordure : une bordure
           agrandit la boite et decale le contenu d'un demi-point, un trait
           interieur ne bouge rien. Un pictogramme au trait au milieu, pas un
           emoji : l'emoji change de dessin selon le telephone et cassait
           l'harmonie du cercle. */
        /* LE FOND DU DISQUE : deux verts qui s'eteignent vers le bas, plus la
           teinte du haut qui recoit la lumiere. Un aplat sombre uniforme
           faisait un trou dans la photo ; un degrade fait un objet POSE
           dessus. */
        .cd-anneau.porte{cursor:pointer;
          background:radial-gradient(circle at 50% 26%,
            rgba(16,20,18,.95) 0%, rgba(9,13,11,.96) 58%, rgba(4,7,6,.97) 100%);
          box-shadow:0 14px 38px rgba(0,0,0,.58),
            0 0 30px -8px var(--cd-halo);
          transition:transform .18s cubic-bezier(.34,1.4,.64,1);}
        /* LES TROIS COUCHES DU CADRAN — voir le commentaire du trace.
           L'ORDRE EST CELUI DU DESSIN : le halo derriere, le reflet sur le
           fond, l'anneau par-dessus tout. Inverse, l'anneau passerait sous le
           voile blanc et perdrait sa saturation. */
        .cd-po-c{position:absolute;inset:0;width:100%;height:100%;
          overflow:visible;pointer-events:none;}
        /* ═══ L'ANNEAU PORTE LA COULEUR DU METIER ═══
           « Je ne vois pas vraiment de differences de design entre les
           differents metiers. »
           IL AVAIT RAISON, ET LA CAUSE ETAIT UNE QUESTION DE SURFACE. L'accent
           ne touchait que deux lignes de TEXTE — le metier en petites capitales
           et le nom du commerce — pendant que le plus gros objet colore de la
           carte, un disque de cent points pose a hauteur de regard, restait
           menthe sur les dix-huit commerces. On comparait deux mots la ou l'oeil
           compare des aplats.
           ET CE DISQUE PEUT LA PORTER SANS RIEN CASSER : il n'est pas un bouton
           d'action, c'est une PORTE — « Les fleurs · Voir ». La menthe des
           gestes d'engagement reste intacte en bas de l'ecran. */
        .cd-po-h{fill:none;stroke:var(--cd-halo);stroke-width:1.5;opacity:.45;}
        .cd-po-l{fill:url(#cdPorteL);}
        /* QUATRE POINTS ET DEMI, PAS CINQ ET DEUX. Premiere mesure a l'ecran :
           a 5,2 sur un rayon de 43, l'anneau MANGEAIT le mot du metier —
           « L'ARDOISE » depassait des deux cotes. Le trait s'affine et le
           cercle s'elargit : l'aire libre a l'interieur gagne cinq points de
           chaque cote, ce qui est exactement ce qui manquait. */
        .cd-po-a{fill:none;stroke:var(--cd-accent);stroke-width:4.5;
          filter:drop-shadow(0 0 6px var(--cd-halo));}
        /* ET LE MOT SE RANGE DANS CE QU'IL RESTE. Il est place au-dessus du
           centre, donc la corde disponible y est plus courte qu'au diametre :
           une largeur maximale explicite vaut mieux qu'un mot qui deborde des
           qu'un metier porte un nom un peu long. */
        /* IL PASSE EN BLOC, ET C'EST CE QUI LE FAIT REVENIR A LA LIGNE.
           Mesure a l'ecran avec « LES BOUGIES » : en flex, le mot restait sur
           une seule ligne et debordait de l'anneau des deux cotes, malgre la
           largeur maximale — un texte nu dans un conteneur flex forme un item
           anonyme qui ne se plie pas comme on l'attend. En bloc il se coupe
           proprement sur deux lignes, ce dont un metier au nom long a besoin. */
        /* IL PASSE EN BLOC, ET SA LARGEUR EST CELLE DE LA CORDE, PAS DU DISQUE.
           MESURE, ET C'EST LA QUE J'AVAIS FAUX : le mot n'est pas pose au
           diametre, il est vingt-huit points AU-DESSUS du centre. A cette
           hauteur, la corde libre a l'interieur de l'anneau ne fait plus
           quatre-vingt-dix points mais soixante-dix — « LES BOUGIES » a neuf
           points en faisait soixante-douze, et venait donc mordre le trait des
           deux cotes. Un demi-point de moins sur la fonte, et la marge revient.
           LE RETOUR A LA LIGNE RESTE, EN FILET DE SECURITE : le champ du metier
           est libre, et le jour ou quelqu'un ecrit « Les compositions », mieux
           vaut deux lignes qu'un mot coupe par un cercle. */
        .cd-anneau.porte .cd-an-t{display:block;color:#D8FFEE;font-size:8.5px;
          max-width:70px;letter-spacing:.04em;line-height:1.15;
          text-align:center;text-wrap:balance;
          text-shadow:0 1px 8px rgba(0,0,0,.7);}
        /* LE PICTOGRAMME SEUL, ET PAS LE CADRAN. Le selecteur portait sur tous
           les enfants svg ; depuis que le cadran en est un, il faut l'excepter
           — sans quoi l'anneau se retrouvait a trente points au milieu du
           disque. */
        .cd-anneau.porte>svg:not(.cd-po-c){width:32px;height:32px;
          margin:3px 0 2px;position:relative;z-index:1;
          stroke:#F2FBF6;stroke-width:1.7;fill:none;
          stroke-linecap:round;stroke-linejoin:round;
          filter:drop-shadow(0 1px 6px rgba(0,0,0,.55));}
        /* « VOIR » PORTE SON CHEVRON. Deux mots au meme rang — le metier en
           haut, l'action en bas — ne disaient pas lequel des deux est le
           geste ; le chevron le dit sans ajouter de ligne. */
        .cd-anneau.porte em{position:relative;z-index:1;
          display:inline-flex;align-items:center;gap:3px;
          font-style:normal;font-size:10px;font-weight:900;
          letter-spacing:.12em;text-transform:uppercase;color:var(--cd-accent);
          text-shadow:0 1px 8px rgba(0,0,0,.7);}
        /* LE CHEVRON EST ECRIT EN CLAIR, PAS EN ECHAPPEMENT. Un « \u00e9chappement
           unicode » dans un litteral de gabarit est lu par JavaScript avant
           d'atteindre la feuille de style : il casse la compilation, et le
           verificateur l'a pris au vol. */
        .cd-anneau.porte em::after{content:"›";font-size:13px;
          font-weight:700;line-height:1;letter-spacing:0;opacity:.9;}
        .cd-anneau.porte:active{transform:scale(.95);}
        @media (prefers-reduced-motion:reduce){.cd-tombe{animation:none;}}

        /* ═══ « EN CE MOMENT », EN TETE ET NON EN PIED ══════════════════════
           La maquette en fait la premiere chose qu'on lit. Elle etait la
           derniere du bloc, en ambre, sous le nom du commerce — donc sous le
           pli sur la moitie des cartes, alors qu'elle repond a la seule
           question que « le direct » pose.
           ROSE POUR CE QUI SE PASSE, ARDOISE POUR DEMAIN : la couleur change en
           meme temps que le mot, sans quoi un programme du lendemain se lirait
           comme un moment en cours. */
        .cd-quand{display:inline-flex;align-items:center;gap:6px;
          align-self:flex-start;margin:0 0 10px;font-size:11px;
          font-weight:850;letter-spacing:.06em;text-transform:uppercase;
          border-radius:999px;padding:6px 13px 6px 10px;}
        .cd-quand i{font-style:normal;font-size:11px;}
        .cd-quand.vif{color:#fff;
          background:linear-gradient(101deg,#E0399B,#C544E6);
          box-shadow:0 6px 18px rgba(197,68,230,.36);}
        .cd-quand.demain{color:#CBD9E6;background:rgba(255,255,255,.1);
          border:1px solid rgba(255,255,255,.2);}

        /* ═══ LES QUATRE LIGNES D'INFORMATION DE LA MAQUETTE ════════════════
           Elles repondent aux quatre questions qu'on se pose devant une
           annonce, dans l'ordre ou on se les pose : est-ce qu'il en reste,
           est-ce que c'est loin, est-ce que d'autres y vont, est-ce que c'est
           bien. Trois existaient, eparpillees ; alignees avec leur pictogramme,
           elles se lisent comme une fiche. */
        .cd-infos{list-style:none;margin:13px 0 0;padding:0;display:flex;
          flex-direction:column;gap:9px;}
        .cd-infos li{display:flex;align-items:center;gap:10px;}
        .cd-infos svg{flex:none;width:20px;height:20px;fill:none;
          stroke:rgba(255,255,255,.86);stroke-width:1.7;stroke-linecap:round;
          stroke-linejoin:round;}
        .cd-infos span{min-width:0;font-size:13.5px;line-height:1.2;
          font-weight:700;color:#F2F6FA;
          text-shadow:0 1px 10px rgba(0,0,0,.55);}
        .cd-infos span b{font-weight:850;}
        .cd-infos span i{display:block;margin-top:1px;font-style:normal;
          font-size:12px;font-weight:600;color:rgba(236,240,246,.74);}

        .cd-gestes{display:flex;align-items:flex-start;justify-content:center;gap:26px;margin-top:16px;}
        .cd-g{display:flex;flex-direction:column;align-items:center;gap:6px;}
        .cd-g i{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;
          font-style:normal;font-size:19px;color:#D6DEE4;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.12);transition:transform .3s cubic-bezier(.34,1.4,.64,1),box-shadow .3s ease;}
        .cd-g.grand i{width:62px;height:62px;font-size:24px;color:#04150E;border:0;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);box-shadow:0 14px 30px -12px rgba(18,185,129,.85);}
        .cd-g em{font-style:normal;font-size:11px;font-weight:700;color:#93A79C;}
        .cd-g.grand em{color:#8FE9C4;}
        /* Le geste mis en avant grossit — c'est le seul moment où la carte
           montre ce qu'on ATTEND de l'habitant, pas ce qu'on lui propose. */
        .cd-g.on i{transform:scale(1.14);box-shadow:0 0 0 4px rgba(126,230,192,.22);}

        @media (max-width:380px){
          .cd-carte{max-width:300px;}
          .cd-nom{font-size:22px;}
          .cd-gestes{gap:20px;}
          .cd-g i{width:44px;height:44px;}
          .cd-g.grand i{width:56px;height:56px;}
        }
        @media (prefers-reduced-motion:reduce){
          .cd-g i{transition:none;}
        }

        /* ═══════════════════════════════════════════════════════════════════
           LA PHOTO ENTIERE, ET UN PANNEAU DE SA COULEUR SOUS ELLE
           ═══════════════════════════════════════════════════════════════════

           « On voit la coupe encore une fois qu'en partie. » — « Je ne veux
           pas de separation entre la photo et cette section grise, je veux que
           ce soit soft et adouci. »

           CE BLOC EST EN DERNIER, ET CE N'EST PAS DU RANGEMENT. Les variantes
           « sec » et « flash » redefinissent le voile plus haut avec la meme
           force de selecteur : a egalite, c'est l'ordre du fichier qui tranche.
           Place avant elles, ce bloc ne s'appliquerait pas aux cartes seches ni
           aux flashs — c'est-a-dire a deux des cas qu'on veut justement
           uniformiser.

           ET IL NE S'APPLIQUE QU'APRES LA MESURE. La classe « mesuree » arrive
           avec la hauteur et la couleur ; sans elle — rendu serveur, image qui
           ne charge pas, toile refusee — la carte garde exactement le cadrage
           d'avant. Voir partDeLaPhoto et basDeLImage, en tete de fichier. */
        .cd-carte.mesuree{background:var(--cd-fond,#0D1A15);}
        /* LA LARGEUR EST PLEINE, LA HAUTEUR SUIT. Le sujet n'est plus ampute
           sur les cotes ; ce qui depasse en hauteur sort par le bas, sous le
           raccord. */
        .cd-carte.mesuree .cd-photo{inset:auto 0 auto 0;top:0;
          height:var(--cd-photo-h,100%);
          background-size:auto var(--cd-photo-h,100%);
          background-position:center top;}
        .cd-carte.mesuree .cd-film{inset:auto 0 auto 0;top:0;
          height:var(--cd-photo-h,100%);object-fit:cover;}
        /* LE VOILE NE SERT PLUS SOUS LA PHOTO : le panneau y fait le contraste.
           Il reste sur l'image, la ou du texte peut passer dessus. */
        .cd-carte.mesuree .cd-voile{inset:auto 0 auto 0;top:0;
          height:var(--cd-photo-h,100%);}
        /* LE RACCORD. Il tient ENTIEREMENT dans la photo et atteint la couleur
           du fond a son dernier point — mesure au pixel : un point d'ecart
           entre deux lignes voisines, puis plus rien. */
        /* ═══ ET LE TITRE DESCEND AU BAS DE LA PHOTO ═══
           La carte poussait son titre TOUT EN HAUT et le reste TOUT EN BAS,
           la photo respirant entre les deux. C'etait juste quand l'image
           occupait l'ecran entier ; avec un panneau sous elle, ca laisse une
           bande de couleur vide en plein milieu — et le titre se retrouve pose
           sur un visage.
           TOUT SE RANGE DONC EN BAS, dans l'ordre ou on le lit : le titre et le
           prix d'abord, a cheval sur le dernier tiers de la photo, puis le nom,
           les gestes et la barre. C'est la mise en page qu'il a validee sur la
           proposition. */
        .cd-carte.sec.mesuree .cd-bas{justify-content:flex-end;}
        .cd-carte.sec.mesuree .cd-dit{margin-bottom:0;}
        .cd-raccord{position:absolute;left:0;right:0;height:130px;z-index:1;
          top:min(max(0px, calc(var(--cd-photo-h,100%) - 130px)), calc(100% - 130px));
          background:linear-gradient(180deg,
            rgba(0,0,0,0) 0%,
            color-mix(in srgb, var(--cd-fond,#0D1A15) 34%, transparent) 40%,
            color-mix(in srgb, var(--cd-fond,#0D1A15) 82%, transparent) 74%,
            var(--cd-fond,#0D1A15) 100%);}
      `,
      }}
    />
  );
}
