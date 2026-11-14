/**
 * 📷 ÉCRIRE, PARTAGER — LES PHOTOS, CÔTÉ SERVEUR (lot M2 ; les règles : `photo.ts` ; le cahier :
 * `docs/univers/messages-ecrits.md`, section 5).
 *
 * LE CHEMIN D'UNE PHOTO :
 *   1. `depotPhoto` : une adresse signée pour SA photo, `fils/<paire>/p/<qui>-<id>-brut` — elle part tout droit du
 *      téléphone au seau privé (trop lourde pour passer par ici), déjà réduite et sans ses métadonnées ;
 *   2. `envoyerPhoto` : le serveur la relit (5 Mo au plus), la RÉENCODE (1 600 pixels au plus, WebP : rien ne survit
 *      de l'original, ni la position GPS, ni l'appareil), puis la fait CONTRÔLER par le service de modération
 *      d'OpenAI. Refusée : effacée, elle ne part pas (« Cette photo ne peut pas partir. »). Sans service joignable : elle
 *      ne part pas non plus (on n'envoie jamais une photo qu'on n'a pas pu contrôler) ; gardée, il peut réessayer.
 *      Acceptée : rangée (`fils/<paire>/p/<id>.webp`), le message posé dans le même dossier que les vocaux et les
 *      écrits (`genre: "photo"`), l'autre prévenu après la réponse (« 📷 Léa t'a envoyé une photo »).
 *   · `<habitant>/photos-jour.json` = { jour, n } : ses photos du jour (trente au plus).
 *
 * LA MODÉRATION : `OPENAI_MODERATION_API_KEY` (et `_BASE_URL`, `_MODEL`), sinon la clé du talkie
 * (`OPENAI_TALKIE_API_KEY`, `_BASE_URL`), sinon `OPENAI_API_KEY`. Le service est gratuit. Le faux service des essais
 * (`scripts/faux-supabase.mjs`) : une image de 321 pixels de large est refusée ; de 322, il ne répond pas.
 *
 * LE FREIN : `CLIKME_PHOTOS=0` chez l'hébergeur — plus de photo ; celles qui sont parties restent visibles, et chacun
 * peut effacer la sienne (dans les 24 heures, `effacerMessage`).
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { prevenirDUneParole } from "./appli-collection-serveur";
import { sentimentValide, type Sentiment } from "./ma-figurine";
import { SEAU_FIGURINES, deposer, ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { motInterdit } from "./mots-interdits";
import { TETES_DE_DEPART, proposerParRegles, type MessageFil } from "./talkie";
import { dossierMessages, hDeCle, nomMessage, nomsDuFil, noter, noterStatsMessages, pairDe, poserProfil, qui8, seParlent, sesTetesJouables, vueDeLaPhoto, type FicheMessage } from "./talkie-serveur";
import { PHRASES_ECRIT } from "./ecrit";
import { PHOTO, PHRASES_PHOTO, legendePhoto, notifPhoto } from "./photo";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** 🛑 Le frein : `CLIKME_PHOTOS=0` (plus de photo ; celles qui sont parties restent visibles). */
export const photosOuvertes = () => s(process.env.CLIKME_PHOTOS) !== "0";

const cheminPhoto = (pair: string, id: string) => `fils/${pair}/p/${id}.webp`;
/** (la photo telle qu'elle arrive du téléphone, le temps du contrôle : à lui seul, `qui`) */
const cheminBrut = (pair: string, moi: string, id: string) => `fils/${pair}/p/${qui8(moi)}-${id}-brut`;
const cheminCompteur = (h: string) => `${h}/photos-jour.json`;
const idValide = (x: unknown) => (typeof x === "string" && /^[a-z0-9]{12}$/.test(x) ? x : null);

/** Le proche (par sa clé), s'ils se parlent, et ses photos du jour. */
async function avecQui(supabase: Supabase, moi: Habitant, cle: unknown): Promise<Resultat<{ h?: string; pair?: string; jour?: string; n?: number }>> {
  if (!photosOuvertes()) return { error: PHRASES_PHOTO.ferme, statut: 404 };
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const jour = jourParis();
  const c = await lireJson<{ jour?: string; n?: number }>(supabase, cheminCompteur(moi.id));
  const n = c.jour === jour ? Number(c.n) || 0 : 0;
  if (n >= PHOTO.parJour) return { error: PHRASES_PHOTO.assez, statut: 429 };
  return { h, pair: pairDe(moi.id, h), jour, n };
}

