/**
 * ⏪ LE RATTRAPAGE D'UNE SÉANCE, CÔTÉ SERVEUR (`docs/univers/rattrapage.md`, lot T1 : noter la séance).
 *
 * Rangement (un fichier par personne et par chose, comme partout ; `<cle>` : voir `rattrapage.ts`) :
 *   · `groupes/seances/<cle>.json` : la séance (son nom, son emoji, son heure, les vidéos de sa télé), écrite par le
 *     premier qui y entre ;
 *   · `groupes/seances/<cle>/la/<q>.json` : j'y étais (mon prénom, ma figurine), écrit en entrant ;
 *   · `groupes/seances/<cle>/traces/<ms>-<q>-<hex>.json` : une réaction ou un mot, avec la vidéo et sa seconde ;
 *   · `groupes/seance-en-cours/<q>.json` : la séance où je suis en ce moment (sa clé, son salon, jusqu'à quand) — ce que
 *     j'écris au salon y est noté tant qu'elle dure.
 * Une séance de plus de sept jours s'efface quand on relit la liste de son groupe.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";
import type { Habitant } from "./habitant";
import { SEAU_FIGURINES, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { OUVERT_APRES_MS, OUVERT_AVANT_MS, type PlaceGroupe } from "./groupes";
import { cleSeanceValide, ECART_RATTRAPAGE_MS, PAR_MINUTE_RATTRAPAGE, grandMoment, ouValide, partsDeLaSeance, PHRASES_RATTRAPAGE, RATTRAPAGE_MS, TRACES_MAX, type SeanceARattraper, type SeanceResumee, type TraceSeance, type VideoDeLaSeance } from "./rattrapage";
import { positionTele } from "./salons-ouverts";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

const RACINE = "groupes/seances";
export const cheminSeance = (cle: string) => `${RACINE}/${cle}.json`;
export const dossierLa = (cle: string) => `${RACINE}/${cle}/la`;
export const dossierTraces = (cle: string) => `${RACINE}/${cle}/traces`;
const cheminEnCours = (q: string) => `groupes/seance-en-cours/${q}.json`;
/** (les vidéos de la télé gardées avec la séance, au plus) */
const VIDEOS_MAX = 24;

/** La séance, dans le seau. */
export type FicheSeance = { cle: string; nom: string; e: string; quand: number; theme?: string; videos: VideoDeLaSeance[]; le: number };
type FicheLa = PlaceGroupe & { h: string; le: number };
type FicheEnCours = { cle: string; salon: string; jusqua: number };
export type FicheTrace = TraceSeance & { h: string; src?: string };

