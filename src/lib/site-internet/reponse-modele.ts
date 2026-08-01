// Lire la réponse d'un modèle Claude sans se tromper de bloc.
//
// LE PIÈGE, et il est silencieux : sur les modèles récents la réflexion est
// ACTIVE PAR DÉFAUT. `content[0]` n'est alors pas le texte de la réponse mais
// un bloc de réflexion, dont le champ `text` est vide. Le code lisait
// `content[0].text`, obtenait une chaîne vide, et basculait sur son repli — en
// concluant à tort que le modèle n'avait rien répondu.
//
// On cherche donc le bloc de texte, où qu'il soit.

type Bloc = { type?: unknown; text?: unknown };

/** Le texte de la réponse, tous blocs de réflexion ignorés. */
export function texteDuModele(data: unknown): string {
  const blocs = (data as { content?: unknown })?.content;
  if (!Array.isArray(blocs)) return "";
  return blocs
    .filter((b: Bloc) => b?.type === "text" && typeof b?.text === "string")
    .map((b: Bloc) => String(b.text).trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

/**
 * Le modèle a-t-il décliné la demande ? Ça arrive en HTTP 200, pas en erreur —
 * lu comme une réponse vide, ça ressemble à une panne.
 */
export function aRefuse(data: unknown): boolean {
  return (data as { stop_reason?: unknown })?.stop_reason === "refusal";
}

/**
 * La réponse a-t-elle été coupée faute de place ? `max_tokens` plafonne la
 * réflexion ET le texte : un budget calibré avant que la réflexion soit active
 * par défaut peut ne plus laisser de place pour la réponse elle-même.
 */
export function aEteCoupee(data: unknown): boolean {
  return (data as { stop_reason?: unknown })?.stop_reason === "max_tokens";
}
