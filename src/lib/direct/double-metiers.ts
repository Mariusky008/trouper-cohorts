/**
 * 🧭 LE DOUBLE, MÉTIER PAR MÉTIER — ce qu'on lui demande, et comment il le dit.
 *
 * « Il va falloir uniformiser tout ceci avec le reste des métiers, mais
 * attention, tout le monde n'a pas la même logique. »
 *
 * UN SEUL DOUBLE, NEUF MANIÈRES DE TENIR SA BOUTIQUE. Le cerveau, l'écran, la
 * voix sont les mêmes partout ; ce qui change, c'est ce qu'on vient chercher :
 * une table au restaurant, un rendez-vous chez le coiffeur, un bouquet à
 * retirer chez la fleuriste, une pièce mise de côté en boutique. Écrire
 * « réserver une table » chez une fleuriste, c'est lui montrer qu'on n'a pas
 * compris son métier.
 *
 * TOUT CE QUI DÉPEND DU MÉTIER EST ICI, et nulle part ailleurs : les mots, les
 * questions proposées, la demande (avec ou sans nombre de personnes), les
 * heures, et le nom qu'on donne au commerçant quand on ne connaît pas son
 * prénom. Ajouter un métier, c'est ajouter une entrée.
 */

export type FamilleDouble = "table" | "bar" | "coiffure" | "ongles" | "fleurs" | "mode" | "createur" | "lunettes" | "seance";

export type ProfilDouble = {
  famille: FamilleDouble;
  /** Ce qu'il fait, quand on connaît son prénom : « Julien, cuisinier ». */
  role: string;
  /** Comment on l'appelle sans prénom — et ses deux accords, écrits à la main. */
  anonyme: string;
  aAnonyme: string;
  deAnonyme: string;
  /** « le restaurant », « le salon », « la boutique »… */
  lieu: string;
  /** Pour la consigne du modèle : « restaurant », « boutique de fleurs »… */
  typeLieu: string;
  /** Ce que montre l'annonce, dit comme on le demande : « le plat du jour ». */
  vedette: string;
  /** La question qui va avec, pour les pastilles. */
  questionVedette: string;
  /** Le nom de la liste : « La carte », « Les prestations », « Les bouquets »… */
  carteNom: string;
  /** Les trois questions du premier écran. */
  suggestions: string[];
  /** Ce qu'on vient réserver, et comment. */
  demande: {
    /** Le titre de la carte : « Réserver une table », « Prendre rendez-vous ». */
    titre: string;
    /** Le même, en un ou deux mots, pour un bouton : « Réserver », « Commander ». */
    court: string;
    /** Ce qu'on demande, dans une phrase : « une table », « un rendez-vous ». */
    objet: string;
    /** Pour la consigne : « réserver une table », « prendre rendez-vous ». */
    verbe: string;
    /** La pastille : « Une table ce soir ? », « Un rendez-vous ? ». */
    pastille: string;
    /** Ce qu'il propose après un merci : « Je te garde une table ? ». */
    proposition: string;
    /** Un nombre de personnes à choisir — la table, pas le rendez-vous. */
    personnes: boolean;
    heures: string[];
    /** Ce que le client « dit » en confirmant. */
    phrase: (jour: string, heure: string, personnes: number) => string;
  };
  /** Ce qu'il transmet plutôt que de deviner, pour la consigne. */
  sensible: string;
  /**
   * LE BOUTON DES AUTRES CLIENTS, dans la colonne de droite de l'annonce.
   * « Les autres clients qui ont essayé le même bouquet chez eux, ou la même
   * coupe, ou les mêmes ongles » : ce que le fantôme ouvrait avant, dit dans
   * les mots de ce qu'on y voit. Douze signes au plus — il tient sous une icône.
   */
  murCourt: string;
};

const HEURES_TABLE = ["12 h", "12 h 30", "13 h", "13 h 30", "19 h 30", "20 h", "20 h 30", "21 h"];
const HEURES_BAR = ["18 h", "19 h", "20 h", "21 h", "22 h", "23 h"];
const HEURES_SALON = ["9 h 30", "10 h 30", "11 h 30", "14 h", "15 h", "16 h", "17 h", "18 h"];
const HEURES_BOUTIQUE = ["10 h", "11 h", "12 h", "14 h 30", "15 h 30", "16 h 30", "17 h 30", "18 h 30"];

const EQUIPE = { anonyme: "l'équipe", aAnonyme: "à l'équipe", deAnonyme: "de l'équipe" };

const RENDEZ_VOUS = (heures: string[]): ProfilDouble["demande"] => ({
  titre: "Prendre rendez-vous",
  court: "Rendez-vous",
  objet: "un rendez-vous",
  verbe: "prendre rendez-vous",
  pastille: "Un rendez-vous ?",
  proposition: "Je te trouve un créneau ?",
  personnes: false,
  heures,
  phrase: (jour, heure) => `Un rendez-vous ${jour} à ${heure}.`,
});

