/**
 * 👻 CE QUE LE FANTÔME DEMANDE À CHAQUE MÉTIER — et rien de plus.
 *
 * « Il faut penser cette interface commerçant super simple, intuitive,
 * conversationnelle, immédiate. Restaurant : je dis ce que j'ai au menu,
 * j'ajoute des photos et c'est terminé. Je peux revenir plus tard dire s'il y
 * a des restes à vendre après 14 h. Librairie : je dis le livre du jour que je
 * conseille, pour combien de jours je le mets en conseil, et je rajoute les
 * photos du livre. Coiffeur : une nouvelle coupe à mettre pour que les gens
 * puissent l'essayer. Onglerie : idem. »
 *
 * UNE MISSION PAR MÉTIER, ET ELLE TIENT EN TROIS OU QUATRE QUESTIONS. Chaque
 * question est une étape : on la pose, il répond (à la voix ou au clavier),
 * on passe à la suivante. Jamais deux questions à la fois, jamais un
 * formulaire, jamais une catégorie à choisir avant de parler.
 *
 * LES MOTS SONT CEUX DU MÉTIER. Le restaurateur parle de son plat et de
 * l'assiette, la libraire de son livre et de sa couverture, le coiffeur de sa
 * coupe « de face », parce que c'est cette photo-là que l'essayage pose sur le
 * client. Ce qu'on demande est exactement ce que sa page montre ensuite.
 *
 * FICHIER PARTAGÉ : aucune dépendance au DOM.
 */
import type { FamilleDouble } from "@/lib/direct/double-metiers";

/** Une question du fantôme. */
export type Etape =
  /** Ce qu'il propose, dit en une phrase : le nom et le prix en sortent. */
  | { type: "dire"; question: string; exemple: string; nomDuChamp: string }
  /** Ses photos : au moins `min`, au plus `max`. */
  | { type: "photos"; question: string; conseil: string; min: number; max: number }
  /** Combien de temps l'annonce reste en ligne. */
  | { type: "duree"; question: string; choix: { jours: number; mot: string }[] }
  /**
   * Un mot à ses clients, à sa voix : c'est l'étape 2 de l'Expérience sur sa
   * page (« La voix du chef »). Facultatif — on peut passer.
   */
  | { type: "voix"; question: string; exemple: string };

/** La petite annonce de l'après-midi : « il me reste des parts ». */
export type Relance = {
  /** À partir de quelle heure le fantôme la propose (en heures décimales). */
  apres: number;
  titre: string;
  question: string;
  exemple: string;
};

export type Mission = {
  famille: FamilleDouble;
  /** Ce qu'il publie, en deux mots : « Le plat du jour ». */
  quoi: string;
  /** L'emoji du métier, pour les cartes et la fête. */
  icone: string;
  etapes: Etape[];
  /** Ce que dit le fantôme une fois que c'est en ligne. */
  bravo: string;
  relance?: Relance;
};

const JOURNEE = [
  { jours: 1, mot: "Aujourd’hui" },
  { jours: 3, mot: "3 jours" },
  { jours: 7, mot: "Une semaine" },
];

