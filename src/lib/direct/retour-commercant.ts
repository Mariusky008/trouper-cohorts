// 📈 CE QUE LE COMMERÇANT RÉCUPÈRE — l'autre bout du fil
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// UN RESTAURATEUR À QUI L'ON MONTRE LE PARCOURS D'AVANT-GOÛT DIT « C'EST JOLI ».
// Le même restaurateur à qui l'on montre, après : « trente et une personnes ont
// ouvert votre plat, neuf ont tiré le rideau, quatre vous ont écrit », celui-là
// sort son téléphone.
//
// TOUT LE PRODUIT EST ÉCRIT DU CÔTÉ DE L'HABITANT — ce qu'il voit, ce qu'il
// essaie, ce qu'il garde. C'est ce qui explique le mécanisme, et ça laisse
// entière la seule question que le commerçant se pose vraiment : EST-CE QUE
// QUELQU'UN REGARDE. Personne n'y répond en l'affirmant. On y répond en lui
// montrant ce qu'on a compté.
//
// ═══ ET LE CARNET DE PARCOURS NE PEUT PAS SERVIR À ÇA ═══════════════════════
//
// `parcours.ts` mesure déjà tout ce qu'il faudrait — et il est ANONYME PAR
// CONCEPTION : « le jeton de session vit dans sessionStorage, donc deux visites
// de la même personne sont deux inconnus ». C'est une garantie qu'on tient, pas
// une limite qu'on contourne. Les chiffres d'ici viendront d'un compteur par
// commerce, jamais de ce carnet-là.
//
// EN ATTENDANT ILS SONT POSÉS, COMME CEUX DU BILAN. La règle du dossier vaut
// aussi ici : « on n'invente pas de chiffres qu'on ne saurait pas produire ».
// Ceux-ci, on saura les produire — ce sont des compteurs, pas des estimations —
// et l'écran dit qu'il s'agit d'une démonstration.
//
// ═══ CE QU'ON NE COMPTERA JAMAIS, ET C'EST LE PLUS IMPORTANT ════════════════
//
// « SONT VENUES ». On sait qu'une demande WhatsApp est partie ; on ne sait pas
// qui a poussé la porte. Une ligne « 2 sont venues » serait le premier chiffre
// faux de cet écran, et un chiffre gonflé une seule fois fait perdre un
// commerçant pour toujours. L'entonnoir s'arrête donc à « vous ont écrit », et
// l'écran le DIT plutôt que de laisser croire qu'il s'est arrêté par hasard.

import { goutDuCommerce, type Gout } from "@/lib/direct/avant-gout";
import { phraseDeLaCarte, type PhraseGardee } from "@/lib/direct/sa-voix";

/**
 * UNE MARCHE DE L'ENTONNOIR.
 *
 * `part` est la proportion de la marche précédente, pas du total : c'est ce
 * qu'on lit quand on cherche OÙ ÇA S'ARRÊTE, et c'est la seule question que cet
 * écran doit rendre facile.
 */
export type Marche = {
  cle: string;
  combien: number;
  /** Ce qu'ils ont fait, écrit de son point de vue à lui. */
  mot: string;
  /** La part de la marche d'avant, en pour cent. Nulle sur la première. */
  part: number;
  /** Vrai sur la marche qui n'existe que parce qu'il a fourni quelque chose. */
  sienne?: boolean;
};

export type PhotoDeClient = {
  src: string;
  /** Ce qu'elle montre, écrit court. */
  quoi: string;
  /** Le prénom, tel qu'il est affiché sur son avis. */
  qui: string;
};

export type Retour = {
  /** Ce dont on parle — son plat, sa pièce. */
  quoi: string;
  marches: Marche[];
  photos: PhotoDeClient[];
  /**
   * LA MARCHE QUI TOMBE LE PLUS, et ce qu'on lui en dit.
   *
   * Calculée, jamais écrite : c'est la seule chose de cet écran qui ressemble à
   * un conseil, et un conseil qui ne suit pas les chiffres se voit tout de
   * suite.
   */
  creux?: { mot: string; conseil: string };
};

/* ═══════════════════════════════════════════════════════════════════════════
   LES CHIFFRES POSÉS — un par commerce qui a un parcours
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ON POSE LE HAUT DE L'ENTONNOIR, PAS CHAQUE MARCHE.
 *
 * Écrire les cinq chiffres à la main, c'est cinq occasions d'en écrire un plus
 * grand que celui du dessus. Ici on donne le nombre d'ouvertures et des taux de
 * passage ; les marches se calculent, et elles ne peuvent pas remonter.
 *
 * LES TAUX NE SONT PAS TIRÉS AU SORT. Ils viennent de ce qu'on observe
 * ailleurs dans ce dossier : on ouvre beaucoup, on va au bout peu, et le geste
 * qui demande un doigt coûte toujours plus que celui qui n'en demande pas.
 */
const POSES: Record<string, { ouvertures: number; taux: number[] }> = {
  // Le Bocal de Margot — le seul parcours qui a un rideau aujourd'hui.
  emporter: { ouvertures: 31, taux: [0.29, 0.67, 0.44] },
  centre: { ouvertures: 44, taux: [0.34, 0.6] },
  "deux-rues": { ouvertures: 26, taux: [0.31, 0.63] },
  tablee: { ouvertures: 19, taux: [0.37, 0.71] },
  traiteur: { ouvertures: 22, taux: [0.32, 0.57] },
  boucher: { ouvertures: 38, taux: [0.26, 0.6] },
  boulange: { ouvertures: 52, taux: [0.23, 0.58] },
};

