/**
 * ☀️ LA PROPOSITION DU MATIN — une annonce prête, il dit « oui », c'est parti.
 *
 * « La proposition du matin. » Le commerçant n'a pas à se demander quoi
 * publier : chaque matin, son fantôme a déjà choisi une pièce de SA vitrine,
 * avec sa photo, son nom, son prix. Un « oui », et elle part dans Le Direct,
 * sur sa page — et sur ses réseaux s'il les a connectés.
 *
 * CE QU'ON NE FAIT PAS : inventer. La pièce vient de sa vitrine, ses mots
 * aussi. Ce que le fantôme ajoute, c'est le POURQUOI AUJOURD'HUI — une date
 * du calendrier (la fête des mères dans dix jours, Halloween, Noël), jamais un
 * chiffre ni une promesse. Un restaurant n'a pas de vitrine de plats du jour :
 * on lui demande sa photo, on ne devine pas son menu.
 *
 * L'ÉTAT DU JOUR est rangé dans son diagnostic (`proposition_matin`) : la même
 * proposition sur son téléphone et son ordinateur, « Une autre » qui ne revient
 * pas, et ce qu'on lui a proposé les jours d'avant pour ne pas radoter.
 *
 * FICHIER PARTAGÉ : aucune dépendance au serveur.
 */
import { estBoulangerie, type FamilleDouble } from "@/lib/direct/double-metiers";
import type { PieceComptoir } from "@/lib/site-internet/pieces-comptoir";

/* ═══ LE CALENDRIER ═════════════════════════════════════════════════════ */

export type Occasion = { cle: string; nom: string; date: string; avant: number; apres?: number; familles: FamilleDouble[] | "toutes" };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const jour = (a: number, m: number, j: number) => new Date(Date.UTC(a, m - 1, j));
const plus = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/** Le n-ième `jourSemaine` (0 = dimanche) du mois. */
function nieme(a: number, m: number, jourSemaine: number, n: number): Date {
  const premier = jour(a, m, 1);
  return plus(premier, ((jourSemaine - premier.getUTCDay() + 7) % 7) + 7 * (n - 1));
}

/** Le dernier `jourSemaine` du mois. */
function dernier(a: number, m: number, jourSemaine: number): Date {
  const fin = jour(a, m + 1, 0);
  return plus(fin, -((fin.getUTCDay() - jourSemaine + 7) % 7));
}

