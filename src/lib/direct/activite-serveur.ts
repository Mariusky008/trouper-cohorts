/**
 * 🛎️ ACTIVITÉ, CÔTÉ SERVEUR (`activite.ts` ; `docs/univers/discussions-video.md`, le lot A4).
 *
 * `<habitant>/activite/<ms>.<cercle>.<vidéo>.<q>.<sorte>.json` = { prenom, titre, texte?, vocal? } : un petit fichier par
 * événement, écrit par celui qui intervient (deux personnes qui répondent en même temps n'écrivent jamais le même
 * fichier). Tout se lit dans le nom (quand, quelle discussion, qui, quelle sorte) : la cloche compte sans ouvrir un seul
 * fichier ; « 4 nouveaux » se compte sur les vrais fichiers. Gardés trente jours.
 * `<habitant>/activite-lu.json` = { lu } : « Tout marquer lu ».
 *
 * 👯 Les proches : leur boîte « à revoir » (`tele-revoir.json`, qui existait) devient une ligne d'Activité.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";
import { SEAU_FIGURINES, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { maBoiteARevoir } from "./revoir-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { dossierSuiveurs, tousMesSuivis, type Suivi } from "./suivis-video-serveur";
import { cercleValide, lienDiscussion, type CercleDiscussion, type NiveauSuivi } from "./discussion-video";
import { prevenirUnHabitantAppli } from "./appli-collection-serveur";
import { NOTIF_DISCUSSION_MS, heureCalme } from "./regle-de-bruit";
import { titreCourt } from "./reactions-video";
import { ACTIVITE, PHRASES_ACTIVITE, type ActiviteVue, type LigneActivite, type SorteEvenement } from "./activite";

type Supabase = ReturnType<typeof createAdminClient>;
/** (`h` : qui a parlé, depuis le 27/11/2026 — pour sa figurine ; les fiches plus anciennes n'ont que le prénom) */
type FicheEvenement = { h?: string; prenom?: string; titre?: string; texte?: string; vocal?: boolean; groupe?: string };
/** (👥 lot A6 : `cercle` « groupe », et son id) */
type Evenement = { nom: string; le: number; cercle: CercleDiscussion | "groupe"; groupe?: string; video: string; q: string; sorte: SorteEvenement };
/** Le morceau du nom qui dit la discussion : « proches », « tous », ou l'id du groupe. */
const segment = (e: { cercle: CercleDiscussion | "groupe"; groupe?: string }) => (e.cercle === "groupe" ? s(e.groupe) : e.cercle);
const ID_GROUPE = /^g-\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const JOUR_MS = 24 * 3600_000;
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const dossierActivite = (h: string) => `${h}/activite`;
const cheminLu = (h: string) => `${h}/activite-lu.json`;

function lireNom(nom: string): Evenement | null {
  const m = /^(\d{13})\.([a-z]+|g-\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6})\.([A-Za-z0-9_-]{11})\.([A-Za-z0-9_-]{4,16})\.([rn])(?:\.[0-9a-f]{4})?\.json$/.exec(nom);
  if (!m) return null;
  const base = { nom, le: Number(m[1]), video: m[3], q: m[4], sorte: m[5] as SorteEvenement };
  if (ID_GROUPE.test(m[2])) return { ...base, cercle: "groupe", groupe: m[2] };
  const cercle = cercleValide(m[2]);
  return cercle ? { ...base, cercle } : null;
}

/**
 * ✍️ Quelqu'un vient d'intervenir dans une discussion : ↩ celui à qui il répond (toujours, même s'il ne la suit plus) ;
 * 💬 ceux qui la suivent (🔔 ou 🤫, cent au plus). Jamais lui-même.
 */
