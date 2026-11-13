/**
 * 🚪 LES VISITES ET LES SOUVENIRS, CÔTÉ SERVEUR — chantier « Univers », lot 6 (`visites.ts` : la règle).
 *
 * LE SEAU, dans le dossier de celui qu'on visite :
 *   · `<h>/monde/visites.json` = { liste: [{ de, le }] } — qui est passé (les 40 derniers ; une visite par jour et par
 *     personne) ;
 *   · `<h>/monde/souvenirs.json` = { liste: [{ id, de, objet, mot?, le, accepte_le?, x?, y? }] } — hors des versions
 *     de son univers (une retouche ne les efface pas) ;
 *   · `<h>/monde/visites-vues.json` = { le, ignores? } — la dernière fois qu'il a découvert qui est passé (ce qui est
 *     nouveau) ; les inconnus dont il a ignoré la demande (leurs clés, les 200 dernières) ;
 *   · `<h>/adulte.json` = { le } — il a déclaré 18 ans ou plus (pour ouvrir son univers à tous) ;
 *   · `signalements/univers/<h>.json` = { liste: [{ de, le, quoi }] } — pour l'équipe.
 * Frapper prévient celui qu'on visite, une fois par jour (« 🚪 Léa a frappé à ta porte ») ; un cadeau aussi (« 🎁 Léa t'a
 * laissé un cadeau ») — les deux mènent à « Chez moi » (`/collection#proches`), où il les découvre (le propriétaire, le 13
 * novembre 2026 : « quand je laisse un souvenir, il va quelque part où il n'y a aucune chance qu'il soit vu […] il faut
 * que ce soit une vraie expérience de découverte »).
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { prevenirUneFoisParJour } from "./appli-collection-serveur";
import { completerMonde, lireFicheMonde } from "./fiches-serveur";
import { ecrireJson, lireJson, lireLigne, signer } from "./ma-figurine-serveur";
import { parleDAlcool } from "./meme-surprise";
import { VISIBILITES, type FicheMonde, type Visibilite } from "./monde";
import { motInterdit } from "./mots-interdits";
import { decorDuMoment, tenueDuMois } from "./saison-serveur";
import { assiseDe, hDeCle, poserProfil, seParlent } from "./talkie-serveur";
import { cleValide } from "./talkie";
import { MOT_SOUVENIR_MAX, SOUVENIRS_EN_ATTENTE_MAX, SOUVENIRS_POSES_MAX, motDeSouvenir, objetValide, type MesVisites, type SouvenirVu, type UniversPublic, type VueVisite } from "./visites";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

const cheminVisites = (h: string) => `${h}/monde/visites.json`;
const cheminSouvenirs = (h: string) => `${h}/monde/souvenirs.json`;
const cheminVues = (h: string) => `${h}/monde/visites-vues.json`;
const cheminAdulte = (h: string) => `${h}/adulte.json`;
/** Où mènent ses notifications : « Chez moi », où il découvre qui est passé et ses cadeaux. */
const CHEZ_MOI = "/collection#proches";
const cheminSignalements = (h: string) => `signalements/univers/${h}.json`;
/** 🏡 Les univers ouverts à tous (« Découvrir », lot 7) : { liste: [{ h, le }] } — les plus récents à la fin. */
const CHEMIN_PUBLICS = "univers/publics.json";

type Visite = { de: string; le: string };
type Souvenir = { id: string; de: string; objet: string; mot?: string; le: string; accepte_le?: string; x?: number; y?: number };
const lireVisites = async (supabase: Supabase, h: string) => {
  const v = await lireJson<{ liste?: Visite[] }>(supabase, cheminVisites(h));
  return Array.isArray(v.liste) ? v.liste.filter((x) => s(x?.de) && s(x?.le)) : [];
};
const lireSouvenirs = async (supabase: Supabase, h: string) => {
  const v = await lireJson<{ liste?: Souvenir[] }>(supabase, cheminSouvenirs(h));
  return Array.isArray(v.liste) ? v.liste.filter((x) => s(x?.id) && s(x?.de) && objetValide(x?.objet)) : [];
};
export const estAdulte = async (supabase: Supabase, h: string) => Boolean(s((await lireJson<{ le?: string }>(supabase, cheminAdulte(h))).le));

