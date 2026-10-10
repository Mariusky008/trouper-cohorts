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
  MONTREES_MAX,
  PIECES,
  type ClePiece,
  type JourDeSurprises,
  type Memoire,
  type Signal,
} from "@/lib/direct/maison";
import { noterUneFois } from "@/lib/direct/parcours";
import { contexteDe, type GesteDeSurprise } from "@/lib/direct/surprises-mesure";
import {
  choisirLesSurprises,
  dateDuJour,
  estPassee,
  SURPRISES_MAX,
  type CommerceDuJour,
  type Surprise,
} from "@/lib/direct/surprises";

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

/** Les surprises du jour pas encore ouvertes qui ne valent plus : elles s'en vont. */
function sansLesSurprises(m: Memoire, tombe: (s: Surprise) => boolean): JourDeSurprises | undefined {
  const j = m.jour;
  if (!j) return j;
  return { ...j, liste: j.liste.filter((s) => j.vues.includes(s.id) || !tombe(s)) };
}

/** « Ce n'est pas moi » : ce trait ne sera plus déduit dans cette pièce. */
export function refuserLeTrait(piece: ClePiece, trait: string) {
  geste((m) => {
    const deja = m.refus[piece]?.v ?? [];
    return {
      ...m,
      refus: { ...m.refus, [piece]: { v: [...new Set([...deja, trait])].slice(0, 20), t: Date.now() } },
      jour: sansLesSurprises(m, (s) => s.piece === piece && s.traits.includes(trait)),
    };
  });
}

export function mettreEnPause(piece: ClePiece, enPause: boolean) {
  geste((m) => ({
    ...m,
    pauses: { ...m.pauses, [piece]: { v: enPause, t: Date.now() } },
    jour: enPause ? sansLesSurprises(m, (s) => s.piece === piece) : m.jour,
  }));
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
    jour: sansLesSurprises(m, (s) => s.piece === piece),
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

// ─── LES SURPRISES DU JOUR ─────────────────────────────────────────────────

/**
 * LE FANTÔME FAIT SA TOURNÉE. Une fois par jour, puis chaque fois que la Maison
 * en apprend plus : une pièce qui n'avait rien peut avoir trouvé quelque chose.
 * Ce qui est déjà dans la liste y reste (on ne retire pas une surprise sous les
 * yeux), sauf ce qui n'a pas été ouvert et ne vaut plus (le plat du midi, à 16 h).
 */
export function preparerLesSurprises(commerces: CommerceDuJour[], maintenant: Date, gardees: { nom: string }[] = []) {
  const m = lire().memoire;
  const date = dateDuJour(maintenant);
  const avant = m.jour?.date === date ? m.jour : undefined;
  const jour: JourDeSurprises = avant ?? { date, liste: [], vues: [], avis: {} };
  const restent = jour.liste.filter((s) => jour.vues.includes(s.id) || !estPassee(s, maintenant));
  let liste = restent;
  if (restent.length < SURPRISES_MAX) {
    const deja = [...m.montrees, ...restent.map((s) => ({ k: s.objet, t: maintenant.getTime() }))];
    const nouvelles = choisirLesSurprises(m, commerces, maintenant, gardees, deja).filter((s) => !restent.some((r) => r.piece === s.piece));
    liste = [...restent, ...nouvelles].slice(0, SURPRISES_MAX);
  }
  const pareil = avant && liste.length === avant.liste.length && liste.every((s, i) => s.id === avant.liste[i].id);
  if (pareil || (!avant && !liste.length && !m.jour)) return;
  geste((x) => ({ ...x, jour: { ...jour, liste } }));
  for (const s of liste) if (!avant?.liste.some((a) => a.id === s.id)) noterLaSurprise(s, "trouvee");
}

/**
 * CE QUE LA SURPRISE EST DEVENUE — anonyme : le geste, la sorte de raison, la
 * pièce, la ville. Une fois par surprise et par geste dans la visite. Voir
 * `lib/direct/surprises-mesure.ts`.
 */
export function noterLaSurprise(s: Surprise, geste: GesteDeSurprise) {
  noterUneFois(`surprise|${s.id}|${geste}`, "surprise", s.score, contexteDe(geste, s.sorte, s.piece, lire().ville));
}

/** Les surprises du jour pas encore ouvertes — le badge de Ma Maison. */
export function surprisesAOuvrir(m: Memoire, maintenant: Date): Surprise[] {
  const j = m.jour;
  if (!j || j.date !== dateDuJour(maintenant)) return [];
  return j.liste.filter((s) => !j.vues.includes(s.id) && !estPassee(s, maintenant));
}

/** Les surprises d'aujourd'hui, ouvertes ou non : « Revoir mes surprises du jour ». */
export function surprisesDuJour(m: Memoire, maintenant: Date): Surprise[] {
  return m.jour?.date === dateDuJour(maintenant) ? m.jour.liste : [];
}

/** Ouverte : elle ne compte plus dans le badge, et ne revient pas de la semaine. */
export function voirLaSurprise(s: Surprise) {
  const m = lire().memoire;
  if (!m.jour || m.jour.vues.includes(s.id)) return;
  noterLaSurprise(s, "vue");
  geste((x) =>
    x.jour
      ? {
          ...x,
          jour: { ...x.jour, vues: [...new Set([...x.jour.vues, s.id])] },
          montrees: [{ k: s.objet, t: Date.now() }, ...x.montrees.filter((y) => y.k !== s.objet)].slice(0, MONTREES_MAX),
        }
      : x,
  );
}

/**
 * ❤️ ÇA ME PLAÎT / 👎 PAS VRAIMENT — un geste comme un autre : il devient un
 * signal de la pièce (ce que j'ai remarqué), et nourrit ce que je crois. On
 * peut changer d'avis : le même signal est remplacé, pas doublé. Une pièce en
 * pause garde l'avis mais n'apprend rien.
 */
export function reagirALaSurprise(s: Surprise, sens: 1 | -1) {
  if (lire().memoire.jour?.avis[s.id] !== sens) noterLaSurprise(s, sens > 0 ? "aime" : "bof");
  geste((m) => {
    const t = Date.now();
    const jour = m.jour ? { ...m.jour, avis: { ...m.jour.avis, [s.id]: sens } } : m.jour;
    if (m.pauses[s.piece]?.v === true) return { ...m, jour };
    const signal: Signal = {
      id: `surprise|${s.objet}`,
      piece: s.piece,
      quoi: s.titre,
      d: sens > 0 ? `Une surprise qui vous a plu, chez ${s.lieu}` : `Une surprise pas vraiment pour vous`,
      sens,
      traits: s.traits,
      image: s.photo,
      t,
    };
    return fusionnerMemoires({ ...m, jour }, { ...MEMOIRE_VIDE, signaux: [signal] });
  });
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
