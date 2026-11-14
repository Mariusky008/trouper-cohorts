/**
 * 🎬 ÉCRIRE, PARTAGER — LES VIDÉOS, CÔTÉ SERVEUR (lot M3 ; les règles : `video.ts` ; le cahier :
 * `docs/univers/messages-ecrits.md`, section 6).
 *
 * LE CHEMIN D'UNE VIDÉO :
 *   1. `depotVideo` : une adresse signée pour SA vidéo, `fils/<paire>/v/<qui>-<id>-brut.<ext>` — elle part tout droit
 *      du téléphone au seau privé (25 Mo au plus) ;
 *   2. `envoyerVideo`, avec les trois images que le téléphone en a tirées (au début, au milieu, à la fin) : le serveur
 *      relit la vidéo, LIT SA DURÉE DANS SON EN-TÊTE (30 secondes au plus ; il n'a pas de quoi la décoder), fait
 *      contrôler les trois images par le service de modération (la légende aussi ; le son n'est pas contrôlé, une
 *      limite connue). Refusée : effacée, elle ne part pas. Sans service : elle attend (il peut réessayer). Acceptée :
 *      rangée (`fils/<paire>/v/<id>.<ext>`), sa vignette (l'image du milieu, `fils/<paire>/v/<id>.webp`), le message
 *      posé dans le même dossier que les vocaux, les écrits et les photos (`genre: "video"`), l'autre prévenu après la
 *      réponse (« 🎬 Léa t'a envoyé une vidéo »).
 *   · `<habitant>/videos-jour.json` = { jour, n } : ses vidéos du jour (dix au plus).
 *
 * LA MODÉRATION : celle des photos (`modererPhoto`, `photo-serveur.ts`), image par image.
 *
 * LE FREIN : `CLIKME_VIDEOS=0` chez l'hébergeur — plus de vidéo ; celles qui sont parties restent visibles, et chacun
 * peut effacer la sienne (dans les 24 heures).
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
import { dossierMessages, hDeCle, nomMessage, nomsDuFil, noter, noterStatsMessages, pairDe, poserProfil, qui8, seParlent, sesTetesJouables, vueDeLaVideo, type FicheMessage } from "./talkie-serveur";
import { PHRASES_ECRIT } from "./ecrit";
import { PHRASES_PHOTO, legendePhoto } from "./photo";
import { modererPhoto } from "./photo-serveur";
import { PHRASES_VIDEO, VIDEO, dureeDuMp4, dureeDuWebm, extVideo, notifVideo, phraseTropLongue, tropLongue } from "./video";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** 🛑 Le frein : `CLIKME_VIDEOS=0` (plus de vidéo ; celles qui sont parties restent visibles). */
export const videosOuvertes = () => s(process.env.CLIKME_VIDEOS) !== "0";

const cheminVideo = (pair: string, id: string, ext: string) => `fils/${pair}/v/${id}.${ext}`;
const cheminVignette = (pair: string, id: string) => `fils/${pair}/v/${id}.webp`;
/** (la vidéo telle qu'elle arrive du téléphone, le temps du contrôle : à lui seul, `qui`) */
const cheminBrut = (pair: string, moi: string, id: string, ext: string) => `fils/${pair}/v/${qui8(moi)}-${id}-brut.${ext}`;
const cheminCompteur = (h: string) => `${h}/videos-jour.json`;
const idValide = (x: unknown) => (typeof x === "string" && /^[a-z0-9]{12}$/.test(x) ? x : null);
const TYPE: Record<string, string> = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };

/** Le proche (par sa clé), s'ils se parlent, et ses vidéos du jour. */
async function avecQui(supabase: Supabase, moi: Habitant, cle: unknown): Promise<Resultat<{ h?: string; pair?: string; jour?: string; n?: number }>> {
  if (!videosOuvertes()) return { error: PHRASES_VIDEO.ferme, statut: 404 };
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const jour = jourParis();
  const c = await lireJson<{ jour?: string; n?: number }>(supabase, cheminCompteur(moi.id));
  const n = c.jour === jour ? Number(c.n) || 0 : 0;
  if (n >= VIDEO.parJour) return { error: PHRASES_VIDEO.assez, statut: 429 };
  return { h, pair: pairDe(moi.id, h), jour, n };
}

