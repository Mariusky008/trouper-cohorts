// L'ÉCHANGE ENTRE COMMERÇANTS — ce que le serveur et l'écran partagent.
// Voir `supabase/migrations/20261017120000_echanges_commercants.sql` et
// `20261019120000_echanges_reseau.sql` pour les règles, et
// `src/app/api/site-internet/pro/echanges/route.ts` pour la route.

/** Ce téléphone est celui de ce commerçant : la page d'un bon scanné (`/bon/<code>`) peut le valider. */
export const CLE_ACCES_COMPTOIR = "clikme-comptoir-acces";

/**
 * « 50 € PAR MOIS ET PAR PERSONNE » — ce qu'il peut prendre d'avance, par
 * personne de son équipe (lui et ses associés). Ça ne s'accumule pas : jamais
 * plus de 50 € par personne d'avance. Ce qu'on prend se rend en produits,
 * JAMAIS EN EUROS ; arrivé au bout, on sert avant de reprendre.
 */
export const PAR_PERSONNE = 50;
/**
 * SON ÉQUIPE : chacun son accès (un lien personnel envoyé par le WhatsApp du
 * responsable) et ses 50 € par mois. Quatre personnes au plus, cinq avec lui.
 * La dette reste celle du commerce. Voir `20261020120000_echanges_equipe.sql`.
 */
export const MAX_MEMBRES = 4;
/** Ce que l'équipe peut être, responsable compris. */
export const EQUIPE = [1, 2, 3, 4, 5];
/** Combien il peut en offrir par mois : c'est sa capacité à fournir. */
export const PAR_MOIS = [1, 2, 4, 8];
/** Un bon réservé et pas utilisé expire au bout de ce délai : le montant revient à celui qui l'a pris. */
export const JOURS_VALIDITE = 30;
/** L'échange s'ouvre dans une ville à partir de ce nombre de commerçants (`ECHANGES_SEUIL_VILLE` pour un essai). */
export const SEUIL_VILLE = 12;

/** LE CADEAU DU VOISIN — combien de fois par mois il accepte d'être offert. */
export const CADEAU_PAR_MOIS = [5, 10, 20, 40];
/** Combien de cadeaux on offre d'un coup à ses clients. */
export const QUANTITES_CADEAU = [5, 10, 20];

/** Son découvert : 50 € par personne de son équipe. */
export const decouvertDe = (equipe: number) => PAR_PERSONNE * Math.max(1, Math.min(EQUIPE[EQUIPE.length - 1], Math.round(equipe) || 1));

