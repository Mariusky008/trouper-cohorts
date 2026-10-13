/**
 * 🤔 « ÇA ME VA ? », CÔTÉ TÉLÉPHONE — préparer le lien, y ranger l'essai, et
 * guetter les votes des amis. Le serveur garde la vérité
 * (`lib/direct/avis-amis.ts`) ; ce dépôt n'en tient qu'une copie.
 *
 * ON NE DEMANDE RIEN À CEUX QUI N'ONT RIEN DEMANDÉ : tant que ce téléphone n'a
 * envoyé aucun essai à ses amis (`clikme-avis-amis-v1`), aucune page ne
 * questionne le serveur. Ensuite, on relit à l'ouverture, au retour sur la
 * page (en revenant de WhatsApp) et toutes les trente secondes.
 */
import { useEffect, useSyncExternalStore } from "react";

export type ChoixVote = "oui" | "non";
export type Avis = {
  e: string;
  quoi: string;
  prix?: string;
  magasin?: string;
  page?: string;
  oui: number;
  non: number;
  votes: { v: ChoixVote; q?: string; t: string }[];
  vus: number;
  creeLe: string;
  lien: string;
  image: string;
};
export type LienAvis = { e: string; jeton: string; lien: string; image: string };

/** Les mots des deux réponses — les mêmes sur la page de l'ami et chez celui qui demande. */
export const REPONSES_AVIS: Record<ChoixVote, { emoji: string; mot: string }> = {
  oui: { emoji: "😍", mot: "Ça te va trop bien" },
  non: { emoji: "🤔", mot: "Bof, pas pour toi" },
};

const CLE = "clikme-avis-amis-v1";
const ROUTE = "/api/direct/avis-amis";

type Etat = { pret: boolean; avis: Avis[] };
const VIDE: Etat = { pret: false, avis: [] };
let etat: Etat = VIDE;
const abonnes = new Set<() => void>();
const publier = (e: Etat) => {
  etat = e;
  abonnes.forEach((f) => f());
};
const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};
const lire = () => etat;
const serveur = () => VIDE;

function envoyes(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 30) : [];
  } catch {
    return [];
  }
}
function noterEnvoye(e: string) {
  try {
    localStorage.setItem(CLE, JSON.stringify([...new Set([e, ...envoyes()])].slice(0, 30)));
  } catch {
    /* navigation privée : la page en cours suit quand même */
  }
}
const aDemande = () => envoyes().length > 0;

/**
 * LE LIEN, avant même l'envoi : il ne range rien. `null` sans Maison possible (démonstration).
 *
 * UN SEUL À LA FOIS : deux demandes parties ensemble, sur un téléphone sans
 * Maison, en feraient naître deux — et le lien de l'une ne correspondrait plus
 * au cookie gardé par l'autre. `neuf` : on en veut un autre (le précédent a été refusé).
 */
let enVol: Promise<LienAvis | null> | null = null;
export function preparerAvis(ville?: string, neuf = false): Promise<LienAvis | null> {
  if (enVol && !neuf) return enVol;
  const p = demanderLien(ville);
  enVol = p;
  void p.finally(() => {
    if (enVol === p) enVol = null;
  });
  return p;
}

async function demanderLien(ville?: string): Promise<LienAvis | null> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "lien", ville }) });
    const j = (await r.json()) as Partial<LienAvis> & { ok?: boolean };
    return j.ok && j.e && j.jeton && j.lien && j.image ? { e: j.e, jeton: j.jeton, lien: j.lien, image: j.image } : null;
  } catch {
    return null;
  }
}

/** L'essai monte dans sa Maison, derrière le lien. `true` quand l'ami pourra le voir. */
export async function rangerEssaiAvis(l: LienAvis, d: { image: string; quoi: string; prix?: string; magasin?: string; carte?: string; page?: string; ceci?: string; prenom?: string }): Promise<boolean> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "envoyer", jeton: l.jeton, ...d }) });
    const j = (await r.json()) as { ok?: boolean };
    return Boolean(j.ok);
  } catch {
    return false;
  }
}

/** Le message est parti (ou va partir) : on suit ses votes. */
export function suivreAvis(l: LienAvis, d: { quoi: string; prix?: string; magasin?: string; page?: string }): void {
  noterEnvoye(l.e);
  if (etat.avis.some((x) => x.e === l.e)) return;
  publier({
    pret: true,
    avis: [{ ...d, e: l.e, oui: 0, non: 0, votes: [], vus: 0, creeLe: new Date().toISOString(), lien: l.lien, image: l.image }, ...etat.avis],
  });
}

export async function relireAvis(): Promise<void> {
  try {
    const r = await fetch(ROUTE, { cache: "no-store" });
    const j = (await r.json()) as { ok?: boolean; avis?: Avis[] };
    if (!j.ok || !Array.isArray(j.avis)) return;
    const duServeur = j.avis;
    // ENCORE EN ROUTE (l'image monte) : on garde ce qu'on a.
    const enRoute = etat.avis.filter((a) => !duServeur.some((x) => x.e === a.e));
    publier({ pret: true, avis: [...enRoute, ...duServeur] });
  } catch {
    /* hors ligne : on garde ce qu'on a */
  }
}