/** Son prénom (sa figurine d'aujourd'hui), et l'image de sa figurine : la nouvelle, assise, sinon celle d'aujourd'hui (signée une heure). */
async function quiEst(supabase: Supabase, h: string): Promise<{ prenom: string; image?: string; assise?: boolean }> {
  const [{ ligne }, assise] = await Promise.all([lireLigne(supabase, h), assiseDe(supabase, h).catch(() => undefined)]);
  const prenom = s(ligne?.prenom) || "Quelqu’un";
  if (assise) return { prenom, image: assise.n, assise: true };
  const neutre = ligne?.prete_le && s(ligne.neutre) ? await signer(supabase, s(ligne.neutre), 3600) : "";
  return { prenom, ...(neutre ? { image: neutre } : {}) };
}

/** Peut-il entrer chez lui ? (« moi » : personne ; « proches » : ses proches ; « tous » : tout le monde). */
async function peutEntrer(supabase: Supabase, visiteur: string | null, h: string, f: FicheMonde): Promise<{ ok: boolean; proche: boolean }> {
  if (visiteur === h) return { ok: true, proche: true };
  const proche = visiteur ? await seParlent(supabase, visiteur, h) : false;
  if (f.visibilite === "moi") return { ok: false, proche };
  if (f.visibilite === "proches") return { ok: proche, proche };
  return { ok: true, proche };
}

const souvenirVu = (x: Souvenir, prenom: string, qui?: { image?: string; cle?: string; univers?: boolean }): SouvenirVu => ({
  id: x.id,
  objet: objetValide(x.objet)!,
  ...(x.mot ? { mot: x.mot } : {}),
  de: prenom,
  le: x.le,
  ...(typeof x.x === "number" && typeof x.y === "number" ? { x: x.x, y: x.y } : {}),
  ...(qui?.image ? { image: qui.image } : {}),
  ...(qui?.cle ? { cle: qui.cle } : {}),
  ...(qui?.univers ? { univers: true } : {}),
});
async function prenomsDe(supabase: Supabase, ids: string[]): Promise<Map<string, string>> {
  const uniques = [...new Set(ids)];
  const l = await Promise.all(uniques.map(async (id) => [id, s((await lireLigne(supabase, id)).ligne?.prenom) || "Quelqu’un"] as const));
  return new Map(l);
}

// ─── entrer ───────────────────────────────────────────────────────────────────────────────────────
/** 🏡 Ce que voit celui qui entre chez quelqu'un (par sa clé de profil). */
export async function visiterUnivers(supabase: Supabase, visiteur: Habitant | null, cle: unknown): Promise<VueVisite> {
  const h = await hDeCle(supabase, cle);
  if (!h) return { etat: "absent" };
  const f = await lireFicheMonde(supabase, h);
  if (!f?.references.decor) return { etat: "absent" };
  const acces = await peutEntrer(supabase, visiteur?.id ?? null, h, f);
  const hote = await quiEst(supabase, h);
  if (!acces.ok) return { etat: f.visibilite === "moi" ? "ferme" : "reserve", prenom: hote.prenom };
  const [decor, assise, moi, visites, souvenirs, tenue] = await Promise.all([
    // (🍂 son décor du mois, quand il est fait ; sa figurine dans sa tenue du mois, si elle l'a méritée)
    decorDuMoment(supabase, h, f).then((d) => signer(supabase, d.chemin || f.references.decor!.chemin, 3600)),
    assiseDe(supabase, h).catch(() => undefined),
    visiteur && visiteur.id !== h ? quiEst(supabase, visiteur.id) : Promise.resolve(null),
    lireVisites(supabase, h),
    acces.proche ? lireSouvenirs(supabase, h) : Promise.resolve([] as Souvenir[]),
    tenueDuMois(supabase, h).catch(() => null),
  ]);
  if (!decor || !assise) return { etat: "absent" };
  const hotePlace = f.scene.places.find((p) => p.id === "hote") ?? { x: 0.36, y: 0.8, echelle: 1 };
  const invite = f.scene.places.find((p) => p.id === "invite") ?? { x: 0.66, y: 0.82, echelle: 0.96 };
  const poses = souvenirs.filter((x) => x.accepte_le);
  const noms = await prenomsDe(
    supabase,
    poses.map((x) => x.de),
  );
  const jour = jourParis();
  return {
    etat: "ouvert",
    prenom: hote.prenom,
    proposition: f.proposition,
    decor,
    // (📏 les deux figurines à leurs places, à la même échelle que la conversation chez soi)
    hote: { image: tenue?.n ?? assise.n, parle: tenue?.p ?? assise.p, x: hotePlace.x, y: hotePlace.y, echelle: hotePlace.echelle },
    invite: { x: invite.x, y: invite.y, echelle: invite.echelle, ...(moi?.image ? { image: moi.image, ...(moi.assise ? { assise: true } : {}) } : {}) },
    proche: acces.proche,
    // (ses clés, ses propres phrases : à ses proches seulement)
    cles: acces.proche ? f.elements.map((e) => ({ id: e.id, quoi: e.quoi, pourquoi: e.pourquoi, source: e.source, ...(e.zone ? { zone: e.zone } : {}) })) : [],
    souvenirs: poses.map((x) => souvenirVu(x, noms.get(x.de) ?? "Quelqu’un")),
    peutLaisser: Boolean(visiteur && visiteur.id !== h && acces.proche),
    frappe: Boolean(visiteur && visites.some((v) => v.de === visiteur.id && v.le.startsWith(jour))),
    mesCadeaux: visiteur ? souvenirs.filter((x) => x.de === visiteur.id && !x.accepte_le).length : 0,
    chezSoi: visiteur?.id === h,
  };
}

