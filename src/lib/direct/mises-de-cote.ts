/**
 * 🧥 MES MISES DE CÔTÉ, CÔTÉ TÉLÉPHONE — préparer le lien, dire que le message
 * est parti, et guetter la réponse du magasin. Le serveur garde la vérité
 * (`lib/direct/mise-de-cote.ts`) ; ce dépôt n'en tient qu'une copie.
 *
 * ON NE DEMANDE RIEN À CEUX QUI N'ONT RIEN DEMANDÉ. Le téléphone note les
 * demandes qu'il a envoyées (`clikme-mises-de-cote-v1`) : tant qu'il n'y en a
 * aucune, aucune page ne questionne le serveur. Une réponse attendue, elle,
 * se relit à l'ouverture, au retour sur la page (en revenant de WhatsApp, par
 * exemple) et toutes les trente secondes tant qu'elle n'est pas arrivée.
 */
import { useEffect, useSyncExternalStore } from "react";

export type EtatCote = "envoyee" | "confirmee" | "refusee";
export type DemandeCote = {
  r: string;
  quoi: string;
  prix?: string;
  photo?: string;
  magasin?: string;
  carte?: string;
  page?: string;
  etat: EtatCote;
  envoyeeLe?: string;
  reponduLe?: string;
  vue: boolean;
};
export type LienCote = { r: string; jeton: string; lien: string };

const CLE = "clikme-mises-de-cote-v1";
const ROUTE = "/api/direct/ma-maison/mise-de-cote";

type Etat = { pret: boolean; demandes: DemandeCote[] };
const VIDE: Etat = { pret: false, demandes: [] };
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

/** Les demandes parties de ce téléphone (leur identifiant), les plus récentes d'abord. */
function enAttente(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 30) : [];
  } catch {
    return [];
  }
}
function ecrireAttente(ids: string[]) {
  try {
    localStorage.setItem(CLE, JSON.stringify([...new Set(ids)].slice(0, 30)));
  } catch {
    /* navigation privée : la page en cours suit quand même */
  }
}
export const aDesDemandes = () => enAttente().length > 0;

/**
 * LE LIEN, PRÉPARÉ AVANT L'APPUI — il ne range rien côté serveur. `null` sans
 * Maison sur le serveur (démonstration, navigation hors ville) : la page envoie
 * alors le message simple, sans suivi.
 */
export async function preparerLienCote(a: { quoi: string; prix?: string; photo?: string; magasin?: string; carte?: string; page?: string; prenom?: string }): Promise<LienCote | null> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "lien", ...a }) });
    const j = (await r.json()) as { ok?: boolean; r?: string; jeton?: string; lien?: string };
    return j.ok && j.r && j.jeton && j.lien ? { r: j.r, jeton: j.jeton, lien: j.lien } : null;
  } catch {
    return null;
  }
}

/** Le message vient de partir : la demande s'affiche tout de suite, et le serveur la range. */
export function noterEnvoiCote(l: LienCote, d: Omit<DemandeCote, "r" | "etat" | "vue">): void {
  ecrireAttente([l.r, ...enAttente()]);
  publier({
    pret: true,
    demandes: [{ ...d, r: l.r, etat: "envoyee", vue: false, envoyeeLe: new Date().toISOString() }, ...etat.demandes.filter((x) => x.r !== l.r)],
  });
  void fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "envoyee", jeton: l.jeton }), keepalive: true }).catch(() => undefined);
}

/** Relire depuis le serveur. Les demandes encore en route (pas encore rangées) restent affichées. */
export async function relireMisesDeCote(): Promise<void> {
  try {
    const r = await fetch(ROUTE, { cache: "no-store" });
    const j = (await r.json()) as { ok?: boolean; demandes?: DemandeCote[] };
    if (!j.ok || !Array.isArray(j.demandes)) return;
    const duServeur = j.demandes;
    const enRoute = etat.demandes.filter((d) => !duServeur.some((x) => x.r === d.r));
    publier({ pret: true, demandes: [...enRoute, ...duServeur] });
  } catch {
    /* hors ligne : on garde ce qu'on a */
  }
}

/** Il a vu la réponse : elle ne s'ouvrira plus d'elle-même. */
export function marquerVueCote(r: string): void {
  publier({ ...etat, demandes: etat.demandes.map((d) => (d.r === r ? { ...d, vue: true } : d)) });
  ecrireAttente(enAttente().filter((x) => x !== r));
  void fetch(ROUTE, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ r }), keepalive: true }).catch(() => undefined);
}

/**
 * LES DEMANDES, POUR UN ÉCRAN. `toujours` : relire même sans demande notée sur
 * ce téléphone (Mon dressing, qui les liste). Sinon, seulement s'il en a une.
 */
export function useMisesDeCote(toujours = false): Etat {
  const e = useSyncExternalStore(abonner, lire, serveur);
  useEffect(() => {
    if (!toujours && !aDesDemandes()) return;
    void relireMisesDeCote();
    const auRetour = () => {
      if (document.visibilityState === "visible") void relireMisesDeCote();
    };
    document.addEventListener("visibilitychange", auRetour);
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible" && etat.demandes.some((d) => d.etat === "envoyee")) void relireMisesDeCote();
    }, 30_000);
    return () => {
      document.removeEventListener("visibilitychange", auRetour);
      window.clearInterval(t);
    };
  }, [toujours]);
  return e;
}

/** Les demandes qu'un écran du look suit lui-même : la fenêtre globale ne les rouvre pas en double. */
const suiviesIci = new Set<string>();
export const suivreIci = (r: string) => suiviesIci.add(r);
export const nePlusSuivreIci = (r: string) => suiviesIci.delete(r);
export const suivieIci = (r: string) => suiviesIci.has(r);