async function lister(supabase: Supabase, dossier: string, limite = 100): Promise<string[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: limite, sortBy: { column: "name", order: "asc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n.endsWith(".json"));
}
const videoPropre = (v: Partial<VideoDeLaSeance> | null | undefined): VideoDeLaSeance | null =>
  v && s(v.id) ? { id: s(v.id), titre: s(v.titre), chaine: s(v.chaine), duree: Math.max(0, Math.round(Number(v.duree) || 0)) } : null;

/**
 * 🛋️ J'entre dans une séance (le salon du groupe à l'heure d'un rendez-vous, ou « ▶ Entrer » d'un essai) : la séance
 * est notée (une fois), j'y étais, et ce que j'écris dans `salon` jusqu'à la fin y sera noté.
 */
export async function entrerDansLaSeance(
  supabase: Supabase,
  o: { cle: string; nom: string; e: string; theme?: string; videos: readonly Partial<VideoDeLaSeance>[]; salon: string; moi: { q: string; h: string; prenom: string; src: string } },
  maintenant = Date.now(),
): Promise<void> {
  const cle = cleSeanceValide(o.cle);
  if (!cle) return;
  const { quand } = partsDeLaSeance(cle);
  const deja = await lireJson<Partial<FicheSeance>>(supabase, cheminSeance(cle)).catch(() => ({}) as Partial<FicheSeance>);
  // (la télé de la séance : celles déjà notées d'abord, puis les nouvelles — la sélection d'un groupe change dans la soirée)
  const avant = (Array.isArray(deja.videos) ? deja.videos : []).map(videoPropre).filter((v): v is VideoDeLaSeance => Boolean(v));
  const nouvelles = o.videos.map(videoPropre).filter((v): v is VideoDeLaSeance => Boolean(v && !avant.some((x) => x.id === v.id)));
  if (deja.cle !== cle || nouvelles.length) {
    const fiche: FicheSeance = { cle, nom: s(deja.nom) || s(o.nom), e: s(deja.e) || s(o.e), quand, ...(o.theme ? { theme: o.theme } : {}), videos: [...avant, ...nouvelles].slice(0, VIDEOS_MAX), le: Number(deja.le) || maintenant };
    await ecrireJson(supabase, cheminSeance(cle), fiche);
  }
  const la: FicheLa = { q: o.moi.q, h: o.moi.h, prenom: o.moi.prenom, src: o.moi.src, le: maintenant };
  const dejaLa = await lireJson<Partial<FicheLa>>(supabase, `${dossierLa(cle)}/${o.moi.q}.json`).catch(() => ({}) as Partial<FicheLa>);
  if (dejaLa.q !== o.moi.q) await ecrireJson(supabase, `${dossierLa(cle)}/${o.moi.q}.json`, la);
  const enCours: FicheEnCours = { cle, salon: o.salon, jusqua: quand + OUVERT_APRES_MS };
  await ecrireJson(supabase, cheminEnCours(o.moi.q), enCours);
}

/**
 * ✍️ J'ai réagi ou écrit dans un salon : si j'y suis pour une séance (et qu'elle dure encore), la réaction est notée
 * avec la vidéo et sa seconde (`ou`, dit par mon téléphone). `salon` : le salon où j'écris (« groupe-… », « chez:<q> »,
 * « theme:<thème> »).
 */
export async function noterDansLaSeance(
  supabase: Supabase,
  moi: { q: string; h: string; prenom: string },
  salon: string,
  corps: { sorte: string; cle?: string; n?: number; texte?: string },
  ou: unknown,
  maintenant = Date.now(),
): Promise<void> {
  if (corps.sorte !== "reaction" && corps.sorte !== "texte") return;
  const o = ouValide(ou);
  if (!o) return;
  const en = await lireJson<Partial<FicheEnCours>>(supabase, cheminEnCours(moi.q)).catch(() => ({}) as Partial<FicheEnCours>);
  const cle = cleSeanceValide(en.cle);
  if (!cle || s(en.salon) !== salon || !(Number(en.jusqua) > maintenant)) return;
  await ecrireTrace(supabase, cle, moi, corps, o, maintenant);
}

/** Une trace (une réaction, un mot) dans une séance. */
export async function ecrireTrace(
  supabase: Supabase,
  cle: string,
  moi: { q: string; h: string; prenom: string; src?: string },
  corps: { sorte: string; cle?: string; n?: number; texte?: string },
  o: { video: string; t: number },
  maintenant = Date.now(),
  rattrapage = false,
): Promise<FicheTrace | null> {
  const id = `${maintenant}-${moi.q}-${randomBytes(3).toString("hex")}`;
  const trace: FicheTrace = {
    id,
    q: moi.q,
    h: moi.h,
    prenom: moi.prenom || "Quelqu’un",
    sorte: corps.sorte === "texte" ? "texte" : "reaction",
    ...(corps.sorte === "texte" ? { texte: s(corps.texte) } : { cle: s(corps.cle), ...(corps.n && corps.n >= 2 ? { n: corps.n } : {}) }),
    video: o.video,
    t: o.t,
    le: maintenant,
    ...(rattrapage ? { rattrapage: true as const, ...(moi.src ? { src: moi.src } : {}) } : {}),
  };
  return (await ecrireJson(supabase, `${dossierTraces(cle)}/${id}.json`, trace)) ? trace : null;
}

/** La séance, et ceux qui y étaient. `null` si elle n'existe pas (ou plus). */
export async function lireLaSeance(supabase: Supabase, cle: string): Promise<{ fiche: FicheSeance; la: FicheLa[] } | null> {
  const f = await lireJson<Partial<FicheSeance>>(supabase, cheminSeance(cle)).catch(() => ({}) as Partial<FicheSeance>);
  if (f.cle !== cle) return null;
  const noms = await lister(supabase, dossierLa(cle), 20);
  const la = (await Promise.all(noms.map((n) => lireJson<Partial<FicheLa>>(supabase, `${dossierLa(cle)}/${n}`).catch(() => ({}) as Partial<FicheLa>))))
    .filter((x): x is FicheLa => Boolean(x.q && x.h))
    .sort((a, b) => a.le - b.le);
  const fiche: FicheSeance = { cle, nom: s(f.nom), e: s(f.e), quand: Number(f.quand) || partsDeLaSeance(cle).quand, ...(f.theme ? { theme: s(f.theme) } : {}), videos: (Array.isArray(f.videos) ? f.videos : []).map(videoPropre).filter((v): v is VideoDeLaSeance => Boolean(v)), le: Number(f.le) || 0 };
  return { fiche, la };
}

/** Les traces d'une séance, de la première à la dernière (sans le compte de chacun). */
export async function tracesDeLaSeance(supabase: Supabase, cle: string): Promise<FicheTrace[]> {
  const noms = (await lister(supabase, dossierTraces(cle), 1000)).slice(-TRACES_MAX);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FicheTrace>>(supabase, `${dossierTraces(cle)}/${n}`).catch(() => ({}) as Partial<FicheTrace>)));
  return l.filter((x): x is FicheTrace => Boolean(x.id && x.q && ouValide(x))).sort((a, b) => a.le - b.le);
}

