/**
 * 👥 LE CERCLE D'UN GROUPE, VIDÉO PAR VIDÉO (`docs/univers/discussions-video.md`, le lot A6).
 *
 * `groupes/videos/<groupe>/<vidéo>/<ms>-<q>-<x>.json` = { id, h, q, prenom, texte, le, repond?, de? } : ce que les membres
 * du groupe disent d'une vidéo — écrit dans la discussion (« 👥 Lu par Les copains »), ou dit au salon du groupe pendant
 * qu'elle passait (`de` : « au salon du groupe » ; ce qu'on dit dans le salon du groupe y reste). Lu par les membres
 * actuels seulement : qui quitte le groupe ne voit plus rien ; ce qu'il a dit reste, avec son prénom. Gardé tant que le
 * groupe vit. Mon niveau : `<h>/suivis-videos.json`, la clé `<groupe>:<vidéo>` (🔔 d'office, comme les groupes gardés).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { randomBytes } from "node:crypto";
import { SEAU_FIGURINES, ecrireJson, lireJson, prenomDe } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { refusDuMessage } from "./salons-ouverts";
import { cheminGroupe, cheminMiens, estMembre, idGroupeValide, membresDe } from "./groupes-chemins-serveur";
import { tousMesSuivis, ecrireSuivi } from "./suivis-video-serveur";
import { prevenirLaDiscussion } from "./activite-serveur";
import { noterFicheVideo } from "./fiche-video-serveur";
import { ECRITS_VIDEO, PHRASES_DISCUSSION, type EcritVu, type GroupeDeLaDiscussion, type NiveauSuivi, type VideoDiscussion } from "./discussion-video";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number; refus?: string };
type FicheEcrit = { id?: string; h?: string; q?: string; prenom?: string; texte?: string; le?: number; repond?: string; de?: string };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const ID_ECRIT = /^\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/;
const dossierVideoGroupe = (gid: string, video: string) => `groupes/videos/${gid}/${video}`;
/** 🚩 (lot A7) `groupes/videos-signales/<groupe>/<vidéo>/<id>/<q de qui signale>.json` */
const dossierSignalesGroupe = (gid: string, video: string) => `groupes/videos-signales/${gid}/${video}`;
const msDe = (id: string) => Number(id.slice(0, 13)) || 0;

