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

/**
 * DEUX FAÇONS DE PRENDRE CHEZ UN COMMERÇANT DU RÉSEAU : avec ses crédits (0 €),
 * ou à moitié prix, quand son offre le propose — pour écouler son stock.
 *
 * « À MOITIÉ PRIX, C'EST TOUT » (`20261024120000_echanges_moitie_simple.sql`) :
 * l'acheteur règle la moitié en euros, sur place, et il n'y a de crédits ni
 * d'un côté ni de l'autre. Seule la limite de l'offre (« combien par mois »)
 * dit combien le vendeur en vend.
 */
export type ModePaiement = "credits" | "moitie";
/** Ce que l'acheteur règle en euros, sur place, à moitié prix. */
export const moitieDe = (prix: number) => Math.round(prix * 50) / 100;
/** « 22,50 € », mais « 25 € » tout rond. */
export const enEuros = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2).replace(".", ",")}\u00a0€`;
/**
 * PRIX UNIQUE DU LIVRE : 5 % de remise au plus sur un livre neuf. Une libraire
 * ne fait donc pas « moitié prix » (à revoir avec un juriste : des livres
 * d'occasion, de la papeterie… le permettraient).
 */
export const sansMoitie = (o: { metier?: string; branche?: string }) => /librair/i.test(`${o.metier ?? ""} ${o.branche ?? ""}`);

/**
 * « 3 OFFRES MAX ET LIMITE PAR OFFRE » (`20261023120000_echanges_offres.sql`) :
 * jusqu'à trois produits ou services, chacun avec sa limite du mois, et pour
 * chacun, comment on peut le lui payer — « il y a des choses que je peux
 * échanger et d'autres que je peux seulement vendre, ou les deux ».
 */
export const MAX_OFFRES = 3;
export type Paiement = "les_deux" | "credits" | "moitie";
export const paiementLu = (v: unknown): Paiement => (v === "credits" || v === "moitie" ? v : "les_deux");
/** Cette offre se paie-t-elle de cette façon ? */
export const accepte = (p: Paiement | undefined, mode: ModePaiement) => !p || p === "les_deux" || p === mode;
/** Comment l'écran le dit. */
export const MOTS_PAIEMENT: Record<Paiement, { court: string; long: string }> = {
  les_deux: { court: "Les deux", long: "avec des crédits ou à moitié prix" },
  credits: { court: "Échange", long: "en échange seulement (crédits)" },
  moitie: { court: "−50 %", long: "à moitié prix seulement" },
};

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

/** Une offre d'un autre commerçant, telle que l'écran la montre. */
export type OffreReelle = {
  /** Unique : le commerce pour sa première offre, l'offre elle-même pour les autres. */
  id: string;
  /** Le commerce qui la propose. */
  fournisseur: string;
  /** Sa 2e ou 3e offre (vide : sa première). */
  offre: string | null;
  /** Comment on peut la lui payer (une librairie : en échange seulement). */
  paiement: Paiement;
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
  /** Pas de moitié prix chez lui (une librairie : prix unique du livre). */
  sansMoitie?: boolean;
};

/** Un bon, vu par celui qui l'a pris ou par celui qui le fournit. */
export type BonReel = {
  id: string;
  code: string;
  titre: string;
  prix: number;
  photo: string;
  statut: "reserve" | "utilise" | "annule" | "expire";
  /** Avec ses crédits, ou à moitié prix. */
  mode: ModePaiement;
  /** À moitié prix : ce que l'acheteur règle en euros, sur place (0 avec ses crédits). */
  aRegler: number;
  /** Ce que le vendeur gagne en crédits quand il le valide (rien à moitié prix : il encaisse des euros). */
  credits: number;
  /** L'autre commerce : celui qui fournit (pour un bon pris) ou celui qui a pris (pour un bon reçu). */
  autre: string;
  autreVille: string;
  cree: string;
  utilise?: string;
  expire: string;
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

/** Sa 2e ou 3e offre. */
export type AutreOffre = { id: string; titre: string; prix: number; parMois: number; paiement: Paiement; photo: string };

export type MonOffre = {
  titre: string;
  prix: number;
  parMois: number;
  duJour: boolean;
  photo: string;
  /** En pause, toutes ses offres le sont. */
  actif: boolean;
  /** Responsable compris : 1 + les membres qui ont ouvert leur lien. */
  equipe: number;
  paiement: Paiement;
  /** Ses autres offres, deux au plus. */
  autres: AutreOffre[];
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
  /** Ce qu'il a pris chez les autres, pour lui. */
  pris: BonReel[];
  /** Ce que les autres lui ont pris : à valider quand ils viennent, ou déjà validés. */
  recus: BonReel[];
  /** Ses factures d'échange (le responsable) : son pays (« fr » seulement), et s'il a donné ses infos. Null sans la migration. */
  factures: { pays: string; infos: boolean } | null;
};