export async function prevenirLaDiscussion(
  supabase: Supabase,
  auteur: string,
  o: {
    cercle: CercleDiscussion | "groupe";
    tranche: string;
    video: string;
    titre: string;
    prenom: string;
    texte?: string;
    vocal?: boolean;
    repondA?: string;
    /** 👥 (lot A6) le groupe, et ses membres à prévenir (leur niveau : celui qu'ils ont choisi, sinon 🔔) */
    groupe?: { id: string; nom: string; membres: { h: string; niveau: NiveauSuivi }[] };
  },
): Promise<string[]> {
  if (!ID_VIDEO.test(o.video) || (o.cercle === "groupe" && !ID_GROUPE.test(s(o.groupe?.id)))) return [];
  const q = qui8(auteur);
  const pour = new Map<string, SorteEvenement>();
  if (o.repondA && o.repondA !== auteur) pour.set(o.repondA, "r");
  let suiveurs: { h?: string; niveau?: string }[];
  if (o.cercle === "groupe") suiveurs = o.groupe?.membres ?? [];
  else {
    const dossier = dossierSuiveurs(o.cercle, o.tranche, o.video);
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: ACTIVITE.suiveursMax + 1, sortBy: { column: "name", order: "asc" } });
    const noms = ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n.endsWith(".json") && n !== `${q}.json`);
    suiveurs = await Promise.all(noms.slice(0, ACTIVITE.suiveursMax).map((n) => lireJson<{ h?: string; niveau?: string }>(supabase, `${dossier}/${n}`).catch(() => ({}) as { h?: string; niveau?: string })));
  }
  for (const x of suiveurs) {
    const h = s(x.h);
    if (h && h !== auteur && (x.niveau === "prevenir" || x.niveau === "discret") && !pour.has(h)) pour.set(h, "n");
  }
  const le = Date.now();
  const fiche: FicheEvenement = { h: auteur, prenom: o.prenom, titre: o.titre, ...(o.texte ? { texte: o.texte } : {}), ...(o.vocal ? { vocal: true } : {}), ...(o.groupe ? { groupe: o.groupe.nom } : {}) };
  const ou = { cercle: o.cercle, ...(o.groupe ? { groupe: o.groupe.id } : {}) };
  await Promise.all(
    [...pour].map(([h, sorte]) => ecrireJson(supabase, `${dossierActivite(h)}/${le}.${segment(ou)}.${o.video}.${q}.${sorte}.${randomBytes(2).toString("hex")}.json`, fiche).catch(() => false)),
  );
  // (📱 lot A5 : puis le téléphone, selon la règle de bruit)
  const niveaux = new Map(suiveurs.map((x) => [s(x.h), niveauDe(x.niveau)] as const));
  await Promise.all([...pour].map(([h, sorte]) => sonnerLeTelephone(supabase, h, { q, cercle: o.cercle, video: o.video, titre: o.titre, prenom: o.prenom, texte: o.texte, vocal: o.vocal, ...(o.groupe ? { groupe: o.groupe.id, groupeNom: o.groupe.nom } : {}), sorte, niveau: niveaux.get(h) ?? null, le }).catch(() => "rien")));
  return [...pour.keys()];
}

/** 🙈 (lot A7) ceux que je ne veux plus voir (la liste des salons, `<h>/salons-caches.json`) ; jamais entre proches. */
async function mesCachesA(supabase: Supabase, h: string): Promise<Set<string>> {
  const f = await lireJson<{ qs?: unknown[] }>(supabase, `${h}/salons-caches.json`).catch(() => ({}) as { qs?: unknown[] });
  return new Set((Array.isArray(f.qs) ? f.qs : []).map((x) => s(x)));
}

const niveauDe = (x: unknown): NiveauSuivi | null => (x === "prevenir" || x === "discret" || x === "non" ? x : null);
const cheminVague = (h: string, seg: string, video: string) => `${h}/vagues/${seg}.${video}.json`;

/**
 * 📱 (lot A5) LE TÉLÉPHONE, après Activité — la matrice : ↩ une réponse directe sonne en 🔔 et en 🤫 (pas en 🔕 : Activité
 * seulement) ; 💬 du nouveau sonne seulement en 🔔. La règle de bruit (`regle-de-bruit.ts`) : rien de 22 h à 9 h ; une
 * vague par discussion toutes les deux heures ; une réponse directe peut passer devant la vague, une fois par vague ; la
 * suivante remplace la précédente (le même `tag`). Pas si je viens de l'ouvrir (deux minutes). Les interrupteurs :
 * « Quand on me répond », « Les discussions que je suis ».
 */