// ─── frapper, laisser un souvenir, signaler ───────────────────────────────────────────────────────
type Resultat = { ok?: true; error?: string; statut?: number };
async function chezQui(supabase: Supabase, visiteur: Habitant, cle: unknown): Promise<{ h?: string; f?: FicheMonde; proche?: boolean; error?: string; statut?: number }> {
  const h = await hDeCle(supabase, cle);
  if (!h) return { error: "Cet univers n’existe pas.", statut: 404 };
  if (h === visiteur.id) return { error: "C’est chez toi 🙂", statut: 400 };
  const f = await lireFicheMonde(supabase, h);
  if (!f?.references.decor) return { error: "Cet univers n’existe pas.", statut: 404 };
  const acces = await peutEntrer(supabase, visiteur.id, h, f);
  if (!acces.ok) return { error: "Cet univers est fermé.", statut: 403 };
  return { h, f, proche: acces.proche };
}

/** Sa visite, notée chez lui (une par jour et par personne) : `true` si c'est la première d'aujourd'hui. */
async function noterVisite(supabase: Supabase, de: string, h: string): Promise<boolean> {
  const jour = jourParis();
  const visites = await lireVisites(supabase, h);
  if (visites.some((v) => v.de === de && v.le.startsWith(jour))) return false;
  await ecrireJson(supabase, cheminVisites(h), { liste: [...visites, { de, le: new Date().toISOString() }].slice(-40) });
  return true;
}

/** 🚪 Frapper à la porte : il saura qui est passé (une visite par jour et par personne ; prévenu une fois par jour). */
export async function frapper(supabase: Supabase, visiteur: Habitant, cle: unknown): Promise<Resultat> {
  const c = await chezQui(supabase, visiteur, cle);
  if (!c.h) return { error: c.error, statut: c.statut };
  if (!(await noterVisite(supabase, visiteur.id, c.h))) return { ok: true };
  const { prenom } = await quiEst(supabase, visiteur.id);
  await prevenirUneFoisParJour(supabase, c.h, "visite", { titre: `🚪 Toc toc ! ${prenom} a frappé à ta porte`, corps: "Viens voir qui est passé chez toi.", url: CHEZ_MOI, tag: "visite" }).catch(() => undefined);
  return { ok: true };
}

