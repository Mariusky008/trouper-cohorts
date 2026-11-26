/**
 * 👥 MES GROUPES, CÔTÉ SERVEUR — les propositions (« On se retrouve ? »), le lot G2 (`groupes.ts`,
 * `docs/univers/mes-groupes.md`).
 *
 * Comme les salons ouverts, tout est rangé dans le seau, **un fichier par personne** : personne n'écrit jamais le
 * fichier d'un autre (pas de migration).
 *
 * - `groupes/propositions/<id>.json` : la proposition (son nom, sa passion, sa vidéo, quand, pour qui, ses places, son mot,
 *   qui la propose — son compte n'est jamais montré) ;
 * - `groupes/places/<id>/<q>.json` : une place prise (son prénom, sa figurine) ;
 * - `groupes/horaires/<id>/<q>.json` : une autre heure proposée ;
 * - `groupes/signalements/<id>/<q>.json` : un signalement.
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { SEAU_FIGURINES, ecrireJson, lireJson, prenomDe, prochesDe } from "./ma-figurine-serveur";
import { poserProfil, qui8, seParlent } from "./talkie-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { maisonDeMoi, preparerLeRendezVous } from "./salons-ouverts-serveur";
import { maTeleDuJour } from "./tele-du-jour-serveur";
import { details } from "./selection-serveur";
import { videoYouTube } from "./tele";
import { LIEN_REGARDER_MAX, TITRE_PAR_DEFAUT } from "./regarder-a-deux";
import { groupesOuverts } from "./interrupteurs-serveur";
import type { MaisonSalons, VideoSalon } from "./salons-ouverts";
import {
  HORIZON_MS,
  MOT_GROUPE_MAX,
  NOM_GROUPE_MAX,
  OUVERT_APRES_MS,
  PHRASES_PROPOSITIONS as P,
  PLACES_GROUPE,
  PROPOSITIONS_MAX,
  SIGNALEMENTS_GROUPE,
  estOuverte,
  refusDuGroupe,
  themeDuGroupe,
  type PlaceGroupe,
  type PlacesGroupe,
  type PourQui,
  type PropositionGroupe,
} from "./groupes";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

const DOSSIER = "groupes/propositions";
const cheminProposition = (id: string) => `${DOSSIER}/${id}.json`;
const dossierPlaces = (id: string) => `groupes/places/${id}`;
const dossierHoraires = (id: string) => `groupes/horaires/${id}`;
const dossierSignalements = (id: string) => `groupes/signalements/${id}`;
const ID = /^\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/;
const idValide = (x: unknown) => (ID.test(s(x)) ? s(x) : null);

/** La fiche dans le seau (elle porte le compte de celui qui propose : jamais montrée telle quelle). */
type FicheProposition = {
  id: string;
  h: string;
  q: string;
  prenom: string;
  maison: MaisonSalons;
  nom: string;
  theme: string;
  video: VideoSalon | null;
  quand: number;
  pour: PourQui;
  places: PlacesGroupe;
  mot?: string;
  le: number;
  retiree?: number;
};
type FichePlace = PlaceGroupe & { h: string; le: number };
type FicheHoraire = { q: string; prenom: string; quand: number; le: number };

