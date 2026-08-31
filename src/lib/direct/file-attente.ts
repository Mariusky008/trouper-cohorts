// LA FILE DU MATIN — « prévenez-moi s'il en reste ce soir ».
//
// ─── LE DÉFAUT QU'ELLE RÈGLE, ET IL VIDAIT LE TOUR DE RÔLE DE SON SENS ─────
//
// « Il y a peu de chances que les gens tombent pile poil sur les offres avec le
// compteur de 5 minutes, comment pourrait-on faire pour qu'ils en aient
// vraiment connaissance ? » C'est exact, et c'était la vraie faiblesse : le
// tour de rôle n'apparaissait que si l'on ouvrait l'application par hasard au
// bon moment, ce qui n'arrive jamais. On avait construit un mécanisme juste
// pour des gens qui n'en sauraient rien.
//
// ─── ON A RETOURNÉ LA FENÊTRE ──────────────────────────────────────────────
//
// L'offre partait vers des gens qui ne s'attendaient à rien. Maintenant, c'est
// LE MATIN qu'on se met dans la file, quand on est déjà dans l'application, en
// un appui : « prévenez-moi s'il reste des croissants ce soir ». Le soir, quand
// le boulanger appuie sur son bouton, l'offre descend DANS CETTE FILE-LÀ, dans
// l'ordre, cinq minutes chacun.
//
// CE QUE ÇA CHANGE, ET C'EST ÉNORME : la notification arrive chez quelqu'un QUI
// L'A DEMANDÉE LE MATIN MÊME. Elle n'est plus une interruption, c'est une
// réponse. Le taux n'a rien à voir, et surtout on ne dérange personne.
//
// ET LE COMMERÇANT GAGNE MIEUX QUE ÇA. À 17 h il sait déjà que huit personnes
// attendent : il peut décider de faire une fournée de plus au lieu de brader le
// soir. La file n'est pas qu'un canal de distribution, c'est une PRÉVISION —
// la seule chose qu'aucun outil de caisse ne lui donne.
//
// ─── L'ORDRE EST CELUI DE L'ARRIVÉE, ET C'EST TOUT ─────────────────────────
//
// Pas de tirage au sort, pas de premier arrivé au clic le soir. Celui qui s'est
// inscrit à 7 h passe avant celui de 11 h, et il le sait — son rang est écrit.
// C'est la même règle morale que le tour de rôle lui-même : une course de
// rapidité désigne toujours les mêmes gagnants, ceux qui ont le téléphone en
// main, et apprend à tous les autres que ce n'est pas pour eux.
//
// ─── CE QUI N'EST PAS FAIT ICI ─────────────────────────────────────────────
//
// La maquette n'a pas de serveur : la file vit dans le navigateur, et le rang
// affiché est celui qu'annonce la fiche plus le nôtre. En vrai il faut une
// table et un envoi. Ce qui est déjà juste et qu'on gardera : le moment où l'on
// demande la permission de notification — À L'INSCRIPTION, parce que c'est le
// seul instant du produit où « on vous préviendra » est une phrase vraie et
// attendue.

const CLE = "clikme-file-v1";
const abonnes = new Set<() => void>();
export const AUCUNE_FILE: string[] = [];
let cache: string[] | null = null;

/** Ce qu'on attend, par commerce. La clé porte l'identifiant du commerce. */
export function chargerFile(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUNE_FILE;
  try {
    const brut = window.localStorage.getItem(CLE);
    const l = brut ? JSON.parse(brut) : null;
    cache = Array.isArray(l) && l.length ? (l as string[]) : AUCUNE_FILE;
  } catch {
    cache = AUCUNE_FILE;
  }
  return cache;
}

/** L'instantané du serveur : la même instance à chaque appel — voir le grand
 *  commentaire de `preparation.ts`, l'écran blanc a déjà été payé une fois. */
export function fileVide(): string[] {
  return AUCUNE_FILE;
}

export function abonnerFile(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

function garder(v: string[]) {
  cache = v.length ? v : AUCUNE_FILE;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(v));
  } catch {
    /* Stockage refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

/** Rend vrai si l'on vient d'entrer dans la file, faux si l'on en sort. */
export function basculerFile(id: string): boolean {
  const v = chargerFile();
  const dedans = v.includes(id);
  garder(dedans ? v.filter((x) => x !== id) : [...v, id]);
  return !dedans;
}

export function jAttends(id: string): boolean {
  return chargerFile().includes(id);
}