/** Il a vu les votes arrivés : ils ne rouvriront plus la fenêtre. */
export function marquerAvisVus(e: string): void {
  publier({ ...etat, avis: etat.avis.map((a) => (a.e === e ? { ...a, vus: a.votes.length } : a)) });
  void fetch(ROUTE, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ e }), keepalive: true }).catch(() => undefined);
}

/** Les avis de ses amis, pour un écran. Il ne questionne le serveur que si ce téléphone en a demandé. */
export function useAvisAmis(): Etat {
  const e = useSyncExternalStore(abonner, lire, serveur);
  const suivis = e.avis.length > 0;
  useEffect(() => {
    if (!suivis && !aDemande()) return;
    void relireAvis();
    const auRetour = () => {
      if (document.visibilityState === "visible") void relireAvis();
    };
    document.addEventListener("visibilitychange", auRetour);
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") void relireAvis();
    }, 30_000);
    return () => {
      document.removeEventListener("visibilitychange", auRetour);
      window.clearInterval(t);
    };
  }, [suivis]);
  return e;
}

/** Les demandes qu'un écran suit lui-même (la feuille d'envoi ouverte) : la fenêtre globale ne s'y superpose pas. */
const suiviesIci = new Set<string>();
export const suivreAvisIci = (e: string) => suiviesIci.add(e);
export const nePlusSuivreAvisIci = (e: string) => suiviesIci.delete(e);
export const avisSuiviIci = (e: string) => suiviesIci.has(e);

/** « Léa, Sam et 2 autres » — ceux qui ont signé, puis le reste. */
export function quiAVote(a: Avis): string {
  const noms = a.votes.map((v) => v.q).filter((q): q is string => Boolean(q));
  const uniques = [...new Set(noms)];
  const autres = a.votes.length - noms.length;
  const tete = uniques.slice(0, 3);
  const reste = autres + Math.max(0, uniques.length - 3);
  if (!tete.length) return a.votes.length === 1 ? "1 personne" : `${a.votes.length} personnes`;
  const liste = tete.length > 1 ? `${tete.slice(0, -1).join(", ")} et ${tete.at(-1)}` : tete[0];
  return reste ? `${tete.join(", ")} et ${reste} autre${reste > 1 ? "s" : ""}` : liste;
}

/* ═══ 💬 LE SALON DE L'ESSAI, CÔTÉ TÉLÉPHONE — voir `components/direct/salon-essai.tsx` ═══ */

/** Ce téléphone, pour le serveur : tiré au hasard une fois, gardé ici. Le même pour voter et pour écrire. */
export function votantDuTelephone(): string {
  try {
    let v = localStorage.getItem("clikme-votant") ?? "";
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(v)) {
      v = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
      localStorage.setItem("clikme-votant", v);
    }
    return v;
  } catch {
    return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

export type MotSalon = { i: string; q: string; x: string; t: string; k?: "auteur" | "clikme"; v?: "oui" | "non" | "hesite"; mien?: boolean };
export type SalonEssai = {
  quoi: string;
  prix?: string;
  magasin?: string;
  page?: string;
  ceci?: string;
  prenom?: string;
  oui: number;
  non: number;
  monVote?: ChoixVote;
  mots: MotSalon[];
  auteur: boolean;
  votes?: { v: ChoixVote; q?: string; t: string }[];
  clikme: number;
};

type Reponse = { ok?: boolean; error?: string; attente?: boolean; salon?: SalonEssai };

export async function lireSalonEssai(jeton: string, votant: string): Promise<{ salon?: SalonEssai; attente?: boolean; erreur?: string }> {
  try {
    const r = await fetch(`${ROUTE}?salon=${encodeURIComponent(jeton)}&votant=${encodeURIComponent(votant)}`, { cache: "no-store" });
    const j = (await r.json()) as Reponse;
    if (j.ok && j.salon) return { salon: j.salon };
    return j.attente ? { attente: true } : { erreur: j.error || "Ce salon n’est plus là." };
  } catch {
    return {};
  }
}

async function poster(corps: Record<string, unknown>): Promise<{ ok: boolean; erreur?: string }> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const j = (await r.json()) as Reponse;
    return j.ok ? { ok: true } : { ok: false, erreur: j.error || "Ça n’est pas passé. Réessayez." };
  } catch {
    return { ok: false, erreur: "Pas de réseau. Réessayez." };
  }
}

export const voterDansSalon = (jeton: string, votant: string, v: ChoixVote, prenom?: string) =>
  poster({ action: "voter", jeton, v, votant, ...(prenom ? { prenom } : {}) });
export const ecrireDansSalon = (jeton: string, votant: string, texte: string, prenom?: string) =>
  poster({ action: "ecrire", jeton, votant, texte, ...(prenom ? { prenom } : {}) });
export const demanderAClikMe = (jeton: string, votant: string, question?: string) =>
  poster({ action: "clikme", jeton, votant, ...(question ? { question } : {}) });