/** Une trace, telle que l'écran la voit (sans le compte). */
export const tracePublique = (x: FicheTrace): TraceSeance => {
  const { h: _h, src: _src, ...reste } = x;
  void _h;
  void _src;
  return reste;
};

const place = (x: { q: string; prenom: string; src: string }): PlaceGroupe => ({ q: x.q, prenom: x.prenom, src: x.src });

/** Une séance en quelques mots (qui était là, qui l'a rattrapée, le grand moment). */
export async function resumeDeLaSeance(supabase: Supabase, cle: string, q: string): Promise<SeanceResumee | null> {
  const s0 = await lireLaSeance(supabase, cle);
  if (!s0) return null;
  const traces = await tracesDeLaSeance(supabase, cle);
  const la = s0.la.map(place);
  const parQ = new Map(la.map((p) => [p.q, p]));
  const rattrapee = [...new Set(traces.filter((x) => x.rattrapage && !parQ.has(x.q)).map((x) => x.q))]
    .map((x) => traces.find((y) => y.q === x))
    .filter((x): x is FicheTrace => Boolean(x))
    .map((x) => ({ q: x.q, prenom: x.prenom, src: s(x.src) }));
  const m = grandMoment(traces);
  const moment = m ? { cle: m.cle, video: m.video, t: m.t, qui: m.qui.map((x) => parQ.get(x)).filter((x): x is PlaceGroupe => Boolean(x)) } : undefined;
  return {
    cle,
    nom: s0.fiche.nom,
    e: s0.fiche.e,
    quand: s0.fiche.quand,
    la,
    rattrapee,
    ...(parQ.has(q) ? { jY: true as const } : {}),
    ...(moment && moment.qui.length ? { moment } : {}),
  };
}

/** Les séances d'un groupe (ou d'une proposition) des sept derniers jours, la plus récente d'abord ; les plus vieilles s'effacent. */
export async function seancesDe(supabase: Supabase, proprio: string, q: string, maintenant = Date.now()): Promise<SeanceResumee[]> {
  const noms = await lister(supabase, `${RACINE}/${proprio}`, 60);
  const cles = noms.map((n) => cleSeanceValide(`${proprio}/${n.replace(/\.json$/, "")}`)).filter((c): c is string => Boolean(c));
  const vieilles = cles.filter((c) => maintenant - partsDeLaSeance(c).quand > RATTRAPAGE_MS);
  if (vieilles.length) void effacerLesSeances(supabase, vieilles).catch(() => undefined);
  const recentes = cles.filter((c) => !vieilles.includes(c) && partsDeLaSeance(c).quand - OUVERT_AVANT_MS <= maintenant);
  const l = await Promise.all(recentes.map((c) => resumeDeLaSeance(supabase, c, q).catch(() => null)));
  return l.filter((x): x is SeanceResumee => Boolean(x)).sort((a, b) => b.quand - a.quand);
}

async function effacerLesSeances(supabase: Supabase, cles: string[]): Promise<void> {
  for (const cle of cles) {
    const [la, traces] = await Promise.all([lister(supabase, dossierLa(cle), 100), lister(supabase, dossierTraces(cle), 1000)]);
    const chemins = [cheminSeance(cle), ...la.map((n) => `${dossierLa(cle)}/${n}`), ...traces.map((n) => `${dossierTraces(cle)}/${n}`)];
    for (let i = 0; i < chemins.length; i += 100) await supabase.storage.from(SEAU_FIGURINES).remove(chemins.slice(i, i + 100));
  }
}

/**
 * Puis-je voir les séances de ce groupe, ou de cet essai ? Un groupe : ses membres. Un essai : celui qui propose et ceux
 * qui avaient leur place.
 */