async function lister(supabase: Supabase, dossier: string, limite = 100): Promise<string[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: limite, sortBy: { column: "name", order: "desc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n.endsWith(".json"));
}
const effacer = (supabase: Supabase, chemins: string[]) => (chemins.length ? supabase.storage.from(SEAU_FIGURINES).remove(chemins).then(() => undefined, () => undefined) : Promise.resolve());

async function lireProposition(supabase: Supabase, id: string): Promise<FicheProposition | null> {
  const f = await lireJson<Partial<FicheProposition>>(supabase, cheminProposition(id)).catch(() => ({}) as Partial<FicheProposition>);
  return f.id === id && f.h && !f.retiree && Number.isFinite(f.quand) ? (f as FicheProposition) : null;
}
async function placesDe(supabase: Supabase, id: string): Promise<FichePlace[]> {
  const noms = await lister(supabase, dossierPlaces(id), 20);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FichePlace>>(supabase, `${dossierPlaces(id)}/${n}`).catch(() => ({}) as Partial<FichePlace>)));
  return l.filter((x): x is FichePlace => Boolean(x.q && x.h)).sort((a, b) => a.le - b.le);
}
async function derniereAutreHeure(supabase: Supabase, f: FicheProposition): Promise<FicheHoraire | null> {
  const noms = await lister(supabase, dossierHoraires(f.id), 20);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FicheHoraire>>(supabase, `${dossierHoraires(f.id)}/${n}`).catch(() => ({}) as Partial<FicheHoraire>)));
  return (
    l
      .filter((x): x is FicheHoraire => Boolean(x.q && x.q !== f.q && Number(x.quand) > Date.now() && x.quand !== f.quand))
      .sort((a, b) => b.le - a.le)[0] ?? null
  );
}
async function maPlace(supabase: Supabase, moi: Habitant, maintenant: number): Promise<FichePlace> {
  const [prenom, figurine] = await Promise.all([prenomDe(supabase, moi).catch(() => ""), figurineDeLaMaison(supabase, moi.id).catch(() => null)]);
  return { q: qui8(moi.id), h: moi.id, prenom: prenom || "Quelqu’un", src: figurine?.src ?? "", le: maintenant };
}

/** Puis-je voir cette proposition ? (tout le monde : les adultes ; entre proches : ses proches, des deux côtés) */
async function peutVoir(supabase: Supabase, moi: Habitant, f: FicheProposition, o: { maison: MaisonSalons | null; proches: Set<string> }): Promise<boolean> {
  if (f.h === moi.id) return true;
  if (f.pour === "tous") return f.maison === "adultes" && o.maison === "adultes" && groupesOuverts();
  return o.proches.has(f.h) && (await seParlent(supabase, moi.id, f.h).catch(() => false));
}

async function vueDe(supabase: Supabase, moi: Habitant, f: FicheProposition, maintenant: number): Promise<PropositionGroupe> {
  const [places, autre] = await Promise.all([placesDe(supabase, f.id), derniereAutreHeure(supabase, f)]);
  const q = qui8(moi.id);
  const t = themeDuGroupe(f.theme);
  return {
    id: f.id,
    nom: f.nom,
    theme: t?.id ?? "series",
    e: t?.e ?? "🛋️",
    video: f.video ? { id: f.video.id, titre: f.video.titre } : null,
    quand: f.quand,
    pour: f.pour,
    places: f.places,
    ...(f.mot ? { mot: f.mot } : {}),
    de: f.prenom,
    ...(f.h === moi.id ? { mienne: true as const } : {}),
    confirmes: places.slice(0, f.places).map(({ q: x, prenom, src }) => ({ q: x, prenom, src })),
    ...(places.some((p) => p.q === q) ? { jY: true as const } : {}),
    ...(autre ? { autre: { prenom: autre.prenom, quand: autre.quand, q: autre.q } } : {}),
    ...(estOuverte(f.quand, maintenant) ? { ouverte: true as const } : {}),
  };
}

/** 👥 Les propositions que je peux voir, à venir (et celles qu'on peut encore rejoindre), les plus proches d'abord. */
export async function propositionsPourMoi(supabase: Supabase, moi: Habitant, maintenant = Date.now()): Promise<PropositionGroupe[]> {
  const [noms, maison, proches] = await Promise.all([lister(supabase, DOSSIER, 200), maisonDeMoi(supabase, moi.id).catch(() => null), prochesDe(supabase, moi.id).catch(() => new Set<string>())]);
  const fiches = (await Promise.all(noms.map((n) => lireProposition(supabase, n.replace(/\.json$/, ""))))).filter((f): f is FicheProposition => Boolean(f && f.quand + OUVERT_APRES_MS > maintenant));
  const visibles: FicheProposition[] = [];
  for (const f of fiches) if (await peutVoir(supabase, moi, f, { maison, proches })) visibles.push(f);
  visibles.sort((a, b) => a.quand - b.quand);
  return Promise.all(visibles.slice(0, 20).map((f) => vueDe(supabase, moi, f, maintenant)));
}

