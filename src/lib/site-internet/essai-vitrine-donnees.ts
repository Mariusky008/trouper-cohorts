// 👗 L'ESSAYAGE DE SA VITRINE — ce qu'on garde, et quand on le refait.
//
// « À l'étape 2 de la présentation d'une boutique de vêtements, c'est dommage
// de ne pas montrer la véritable plus-value visuellement : Léa parle et
// explique, mais visuellement on n'a aucun effet wow. Il aurait fallu une
// petite animation où l'on voit une personne avec ses vêtements normaux, et
// exactement la même pose avec les vêtements de Lili Ross by me, qu'on aura
// pris sur sa fiche Google. La propriétaire du magasin reconnaîtra ses
// vêtements sur une personne qu'elle n'a jamais vue. »
//
// UNE IMAGE, FAITE UNE FOIS, GARDÉE DANS SON DIAGNOSTIC (`essai_vitrine`) —
// aucune migration. Le moteur la fabrique après la page (voir
// `essai-vitrine.ts`) ; la page la montre au commerçant, et à lui seul, tant
// qu'il n'a mis aucune pièce à essayer lui-même.
//
// FICHIER PARTAGÉ : la page, la route et le moteur le lisent.

/** La personne de l'« avant » : une femme, ou un homme pour une pièce d'homme. Ce sont les photos de l'essayage de démonstration. */
export const AVANT_ELLE = "/direct/accueil/moi-mode-sans.jpg";
export const AVANT_LUI = "/direct/essai/mode-homme-avant.jpg";

/**
 * LA VERSION DU MOTEUR QUI A FAIT L'ESSAI. Un échec d'une version précédente
 * ne compte pas : la première version ne trouvait pas la photo de l'avant en
 * production, et ses échecs auraient fait attendre un jour entier une page
 * que la version suivante sait réussir.
 */
export const VERSION_ESSAI = 3;

export type EssaiVitrine = {
  /** Voir `VERSION_ESSAI`. */
  v?: number;
  /** `aucune` : aucune de ses photos ne montre une pièce qu'on puisse essayer. */
  etat: "en-cours" | "prete" | "echec" | "aucune";
  essais: number;
  at: string;
  /** La photo de sa fiche dont la pièce est prise. */
  source?: string;
  /** La pièce, recadrée sur elle — c'est la vignette montrée à côté. */
  piece?: string;
  /** « Ensemble en dentelle corail » — décrit par le modèle qui voit, jamais présenté comme ses mots. */
  nom?: string;
  genre?: "femme" | "homme";
  /** L'avant (une photo du dépôt) et l'après rendu, aux mêmes dimensions. */
  avant?: string;
  apres?: string;
  modele?: string;
  erreur?: string;
};

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function essaiVitrineDuDiagnostic(diag: unknown): EssaiVitrine | undefined {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const e = (d.essai_vitrine && typeof d.essai_vitrine === "object" ? d.essai_vitrine : null) as Record<string, unknown> | null;
  if (!e) return undefined;
  const etat = ["en-cours", "prete", "echec", "aucune"].includes(s(e.etat)) ? (s(e.etat) as EssaiVitrine["etat"]) : "echec";
  const https = (v: unknown) => (/^https:\/\//i.test(s(v)) ? s(v) : undefined);
  return {
    etat,
    essais: Number.isFinite(Number(e.essais)) ? Number(e.essais) : 0,
    at: s(e.at),
    source: https(e.source),
    piece: https(e.piece),
    nom: s(e.nom).slice(0, 60) || undefined,
    genre: e.genre === "homme" ? "homme" : e.genre === "femme" ? "femme" : undefined,
    avant: s(e.avant).startsWith("/direct/") ? s(e.avant) : undefined,
    apres: https(e.apres),
    modele: s(e.modele) || undefined,
    erreur: s(e.erreur) || undefined,
    v: Number.isFinite(Number(e.v)) ? Number(e.v) : undefined,
  };
}

const DIX_MINUTES = 10 * 60_000;
const DEMI_HEURE = 30 * 60_000;
const UN_JOUR = 24 * 3600_000;
const PERDU = 6 * 60_000;

/**
 * FAUT-IL (RE)LANCER LE MOTEUR ? Jamais encore fait : oui. Un rendu perdu
 * (en cours depuis plus de six minutes) : oui. Un échec : trois essais à dix
 * minutes d'écart, puis un par jour — la même règle que les scènes du
 * restaurant. « Aucune pièce sur ses photos » : trois fois à une demi-heure
 * d'écart (une inscription toute neuve n'a pas encore toutes ses photos),
 * puis une fois par jour.
 */
export function essaiVitrineAFaire(e: EssaiVitrine | undefined, maintenant = Date.now()): boolean {
  if (!e) return true;
  // UN ÉCHEC D'UNE VERSION PRÉCÉDENTE SE RETENTE TOUT DE SUITE — voir `VERSION_ESSAI`.
  if (e.etat !== "prete" && e.etat !== "en-cours" && (e.v ?? 1) < VERSION_ESSAI) return true;
  const depuis = e.at ? maintenant - Date.parse(e.at) : Infinity;
  if (e.etat === "prete") return false;
  if (e.etat === "en-cours") return !(depuis < PERDU);
  if (e.etat === "aucune") return e.essais < 3 ? !(depuis < DEMI_HEURE) : !(depuis < UN_JOUR);
  return e.essais < 3 ? !(depuis < DIX_MINUTES) : !(depuis < UN_JOUR);
}

/**
 * Ce que la page reçoit : l'essai prêt, « en cours » pour qu'elle attende, ou
 * « echec » AVEC SA RAISON. « Le après n'a jamais marché, et ensuite à l'étape
 * 2 je n'ai pas eu d'avant ou d'après » : le bloc s'effaçait sans un mot, et
 * personne ne pouvait savoir pourquoi. Il le dit maintenant, à lui seul.
 */
export type EssaiVitrineCarte = {
  etat: "en-cours" | "prete" | "echec";
  avant?: string;
  apres?: string;
  piece?: string;
  nom?: string;
  /** La raison, en clair, pour le commerçant. */
  raison?: string;
  /** Le détail technique, replié sous la raison. */
  detail?: string;
};

/** La raison d'un échec, dite au commerçant — le détail technique reste à part. */
export function raisonLisible(e: EssaiVitrine): string {
  if (e.etat === "aucune") {
    return /lisible/.test(e.erreur ?? "")
      ? "Vos photos Google arrivent : l’essayage se fera dès qu’elles seront là."
      : "Aucune de vos photos Google ne montre une pièce en entier. Ajoutez-en une depuis votre comptoir : elle s’essaiera ici.";
  }
  return "Le rendu n’a pas abouti cette fois. Un nouvel essai se fait tout seul à votre prochaine visite.";
}

export function essaiVitrinePourLaCarte(e: EssaiVitrine | undefined, aFaire: boolean): EssaiVitrineCarte | undefined {
  if (e?.etat === "prete" && e.apres && e.avant) return { etat: "prete", avant: e.avant, apres: e.apres, piece: e.piece, nom: e.nom };
  if (aFaire || e?.etat === "en-cours") return { etat: "en-cours", avant: AVANT_ELLE, piece: e?.piece, nom: e?.nom };
  if (e && (e.etat === "echec" || e.etat === "aucune")) {
    return { etat: "echec", avant: e.avant ?? AVANT_ELLE, piece: e.piece, nom: e.nom, raison: raisonLisible(e), detail: e.erreur };
  }
  return undefined;
}
