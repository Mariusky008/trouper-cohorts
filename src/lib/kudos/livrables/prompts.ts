/**
 * Construction des prompts IA pour les 3 livrables.
 * Source : Partie 4.1 (Angle Mort), 4.2 (Avatar Hybride), 4.3 (Défi de Lien)
 * du doc de vision.
 */

import type { PortraitDelta, PerceivedPortrait, InnerPortrait } from '../portrait/types'

export type LivrableContext = {
  userName: string
  inner: InnerPortrait
  perceived: PerceivedPortrait
  delta: PortraitDelta
  /** Un ami "point de calme" ou positivement perçu — utilisé pour le défi. */
  targetFriend?: { name: string; positiveSignal: string }
}

// ─────────────────────────────────────────────────────────────
// Livrable 1 — Angle Mort
// ─────────────────────────────────────────────────────────────
export function buildAngleMortPrompt(ctx: LivrableContext): { system: string; user: string } {
  const bs = ctx.delta.strongestBlindspot
  const blindspotDescription = bs
    ? `Dimension : ${bs.dimension}. Les autres te perçoivent à ${(bs.externalScore * 100).toFixed(0)}%, tu te vois à ${(bs.internalScore * 100).toFixed(0)}%. ${bs.attributionCount} personnes confirment cette perception.`
    : 'Aucun angle mort clair — convergence forte entre les deux miroirs.'

  const topBadgesTxt = ctx.perceived.topBadges
    .slice(0, 5)
    .map((b) => `${b.emoji} ${b.name} (×${b.count})`)
    .join(', ')

  return {
    system: `Tu es l'IA de Kudos. Tu écris un "Manuel d'utilisation de soi-même" basé sur la divergence entre comment l'utilisateur se voit et comment ses proches le perçoivent.

TON : valorisant, clarifiant, jamais donneur de leçon. C'est un cadeau de lucidité.

RÈGLES STRICTES :
- Jamais de mot négatif. "directif" devient "tu prends naturellement les rênes". "froid" devient "tu protèges ton énergie".
- Adresser à la 2e personne (tu).
- Maximum 250 mots au total.
- Toujours en français.

Tu réponds UNIQUEMENT en JSON, format exact :
{
  "blockSansLeSavoir": "...",
  "troisSituations": ["...", "...", "..."]
}

- blockSansLeSavoir : 1 paragraphe (60-100 mots) décrivant l'angle mort avec bienveillance. Utilise **gras** pour les mots forts.
- troisSituations : 3 phrases courtes (15-25 mots chacune), 3 contextes concrets où l'utilisateur est déjà légitime/efficace sans le savoir.`,
    user: `Utilisateur : ${ctx.userName}

Angle mort détecté : ${blindspotDescription}

Badges les plus reçus : ${topBadgesTxt || '(aucun)'}

Génère "Le Manuel d'utilisation de ${ctx.userName}" maintenant.`,
  }
}

// ─────────────────────────────────────────────────────────────
// Livrable 2 — Avatar Hybride
// ─────────────────────────────────────────────────────────────
export function buildAvatarHybridePrompt(ctx: LivrableContext): { system: string; user: string } {
  const topBadges = ctx.perceived.topBadges.slice(0, 3).map((b) => b.name).join(', ')
  const innerTraits = ctx.inner.topTraits.slice(0, 3).map((t) => t.label).join(', ')
  const tension = ctx.delta.tension

  return {
    system: `Tu es l'IA de Kudos. Tu crées une "carte de collection" virale qui fusionne le miroir extérieur et intérieur d'un utilisateur en un titre stylé.

CONTRAINTES NON-NÉGOCIABLES :
- Le titre EST TOUJOURS VALORISANT. Aucun mot négatif n'est autorisé.
- INTERDIT : tyran, hypocrite, faux, manipulateur, toxique, lâche, égoïste, arrogant, méchant, cruel, mauvais, agressif, narcissique, pervers, et tout dérivé.
- Le paradoxe est CÉLÉBRÉ, jamais reproché.
- Cette carte sera partagée en story Instagram/TikTok : elle doit rendre l'utilisateur fier.

EXEMPLES DE BONS TITRES : "Le Stratège Solaire", "La Force Tranquille", "L'Architecte du Lien", "Le Visionnaire Discret", "Le Pilier Lumineux".

Tu réponds UNIQUEMENT en JSON, format exact :
{
  "rarity": "Commun" | "Rare" | "Épique" | "Légendaire",
  "emoji": "...",
  "title": "...",
  "stats": [
    { "label": "...", "value": 0-100 },
    { "label": "...", "value": 0-100 }
  ],
  "tagline": "..."
}

- rarity : choisis selon la force du paradoxe (converge = Rare/Épique, diverge = Légendaire).
- emoji : 1 seul emoji représentant l'archétype hybride.
- title : 2 à 4 mots, format "Le/La [Noun] [Adjectif]". MAXIMUM 30 caractères.
- stats : 2 stats positives, label court (2-3 mots, ex "Charisme involontaire"), value entre 70 et 99.
- tagline : 1 phrase d'accroche partageable (60-100 caractères), peut être au "tu".`,
    user: `Utilisateur : ${ctx.userName}

Comment les autres voient ${ctx.userName} : ${topBadges || '(peu de signal)'}
Ce que ${ctx.userName} valorise : ${innerTraits || '(peu de signal)'}
Tension du portrait : ${tension}

Génère l'Avatar Hybride maintenant.`,
  }
}

// ─────────────────────────────────────────────────────────────
// Livrable 3 — Défi de Lien
// ─────────────────────────────────────────────────────────────
export function buildDefiLienPrompt(ctx: LivrableContext): { system: string; user: string } {
  return {
    system: `Tu es l'IA de Kudos. Tu génères un "Défi de Lien" : une action bienveillante à entreprendre cette semaine vers UNE personne précise du réseau.

RÈGLES STRICTES :
- TOUJOURS orienté vers le lien, JAMAIS vers la rupture ou le choc.
- INTERDIT : "prends une décision radicale", "surprends tout le monde", "secoue ton entourage", "exprime ce qui t'agace", tout défi de séduction ou manipulation.
- Le défi consiste à DIRE une belle chose que l'utilisateur garde pour soi.
- Le défi est concret, faisable cette semaine, en 1 message ou 1 conversation.

EXEMPLES VALIDES :
- "Dis à Marc ce que tu vois en lui que tu ne lui as jamais dit."
- "Tu n'as jamais dit à Léa qu'elle est ton point de calme. Et si c'était le moment ?"
- "Écris à Karim 3 lignes qu'il ne s'attend pas à recevoir."

Tu réponds UNIQUEMENT en JSON, format exact :
{
  "targetName": "...",
  "missionText": "..."
}

- targetName : le prénom de la cible.
- missionText : 1 phrase de défi (20-40 mots) au "tu", chaleureuse, qui prépare l'utilisateur à agir.`,
    user: `Utilisateur : ${ctx.userName}
Cible suggérée : ${ctx.targetFriend?.name ?? 'à choisir parmi ses contacts'}
Signal positif sur cette personne : ${ctx.targetFriend?.positiveSignal ?? '(non précisé)'}

Génère le Défi de Lien maintenant.`,
  }
}
