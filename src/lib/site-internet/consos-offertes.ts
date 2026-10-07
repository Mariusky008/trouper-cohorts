/**
 * 🎁 MES CONSOS OFFERTES — les réglages du bar, posés une fois dans l'Espace Pro.
 *
 * « Le commerçant lance "3 consos offertes" dans le salon de sa soirée ; seuls
 * les fantômes qui ont dit "Je compte venir" participent, par tirage au sort ;
 * chaque gagnant reçoit un code valable 30 à 45 minutes, que le bar valide
 * d'un appui ; une seule par personne et par soirée. »
 *
 * ICI, SEULEMENT CE QU'IL OFFRE D'HABITUDE : combien, quoi, combien de temps
 * le code vaut. Le lancement lui-même se fait le soir, depuis le salon de sa
 * soirée (voir `lib/direct/soiree-cadeaux.ts` pour les règles du tirage).
 *
 * Rangé dans `metadata.consos_offertes`, comme la musique de son ambiance.
 * Fichier partagé : l'Espace Pro et le serveur le lisent.
 */
export type ReglagesConsos = { actif: boolean; nombre: number; quoi: string; duree: 30 | 45; at: string };

export const QUOI_CONSO_PAR_DEFAUT = "Une boisson au choix, avec ou sans alcool";

export const REGLAGES_CONSOS_PAR_DEFAUT: ReglagesConsos = { actif: false, nombre: 3, quoi: QUOI_CONSO_PAR_DEFAUT, duree: 45, at: "" };

/** Tout ce qui vient d'ailleurs (la base, le formulaire) passe par ici : bornes et défauts. */
export function normaliserReglagesConsos(v: unknown): ReglagesConsos {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const n = Math.round(Number(o.nombre));
  return {
    actif: o.actif === true,
    nombre: Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 3,
    quoi: (typeof o.quoi === "string" ? o.quoi.trim().slice(0, 80) : "") || QUOI_CONSO_PAR_DEFAUT,
    duree: Number(o.duree) === 30 ? 30 : 45,
    at: typeof o.at === "string" ? o.at : "",
  };
}

export function lireReglagesConsos(metadata: Record<string, unknown> | null | undefined): ReglagesConsos {
  return metadata?.consos_offertes ? normaliserReglagesConsos(metadata.consos_offertes) : REGLAGES_CONSOS_PAR_DEFAUT;
}
