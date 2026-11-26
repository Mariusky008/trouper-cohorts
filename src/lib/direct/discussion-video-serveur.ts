/**
 * 💬 LA DISCUSSION D'UNE VIDÉO, CÔTÉ SERVEUR (`discussion-video.ts` ; `docs/univers/discussions-video.md`, le lot A1).
 *
 * Rien de nouveau n'est rangé pour la lire : elle réunit ce qui est déjà attaché à la vidéo — les réactions de mes proches
 * (`decouvrir/reactions/<vidéo>/`) et les mots de ma tranche (`decouvrir/mots/<tranche>/<vidéo>/`). Seule la fiche de la
 * vidéo (`videos/<id>.json`) est nouvelle : elle dit son titre quand la vidéo a quitté ma télé.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { randomBytes } from "node:crypto";
import { SEAU_FIGURINES, ecrireJson, lireJson, prenomDe, prochesDe } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { exclusion, lirePresent } from "./salons-ouverts-serveur";
import { PHRASES_SALONS, nomDuSalon, refusDuMessage, salonDe } from "./salons-ouverts";
import { maVideo } from "./tele-du-jour-serveur";
import { dansMonHistorique } from "./revoir-serveur";
import { cheminReactions, reactionsDesProches } from "./reactions-video-serveur";
import { aMonMot, laVideo, saTranche, suiteDeLaVideo } from "./mots-video-serveur";
import { ID_VIDEO, ficheVideo, noterFicheVideo } from "./fiche-video-serveur";
import { prevenirLaDiscussion } from "./activite-serveur";
import { choisirNiveau, marquerLu, mesSuivis, niveauValide, suivreApresPublication } from "./suivis-video-serveur";
import { ECRITS_VIDEO, PHRASES_DISCUSSION, cercleValide, niveauDeDepart, type NiveauSuivi, type DiscussionVue, type EcritVu, type VideoDiscussion } from "./discussion-video";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number; age?: true; refus?: string };
type Tranche = "adultes" | "jeunes";
type FicheEcrit = { id?: string; h?: string; q?: string; prenom?: string; texte?: string; le?: number; repond?: string; de?: string };
const JOUR_MS = 24 * 3600_000;
const ID_ECRIT = /^\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/;
const ID_Q = /^[A-Za-z0-9_-]{4,16}$/;
const dossierEcrits = (m: Tranche, video: string) => `decouvrir/ecrits/${m}/${video}`;
const dossierSignales = (m: Tranche, video: string) => `decouvrir/ecrits-signales/${m}/${video}`;
const dossierMots = (m: Tranche, video: string) => `decouvrir/mots/${m}/${video}`;

async function lister(supabase: Supabase, dossier: string, limite = 1000): Promise<string[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: limite, sortBy: { column: "name", order: "asc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n && n !== ".emptyFolderPlaceholder");
}
const effacer = (supabase: Supabase, chemins: string[]) => (chemins.length ? supabase.storage.from(SEAU_FIGURINES).remove(chemins).then(() => undefined, () => undefined) : Promise.resolve());
const msDe = (id: string) => Number(id.slice(0, 13)) || 0;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/**
 * La vidéo d'une discussion, si je peux l'ouvrir : à ma télé, dans mon historique, dans une séance où je suis ou un
 * salon de ma tranche (`laVideo` des mots) ; ou connue (sa fiche) et j'y ai déjà dit quelque chose. Sinon `null`.
 */
export async function videoDeLaDiscussion(supabase: Supabase, moi: Habitant, id: unknown, seance?: unknown): Promise<(VideoDiscussion & { aMaTele: boolean }) | null> {
  const i = s(id);
  if (!ID_VIDEO.test(i)) return null;
  const tele = await maVideo(supabase, moi.id, i).catch(() => null);
  if (tele) return { id: i, titre: s(tele.titre), chaine: s(tele.chaine), duree: Number(tele.duree) || 0, aMaTele: true };
  const vue = await dansMonHistorique(supabase, moi.id, i).catch(() => null);
  if (vue) return { ...vue, aMaTele: false };
  const ailleurs = await laVideo(supabase, moi, i, seance).catch(() => null);
  if (ailleurs) return { ...ailleurs, aMaTele: false };
  const fiche = await ficheVideo(supabase, i);
  if (!fiche) return null;
  const [reactions, mot] = await Promise.all([lireJson<{ vu?: number }>(supabase, cheminReactions(i, moi.id)).catch(() => ({}) as { vu?: number }), aMonMot(supabase, moi, i).catch(() => false)]);
  return Number(reactions.vu) > 0 || mot ? { ...fiche, aMaTele: false } : null;
}

