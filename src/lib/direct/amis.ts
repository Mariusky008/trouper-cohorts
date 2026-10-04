/**
 * 👥 LES AMIS D'UN HABITANT — ceux avec qui il partage une conversation.
 *
 * « Mes amis : publications des amis accessibles à l'utilisateur. » Il n'y a
 * pas encore de liste d'amis : la conversation d'Ensemble en tient lieu, comme
 * dans la maquette. Celui qui a ouvert une conversation et ceux qui y ont fait
 * un geste sont amis entre eux.
 *
 * FICHIER SERVEUR.
 */
type Supabase = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

const s = (v: unknown) => String(v ?? "").trim();

/** Ses amis : identifiant d'habitant → prénom (le plus récent). Vide si la table manque. */
export async function amisDe(supabase: Supabase, habitant: string): Promise<Map<string, string>> {
  const amis = new Map<string, string>();
  if (!habitant) return amis;
  try {
    const [{ data: creees }, { data: faites }] = await Promise.all([
      supabase.from("human_conversations").select("id").eq("createur", habitant).limit(200),
      supabase.from("human_conversation_gestes").select("conversation").eq("habitant", habitant).limit(2000),
    ]);
    const convs = [
      ...new Set([
        ...((creees ?? []) as Record<string, unknown>[]).map((r) => s(r.id)),
        ...((faites ?? []) as Record<string, unknown>[]).map((r) => s(r.conversation)),
      ]),
    ].filter(Boolean);
    if (!convs.length) return amis;
    const [{ data: createurs }, { data: auteurs }] = await Promise.all([
      supabase.from("human_conversations").select("createur, base").in("id", convs),
      supabase.from("human_conversation_gestes").select("habitant, qui, id").in("conversation", convs).order("id", { ascending: true }).limit(5000),
    ]);
    for (const c of (createurs ?? []) as Record<string, unknown>[]) {
      const h = s(c.createur);
      const base = (c.base ?? {}) as Record<string, unknown>;
      if (h && h !== habitant) amis.set(h, s(base.parQui) || "Un ami");
    }
    for (const g of (auteurs ?? []) as Record<string, unknown>[]) {
      const h = s(g.habitant);
      if (h && h !== habitant) amis.set(h, s(g.qui) || amis.get(h) || "Un ami");
    }
  } catch {
    /* conversations non migrées : pas d'amis */
  }
  return amis;
}