/** « CLK-7KQ2MX » : sans 0/O, 1/I/L, pour se dicter sans erreur. */
export const ALPHABET_CODE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Ce qu'on tape, dit ou scanne → la forme rangée en base, ou "" si ça ne peut pas être un code. */
export function codeNormalise(brut: string): string {
  const s = String(brut ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const corps = s.startsWith("CLK") ? s.slice(3) : s;
  if (corps.length !== 6) return "";
  for (const ch of corps) if (!ALPHABET_CODE.includes(ch)) return "";
  return `CLK-${corps}`;
}

/** « offert », « offerte », « offerts » : l'accord suit l'article du cadeau (« Une pose de vernis offerte »). */
export function offertAccorde(titre: string): string {
  const t = titre.trim().toLowerCase();
  if (/^(des|deux|trois|quatre|cinq|\d+)\s/.test(t)) return "offerts";
  return /^(une|la|ma|ta|sa)\s/.test(t) ? "offerte" : "offert";
}

/** « chez Bergine », mais « Chez Bergine » tout court quand le nom le dit déjà. */
export const chezNom = (nom: string) => (/^chez\s/i.test(nom.trim()) ? nom.trim() : `chez ${nom.trim()}`);
/** « l’équipe du Fournil », « des Délices », « de la Page », « d’Atelier Lou » — jamais « de Le Fournil ». */
export function deNom(nom: string): string {
  const n = nom.trim();
  if (/^le\s/i.test(n)) return `du ${n.slice(3)}`;
  if (/^les\s/i.test(n)) return `des ${n.slice(4)}`;
  if (/^la\s/i.test(n)) return `de la ${n.slice(3)}`;
  if (/^l['’]/i.test(n)) return `de l’${n.slice(2)}`;
  if (/^[aeiouâàéèêîôû]/i.test(n)) return `d’${n}`;
  return `de ${n}`;
}

/** « 🎁 Pour toute coloration : un dessert du jour offert chez Bergine ! » — 140 signes au plus (Le Direct). */
export function phraseDuCadeau(c: { titre: string; chez: string; occasion?: string }): string {
  const quoi = `${c.titre.charAt(0).toLowerCase()}${c.titre.slice(1)}`;
  const occ = (c.occasion ?? "").trim().replace(/[\s:.,!]+$/, "");
  const debut = occ ? `${occ.charAt(0).toUpperCase()}${occ.slice(1)} : ` : "";
  return `🎁 ${debut}${quoi} ${offertAccorde(c.titre)} ${chezNom(c.chez)} !`.replace(/\s+/g, " ").slice(0, 140);
}

/** Une offre d'un autre commerçant, telle que l'écran la montre. */
export type OffreReelle = {
  id: string;
  commerce: string;
  metier: string;
  branche: string;
  ville: string;
  villeSlug: string;
  /** Sa ville a atteint le seuil : on peut lui prendre. */
  villeOuverte: boolean;
  titre: string;
  prix: number;
  photo: string;
  parMois: number;
  /** Combien on peut encore lui en prendre ce mois-ci. */
  restant: number;
  /** Il doit au réseau : son offre passe en tête. */
  doit: boolean;
  /** « 4 min à pied », quand on sait où sont les deux commerces. */
  aPied?: string;
};

/** Le petit cadeau qu'un autre commerçant accepte d'être offert aux clients des autres. */
export type CadeauDuReseau = {
  /** Le commerce qui le sert. */
  id: string;
  commerce: string;
  metier: string;
  branche: string;
  ville: string;
  villeSlug: string;
  titre: string;
  prix: number;
  photo: string;
  /** Combien on peut encore lui en offrir ce mois-ci. */
  restant: number;
  aPied?: string;
};

/** Un lot de cadeaux qu'il a offert à ses clients. */
export type MonLotDeCadeaux = {
  id: string;
  /** Chez qui. */
  chez: string;
  chezId: string;
  titre: string;
  prix: number;
  photo: string;
  occasion: string;
  quantite: number;
  /** Remis à un client. */
  donnes: number;
  /** Utilisés chez le voisin. */
  utilises: number;
  /** Personnes venues avec ces bons (« venu à 3 »). */
  personnes: number;
  /** Ni remis, ni utilisés, encore valables. */
  aDonner: number;
  expires: number;
  cree: string;
  expire: string;
};

/** Un bon, vu par celui qui l'a pris ou par celui qui le fournit. */
export type BonReel = {
  id: string;
  code: string;
  titre: string;
  prix: number;
  photo: string;
  statut: "reserve" | "utilise" | "annule" | "expire";
  /** `client` : un cadeau du voisin, offert par `autre` à l'un de ses clients. */
  pour: "moi" | "client";
  /** L'autre commerce : celui qui fournit (pour un bon pris) ou celui qui a pris (pour un bon reçu). */
  autre: string;
  autreVille: string;
  cree: string;
  utilise?: string;
  expire: string;
  /** Combien de personnes sont venues avec ce bon cadeau. */
  venus?: number;
  /** Le prénom du membre de l'équipe qui l'a pris (vide : le responsable). */
  qui?: string;
  /** Le prénom du membre de l'équipe qui l'a validé au comptoir (vide : le responsable). */
  validePar?: string;
};

/** Une personne de son équipe, vue par le responsable. */
export type MembreEquipe = {
  id: string;
  prenom: string;
  /** A ouvert son lien : il compte dans l'équipe. */
  actif: boolean;
  /** Ce qu'il a pris ce mois-ci, sur ses 50 €. */
  prisCeMois: number;
  /** Son lien (`/e/<jeton>`), pour le lui renvoyer. */
  lien: string;
};

export type MonOffre = {
  titre: string;
  prix: number;
  parMois: number;
  duJour: boolean;
  photo: string;
  actif: boolean;
  /** Responsable compris : 1 + les membres qui ont ouvert leur lien. */
  equipe: number;
  /** Ce qu'il accepte d'être offert aux clients des autres, ou `null`. */
  cadeau: { titre: string; prix: number; parMois: number } | null;
};

/** Une ville du réseau : combien de commerçants y échangent, et si elle est ouverte. */
export type VilleDuReseau = { slug: string; nom: string; offres: number; ouverte: boolean };

export type EtatEchanges = {
  /** Faux tant que les migrations ne sont pas appliquées. */
  pret: boolean;
  /** Qui regarde : le responsable (lien pro), ou un membre de son équipe (son lien personnel). */
  moi: {
    role: "responsable" | "membre";
    prenom: string;
    /** Ce qu'il peut encore prendre : un membre, dans ses 50 € du mois ; le responsable, le compte du commerce. */
    reste: number;
  };
  /** Son équipe (le responsable seulement ; vide pour un membre). */
  equipe: MembreEquipe[];
  mien: MonOffre | null;
  compte: {
    /** Ce qu'il peut prendre d'avance : 50 € × son équipe. */
    decouvert: number;
    equipe: number;
    gagne: number;
    pris: number;
    aDepenser: number;
    du: number;
  };
  /** Sa ville, avec son seuil d'ouverture et ceux qui y sont déjà (visages). */
  maVille: VilleDuReseau & { seuil: number; deja: Array<{ commerce: string; metier: string; branche: string; photo: string }> };
  /** Les villes ouvertes, la sienne comprise si elle l'est. */
  villes: VilleDuReseau[];
  offres: OffreReelle[];
  /** Les cadeaux des autres, à offrir à ses clients — du plus proche au plus loin. */
  cadeaux: CadeauDuReseau[];
  mesCadeaux: MonLotDeCadeaux[];
  /** Ce qu'il a pris chez les autres, pour lui. */
  pris: BonReel[];
  /** Ce que les autres lui ont pris (pour eux, ou pour un client) : à valider quand ils viennent, ou déjà validés. */
  recus: BonReel[];
  /** Les bons cadeaux d'autres commerçants, chez des clients, à servir chez lui. */
  cadeauxAServir: Array<{ de: string; titre: string; n: number }>;
  /** Ce que le réseau lui a amené : clients venus avec un cadeau d'un voisin, et ceux qu'il a envoyés. */
  reseau: { clientsRecus: number; personnesRecues: number; clientsEnvoyes: number; personnesEnvoyees: number };
};

/** Ce que la page d'un bon montre à un client qui a reçu un cadeau du voisin. */
export type BonCadeauPublic = {
  code: string;
  titre: string;
  chez: string;
  chezSlug: string;
  adresse: string;
  ville: string;
  photo: string;
  de: string;
  occasion: string;
  statut: BonReel["statut"];
  expire: string;
};
