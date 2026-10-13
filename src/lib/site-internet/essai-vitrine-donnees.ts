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
  /** `exemple` : rien n'est en route chez lui — la page montre l'exemple, sans rien attendre. */
  etat: "en-cours" | "prete" | "echec" | "exemple";
  avant?: string;
  apres?: string;
  piece?: string;
  nom?: string;
  /** La raison, en clair, pour le commerçant. */
  raison?: string;
  /** Le détail technique, replié sous la raison. */
  detail?: string;
  /** Ses autres pièces, repérées sur ses photos — voir `PiecesDemo`. */
  autres?: PieceDemo[];
  /** Son jean et un de ses hauts, portés ensemble — voir `LookVitrine`. */
  look?: LookVitrineCarte;
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

export function essaiVitrinePourLaCarte(
  e: EssaiVitrine | undefined,
  aFaire: boolean,
  autres?: PieceDemo[],
  look?: LookVitrineCarte,
): EssaiVitrineCarte | undefined {
  const plus = { ...(autres?.length ? { autres } : {}), ...(look ? { look } : {}) };
  if (e?.etat === "prete" && e.apres && e.avant) return { etat: "prete", avant: e.avant, apres: e.apres, piece: e.piece, nom: e.nom, ...plus };
  if (aFaire || e?.etat === "en-cours") return { etat: "en-cours", avant: AVANT_ELLE, piece: e?.piece, nom: e?.nom, ...plus };
  if (e && (e.etat === "echec" || e.etat === "aucune")) {
    return { etat: "echec", avant: e.avant ?? AVANT_ELLE, piece: e.piece, nom: e.nom, raison: raisonLisible(e), detail: e.erreur, ...plus };
  }
  return autres?.length ? { etat: "exemple", ...plus } : undefined;
}

/* ═══════════════════════════════════════════════════════════════════════
   👖 SON JEAN, ET UN DE SES HAUTS PAR-DESSUS — LE LOOK DE SA VITRINE.

   « Ce que j'aurais encore plus aimé, c'est que lorsque tu dis qu'elle peut
   utiliser son propre dressing pour voir si le pull de Lili Ross va avec son
   propre jean, on voie la personne réellement avec son propre jean et le pull
   de Lili Ross. Idem à l'étape 3, lorsqu'on parle de Ma Maison : qu'on voie
   la personne avec la proposition ClikMe, comme une belle surprise. »

   UNE IMAGE DE PLUS, FAITE UNE FOIS, GARDÉE À CÔTÉ DE L'ESSAI (`look_vitrine`),
   par le même moteur (voir `completerLookVitrine`). LA MÊME PERSONNE QUE
   L'AVANT DE L'ESSAI, DANS LA MÊME POSE : seuls ses vêtements changent — son
   jean, celui de la garde-robe de l'exemple, et UN HAUT DE LA BOUTIQUE.

   UN HAUT, ET PAS SA PIÈCE DE L'ÉTAPE 2 TELLE QUELLE : cette pièce est souvent
   une robe, et dire qu'une robe « va avec un jean » serait inventer un
   conseil (c'était déjà la règle de `scene-garde-robe.tsx`). On cherche donc
   un haut parmi SES pièces repérées ; s'il n'y en a aucun, c'est le pull de
   l'exemple — et l'écran dit alors « Exemple ».

   CE QUI EST VRAI, ET CE QUI NE L'EST PAS : la même règle que l'essai. Le
   haut est le sien (ou l'exemple, dit comme tel), la personne et le jean sont
   ceux de la démonstration, le rendu est une simulation.
   ═══════════════════════════════════════════════════════════════════════ */

/** Son jean, à plat : la même pièce que dans la garde-robe de l'exemple, en plus grand pour le moteur. */
export const JEAN_DU_DRESSING = "/direct/dressing/demo-jean.webp";

/** Le haut de l'exemple, quand aucune de ses photos n'en montre un. */
const HAUT_EXEMPLE = {
  femme: { photo: "/direct/mode-pull-ecru-rose.webp", nom: "Pull écru et rose" },
  homme: { photo: "/direct/homme-pull-col-roule.jpeg", nom: "Pull col roulé" },
};