export const MISSIONS: Record<FamilleDouble, Mission> = {
  table: {
    famille: "table",
    quoi: "Le plat du jour",
    icone: "🍽️",
    etapes: [
      { type: "dire", question: "Qu’est-ce qu’il y a au menu aujourd’hui ?", exemple: "« Magret frites maison, 19 euros »", nomDuChamp: "Le plat" },
      { type: "photos", question: "Montre-moi l’assiette !", conseil: "De près, avec la lumière du jour si tu peux.", min: 1, max: 4 },
      { type: "voix", question: "Un mot pour tes clients ?", exemple: "« Ce plat, c’est celui que je cuisine quand mes amis viennent manger. »" },
    ],
    bravo: "Ton plat est en ligne ! S’il t’en reste après le service, reviens me le dire.",
    relance: {
      apres: 14,
      titre: "Il en reste !",
      question: "Il t’en reste combien, et à quel prix ?",
      exemple: "« Il me reste 5 parts, à 12 euros »",
    },
  },
  bar: {
    famille: "bar",
    quoi: "Ce soir",
    icone: "🍷",
    etapes: [
      { type: "dire", question: "Qu’est-ce qui se passe ce soir ?", exemple: "« Concert à 21 h, la pinte à 6 euros »", nomDuChamp: "Ce soir" },
      { type: "photos", question: "Montre-moi l’ambiance !", conseil: "Le comptoir, la terrasse, ou le groupe qui s’installe.", min: 1, max: 4 },
      { type: "voix", question: "Un mot pour donner envie de passer ?", exemple: "« Venez tôt, la terrasse se remplit vite. »" },
    ],
    bravo: "C’est en ligne ! Les gens du coin le voient dès maintenant.",
  },
  coiffure: {
    famille: "coiffure",
    quoi: "La coupe à essayer",
    icone: "✂️",
    etapes: [
      { type: "dire", question: "Quelle coupe tu proposes d’essayer ?", exemple: "« Carré court, pointes rentrées, 42 euros »", nomDuChamp: "La coupe" },
      { type: "photos", question: "Une photo de la coupe, de face !", conseil: "Visage de face, cheveux bien visibles : c’est cette photo que tes clients essaient sur eux.", min: 1, max: 3 },
      { type: "duree", question: "Je la laisse à l’essai combien de temps ?", choix: [{ jours: 7, mot: "Une semaine" }, { jours: 30, mot: "Un mois" }, { jours: 365, mot: "Toujours" }] },
      { type: "voix", question: "Un mot pour la présenter ?", exemple: "« Facile à coiffer le matin, elle tient trois mois. »" },
    ],
    bravo: "Ta coupe est en ligne : tes clients peuvent déjà l’essayer sur eux !",
  },
  ongles: {
    famille: "ongles",
    quoi: "La pose à essayer",
    icone: "💅",
    etapes: [
      { type: "dire", question: "Quelle pose tu mets en avant ?", exemple: "« French rose poudré, 35 euros »", nomDuChamp: "La pose" },
      { type: "photos", question: "Une photo de la main !", conseil: "La main à plat, ongles bien visibles : c’est elle que tes clientes essaient.", min: 1, max: 3 },
      { type: "duree", question: "Je la laisse à l’essai combien de temps ?", choix: [{ jours: 7, mot: "Une semaine" }, { jours: 30, mot: "Un mois" }, { jours: 365, mot: "Toujours" }] },
      { type: "voix", question: "Un mot pour la présenter ?", exemple: "« Parfaite pour l’automne, elle tient trois semaines. »" },
    ],
    bravo: "Ta pose est en ligne : tes clientes peuvent l’essayer sur leur main !",
  },
  mode: {
    famille: "mode",
    quoi: "La pièce du moment",
    icone: "👗",
    etapes: [
      { type: "dire", question: "Quelle pièce vient d’arriver ?", exemple: "« Le blazer rose, 79 euros, du 36 au 44 »", nomDuChamp: "La pièce" },
      { type: "photos", question: "Montre-la moi !", conseil: "Portée ou sur cintre, devant un mur clair.", min: 1, max: 4 },
      { type: "duree", question: "Je la mets en avant combien de temps ?", choix: JOURNEE },
      { type: "voix", question: "Un mot pour la présenter ?", exemple: "« Elle taille juste, prenez votre taille habituelle. »" },
    ],
    bravo: "Ta pièce est en ligne : on peut déjà l’essayer depuis ta page !",
  },
  fleurs: {
    famille: "fleurs",
    quoi: "Le bouquet du jour",
    icone: "💐",
    etapes: [
      { type: "dire", question: "Quel bouquet tu proposes aujourd’hui ?", exemple: "« Bouquet de pivoines, 25 euros »", nomDuChamp: "Le bouquet" },
      { type: "photos", question: "Montre-moi le bouquet !", conseil: "Sur un fond simple, il ressort mieux.", min: 1, max: 4 },
      { type: "voix", question: "Un mot pour tes clients ?", exemple: "« Arrivées ce matin, elles tiennent une semaine. »" },
    ],
    bravo: "Ton bouquet est en ligne ! S’il t’en reste en fin de journée, dis-le moi.",
    relance: {
      apres: 17,
      titre: "Il en reste !",
      question: "Il t’en reste combien, et à quel prix ?",
      exemple: "« Il me reste 3 bouquets, à 15 euros »",
    },
  },
  createur: {
    famille: "createur",
    quoi: "La création du moment",
    icone: "🕯️",
    etapes: [
      { type: "dire", question: "Quelle création tu mets en avant ?", exemple: "« Bougie figue et cèdre, 24 euros »", nomDuChamp: "La création" },
      { type: "photos", question: "Montre-la moi !", conseil: "Seule, sur un fond simple.", min: 1, max: 4 },
      { type: "duree", question: "Je la mets en avant combien de temps ?", choix: JOURNEE },
      { type: "voix", question: "Raconte-la en une phrase ?", exemple: "« Coulée à la main, dans l’atelier, rue Neuve. »" },
    ],
    bravo: "Ta création est en ligne !",
  },
  lunettes: {
    famille: "lunettes",
    quoi: "La monture du moment",
    icone: "👓",
    etapes: [
      { type: "dire", question: "Quelle monture tu mets en avant ?", exemple: "« Monture écaille ronde, 129 euros »", nomDuChamp: "La monture" },
      { type: "photos", question: "Une photo de la monture, de face !", conseil: "Sur fond blanc, branches ouvertes : c’est elle qu’on essaie sur son visage.", min: 1, max: 3 },
      { type: "duree", question: "Je la laisse à l’essai combien de temps ?", choix: [{ jours: 7, mot: "Une semaine" }, { jours: 30, mot: "Un mois" }, { jours: 365, mot: "Toujours" }] },
      { type: "voix", question: "Un mot pour la présenter ?", exemple: "« Légère, elle va à presque tous les visages. »" },
    ],
    bravo: "Ta monture est en ligne : on peut l’essayer sur son visage !",
  },
  seance: {
    famille: "seance",
    quoi: "La séance à proposer",
    icone: "🌿",
    etapes: [
      { type: "dire", question: "Qu’est-ce que tu proposes en ce moment ?", exemple: "« Séance découverte d’une heure, 50 euros »", nomDuChamp: "La séance" },
      { type: "photos", question: "Une photo de ton cabinet ?", conseil: "Le lieu où l’on est reçu : ça rassure.", min: 0, max: 3 },
      { type: "duree", question: "Je la propose combien de temps ?", choix: JOURNEE },
      { type: "voix", question: "Un mot pour expliquer comment ça se passe ?", exemple: "« On commence toujours par parler dix minutes. »" },
    ],
    bravo: "C’est en ligne !",
  },
  librairie: {
    famille: "librairie",
    quoi: "Le livre conseillé",
    icone: "📚",
    etapes: [
      { type: "dire", question: "Quel livre tu conseilles aujourd’hui ?", exemple: "« L’Anomalie, d’Hervé Le Tellier, 9 euros 50 »", nomDuChamp: "Le livre" },
      { type: "duree", question: "Je le laisse en conseil combien de temps ?", choix: [{ jours: 1, mot: "Aujourd’hui" }, { jours: 3, mot: "3 jours" }, { jours: 7, mot: "Une semaine" }, { jours: 14, mot: "15 jours" }] },
      { type: "photos", question: "Montre-moi la couverture !", conseil: "Bien droite, sans reflet.", min: 1, max: 3 },
      { type: "voix", question: "Pourquoi tu l’aimes ?", exemple: "« Je l’ai lu d’une traite, je l’offre à tout le monde. »" },
    ],
    bravo: "Ton conseil est en ligne ! Pas besoin de revenir avant qu’il se termine.",
  },
};

