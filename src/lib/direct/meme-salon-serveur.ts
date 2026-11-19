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
 * 🎙️ « MA VOIX » : le mème peut être dit avec sa voix (20 secondes au plus ; ses niveaux, comme un vocal). Elle est
 * rangée comme celle d'un vocal (`fils/<paire>/s/<id>.<ext>`) ; le texte est alors facultatif : s'il manque, après la
 * réponse, sa voix est transcrite (les quarante du jour de « comprendre ») et devient ce que dit la figurine (120 signes ;
 * un mot interdit : pas de texte, la voix reste) ; le pouls bat, les deux relisent.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { prevenirDUneParole } from "./appli-collection-serveur";
import { deposer, ecrireJson, lireJson, lireLigne, SEAU_FIGURINES, signer } from "./ma-figurine-serveur";
import { motInterdit } from "./mots-interdits";
import type { MessageFil } from "./talkie";
import { cheminSon, dossierMessages, hDeCle, nomMessage, nomsDuFil, noter, pairDe, poserProfil, qui8, seParlent, sonDe, transcrireDuJour, vueDuMemeSalon, type FicheMessage } from "./talkie-serveur";
import { MEMES_SALON_PAR_JOUR, MEME_MAX, MEME_VOIX_MAX, PHRASES_MEME, memeValide, notifMeme, texteTranscrit } from "./meme-salon";
import { PHRASES_ECRIT } from "./ecrit";
import { dureeVocal, niveauxValides } from "./vocal";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cheminCompteur = (h: string) => `${h}/memes-salon-jour.json`;

/**
 * Ce qu'il faut après la réponse : prévenir l'autre ; 🎙️ dit avec sa voix sans texte, la transcrire (sa fiche, ses
 * octets, déjà là).
 */
export type ApresMemeSalon = {
  pour: string;
  prenom: string;
  url: string;
  cle: string;
  texte: string;
  voix?: { fiche: string; duree: number; son: { type: string; ext: string; octets: Buffer } };
};

/** 🎭 IL JOUE UN MÈME DANS LE SALON : rangé dans leur fil (ce qu'il dit, sa tête, sa danse ; 🎙️ sa voix, s'il l'a dit). */
export async function envoyerMemeSalon(
  supabase: Supabase,
  moi: Habitant,
  cle: unknown,
  x: { texte?: unknown; tete?: unknown; danse?: unknown; pret?: unknown; son?: unknown; duree?: unknown; niveaux?: unknown },
): Promise<Resultat<{ message?: MessageFil; apres?: ApresMemeSalon }>> {
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  // 🎙️ sa voix (20 secondes au plus), si elle est là
  const avecVoix = x.son != null && x.son !== "";
  const v = avecVoix ? sonDe(x.son) : null;
  const d = avecVoix ? dureeVocal(x.duree) : null;
  if (avecVoix && (!v || d == null || d > MEME_VOIX_MAX + 0.5)) return { error: PHRASES_MEME.voixPasPartie, statut: 400 };
  const m = memeValide(x, avecVoix);
  if (!m) return { error: typeof x.texte === "string" && [...x.texte.trim()].length > MEME_MAX ? PHRASES_MEME.long : PHRASES_MEME.vide, statut: 400 };
  if (m.texte && motInterdit(m.texte)) return { error: PHRASES_ECRIT.motInterdit, statut: 422 };
  const jour = jourParis();
  const c = await lireJson<{ jour?: string; n?: number }>(supabase, cheminCompteur(moi.id));
  const n = c.jour === jour ? Number(c.n) || 0 : 0;
  if (n >= MEMES_SALON_PAR_JOUR) return { error: PHRASES_MEME.assez, statut: 429 };
  const pair = pairDe(moi.id, h);
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  const ts = Date.now();
  const chemin = v ? cheminSon(pair, id, v.ext) : "";
  const n8 = v && d != null ? (niveauxValides(x.niveaux, d) ?? "") : "";
  if (v && !(await deposer(supabase, chemin, v.octets, v.type))) return { error: PHRASES_MEME.pasParti, statut: 502 };
  const fiche: FicheMessage = {
    id,
    de: moi.id,
    le: new Date(ts).toISOString(),
    genre: "meme",
    texte: m.texte,
    meme: { tete: m.tete, danse: m.danse, ...(m.pret ? { pret: m.pret } : {}), ...(v ? { voix: true } : {}) },
    ...(v && d != null ? { son: chemin, type: v.type, duree: d, ...(n8 ? { niveaux: n8 } : {}) } : {}),
  };
  const avant = await nomsDuFil(supabase, pair);
  const nomFiche = `${dossierMessages(pair)}/${nomMessage(ts, moi.id, id)}`;
  if (!(await ecrireJson(supabase, nomFiche, fiche))) {
    if (chemin) await supabase.storage.from(SEAU_FIGURINES).remove([chemin]).catch(() => undefined);
    return { error: PHRASES_MEME.pasParti, statut: 502 };
  }
  await ecrireJson(supabase, cheminCompteur(moi.id), { jour, n: n + 1 });
  // 📈 la mesure du talkie : un message ; une réponse s'il répond au dernier de l'autre
  const dernier = avant[avant.length - 1];
  await noter(supabase, pair, moi.id, "cree");
  if (dernier && dernier.de8 !== qui8(moi.id)) await noter(supabase, pair, moi.id, "reponse");
  const [{ ligne }, maCle, url] = await Promise.all([lireLigne(supabase, moi.id), poserProfil(supabase, moi.id), chemin ? signer(supabase, chemin, 3600) : Promise.resolve("")]);
  const message = vueDuMemeSalon(fiche, moi.id, false, url);
  if (!message) return { error: PHRASES_MEME.pasParti, statut: 502 };
  return {
    message,
    apres: {
      pour: h,
      prenom: s(ligne?.prenom),
      url: `/collection?parler=${maCle}#proches`,
      cle: maCle,
      texte: m.texte,
      ...(v && d != null && !m.texte ? { voix: { fiche: nomFiche, duree: d, son: v } } : {}),
    },
  };
}

/**
 * 🔔 Après la réponse : « 🎭 Léa t'a envoyé un mème » (et ce qu'il dit) ; 🎙️ dit avec sa voix, sans texte : sa voix
 * transcrite devient ce que dit la figurine. Rend vrai si la fiche a changé (le pouls doit battre). Jamais bloquant.
 */
export async function apresMemeSalon(supabase: Supabase, moi: Habitant, a: ApresMemeSalon): Promise<boolean> {
  await prevenirDUneParole(supabase, a.pour, moi.id, a.prenom, { url: a.url, cle: a.cle, ecrit: notifMeme(a.prenom, a.texte, Boolean(a.voix)) }).catch(() => undefined);
  if (!a.voix) return false;
  const segments = await transcrireDuJour(supabase, moi.id, a.voix.son, a.voix.duree).catch(() => null);
  const texte = texteTranscrit((segments ?? []).map((x) => x.text).join(" "));
  // (un mot interdit : pas de texte ; sa voix reste)
  if (!texte || motInterdit(texte)) return false;
  const f = await lireJson<FicheMessage>(supabase, a.voix.fiche);
  if (!f.id || f.genre !== "meme" || s(f.texte)) return false;
  return ecrireJson(supabase, a.voix.fiche, { ...f, texte });
}
