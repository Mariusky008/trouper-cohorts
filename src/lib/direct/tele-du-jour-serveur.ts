/**
 * 📺 MA TÉLÉ DU JOUR, CÔTÉ SERVEUR (`tele-du-jour.ts` ; `docs/univers/decouvrir.md`, section 4.2 ; le lot D1).
 *
 *   - ce qui m'attend : les sélections de la nuit de mes passions (celles des 15-17 ans si je n'ai pas déclaré mes 18
 *     ans), celles de la veille tant que la nuit n'est pas passée, mêlées selon mes poids, sans ce que j'ai vu ;
 *   - une vidéo vue (jusqu'au bout, ou passée) : elle ne revient plus, et son thème monte ou descend ;
 *   - 📌 Garder : elle va à la télé de ma maison (« Ajouter chez moi », un clip — `ajouterChezMoi`) ;
 *   - 📤 Envoyer à un proche : un message écrit dans notre conversation (son titre, son lien), mis sur la télé de notre
 *     duo (`mettreALaTele`) ; la notification part après la réponse (`apresEcrit`).
 *
 * `<habitant>/tele-du-jour.json` = { vues: les identifiants vus (les 400 derniers), jour, aujourdhui, gardees }.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourAvant, jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { sesDixHuitAns } from "./majorite-serveur";
import { themeDe, themesPour, type IdTheme, type VideoDuJour } from "./decouvrir";
import { lireSelection } from "./selection-serveur";
import { changerPoids, lirePassions } from "./passions-serveur";
import { figurineDeLaMaison, lireSaPiece, sceneDeLaMaison } from "./ma-maison-serveur";
import { ajouterChezMoi } from "./etagere-serveur";
import { ecrireMessage, type ApresEcrit } from "./ecrit-serveur";
import { mettreALaTele } from "./tele-serveur";
import { surYouTube } from "./tele";
import { TELE_DU_JOUR, melanger, type TeleDuJour, type VideoTele } from "./tele-du-jour";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cheminTeleDuJour = (h: string) => `${h}/tele-du-jour.json`;
type FicheTeleDuJour = { vues?: string[]; jour?: string; aujourdhui?: number; gardees?: string[] };
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;

/** Les sélections de mes passions : celles d'aujourd'hui, sinon celles d'hier (la nuit n'est pas encore passée). */
async function sesSelections(supabase: Supabase, h: string): Promise<{ passions: IdTheme[]; poids: Record<string, number>; listes: { theme: IdTheme; videos: VideoDuJour[] }[] }> {
  const [p, adulte] = await Promise.all([lirePassions(supabase, h), sesDixHuitAns(supabase, h)]);
  const permis = new Set(themesPour(adulte).map((t) => t.id as string));
  const passions = (p?.passions ?? []).filter((id) => permis.has(id)) as IdTheme[];
  const jour = jourParis();
  const listes = await Promise.all(
    passions.map(async (theme) => {
      // (les 15-17 ans ont leur sélection, au filtre strict de YouTube ; le salon des jeunes parents n'en a qu'une)
      const jeunes = adulte !== true && !themeDe(theme)?.adultes;
      const sel = (await lireSelection(supabase, jour, theme, jeunes)) ?? (await lireSelection(supabase, jourAvant(jour, 1), theme, jeunes));
      return { theme, videos: sel?.videos ?? [] };
    }),
  );
  return { passions, poids: p?.poids ?? {}, listes };
}

async function lireFiche(supabase: Supabase, h: string): Promise<FicheTeleDuJour> {
  return lireJson<FicheTeleDuJour>(supabase, cheminTeleDuJour(h)).catch(() => ({}));
}

/** 📺 Ma télé du jour : ce qui m'attend, ma pièce, ma figurine. */
export async function maTeleDuJour(supabase: Supabase, h: string): Promise<TeleDuJour> {
  const [{ passions, poids, listes }, fiche, piece, figurine] = await Promise.all([
    sesSelections(supabase, h),
    lireFiche(supabase, h),
    lireSaPiece(supabase, h).catch(() => null),
    figurineDeLaMaison(supabase, h).catch(() => null),
  ]);
  const scene = piece ? await sceneDeLaMaison(supabase, piece).catch(() => null) : null;
  const videos = melanger(listes, poids, new Set(fiche.vues ?? []));
  const rien = listes.every((l) => !l.videos.length);
  return {
    passions,
    videos,
    vuesAujourdhui: fiche.jour === jourParis() ? Number(fiche.aujourdhui) || 0 : 0,
    scene,
    figurine,
    ...(passions.length && rien ? { vide: true as const } : {}),
  };
}