/** 📤 OÙ DÉPOSER SA VIDÉO : une adresse signée, pour elle seule (un seul dépôt), et son identifiant. */
export async function depotVideo(supabase: Supabase, moi: Habitant, cle: unknown, type: unknown): Promise<Resultat<{ seau?: string; chemin?: string; jeton?: string; id?: string }>> {
  const ext = extVideo(type);
  if (!ext) return { error: PHRASES_VIDEO.format, statut: 400 };
  const q = await avecQui(supabase, moi, cle);
  if (q.error || !q.pair) return { error: q.error, statut: q.statut };
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  const chemin = cheminBrut(q.pair, moi.id, id, ext);
  const { data, error } = await supabase.storage.from(SEAU_FIGURINES).createSignedUploadUrl(chemin);
  if (error || !data?.token) return { error: "Ta vidéo n’a pas pu partir. Réessaie.", statut: 502 };
  return { seau: SEAU_FIGURINES, chemin: data.path ?? chemin, jeton: data.token, id };
}

/** Une image tirée de la vidéo (une adresse `data:`), relue et remise en JPEG ; `null` : illisible ou trop lourde. */
async function imageTiree(x: unknown): Promise<{ octets: Buffer; l: number; h: number } | null> {
  const m = typeof x === "string" ? /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(x) : null;
  if (!m) return null;
  const brut = Buffer.from(m[2], "base64");
  if (!brut.length || brut.length > VIDEO.imageMax) return null;
  try {
    const { data, info } = await sharp(brut, { limitInputPixels: 20_000_000, failOn: "error" }).rotate().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true });
    return { octets: data, l: info.width, h: info.height };
  } catch {
    return null;
  }
}

/** Ce qu'il faut pour prévenir l'autre, après la réponse. */
export type ApresVideo = { pour: string; prenom: string; url: string; cle: string; legende: string };

/**
 * 🎬 IL ENVOIE SA VIDÉO (déposée), avec les trois images qu'il en a tirées : relue, sa durée lue, ses images contrôlées,
 * puis rangée avec sa vignette et posée dans leur fil. `duree` : celle que le téléphone a lue (seulement quand le
 * fichier ne la donne pas, comme certains WebM).
 */
