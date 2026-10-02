/**
 * ═══ LA PAGE À ONGLETS POUR TOUS LES MÉTIERS ════════════════════════════════
 *
 * « Maintenant il va falloir faire la même chose avec tous les autres
 * métiers. » La page à onglets — le lieu et son fantôme qui fait entrer, la
 * carte ou les tarifs, l'expérience, les avis, les amis, les infos — était
 * celle des restaurants. Elle est celle de tous : chaque métier y a ses mots
 * (voir `MOTS` dans `boutique-table.tsx`) et son expérience (l'essayage
 * d'`/autour-de-moi`, voir `essai-du-lieu.tsx`).
 *
 * LA PAGE LONGUE RESTE DERRIÈRE CETTE LISTE, VIDE. Un métier qu'on y remet
 * retrouve l'ancienne page d'un mot, sans rien réécrire.
 *
 * FICHIER PARTAGÉ : lu par la page serveur et par la boutique, côté client.
 */
const PAGE_LONGUE: string[] = [];

export const aLaPageAOnglets = (branche: string) => !PAGE_LONGUE.includes(branche);