/** Une vidéo de ma télé (aujourd'hui ou hier, dans mes passions) ; sinon `null` — on n'envoie, ne garde ni ne réagit à autre chose. */
export async function maVideo(supabase: Supabase, h: string, id: unknown): Promise<VideoTele | null> {
  const i = s(id);
  if (!ID_VIDEO.test(i)) return null;
  const { listes } = await sesSelections(supabase, h);
  for (const l of listes) {
    const v = l.videos.find((x) => x.id === i);
    if (v) return { ...v, theme: l.theme };
  }
  return null;
}

/** Je l'ai déjà vue (elle est dans mes vues) : « 💬 Ce qui s'est dit » montre tout (le lot D2b, deuxième partie). */
export async function dejaVue(supabase: Supabase, h: string, id: string): Promise<boolean> {
  return ((await lireFiche(supabase, h)).vues ?? []).includes(id);
}

/**
 * 👀 Une vidéo vue : elle ne revient plus ; jusqu'au bout, son thème monte ; passée avant 15 secondes, il descend
 * (une vidéo qui ne se lit pas ici ne compte pas : `illisible`).
 */
export async function noterVue(supabase: Supabase, h: string, id: unknown, o: { fin?: unknown; secondes?: unknown; illisible?: unknown }): Promise<Resultat<{ ok?: true }>> {
  const v = await maVideo(supabase, h, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const fiche = await lireFiche(supabase, h);
  const jour = jourParis();
  const deja = (fiche.vues ?? []).includes(v.id);
  const vues = [...(fiche.vues ?? []).filter((x) => x !== v.id), v.id].slice(-TELE_DU_JOUR.vuesGardees);
  const aujourdhui = (fiche.jour === jour ? Number(fiche.aujourdhui) || 0 : 0) + (deja ? 0 : 1);
  if (!(await ecrireJson(supabase, cheminTeleDuJour(h), { ...fiche, vues, jour, aujourdhui } satisfies FicheTeleDuJour))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  if (o.illisible !== true && !deja) {
    if (o.fin === true) await changerPoids(supabase, h, v.theme, "fin");
    else if (Number(o.secondes) >= 0 && Number(o.secondes) < TELE_DU_JOUR.passeeAvant) await changerPoids(supabase, h, v.theme, "passee");
  }
  return { ok: true };
}

/** 📌 Garder : elle va à la télé de ma maison (un clip, son lien YouTube) ; son thème monte. */
export async function garderVideo(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ ok?: true; deja?: true }>> {
  const v = await maVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const fiche = await lireFiche(supabase, moi.id);
  if ((fiche.gardees ?? []).includes(v.id)) return { ok: true, deja: true };
  const r = await ajouterChezMoi(supabase, moi, { quoi: "clip", titre: v.titre, lien: surYouTube(v.id), mot: `Vu sur ma télé du jour · ${v.chaine}` });
  if (r.error) return { error: r.error, statut: r.statut };
  await ecrireJson(supabase, cheminTeleDuJour(moi.id), { ...fiche, gardees: [...(fiche.gardees ?? []), v.id].slice(-TELE_DU_JOUR.vuesGardees) } satisfies FicheTeleDuJour);
  await changerPoids(supabase, moi.id, v.theme, "garde");
  return { ok: true };
}

/**
 * 📤 Envoyer à un proche (sa clé) : un message écrit dans notre conversation (« 🎬 le titre », le lien), qui passe sur la
 * télé de notre duo. `apres` : la notification et l'aperçu du lien, à faire après la réponse (`apresEcrit`).
 */
export async function envoyerVideo(supabase: Supabase, moi: Habitant, id: unknown, cle: unknown): Promise<Resultat<{ ok?: true; apres?: ApresEcrit }>> {
  const v = await maVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const e = await ecrireMessage(supabase, moi, cle, `🎬 ${v.titre} ${surYouTube(v.id)}`, null);
  if (!e.message) return { error: e.error, statut: e.statut };
  // (sur la télé de notre duo : si elle refuse — un message qui ne passe pas —, le message reste quand même envoyé)
  await mettreALaTele(supabase, moi, cle, e.message.id).catch(() => null);
  return { ok: true, ...(e.apres ? { apres: e.apres } : {}) };
}