/** Les commerces de la démonstration — inventés, et ils le restent. */
export const COMMERCES_DEMO: { famille: FamilleDouble; metier: string; branche: string; prenom: string; nom: string }[] = [
  { famille: "table", metier: "Restaurant", branche: "restaurant", prenom: "Margot", nom: "La Table de Margot" },
  { famille: "librairie", metier: "Librairie", branche: "librairie", prenom: "Alice", nom: "La Page d’Alice" },
  { famille: "coiffure", metier: "Coiffeur", branche: "coiffeur", prenom: "Yann", nom: "L’Atelier de Yann" },
  { famille: "ongles", metier: "Onglerie", branche: "ongles", prenom: "Sophie", nom: "Institut Sophie" },
  { famille: "mode", metier: "Prêt-à-porter", branche: "mode", prenom: "Claire", nom: "Le Dressing" },
  { famille: "fleurs", metier: "Fleuriste", branche: "fleuriste", prenom: "Élise", nom: "Au Jardin d’Élise" },
  { famille: "bar", metier: "Bar à vins", branche: "bar", prenom: "Thomas", nom: "Le Comptoir" },
  { famille: "createur", metier: "Créatrice de bougies", branche: "artisan", prenom: "Jade", nom: "L’Atelier de Jade" },
  { famille: "lunettes", metier: "Opticien", branche: "lunetier", prenom: "Paul", nom: "Optique du Centre" },
  { famille: "seance", metier: "Sophrologue", branche: "artisan", prenom: "Inès", nom: "Le Cabinet d’Inès" },
];