/* ═══ LES SALONS D'ESSAI DE CE TÉLÉPHONE — pour les retrouver dans « Salons » ═══
   « Quand j'ai voulu revenir à ce salon où ClikMe m'avait donné son avis, je
   suis allé sur "Salons" et il n'y était pas. » Le salon de l'essai vit sur
   le serveur, derrière son lien ; rien ne le rangeait parmi les salons du
   lieu. Chaque salon ouvert ici s'inscrit donc dans ce registre — le sien
   comme celui d'un ami —, avec de quoi le montrer à la table : la pièce, le
   commerce, qui a parlé, le dernier mot. Le contenu reste sur le serveur. */
export type SalonEssaiConnu = {
  /** Le jeton (ou le lien court) : il suffit pour rouvrir le salon. */
  j: string;
  quoi: string;
  magasin?: string;
  /** C'est son essai à soi. */
  auteur: boolean;
  /** Le prénom de celui qui a essayé (vu par l'ami). */
  prenom?: string;
  /** Le lien à envoyer, chez celui qui a essayé : « Inviter des amis » depuis les salons. */
  lien?: string;
  /** Son avis (`Avis.e`), chez celui qui a essayé : les votes vus dans le salon ne rouvrent pas « Un nouvel avis ! ». */
  e?: string;
  /** Ceux qui ont parlé ou voté, ClikMe compris (pas soi). */
  qui: string[];
  dernier?: { qui: string; texte: string };
  oui: number;
  non: number;
  /** La dernière fois qu'on y est entré. */
  t: number;
};
const CLE_SALONS = "clikme-salons-essai-v1";
const AUCUN_SALON: SalonEssaiConnu[] = [];
let connus: SalonEssaiConnu[] | null = null;
const abonnesSalons = new Set<() => void>();
const texteCourt = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

function lireConnus(): SalonEssaiConnu[] {
  if (connus) return connus;
  try {
    const v = JSON.parse(localStorage.getItem(CLE_SALONS) || "[]");
    connus = Array.isArray(v)
      ? v
          .filter((x): x is SalonEssaiConnu => Boolean(x) && typeof x.j === "string" && typeof x.quoi === "string" && typeof x.t === "number")
          .map((x) => ({ ...x, qui: Array.isArray(x.qui) ? x.qui.filter((q: unknown): q is string => typeof q === "string").slice(0, 6) : [] }))
          .slice(0, 20)
      : [];
  } catch {
    connus = [];
  }
  return connus;
}
function abonnerSalons(f: () => void) {
  abonnesSalons.add(f);
  // UN AUTRE ONGLET DU MÊME TÉLÉPHONE A OUVERT UN SALON : on relit.
  const ailleurs = (ev: StorageEvent) => {
    if (ev.key !== CLE_SALONS) return;
    connus = null;
    f();
  };
  window.addEventListener("storage", ailleurs);
  return () => {
    abonnesSalons.delete(f);
    window.removeEventListener("storage", ailleurs);
  };
}

/**
 * LE SALON EST VU : il s'inscrit (ou se met à jour). `entre` : on vient d'y
 * entrer — il remonte en tête des salons. Sinon, seul ce qu'il contient change,
 * et rien n'est réécrit quand rien n'a bougé.
 */
export function retenirSalonEssai(x: Omit<SalonEssaiConnu, "t">, entre: boolean): void {
  const avant = lireConnus();
  const ancien = avant.find((y) => y.j === x.j);
  const neuf: SalonEssaiConnu = {
    ...x,
    quoi: texteCourt(x.quoi, 80),
    ...(x.magasin ? { magasin: texteCourt(x.magasin, 80) } : {}),
    ...(x.prenom ? { prenom: texteCourt(x.prenom, 30) } : {}),
    ...(x.dernier ? { dernier: { qui: texteCourt(x.dernier.qui, 30), texte: texteCourt(x.dernier.texte, 140) } } : {}),
    qui: x.qui.slice(0, 6),
    ...(x.lien || ancien?.lien ? { lien: x.lien || ancien?.lien } : {}),
    ...(x.e || ancien?.e ? { e: x.e || ancien?.e } : {}),
    t: entre || !ancien ? Date.now() : ancien.t,
  };
  if (ancien && !entre && JSON.stringify(ancien) === JSON.stringify(neuf)) return;
  connus = [neuf, ...avant.filter((y) => y.j !== x.j)].sort((a, b) => b.t - a.t).slice(0, 20);
  try {
    localStorage.setItem(CLE_SALONS, JSON.stringify(connus));
  } catch {
    /* navigation privée : le registre vit le temps de la page */
  }
  abonnesSalons.forEach((f) => f());
}

/** Les salons d'essai ouverts sur ce téléphone, le plus récent d'abord. */
export const useSalonsEssai = () => useSyncExternalStore(abonnerSalons, lireConnus, () => AUCUN_SALON);

/* SANS ÉMOJI : passé par le lien d'ouverture de WhatsApp, il arrivait en « � ». */
export const messageCaMeVa = (e: { quoi: string; magasin?: string }, lien: string) =>
  `Ça me va ? J’hésite pour « ${e.quoi} »${e.magasin ? ` chez ${e.magasin}` : ""}. Dis-moi en un appui : ${lien}`;