const DE_COTE: ProfilDouble["demande"] = {
  titre: "Faire mettre de côté",
  court: "Mettre de côté",
  objet: "de te la mettre de côté",
  verbe: "mettre la pièce de côté pour un passage en boutique",
  pastille: "Me la mettre de côté ?",
  proposition: "Je te la mets de côté ?",
  personnes: false,
  heures: HEURES_BOUTIQUE,
  phrase: (jour, heure) => `Je passe ${jour} vers ${heure}, tu me la mets de côté ?`,
};

const PROFILS: Record<FamilleDouble, ProfilDouble> = {
  table: {
    famille: "table",
    murCourt: "Leurs avis",
    role: "cuisinier",
    anonyme: "le chef",
    aAnonyme: "au chef",
    deAnonyme: "du chef",
    lieu: "le restaurant",
    typeLieu: "restaurant",
    vedette: "le plat du jour",
    questionVedette: "Le plat du jour ?",
    carteNom: "La carte",
    suggestions: ["Le plat du jour ?", "Ton histoire ?", "Ta spécialité ?"],
    demande: {
      titre: "Réserver une table",
      court: "Réserver",
      objet: "une table",
      verbe: "réserver une table",
      pastille: "Une table ce soir ?",
      proposition: "Je te garde une table ?",
      personnes: true,
      heures: HEURES_TABLE,
      phrase: (jour, heure, n) => `Une table pour ${n}, ${jour} à ${heure}.`,
    },
    sensible: "Allergies, régimes, ingrédients précis, vin",
  },
  bar: {
    famille: "bar",
    murCourt: "Leurs soirées",
    role: "qui tient le bar",
    ...EQUIPE,
    lieu: "le bar",
    typeLieu: "bar",
    vedette: "ce qui se passe ce soir",
    questionVedette: "Ce soir, il y a quoi ?",
    carteNom: "La carte",
    suggestions: ["Ce soir, il y a quoi ?", "Ton histoire ?", "Ta spécialité ?"],
    demande: {
      titre: "Réserver une table",
      court: "Réserver",
      objet: "une table",
      verbe: "réserver une table",
      pastille: "Une table ce soir ?",
      proposition: "Je te garde une table ?",
      personnes: true,
      heures: HEURES_BAR,
      phrase: (jour, heure, n) => `Une table pour ${n}, ${jour} à ${heure}.`,
    },
    sensible: "Allergies, âge, privatisation, tarifs de groupe",
  },
  coiffure: {
    famille: "coiffure",
    murCourt: "Leurs coupes",
    role: "qui tient le salon",
    ...EQUIPE,
    lieu: "le salon",
    typeLieu: "salon de coiffure",
    vedette: "la coupe du moment",
    questionVedette: "La coupe du moment ?",
    carteNom: "Les prestations",
    suggestions: ["La coupe du moment ?", "Ton histoire ?", "Tes prix ?"],
    demande: RENDEZ_VOUS(HEURES_SALON),
    sensible: "Allergies aux produits, cuir chevelu sensible, colorations complexes, tarif exact selon la longueur",
  },
  ongles: {
    famille: "ongles",
    murCourt: "Leurs ongles",
    role: "qui tient l'onglerie",
    ...EQUIPE,
    lieu: "l'onglerie",
    typeLieu: "onglerie",
    vedette: "la pose du moment",
    questionVedette: "La pose du moment ?",
    carteNom: "Les prestations",
    suggestions: ["La pose du moment ?", "Ton histoire ?", "Tes prix ?"],
    demande: RENDEZ_VOUS(HEURES_SALON),
    sensible: "Allergies aux produits, ongles abîmés, tarif exact selon la longueur",
  },
  fleurs: {
    famille: "fleurs",
    murCourt: "Chez eux",
    role: "fleuriste",
    ...EQUIPE,
    lieu: "la boutique",
    typeLieu: "boutique de fleurs",
    vedette: "le bouquet du moment",
    questionVedette: "Le bouquet du moment ?",
    carteNom: "Les bouquets",
    suggestions: ["Le bouquet du moment ?", "Ton histoire ?", "Tu livres ?"],
    demande: {
      titre: "Commander un bouquet",
      court: "Commander",
      objet: "un bouquet à retirer",
      verbe: "commander un bouquet à retirer en boutique",
      pastille: "Commander un bouquet ?",
      proposition: "Je te prépare un bouquet ?",
      personnes: false,
      heures: HEURES_BOUTIQUE,
      phrase: (jour, heure) => `Un bouquet à retirer ${jour} vers ${heure}.`,
    },
    sensible: "Livraison, deuil et mariage sur mesure, tarif exact d'une composition",
  },
  mode: {
    famille: "mode",
    murCourt: "Leurs essais",
    role: "qui tient la boutique",
    ...EQUIPE,
    lieu: "la boutique",
    typeLieu: "boutique de mode",
    vedette: "la pièce du moment",
    questionVedette: "La pièce du moment ?",
    carteNom: "La collection",
    suggestions: ["La pièce du moment ?", "Ton histoire ?", "Quelles tailles ?"],
    demande: DE_COTE,
    sensible: "Tailles et stocks exacts, retouches, échanges et remboursements",
  },
  createur: {
    famille: "createur",
    murCourt: "Chez eux",
    role: "qui tient l'atelier",
    ...EQUIPE,
    lieu: "l'atelier",
    typeLieu: "atelier de création",
    vedette: "la création du moment",
    questionVedette: "La création du moment ?",
    carteNom: "Les créations",
    suggestions: ["La création du moment ?", "Ton histoire ?", "Tu fais sur mesure ?"],
    demande: DE_COTE,
    sensible: "Sur-mesure, délais, stocks exacts",
  },
  lunettes: {
    famille: "lunettes",
    murCourt: "Leurs essais",
    role: "qui tient la boutique",
    ...EQUIPE,
    lieu: "la boutique",
    typeLieu: "opticien lunetier",
    vedette: "la monture du moment",
    questionVedette: "La monture du moment ?",
    carteNom: "Les montures",
    suggestions: ["La monture du moment ?", "Ton histoire ?", "Un rendez-vous ?"],
    demande: RENDEZ_VOUS(HEURES_BOUTIQUE),
    sensible: "Correction, ordonnance, remboursement mutuelle, questions de santé des yeux",
  },
  seance: {
    famille: "seance",
    murCourt: "Leurs avis",
    role: "qui reçoit",
    ...EQUIPE,
    lieu: "le cabinet",
    typeLieu: "cabinet",
    vedette: "ce qu'on propose",
    questionVedette: "Comment ça se passe ?",
    carteNom: "Les séances",
    suggestions: ["Comment ça se passe ?", "Ton histoire ?", "Un rendez-vous ?"],
    demande: RENDEZ_VOUS(HEURES_SALON),
    sensible: "Toute question de santé, contre-indications, tarif exact",
  },
};

