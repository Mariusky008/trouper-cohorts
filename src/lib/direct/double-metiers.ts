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
  if (/tatou|tattoo|pierc/.test(m)) return "seance";
  if (b === "restaurant" || b === "boulangerie") return "table";
  if (b === "bar") return "bar";
  if (b === "coiffeur") return /ongl/.test(m) ? "ongles" : "coiffure";
  if (b === "ongles") return "ongles";
  if (b === "fleuriste") return "fleurs";
  if (b === "mode") return "mode";
  if (b === "lunetier") return "lunettes";
  if (b === "artisan") {
    if (/tatou|tattoo|pierc/.test(m)) return "seance";
    /* UNE BOUTIQUE DE MEUBLES ET DE DÉCO VEND CE QU'ON MET DE CÔTÉ : elle
       tombait dans les séances, avec un « cabinet » et des rendez-vous. */
    if (/cir|bougie|bijou|bracelet|collier|joaill|c[ée]ram|potier|atelier|cr[ée]at|meuble|d[ée]co/.test(m)) return "createur";
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
 * ═══ LES TENUES DESSINÉES — le fantôme habillé pour son métier ═════════════
 *
 * « Je vais devoir te donner le fantôme avec toutes les expressions et le
 * décor pour chaque métier ? » Pas obligatoire : sans tenue, le double prend
 * le fantôme ClikMe devant la photo de la boutique. Avec une tenue, il prend
 * ses sept poses et son décor, rangés dans `public/direct/double/<métier>/`
 * par `scripts/fabriquer-double.mjs`, aux mêmes noms que ceux du chef.
 *
 * LE DÉCOR POSE SON COMPTOIR À LA MÊME HAUTEUR QUE CELUI DU CHEF (941 × 1672,
 * comptoir vers 41 %) : le fantôme se tient au même endroit dans les deux.
 */
/**
 * UNE TENUE : ses poses, son décor, et deux mesures prises sur les images.
 *
 * « Certains fantômes sont décollés de la table, il y a comme un trou entre
 * leur corps et la table. »
 *
 * TOUS ÉTAIENT POSÉS À LA MÊME HAUTEUR, calée sur le chef, alors que les
 * comptoirs ne sont pas au même endroit d'une photo à l'autre — le fleuriste
 * et l'onglerie ont le leur quatre points plus bas — et que les poses n'ont
 * pas le même vide sous le corps : un dixième de l'image chez le chef, trois
 * centièmes chez le tatoueur. Chaque tenue dit donc :
 *   · `comptoir` — le bord arrière du bois, en fraction de la hauteur du
 *     décor (941 × 1672), relevé à la règle sur l'image ;
 *   · `pied` — le vide transparent sous le corps, en fraction de la pose.
 * L'écran du double en tire la place exacte du fantôme — voir `.dc-fant`
 * dans `double-chef.tsx`.
 */
export type Tenue = { dossier: string; decor: string; comptoir: number; pied: number };

export const TENUES: Partial<Record<FamilleDouble, Tenue>> = {
  table: { dossier: "/direct/double/", decor: "/direct/double/comptoir.jpg", comptoir: 0.40, pied: 0.096 },
  /* LE MAGASIN DE VÊTEMENTS : casquette au cintre, gilet violet, foulard, et
     la boutique derrière son comptoir. */
  mode: { dossier: "/direct/double/mode/", decor: "/direct/double/mode/decor.jpg", comptoir: 0.40, pied: 0.063 },
  /* LE SALON DE COIFFURE : casquette et salopette aux ciseaux, peigne dans la
     poche, et le salon — fauteuils, miroirs dorés — derrière le comptoir. Il
     ne va PAS à l'onglerie, qui a sa propre famille : des ciseaux sur une
     prothésiste ongulaire, c'est encore un métier mal compris. */
  coiffure: { dossier: "/direct/double/coiffure/", decor: "/direct/double/coiffure/decor.jpg", comptoir: 0.36, pied: 0.049 },
  /* L'ONGLERIE : casquette et salopette roses au flacon de vernis, limes en
     poche, et les tables de pose — étagères de vernis — derrière le comptoir. */
  ongles: { dossier: "/direct/double/ongles/", decor: "/direct/double/ongles/decor.jpg", comptoir: 0.405, pied: 0.047 },
  /* LE BAR ET SES SOIRÉES : casquette à la note de musique, gilet et nœud
     papillon bleus, et la salle — banquettes, petite scène, lumières bleues
     et violettes — derrière le comptoir. Les soirées publiées par un bar sont
     des annonces du bar : elles ont ce double. Un événement de la ville, lui,
     n'a personne derrière un comptoir — voir `aUnDouble`. */
  bar: { dossier: "/direct/double/bar/", decor: "/direct/double/bar/decor.jpg", comptoir: 0.32, pied: 0.061 },
  /* LE FLEURISTE : casquette verte à la fleur, salopette de jardinier, un brin
     de verdure dans la poche, et la boutique — seaux de roses, étagères de
     plantes — derrière un comptoir de bois. */
  fleurs: { dossier: "/direct/double/fleurs/", decor: "/direct/double/fleurs/decor.jpg", comptoir: 0.41, pied: 0.039 },
  /* LES CRÉATEURS ET INDÉPENDANTS : casquette brune à l'étoile, salopette
     orange, crayons dans la poche, et l'atelier — céramiques, tissus pliés,
     grande table de travail — derrière un comptoir de bois. Il habille ceux
     qui fabriquent (bougies, bijoux, céramique…) ; le tatoueur et les autres
     séances gardent leur famille — voir `familleDuDouble`. */
  createur: { dossier: "/direct/double/createur/", decor: "/direct/double/createur/decor.jpg", comptoir: 0.36, pied: 0.035 },
  /* L'OPTICIEN : lunettes rondes sur le nez, casquette aux lunettes, gilet
     bleu canard sur chemise blanche, et la boutique — montures alignées sur
     des étagères éclairées, miroirs ovales — derrière un comptoir de bois. */
  lunettes: { dossier: "/direct/double/lunettes/", decor: "/direct/double/lunettes/decor.jpg", comptoir: 0.37, pied: 0.059 },
  /* LE BIEN-ÊTRE (hypnothérapeute, sophrologue…) : casquette aux ondes,
     gilet de laine vert sauge, foulard lavande, et le cabinet — deux
     fauteuils clairs, table basse, lumière de fin d'après-midi — derrière une
     table de bois. La photo posait sa table à la moitié de l'image : elle a
     été remontée de 195 points pour tomber à 41 %, comme les autres
     comptoirs, le bas prolongé de son propre dégradé. Le tatoueur, de la
     même famille, a sa tenue à lui — voir `tenueDu`. */
  seance: { dossier: "/direct/double/bien-etre/", decor: "/direct/double/bien-etre/decor.jpg", comptoir: 0.415, pied: 0.035 },
};

/* LE TATOUEUR : casquette et salopette noires surpiquées de rouge, la
   machine brodée, une branche tatouée sur le bras, crayon en poche, et le
   studio — fauteuil de cuir, flashs encadrés sur la brique — derrière le
   comptoir. Il est rangé HORS DE `TENUES` : il partage la famille « séance »
   avec l'hypnothérapeute et la sophrologue, qui reçoivent dans un cabinet
   calme, pas sous des flashs — elles ont la tenue du bien-être. */
const TATOUAGE: Tenue = { dossier: "/direct/double/tatouage/", decor: "/direct/double/tatouage/decor.jpg", comptoir: 0.395, pied: 0.029 };

/** La tenue d'un commerce, s'il en a une. */
export function tenueDu(c: { branche?: string | null; metier?: string | null }) {
  const famille = familleDuDouble(c);
  if (famille === "seance" && /tatou|tattoo|pierc/.test((c.metier ?? "").toLowerCase())) return TATOUAGE;
  return TENUES[famille];
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