async function lister(supabase: Supabase, dossier: string, limite = 1000): Promise<string[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: limite, sortBy: { column: "name", order: "asc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n.endsWith(".json"));
}
/** Les groupes dont je suis membre (mon index, vérifié). */
async function mesGroupesIds(supabase: Supabase, q: string): Promise<string[]> {
  const f = await lireJson<{ groupes?: unknown[] }>(supabase, cheminMiens(q)).catch(() => ({}) as { groupes?: unknown[] });
  const ids = (Array.isArray(f.groupes) ? f.groupes : []).map(idGroupeValide).filter((x): x is string => Boolean(x)).slice(0, 20);
  const oui = await Promise.all(ids.map((id) => estMembre(supabase, id, q).catch(() => false)));
  return ids.filter((_, k) => oui[k]);
}
const nomDuGroupe = async (supabase: Supabase, gid: string) => s((await lireJson<{ nom?: string }>(supabase, cheminGroupe(gid)).catch(() => ({}) as { nom?: string })).nom) || "Ton groupe";

/** Ce que mon groupe a dit de cette vidéo, du plus ancien au plus récent. */
async function lesEcritsDuGroupe(supabase: Supabase, moi: Habitant, gid: string, video: string): Promise<EcritVu[]> {
  const dossier = dossierVideoGroupe(gid, video);
  const noms = (await lister(supabase, dossier)).map((n) => n.replace(/\.json$/, "")).slice(-ECRITS_VIDEO.lusMax);
  const mienQ = qui8(moi.id);
  // (🚩 lot A7 : un mot que j'ai signalé ne passe plus chez moi ; à trois, chez personne)
  const signales = new Set<string>();
  const parMot = await Promise.all(noms.map((id) => lister(supabase, `${dossierSignalesGroupe(gid, video)}/${id}`, 10).catch(() => [] as string[])));
  noms.forEach((id, k) => (parMot[k].length >= ECRITS_VIDEO.seuilSignalements || parMot[k].includes(`${mienQ}.json`)) && signales.add(id));
  const fiches = (await Promise.all(noms.filter((id) => !signales.has(id) || id.split("-")[1] === mienQ).map((id) => lireJson<FicheEcrit>(supabase, `${dossier}/${id}.json`).catch(() => ({}) as FicheEcrit)))).filter((f) => s(f.texte) && s(f.q));
  const prenoms = new Map(fiches.map((f) => [s(f.id), s(f.prenom)]));
  const figurines = new Map<string, { src: string } | null>();
  for (const f of fiches.slice(-ECRITS_VIDEO.figurinesMax)) if (!figurines.has(s(f.h))) figurines.set(s(f.h), null);
  await Promise.all([...figurines.keys()].map(async (h) => figurines.set(h, await figurineDeLaMaison(supabase, h).then((x) => (x ? { src: x.src } : null)).catch(() => null))));
  return fiches.map((f): EcritVu => {
    const r = s(f.repond);
    return {
      id: s(f.id),
      q: s(f.q),
      prenom: s(f.prenom) || "Quelqu’un",
      texte: s(f.texte),
      le: Number(f.le) || msDe(s(f.id)),
      ...(r && prenoms.has(r) ? { repond: { id: r, prenom: prenoms.get(r) || "Quelqu’un" } } : {}),
      ...(s(f.de) ? { de: s(f.de) } : {}),
      moi: s(f.q) === mienQ,
      proche: false,
      figurine: figurines.get(s(f.h)) ?? null,
    };
  });
}

/**
 * 👥 Mes groupes pour cette vidéo : ceux où l'on en a parlé, et celui d'où je viens (`demande` : je suis membre). Mon
 * niveau (🔔 d'office) et ma dernière lecture ; `marquer` : je la lis maintenant.
 */
export async function groupesDeLaVideo(supabase: Supabase, moi: Habitant, video: string, o: { demande?: unknown; marquer?: boolean; titre?: string } = {}): Promise<GroupeDeLaDiscussion[]> {
  const q = qui8(moi.id);
  const ids = await mesGroupesIds(supabase, q);
  const demande = idGroupeValide(o.demande);
  const avecDesMots = await Promise.all(ids.map(async (gid) => (await lister(supabase, dossierVideoGroupe(gid, video), 1)).length > 0));
  const retenus = ids.filter((gid, k) => avecDesMots[k] || gid === demande);
  if (!retenus.length) return [];
  const suivis = await tousMesSuivis(supabase, moi.id);
  const l = await Promise.all(
    retenus.map(async (gid): Promise<GroupeDeLaDiscussion> => {
      const x = suivis[`${gid}:${video}`];
      return { id: gid, nom: await nomDuGroupe(supabase, gid), ecrits: await lesEcritsDuGroupe(supabase, moi, gid, video), suivi: x?.niveau ?? "prevenir", luAvant: Number(x?.lu) || 0 };
    }),
  );
  if (o.marquer) await ecrireSuivi(supabase, moi.id, Object.fromEntries(retenus.map((gid) => [`${gid}:${video}`, { lu: Date.now(), ...(o.titre ? { titre: o.titre } : {}) }])));
  return l;
}

/** (une de mes discussions de groupe sur cette vidéo : elle m'ouvre la discussion, même partie de ma télé) */
export async function aParleAuGroupe(supabase: Supabase, moi: Habitant, video: string): Promise<boolean> {
  const ids = await mesGroupesIds(supabase, qui8(moi.id));
  return (await Promise.all(ids.map(async (gid) => (await lister(supabase, dossierVideoGroupe(gid, video), 1)).length > 0))).some(Boolean);
}

/** Les membres à prévenir, avec leur niveau pour cette vidéo (🔔 d'office). */
async function membresAPrevenir(supabase: Supabase, gid: string, video: string, sauf: string[]): Promise<{ h: string; niveau: NiveauSuivi }[]> {
  const membres = (await membresDe(supabase, gid)).filter((m) => !sauf.includes(m.q));
  return Promise.all(membres.map(async (m) => ({ h: m.h, niveau: (await tousMesSuivis(supabase, m.h))[`${gid}:${video}`]?.niveau ?? "prevenir" })));
}

/**
 * ✍️ Écrire dans le cercle de mon groupe : 90 signes, la modération des salons ; une réponse à un mot du groupe. `de` :
 * dit au salon du groupe. Les membres sont prévenus (Activité, puis le téléphone selon la règle de bruit), sauf ceux qui
 * sont au salon du groupe.
 */
export async function publierAuGroupe(
  supabase: Supabase,
  moi: Habitant,
  v: VideoDiscussion,
  p: { groupe?: unknown; texte?: unknown; repond?: unknown; auSalon?: boolean },
): Promise<Resultat<{ ecrit?: EcritVu }>> {
  const gid = idGroupeValide(p.groupe);
  const q = qui8(moi.id);
  if (!gid || !(await estMembre(supabase, gid, q))) return { error: "Ce groupe n’est pas le tien.", statut: 403 };
  const texte = s(p.texte).replace(/\s+/g, " ");
  const refus = refusDuMessage(texte);
  if (refus) return { error: PHRASES_DISCUSSION.refus(refus), statut: 400, refus };
  const dossier = dossierVideoGroupe(gid, v.id);
  const noms = await lister(supabase, dossier);
  const maintenant = Date.now();
  const miens = noms.filter((n) => n.split("-")[1] === q).map(msDe);
  if (!p.auSalon && (miens.length >= ECRITS_VIDEO.parPersonne || (miens.length && maintenant - Math.max(...miens) < ECRITS_VIDEO.ecartMs))) return { error: PHRASES_DISCUSSION.doucement, statut: 429 };
  const repond = s(p.repond);
  if (repond && !(ID_ECRIT.test(repond) && repond.split("-")[1] !== q && noms.includes(`${repond}.json`))) return { error: "Ce mot n’est plus là.", statut: 404 };
  const id = `${maintenant}-${q}-${randomBytes(3).toString("hex")}`;
  const prenom = s(await prenomDe(supabase, moi).catch(() => "")) || "Quelqu’un";
  const fiche: FicheEcrit = { id, h: moi.id, q, prenom, texte: [...texte].slice(0, ECRITS_VIDEO.texte).join(""), le: maintenant, ...(repond ? { repond } : {}), ...(p.auSalon ? { de: PHRASES_DISCUSSION.auSalon } : {}) };
  if (!(await ecrireJson(supabase, `${dossier}/${id}.json`, fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await noterFicheVideo(supabase, v);
  // (🛎️ les membres : ↩ celui à qui je réponds, 💬 les autres — pas ceux qui sont au salon du groupe en ce moment)
  const { presentsDuGroupe } = await import("./salons-ouverts-serveur");
  const ici = await presentsDuGroupe(supabase, gid, maintenant).catch(() => [] as string[]);
  const repondA = repond ? s((await lireJson<FicheEcrit>(supabase, `${dossier}/${repond}.json`).catch(() => ({}) as FicheEcrit)).h) : "";
  const [nom, membres] = await Promise.all([nomDuGroupe(supabase, gid), membresAPrevenir(supabase, gid, v.id, [q, ...ici])]);
  await prevenirLaDiscussion(supabase, moi.id, { cercle: "groupe", tranche: "-", video: v.id, titre: v.titre, prenom, texte: fiche.texte, ...(repondA ? { repondA } : {}), groupe: { id: gid, nom, membres } }).catch(() => []);
  const vus = await lesEcritsDuGroupe(supabase, moi, gid, v.id);
  return { ecrit: vus.find((x) => x.id === id) };
}

/** 🗑️ Effacer mon mot du groupe. */
export async function effacerAuGroupe(supabase: Supabase, moi: Habitant, video: string, p: { groupe?: unknown; ecrit?: unknown }): Promise<Resultat<{ ok?: true }>> {
  const gid = idGroupeValide(p.groupe);
  const q = qui8(moi.id);
  const id = s(p.ecrit);
  if (!gid || !(await estMembre(supabase, gid, q))) return { error: "Ce groupe n’est pas le tien.", statut: 403 };
  if (!ID_ECRIT.test(id) || id.split("-")[1] !== q) return { error: "Quel mot ?", statut: 400 };
  await supabase.storage.from(SEAU_FIGURINES).remove([`${dossierVideoGroupe(gid, video)}/${id}.json`]).then(() => undefined, () => undefined);
  return { ok: true };
}

/** 🔔 Mon niveau pour le cercle d'un groupe. */
export async function suivreAuGroupe(supabase: Supabase, moi: Habitant, v: VideoDiscussion, p: { groupe?: unknown; niveau: NiveauSuivi }): Promise<Resultat<{ niveau?: NiveauSuivi }>> {
  const gid = idGroupeValide(p.groupe);
  if (!gid || !(await estMembre(supabase, gid, qui8(moi.id)))) return { error: "Ce groupe n’est pas le tien.", statut: 403 };
  await ecrireSuivi(supabase, moi.id, { [`${gid}:${v.id}`]: { niveau: p.niveau, titre: v.titre } });
  return { niveau: p.niveau };
}

/** 🚩 (lot A7) Signaler un mot du groupe : il ne passe plus chez moi ; à trois membres, chez personne ; l'administrateur le voit. */
export async function signalerAuGroupe(supabase: Supabase, moi: Habitant, video: string, p: { groupe?: unknown; ecrit?: unknown }): Promise<Resultat<{ ok?: true; cache?: boolean }>> {
  const gid = idGroupeValide(p.groupe);
  const q = qui8(moi.id);
  const id = s(p.ecrit);
  if (!gid || !(await estMembre(supabase, gid, q))) return { error: "Ce groupe n’est pas le tien.", statut: 403 };
  if (!ID_ECRIT.test(id) || id.split("-")[1] === q) return { error: "Quel mot ?", statut: 400 };
  const chemin = `${dossierVideoGroupe(gid, video)}/${id}.json`;
  const f = await lireJson<FicheEcrit>(supabase, chemin).catch(() => ({}) as FicheEcrit);
  if (!s(f.texte)) return { error: "Ce mot n’est plus là.", statut: 404 };
  const maintenant = Date.now();
  await ecrireJson(supabase, `${dossierSignalesGroupe(gid, video)}/${id}/${q}.json`, { le: maintenant });
  // (pour l'administrateur, avec les autres : `/admin/humain/salons`)
  await ecrireJson(supabase, `decouvrir/signalements/${s(f.q)}/${maintenant}-${q}.json`, {
    le: maintenant,
    motif: "ecrit-groupe",
    salon: `groupe:${await nomDuGroupe(supabase, gid)}:${video}`,
    q: s(f.q),
    h: s(f.h),
    prenom: s(f.prenom),
    auteur: { q, h: moi.id },
    texte: s(f.texte),
    ecrit: chemin,
  });
  const par = await lister(supabase, `${dossierSignalesGroupe(gid, video)}/${id}`, 10);
  return { ok: true, cache: par.length >= ECRITS_VIDEO.seuilSignalements };
}