/** 💬 La discussion : la vidéo, ce que mes proches en ont dit, les mots de ma tranche. */
export async function laDiscussion(supabase: Supabase, moi: Habitant, id: unknown, seance?: unknown): Promise<Resultat<{ discussion?: DiscussionVue }>> {
  const v = await videoDeLaDiscussion(supabase, moi, id, seance);
  if (!v) return { error: "Cette discussion n’est plus là.", statut: 404 };
  const { aMaTele, ...video } = v;
  const [r, suite] = await Promise.all([
    reactionsDesProches(supabase, moi, video.id, { id: video.id, titre: video.titre, duree: video.duree }),
    suiteDeLaVideo(supabase, moi, video.id, undefined, { id: video.id }),
    // (sa fiche, pour plus tard : la discussion se retrouvera quand elle aura quitté ma télé)
    noterFicheVideo(supabase, video),
  ]);
  if (r.error) return { error: r.error, statut: r.statut };
  const ecrits = suite.suite ? await lesEcrits(supabase, moi, suite.suite.tranche, video.id) : [];
  // (🔔 lot A3 : mon niveau dans chaque cercle — choisi, sinon celui de départ ; et je l'ai lue maintenant)
  const [choix, luAvant] = await Promise.all([mesSuivis(supabase, moi.id, video.id), marquerLu(supabase, moi.id, video.id, video.titre)]);
  const miennes = r.miennes ?? [];
  const suivi: Record<"proches" | "tous", NiveauSuivi> = {
    proches: choix.proches?.niveau ?? niveauDeDepart("proches", { vue: r.vue === true, aParle: miennes.some((x) => x.source !== "implicite") }),
    tous: choix.tous?.niveau ?? niveauDeDepart("tous", { vue: r.vue === true, aParle: ecrits.some((e) => e.moi) || Boolean(suite.suite?.mots.some((m) => m.moi)) }),
  };
  return {
    discussion: {
      video,
      vue: r.vue === true,
      aMaTele,
      proches: r.proches ?? [],
      miennes,
      tous: suite.suite ?? null,
      ecrits,
      suivi,
      luAvant: { proches: luAvant.proches ?? 0, tous: luAvant.tous ?? 0 },
    },
  };
}

// ─── ✍️ (lot A2) LES MOTS ÉCRITS SOUS LA VIDÉO (🌍) ───
/**
 * `decouvrir/ecrits/<tranche>/<vidéo>/<ms>-<q>-<x>.json` = { id, h, q, prenom, texte, le, repond?, de? } : un fichier par
 * mot écrit (personne n'écrit celui d'un autre) ; `decouvrir/ecrits-signales/<tranche>/<vidéo>/<id>/<q de qui signale>.json`.
 */
async function cachesPourMoi(supabase: Supabase, m: Tranche, video: string, mienQ: string): Promise<Set<string>> {
  const cibles = await lister(supabase, dossierSignales(m, video));
  const caches = new Set<string>();
  await Promise.all(
    cibles.map(async (id) => {
      const par = await lister(supabase, `${dossierSignales(m, video)}/${id}`);
      if (par.length >= ECRITS_VIDEO.seuilSignalements || par.includes(`${mienQ}.json`)) caches.add(id);
    }),
  );
  return caches;
}

/** Les mots écrits de ma tranche pour cette vidéo (sans les trop vieux, ni ceux cachés pour moi), du plus ancien au plus récent. */
async function lesEcrits(supabase: Supabase, moi: Habitant, m: Tranche, video: string): Promise<EcritVu[]> {
  const maintenant = Date.now();
  const noms = (await lister(supabase, dossierEcrits(m, video))).filter((n) => n.endsWith(".json")).map((n) => n.replace(/\.json$/, ""));
  const vieux = noms.filter((id) => maintenant - msDe(id) > ECRITS_VIDEO.conserveJours * JOUR_MS);
  if (vieux.length) void effacer(supabase, vieux.map((id) => `${dossierEcrits(m, video)}/${id}.json`));
  const mienQ = qui8(moi.id);
  const frais = noms.filter((id) => !vieux.includes(id)).slice(-ECRITS_VIDEO.lusMax);
  const [caches, proches, fiches, motsDits] = await Promise.all([
    cachesPourMoi(supabase, m, video, mienQ),
    prochesDe(supabase, moi.id),
    Promise.all(frais.map((id) => lireJson<FicheEcrit>(supabase, `${dossierEcrits(m, video)}/${id}.json`).catch(() => ({}) as FicheEcrit))),
    lister(supabase, dossierMots(m, video)),
  ]);
  const lus = fiches.filter((f, k) => s(f.texte) && s(f.q) && (s(f.q) === mienQ || !caches.has(frais[k])));
  const prenoms = new Map<string, string>(lus.map((f) => [s(f.id), s(f.prenom)]));
  // (une réponse à un mot dit : son prénom vient de sa fiche)
  const aMotsDits = new Set(motsDits.filter((n) => n.endsWith(".json")).map((n) => n.replace(/\.json$/, "")));
  const prenomDuMot = async (q: string) => s((await lireJson<{ prenom?: string }>(supabase, `${dossierMots(m, video)}/${q}.json`).catch(() => ({}) as { prenom?: string })).prenom);
  const figurines = new Map<string, { src: string } | null>();
  for (const f of lus.slice(-ECRITS_VIDEO.figurinesMax)) if (!figurines.has(s(f.h))) figurines.set(s(f.h), null);
  await Promise.all([...figurines.keys()].map(async (h) => figurines.set(h, await figurineDeLaMaison(supabase, h).then((x) => (x ? { src: x.src } : null)).catch(() => null))));
  return Promise.all(
    lus.map(async (f): Promise<EcritVu> => {
      const r = s(f.repond);
      let repond: EcritVu["repond"];
      if (r.startsWith("mot:") && aMotsDits.has(r.slice(4))) repond = { id: r, prenom: (await prenomDuMot(r.slice(4))) || "Quelqu’un" };
      else if (r && prenoms.has(r)) repond = { id: r, prenom: prenoms.get(r) || "Quelqu’un" };
      return {
        id: s(f.id),
        q: s(f.q),
        prenom: s(f.prenom) || "Quelqu’un",
        texte: s(f.texte),
        le: Number(f.le) || msDe(s(f.id)),
        ...(repond ? { repond } : {}),
        ...(s(f.de) ? { de: s(f.de) } : {}),
        moi: s(f.q) === mienQ,
        proche: proches.has(s(f.h)),
        figurine: figurines.get(s(f.h)) ?? null,
      };
    }),
  );
}