/** 🎞️ (le fil de Découvrir) la prochaine proposition ouverte à tout le monde, d'un autre, où il reste une place. */
export async function prochaineDuFil(supabase: Supabase, moi: Habitant, passions: string[], maintenant = Date.now()): Promise<PropositionGroupe | null> {
  const l = (await propositionsPourMoi(supabase, moi, maintenant)).filter((p) => p.pour === "tous" && !p.mienne && !p.jY && p.confirmes.length < p.places);
  return l.find((p) => passions.includes(p.theme)) ?? l[0] ?? null;
}

/** La vidéo choisie : une vidéo de sa télé du jour, un lien YouTube collé, ou aucune (les nouveautés de la passion). */
async function videoChoisie(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ video?: VideoSalon | null }>> {
  if (s(p.video)) {
    const v = ((await maTeleDuJour(supabase, moi.id).catch(() => null))?.videos ?? []).find((x) => x.id === s(p.video));
    if (!v) return { error: "Cette vidéo n’est plus dans ta télé du jour.", statut: 404 };
    return { video: { id: v.id, titre: v.titre, chaine: v.chaine, duree: v.duree } };
  }
  if (s(p.lien)) {
    const y = videoYouTube(s(p.lien).slice(0, LIEN_REGARDER_MAX));
    if (!y) return { error: "Ce lien n’est pas une vidéo YouTube.", statut: 400 };
    const fiche = await details([y.id], { min: 1, max: 6 * 3600 }).then(
      (l) => l[0] ?? null,
      () => undefined,
    );
    if (fiche === null) return { error: "Cette vidéo ne se regarde pas ici.", statut: 400 };
    return { video: fiche ? { id: fiche.id, titre: fiche.titre, chaine: fiche.chaine, duree: fiche.duree } : { id: y.id, titre: TITRE_PAR_DEFAUT, chaine: "", duree: 0 } };
  }
  return { video: null };
}

