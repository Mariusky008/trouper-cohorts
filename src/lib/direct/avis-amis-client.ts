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

/** LE LIEN, avant même l'envoi : il ne range rien. `null` sans Maison possible (démonstration). */
export async function preparerAvis(ville?: string): Promise<LienAvis | null> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "lien", ville }) });
    const j = (await r.json()) as Partial<LienAvis> & { ok?: boolean };
    return j.ok && j.e && j.jeton && j.lien && j.image ? { e: j.e, jeton: j.jeton, lien: j.lien, image: j.image } : null;
  } catch {
    return null;
  }
}

/** L'essai monte dans sa Maison, derrière le lien. `true` quand l'ami pourra le voir. */
export async function rangerEssaiAvis(l: LienAvis, d: { image: string; quoi: string; prix?: string; magasin?: string; carte?: string; page?: string; ceci?: string }): Promise<boolean> {
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