async function sonnerLeTelephone(
  supabase: Supabase,
  h: string,
  o: { q: string; cercle: CercleDiscussion | "groupe"; groupe?: string; groupeNom?: string; video: string; titre: string; prenom: string; texte?: string; vocal?: boolean; sorte: SorteEvenement; niveau: NiveauSuivi | null; le: number },
): Promise<"envoye" | "rien"> {
  if (heureCalme(o.le)) return "rien";
  if (o.sorte === "n" && o.niveau !== "prevenir") return "rien";
  const seg = segment(o);
  const suivi = (await tousMesSuivis(supabase, h))[`${seg}:${o.video}`];
  if (o.sorte === "r" && suivi?.niveau === "non") return "rien";
  if (o.le - (Number(suivi?.lu) || 0) < 2 * 60_000) return "rien";
  if (o.cercle !== "proches" && (await mesCachesA(supabase, h)).has(o.q)) return "rien";
  const chemin = cheminVague(h, seg, o.video);
  const v = await lireJson<{ le?: number; rep?: boolean }>(supabase, chemin).catch(() => ({}) as { le?: number; rep?: boolean });
  const dansLaVague = o.le - (Number(v.le) || 0) < NOTIF_DISCUSSION_MS;
  const titre = titreCourt(o.titre);
  const dit = o.vocal ? PHRASES_ACTIVITE.vocal : o.texte ? `« ${o.texte} »` : "";
  let notif: { titre: string; corps: string };
  if (o.sorte === "r") {
    if (dansLaVague && v.rep) return "rien";
    await ecrireJson(supabase, chemin, { le: dansLaVague ? Number(v.le) : o.le, rep: true });
    notif = { titre: PHRASES_ACTIVITE.aRepondu(o.prenom), corps: [dit, titre].filter(Boolean).join(" · ") };
  } else {
    if (dansLaVague) return "rien";
    await ecrireJson(supabase, chemin, { le: o.le, rep: false });
    // (combien de nouveaux : de vrais fichiers, depuis que je l'ai lue)
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossierActivite(h), { limit: ACTIVITE.evenementsMax, sortBy: { column: "name", order: "desc" } });
    const lu = Number(suivi?.lu) || 0;
    const n = ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => lireNom(s(f.name))).filter((e) => e && segment(e) === seg && e.video === o.video && e.le > lu).length;
    // (👥 un groupe : « 👥 Les copains · 4 nouveaux mots », « Zoé : … · La finale »)
    notif = o.groupeNom
      ? { titre: PHRASES_ACTIVITE.vagueGroupe(o.groupeNom, Math.max(1, n)), corps: `${o.prenom} : ${dit || "…"} · ${titre}` }
      : { titre: PHRASES_ACTIVITE.vague(Math.max(1, n), titre), corps: `${o.prenom} : ${dit || "…"}` };
  }
  const genre = o.sorte === "r" ? "repondu" : o.cercle === "groupe" ? "proches" : "suivies";
  return prevenirUnHabitantAppli(supabase, h, { ...notif, url: lienDiscussion(o.video, o.cercle, undefined, o.groupe), tag: `discussion-${seg}-${o.video}` }, genre);
}

