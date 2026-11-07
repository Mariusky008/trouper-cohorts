/**
 * 🔞 SON ÂGE, DEMANDÉ UNE FOIS (`lib/direct/ma-figurine.ts`, `AGE_MINIMUM`) — pour qui avait déjà sa figurine avant qu'on
 * le demande à la création : le serveur refuse de montrer un mème dans la ville (« Autour », « Découvrir ») tant qu'il
 * ne l'a pas déclaré (réponse 403 avec `age`). On le lui demande, on le note, et le geste repart.
 *
 * FICHIER NAVIGATEUR.
 */
import { QUESTION_AGE } from "@/lib/direct/ma-figurine";

/** `true` s'il a déclaré avoir l'âge (et que c'est noté). */
export async function demanderSonAge(): Promise<boolean> {
  if (!window.confirm(QUESTION_AGE)) return false;
  try {
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "majeur" }) });
    return r.ok;
  } catch {
    return false;
  }
}
