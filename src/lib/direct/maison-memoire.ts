"use client";
// 🏠 MA MAISON, DANS LE TÉLÉPHONE ET SUR LE SERVEUR.
//
// LA COPIE DU TÉLÉPHONE sert à aller vite et à marcher sans réseau. LA MAISON
// DU SERVEUR est celle qui dure : Safari efface ce que le site garde lui-même
// au bout de sept jours sans visite, pas le cookie posé par le serveur — c'est
// lui qui retrouve la maison (`/api/direct/ma-maison`).
//
// DANS LA DÉMONSTRATION (pas de vraie ville), la Maison ne vit que dans le
// téléphone : il n'y a personne à qui la rendre.
//
// CHAQUE GESTE est d'abord écrit ici, puis part au serveur un instant plus
// tard, fusionné avec ce qu'il sait déjà : deux téléphones de la même personne
// ne s'écrasent pas.
import {
  fusionnerMemoires,
  lireMemoire,
  MEMOIRE_VIDE,
  PIECES,
  type ClePiece,
  type Memoire,
  type Signal,
} from "@/lib/direct/maison";

const CLE = "clikme-maison-memoire-v1";

export type Compte = { email: string | null; verifie: boolean };
export type EtatMaison = {
  memoire: Memoire;
  /** La vraie ville, quand il y en a une : c'est elle qui ouvre le serveur. */
  ville: string | null;
  /** « pret » : le serveur garde la Maison. « absent » : la démonstration, ou la base pas encore prête. */
  serveur: "attente" | "pret" | "absent";
  compte: Compte | null;
};

let etat: EtatMaison | null = null;
const abonnes = new Set<() => void>();
let envoi: number | null = null;

const ETAT_SERVEUR: EtatMaison = { memoire: MEMOIRE_VIDE, ville: null, serveur: "absent", compte: null };

function lireLocal(): Memoire {
  try {
    return lireMemoire(JSON.parse(window.localStorage.getItem(CLE) || "{}"));
  } catch {
    return MEMOIRE_VIDE;
  }
}

function lire(): EtatMaison {
  if (!etat) etat = { memoire: lireLocal(), ville: null, serveur: "absent", compte: null };
  return etat;
}

function changer(e: Partial<EtatMaison>) {
  etat = { ...lire(), ...e };
  if (e.memoire) {
    try {
      window.localStorage.setItem(CLE, JSON.stringify(e.memoire));
    } catch {
      /* plein ou refusé : la Maison vit le temps de la visite, et le serveur la garde */
    }
  }
  abonnes.forEach((f) => f());
}

export const chargerMaisonPrivee = (): EtatMaison => lire();
export const maisonPriveeServeur = (): EtatMaison => ETAT_SERVEUR;
export function abonnerMaisonPrivee(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/** Envoyer la mémoire au serveur, un instant après le dernier geste. */
function planifierEnvoi() {
  const { ville } = lire();
  if (!ville) return;
  if (envoi) window.clearTimeout(envoi);
  envoi = window.setTimeout(() => {
    envoi = null;
    void envoyer();
  }, 700);
}

async function envoyer() {
  const { ville, memoire } = lire();
  if (!ville) return;
  try {
    const r = await fetch("/api/direct/ma-maison", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ville, memoire }),
    });
    if (!r.ok) return changer({ serveur: r.status === 503 ? "absent" : lire().serveur });
    const j = (await r.json()) as { memoire?: unknown };
    changer({ memoire: fusionnerMemoires(lire().memoire, lireMemoire(j.memoire)), serveur: "pret" });
  } catch {
    /* hors ligne : la copie du téléphone attend le prochain geste */
  }
}

/**
 * BRANCHER LA MAISON SUR LA VRAIE VILLE. La maison du serveur et la copie du
 * téléphone se fusionnent ; si le téléphone savait des choses que le serveur
 * ignore, elles partent.
 */
export function brancherLaMaisonPrivee(ville: string) {
  changer({ ville, serveur: "attente" });
  let fini = false;
  void (async () => {
    try {
      const r = await fetch("/api/direct/ma-maison", { cache: "no-store" });
      const j = (await r.json()) as { ok?: boolean; serveur?: boolean; memoire?: unknown; compte?: Compte | null };
      if (fini) return;
      if (!j.ok || j.serveur === false) return changer({ serveur: "absent" });
      const local = lire().memoire;
      const serveur = lireMemoire(j.memoire);
      const m = fusionnerMemoires(local, serveur);
      changer({ memoire: m, serveur: "pret", compte: j.compte ?? null });
      if (JSON.stringify(m) !== JSON.stringify(serveur) && (m.signaux.length || Object.keys(m.choix).length)) planifierEnvoi();
    } catch {
      if (!fini) changer({ serveur: "absent" });
    }
  })();
  return () => {
    fini = true;
    changer({ ville: null, serveur: "absent" });
  };
}