/**
 * LA FAMILLE D'UN COMMERCE, D'APRÈS SA BRANCHE — et son métier quand la branche
 * ne suffit pas (« créateurs & indépendants » range un tatoueur, une
 * céramiste et un hypnothérapeute).
 */
export function familleDuDouble(c: { branche?: string | null; metier?: string | null }): FamilleDouble {
  const b = c.branche ?? "";
  const m = (c.metier ?? "").toLowerCase();
  /* LE MÉTIER PASSE DEVANT LA BRANCHE QUAND IL NE LAISSE AUCUN DOUTE : une
     « prothésiste ongulaire » rangée ailleurs reste une onglerie. */
  if (/ongl|manucur/.test(m)) return "ongles";
  if (/coiff|barbier/.test(m)) return "coiffure";
  if (/fleur/.test(m)) return "fleurs";
  if (b === "restaurant" || b === "boulangerie") return "table";
  if (b === "bar") return "bar";
  if (b === "coiffeur") return /ongl/.test(m) ? "ongles" : "coiffure";
  if (b === "ongles") return "ongles";
  if (b === "fleuriste") return "fleurs";
  if (b === "mode") return "mode";
  if (b === "lunetier") return "lunettes";
  if (b === "artisan") {
    if (/tatou|tattoo|pierc/.test(m)) return "seance";
    if (/cir|bougie|bijou|bracelet|collier|joaill|c[ée]ram|potier|atelier|cr[ée]at/.test(m)) return "createur";
    return "seance";
  }
  if (/restaur|pizz|burger|traiteur|boulang|p[âa]tiss/.test(m)) return "table";
  if (/fleur/.test(m)) return "fleurs";
  if (/coiff|barbier/.test(m)) return "coiffure";
  if (/ongl/.test(m)) return "ongles";
  return "mode";
}

export function profilDuDouble(c: { branche?: string | null; metier?: string | null }): ProfilDouble {
  const p = PROFILS[familleDuDouble(c)];
  /* UN TATOUEUR REÇOIT DANS UN STUDIO, PAS DANS UN CABINET. */
  if (p.famille === "seance" && /tatou|tattoo|pierc/.test((c.metier ?? "").toLowerCase())) {
    return { ...p, lieu: "le studio", typeLieu: "studio de tatouage", carteNom: "Les flashs", vedette: "le flash du moment", questionVedette: "Le flash du moment ?", suggestions: ["Le flash du moment ?", "Ton histoire ?", "Un rendez-vous ?"] };
  }
  return p;
}

/**
 * LE NOM DU COMMERCE AU MILIEU D'UNE PHRASE. « Parle avec Une fleuriste du
 * marché » : l'article d'un nom de démonstration garde sa majuscule de début
 * de ligne. Seuls « Un » et « Une » tombent en minuscule — « Chez Bergine »
 * et « Le Bocal de Margot » sont des noms propres.
 */
export function nomDansPhrase(nom: string): string {
  return /^(Un|Une)\s/.test(nom) ? nom[0].toLowerCase() + nom.slice(1) : nom;
}

/** Vrai pour les commerces qui ont un double : pas un événement, pas une offre d'emploi. */
export function aUnDouble(c: { branche?: string | null }): boolean {
  return (c.branche ?? "") !== "evenement";
}
