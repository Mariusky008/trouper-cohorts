/**
 * Garde-fou Avatar Hybride : valide qu'un titre généré par l'IA
 * ne contient JAMAIS de mot négatif ou accusateur.
 *
 * Le paradoxe doit être célébré, jamais reproché. C'est non-négociable :
 * l'avatar est conçu pour être partagé en story (Instagram/TikTok) et
 * un titre toxique détruit la réputation du produit en un partage.
 *
 * Voir Partie 4.2 du doc de vision.
 */

// Miroir de la table kudos_avatar_blacklist (kept in code for fast eval).
// Si tu modifies cette liste, garde la DB en sync via une migration.
const BLACKLIST = new Set([
  'tyran', 'tyrannique',
  'hypocrite', 'faux',
  'manipulateur', 'manipulatrice',
  'toxique',
  'lâche', 'lache',
  'égoïste', 'egoiste',
  'arrogant', 'arrogante',
  'méchant', 'méchante', 'mechant', 'mechante',
  'cruel', 'cruelle',
  'mauvais', 'mauvaise',
  'agressif', 'agressive',
  'narcissique',
  'pervers', 'perverse',
])

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents pour matcher "egoiste" aussi
    .trim()
}

export type AvatarValidation =
  | { ok: true }
  | { ok: false; reason: 'forbidden_word'; word: string }
  | { ok: false; reason: 'too_long'; length: number }
  | { ok: false; reason: 'empty' }

export function validateAvatarTitle(title: string): AvatarValidation {
  if (!title || title.trim().length === 0) return { ok: false, reason: 'empty' }
  if (title.length > 40) return { ok: false, reason: 'too_long', length: title.length }

  const tokens = normalize(title).split(/[\s\-'']+/)
  for (const token of tokens) {
    if (BLACKLIST.has(token)) {
      return { ok: false, reason: 'forbidden_word', word: token }
    }
  }
  return { ok: true }
}

/**
 * Wrapper à utiliser après l'appel IA. Si le titre échoue la validation,
 * lance une exception qui doit déclencher une régénération côté Edge Function.
 */
export function assertAvatarSafe(title: string): void {
  const v = validateAvatarTitle(title)
  if (!v.ok) {
    throw new Error(`Avatar title rejected (${v.reason}): "${title}"`)
  }
}