function geste(f: (m: Memoire) => Memoire) {
  const m = { ...f(lire().memoire), maj: Date.now() };
  changer({ memoire: m });
  planifierEnvoi();
}

// ─── LES GESTES ────────────────────────────────────────────────────────────

/** CE QUE VOUS M'AVEZ DIT : les choix d'une pièce (« Je ne mange pas de porc »). */
export function choisirDansLaPiece(piece: ClePiece, cles: string[]) {
  geste((m) => ({ ...m, choix: { ...m.choix, [piece]: { v: [...new Set(cles)].slice(0, 20), t: Date.now() } } }));
}

/** « Ce n'est pas moi » : ce trait ne sera plus déduit dans cette pièce. */
export function refuserLeTrait(piece: ClePiece, trait: string) {
  geste((m) => {
    const deja = m.refus[piece]?.v ?? [];
    return { ...m, refus: { ...m.refus, [piece]: { v: [...new Set([...deja, trait])].slice(0, 20), t: Date.now() } } };
  });
}

export function mettreEnPause(piece: ClePiece, enPause: boolean) {
  geste((m) => ({ ...m, pauses: { ...m.pauses, [piece]: { v: enPause, t: Date.now() } } }));
}

/** VIDER UNE PIÈCE : ce qu'elle savait ne compte plus, ses choix tombent. */
export function viderLaPiece(piece: ClePiece) {
  const t = Date.now();
  geste((m) => ({
    ...m,
    videes: { ...m.videes, [piece]: t },
    choix: { ...m.choix, [piece]: { v: [], t } },
    refus: { ...m.refus, [piece]: { v: [], t } },
    signaux: m.signaux.filter((s) => s.piece !== piece),
  }));
}

/**
 * NOTER CE QUE L'APPLICATION A REMARQUÉ (pièces mises de côté, duels, suivis,
 * envies). Seuls les signaux nouveaux comptent ; une pièce en pause n'apprend
 * rien ; un geste d'avant une pièce vidée ne la remplit pas de nouveau.
 */
export function noterLesSignaux(nouveaux: Signal[]) {
  const m = lire().memoire;
  const connus = new Set(m.signaux.map((s) => s.id));
  const a = nouveaux.filter((s) => !connus.has(s.id) && m.pauses[s.piece]?.v !== true && s.t > (m.videes[s.piece] ?? 0));
  if (!a.length) return;
  geste((x) => fusionnerMemoires(x, { ...MEMOIRE_VIDE, signaux: a }));
}

/**
 * TOUT EFFACER. Sur le serveur, la mémoire, les dépôts et les photos ; ici, la
 * copie. Les pièces sont marquées vidées à cette heure-ci : ce que l'application
 * gardait déjà ailleurs (les pièces mises de côté) ne revient pas la remplir.
 */
export async function effacerToutLaMaison(): Promise<boolean> {
  const t = Date.now();
  const videes = Object.fromEntries(PIECES.map((p) => [p.cle, t])) as Memoire["videes"];
  const { ville } = lire();
  if (envoi) {
    window.clearTimeout(envoi);
    envoi = null;
  }
  changer({ memoire: { ...MEMOIRE_VIDE, videes, maj: t } });
  if (!ville) return true;
  try {
    const r = await fetch("/api/direct/ma-maison", { method: "DELETE" });
    return r.ok;
  } catch {
    return false;
  }
}

// ─── RETROUVER SA MAISON : L'ADRESSE ET LE CODE ────────────────────────────

export async function demanderLeCode(email: string): Promise<{ ok: true } | { erreur: string }> {
  const { ville } = lire();
  if (!ville) return { erreur: "Dans la démonstration, la Maison reste sur ce téléphone." };
  try {
    const r = await fetch("/api/direct/ma-maison/code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, ville }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    return r.ok ? { ok: true } : { erreur: j.error || "Indisponible pour le moment." };
  } catch {
    return { erreur: "Pas de réseau. Réessayez dans un instant." };
  }
}

export async function donnerLeCode(email: string, code: string): Promise<{ ok: true } | { erreur: string }> {
  const { ville } = lire();
  if (!ville) return { erreur: "Dans la démonstration, la Maison reste sur ce téléphone." };
  try {
    const r = await fetch("/api/direct/ma-maison/verifier", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code, ville }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string; memoire?: unknown; compte?: Compte };
    if (!r.ok) return { erreur: j.error || "Indisponible pour le moment." };
    // CE TÉLÉPHONE EST MAINTENANT DANS CETTE MAISON : ce qu'il savait s'y ajoute.
    const m = fusionnerMemoires(lire().memoire, lireMemoire(j.memoire));
    changer({ memoire: m, compte: j.compte ?? { email, verifie: true }, serveur: "pret" });
    planifierEnvoi();
    return { ok: true };
  } catch {
    return { erreur: "Pas de réseau. Réessayez dans un instant." };
  }
}