export async function envoyerVideo(
  supabase: Supabase,
  moi: Habitant,
  cle: unknown,
  id: unknown,
  type: unknown,
  duree: unknown,
  images: unknown,
  legende: unknown,
  tete: unknown,
): Promise<Resultat<{ message?: MessageFil; apres?: ApresVideo }>> {
  const i = idValide(id);
  const ext = extVideo(type);
  if (!i || !ext) return { error: PHRASES_VIDEO.absente, statut: 400 };
  const leg = legendePhoto(legende);
  if (leg === null) return { error: PHRASES_PHOTO.legende, statut: 400 };
  if (leg && motInterdit(leg)) return { error: PHRASES_ECRIT.motInterdit, statut: 422 };
  const tirees = Array.isArray(images) && images.length === VIDEO.images ? await Promise.all(images.map(imageTiree)) : [];
  if (tirees.length !== VIDEO.images || tirees.some((x) => !x)) return { error: PHRASES_VIDEO.images, statut: 400 };
  const imgs = tirees as { octets: Buffer; l: number; h: number }[];
  const q = await avecQui(supabase, moi, cle);
  if (q.error || !q.h || !q.pair || !q.jour) return { error: q.error, statut: q.statut };
  const { h, pair, jour } = q;
  const n = q.n ?? 0;
  const brut = cheminBrut(pair, moi.id, i, ext);
  const effacerBrut = () => supabase.storage.from(SEAU_FIGURINES).remove([brut]).catch(() => undefined);

  // 1. relue : elle est arrivée, pas trop lourde, et c'est bien une vidéo de 30 secondes au plus
  const { data: blob, error: absente } = await supabase.storage.from(SEAU_FIGURINES).download(brut);
  if (absente || !blob) return { error: PHRASES_VIDEO.absente, statut: 400 };
  if (blob.size > VIDEO.max) {
    await effacerBrut();
    return { error: PHRASES_VIDEO.lourde, statut: 413 };
  }
  const octets = new Uint8Array(await blob.arrayBuffer());
  const lue = ext === "webm" ? dureeDuWebm(octets) : dureeDuMp4(octets);
  // (un WebM du navigateur ne dit souvent pas sa durée : celle que le téléphone a lue, alors — c'est bien un WebM)
  const secondes = lue ?? (ext === "webm" && octets.length >= 4 && octets[0] === 0x1a && octets[1] === 0x45 && Number(duree) > 0 ? Number(duree) : null);
  if (secondes === null) {
    await effacerBrut();
    return { error: PHRASES_VIDEO.illisible, statut: 400 };
  }
  if (tropLongue(secondes)) {
    await effacerBrut();
    return { error: phraseTropLongue(secondes), statut: 413 };
  }
  // 2. contrôlée : ses trois images (et la légende) ; une refusée, elle ne part pas ; sans service, elle attend
  const verdicts = await Promise.all(imgs.map((x, k) => modererPhoto(x.octets, k === 0 ? leg : "")));
  if (verdicts.includes("refus")) {
    await effacerBrut();
    await noterStatsMessages(supabase, { videosRefusees: 1 });
    return { error: PHRASES_VIDEO.refusee, statut: 422 };
  }
  if (verdicts.includes("panne")) {
    await noterStatsMessages(supabase, { videosNonVerifiees: 1 });
    return { error: PHRASES_VIDEO.injoignable, statut: 503 };
  }
  // 3. rangée, avec sa vignette (l'image du milieu), et posée dans leur fil
  const milieu = imgs[1];
  const vignette = await sharp(milieu.octets).resize({ width: VIDEO.vignette, height: VIDEO.vignette, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const cheminV = cheminVignette(pair, i);
  const chemin = cheminVideo(pair, i, ext);
  if (!(await deposer(supabase, cheminV, vignette, "image/webp"))) return { error: "Ta vidéo n’est pas partie. Réessaie dans un instant.", statut: 502 };
  const { error: deplacee } = await supabase.storage.from(SEAU_FIGURINES).move(brut, chemin);
  if (deplacee) {
    await supabase.storage.from(SEAU_FIGURINES).remove([cheminV]).catch(() => undefined);
    return { error: "Ta vidéo n’est pas partie. Réessaie dans un instant.", statut: 502 };
  }
  const dispo = (await sesTetesJouables(supabase, moi.id)) ?? [...TETES_DE_DEPART];
  const voulue = sentimentValide(tete);
  const laTete: Sentiment | null = voulue && dispo.includes(voulue) ? voulue : (proposerParRegles(leg, dispo)[0] ?? null);
  const ts = Date.now();
  const fiche: FicheMessage = {
    id: i,
    de: moi.id,
    le: new Date(ts).toISOString(),
    genre: "video",
    media: { chemin, l: milieu.l, h: milieu.h, vignette: cheminV, duree: Math.round(secondes * 10) / 10, type: TYPE[ext] },
    ...(leg ? { legende: leg } : {}),
    tete: laTete,
  };
  const avant = await nomsDuFil(supabase, pair);
  const nom = nomMessage(ts, moi.id, i);
  if (!(await ecrireJson(supabase, `${dossierMessages(pair)}/${nom}`, fiche))) {
    await supabase.storage.from(SEAU_FIGURINES).remove([chemin, cheminV]).catch(() => undefined);
    return { error: "Ta vidéo n’est pas partie. Réessaie dans un instant.", statut: 502 };
  }
  await ecrireJson(supabase, cheminCompteur(moi.id), { jour, n: n + 1 });
  // 📈 la mesure du talkie, et celle des messages (le poids de la vidéo : ce qui coûte)
  const dernier = avant[avant.length - 1];
  await noter(supabase, pair, moi.id, "cree");
  if (dernier && dernier.de8 !== qui8(moi.id)) await noter(supabase, pair, moi.id, "reponse");
  await noterStatsMessages(supabase, { videos: 1, videosKo: Math.round(octets.length / 1024) });
  const [{ ligne }, maCle, message] = await Promise.all([lireLigne(supabase, moi.id), poserProfil(supabase, moi.id), vueDeLaVideo(supabase, fiche, moi.id)]);
  if (!message) return { error: "Ta vidéo n’est pas partie. Réessaie dans un instant.", statut: 502 };
  return { message, apres: { pour: h, prenom: s(ligne?.prenom), url: `/collection?parler=${maCle}#proches`, cle: maCle, legende: leg } };
}

/** 🔔 Après la réponse : « 🎬 Léa t'a envoyé une vidéo » (et sa légende). Jamais bloquant. */
export async function apresVideo(supabase: Supabase, moi: Habitant, a: ApresVideo): Promise<void> {
  await prevenirDUneParole(supabase, a.pour, moi.id, a.prenom, { url: a.url, cle: a.cle, ecrit: notifVideo(a.prenom, a.legende) }).catch(() => undefined);
}
