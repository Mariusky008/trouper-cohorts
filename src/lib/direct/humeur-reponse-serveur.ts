/**
 * ☀️ MA FIGURINE ME RÉPOND, CÔTÉ SERVEUR — lot R3 (`humeur-reponse.ts` pour la règle et les phrases).
 *
 * RANGÉ DANS LE SEAU des figurines, à côté de son humeur du jour : `<habitant>/humeurs.json` = ses humeurs des 21
 * derniers jours (pour se souvenir de la veille, compter les jours difficiles, faire sa semaine en visages), les
 * phrases déjà dites (jamais deux fois avant d'avoir tout dit), et la dernière réponse (la même humeur redemandée le
 * même jour : la même phrase). Pas de table, pas de migration.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Sentiment } from "./ma-figurine";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { reponseHumeur, reponseValide, type HistoriqueHumeurs, type ReponseHumeur } from "./humeur-reponse";

type Supabase = ReturnType<typeof createAdminClient>;
export const cheminHumeurs = (h: string) => `${h}/humeurs.json`;

/** 🗣️ Il vient de choisir son humeur : la réponse de sa figurine (gardée, avec son historique). */
export async function repondreAHumeur(supabase: Supabase, h: string, humeur: Sentiment): Promise<ReponseHumeur> {
  const jour = jourParis();
  const hist = await lireJson<HistoriqueHumeurs>(supabase, cheminHumeurs(h));
  const r = reponseHumeur(humeur, jour, hist);
  // (pas gardée ? la réponse s'affiche quand même ; elle se recalculera la prochaine fois)
  if (r.hist !== hist) await ecrireJson(supabase, cheminHumeurs(h), r.hist);
  return r.reponse;
}

/** La réponse de sa figurine aujourd'hui (pour la relire : la feuille du matin, le haut de « Proches »), ou rien. */
export async function reponseDuJour(supabase: Supabase, h: string): Promise<ReponseHumeur | null> {
  const hist = await lireJson<HistoriqueHumeurs>(supabase, cheminHumeurs(h));
  return reponseValide(hist.dernier, jourParis());
}
