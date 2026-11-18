/**
 * 📎 LES PDF DANS LA CONVERSATION, CÔTÉ SERVEUR (le salon du duo, lot S6 ; les règles : `fichier.ts`).
 *
 * LE CHEMIN D'UN PDF (comme une photo, sans la modération — décidé par le propriétaire le 18 novembre 2026) :
 *   1. `depotFichier` : une adresse signée pour SON PDF, `fils/<paire>/f/<qui>-<id>-brut` — il part tout droit du
 *      téléphone au seau privé (un seul dépôt) ;
 *   2. `envoyerFichier` : le serveur le relit — 10 Mo au plus, et ce doit être un PDF (`%PDF-` au début : un autre fichier
 *      renommé ne passe pas) —, le range (`fils/<paire>/f/<id>.pdf`, `application/pdf`), et pose le message dans leur fil
 *      (`genre: "fichier"`, son nom nettoyé, sa taille) ; l'autre est prévenu après la réponse (« 📎 Léa t'a envoyé un
 *      PDF »). Son adresse signée le TÉLÉCHARGE sous son nom (`talkie-serveur.ts`, `vueDuFichier`).
 *   · `<habitant>/fichiers-jour.json` = { jour, n } : ses PDF du jour (vingt au plus).
 *
 * Seulement entre deux proches qui se sont ajoutés tous les deux. Le nom du fichier passe par les mots interdits (il se
 * lit dans la bulle et la notification). Effacer son message (24 heures) efface son PDF (`effacerMessage`).
 *
 * LE FREIN : `CLIKME_FICHIERS=0` chez l'hébergeur — plus de PDF ; ceux qui sont partis restent téléchargeables.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { prevenirDUneParole } from "./appli-collection-serveur";
import { SEAU_FIGURINES, deposer, ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { motInterdit } from "./mots-interdits";
import type { MessageFil } from "./talkie";
import { dossierMessages, hDeCle, nomMessage, nomsDuFil, noter, pairDe, poserProfil, qui8, seParlent, vueDuFichier, type FicheMessage } from "./talkie-serveur";
import { PHRASES_ECRIT } from "./ecrit";
import { FICHIER, PHRASES_FICHIER, estUnPdf, nomDuFichier, notifFichier } from "./fichier";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** 🛑 Le frein : `CLIKME_FICHIERS=0` (plus de PDF ; ceux qui sont partis restent). */
export const fichiersOuverts = () => s(process.env.CLIKME_FICHIERS) !== "0";

const cheminFichier = (pair: string, id: string) => `fils/${pair}/f/${id}.pdf`;
/** (le PDF tel qu'il arrive du téléphone, le temps de le relire : à lui seul, `qui`) */
const cheminBrut = (pair: string, moi: string, id: string) => `fils/${pair}/f/${qui8(moi)}-${id}-brut`;
const cheminCompteur = (h: string) => `${h}/fichiers-jour.json`;
const idValide = (x: unknown) => (typeof x === "string" && /^[a-z0-9]{12}$/.test(x) ? x : null);

/** Le proche (par sa clé), s'ils se parlent, et ses PDF du jour. */
async function avecQui(supabase: Supabase, moi: Habitant, cle: unknown): Promise<Resultat<{ h?: string; pair?: string; jour?: string; n?: number }>> {
  if (!fichiersOuverts()) return { error: PHRASES_FICHIER.ferme, statut: 404 };
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const jour = jourParis();
  const c = await lireJson<{ jour?: string; n?: number }>(supabase, cheminCompteur(moi.id));
  const n = c.jour === jour ? Number(c.n) || 0 : 0;
  if (n >= FICHIER.parJour) return { error: PHRASES_FICHIER.assez, statut: 429 };
  return { h, pair: pairDe(moi.id, h), jour, n };
}

/** 📤 OÙ DÉPOSER SON PDF : une adresse signée, pour lui seul (un seul dépôt), et son identifiant. */
export async function depotFichier(supabase: Supabase, moi: Habitant, cle: unknown): Promise<Resultat<{ seau?: string; chemin?: string; jeton?: string; id?: string }>> {
  const q = await avecQui(supabase, moi, cle);
  if (q.error || !q.pair) return { error: q.error, statut: q.statut };
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  const chemin = cheminBrut(q.pair, moi.id, id);
  const { data, error } = await supabase.storage.from(SEAU_FIGURINES).createSignedUploadUrl(chemin);
  if (error || !data?.token) return { error: "Ton PDF n’a pas pu partir. Réessaie.", statut: 502 };
  return { seau: SEAU_FIGURINES, chemin: data.path ?? chemin, jeton: data.token, id };
}