/** 📤 OÙ DÉPOSER SA PHOTO : une adresse signée, pour elle seule (un seul dépôt), et son identifiant. */
export async function depotPhoto(supabase: Supabase, moi: Habitant, cle: unknown): Promise<Resultat<{ seau?: string; chemin?: string; jeton?: string; id?: string }>> {
  const q = await avecQui(supabase, moi, cle);
  if (q.error || !q.pair) return { error: q.error, statut: q.statut };
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  const chemin = cheminBrut(q.pair, moi.id, id);
  const { data, error } = await supabase.storage.from(SEAU_FIGURINES).createSignedUploadUrl(chemin);
  if (error || !data?.token) return { error: "Ta photo n’a pas pu partir. Réessaie.", statut: 502 };
  return { seau: SEAU_FIGURINES, chemin: data.path ?? chemin, jeton: data.token, id };
}

/** Ce qu'il faut pour prévenir l'autre, après la réponse. */
export type ApresPhoto = { pour: string; prenom: string; url: string; cle: string; legende: string };

/**
 * 📷 IL ENVOIE SA PHOTO (déposée) : relue, réencodée, contrôlée, puis rangée et posée dans leur fil. `tete` : celle
 * qu'il a choisie parmi les siennes, sinon les règles des vocaux sur la légende (sans légende : la joie).
 */
