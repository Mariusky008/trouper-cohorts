/**
 * 🎙️ LE TALKIE-WALKIE DU SALON, CÔTÉ SERVEUR (le lot S4 ; les règles : `vocal.ts` ; la section 4.6 du cahier des charges).
 *
 * LE CHEMIN D'UN VOCAL :
 *   1. `envoyerVocal` : au relâché, sa voix (une minute au plus), sa durée et ses niveaux partent ensemble ; le vocal est
 *      rangé comme ceux d'avant (`fils/<paire>/s/<id>.<ext>`, et sa fiche dans `fils/<paire>/m/`), avec `niveaux` ; une
 *      seule réplique, sans texte, pour l'instant ;
 *   2. `apresVocal` (après la réponse) : l'autre est prévenu (« 🎙️ Léa t'a parlé ! »), puis la voix est transcrite (les
 *      quarante transcriptions du jour de « comprendre ») — ses phrases deviennent les répliques de la fiche (un mot
 *      interdit : pas de texte, la voix reste) ; le pouls bat, et les deux téléphones relisent la transcription ;
 *   3. `vocalEcoute` : l'autre l'a écouté (dans le salon, la bulle, 💬, ou le talkie posé sur la table) — `ecoute` est
 *      noté dans la fiche, une fois ; chez celui qui l'a envoyé, son talkie quitte la table.
 *
 * Seulement entre deux proches qui se sont ajoutés tous les deux ; les cent messages du jour de l'écran d'avant.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { deposer, ecrireJson, lireJson, lireLigne, SEAU_FIGURINES, signer } from "./ma-figurine-serveur";
import { motInterdit } from "./mots-interdits";
import { decouperEnRepliques, type MessageFil, type Replique } from "./talkie";
import {
  PAROLES_ENVOYEES_PAR_JOUR,
  cheminSon,
  dossierMessages,
  hDeCle,
  nomMessage,
  nomsDuFil,
  noter,
  noterStatsMessages,
  pairDe,
  poserProfil,
  prevenirDeLaParole,
  qui8,
  seParlent,
  sonDe,
  transcrireDuJour,
  type FicheMessage,
} from "./talkie-serveur";
import { dureeVocal, niveauxValides } from "./vocal";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const idValide = (x: unknown) => (typeof x === "string" && /^[a-z0-9]{6,40}$/.test(x) ? x : null);

/** Ce qu'il faut après la réponse : prévenir l'autre, puis transcrire la voix (ses octets, déjà là). */
export type ApresVocal = { pour: string; prenom: string; url: string; cle: string; pair: string; fiche: string; duree: number; son: { type: string; ext: string; octets: Buffer } };

