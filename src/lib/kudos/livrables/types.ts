/**
 * Types des 3 livrables de fin de saison générés par l'IA.
 * Voir Partie 4 du doc de vision.
 */

export type LivrableAngleMort = {
  blockSansLeSavoir: string         // "Tu te vois X mais 7/8 te voient Y..."
  troisSituations: string[]         // 3 contextes concrets où l'user est déjà légitime
}

export type LivrableAvatarHybride = {
  rarity: 'Commun' | 'Rare' | 'Épique' | 'Légendaire'
  emoji: string                     // 1 emoji représentant l'archétype hybride
  title: string                     // "Le Pilier Solaire" — VALIDÉ contre la blacklist
  stats: {
    label: string                   // "Autorité tranquille"
    value: number                   // 0-100
  }[]
  tagline: string                   // phrase d'accroche partageable, 1 ligne
}

export type LivrableDefiLien = {
  targetName: string                // prénom de la cible
  missionText: string               // texte bienveillant — JAMAIS vers la rupture
}

export type GeneratedLivrables = {
  angleMort: LivrableAngleMort
  avatarHybride: LivrableAvatarHybride
  defiLien: LivrableDefiLien
}
