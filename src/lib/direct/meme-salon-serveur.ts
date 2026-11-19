/**
 * 🎭 LES MÈMES DU SALON, CÔTÉ SERVEUR (le lot S5 ; les règles : `meme-salon.ts`).
 *
 * Un mème joué dans le salon se range dans leur fil comme un message — `{ id, de, le, genre: "meme", texte, meme: { tete,
 * danse, pret? } }` dans `fils/<paire>/m/` — : il compte dans les non-lus, « Chez moi » le dit (« 🎭 « … » »), l'arrivée
 * le rejoue, 💬 le montre ; effacer son message (24 heures) l'efface ; signalé, l'équipe le voit. L'autre est prévenu après
 * la réponse (« 🎭 Léa t'a envoyé un mème »). Soixante par jour (`<habitant>/memes-salon-jour.json`).
 *
 * Seulement entre deux proches qui se sont ajoutés tous les deux. Ce que dit la figurine passe par les mots interdits.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { prevenirDUneParole } from "./appli-collection-serveur";
import { ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { motInterdit } from "./mots-interdits";
import type { MessageFil } from "./talkie";
import { dossierMessages, hDeCle, nomMessage, nomsDuFil, noter, pairDe, poserProfil, qui8, seParlent, vueDuMemeSalon, type FicheMessage } from "./talkie-serveur";
import { MEMES_SALON_PAR_JOUR, MEME_MAX, PHRASES_MEME, memeValide, notifMeme } from "./meme-salon";
import { PHRASES_ECRIT } from "./ecrit";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cheminCompteur = (h: string) => `${h}/memes-salon-jour.json`;

/** Ce qu'il faut pour prévenir l'autre, après la réponse. */
export type ApresMemeSalon = { pour: string; prenom: string; url: string; cle: string; texte: string };

/** 🎭 IL JOUE UN MÈME DANS LE SALON : rangé dans leur fil (ce qu'il dit, sa tête, sa danse). */
export async function envoyerMemeSalon(
  supabase: Supabase,
  moi: Habitant,
  cle: unknown,
  x: { texte?: unknown; tete?: unknown; danse?: unknown; pret?: unknown },
): Promise<Resultat<{ message?: MessageFil; apres?: ApresMemeSalon }>> {
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const m = memeValide(x);
  if (!m) return { error: typeof x.texte === "string" && [...x.texte.trim()].length > MEME_MAX ? PHRASES_MEME.long : PHRASES_MEME.vide, statut: 400 };
  if (motInterdit(m.texte)) return { error: PHRASES_ECRIT.motInterdit, statut: 422 };
  const jour = jourParis();
  const c = await lireJson<{ jour?: string; n?: number }>(supabase, cheminCompteur(moi.id));
  const n = c.jour === jour ? Number(c.n) || 0 : 0;
  if (n >= MEMES_SALON_PAR_JOUR) return { error: PHRASES_MEME.assez, statut: 429 };
  const pair = pairDe(moi.id, h);
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  const ts = Date.now();
  const fiche: FicheMessage = { id, de: moi.id, le: new Date(ts).toISOString(), genre: "meme", texte: m.texte, meme: { tete: m.tete, danse: m.danse, ...(m.pret ? { pret: m.pret } : {}) } };
  const avant = await nomsDuFil(supabase, pair);
  if (!(await ecrireJson(supabase, `${dossierMessages(pair)}/${nomMessage(ts, moi.id, id)}`, fiche))) return { error: PHRASES_MEME.pasParti, statut: 502 };
  await ecrireJson(supabase, cheminCompteur(moi.id), { jour, n: n + 1 });
  // 📈 la mesure du talkie : un message ; une réponse s'il répond au dernier de l'autre
  const dernier = avant[avant.length - 1];
  await noter(supabase, pair, moi.id, "cree");
  if (dernier && dernier.de8 !== qui8(moi.id)) await noter(supabase, pair, moi.id, "reponse");
  const [{ ligne }, maCle] = await Promise.all([lireLigne(supabase, moi.id), poserProfil(supabase, moi.id)]);
  const message = vueDuMemeSalon(fiche, moi.id);
  if (!message) return { error: PHRASES_MEME.pasParti, statut: 502 };
  return { message, apres: { pour: h, prenom: s(ligne?.prenom), url: `/collection?parler=${maCle}#proches`, cle: maCle, texte: m.texte } };
}

/** 🔔 Après la réponse : « 🎭 Léa t'a envoyé un mème » (et ce qu'il dit). Jamais bloquant. */
export async function apresMemeSalon(supabase: Supabase, moi: Habitant, a: ApresMemeSalon): Promise<void> {
  await prevenirDUneParole(supabase, a.pour, moi.id, a.prenom, { url: a.url, cle: a.cle, ecrit: notifMeme(a.prenom, a.texte) }).catch(() => undefined);
}