/**
 * LES PHOTOS QUE SES CLIENTS ONT PRISES.
 *
 * C'EST LA PARTIE QUI FAIT LE PLUS D'EFFET, ET ELLE NE COÛTE RIEN À PRODUIRE :
 * elles existent déjà, elles sont sur ses avis. Les rassembler sous son bilan
 * change simplement qui les regarde — jusqu'ici, lui ne les voyait pas.
 *
 * ON N'EN INVENTE PAS. Un commerce dont aucun client n'a posté de photo n'a pas
 * de bande ici, exactement comme une annonce sans deuxième photo n'a pas de
 * rideau. Voir public/direct/LISEZ-MOI.md.
 */
const PHOTOS: Record<string, PhotoDeClient[]> = {
  emporter: [{ src: "/direct/avis-verre.jpg", quoi: "Sur la terrasse", qui: "Chloé" }],
  centre: [{ src: "/direct/avis-verre.jpg", quoi: "À table, jeudi soir", qui: "Paul" }],
  salon: [{ src: "/direct/avis-coupe.jpg", quoi: "La coupe, le soir même", qui: "Inès" }],
  fleuriste: [{ src: "/direct/avis-bouquet.jpg", quoi: "Le bouquet, rentré", qui: "Sofia" }],
  ongles: [{ src: "/direct/avis-ongles.jpg", quoi: "La pose, finie", qui: "Nadia" }],
};

/**
 * LES MARCHES DÉPENDENT DE CE QU'IL A DONNÉ, PAS D'UNE LISTE FIXE.
 *
 * C'EST LE CŒUR DE CE FICHIER. Un commerce sans seconde photo n'a pas de ligne
 * « ont tiré le rideau » — non pas à zéro, mais ABSENTE : zéro dirait que
 * personne ne l'a fait, alors que la vérité est qu'il n'y avait rien à tirer.
 * La différence n'est pas cosmétique, c'est la différence entre un reproche et
 * un fait.
 *
 * ET C'EST AUSSI CE QUI REND L'ÉCRAN UTILE : la ligne apparaît le jour où il
 * fournit la photo, et il voit ce qu'elle a produit. L'écran devient la réponse
 * à « est-ce que ça sert à quelque chose, tout ce qu'on me demande ? ».
 */
function marchesDuGout(gout: Gout, sonMot: PhraseGardee | undefined): string[] {
  const m = ["l’ont ouvert"];
  if (gout.temps.some((t) => t.photoApres)) m.push("ont tiré le rideau");
  if (sonMot) m.push("ont écouté votre voix");
  m.push("vous ont écrit");
  return m;
}

/** Les marches qui ne viennent QUE de ce qu'il a fourni. */
const SIENNES = new Set(["ont tiré le rideau", "ont écouté votre voix"]);

/**
 * CE QUE LE COMMERÇANT RÉCUPÈRE, OU RIEN.
 *
 * RIEN EST UN CAS NORMAL : un commerce sans parcours d'avant-goût n'a pas cet
 * écran, et l'inventer pour remplir la page serait exactement ce qu'on refuse
 * partout ailleurs.
 */
export function retourDuCommerce(
  carteId: string,
  gardees: PhraseGardee[] = [],
): Retour | undefined {
  const gout = goutDuCommerce(carteId);
  const pose = POSES[carteId];
  if (!gout || !pose) return undefined;

  const mots = marchesDuGout(gout, phraseDeLaCarte(carteId, gardees));
  const marches: Marche[] = [];
  let combien = pose.ouvertures;

  for (let i = 0; i < mots.length; i++) {
    if (i > 0) {
      /* LE TAUX MANQUANT NE VAUT PAS ZÉRO, IL VAUT LE DERNIER CONNU. Une marche
         apparue parce qu'il vient de fournir sa voix n'a pas encore son taux
         posé ; lui donner zéro afficherait « 0 ont écouté » le jour même où il
         a dit oui, ce qui est le pire moment pour lui mentir. */
      const t = pose.taux[i - 1] ?? pose.taux[pose.taux.length - 1] ?? 0.5;
      combien = Math.max(0, Math.round(combien * t));
    }
    marches.push({
      cle: `m${i}`,
      combien,
      mot: mots[i],
      part: i === 0 ? 0 : Math.round((combien / (marches[i - 1].combien || 1)) * 100),
      sienne: SIENNES.has(mots[i]) || undefined,
    });
  }

  return {
    quoi: gout.plat,
    marches,
    photos: PHOTOS[carteId] ?? [],
    creux: creuxDe(marches),
  };
}

/**
 * OÙ ÇA TOMBE LE PLUS — et ce qu'on en dit sans faire la leçon.
 *
 * LA PREMIÈRE MARCHE NE COMPTE PAS : de « vu » à « ouvert », la chute est
 * énorme partout et toujours, et la désigner reviendrait à dire chaque matin la
 * même chose à tout le monde. On cherche le décrochage ENTRE DEUX GESTES, parce
 * que c'est le seul sur lequel il peut faire quelque chose.
 */
function creuxDe(marches: Marche[]): Retour["creux"] {
  if (marches.length < 3) return undefined;
  let pire = marches[2];
  for (const m of marches.slice(2)) if (m.part < pire.part) pire = m;
  if (pire.part >= 55) return undefined;

  const conseils: Record<string, string> = {
    "ont tiré le rideau":
      "La photo servie est peut-être trop proche de la première. Une part, une assiette, un plan plus serré.",
    "ont écouté votre voix":
      "C’est normal : le son est coupé par défaut, et la phrase se lit sans l’écouter.",
    "vous ont écrit":
      "Ils sont allés au bout et ne vous ont pas écrit. Souvent, c’est l’heure qui manque.",
  };
  const conseil = conseils[pire.mot];
  return conseil ? { mot: pire.mot, conseil } : undefined;
}
