/**
 * 📣 LA DIFFUSION CROISÉE — « une meilleure vidéo ne garantit pas davantage de visibilité ». Chaque commerçant devient
 * un média pour les autres : quand il publie une vidéo, elle passe aussi chez DEUX commerçants partenaires, sur leurs
 * réseaux, en « découverte du quartier » ; et les leurs passent chez lui.
 *
 * LES TROIS RÈGLES (le propriétaire, novembre 2026) :
 *   1. deux partenaires au plus par commerce, au départ ;
 *   2. pas de concurrent direct associé d'office (pas deux coiffeurs côte à côte quand on peut l'éviter) ;
 *   3. une diffusion RÉCIPROQUE ET ÉQUILIBRÉE : personne ne diffuse sans jamais être diffusé.
 * Et une quatrième, indispensable : chacun ACCEPTE explicitement d'accueillir les vidéos des autres, avec une fréquence
 * maîtrisée (`PLAFOND_PAR_SEMAINE`).
 *
 * L'ANNEAU (`anneauDeDiffusion`) tient les trois règles d'un coup : dans chaque ville, les commerces du réseau sont mis
 * en cercle, de proche en proche ; chacun diffuse ses deux voisins de cercle, qui le diffusent en retour — deux reçus,
 * deux donnés, pour tout le monde. Quand un commerce rejoint ou quitte le réseau, le cercle se refait.
 *
 * FICHIER PUR (navigateur et serveur) : il ne lit rien, il calcule sur ce qu'on lui donne.
 */
import { aPied, distanceM, type Point } from "./voisins";
import { villeSlug } from "./ville";

/** Ce qu'il faut savoir d'un commerce du réseau pour le placer dans le cercle. */
export type Participant = { id: string; branche: string; ville: string; point?: Point };

/** Au plus deux vidéos de partenaires par semaine sur ses réseaux, en automatique. */
export const PLAFOND_PAR_SEMAINE = 2;
/** Une vidéo reçue qu'il n'a pas diffusée au bout d'une semaine n'est plus d'actualité. */
export const JOURS_DE_FRAICHEUR = 7;

/** Ce qu'il a réglé, rangé dans `metadata.diffusion_croisee` de son site (pas « diffusion » : c'est le mot de son message du mois). */
export type ReglageDiffusion = { active: boolean; auto: boolean; le?: string };
export function reglageDe(metadata: unknown): ReglageDiffusion {
  const m = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>).diffusion_croisee : null;
  const d = m && typeof m === "object" ? (m as Record<string, unknown>) : {};
  return { active: d.active === true, auto: d.auto !== false, ...(typeof d.le === "string" ? { le: d.le } : {}) };
}

/**
 * LE CERCLE D'UNE VILLE, de proche en proche : on part du commerce le plus au nord-ouest (le plus haut, puis le plus à
 * gauche ; ceux sans coordonnées viennent à la fin, par ordre d'identifiant), et l'on va toujours au plus proche des
 * restants. Le même réseau donne toujours le même cercle.
 */
function cercle(ps: Participant[]): Participant[] {
  const avec = ps.filter((p) => p.point).sort((a, b) => b.point!.lat - a.point!.lat || a.point!.lng - b.point!.lng || a.id.localeCompare(b.id));
  const sans = ps.filter((p) => !p.point).sort((a, b) => a.id.localeCompare(b.id));
  const ordre: Participant[] = [];
  const restants = [...avec];
  let ici = restants.shift();
  while (ici) {
    ordre.push(ici);
    if (!restants.length) break;
    let k = 0;
    for (let j = 1; j < restants.length; j++) if (distanceM(ici.point!, restants[j].point!) < distanceM(ici.point!, restants[k].point!)) k = j;
    ici = restants.splice(k, 1)[0];
  }
  return [...ordre, ...sans];
}