/** 🎙️ IL ENVOIE SON VOCAL (au relâché) : sa voix, sa durée, ses niveaux — rangés, posés dans leur fil. */
export async function envoyerVocal(supabase: Supabase, moi: Habitant, cle: unknown, son: unknown, duree: unknown, niveaux: unknown): Promise<Resultat<{ message?: MessageFil; apres?: ApresVocal }>> {
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const v = sonDe(son);
  const d = dureeVocal(duree);
  if (!v || d == null) return { error: "Ton vocal n’est pas parti : réenregistre-le (une minute au plus).", statut: 400 };
  const n8 = niveauxValides(niveaux, d) ?? "";
  const jour = jourParis();
  const compteur = `${moi.id}/paroles-jour.json`;
  const c = await lireJson<{ jour?: string; n?: number }>(supabase, compteur);
  const n = c.jour === jour ? Number(c.n) || 0 : 0;
  if (n >= PAROLES_ENVOYEES_PAR_JOUR) return { error: "Assez de messages pour aujourd’hui : reviens demain.", statut: 429 };
  const pair = pairDe(moi.id, h);
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  const ts = Date.now();
  const le = new Date(ts).toISOString();
  const chemin = cheminSon(pair, id, v.ext);
  const avant = await nomsDuFil(supabase, pair);
  if (!(await deposer(supabase, chemin, v.octets, v.type))) return { error: "Ton vocal n’est pas parti. Réessaie dans un instant.", statut: 502 };
  const repliques: Replique[] = [{ de: 0, a: d, texte: "", tete: null }];
  const fiche: FicheMessage = { id, de: moi.id, le, duree: d, son: chemin, type: v.type, repliques, ...(n8 ? { niveaux: n8 } : {}) };
  const nomFiche = `${dossierMessages(pair)}/${nomMessage(ts, moi.id, id)}`;
  if (!(await ecrireJson(supabase, nomFiche, fiche))) {
    await supabase.storage.from(SEAU_FIGURINES).remove([chemin]).catch(() => undefined);
    return { error: "Ton vocal n’est pas parti. Réessaie dans un instant.", statut: 502 };
  }
  await ecrireJson(supabase, compteur, { jour, n: n + 1 });
  // 📈 la mesure : un vocal de plus ; un message ; une réponse s'il répond au dernier de l'autre
  await noterStatsMessages(supabase, { vocaux: 1 });
  const dernier = avant[avant.length - 1];
  await noter(supabase, pair, moi.id, "cree");
  if (dernier && dernier.de8 !== qui8(moi.id)) await noter(supabase, pair, moi.id, "reponse");
  const [{ ligne }, maCle, url] = await Promise.all([lireLigne(supabase, moi.id), poserProfil(supabase, moi.id), signer(supabase, chemin, 3600)]);
  return {
    message: { id, moi: true, le, duree: d, son: url, repliques, ...(n8 ? { niveaux: n8 } : {}) },
    apres: { pour: h, prenom: s(ligne?.prenom), url: `/collection?parler=${maCle}#proches`, cle: maCle, pair, fiche: nomFiche, duree: d, son: v },
  };
}

/**
 * Après la réponse : « 🎙️ Léa t'a parlé ! », puis ce qu'il a dit, écrit (ses répliques). Rend vrai si la fiche a changé
 * (le pouls doit battre). Jamais bloquant.
 */
export async function apresVocal(supabase: Supabase, moi: Habitant, a: ApresVocal): Promise<boolean> {
  await prevenirDeLaParole(supabase, moi, { pour: a.pour, prenom: a.prenom, url: a.url, cle: a.cle }).catch(() => undefined);
  const segments = await transcrireDuJour(supabase, moi.id, a.son, a.duree).catch(() => null);
  if (!segments?.length) return false;
  const base = decouperEnRepliques(segments, a.duree);
  // (un mot interdit : pas de sous-titres ; sa voix reste, comme un appel entre proches)
  if (base.some((r) => r.texte && motInterdit(r.texte))) return false;
  const f = await lireJson<FicheMessage>(supabase, a.fiche);
  if (!f.id || !f.son) return false;
  return ecrireJson(supabase, a.fiche, { ...f, repliques: base.map((r) => ({ ...r, tete: null })) });
}

/** 👂 IL A ÉCOUTÉ LE VOCAL DE L'AUTRE : noté dans sa fiche (une fois). Rend vrai si c'est nouveau (le pouls bat). */
export async function vocalEcoute(supabase: Supabase, moi: Habitant, cle: unknown, id: unknown): Promise<Resultat<{ ok?: true; nouveau?: boolean }>> {
  const i = idValide(id);
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id || !i) return { error: "Ce vocal n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const pair = pairDe(moi.id, h);
  const n = (await nomsDuFil(supabase, pair)).find((x) => x.id === i);
  // (seulement un vocal de l'autre)
  if (!n || n.de8 === qui8(moi.id)) return { error: "Ce vocal n’existe pas.", statut: 404 };
  const chemin = `${dossierMessages(pair)}/${n.nom}`;
  const f = await lireJson<FicheMessage>(supabase, chemin);
  if (!f.id || !f.son || f.genre) return { error: "Ce vocal n’existe pas.", statut: 404 };
  if (f.ecoute) return { ok: true, nouveau: false };
  await ecrireJson(supabase, chemin, { ...f, ecoute: new Date().toISOString() });
  return { ok: true, nouveau: true };
}
