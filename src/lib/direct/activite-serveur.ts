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
import { cleSuivi, dossierSuiveurs, tousMesSuivis, type Suivi } from "./suivis-video-serveur";
import { cercleValide, type CercleDiscussion } from "./discussion-video";
import { ACTIVITE, type ActiviteVue, type LigneActivite, type SorteEvenement } from "./activite";

type Supabase = ReturnType<typeof createAdminClient>;
type FicheEvenement = { prenom?: string; titre?: string; texte?: string; vocal?: boolean };
type Evenement = { nom: string; le: number; cercle: CercleDiscussion; video: string; q: string; sorte: SorteEvenement };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const JOUR_MS = 24 * 3600_000;
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const dossierActivite = (h: string) => `${h}/activite`;
const cheminLu = (h: string) => `${h}/activite-lu.json`;

function lireNom(nom: string): Evenement | null {
  const m = /^(\d{13})\.([a-z]+)\.([A-Za-z0-9_-]{11})\.([A-Za-z0-9_-]{4,16})\.([rn])(?:\.[0-9a-f]{4})?\.json$/.exec(nom);
  const cercle = m ? cercleValide(m[2]) : null;
  return m && cercle ? { nom, le: Number(m[1]), cercle, video: m[3], q: m[4], sorte: m[5] as SorteEvenement } : null;
}

/**
 * ✍️ Quelqu'un vient d'intervenir dans une discussion : ↩ celui à qui il répond (toujours, même s'il ne la suit plus) ;
 * 💬 ceux qui la suivent (🔔 ou 🤫, cent au plus). Jamais lui-même.
 */
export async function prevenirLaDiscussion(
  supabase: Supabase,
  auteur: string,
  o: { cercle: CercleDiscussion; tranche: string; video: string; titre: string; prenom: string; texte?: string; vocal?: boolean; repondA?: string },
): Promise<string[]> {
  if (!ID_VIDEO.test(o.video)) return [];
  const q = qui8(auteur);
  const pour = new Map<string, SorteEvenement>();
  if (o.repondA && o.repondA !== auteur) pour.set(o.repondA, "r");
  const dossier = dossierSuiveurs(o.cercle, o.tranche, o.video);
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: ACTIVITE.suiveursMax + 1, sortBy: { column: "name", order: "asc" } });
  const noms = ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n.endsWith(".json") && n !== `${q}.json`);
  const suiveurs = await Promise.all(noms.slice(0, ACTIVITE.suiveursMax).map((n) => lireJson<{ h?: string; niveau?: string }>(supabase, `${dossier}/${n}`).catch(() => ({}) as { h?: string; niveau?: string })));
  for (const x of suiveurs) {
    const h = s(x.h);
    if (h && h !== auteur && (x.niveau === "prevenir" || x.niveau === "discret") && !pour.has(h)) pour.set(h, "n");
  }
  const le = Date.now();
  const fiche: FicheEvenement = { prenom: o.prenom, titre: o.titre, ...(o.texte ? { texte: o.texte } : {}), ...(o.vocal ? { vocal: true } : {}) };
  await Promise.all(
    [...pour].map(([h, sorte]) => ecrireJson(supabase, `${dossierActivite(h)}/${le}.${o.cercle}.${o.video}.${q}.${sorte}.${randomBytes(2).toString("hex")}.json`, fiche).catch(() => false)),
  );
  return [...pour.keys()];
}