/** 📣 Proposer de se retrouver. */
export async function proposer(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ proposition?: PropositionGroupe }>> {
  const t = themeDuGroupe(p.theme);
  if (!t) return { error: "Choisis une passion.", statut: 400 };
  const nom = s(p.nom).replace(/\s+/g, " ") || `${t.court[0].toUpperCase()}${t.court.slice(1)} ensemble`;
  const refusNom = refusDuGroupe(nom, NOM_GROUPE_MAX);
  if (refusNom) return { error: `Son nom ne passe pas : ${refusNom}.`, statut: 400 };
  const mot = s(p.mot).replace(/\s+/g, " ");
  const refusMot = mot ? refusDuGroupe(mot, MOT_GROUPE_MAX) : null;
  if (refusMot) return { error: `Le mot ne passe pas : ${refusMot}.`, statut: 400 };
  const quand = Math.round(Number(p.quand) / 60_000) * 60_000;
  if (!Number.isFinite(quand) || quand < maintenant - 5 * 60_000 || quand > maintenant + HORIZON_MS) return { error: "Choisis un moment dans les deux prochaines semaines.", statut: 400 };
  const maison = await maisonDeMoi(supabase, moi.id).catch(() => null);
  if (!maison) return { error: "Dis-nous d’abord si tu as 18 ans (dans Découvrir).", statut: 409 };
  const pour: PourQui = p.pour === "tous" ? "tous" : "proches";
  if (pour === "tous" && maison !== "adultes") return { error: P.jeunes, statut: 403 };
  if (pour === "tous" && !groupesOuverts()) return { error: P.ferme, statut: 403 };
  if (t.adultes && maison !== "adultes") return { error: "Cette passion est réservée aux adultes.", statut: 403 };
  const places: PlacesGroupe = pour === "proches" ? 4 : (PLACES_GROUPE as readonly number[]).includes(Number(p.places)) ? (Number(p.places) as PlacesGroupe) : 8;
  const v = await videoChoisie(supabase, moi, p);
  if (v.error) return { error: v.error, statut: v.statut };
  const q = qui8(moi.id);
  // (trois propositions à venir au plus)
  const miennes = (await lister(supabase, DOSSIER, 200)).filter((n) => n.split("-")[1] === q);
  const aVenir = (await Promise.all(miennes.map((n) => lireProposition(supabase, n.replace(/\.json$/, ""))))).filter((f) => f && f.quand + OUVERT_APRES_MS > maintenant);
  if (aVenir.length >= PROPOSITIONS_MAX) return { error: P.tropDePropositions, statut: 409 };
  const place = await maPlace(supabase, moi, maintenant);
  const id = `${maintenant}-${q}-${randomBytes(3).toString("hex")}`;
  const fiche: FicheProposition = { id, h: moi.id, q, prenom: place.prenom, maison, nom, theme: t.id, video: v.video ?? null, quand, pour, places, ...(mot ? { mot } : {}), le: maintenant };
  if (!(await ecrireJson(supabase, cheminProposition(id), fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await ecrireJson(supabase, `${dossierPlaces(id)}/${q}.json`, place);
  return { proposition: await vueDe(supabase, moi, fiche, maintenant) };
}

/** Une proposition que je peux voir (sinon : une erreur). */
async function visible(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ f?: FicheProposition }>> {
  const i = idValide(id);
  const f = i ? await lireProposition(supabase, i) : null;
  if (!f) return { error: "Cette proposition n’existe plus.", statut: 404 };
  const [maison, proches] = await Promise.all([maisonDeMoi(supabase, moi.id).catch(() => null), prochesDe(supabase, moi.id).catch(() => new Set<string>())]);
  if (!(await peutVoir(supabase, moi, f, { maison, proches }))) return { error: "Cette proposition n’existe plus.", statut: 404 };
  return { f };
}

/** ✓ Je confirme ma place (ou je la laisse : `laisser`). */
export async function confirmer(supabase: Supabase, moi: Habitant, id: unknown, laisser = false): Promise<Resultat<{ proposition?: PropositionGroupe }>> {
  const v = await visible(supabase, moi, id);
  if (!v.f) return { error: v.error, statut: v.statut };
  const f = v.f;
  const maintenant = Date.now();
  if (f.quand + OUVERT_APRES_MS < maintenant) return { error: "Ce rendez-vous est passé.", statut: 410 };
  const q = qui8(moi.id);
  if (laisser) {
    if (f.h === moi.id) return { error: "C’est ta proposition : retire-la plutôt.", statut: 400 };
    await effacer(supabase, [`${dossierPlaces(f.id)}/${q}.json`]);
  } else {
    const places = await placesDe(supabase, f.id);
    if (!places.some((p) => p.q === q)) {
      if (places.length >= f.places) return { error: P.complet, statut: 409 };
      if (!(await ecrireJson(supabase, `${dossierPlaces(f.id)}/${q}.json`, await maPlace(supabase, moi, maintenant)))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
    }
  }
  return { proposition: await vueDe(supabase, moi, f, maintenant) };
}

/** 🕘 Proposer une autre heure (celui qui propose : prendre une heure proposée, `prendre`). */
export async function autreHeure(supabase: Supabase, moi: Habitant, id: unknown, quandBrut: unknown): Promise<Resultat<{ proposition?: PropositionGroupe }>> {
  const v = await visible(supabase, moi, id);
  if (!v.f) return { error: v.error, statut: v.statut };
  const f = v.f;
  const maintenant = Date.now();
  const quand = Math.round(Number(quandBrut) / 60_000) * 60_000;
  if (!Number.isFinite(quand) || quand < maintenant || quand > maintenant + HORIZON_MS) return { error: "Choisis un moment dans les deux prochaines semaines.", statut: 400 };
  if (f.h === moi.id) {
    // (celui qui propose change l'heure : la proposition la prend ; les autres heures proposées s'en vont)
    const n: FicheProposition = { ...f, quand };
    if (!(await ecrireJson(supabase, cheminProposition(f.id), n))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
    const noms = await lister(supabase, dossierHoraires(f.id), 50);
    await effacer(supabase, noms.map((x) => `${dossierHoraires(f.id)}/${x}`));
    return { proposition: await vueDe(supabase, moi, n, maintenant) };
  }
  const prenom = (await prenomDe(supabase, moi).catch(() => "")) || "Quelqu’un";
  const q = qui8(moi.id);
  if (!(await ecrireJson(supabase, `${dossierHoraires(f.id)}/${q}.json`, { q, prenom, quand, le: maintenant } satisfies FicheHoraire))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { proposition: await vueDe(supabase, moi, f, maintenant) };
}

/** Retirer sa proposition. */
export async function retirer(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat> {
  const i = idValide(id);
  const f = i ? await lireProposition(supabase, i) : null;
  if (!f || f.h !== moi.id) return { error: "Cette proposition n’existe plus.", statut: 404 };
  if (!(await ecrireJson(supabase, cheminProposition(f.id), { ...f, retiree: Date.now() }))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return {};
}

/** 🚩 Signaler : trois personnes différentes, et la proposition disparaît. */
export async function signaler(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat> {
  const v = await visible(supabase, moi, id);
  if (!v.f) return { error: v.error, statut: v.statut };
  const f = v.f;
  if (f.h === moi.id) return { error: "C’est ta proposition.", statut: 400 };
  const q = qui8(moi.id);
  await ecrireJson(supabase, `${dossierSignalements(f.id)}/${q}.json`, { q, h: moi.id, le: Date.now() });
  const n = (await lister(supabase, dossierSignalements(f.id), 20)).length;
  if (n >= SIGNALEMENTS_GROUPE) await ecrireJson(supabase, cheminProposition(f.id), { ...f, retiree: Date.now(), signalee: n });
  return {};
}

/**
 * ▶ Entrer, à l'heure dite : où aller. Ouverte à tout le monde : le salon de la passion (Découvrir). Entre proches : la
 * séance de celui qui propose — ceux qui ont leur place y sont invités, avec la vidéo choisie.
 */
export async function entrer(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ aller?: string }>> {
  const v = await visible(supabase, moi, id);
  if (!v.f) return { error: v.error, statut: v.statut };
  const f = v.f;
  const maintenant = Date.now();
  if (!estOuverte(f.quand, maintenant)) return { error: maintenant < f.quand ? "Pas encore : on entre dix minutes avant l’heure." : "Ce rendez-vous est passé.", statut: 409 };
  if (f.pour === "tous") return { aller: `/univers/salons?theme=${f.theme}` };
  const places = await placesDe(supabase, f.id);
  const hote = f.h === moi.id;
  if (!hote && !places.some((p) => p.h === moi.id)) return { error: "Confirme d’abord ta place.", statut: 403 };
  await preparerLeRendezVous(supabase, f.h, { invites: hote ? places.map((p) => p.h) : [moi.id], video: f.video, hoteEntre: hote });
  if (hote) return { aller: "/univers/salons?chez=moi" };
  const cle = await poserProfil(supabase, f.h).catch(() => "");
  return cle ? { aller: `/univers/salons?chez=${encodeURIComponent(cle)}` } : { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
}
