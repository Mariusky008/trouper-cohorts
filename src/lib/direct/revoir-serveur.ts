/**
 * 📼 REVOIR, LE SERVEUR (`revoir.ts` ; `docs/univers/decouvrir.md`, section 31) : `<habitant>/tele-historique.json` (les
 * vidéos vues, la plus récente au bout, soixante au plus) et `<habitant>/tele-revoir.json` (la boîte : les vidéos vues
 * auxquelles des amis ont réagi depuis — leurs prénoms, combien ; vidée quand je la revois).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { REVOIR, type VideoARevoir } from "./revoir";

type Supabase = ReturnType<typeof createAdminClient>;
type Vue = { id: string; titre: string; chaine: string; duree: number; le: number };
type Boite = { videos?: Record<string, { titre?: string; de?: string[]; n?: number; le?: number }> };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cheminHistorique = (h: string) => `${h}/tele-historique.json`;
const cheminBoite = (h: string) => `${h}/tele-revoir.json`;

/** (une vidéo vue : au bout de l'historique — vue de nouveau, elle y revient) */
export async function ajouterAHistorique(supabase: Supabase, h: string, v: { id: string; titre: string; chaine?: string; duree?: number }): Promise<void> {
  const f = await lireJson<{ liste?: Vue[] }>(supabase, cheminHistorique(h)).catch(() => ({}) as { liste?: Vue[] });
  const liste = (Array.isArray(f.liste) ? f.liste : []).filter((x) => s(x?.id) && x.id !== v.id);
  await ecrireJson(supabase, cheminHistorique(h), { liste: [...liste, { id: v.id, titre: s(v.titre), chaine: s(v.chaine), duree: Number(v.duree) || 0, le: Date.now() }].slice(-REVOIR.gardees) });
}

/** (un ami a réagi à une vidéo que j'ai vue : elle va dans ma boîte, avec son prénom) */
export async function noterARevoir(supabase: Supabase, h: string, v: { id: string; titre: string }, prenom: string): Promise<void> {
  const f = await lireJson<Boite>(supabase, cheminBoite(h)).catch(() => ({}) as Boite);
  const videos = { ...(f.videos ?? {}) };
  const avant = videos[v.id];
  const de = [...new Set([...(avant?.de ?? []), prenom || "Un ami"])].slice(-5);
  videos[v.id] = { titre: s(v.titre), de, n: (Number(avant?.n) || 0) + 1, le: Date.now() };
  const gardees = Object.entries(videos)
    .sort((a, b) => (Number(b[1].le) || 0) - (Number(a[1].le) || 0))
    .slice(0, REVOIR.boite);
  await ecrireJson(supabase, cheminBoite(h), { videos: Object.fromEntries(gardees) });
}

/** (je la revois : elle sort de ma boîte) */
export async function revue(supabase: Supabase, h: string, id: string): Promise<void> {
  const f = await lireJson<Boite>(supabase, cheminBoite(h)).catch(() => ({}) as Boite);
  if (!f.videos?.[id]) return;
  const videos = { ...f.videos };
  delete videos[id];
  await ecrireJson(supabase, cheminBoite(h), { videos });
}

/** 📼 Ma boîte : les vidéos vues auxquelles des amis ont réagi depuis (la plus récente d'abord). */
export async function maBoiteARevoir(supabase: Supabase, h: string): Promise<{ id: string; titre: string; de: string[]; n: number; le: number }[]> {
  const f = await lireJson<Boite>(supabase, cheminBoite(h)).catch(() => ({}) as Boite);
  return Object.entries(f.videos ?? {})
    .map(([id, x]) => ({ id, titre: s(x.titre), de: (x.de ?? []).map(s).filter(Boolean), n: Number(x.n) || 0, le: Number(x.le) || 0 }))
    .filter((x) => x.titre && x.de.length)
    .sort((a, b) => b.le - a.le);
}

/** 📼 Mon historique : les vidéos vues (la plus récente d'abord), et ce qui s'y est passé depuis. */
export async function monHistorique(supabase: Supabase, h: string): Promise<VideoARevoir[]> {
  const [f, boite] = await Promise.all([lireJson<{ liste?: Vue[] }>(supabase, cheminHistorique(h)).catch(() => ({}) as { liste?: Vue[] }), maBoiteARevoir(supabase, h)]);
  const nouveaux = new Map(boite.map((x) => [x.id, x]));
  return (Array.isArray(f.liste) ? f.liste : [])
    .filter((x) => s(x?.id) && s(x.titre))
    .reverse()
    .slice(0, REVOIR.montrees)
    .map((x) => {
      const b = nouveaux.get(x.id);
      return { id: x.id, titre: x.titre, chaine: s(x.chaine), duree: Number(x.duree) || 0, le: Number(x.le) || 0, ...(b ? { nouveaux: { n: b.n, de: b.de } } : {}) };
    });
}