export async function envoyerPhoto(supabase: Supabase, moi: Habitant, cle: unknown, id: unknown, legende: unknown, tete: unknown): Promise<Resultat<{ message?: MessageFil; apres?: ApresPhoto }>> {
  const i = idValide(id);
  if (!i) return { error: PHRASES_PHOTO.absente, statut: 400 };
  const leg = legendePhoto(legende);
  if (leg === null) return { error: PHRASES_PHOTO.legende, statut: 400 };
  if (leg && motInterdit(leg)) return { error: PHRASES_ECRIT.motInterdit, statut: 422 };
  const q = await avecQui(supabase, moi, cle);
  if (q.error || !q.h || !q.pair || !q.jour) return { error: q.error, statut: q.statut };
  const { h, pair, jour } = q;
  const n = q.n ?? 0;
  const brut = cheminBrut(pair, moi.id, i);
  const effacerBrut = () => supabase.storage.from(SEAU_FIGURINES).remove([brut]).catch(() => undefined);

  // 1. relue : elle est arrivée, pas trop lourde
  const { data: blob, error: absente } = await supabase.storage.from(SEAU_FIGURINES).download(brut);
  if (absente || !blob) return { error: PHRASES_PHOTO.absente, statut: 400 };
  const octets = Buffer.from(await blob.arrayBuffer());
  if (!octets.length) return { error: PHRASES_PHOTO.absente, statut: 400 };
  if (octets.length > PHOTO.max) {
    await effacerBrut();
    return { error: PHRASES_PHOTO.lourde, statut: 413 };
  }
  // 2. réencodée : tournée comme elle a été prise, 1 600 pixels au plus, WebP — aucune métadonnée ne survit
  let photo: { data: Buffer; info: sharp.OutputInfo };
  try {
    photo = await sharp(octets, { limitInputPixels: PHOTO.pixels, failOn: "error" })
      .rotate()
      .resize({ width: PHOTO.cote, height: PHOTO.cote, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    await effacerBrut();
    return { error: PHRASES_PHOTO.illisible, statut: 400 };
  }
  // 3. contrôlée : refusée, elle ne part pas ; sans service, elle attend (il peut réessayer)
  const verdict = await modererPhoto(photo.data, leg);
  if (verdict === "refus") {
    await effacerBrut();
    await noterStatsMessages(supabase, { photosRefusees: 1 });
    return { error: PHRASES_PHOTO.refusee, statut: 422 };
  }
  if (verdict === "panne") {
    await noterStatsMessages(supabase, { photosNonVerifiees: 1 });
    return { error: PHRASES_PHOTO.injoignable, statut: 503 };
  }
  // 4. rangée, et posée dans leur fil
  const chemin = cheminPhoto(pair, i);
  if (!(await deposer(supabase, chemin, photo.data, "image/webp"))) return { error: "Ta photo n’est pas partie. Réessaie dans un instant.", statut: 502 };
  await effacerBrut();
  const dispo = (await sesTetesJouables(supabase, moi.id)) ?? [...TETES_DE_DEPART];
  const voulue = sentimentValide(tete);
  const laTete: Sentiment | null = voulue && dispo.includes(voulue) ? voulue : (proposerParRegles(leg, dispo)[0] ?? null);
  const ts = Date.now();
  const fiche: FicheMessage = { id: i, de: moi.id, le: new Date(ts).toISOString(), genre: "photo", media: { chemin, l: photo.info.width, h: photo.info.height }, ...(leg ? { legende: leg } : {}), tete: laTete };
  const avant = await nomsDuFil(supabase, pair);
  const nom = nomMessage(ts, moi.id, i);
  if (!(await ecrireJson(supabase, `${dossierMessages(pair)}/${nom}`, fiche))) {
    await supabase.storage.from(SEAU_FIGURINES).remove([chemin]).catch(() => undefined);
    return { error: "Ta photo n’est pas partie. Réessaie dans un instant.", statut: 502 };
  }
  await ecrireJson(supabase, cheminCompteur(moi.id), { jour, n: n + 1 });
  // 📈 la mesure du talkie (un message ; une réponse s'il répond au dernier de l'autre), et celle des messages
  const dernier = avant[avant.length - 1];
  await noter(supabase, pair, moi.id, "cree");
  if (dernier && dernier.de8 !== qui8(moi.id)) await noter(supabase, pair, moi.id, "reponse");
  await noterStatsMessages(supabase, { photos: 1, photosKo: Math.round(photo.data.length / 1024) });
  const [{ ligne }, maCle, message] = await Promise.all([lireLigne(supabase, moi.id), poserProfil(supabase, moi.id), vueDeLaPhoto(supabase, fiche, moi.id)]);
  if (!message) return { error: "Ta photo n’est pas partie. Réessaie dans un instant.", statut: 502 };
  return { message, apres: { pour: h, prenom: s(ligne?.prenom), url: `/collection?parler=${maCle}#proches`, cle: maCle, legende: leg } };
}

/** 🔔 Après la réponse : « 📷 Léa t'a envoyé une photo » (et sa légende). Jamais bloquant. */
export async function apresPhoto(supabase: Supabase, moi: Habitant, a: ApresPhoto): Promise<void> {
  await prevenirDUneParole(supabase, a.pour, moi.id, a.prenom, { url: a.url, cle: a.cle, ecrit: notifPhoto(a.prenom, a.legende) }).catch(() => undefined);
}

// ─── la modération ─────────────────────────────────────────────────────────────────────────────────
/** La clé, l'adresse et le modèle du service de modération (la sienne, sinon celle du talkie, sinon la générale). */
function service(): { cle: string; base: string; modele: string } | null {
  const env = process.env;
  const choix = [
    [env.OPENAI_MODERATION_API_KEY, env.OPENAI_MODERATION_BASE_URL],
    [env.OPENAI_TALKIE_API_KEY, env.OPENAI_TALKIE_BASE_URL],
    [env.OPENAI_API_KEY, env.OPENAI_BASE_URL],
  ].find(([cle]) => s(cle));
  if (!choix) return null;
  return { cle: s(choix[0]), base: (s(choix[1]) || s(env.OPENAI_BASE_URL) || "https://api.openai.com").replace(/\/+$/, ""), modele: s(env.OPENAI_MODERATION_MODEL) || "omni-moderation-latest" };
}

/**
 * 🛡️ LE CONTRÔLE D'UNE PHOTO (et de sa légende) : « ok », « refus » (le service la juge inacceptable, pour une appli
 * ouverte dès 15 ans), « panne » (pas de service, ou il ne répond pas : la photo ne part pas).
 */
export async function modererPhoto(image: Buffer, legende: string): Promise<"ok" | "refus" | "panne"> {
  const x = service();
  if (!x) return "panne";
  try {
    // (une copie plus petite suffit au contrôle, et part plus vite)
    const petite = await sharp(image).resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    const input = [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${petite.toString("base64")}` } }, ...(legende ? [{ type: "text", text: legende }] : [])];
    const r = await fetch(`${x.base}/v1/moderations`, {
      method: "POST",
      headers: { authorization: `Bearer ${x.cle}`, "content-type": "application/json" },
      body: JSON.stringify({ model: x.modele, input }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return "panne";
    const j = (await r.json().catch(() => null)) as { results?: { flagged?: unknown }[] } | null;
    const resultats = Array.isArray(j?.results) ? j.results : [];
    if (!resultats.length) return "panne";
    return resultats.some((y) => y?.flagged === true) ? "refus" : "ok";
  } catch {
    return "panne";
  }
}