/** 🛎️ Mon activité : une ligne par discussion. `compter` : seulement combien ont du nouveau (sans ouvrir un fichier). */
export async function monActivite(supabase: Supabase, h: string, o: { compter?: boolean } = {}): Promise<ActiviteVue> {
  const maintenant = Date.now();
  const [liste, suivis, luFiche, boite] = await Promise.all([
    supabase.storage.from(SEAU_FIGURINES).list(dossierActivite(h), { limit: ACTIVITE.evenementsMax, sortBy: { column: "name", order: "desc" } }),
    tousMesSuivis(supabase, h),
    lireJson<{ lu?: number }>(supabase, cheminLu(h)).catch(() => ({}) as { lu?: number }),
    maBoiteARevoir(supabase, h).catch(() => []),
  ]);
  const luGlobal = Number(luFiche.lu) || 0;
  const evenements = ((Array.isArray(liste.data) ? liste.data : []) as { name?: string }[]).map((f) => lireNom(s(f.name))).filter((x): x is Evenement => Boolean(x));
  // (trente jours, puis effacés)
  const vieux = evenements.filter((e) => maintenant - e.le > ACTIVITE.gardeJours * JOUR_MS);
  if (vieux.length) void supabase.storage.from(SEAU_FIGURINES).remove(vieux.map((e) => `${dossierActivite(h)}/${e.nom}`)).then(() => undefined, () => undefined);
  const luDe = (c: CercleDiscussion, video: string): { lu: number; suivi?: Suivi } => {
    const suivi = suivis[cleSuivi(c, video)];
    return { lu: Math.max(luGlobal, Number(suivi?.lu) || 0), suivi };
  };

  // (regroupées par discussion ; 🔕 plus suivie : seulement les réponses directes)
  const groupes = new Map<string, Evenement[]>();
  for (const e of evenements) {
    if (maintenant - e.le > ACTIVITE.gardeJours * JOUR_MS) continue;
    if (luDe(e.cercle, e.video).suivi?.niveau === "non" && e.sorte !== "r") continue;
    const cle = `${e.cercle}:${e.video}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), e]);
  }
  const lignes: LigneActivite[] = [];
  for (const [cle, l] of groupes) {
    const { cercle, video } = l[0];
    const { lu, suivi } = luDe(cercle, video);
    const neufs = l.filter((e) => e.le > lu);
    lignes.push({ cle, cercle, video, titre: s(suivi?.titre), le: l[0].le, neuf: neufs.length > 0, nouveaux: neufs.length, prenoms: [] });
  }
  // (👯 ce que mes proches ont dit d'une vidéo que j'ai vue : ma boîte « à revoir »)
  for (const x of boite) {
    const { lu, suivi } = luDe("proches", x.id);
    if (suivi?.niveau === "non" || groupes.has(`proches:${x.id}`)) continue;
    lignes.push({ cle: `proches:${x.id}`, cercle: "proches", video: x.id, titre: x.titre, le: x.le, neuf: x.le > lu, nouveaux: x.le > lu ? x.n : 0, prenoms: x.de.slice(-3).reverse() });
  }
  const nouveau = lignes.filter((x) => x.neuf).length;
  if (o.compter) return { lignes: [], nouveau };

  // (les réponses directes nouvelles en haut, puis le nouveau, puis le déjà vu ; le plus récent d'abord)
  const aReponse = (x: LigneActivite) => (groupes.get(x.cle) ?? []).some((e) => e.sorte === "r" && e.le > luDe(x.cercle, x.video).lu);
  lignes.sort((a, b) => Number(b.neuf && aReponse(b)) - Number(a.neuf && aReponse(a)) || Number(b.neuf) - Number(a.neuf) || b.le - a.le);
  const montrees = lignes.slice(0, ACTIVITE.lignesMax);
  await Promise.all(
    montrees.map(async (x) => {
      const l = groupes.get(x.cle);
      if (!l) return;
      const lu = luDe(x.cercle, x.video).lu;
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
      if (!x.titre) x.titre = s(dernier?.titre) || s(lus.map(([, f]) => s(f.titre)).find(Boolean));
    }),
  );
  return { lignes: montrees.filter((x) => x.titre), nouveau };
}

/** ✓ Tout marquer lu. */
export async function toutMarquerLu(supabase: Supabase, h: string): Promise<void> {
  await ecrireJson(supabase, cheminLu(h), { lu: Date.now() });
}