export async function peutRattraper(supabase: Supabase, proprio: string, q: string): Promise<boolean> {
  const { estMembre, idGroupeValide } = await import("./groupes-chemins-serveur");
  if (idGroupeValide(proprio)) return estMembre(supabase, proprio, q).catch(() => false);
  const [p, place] = await Promise.all([
    lireJson<{ id?: string; q?: string }>(supabase, `groupes/propositions/${proprio}.json`).catch(() => ({}) as { id?: string; q?: string }),
    lireJson<{ q?: string }>(supabase, `groupes/places/${proprio}/${q}.json`).catch(() => ({}) as { q?: string }),
  ]);
  return p.id === proprio && (p.q === q || place.q === q);
}

type Resultat<T> = T & { error?: string; statut?: number };

/** 📋 Les séances à rattraper d'un groupe ou d'un essai (`de` : son identifiant), les sept derniers jours. */
export async function seancesPourMoi(supabase: Supabase, h: string, de: unknown, maintenant = Date.now()): Promise<Resultat<{ seances?: SeanceResumee[] }>> {
  const { qui8 } = await import("./talkie-serveur");
  const proprio = s(de);
  const q = qui8(h);
  if (!cleSeanceValide(`${proprio}/0000000000000-essai`) && !cleSeanceValide(`${proprio}/0000000000000-x`)) return { error: PHRASES_RATTRAPAGE.absente, statut: 404 };
  if (!(await peutRattraper(supabase, proprio, q))) return { error: PHRASES_RATTRAPAGE.pasLa, statut: 403 };
  return { seances: await seancesDe(supabase, proprio, q, maintenant) };
}

/**
 * ⏪ Une séance, pour la rattraper : ceux qui étaient là, ses vidéos (celles où l'on a réagi d'abord ; sinon celle qui
 * passait à son heure), ses traces, les figurines.
 */
export async function laSeanceARattraper(supabase: Supabase, moiH: Habitant, cleBrute: unknown, maintenant = Date.now()): Promise<Resultat<{ seance?: SeanceARattraper }>> {
  const { qui8 } = await import("./talkie-serveur");
  const h = moiH.id;
  const cle = cleSeanceValide(cleBrute);
  if (!cle) return { error: PHRASES_RATTRAPAGE.absente, statut: 404 };
  const parts = partsDeLaSeance(cle);
  const q = qui8(h);
  if (!(await peutRattraper(supabase, cle.split("/")[0], q))) return { error: PHRASES_RATTRAPAGE.pasLa, statut: 403 };
  if (maintenant - parts.quand > RATTRAPAGE_MS) return { error: PHRASES_RATTRAPAGE.passee, statut: 410 };
  const [resume, s0, traces] = await Promise.all([resumeDeLaSeance(supabase, cle, q), lireLaSeance(supabase, cle), tracesDeLaSeance(supabase, cle)]);
  if (!resume || !s0) return { error: PHRASES_RATTRAPAGE.absente, statut: 404 };
  const premiere = new Map<string, number>();
  for (const x of traces) if (!premiere.has(x.video)) premiere.set(x.video, x.le);
  const parId = new Map(s0.fiche.videos.map((v) => [v.id, v]));
  let videos = [...premiere.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => parId.get(id) ?? { id, titre: "", chaine: "", duree: 0 });
  if (!videos.length && s0.fiche.videos.length) {
    const p = positionTele(s0.fiche.videos, parts.quand);
    videos = [s0.fiche.videos[p?.i ?? 0]];
  }
  const figurines: Record<string, string> = {};
  for (const x of s0.la) if (x.src) figurines[x.q] = x.src;
  for (const x of traces) if (x.src && !figurines[x.q]) figurines[x.q] = x.src;
  // (les absents : les membres du groupe, ou ceux qui avaient leur place à l'essai, qui n'y étaient pas)
  const proprio = cle.split("/")[0];
  const { membresDe, idGroupeValide } = await import("./groupes-chemins-serveur");
  const possibles: PlaceGroupe[] = idGroupeValide(proprio)
    ? (await membresDe(supabase, proprio).catch(() => [])).map(place)
    : (await Promise.all((await lister(supabase, `groupes/places/${proprio}`, 20)).map((n) => lireJson<Partial<PlaceGroupe>>(supabase, `groupes/places/${proprio}/${n}`).catch(() => ({}) as Partial<PlaceGroupe>))))
        .filter((x): x is PlaceGroupe => Boolean(x.q))
        .map((x) => place({ q: x.q, prenom: s(x.prenom), src: s(x.src) }));
  const la = new Set(s0.la.map((x) => x.q));
  const absents = possibles.filter((x) => !la.has(x.q) && x.q !== q).slice(0, 8);
  const { figurineDeLaMaison } = await import("./ma-maison-serveur");
  const { prenomDe } = await import("./ma-figurine-serveur");
  const [maFigurine, monPrenom] = await Promise.all([figurineDeLaMaison(supabase, h).catch(() => null), prenomDe(supabase, moiH).catch(() => "")]);
  const moi: PlaceGroupe = { q, prenom: monPrenom || "Toi", src: maFigurine?.src ?? figurines[q] ?? "" };
  return { seance: { ...resume, videos, traces: traces.map(tracePublique), figurines, absents, moi } };
}