/** Ma tranche, ou le refus qui va avec. */
async function trancheOuRefus(supabase: Supabase, moi: Habitant): Promise<Tranche | Resultat<object>> {
  const m = await saTranche(supabase, moi.id);
  return m ?? { error: "Dis-nous d’abord si tu as 18 ans.", statut: 403, age: true };
}

/**
 * ✍️ Publier un mot écrit sous la vidéo (🌍) : 90 signes, la modération des salons ouverts, avec l'accord donné à
 * l'écran ; une réponse à un mot écrit (son id) ou dit (`mot:<q>`) qui est là. `salon` : écrit d'abord dans ce salon
 * ouvert (« vu dans le salon … »).
 */
export async function publierEcrit(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ ecrit?: EcritVu; premiere?: boolean }>> {
  const v = await videoDeLaDiscussion(supabase, moi, p.id, p.seance);
  if (!v) return { error: "Cette discussion n’est plus là.", statut: 404 };
  const m = await trancheOuRefus(supabase, moi);
  if (typeof m !== "string") return m;
  if (p.accord !== true) return { error: "Il nous faut ton accord pour publier ton mot.", statut: 400 };
  const q = qui8(moi.id);
  const maintenant = Date.now();
  if (await exclusion(supabase, q, maintenant)) return { error: PHRASES_SALONS.exclu, statut: 403 };
  const texte = s(p.texte).replace(/\s+/g, " ");
  const refus = refusDuMessage(texte);
  if (refus) return { error: PHRASES_DISCUSSION.refus(refus), statut: 400, refus };
  const dossier = dossierEcrits(m, v.id);
  const noms = await lister(supabase, dossier);
  const miens = noms.filter((n) => n.split("-")[1] === q).map((n) => msDe(n));
  if (miens.length >= ECRITS_VIDEO.parPersonne || (miens.length && maintenant - Math.max(...miens) < ECRITS_VIDEO.ecartMs)) return { error: PHRASES_DISCUSSION.doucement, statut: 429 };
  // (↩ une réponse : à ce qui est là, pas à soi-même)
  const repond = s(p.repond);
  if (repond) {
    const motDit = repond.startsWith("mot:") ? repond.slice(4) : "";
    const la = motDit
      ? ID_Q.test(motDit) && motDit !== q && (await lister(supabase, dossierMots(m, v.id))).includes(`${motDit}.json`)
      : ID_ECRIT.test(repond) && repond.split("-")[1] !== q && noms.includes(`${repond}.json`);
    if (!la) return { error: "Ce mot n’est plus là.", statut: 404 };
  }
  // (« vu dans le salon … » : seulement s'il y est assis)
  const ici = salonDe(p.salon) && s((await lirePresent(supabase, m, s(p.salon), q).catch(() => ({}) as { q?: string })).q) === q;
  const sid = ici ? salonDe(p.salon) : null;
  const id = `${maintenant}-${q}-${randomBytes(3).toString("hex")}`;
  const prenom = s(await prenomDe(supabase, moi).catch(() => "")) || "Quelqu’un";
  const fiche: FicheEcrit = { id, h: moi.id, q, prenom, texte: [...texte].slice(0, ECRITS_VIDEO.texte).join(""), le: maintenant, ...(repond ? { repond } : {}), ...(sid ? { de: nomDuSalon(sid.theme, sid.n) } : {}) };
  if (!(await ecrireJson(supabase, `${dossier}/${id}.json`, fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await noterFicheVideo(supabase, v);
  // (🔔 je la suis désormais, sans bruit — la première fois, l'écran propose d'être prévenu)
  const premiere = await suivreApresPublication(supabase, moi.id, { video: v.id, tranche: m, titre: v.titre });
  // (🛎️ lot A4 : ↩ celui à qui je réponds, 💬 ceux qui la suivent — dans leur Activité)
  const motDit = repond.startsWith("mot:") ? repond.slice(4) : "";
  const repondA = repond ? s((await lireJson<{ h?: string }>(supabase, motDit ? `${dossierMots(m, v.id)}/${motDit}.json` : `${dossier}/${repond}.json`).catch(() => ({}) as { h?: string })).h) : "";
  await prevenirLaDiscussion(supabase, moi.id, { cercle: "tous", tranche: m, video: v.id, titre: v.titre, prenom, texte: fiche.texte, ...(repondA ? { repondA } : {}) }).catch(() => []);
  const vus = await lesEcrits(supabase, moi, m, v.id);
  return { ecrit: vus.find((x) => x.id === id), premiere };
}

/** 🗑️ Effacer mon mot écrit : il disparaît partout, tout de suite (les réponses restent). */
export async function effacerEcrit(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ ok?: true }>> {
  const v = await videoDeLaDiscussion(supabase, moi, p.id, p.seance);
  if (!v) return { error: "Cette discussion n’est plus là.", statut: 404 };
  const m = await trancheOuRefus(supabase, moi);
  if (typeof m !== "string") return m;
  const id = s(p.ecrit);
  if (!ID_ECRIT.test(id) || id.split("-")[1] !== qui8(moi.id)) return { error: "Quel mot ?", statut: 400 };
  await effacer(supabase, [`${dossierEcrits(m, v.id)}/${id}.json`]);
  return { ok: true };
}

/** 🚩 Signaler un mot écrit : il ne passe plus chez moi ; à trois personnes, chez personne ; l'administrateur le voit. */
export async function signalerEcrit(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ ok?: true; cache?: boolean }>> {
  const v = await videoDeLaDiscussion(supabase, moi, p.id, p.seance);
  if (!v) return { error: "Cette discussion n’est plus là.", statut: 404 };
  const m = await trancheOuRefus(supabase, moi);
  if (typeof m !== "string") return m;
  const id = s(p.ecrit);
  const auteur = qui8(moi.id);
  if (!ID_ECRIT.test(id) || id.split("-")[1] === auteur) return { error: "Quel mot ?", statut: 400 };
  const f = await lireJson<FicheEcrit>(supabase, `${dossierEcrits(m, v.id)}/${id}.json`).catch(() => ({}) as FicheEcrit);
  if (!s(f.texte)) return { error: "Ce mot n’est plus là.", statut: 404 };
  const maintenant = Date.now();
  await ecrireJson(supabase, `${dossierSignales(m, v.id)}/${id}/${auteur}.json`, { le: maintenant });
  // (pour l'administrateur, avec ceux des salons : `/admin/humain/salons`)
  await ecrireJson(supabase, `decouvrir/signalements/${s(f.q)}/${maintenant}-${auteur}.json`, {
    le: maintenant,
    motif: "ecrit",
    salon: `ecrit:${v.id}`,
    maison: m,
    q: s(f.q),
    h: s(f.h),
    prenom: s(f.prenom),
    auteur: { q: auteur, h: moi.id },
    texte: s(f.texte),
  });
  const par = await lister(supabase, `${dossierSignales(m, v.id)}/${id}`);
  return { ok: true, cache: par.length >= ECRITS_VIDEO.seuilSignalements };
}

/** 🔔 (lot A3) Choisir son niveau de suivi pour un cercle : prévenir, sans bruit, ne plus suivre. */
export async function suivreDiscussion(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ niveau?: NiveauSuivi }>> {
  const v = await videoDeLaDiscussion(supabase, moi, p.id, p.seance);
  if (!v) return { error: "Cette discussion n’est plus là.", statut: 404 };
  const cercle = cercleValide(p.cercle);
  const niveau = niveauValide(p.niveau);
  if (!cercle || !niveau) return { error: "Quel suivi ?", statut: 400 };
  let tranche = "-";
  if (cercle === "tous") {
    const m = await trancheOuRefus(supabase, moi);
    if (typeof m !== "string") return m;
    tranche = m;
  }
  await choisirNiveau(supabase, moi.id, { cercle, video: v.id, tranche, niveau, titre: v.titre });
  return { niveau };
}