/** Deux du même métier côte à côte dans le cercle ? On échange le second avec le premier plus loin qui ne l'est pas. */
function separerLesConcurrents(c: Participant[]): Participant[] {
  const r = [...c];
  const n = r.length;
  if (n < 3) return r;
  const conflit = (i: number) => r[i].branche === r[(i + 1) % n].branche || r[i].branche === r[(i - 1 + n) % n].branche;
  for (let passe = 0; passe < 2; passe++)
    for (let i = 0; i < n; i++) {
      if (r[i].branche !== r[(i + 1) % n].branche) continue;
      const j = (i + 1) % n;
      for (let d = 2; d < n; d++) {
        const k = (j + d - 1) % n;
        if (k === i || k === j) continue;
        [r[j], r[k]] = [r[k], r[j]];
        if (!conflit(j) && !conflit(k)) break;
        [r[j], r[k]] = [r[k], r[j]];
      }
    }
  return r;
}

/**
 * LES PARTENAIRES DE CHACUN : l'identifiant d'un commerce → les identifiants de ses partenaires (deux, ou un seul
 * s'ils ne sont que deux dans sa ville, ou aucun s'il est seul). Toujours réciproque : si A diffuse B, B diffuse A.
 */
export function anneauDeDiffusion(participants: Participant[]): Map<string, string[]> {
  const parVille = new Map<string, Participant[]>();
  for (const p of participants) {
    const v = villeSlug(p.ville) || "?";
    parVille.set(v, [...(parVille.get(v) ?? []), p]);
  }
  const partenaires = new Map<string, string[]>();
  for (const groupe of parVille.values()) {
    const c = separerLesConcurrents(cercle(groupe));
    const n = c.length;
    c.forEach((p, i) => {
      if (n === 1) partenaires.set(p.id, []);
      else if (n === 2) partenaires.set(p.id, [c[1 - i].id]);
      else partenaires.set(p.id, [c[(i - 1 + n) % n].id, c[(i + 1) % n].id]);
    });
  }
  return partenaires;
}

/** « à 2 min à pied d'ici », « juste à côté », « à 1,4 km d'ici » — ou « tout près d'ici » sans coordonnées. */
export function distanceEnMots(a?: Point, b?: Point): string {
  if (!a || !b) return "tout près d'ici";
  const m = aPied(distanceM(a, b));
  if (!m) return "tout près d'ici";
  if (/^juste/i.test(m)) return "juste à côté";
  return `${m.charAt(0).toLowerCase()}${m.slice(1)} d'ici`;
}

/**
 * LE TEXTE DE LA DÉCOUVERTE, posté chez le partenaire : pas une publicité qui s'impose, une découverte locale qui a du
 * sens — « Découverte du quartier 📣 À 2 min à pied d'ici, chez Boulangerie Martin : les croissants du jour. Allez voir ! »
 * Ses mots à lui (le commerce invité), pas ceux de l'hôte ; l'hôte présente, il ne parle pas à sa place.
 */
export function texteDeDecouverte(p: { nom: string; metier?: string; texte: string; ou: string }): string {
  const ou = p.ou.charAt(0).toUpperCase() + p.ou.slice(1);
  const simple = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  // « Boulangerie Martin (boulangerie) » : le métier ne se répète pas quand le nom le dit déjà
  const chez = p.metier && !simple(p.nom).includes(simple(p.metier)) ? `${p.nom} (${p.metier.toLowerCase()})` : p.nom;
  const texte = p.texte.replace(/\s+/g, " ").trim().slice(0, 220);
  // « chez Chez Bergine » : quand son nom commence par « Chez », il le dit déjà
  const devant = /^chez\s/i.test(p.nom.trim()) ? "" : "chez ";
  return `Découverte du quartier 📣 ${ou}, ${devant}${chez}${texte ? ` : ${texte}` : ""}${/[.!?…]$/.test(texte) ? "" : "."} Allez voir !`;
}

/** Combien de vidéos de partenaires sont parties sur ses réseaux ces sept derniers jours. */
export function diffuseesCetteSemaine(dates: string[], maintenant = Date.now()): number {
  return dates.filter((d) => maintenant - Date.parse(d) < 7 * 86_400_000).length;
}