/* LES MOTS ENTIERS, ACCENTS COMPRIS : « \b » ignore les lettres accentuées, et
   « marinière » n'aurait jamais été reconnue. */
const mots = (liste: string) => new RegExp(`(?<!\\p{L})(?:${liste})(?!\\p{L})`, "iu");
const UN_HAUT = mots(
  "pulls?|pull-?overs?|gilets?|cardigans?|chemises?|chemisiers?|blouses?|tops?|t-?shirts?|tee-?shirts?|sweats?|sweat-?shirts?|" +
    "hoodies?|vestes?|blazers?|polos?|débardeurs?|tuniques?|mailles?|hauts?|blousons?|caracos?|bodys?|marinières?|cols? roulés?|kimonos?",
);
/** Ce qui ne se porte pas « avec son jean », ou le cache : on ne le choisit pas. */
const PAS_AVEC_UN_JEAN = mots(
  "robes?|combinaisons?|ensembles?|jupes?|pantalons?|jeans?|denim|shorts?|salopettes?|tailleurs?|manteaux|manteau|costumes?|" +
    "chaussures?|sacs?|bottes?|baskets?|bijoux|colliers?|lunettes?",
);

export type HautDuLook = { photo: string; nom: string; exemple: boolean; genre: "femme" | "homme" };

/**
 * LE HAUT QU'ON PORTE AVEC SON JEAN : le premier de SES hauts (la pièce de
 * l'étape 2 d'abord, puis les autres), de la même coupe — femme ou homme —
 * que la personne de l'essai. Sinon le pull de l'exemple.
 */
export function hautPourLeJean(e: { piece?: string; nom?: string; genre?: "femme" | "homme" } | undefined, autres: PieceDemo[] | undefined): HautDuLook {
  const genre = e?.genre ?? "femme";
  const siennes = [...(e?.piece ? [{ photo: e.piece, nom: e.nom ?? "", genre: e.genre }] : []), ...(autres ?? [])];
  const haut = siennes.find((p) => p.photo && UN_HAUT.test(p.nom) && !PAS_AVEC_UN_JEAN.test(p.nom) && (p.genre ?? genre) === genre);
  return haut ? { photo: haut.photo, nom: haut.nom, exemple: false, genre } : { ...HAUT_EXEMPLE[genre], exemple: true, genre };
}

export type LookVitrine = {
  etat: "en-cours" | "prete" | "echec";
  essais: number;
  at: string;
  /** Le haut porté : la photo de sa pièce (https), ou celle de l'exemple (/direct/…). */
  piece?: string;
  nom?: string;
  /** Vrai quand c'est le pull de l'exemple : l'écran le dit. */
  exemple?: boolean;
  genre?: "femme" | "homme";
  avant?: string;
  apres?: string;
  modele?: string;
  erreur?: string;
};

