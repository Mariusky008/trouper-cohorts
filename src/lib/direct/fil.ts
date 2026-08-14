// L'ORDRE DU FIL.
//
// Par ordre de DISPARITION, pas par catégorie. Un fil chronologique raconte
// l'histoire du commerce ; un fil trié par disparition répond à la seule
// question que se pose l'habitant : « qu'est-ce que je rate si je n'y vais
// pas maintenant ? »
//
// Quatre rangs, dans cet ordre :
//
//   1. ce qui expire dans l'heure ;
//   2. ce qui a un collectif en cours PROCHE DU SEUIL ;
//   3. ce qui vient d'arriver ;
//   4. le reste, par proximité.
//
// POURQUOI LE COLLECTIF PRESQUE COMPLET PASSE AVANT LA NOUVEAUTÉ : c'est le
// seul cas où l'habitant peut changer le résultat. À 3/4, une personne fait
// basculer le prix pour tout le groupe ; la même carte à 1/4 n'intéresse
// personne. Le rang 2 ne récompense pas la popularité, il récompense
// l'imminence d'un basculement.
//
// UNE ANNONCE EXPIRÉE NE FIGURE PAS DANS LE FIL. Elle est retirée avant le tri,
// pas reléguée en bas : un fil qui traîne les restes d'hier perd la seule chose
// qu'il vend, la certitude que tout y est vrai maintenant.

const str = (v: unknown) => (v == null ? "" : String(v));

/** Une heure : au-delà, l'urgence n'en est plus une à l'échelle d'une journée. */
export const URGENT_MS = 60 * 60 * 1000;
/** Une nouveauté reste « fraîche » une heure et demie — le temps qu'un habitant
 *  qui ouvre l'application deux fois dans la matinée la voie au moins une fois. */
export const FRAIS_MS = 90 * 60 * 1000;
/** « Proche du seuil » : il manque deux personnes ou moins. Le libellé de
 *  l'écran dit « Encore 2 personnes » — le tri suit exactement le même mot. */
export const PRESQUE = 2;

export type Collectif = { participants: number; objectif: number };

export type EntreeFil = {
  expireLe?: string | null;
  publieLe?: string | null;
  /** Distance en mètres. `null` quand la position est inconnue ou refusée. */
  distanceM?: number | null;
  /** Renseigné uniquement pour une campagne collective encore ouverte. */
  collectif?: Collectif | null;
};

export const RANGS = ["urgent", "presque", "nouveau", "reste"] as const;
export type Rang = (typeof RANGS)[number];

const ms = (v: unknown): number => {
  const t = Date.parse(str(v));
  return Number.isFinite(t) ? t : NaN;
};

/** Vrai si l'annonce est encore vivante. Sans échéance, elle l'est. */
export function encoreLa(e: EntreeFil, maintenant: number): boolean {
  const t = ms(e.expireLe);
  return Number.isNaN(t) || t > maintenant;
}

export function rangDe(e: EntreeFil, maintenant: number): Rang {
  const exp = ms(e.expireLe);
  if (!Number.isNaN(exp) && exp - maintenant <= URGENT_MS) return "urgent";

  const c = e.collectif;
  // `objectif - participants` et non un pourcentage : à 8/10 il manque deux
  // personnes, à 4/5 il en manque une — c'est le NOMBRE MANQUANT qui décide si
  // quelqu'un peut faire basculer le groupe, pas la proportion déjà atteinte.
  if (c && c.objectif > 0 && c.participants < c.objectif && c.objectif - c.participants <= PRESQUE) return "presque";

  const pub = ms(e.publieLe);
  if (!Number.isNaN(pub) && maintenant - pub <= FRAIS_MS) return "nouveau";

  return "reste";
}

const RANG_ORDRE: Record<Rang, number> = { urgent: 0, presque: 1, nouveau: 2, reste: 3 };

/** Une distance inconnue ne doit pas passer devant une distance connue : sans
 *  position, tout vaudrait zéro mètre et le fil se trierait au hasard. */
const LOIN = Number.MAX_SAFE_INTEGER;
const distance = (e: EntreeFil): number =>
  typeof e.distanceM === "number" && Number.isFinite(e.distanceM) ? e.distanceM : LOIN;

/**
 * Le fil, ordonné.
 *
 * Les expirées sont retirées AVANT le tri. Le tri lui-même est stable pour deux
 * entrées strictement équivalentes : deux exécutions successives donnent le même
 * ordre, sans quoi le fil semblerait bouger tout seul entre deux rafraîchissements.
 */
export function trierLeFil<T extends EntreeFil>(entrees: readonly T[], maintenant: number = Date.now()): T[] {
  return entrees
    .filter((e) => encoreLa(e, maintenant))
    .map((e, i) => ({ e, i, r: rangDe(e, maintenant) }))
    .sort((a, b) => {
      const ra = RANG_ORDRE[a.r];
      const rb = RANG_ORDRE[b.r];
      if (ra !== rb) return ra - rb;

      switch (a.r) {
        case "urgent": {
          // Le plus près de disparaître d'abord.
          const ea = ms(a.e.expireLe);
          const eb = ms(b.e.expireLe);
          if (ea !== eb) return ea - eb;
          break;
        }
        case "presque": {
          // Celui à qui il manque le moins de monde : c'est le plus facile à
          // faire basculer, donc celui qui mérite le geste.
          const ma = (a.e.collectif!.objectif - a.e.collectif!.participants);
          const mb = (b.e.collectif!.objectif - b.e.collectif!.participants);
          if (ma !== mb) return ma - mb;
          const ea = ms(a.e.expireLe);
          const eb = ms(b.e.expireLe);
          if (ea !== eb) return (Number.isNaN(ea) ? Infinity : ea) - (Number.isNaN(eb) ? Infinity : eb);
          break;
        }
        case "nouveau": {
          // Le plus récent d'abord.
          const pa = ms(a.e.publieLe);
          const pb = ms(b.e.publieLe);
          if (pa !== pb) return pb - pa;
          break;
        }
        default: {
          const da = distance(a.e);
          const db = distance(b.e);
          if (da !== db) return da - db;
          break;
        }
      }
      return a.i - b.i; // stabilité
    })
    .map((x) => x.e);
}
