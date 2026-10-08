/**
 * 📥 UNE QUESTION SANS RÉPONSE, RANGÉE CHEZ UN VRAI COMMERÇANT.
 *
 * « 3 clients ont demandé : vous faites des retouches ? » — c'est ce que son
 * comptoir lui montre, et c'est d'ici que ça vient : quand son fantôme dit
 * « je transmets », la question entre dans la file `attente` de sa colonne
 * `assistant_kb` (voir `savoir-fantome.ts`). La même question posée deux fois
 * compte double au lieu de prendre deux places.
 *
 * LA COLONNE ENTIÈRE EST RELUE PUIS RÉÉCRITE, sans toucher aux clés qu'on ne
 * connaît pas. Deux questions arrivées à la même seconde peuvent se marcher
 * dessus : on en perd une, jamais ce qu'il a écrit lui-même.
 *
 * FICHIER SERVEUR.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { ajouterEnAttente, nettoyerSavoir } from "@/lib/direct/savoir-fantome";

export async function noterQuestionSansReponse(siteId: string, question: string): Promise<void> {
  if (!siteId || !question.trim()) return;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("human_vitrine_sites").select("assistant_kb").eq("id", siteId).maybeSingle();
    const brut = (data as Record<string, unknown> | null)?.assistant_kb;
    const kb = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
    const s = nettoyerSavoir(kb);
    const attente = ajouterEnAttente(s.attente, question, new Date().toISOString(), s.faq);
    if (attente === s.attente) return;
    await supabase.from("human_vitrine_sites").update({ assistant_kb: { ...kb, attente } }).eq("id", siteId);
  } catch (e) {
    console.info("[double] question non rangée", e instanceof Error ? e.message : String(e));
  }
}