export function lookVitrineDuDiagnostic(diag: unknown): LookVitrine | undefined {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const l = (d.look_vitrine && typeof d.look_vitrine === "object" ? d.look_vitrine : null) as Record<string, unknown> | null;
  if (!l) return undefined;
  const etat = ["en-cours", "prete", "echec"].includes(s(l.etat)) ? (s(l.etat) as LookVitrine["etat"]) : "echec";
  const https = (v: unknown) => (/^https:\/\//i.test(s(v)) ? s(v) : undefined);
  const duSite = (v: unknown) => (s(v).startsWith("/direct/") ? s(v) : undefined);
  return {
    etat,
    essais: Number.isFinite(Number(l.essais)) ? Number(l.essais) : 0,
    at: s(l.at),
    piece: https(l.piece) ?? duSite(l.piece),
    nom: s(l.nom).slice(0, 60) || undefined,
    exemple: l.exemple === true,
    genre: l.genre === "homme" ? "homme" : l.genre === "femme" ? "femme" : undefined,
    avant: duSite(l.avant),
    apres: https(l.apres),
    modele: s(l.modele) || undefined,
    erreur: s(l.erreur) || undefined,
  };
}

/** Faut-il (re)faire le look ? Les mêmes délais que l'essai — voir `essaiVitrineAFaire`. */
export function lookVitrineAFaire(l: LookVitrine | undefined, maintenant = Date.now()): boolean {
  if (!l) return true;
  const depuis = l.at ? maintenant - Date.parse(l.at) : Infinity;
  if (l.etat === "prete") return false;
  if (l.etat === "en-cours") return !(depuis < PERDU);
  return l.essais < 3 ? !(depuis < DIX_MINUTES) : !(depuis < UN_JOUR);
}

/**
 * LE HAUT SE CHOISIT PARMI SES PIÈCES : on attend que l'essai ET la recherche
 * de ses pièces aient fini — réussi, rien trouvé, ou échoué trois fois. Avant,
 * on choisirait le pull de l'exemple alors que les siens arrivent.
 */
export function lookPeutPartir(e: EssaiVitrine | undefined, p: PiecesDemo | undefined): boolean {
  const fini = (x: { etat: string; essais: number } | undefined) =>
    Boolean(x && (x.etat === "prete" || x.etat === "aucune" || (x.etat === "echec" && x.essais >= 3)));
  return fini(e) && fini(p);
}

/**
 * CE QUE LA PAGE REÇOIT : LE HAUT, TOUJOURS — c'est lui que Léa nomme et que
 * l'étape 2 montre, rendu ou pas —, et la photo rendue quand elle existe.
 * Prête, la carte reprend le haut QUI A ÉTÉ RENDU : la photo et le nom ne
 * peuvent pas se contredire.
 */
export type LookVitrineCarte = HautDuLook & { avant: string; apres?: string };

export function lookPourLaCarte(l: LookVitrine | undefined, e: EssaiVitrine | undefined, autres: PieceDemo[] | undefined): LookVitrineCarte {
  if (l?.etat === "prete" && l.apres && l.avant && l.piece) {
    return { photo: l.piece, nom: l.nom ?? "", exemple: Boolean(l.exemple), genre: l.genre ?? "femme", avant: l.avant, apres: l.apres };
  }
  const h = hautPourLeJean(e, autres);
  return { ...h, avant: h.genre === "homme" ? AVANT_LUI : AVANT_ELLE };
}

/**
 * ═══ SES PIÈCES À ELLE, POUR QU'ELLE ESSAIE ELLE-MÊME ═══════════════════
 *
 * « Une fois la démo terminée, j'aurais aimé que la propriétaire puisse
 * essayer l'expérience : dans l'onglet Expérience, elle voit ce qu'on lui a
 * montré mais ne peut pas essayer elle-même. Mets le système tel qu'il est
 * déjà pensé, avec peut-être quelques vêtements de son shop déjà présents ;
 * et quand elle décidera de garder sa page, on réinitialise tout pour qu'elle
 * mette depuis son admin ses vêtements, sa collection. »
 *
 * L'ATELIER N'A RIEN À LUI PROPOSER : sur une vraie page, il n'essaie que SES
 * pièces photographiées (`seulementLesSiennes`), et une boutique toute neuve
 * n'en a aucune. Le modèle qui voit, qui a déjà trouvé LA pièce de l'étape 2,
 * en repère jusqu'à six autres sur ses photos Google, recadrées sur elles
 * (`completerPiecesDemo`). La page les lui donne à essayer, à elle seule et
 * tant qu'elle n'a pas gardé sa page — voir `piecesDeLaVitrine`. Gardée, sa
 * page ne lit plus que son comptoir.
 *
 * GARDÉES À CÔTÉ DE L'ESSAI (`pieces_demo`), PAS DEDANS : l'essai réécrit
 * tout son objet en finissant, il les effacerait.
 */
export type PieceDemo = { photo: string; nom: string; genre?: "femme" | "homme"; source?: string };
export type PiecesDemo = {
  etat: "en-cours" | "prete" | "echec" | "aucune";
  essais: number;
  at: string;
  pieces: PieceDemo[];
  erreur?: string;
};

export function piecesDemoDuDiagnostic(diag: unknown): PiecesDemo | undefined {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const p = (d.pieces_demo && typeof d.pieces_demo === "object" ? d.pieces_demo : null) as Record<string, unknown> | null;
  if (!p) return undefined;
  const etat = ["en-cours", "prete", "echec", "aucune"].includes(s(p.etat)) ? (s(p.etat) as PiecesDemo["etat"]) : "echec";
  const pieces = (Array.isArray(p.pieces) ? p.pieces : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .filter((x) => /^https:\/\//i.test(s(x.photo)))
    .slice(0, 6)
    .map((x) => ({
      photo: s(x.photo),
      nom: s(x.nom).slice(0, 60) || "Une de vos pièces",
      ...(x.genre === "homme" || x.genre === "femme" ? { genre: x.genre as "femme" | "homme" } : {}),
      ...(/^https:\/\//i.test(s(x.source)) ? { source: s(x.source) } : {}),
    }));
  return { etat, essais: Number.isFinite(Number(p.essais)) ? Number(p.essais) : 0, at: s(p.at), pieces, erreur: s(p.erreur) || undefined };
}

/** Faut-il (re)chercher ses pièces ? Les mêmes délais que l'essai — voir `essaiVitrineAFaire`. */
export function piecesDemoAFaire(p: PiecesDemo | undefined, maintenant = Date.now()): boolean {
  if (!p) return true;
  const depuis = p.at ? maintenant - Date.parse(p.at) : Infinity;
  if (p.etat === "prete") return false;
  if (p.etat === "en-cours") return !(depuis < PERDU);
  if (p.etat === "aucune") return p.essais < 3 ? !(depuis < DEMI_HEURE) : !(depuis < UN_JOUR);
  return p.essais < 3 ? !(depuis < DIX_MINUTES) : !(depuis < UN_JOUR);
}

/**
 * LES PIÈCES QU'ELLE PEUT ESSAYER SUR SA PAGE, en articles de catalogue : celle
 * de l'étape 2 d'abord (c'est celle qu'elle vient de voir portée), puis les
 * autres. Sans prix — on ne les connaît pas, et on n'en invente pas.
 */
export function piecesDeLaVitrine(e: EssaiVitrineCarte | undefined): { id: string; nom: string; photo: string; rayon: string }[] {
  const toutes = [...(e?.piece ? [{ photo: e.piece, nom: e.nom || "Votre pièce" }] : []), ...(e?.autres ?? [])];
  const vues = new Set<string>();
  return toutes
    .filter((p) => {
      if (!p.photo || vues.has(p.photo)) return false;
      vues.add(p.photo);
      return true;
    })
    .slice(0, 7)
    .map((p, i) => ({ id: `vitrine-${i}`, nom: p.nom, photo: p.photo, rayon: "Vos pièces" }));
}

/**
 * « CE PULL », « CETTE CHEMISE » — le haut du look, dans les phrases qui le
 * désignent (Ma Maison : « si vous publiez aujourd'hui ce pull… votre Fantôme
 * peut le lui rapporter »). Le premier mot de son nom donne le genre ; un nom
 * qu'on ne reconnaît pas devient « cette pièce », toujours juste.
 */
export function motsDeLaPiece(nom: string | undefined): { ce: string; il: string; le: string } {
  const mot = (nom ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const masc = mot.match(/^(pull|pullover|pull-over|gilet|cardigan|chemisier|top|t-shirt|tee-shirt|sweat|sweat-shirt|hoodie|blazer|polo|débardeur|haut|blouson|caraco|body|kimono)s?$/);
  if (masc) return { ce: `ce ${masc[1]}`, il: "il", le: "le" };
  const fem = mot.match(/^(chemise|blouse|veste|tunique|maille|marinière)s?$/);
  if (fem) return { ce: `cette ${fem[1]}`, il: "elle", le: "la" };
  return { ce: "cette pièce", il: "elle", le: "la" };
}