/** Ce qu'il faut pour prévenir l'autre, après la réponse. */
export type ApresFichier = { pour: string; prenom: string; url: string; cle: string; nom: string };

/** 📎 IL ENVOIE SON PDF (déposé) : relu (un PDF, 10 Mo au plus), rangé, posé dans leur fil. */
export async function envoyerFichier(supabase: Supabase, moi: Habitant, cle: unknown, id: unknown, nom: unknown): Promise<Resultat<{ message?: MessageFil; apres?: ApresFichier }>> {
  const i = idValide(id);
  if (!i) return { error: PHRASES_FICHIER.absent, statut: 400 };
  const leNom = nomDuFichier(nom);
  if (motInterdit(leNom.replace(/\.pdf$/i, ""))) return { error: PHRASES_ECRIT.motInterdit, statut: 422 };
  const q = await avecQui(supabase, moi, cle);
  if (q.error || !q.h || !q.pair || !q.jour) return { error: q.error, statut: q.statut };
  const { h, pair, jour } = q;
  const n = q.n ?? 0;
  const brut = cheminBrut(pair, moi.id, i);
  const effacerBrut = () => supabase.storage.from(SEAU_FIGURINES).remove([brut]).catch(() => undefined);

  // 1. relu : il est arrivé, pas trop lourd, et c'est bien un PDF
  const { data: blob, error: absent } = await supabase.storage.from(SEAU_FIGURINES).download(brut);
  if (absent || !blob) return { error: PHRASES_FICHIER.absent, statut: 400 };
  const octets = Buffer.from(await blob.arrayBuffer());
  if (!octets.length) return { error: PHRASES_FICHIER.absent, statut: 400 };
  if (octets.length > FICHIER.max) {
    await effacerBrut();
    return { error: PHRASES_FICHIER.lourd, statut: 413 };
  }
  if (!estUnPdf(octets.subarray(0, 1024))) {
    await effacerBrut();
    return { error: PHRASES_FICHIER.pasUnPdf, statut: 422 };
  }
  // 2. rangé, et posé dans leur fil
  const chemin = cheminFichier(pair, i);
  if (!(await deposer(supabase, chemin, octets, FICHIER.type))) return { error: "Ton PDF n’est pas parti. Réessaie dans un instant.", statut: 502 };
  await effacerBrut();
  const ts = Date.now();
  const fiche: FicheMessage = { id: i, de: moi.id, le: new Date(ts).toISOString(), genre: "fichier", media: { chemin, l: 0, h: 0, type: FICHIER.type, nom: leNom, taille: octets.length }, tete: null };
  const avant = await nomsDuFil(supabase, pair);
  if (!(await ecrireJson(supabase, `${dossierMessages(pair)}/${nomMessage(ts, moi.id, i)}`, fiche))) {
    await supabase.storage.from(SEAU_FIGURINES).remove([chemin]).catch(() => undefined);
    return { error: "Ton PDF n’est pas parti. Réessaie dans un instant.", statut: 502 };
  }
  await ecrireJson(supabase, cheminCompteur(moi.id), { jour, n: n + 1 });
  // 📈 la mesure du talkie (un message ; une réponse s'il répond au dernier de l'autre)
  const dernier = avant[avant.length - 1];
  await noter(supabase, pair, moi.id, "cree");
  if (dernier && dernier.de8 !== qui8(moi.id)) await noter(supabase, pair, moi.id, "reponse");
  const [{ ligne }, maCle, message] = await Promise.all([lireLigne(supabase, moi.id), poserProfil(supabase, moi.id), vueDuFichier(supabase, fiche, moi.id)]);
  if (!message) return { error: "Ton PDF n’est pas parti. Réessaie dans un instant.", statut: 502 };
  return { message, apres: { pour: h, prenom: s(ligne?.prenom), url: `/collection?parler=${maCle}#proches`, cle: maCle, nom: leNom } };
}

/** 🔔 Après la réponse : « 📎 Léa t'a envoyé un PDF » (et son nom). Jamais bloquant. */
export async function apresFichier(supabase: Supabase, moi: Habitant, a: ApresFichier): Promise<void> {
  await prevenirDUneParole(supabase, a.pour, moi.id, a.prenom, { url: a.url, cle: a.cle, ecrit: notifFichier(a.prenom, a.nom) }).catch(() => undefined);
}