/** 🎁 Laisser un souvenir (ses proches seulement) : il attend d'être accepté. */
export async function laisserSouvenir(supabase: Supabase, visiteur: Habitant, cle: unknown, objet: unknown, mot: unknown): Promise<Resultat> {
  const o = objetValide(objet);
  if (!o) return { error: "Choisis un souvenir.", statut: 400 };
  const m = motDeSouvenir(mot);
  if (m && (motInterdit(m) || parleDAlcool(m))) return { error: "Ces mots ne passent pas : écris autre chose 🙂", statut: 400 };
  if (m.length > MOT_SOUVENIR_MAX) return { error: "Un mot plus court.", statut: 400 };
  const c = await chezQui(supabase, visiteur, cle);
  if (!c.h) return { error: c.error, statut: c.statut };
  if (!c.proche) return { error: "Les souvenirs, c’est entre proches.", statut: 403 };
  const liste = await lireSouvenirs(supabase, c.h);
  if (liste.filter((x) => x.de === visiteur.id && !x.accepte_le).length >= SOUVENIRS_EN_ATTENTE_MAX) return { error: "Tes souvenirs attendent déjà d’être vus.", statut: 429 };
  const souvenir: Souvenir = { id: randomUUID().replace(/-/g, "").slice(0, 12), de: visiteur.id, objet: o, ...(m ? { mot: m } : {}), le: new Date().toISOString() };
  await ecrireJson(supabase, cheminSouvenirs(c.h), { liste: [...liste, souvenir].slice(-60) });
  // (sa visite est notée ; il est prévenu du cadeau — pas de « toc toc » en plus)
  await noterVisite(supabase, visiteur.id, c.h);
  const { prenom } = await quiEst(supabase, visiteur.id);
  await prevenirUneFoisParJour(supabase, c.h, "souvenir", { titre: `🎁 ${prenom} t’a laissé un cadeau`, corps: "Il t’attend chez toi : viens l’ouvrir !", url: CHEZ_MOI, tag: "souvenir" }).catch(() => undefined);
  return { ok: true };
}

/** 🚩 Signaler un univers (pour l'équipe). */
export async function signalerUnivers(supabase: Supabase, visiteur: Habitant, cle: unknown): Promise<Resultat> {
  const h = await hDeCle(supabase, cle);
  if (!h || h === visiteur.id) return { error: "Cet univers n’existe pas.", statut: 404 };
  const x = await lireJson<{ liste?: { de: string; le: string }[] }>(supabase, cheminSignalements(h));
  const liste = Array.isArray(x.liste) ? x.liste : [];
  if (!liste.some((y) => y.de === visiteur.id)) await ecrireJson(supabase, cheminSignalements(h), { liste: [...liste, { de: visiteur.id, le: new Date().toISOString() }].slice(-100) });
  return { ok: true };
}

// ─── chez soi : qui est passé, les souvenirs, qui peut entrer ─────────────────────────────────────
/**
 * 🏡 Chez lui : qui est passé (et qui est nouveau depuis la dernière fois qu'il a regardé), les souvenirs à ouvrir (avec
 * la figurine de qui les a laissés) et ceux qui sont posés, qui peut entrer.
 */