const cheminRythme = (q: string) => `groupes/seance-rattrapage/${q}.json`;

/**
 * ⏪ (lot T3) Réagir en décalé : une réaction (les six émotions) ou un mot (90 signes, la modération des salons), posé à
 * la seconde où j'en suis dans la vidéo — « ⏪ vu en rattrapage ». Ceux qui peuvent rattraper la séance seulement, et
 * pendant ses sept jours.
 */
export async function reagirEnDecale(supabase: Supabase, moiH: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ trace?: TraceSeance; refus?: string }>> {
  const { qui8 } = await import("./talkie-serveur");
  const { reactionDe, refusDuMessage, TEXTE_SALON_MAX } = await import("./salons-ouverts");
  const cle = cleSeanceValide(p.seance);
  if (!cle) return { error: PHRASES_RATTRAPAGE.absente, statut: 404 };
  const q = qui8(moiH.id);
  if (!(await peutRattraper(supabase, cle.split("/")[0], q))) return { error: PHRASES_RATTRAPAGE.pasLa, statut: 403 };
  if (maintenant - partsDeLaSeance(cle).quand > RATTRAPAGE_MS) return { error: PHRASES_RATTRAPAGE.passee, statut: 410 };
  const s0 = await lireLaSeance(supabase, cle);
  if (!s0) return { error: PHRASES_RATTRAPAGE.absente, statut: 404 };
  const o = ouValide(p.ou);
  if (!o) return { error: PHRASES_RATTRAPAGE.pasCetteVideo, statut: 400 };
  // (la vidéo : une de la télé de la séance, ou une où quelqu'un a déjà réagi)
  if (!s0.fiche.videos.some((v) => v.id === o.video) && !(await tracesDeLaSeance(supabase, cle)).some((x) => x.video === o.video)) return { error: PHRASES_RATTRAPAGE.pasCetteVideo, statut: 400 };
  let corps: { sorte: string; cle?: string; n?: number; texte?: string };
  if (p.sorte === "texte") {
    const texte = s(p.texte).replace(/\s+/g, " ");
    if (!texte) return { error: PHRASES_RATTRAPAGE.vide, statut: 400 };
    const refus = refusDuMessage(texte);
    if (refus) return { error: PHRASES_RATTRAPAGE.refus(refus), statut: 400, refus };
    corps = { sorte: "texte", texte: [...texte].slice(0, TEXTE_SALON_MAX).join("") };
  } else {
    const x = reactionDe(p.cle);
    if (!x) return { error: PHRASES_RATTRAPAGE.quelleReaction, statut: 400 };
    const n = Math.round(Number(p.n));
    corps = { sorte: "reaction", cle: x.cle, ...(n >= 2 && n <= 3 ? { n } : {}) };
  }
  // (le rythme : une à la fois)
  const r = await lireJson<{ ecrits?: number[] }>(supabase, cheminRythme(q)).catch(() => ({}) as { ecrits?: number[] });
  const ecrits = (Array.isArray(r.ecrits) ? r.ecrits : []).filter((x) => maintenant - x < 60_000);
  if (ecrits.length >= PAR_MINUTE_RATTRAPAGE || (ecrits.length && maintenant - Math.max(...ecrits) < ECART_RATTRAPAGE_MS)) return { error: PHRASES_RATTRAPAGE.doucement, statut: 429 };
  await ecrireJson(supabase, cheminRythme(q), { ecrits: [...ecrits, maintenant] });
  const { prenomDe } = await import("./ma-figurine-serveur");
  const { figurineDeLaMaison } = await import("./ma-maison-serveur");
  const [prenom, figurine] = await Promise.all([prenomDe(supabase, moiH).catch(() => ""), figurineDeLaMaison(supabase, moiH.id).catch(() => null)]);
  const trace = await ecrireTrace(supabase, cle, { q, h: moiH.id, prenom: prenom || "Quelqu’un", src: figurine?.src ?? "" }, corps, o, maintenant, true);
  if (!trace) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { trace: tracePublique(trace) };
}