/* ═══ CE QU'IL A DIT, RANGÉ ═══════════════════════════════════════════════
   « Magret frites maison, dix-neuf euros » doit donner un nom et un prix,
   sans modèle de langue : la réponse doit être immédiate, et elle doit marcher
   sans réseau. La carte qui suit lui montre les deux, et un doigt suffit à
   corriger — c'est elle qui autorise le vocal (voir `voix-micro.ts`). */

const UNITES: Record<string, number> = {
  zéro: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
};

/** « dix-neuf » → 19, « vingt-cinq » → 25, « soixante-dix » → 70. Rien de plus. */
function nombreEnLettres(mots: string): number | null {
  const parts = mots.toLowerCase().replace(/-/g, " ").replace(/\bet\b/g, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  let total = 0;
  for (const p of parts) {
    const v = UNITES[p];
    if (p === "cent") total = (total || 1) * 100;
    // « quatre-vingt » : le quatre qu'on vient d'ajouter multiplie le vingt.
    else if (p === "vingt" && total % 100 === 4) total += 76;
    else if (v === undefined) return null;
    else total += v;
  }
  return total;
}

const MOTS_NOMBRE = "(?:z[ée]ro|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|cent|et|-|\\s)+";

/** Le prix dit dans une phrase : « 19 euros », « 9,50 € », « 9 euros 50 », « dix-neuf euros ». */
export function extrairePrix(texte: string): { prix: string; reste: string } {
  const enChiffres = /(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)(?:\s*(\d{1,2})\b)?/i;
  const m = texte.match(enChiffres);
  if (m) {
    let n = m[1].replace(".", ",");
    if (m[2] && !n.includes(",")) n = `${n},${m[2].padEnd(2, "0")}`;
    return { prix: `${n} €`, reste: texte.replace(m[0], " ") };
  }
  const enLettres = new RegExp(`(${MOTS_NOMBRE})\\s*euros?(?:\\s+(${MOTS_NOMBRE}))?`, "i");
  const l = texte.match(enLettres);
  if (l) {
    const e = nombreEnLettres(l[1].trim());
    if (e !== null && e > 0) {
      const c = l[2] ? nombreEnLettres(l[2].trim()) : null;
      return { prix: c ? `${e},${String(c).padStart(2, "0")} €` : `${e} €`, reste: texte.replace(l[0], " ") };
    }
  }
  return { prix: "", reste: texte };
}

/** Les mots qu'on dit avant de dire la chose : « aujourd'hui on a », « au menu c'est »… */
const AMORCES = [
  /^(bon|alors|euh|ben|donc|oui|ok|voil[àa])[\s,]+/i,
  /^aujourd['’]hui[\s,]+/i,
  /^(au menu|ce midi|ce soir|en ce moment|cette semaine)[\s,]+/i,
  /^(on a|j['’]ai|il y a|y a|c['’]est|je propose|je conseille|je mets en avant|je vous propose|nous avons)[\s,]+/i,
  /^(un|une|le|la|les|des)\s+(?=(nouvelle|nouveau)\s)/i,
];

/**
 * « aujourd'hui on a un magret frites maison à 19 euros » → { nom: "Magret
 * frites maison", prix: "19 €" }.
 *
 * L'ARTICLE DU DÉBUT TOMBE (« un magret » → « Magret »), sauf pour un titre :
 * « Une vie », de Maupassant, ne devient pas « Vie ». `titre` le garde.
 */
export function rangerLaPhrase(texte: string, opts: { titre?: boolean } = {}): { nom: string; prix: string } {
  const { prix, reste } = extrairePrix(texte);
  let nom = reste.replace(/\s+/g, " ").trim();
  for (let i = 0; i < 4; i++) for (const a of AMORCES) nom = nom.replace(a, "");
  if (!opts.titre) nom = nom.replace(/^(un|une|des|du)\s+/i, "");
  nom = nom
    .replace(/\s+(à|a|pour|au prix de)\s*[.,!]*$/i, "")
    .replace(/[\s,.;:!-]+$/g, "")
    .replace(/^[\s,.;:!-]+/g, "")
    .trim();
  if (nom) nom = nom[0].toUpperCase() + nom.slice(1);
  return { nom, prix };
}

/** La mission d'un commerce, d'après sa famille. */
export function missionDe(famille: FamilleDouble): Mission {
  return MISSIONS[famille] ?? MISSIONS.mode;
}