export async function mesVisites(supabase: Supabase, h: string): Promise<MesVisites | null> {
  const f = await lireFicheMonde(supabase, h);
  if (!f) return null;
  const [visites, souvenirs, adulte, cle, vues] = await Promise.all([
    lireVisites(supabase, h),
    lireSouvenirs(supabase, h),
    estAdulte(supabase, h),
    poserProfil(supabase, h),
    lireJson<{ le?: string; ignores?: string[] }>(supabase, cheminVues(h)),
  ]);
  const ignores = new Set(Array.isArray(vues.ignores) ? vues.ignores.map(s) : []);
  const recents = visites.slice(-12).reverse();
  const enAttente = souvenirs.filter((x) => !x.accepte_le);
  // (qui sont-ils : prénom, figurine, clé, proche ou non, son univers ouvert ou non — ceux qui sont passés, et ceux dont
  // un cadeau attend)
  const posesListe = souvenirs.filter((x) => x.accepte_le);
  const ids = [...new Set([...recents.map((v) => v.de), ...enAttente.map((x) => x.de), ...posesListe.map((x) => x.de)])];
  const qui = new Map(
    await Promise.all(
      ids.map(async (id) => {
        const [q, cleDeLui, proche, univers] = await Promise.all([quiEst(supabase, id), poserProfil(supabase, id), seParlent(supabase, h, id), universOuvert(supabase, h, id)]);
        return [id, { ...q, cle: cleDeLui, proche, univers }] as const;
      }),
    ),
  );
  const prenomDe = (id: string) => qui.get(id)?.prenom ?? "Quelqu’un";
  const vuLe = s(vues.le);
  return {
    visibilite: f.visibilite,
    adulte,
    cle,
    passes: recents.map((v) => {
      const q = qui.get(v.de);
      return {
        prenom: prenomDe(v.de),
        ...(q?.image ? { image: q.image } : {}),
        ...(q?.cle ? { cle: q.cle } : {}),
        le: v.le,
        ...(!vuLe || v.le > vuLe ? { nouveau: true } : {}),
        ...(q?.proche ? { proche: true } : {}),
        ...(q?.univers ? { univers: true } : {}),
        ...(q?.cle && !q.proche && ignores.has(q.cle) ? { ignore: true } : {}),
      };
    }),
    enAttente: enAttente.map((x) => souvenirVu(x, prenomDe(x.de), qui.get(x.de))),
    // (posés chez moi : de qui — sa clé, pour les ranger dans notre conversation)
    poses: posesListe.map((x) => souvenirVu(x, prenomDe(x.de), { cle: qui.get(x.de)?.cle })),
  };
}

/** 👀 Il a découvert qui est passé : ce qui est arrivé avant n'est plus nouveau. */
export async function marquerVisitesVues(supabase: Supabase, h: string): Promise<Resultat> {
  const vues = await lireJson<{ ignores?: string[] }>(supabase, cheminVues(h));
  await ecrireJson(supabase, cheminVues(h), { ...vues, le: new Date().toISOString() });
  return { ok: true };
}

/** 🙈 Un inconnu a frappé : il ignore sa demande (l'autre ne le sait pas ; il ne revient plus en « demande »). */
export async function ignorerDemande(supabase: Supabase, h: string, cle: unknown): Promise<Resultat> {
  const c = cleValide(cle);
  if (!c) return { error: "Cette demande n’existe pas.", statut: 400 };
  const vues = await lireJson<{ le?: string; ignores?: string[] }>(supabase, cheminVues(h));
  const ignores = (Array.isArray(vues.ignores) ? vues.ignores.map(s) : []).filter((x) => x !== c);
  await ecrireJson(supabase, cheminVues(h), { ...vues, ignores: [...ignores, c].slice(-200) });
  return { ok: true };
}

/** Une place pour un souvenir accepté : sur le sol, devant, sans recouvrir les autres (en fractions du décor). */
function placeLibre(poses: Souvenir[], sol: number): { x: number; y: number } {
  const xs = [0.14, 0.86, 0.24, 0.76, 0.08, 0.92, 0.5, 0.32, 0.68, 0.18, 0.82, 0.42];
  const pris = poses.map((p) => p.x ?? -1);
  const x = xs.find((v) => !pris.some((p) => Math.abs(p - v) < 0.05)) ?? 0.1 + Math.random() * 0.8;
  const y = Math.min(0.96, Math.max(sol + 0.04, 0.84) + ((xs.indexOf(x) % 3) * 0.035));
  return { x, y };
}

/** ✅ Accepter un souvenir (il se pose chez lui) ; ❌ le refuser (il s'en va, l'autre ne le sait pas). */
export async function deciderSouvenir(supabase: Supabase, h: string, id: unknown, oui: unknown): Promise<Resultat> {
  const liste = await lireSouvenirs(supabase, h);
  const x = liste.find((y) => y.id === s(id));
  if (!x) return { error: "Ce souvenir n’est plus là.", statut: 404 };
  if (oui !== true) {
    await ecrireJson(supabase, cheminSouvenirs(h), { liste: liste.filter((y) => y.id !== x.id) });
    return { ok: true };
  }
  const f = await lireFicheMonde(supabase, h);
  const poses = liste.filter((y) => y.accepte_le);
  const place = placeLibre(poses, f?.scene.sol ?? 0.8);
  const acceptes = liste.map((y) => (y.id === x.id ? { ...y, accepte_le: new Date().toISOString(), ...place } : y));
  // (au plus `SOUVENIRS_POSES_MAX` posés : les plus anciens s'en vont)
  const posesApres = acceptes.filter((y) => y.accepte_le);
  const enTrop = new Set(posesApres.slice(0, Math.max(0, posesApres.length - SOUVENIRS_POSES_MAX)).map((y) => y.id));
  await ecrireJson(supabase, cheminSouvenirs(h), { liste: acceptes.filter((y) => !enTrop.has(y.id)) });
  return { ok: true };
}