/** 🛎️ Mon activité : une ligne par discussion. `compter` : seulement combien ont du nouveau (sans ouvrir un fichier). */
export async function monActivite(supabase: Supabase, h: string, o: { compter?: boolean } = {}): Promise<ActiviteVue> {
  const maintenant = Date.now();
  const [liste, suivis, luFiche, boite, caches] = await Promise.all([
    supabase.storage.from(SEAU_FIGURINES).list(dossierActivite(h), { limit: ACTIVITE.evenementsMax, sortBy: { column: "name", order: "desc" } }),
    tousMesSuivis(supabase, h),
    lireJson<{ lu?: number }>(supabase, cheminLu(h)).catch(() => ({}) as { lu?: number }),
    maBoiteARevoir(supabase, h).catch(() => []),
    mesCachesA(supabase, h),
  ]);
  const luGlobal = Number(luFiche.lu) || 0;
  const evenements = ((Array.isArray(liste.data) ? liste.data : []) as { name?: string }[]).map((f) => lireNom(s(f.name))).filter((x): x is Evenement => Boolean(x));
  // (trente jours, puis effacés)
  const vieux = evenements.filter((e) => maintenant - e.le > ACTIVITE.gardeJours * JOUR_MS);
  if (vieux.length) void supabase.storage.from(SEAU_FIGURINES).remove(vieux.map((e) => `${dossierActivite(h)}/${e.nom}`)).then(() => undefined, () => undefined);
  const luDe = (c: string, video: string): { lu: number; suivi?: Suivi } => {
    const suivi = suivis[`${c}:${video}`];
    return { lu: Math.max(luGlobal, Number(suivi?.lu) || 0), suivi };
  };

  // (regroupées par discussion ; 🔕 plus suivie : seulement les réponses directes)
  const groupes = new Map<string, Evenement[]>();
  for (const e of evenements) {
    if (maintenant - e.le > ACTIVITE.gardeJours * JOUR_MS) continue;
    if (luDe(segment(e), e.video).suivi?.niveau === "non" && e.sorte !== "r") continue;
    if (e.cercle !== "proches" && caches.has(e.q)) continue;
    const cle = `${segment(e)}:${e.video}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), e]);
  }
  const lignes: LigneActivite[] = [];
  for (const [cle, l] of groupes) {
    const { cercle, video, groupe } = l[0];
    const { lu, suivi } = luDe(segment(l[0]), video);
    const neufs = l.filter((e) => e.le > lu);
    lignes.push({ cle, cercle, video, ...(groupe ? { groupe: { id: groupe, nom: "" } } : {}), titre: s(suivi?.titre), le: l[0].le, neuf: neufs.length > 0, nouveaux: neufs.length, prenoms: [] });
  }
  // (👯 ce que mes proches ont dit d'une vidéo que j'ai vue : ma boîte « à revoir »)
  for (const x of boite) {
    const { lu, suivi } = luDe("proches", x.id);
    if (suivi?.niveau === "non" || groupes.has(`proches:${x.id}`)) continue;
    lignes.push({ cle: `proches:${x.id}`, cercle: "proches", video: x.id, titre: x.titre, le: x.le, neuf: x.le > lu, nouveaux: x.le > lu ? x.n : 0, prenoms: x.de.slice(-3).reverse(), ...(x.dernierH ? { qui: x.dernierH } : {}) });
  }
  const nouveau = lignes.filter((x) => x.neuf).length;
  if (o.compter) return { lignes: [], nouveau };

  // (les réponses directes nouvelles en haut, puis le nouveau, puis le déjà vu ; le plus récent d'abord)
  const segLigne = (x: LigneActivite) => (x.groupe ? x.groupe.id : x.cercle);
  const aReponse = (x: LigneActivite) => (groupes.get(x.cle) ?? []).some((e) => e.sorte === "r" && e.le > luDe(segLigne(x), x.video).lu);
  lignes.sort((a, b) => Number(b.neuf && aReponse(b)) - Number(a.neuf && aReponse(a)) || Number(b.neuf) - Number(a.neuf) || b.le - a.le);
  const montrees = lignes.slice(0, ACTIVITE.lignesMax);
  await Promise.all(
    montrees.map(async (x) => {
      const l = groupes.get(x.cle);
      if (!l) return;
      const lu = luDe(segLigne(x), x.video).lu;
      // (les prénoms : le dernier événement de chacun, trois au plus ; et la réponse la plus récente)
      const parQui: Evenement[] = [];
      for (const e of l) if (!parQui.some((p) => p.q === e.q) && parQui.length < 3) parQui.push(e);
      const rep = l.find((e) => e.sorte === "r" && e.le > lu);
      const lus = await Promise.all([...new Set([...parQui, ...(rep ? [rep] : [])])].map(async (e) => [e.nom, await lireJson<FicheEvenement>(supabase, `${dossierActivite(h)}/${e.nom}`).catch(() => ({}) as FicheEvenement)] as const));
      const fiches = new Map(lus);
      const texteDe = (f?: FicheEvenement) => (f?.vocal ? undefined : s(f?.texte) || undefined);
      x.prenoms = parQui.map((e) => s(fiches.get(e.nom)?.prenom) || "Quelqu’un");
      const dernier = fiches.get(l[0].nom);
      x.dernier = { prenom: x.prenoms[0] ?? "Quelqu’un", ...(texteDe(dernier) ? { texte: texteDe(dernier) } : {}) };
      if (rep) {
        const f = fiches.get(rep.nom);
        x.reponse = { prenom: s(f?.prenom) || "Quelqu’un", ...(texteDe(f) ? { texte: texteDe(f) } : {}) };
      }
      // (sa figurine : celui qui m'a répondu, sinon le dernier qui a parlé)
      const qui = s((rep ? fiches.get(rep.nom) : dernier)?.h);
      if (qui) x.qui = qui;
      if (!x.titre) x.titre = s(dernier?.titre) || s(lus.map(([, f]) => s(f.titre)).find(Boolean));
      if (x.groupe) x.groupe.nom = s(lus.map(([, f]) => s(f.groupe)).find(Boolean)) || "Ton groupe";
    }),
  );
  // (🧸 27/11/2026 : la figurine de la personne, une fois par personne ; sans figurine, l'écran montre son initiale)
  const gardees = montrees.filter((x) => x.titre);
  const qui = [...new Set(gardees.map((x) => s(x.qui)).filter(Boolean))];
  const figurines = new Map(await Promise.all(qui.map(async (q) => [q, s((await figurineDeLaMaison(supabase, q).catch(() => null))?.src)] as const)));
  for (const x of gardees) {
    const src = x.qui ? figurines.get(x.qui) : "";
    delete x.qui;
    if (src) x.figurine = src;
  }
  return { lignes: gardees, nouveau };
}

/** ✓ Tout marquer lu. */
export async function toutMarquerLu(supabase: Supabase, h: string): Promise<void> {
  await ecrireJson(supabase, cheminLu(h), { lu: Date.now() });
}
