/**
 * 📷 DÉPOSER UNE PHOTO ET L'ENVOYER (lots M2 et S6) — les mêmes routes que l'écran d'aujourd'hui : l'adresse de dépôt
 * (`photo-depot`), le dépôt tout droit au seau, puis l'envoi (`photo`) que le serveur vérifie (réencodée, modérée). Pour
 * le ＋ du salon (`envoyer.tsx`) et la photo à deux (`photo-a-deux.ts`).
 *
 * MODULE DU NAVIGATEUR : à n'importer que dans un composant client.
 */
import { createClient } from "@/lib/supabase/client";
import type { MessageFil } from "@/lib/direct/talkie";

type Reponse<T> = T & { error?: string };
export async function demander<T>(corps: Record<string, unknown>): Promise<{ statut: number; j: Reponse<T> }> {
  const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  return { statut: r.status, j: (await r.json().catch(() => ({}))) as Reponse<T> };
}

/** Déposer la photo : son identifiant, ou l'erreur. */
export async function deposerPhoto(cle: string, blob: Blob): Promise<{ id?: string; error?: string }> {
  const d = await demander<{ seau: string; chemin: string; jeton: string; id: string }>({ action: "photo-depot", cle });
  if (!d.j.jeton) return { error: d.j.error || "Ta photo n’a pas pu partir. Réessaie." };
  const { error } = await createClient().storage.from(d.j.seau).uploadToSignedUrl(d.j.chemin, d.j.jeton, blob, { contentType: blob.type });
  if (error) return { error: "Ta photo n’a pas pu partir. Réessaie." };
  return { id: d.j.id };
}

/** Envoyer la photo déposée (sa légende) : le message, ou l'erreur et son statut (503 : la modération ne répond pas). */
export async function envoyerPhotoDeposee(cle: string, id: string, legende: string): Promise<{ message?: MessageFil; error?: string; statut: number }> {
  const r = await demander<{ message: MessageFil }>({ action: "photo", cle, id, legende });
  return r.j.message ? { message: r.j.message, statut: r.statut } : { error: r.j.error || "Ça n’a pas marché. Réessaie.", statut: r.statut };
}

/** Les deux à la suite. */
export async function envoyerUnePhoto(cle: string, blob: Blob, legende: string): Promise<{ message?: MessageFil; error?: string }> {
  const d = await deposerPhoto(cle, blob);
  if (!d.id) return { error: d.error };
  const e = await envoyerPhotoDeposee(cle, d.id, legende);
  return e.message ? { message: e.message } : { error: e.error };
}
