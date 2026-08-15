// LES RÉACTIONS, ET POURQUOI CE NE SONT PAS DES LIKES.
//
// Un pouce levé ne dit rien : il mesure une approbation abstraite, sur une
// échelle qui n'a pas d'unité. Ces quatre-là disent une INTENTION, et c'est
// tout autre chose — pour l'habitant qui la manifeste comme pour le commerçant
// qui la lit.
//
//   😋 J'en veux      → l'envie, sans engagement. Le premier pas.
//   👀 Je passe voir  → une intention de venir. Elle a une valeur commerciale.
//   ❤️ Mon préféré    → un attachement au commerce, pas à l'annonce.
//   📍 J'y suis       → LA PREUVE DE VISITE, et le seul chiffre qui démontre à
//                       un commerçant que Clikme fait venir des gens chez lui.
//
// PAS DE TEXTE LIBRE, JAMAIS. Quatre réactions fixes : aucune modération, aucun
// risque de dérapage sur un commerce, et rien qu'une collectivité refuserait
// d'héberger. C'est la règle « ni commentaires ni likes publics », tenue par le
// schéma plutôt que par une consigne.

export const REACTIONS = ["jenveux", "jepassevoir", "prefere", "jysuis"] as const;
export type Reaction = (typeof REACTIONS)[number];

export function estReaction(v: unknown): v is Reaction {
  return typeof v === "string" && (REACTIONS as readonly string[]).includes(v);
}

/** Ce que chacune s'appelle et montre. À la PREMIÈRE PERSONNE : « j'en veux »
 *  engage celui qui appuie, « intéressant » ne dit rien de lui. */
export const REACTION_UI: Record<Reaction, { emoji: string; label: string }> = {
  jenveux: { emoji: "😋", label: "J'en veux" },
  jepassevoir: { emoji: "👀", label: "Je passe voir" },
  prefere: { emoji: "❤️", label: "Mon préféré" },
  jysuis: { emoji: "📍", label: "J'y suis" },
};

export type Compte = Partial<Record<Reaction, number>>;

/** Ce qu'une carte affiche : les totaux, et ce que J'AI déjà fait. */
export type VueReactions = { compte: Compte; miennes: Reaction[] };

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

const str = (v: unknown) => (v == null ? "" : String(v));

/**
 * Les réactions des annonces visibles, comptées et marquées.
 *
 * Une seule lecture pour tout le fil : une requête par carte multiplierait les
 * allers-retours par le nombre d'annonces, et le fil d'une ville active en
 * compte trente.
 *
 * Table absente (migration non appliquée) : des compteurs vides, pas une page
 * en erreur. Le fil sans réactions reste un fil ; une page blanche, non.
 */
export async function reactionsDesPublications(
  supabase: unknown,
  publicationIds: readonly string[],
  habitantId: string | null
): Promise<Map<string, VueReactions>> {
  const out = new Map<string, VueReactions>();
  if (!publicationIds.length) return out;
  const sb = supabase as Supabase;
  try {
    const { data, error } = await sb
      .from("clik_reaction")
      .select("publication_id, type, habitant_id")
      .in("publication_id", publicationIds as string[]);
    if (error || !Array.isArray(data)) return out;
    for (const r of data as Record<string, unknown>[]) {
      const pub = str(r.publication_id);
      const type = str(r.type);
      if (!pub || !estReaction(type)) continue;
      const v = out.get(pub) ?? { compte: {}, miennes: [] };
      v.compte[type] = (v.compte[type] ?? 0) + 1;
      if (habitantId && str(r.habitant_id) === habitantId && !v.miennes.includes(type)) v.miennes.push(type);
      out.set(pub, v);
    }
  } catch {
    /* table absente : on rend une carte sans compteurs */
  }
  return out;
}

/**
 * CE QUE LES RÉACTIONS DEVIENNENT, côté commerçant.
 *
 * C'est la réponse à « ça sert à quoi ? ». Un habitant appuie sur « 👀 je passe
 * voir » et il ne se passe rien à son écran — normal : le geste ne s'adresse
 * pas à lui, il s'adresse au commerce. Sans cet écran-là, les quatre boutons
 * n'étaient effectivement qu'une décoration.
 *
 * « 📍 J'y suis » est le chiffre qui compte : c'est la seule preuve de VENUE
 * RÉELLE du système, et le seul qu'aucune plateforme ne peut fournir à un
 * commerçant.
 *
 * Compte des PERSONNES, pas des appuis : quelqu'un qui a mis « j'en veux » sur
 * trois annonces du même commerce est une personne, pas trois.
 */
export async function resumeReactions(
  supabase: unknown,
  siteId: string
): Promise<Record<Reaction, number>> {
  const vide = { jenveux: 0, jepassevoir: 0, prefere: 0, jysuis: 0 } as Record<Reaction, number>;
  if (!siteId) return vide;
  try {
    const { data, error } = await (supabase as Supabase)
      .from("clik_reaction")
      .select("type, habitant_id")
      .eq("site_id", siteId);
    if (error || !Array.isArray(data)) return vide;
    const gens: Record<string, Set<string>> = {};
    for (const r of data as Record<string, unknown>[]) {
      const t = str(r.type);
      if (!estReaction(t)) continue;
      (gens[t] ??= new Set()).add(str(r.habitant_id));
    }
    for (const t of REACTIONS) vide[t] = gens[t]?.size ?? 0;
    return vide;
  } catch {
    return vide;
  }
}

/**
 * Le compteur affiché à côté d'une réaction.
 *
 * Rien en dessous de trois, et c'est délibéré. « 1 » sous une réaction dit à
 * l'habitant qu'il est seul, ce qui décourage exactement le geste qu'on
 * espère ; à partir de trois, le nombre devient une raison de suivre. Le zéro
 * ne s'écrit jamais.
 */
export const SEUIL_AFFICHAGE = 3;

export function compteAffiche(n: number | undefined): string {
  return typeof n === "number" && n >= SEUIL_AFFICHAGE ? String(n) : "";
}