/** 🗑️ Retirer un souvenir posé. */
export async function retirerSouvenir(supabase: Supabase, h: string, id: unknown): Promise<Resultat> {
  const liste = await lireSouvenirs(supabase, h);
  if (!liste.some((y) => y.id === s(id))) return { error: "Ce souvenir n’est plus là.", statut: 404 };
  await ecrireJson(supabase, cheminSouvenirs(h), { liste: liste.filter((y) => y.id !== s(id)) });
  return { ok: true };
}

/** 🔑 Qui peut entrer chez lui ; « tous » demande d'avoir déclaré 18 ans ou plus (`adulte`, une fois). */
export async function choisirVisibilite(supabase: Supabase, h: string, v: unknown, adulte: unknown): Promise<Resultat> {
  const choix = VISIBILITES.find((x) => x === v) as Visibilite | undefined;
  if (!choix) return { error: "Qui peut entrer ?", statut: 400 };
  const f = await lireFicheMonde(supabase, h);
  if (!f) return { error: "Crée d’abord ton univers.", statut: 400 };
  if (choix === "tous" && !(await estAdulte(supabase, h))) {
    if (adulte !== true) return { error: "Pour l’ouvrir à tous, il faut avoir 18 ans ou plus.", statut: 403 };
    await ecrireJson(supabase, cheminAdulte(h), { le: new Date().toISOString() });
  }
  const r = await completerMonde(supabase, h, f.version, { visibilite: choix });
  if (!r.fiche) return { error: r.error ?? "Ça n’a pas marché.", statut: 502 };
  // (🏡 « Découvrir » : il y entre quand il ouvre son univers à tous, il en sort sinon)
  const p = await lireJson<{ liste?: { h: string; le: string }[] }>(supabase, CHEMIN_PUBLICS);
  const sans = (Array.isArray(p.liste) ? p.liste : []).filter((x) => s(x?.h) && x.h !== h);
  await ecrireJson(supabase, CHEMIN_PUBLICS, { liste: choix === "tous" ? [...sans, { h, le: new Date().toISOString() }].slice(-500) : sans });
  return { ok: true };
}

/** 🏡 Les univers ouverts à tous, les plus récents d'abord (« Découvrir », lot 7) : sa figurine chez elle. */
export async function universPublics(supabase: Supabase, limite = 12): Promise<UniversPublic[]> {
  const p = await lireJson<{ liste?: { h: string; le: string }[] }>(supabase, CHEMIN_PUBLICS);
  const recents = (Array.isArray(p.liste) ? p.liste : []).filter((x) => s(x?.h)).slice(-limite * 2).reverse();
  const vus = await Promise.all(
    recents.map(async ({ h }): Promise<UniversPublic | null> => {
      const f = await lireFicheMonde(supabase, h).catch(() => null);
      if (!f?.references.decor || f.visibilite !== "tous") return null;
      const [image, { prenom }, cle] = await Promise.all([signer(supabase, (f.references.vedette ?? f.references.decor).chemin, 3600), quiEst(supabase, h), poserProfil(supabase, h)]);
      return image ? { cle, prenom, image } : null;
    }),
  );
  return vus.filter((x): x is UniversPublic => Boolean(x)).slice(0, limite);
}

/** 🏡 Son univers est-il ouvert à ce proche ? (le bouton « Son univers » dans « Proches ») */
export async function universOuvert(supabase: Supabase, visiteur: string, h: string): Promise<boolean> {
  const f = await lireFicheMonde(supabase, h).catch(() => null);
  if (!f?.references.decor) return false;
  return (await peutEntrer(supabase, visiteur, h, f)).ok;
}