/** Pâques (calcul grégorien anonyme) : la fête des mères française en dépend. */
function paques(a: number): Date {
  const g = a % 19;
  const b = Math.floor(a / 100);
  const c = a % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const h = (19 * g + b - d - Math.floor((b - f + 1) / 3) + 15) % 30;
  const l = (32 + 2 * e + 2 * Math.floor(c / 4) - h - (c % 4)) % 7;
  const m = Math.floor((g + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  return jour(a, mois, ((h + l - 7 * m + 114) % 31) + 1);
}

const CADEAU: FamilleDouble[] = ["fleurs", "mode", "createur", "ongles", "coiffure", "librairie", "lunettes", "table"];
const SORTIE: FamilleDouble[] = ["bar", "table"];

/** Les dates qui donnent une raison de publier, pour une année et un pays. */
export function occasionsDeLAnnee(a: number, pays = "fr"): Occasion[] {
  // LA FÊTE DES MÈRES : dernier dimanche de mai en France — sauf quand c'est
  // la Pentecôte, alors premier dimanche de juin ; deuxième dimanche de mai en
  // Suisse, en Belgique et presque partout ailleurs.
  let meres = pays === "fr" ? dernier(a, 5, 0) : nieme(a, 5, 0, 2);
  if (pays === "fr" && iso(meres) === iso(plus(paques(a), 49))) meres = nieme(a, 6, 0, 1);
  const peres = pays === "ch" ? nieme(a, 6, 0, 1) : pays === "be" ? nieme(a, 6, 0, 2) : nieme(a, 6, 0, 3);
  const thanksgiving = nieme(a, 11, 4, 4);
  const o: Occasion[] = [
    { cle: "saint-valentin", nom: "La Saint-Valentin", date: iso(jour(a, 2, 14)), avant: 12, familles: [...CADEAU, "bar"] },
    { cle: "fete-des-meres", nom: "La fête des mères", date: iso(meres), avant: 14, familles: CADEAU },
    { cle: "fete-des-peres", nom: "La fête des pères", date: iso(peres), avant: 12, familles: ["mode", "createur", "librairie", "lunettes", "table", "bar", "coiffure", "seance"] },
    { cle: "fete-musique", nom: "La fête de la musique", date: iso(jour(a, 6, 21)), avant: 5, familles: SORTIE },
    { cle: "rentree", nom: "La rentrée", date: iso(jour(a, 9, 1)), avant: 6, apres: 6, familles: ["librairie", "coiffure", "mode", "lunettes", "ongles"] },
    { cle: "halloween", nom: "Halloween", date: iso(jour(a, 10, 31)), avant: 10, familles: [...SORTIE, "ongles", "createur", "seance"] },
    { cle: "black-friday", nom: "Le Black Friday", date: iso(plus(thanksgiving, 1)), avant: 6, familles: ["mode", "createur", "lunettes", "ongles", "coiffure", "librairie"] },
    { cle: "noel", nom: "Noël", date: iso(jour(a, 12, 25)), avant: 24, familles: "toutes" },
    { cle: "nouvel-an", nom: "Le réveillon du Nouvel An", date: iso(jour(a, 12, 31)), avant: 5, familles: [...SORTIE, "ongles", "coiffure", "mode"] },
  ];
  // LE BEAUJOLAIS NOUVEAU : troisième jeudi de novembre, une affaire française.
  if (pays === "fr") o.push({ cle: "beaujolais", nom: "Le Beaujolais nouveau", date: iso(nieme(a, 11, 4, 3)), avant: 6, familles: SORTIE });
  return o;
}

const ecart = (de: string, a: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);

/** « dimanche 31 mai ». */
const enClair = (j: string) => new Date(`${j}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** L'occasion du moment pour ce métier — la plus proche — et sa phrase. */
export function occasionDuJour(aujourdhui: string, famille: FamilleDouble, pays = "fr"): { cle: string; phrase: string } | null {
  const a = Number(aujourdhui.slice(0, 4));
  const candidates = [...occasionsDeLAnnee(a, pays), ...occasionsDeLAnnee(a + 1, pays)]
    .filter((o) => o.familles === "toutes" || o.familles.includes(famille))
    .map((o) => ({ o, dans: ecart(aujourdhui, o.date) }))
    .filter(({ o, dans }) => dans <= o.avant && dans >= -(o.apres ?? 0))
    .sort((x, y) => Math.abs(x.dans) - Math.abs(y.dans));
  const c = candidates[0];
  if (!c) return null;
  const { o, dans } = c;
  const phrase =
    dans < 0 || (dans === 0 && o.apres)
      ? `C’est ${o.nom.charAt(0).toLowerCase()}${o.nom.slice(1)}`
      : dans === 0
        ? `${o.nom}, c’est aujourd’hui`
        : dans === 1
          ? `${o.nom}, c’est demain`
          : `${o.nom} dans ${dans} jours (${enClair(o.date)})`;
  return { cle: o.cle, phrase };
}

/* ═══ SON ÉTAT DU JOUR ═══════════════════════════════════════════════════ */

export type StatutProposition = "proposee" | "publiee" | "passee";

export type EtatProposition = {
  /** Le jour (Paris) de cette proposition. */
  jour: string;
  pieceId?: string;
  /** Les pièces écartées aujourd'hui par « Une autre ». */
  ecartees: string[];
  statut: StatutProposition;
  /** Ce qu'on lui a proposé les jours d'avant — trente au plus. */
  historique: { jour: string; pieceId: string }[];
  /** « Me l'envoyer chaque matin sur WhatsApp. » */
  whatsapp?: boolean;
  /** Le dernier jour où le message WhatsApp est parti. */
  notifieLe?: string;
};

const s = (v: unknown) => String(v ?? "").trim();
const estJour = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export function etatDuDiagnostic(diag: unknown): EtatProposition | null {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const o = (d.proposition_matin && typeof d.proposition_matin === "object" ? d.proposition_matin : null) as Record<string, unknown> | null;
  if (!o) return null;
  const statut = s(o.statut);
  return {
    jour: estJour(s(o.jour)) ? s(o.jour) : "",
    ...(s(o.pieceId) ? { pieceId: s(o.pieceId).slice(0, 60) } : {}),
    ecartees: (Array.isArray(o.ecartees) ? o.ecartees : []).map(s).filter(Boolean).slice(0, 40),
    statut: statut === "publiee" || statut === "passee" ? statut : "proposee",
    historique: (Array.isArray(o.historique) ? o.historique : [])
      .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
      .map((x) => ({ jour: s(x.jour), pieceId: s(x.pieceId) }))
      .filter((x) => estJour(x.jour) && x.pieceId)
      .slice(-30),
    ...(o.whatsapp === true ? { whatsapp: true } : {}),
    ...(estJour(s(o.notifieLe)) ? { notifieLe: s(o.notifieLe) } : {}),
  };
}

/** L'état d'aujourd'hui : celui rangé s'il est du jour, sinon un neuf (l'historique et WhatsApp suivent). */
export function etatDuJour(avant: EtatProposition | null, aujourdhui: string): EtatProposition {
  if (avant && avant.jour === aujourdhui) return avant;
  return {
    jour: aujourdhui,
    ecartees: [],
    statut: "proposee",
    historique: avant?.historique ?? [],
    ...(avant?.whatsapp ? { whatsapp: true } : {}),
    ...(avant?.notifieLe ? { notifieLe: avant.notifieLe } : {}),
  };
}

/* ═══ LA PROPOSITION ═════════════════════════════════════════════════════ */

export type Proposition = {
  /** `piece` : une pièce de sa vitrine, prête. `photo` : on lui demande la photo (restaurant, bar). `vitrine` : sa vitrine est vide. */
  genre: "piece" | "photo" | "vitrine";
  /** Ce que le fantôme lui dit. */
  phrase: string;
  /** La raison du jour, quand le calendrier en donne une. */
  occasion?: string;
  piece?: { id: string; nom: string; prix?: string; photo: string; voix?: string; voixSecondes?: number; voixTexte?: string };
};

/** Un petit brassage stable dans la journée : la même pièce sur tous ses écrans, une autre demain. */
function brassage(graine: string): number {
  let h = 2166136261;
  for (let i = 0; i < graine.length; i++) h = Math.imul(h ^ graine.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * LA PIÈCE DU JOUR : dans sa vitrine, celle qu'on ne lui a pas proposée — ni
 * qu'il n'a publiée — depuis le plus longtemps. Les écartées du jour sont
 * exclues ; quand il les a toutes écartées, plus rien (on ne lui reproposera
 * pas la première).
 */
export function choisirLaPiece(pieces: PieceComptoir[], etat: EtatProposition, maintenant = Date.now()): PieceComptoir | null {
  const vitrine = pieces.filter((p) => p.vitrine && !etat.ecartees.includes(p.id));
  if (!vitrine.length) return null;
  const derniereFois = (p: PieceComptoir) => {
    const proposee = etat.historique.filter((h) => h.pieceId === p.id && h.jour !== etat.jour).map((h) => Date.parse(`${h.jour}T12:00:00Z`));
    // PUBLIÉE COMME ANNONCE : le comptoir range une copie, même nom, même photo.
    const publiee = pieces
      .filter((x) => !x.vitrine && (x.photo === p.photo || x.nom === p.nom))
      .map((x) => Date.parse(x.publieLe))
      .filter((t) => Number.isFinite(t) && t <= maintenant);
    return Math.max(0, ...proposee, ...publiee);
  };
  return (
    [...vitrine].sort((a, b) => derniereFois(a) - derniereFois(b) || brassage(`${etat.jour}|${a.id}`) - brassage(`${etat.jour}|${b.id}`))[0] ?? null
  );
}

const FAIT_SA_PHOTO: FamilleDouble[] = ["table", "bar"];

/** Ce que le fantôme lui propose ce matin. `null` : rien aujourd'hui (passée, publiée, ou plus d'idée). */
export function propositionDuJour(p: {
  famille: FamilleDouble;
  /** Son métier : une boulangerie a sa fournée, pas un plat du jour. */
  metier?: string;
  pieces: PieceComptoir[];
  etat: EtatProposition;
  pays?: string;
  maintenant?: number;
}): Proposition | null {
  if (p.etat.statut !== "proposee") return null;
  const occ = occasionDuJour(p.etat.jour, p.famille, p.pays);
  const avant = occ ? `${occ.phrase} ! ` : "";
  if (FAIT_SA_PHOTO.includes(p.famille)) {
    return {
      genre: "photo",
      phrase: `${avant}${p.famille === "bar" ? "Qu’est-ce qui se passe ce soir ?" : estBoulangerie(p.metier) ? "Ta fournée du jour ?" : "Ton plat du jour ?"} Une photo, et je m’occupe du reste.`,
      ...(occ ? { occasion: occ.phrase } : {}),
    };
  }
  if (!p.pieces.some((x) => x.vitrine)) {
    return {
      genre: "vitrine",
      phrase: `${avant}Mets quelques photos dans ta vitrine : chaque matin, je t’en proposerai une, prête à publier.`,
      ...(occ ? { occasion: occ.phrase } : {}),
    };
  }
  const piece = choisirLaPiece(p.pieces, p.etat, p.maintenant);
  if (!piece) return null;
  return {
    genre: "piece",
    phrase: `${avant}J’ai préparé ton annonce du jour : « ${piece.nom} ». On la publie ?`,
    ...(occ ? { occasion: occ.phrase } : {}),
    piece: {
      id: piece.id,
      nom: piece.nom,
      ...(piece.prix ? { prix: piece.prix } : {}),
      photo: piece.photo,
      ...(piece.voix ? { voix: piece.voix, voixSecondes: piece.voixSecondes, voixTexte: piece.voixTexte } : {}),
    },
  };
}

/** L'état après un geste : « Une autre », « Pas aujourd'hui », « Publiée ». */
export function apresLeGeste(etat: EtatProposition, geste: "autre" | "passer" | "publiee", pieceId?: string): EtatProposition {
  const id = pieceId || etat.pieceId;
  if (geste === "autre") return { ...etat, ecartees: id ? [...new Set([...etat.ecartees, id])] : etat.ecartees };
  if (geste === "passer") return { ...etat, statut: "passee" };
  return { ...etat, statut: "publiee" };
}

/** Range la pièce proposée aujourd'hui dans l'état — et dans son historique. */
export function avecLaPiece(etat: EtatProposition, pieceId: string | undefined): EtatProposition {
  if (!pieceId || etat.pieceId === pieceId) return etat;
  const historique = [...etat.historique.filter((h) => !(h.jour === etat.jour && h.pieceId === pieceId)), { jour: etat.jour, pieceId }].slice(-30);
  return { ...etat, pieceId, historique };
}
