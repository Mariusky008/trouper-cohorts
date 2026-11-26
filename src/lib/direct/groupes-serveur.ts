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
import { hDeCle, poserProfil, qui8, seParlent } from "./talkie-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { maisonDeMoi, preparerLeRendezVous, presentsDuGroupe } from "./salons-ouverts-serveur";
import { prochainDuGroupe } from "./groupes-vie-serveur";
import { cheminGroupe, cheminMembre, cheminMiens, dossierInvitationsGroupe, dossierInvites, dossierPassages, estMembre, membresDe, idGroupeValide, type FicheMembre } from "./groupes-chemins-serveur";
import { maTeleDuJour } from "./tele-du-jour-serveur";
import { details } from "./selection-serveur";
import { videoYouTube } from "./tele";
import { LIEN_REGARDER_MAX, TITRE_PAR_DEFAUT } from "./regarder-a-deux";
import { groupesOuverts } from "./interrupteurs-serveur";
import { prevenirUnHabitantAppli } from "./appli-collection-serveur";
import type { MaisonSalons, VideoSalon } from "./salons-ouverts";
import {
  GARDER_DES_MS,
  GARDER_JUSQUA_MS,
  GROUPES_MAX,
  MEMBRES_MAX,
  MEMBRES_MIN,
  PHRASES_GROUPES_GARDES as PG,
  idDuGroupe,
  type GarderGroupe,
  type GroupeVue,
  HORIZON_MS,
  MOT_GROUPE_MAX,
  NOM_GROUPE_MAX,
  OUVERT_APRES_MS,
  PHRASES_PROPOSITIONS as P,
  PLACES_GROUPE,
  PROPOSITIONS_MAX,
  RAPPEL_APRES_MS,
  RAPPEL_AVANT_MS,
  SIGNALEMENTS_GROUPE,
  estOuverte,
  quandLisible,
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
const cheminRappel = (id: string) => `groupes/rappels/${id}.json`;
const LIEN = "/collection#groupes";
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
    ...(await garderDe(supabase, f, places, q, maintenant)),
  };
}

/** 💛 (lot G4) La séance est finie : « On garde ce groupe ? » — pour ceux qui avaient leur place, quand ils étaient deux au moins. */
async function garderDe(supabase: Supabase, f: FicheProposition, places: FichePlace[], q: string, maintenant: number): Promise<{ garder?: GarderGroupe }> {
  if (maintenant < f.quand + GARDER_DES_MS || maintenant > f.quand + GARDER_JUSQUA_MS) return {};
  if (places.length < MEMBRES_MIN || !places.some((p) => p.q === q)) return {};
  const gid = idDuGroupe(f.id);
  const gardes = (await membresDe(supabase, gid)).map((m) => m.q);
  return { garder: { gardes, ...(gardes.includes(q) ? { moi: true as const } : {}), ...(gardes.length >= MEMBRES_MIN ? { groupe: gid } : {}) } };
}

/** 👥 Les propositions que je peux voir, à venir (et celles qu'on peut encore rejoindre), les plus proches d'abord. */
export async function propositionsPourMoi(supabase: Supabase, moi: Habitant, maintenant = Date.now()): Promise<PropositionGroupe[]> {
  const [noms, maison, proches] = await Promise.all([lister(supabase, DOSSIER, 200), maisonDeMoi(supabase, moi.id).catch(() => null), prochesDe(supabase, moi.id).catch(() => new Set<string>())]);
  // (💛 lot G4 : une séance finie depuis moins de deux jours reste là pour ceux qui y étaient — « On garde ce groupe ? »)
  const fiches = (await Promise.all(noms.map((n) => lireProposition(supabase, n.replace(/\.json$/, ""))))).filter((f): f is FicheProposition => Boolean(f && f.quand + Math.max(OUVERT_APRES_MS, GARDER_JUSQUA_MS) > maintenant));
  const visibles: FicheProposition[] = [];
  for (const f of fiches) if (await peutVoir(supabase, moi, f, { maison, proches })) visibles.push(f);
  visibles.sort((a, b) => a.quand - b.quand);
  const vues = await Promise.all(visibles.slice(0, 30).map((f) => vueDe(supabase, moi, f, maintenant)));
  // (passée : seulement si elle demande encore « On garde ce groupe ? » — gardée et née, elle est dans Tous mes groupes)
  return vues.filter((v) => v.quand + OUVERT_APRES_MS > maintenant ? !(v.garder?.moi && v.garder.groupe) : Boolean(v.garder && !(v.garder.moi && v.garder.groupe))).slice(0, 20);
}

/** 🎞️ (le fil de Découvrir) la prochaine proposition ouverte à tout le monde, d'un autre, où il reste une place. */
export async function prochaineDuFil(supabase: Supabase, moi: Habitant, passions: string[], maintenant = Date.now()): Promise<PropositionGroupe | null> {
  const l = (await propositionsPourMoi(supabase, moi, maintenant)).filter((p) => p.pour === "tous" && !p.mienne && !p.jY && !p.garder && p.quand + OUVERT_APRES_MS > maintenant && p.confirmes.length < p.places);
  return l.find((p) => passions.includes(p.theme)) ?? l[0] ?? null;
}

/** La vidéo choisie : une vidéo de sa télé du jour, un lien YouTube collé, ou aucune (les nouveautés de la passion). */
export async function videoChoisie(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ video?: VideoSalon | null }>> {
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
    // (🔔 lot G3 : ceux qui ont leur place l'apprennent)
    const places = (await placesDe(supabase, f.id)).filter((p) => p.h !== moi.id);
    const notif = { titre: P.changeNotifTitre(f.nom, quandLisible(quand, maintenant)), corps: P.changeNotifCorps, url: LIEN, tag: `groupe-${f.id}` };
    await Promise.all(places.map((p) => prevenirUnHabitantAppli(supabase, p.h, notif).catch(() => "rien")));
    return { proposition: await vueDe(supabase, moi, n, maintenant) };
  }
  const prenom = (await prenomDe(supabase, moi).catch(() => "")) || "Quelqu’un";
  const q = qui8(moi.id);
  if (!(await ecrireJson(supabase, `${dossierHoraires(f.id)}/${q}.json`, { q, prenom, quand, le: maintenant } satisfies FicheHoraire))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  // (🔔 lot G3 : celui qui propose l'apprend tout de suite)
  await prevenirUnHabitantAppli(supabase, f.h, { titre: P.autreNotifTitre(prenom, quandLisible(quand, maintenant)), corps: P.autreNotifCorps(f.nom), url: LIEN, tag: `groupe-heure-${f.id}` }).catch(() => "rien");
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

/**
 * 🔔 (lot G3) LES RAPPELS : appelé toutes les cinq minutes. Pour chaque proposition dont l'heure arrive (quinze minutes
 * avant, jusqu'à trente minutes après), ceux qui ont leur place reçoivent « 🔔 Soirée foot commence dans 10 minutes » —
 * une fois par heure de rendez-vous (l'heure change : un nouveau rappel). `maintenant` : les essais avancent l'horloge.
 */
export async function rappelerLesGroupes(supabase: Supabase, o: { maintenant?: number; fin?: number } = {}): Promise<{ rappels: number; personnes: number }> {
  const maintenant = o.maintenant ?? Date.now();
  const fin = o.fin ?? Date.now() + 50_000;
  const noms = await lister(supabase, DOSSIER, 500);
  let rappels = 0;
  let personnes = 0;
  for (const n of noms) {
    if (Date.now() > fin) break;
    const f = await lireProposition(supabase, n.replace(/\.json$/, ""));
    if (!f || maintenant < f.quand - RAPPEL_AVANT_MS || maintenant > f.quand + RAPPEL_APRES_MS) continue;
    const deja = await lireJson<{ quand?: number }>(supabase, cheminRappel(f.id)).catch(() => ({}) as { quand?: number });
    if (deja.quand === f.quand) continue;
    if (!(await ecrireJson(supabase, cheminRappel(f.id), { quand: f.quand, le: maintenant }))) continue;
    const places = await placesDe(supabase, f.id);
    const minutes = Math.max(0, Math.round((f.quand - maintenant) / 60_000));
    const notif = { titre: P.rappelTitre(f.nom, minutes), corps: P.rappelCorps(places.length), url: LIEN, tag: `groupe-${f.id}` };
    const issues = await Promise.all(places.map((p) => prevenirUnHabitantAppli(supabase, p.h, notif).catch(() => "rien" as const)));
    rappels++;
    personnes += issues.filter((x) => x === "envoye").length;
  }
  return { rappels, personnes };
}

// ═══ 💛 (lot G4) « ON GARDE CE GROUPE ? », ET TOUS MES GROUPES ═══
// Ceux qui gardent forment le groupe (deux au moins) ; il naît de la proposition, il en garde le nom, le mot, la passion.
// Ou bien je le crée tout de suite avec mes proches : ils le voient dans Mes groupes, et le gardent s'ils veulent.
// Un groupe n'est visible que par ses membres. Trois groupes au plus par personne, pour commencer.

/** L'identité d'un groupe (écrite une fois, par celui qui le fait naître). */
type FicheGroupe = { id: string; nom: string; mot?: string; theme: string; q: string; prenom: string; maison: MaisonSalons; origine?: string; cree?: true; le: number };
type FicheInvitation = { id: string; h: string; q: string; de: string; le: number };
type FichePassage = { q: string; prenom: string; le: number };

async function lireGroupe(supabase: Supabase, id: string): Promise<FicheGroupe | null> {
  const f = await lireJson<Partial<FicheGroupe>>(supabase, cheminGroupe(id)).catch(() => ({}) as Partial<FicheGroupe>);
  return f.id === id && f.nom ? (f as FicheGroupe) : null;
}
async function mesIds(supabase: Supabase, q: string): Promise<string[]> {
  const f = await lireJson<{ groupes?: unknown }>(supabase, cheminMiens(q)).catch(() => ({}) as { groupes?: unknown });
  return Array.isArray(f.groupes) ? f.groupes.map((x) => idGroupeValide(x)).filter((x): x is string => Boolean(x)) : [];
}
/** Mes groupes nés (ou créés par moi) : ceux dont je suis toujours membre. */
async function mesGroupesNes(supabase: Supabase, q: string): Promise<{ g: FicheGroupe; membres: FicheMembre[] }[]> {
  const ids = await mesIds(supabase, q);
  const l = await Promise.all(ids.map(async (id) => ({ g: await lireGroupe(supabase, id), membres: await membresDe(supabase, id) })));
  return l.filter((x): x is { g: FicheGroupe; membres: FicheMembre[] } => Boolean(x.g && x.membres.some((m) => m.q === q) && (x.g.cree || x.membres.length >= MEMBRES_MIN)));
}
/** Je deviens membre : ma fiche, et mon index. */
async function devenirMembre(supabase: Supabase, moi: Habitant, id: string, maintenant: number): Promise<boolean> {
  const q = qui8(moi.id);
  const place = await maPlace(supabase, moi, maintenant);
  if (!(await ecrireJson(supabase, cheminMembre(id, q), place satisfies FicheMembre))) return false;
  const ids = await mesIds(supabase, q);
  if (!ids.includes(id)) await ecrireJson(supabase, cheminMiens(q), { groupes: [...ids, id] });
  return true;
}
/** Trois groupes au plus (sans compter celui que je rejoins si j'y suis déjà). */
async function placePourUnGroupe(supabase: Supabase, q: string): Promise<boolean> {
  return (await mesGroupesNes(supabase, q)).length < GROUPES_MAX;
}

async function vueDuGroupe(supabase: Supabase, g: FicheGroupe, membres: FicheMembre[], q: string, maintenant: number, invite?: string): Promise<GroupeVue> {
  const t = themeDuGroupe(g.theme);
  const [ici, passages, prochain] = await Promise.all([
    invite ? Promise.resolve([] as string[]) : presentsDuGroupe(supabase, g.id, maintenant).catch(() => [] as string[]),
    invite ? Promise.resolve([] as string[]) : lister(supabase, dossierPassages(g.id), 20),
    prochainDuGroupe(supabase, g.id, maintenant).catch(() => null),
  ]);
  const place = ({ q: x, prenom, src }: FicheMembre): PlaceGroupe => ({ q: x, prenom, src });
  const dedans = membres.filter((m) => ici.includes(m.q));
  // (le dernier passage d'un autre que moi, dans la semaine)
  let passage: GroupeVue["passage"];
  if (!dedans.length && passages.length) {
    const lus = await Promise.all(passages.filter((n) => n !== `${q}.json`).map((n) => lireJson<Partial<FichePassage>>(supabase, `${dossierPassages(g.id)}/${n}`).catch(() => ({}) as Partial<FichePassage>)));
    const d = lus.filter((x) => x.prenom && Number(x.le) > maintenant - 7 * 24 * 3600_000).sort((a, b) => Number(b.le) - Number(a.le))[0];
    if (d) passage = { prenom: s(d.prenom), le: Number(d.le) };
  }
  return {
    id: g.id,
    nom: g.nom,
    ...(g.mot ? { mot: g.mot } : {}),
    theme: t?.id ?? "series",
    e: t?.e ?? "🛋️",
    membres: membres.slice(0, MEMBRES_MAX).map(place),
    ici: dedans.map(place),
    ...(passage ? { passage } : {}),
    ...(invite ? { invite: { de: invite } } : {}),
    ...(prochain ? { prochain } : {}),
  };
}

/** 👥 Tous mes groupes (ceux où quelqu'un est dans le salon d'abord), et ceux où un proche m'invite. */
export async function mesGroupes(supabase: Supabase, moi: Habitant, maintenant = Date.now()): Promise<GroupeVue[]> {
  const q = qui8(moi.id);
  const [nes, invitations] = await Promise.all([mesGroupesNes(supabase, q), lister(supabase, dossierInvitationsGroupe(q), 20)]);
  const vues = await Promise.all(nes.map(({ g, membres }) => vueDuGroupe(supabase, g, membres, q, maintenant)));
  const invites = await Promise.all(
    invitations.map(async (n) => {
      const inv = await lireJson<Partial<FicheInvitation>>(supabase, `${dossierInvitationsGroupe(q)}/${n}`).catch(() => ({}) as Partial<FicheInvitation>);
      const id = idGroupeValide(inv.id);
      const g = id ? await lireGroupe(supabase, id) : null;
      if (!g || !id) return null;
      const membres = await membresDe(supabase, id);
      if (membres.some((m) => m.q === q) || !membres.length) return null;
      return vueDuGroupe(supabase, g, membres, q, maintenant, s(inv.de) || g.prenom);
    }),
  );
  return [...vues.sort((a, b) => b.ici.length - a.ici.length), ...invites.filter((x): x is GroupeVue => Boolean(x))];
}

/** 💛 Garder le groupe d'une proposition finie (j'y avais ma place). */
export async function garder(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ proposition?: PropositionGroupe; groupe?: GroupeVue }>> {
  const v = await visible(supabase, moi, id);
  if (!v.f) return { error: v.error, statut: v.statut };
  const f = v.f;
  const maintenant = Date.now();
  if (maintenant < f.quand + GARDER_DES_MS) return { error: "Pas encore : on décide à la fin de la séance.", statut: 409 };
  if (maintenant > f.quand + GARDER_JUSQUA_MS) return { error: "C’était il y a plus de deux jours.", statut: 410 };
  const q = qui8(moi.id);
  const places = await placesDe(supabase, f.id);
  if (!places.some((p) => p.q === q)) return { error: "Tu n’avais pas ta place à cette séance.", statut: 403 };
  const gid = idDuGroupe(f.id);
  if (!(await estMembre(supabase, gid, q))) {
    if (!(await placePourUnGroupe(supabase, q))) return { error: PG.tropDeGroupes, statut: 409 };
    if (!(await lireGroupe(supabase, gid))) {
      const g: FicheGroupe = { id: gid, nom: f.nom, ...(f.mot ? { mot: f.mot } : {}), theme: f.theme, q: f.q, prenom: f.prenom, maison: f.maison, origine: f.id, le: maintenant };
      if (!(await ecrireJson(supabase, cheminGroupe(gid), g))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
    }
    if (!(await devenirMembre(supabase, moi, gid, maintenant))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  }
  const proposition = await vueDe(supabase, moi, f, maintenant);
  const g = proposition.garder?.groupe ? await lireGroupe(supabase, gid) : null;
  return { proposition, ...(g ? { groupe: await vueDuGroupe(supabase, g, await membresDe(supabase, gid), q, maintenant) } : {}) };
}

/** 👥 Créer un groupe tout de suite, avec des proches (ils le voient dans Mes groupes, et le gardent s'ils veulent). */
export async function creerGroupe(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ groupe?: GroupeVue }>> {
  const t = themeDuGroupe(p.theme);
  if (!t) return { error: "Choisis une passion.", statut: 400 };
  const nom = s(p.nom).replace(/\s+/g, " ") || `${t.court[0].toUpperCase()}${t.court.slice(1)} ensemble`;
  const refusNom = refusDuGroupe(nom, NOM_GROUPE_MAX);
  if (refusNom) return { error: `Son nom ne passe pas : ${refusNom}.`, statut: 400 };
  const mot = s(p.mot).replace(/\s+/g, " ");
  const refusMot = mot ? refusDuGroupe(mot, MOT_GROUPE_MAX) : null;
  if (refusMot) return { error: `Le mot ne passe pas : ${refusMot}.`, statut: 400 };
  const maison = await maisonDeMoi(supabase, moi.id).catch(() => null);
  if (!maison) return { error: "Dis-nous d’abord si tu as 18 ans (dans Découvrir).", statut: 409 };
  if (t.adultes && maison !== "adultes") return { error: "Cette passion est réservée aux adultes.", statut: 403 };
  const cles = [...new Set((Array.isArray(p.cles) ? p.cles : []).map((x) => s(x)).filter(Boolean))].slice(0, MEMBRES_MAX - 1);
  const proches = await prochesDe(supabase, moi.id).catch(() => new Set<string>());
  const hs: string[] = [];
  for (const c of cles) {
    const h = await hDeCle(supabase, c).catch(() => null);
    if (h && h !== moi.id && proches.has(h) && (await seParlent(supabase, moi.id, h).catch(() => false))) hs.push(h);
  }
  if (!hs.length) return { error: "Choisis au moins un proche.", statut: 400 };
  const q = qui8(moi.id);
  if (!(await placePourUnGroupe(supabase, q))) return { error: PG.tropDeGroupes, statut: 409 };
  const maintenant = Date.now();
  const prenom = (await prenomDe(supabase, moi).catch(() => "")) || "Quelqu’un";
  const id = `g-${maintenant}-${q}-${randomBytes(3).toString("hex")}`;
  const g: FicheGroupe = { id, nom, ...(mot ? { mot } : {}), theme: t.id, q, prenom, maison, cree: true, le: maintenant };
  if (!(await ecrireJson(supabase, cheminGroupe(id), g))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  if (!(await devenirMembre(supabase, moi, id, maintenant))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  for (const h of hs) {
    const x = qui8(h);
    const inv: FicheInvitation = { id, h, q: x, de: prenom, le: maintenant };
    await ecrireJson(supabase, `${dossierInvites(id)}/${x}.json`, inv);
    await ecrireJson(supabase, `${dossierInvitationsGroupe(x)}/${id}.json`, inv);
    await prevenirUnHabitantAppli(supabase, h, { titre: `👥 ${prenom} te propose le groupe « ${nom} »`, corps: "Garde-le si tu veux : il sera dans Mes groupes.", url: LIEN, tag: `groupe-invite-${id}` }).catch(() => "rien");
  }
  return { groupe: await vueDuGroupe(supabase, g, await membresDe(supabase, id), q, maintenant) };
}

/** 💛 Garder un groupe où un proche m'invite (`non` : « Non merci »). */
export async function repondreGroupe(supabase: Supabase, moi: Habitant, idBrut: unknown, non = false): Promise<Resultat<{ groupe?: GroupeVue }>> {
  const id = idGroupeValide(idBrut);
  const q = qui8(moi.id);
  const chemin = id ? `${dossierInvitationsGroupe(q)}/${id}.json` : "";
  const inv = id ? await lireJson<Partial<FicheInvitation>>(supabase, chemin).catch(() => ({}) as Partial<FicheInvitation>) : {};
  const g = id && inv.id === id ? await lireGroupe(supabase, id) : null;
  if (!id || !g) return { error: "Ce groupe n’existe plus.", statut: 404 };
  const maintenant = Date.now();
  if (!non) {
    if (!(await estMembre(supabase, id, q))) {
      if (!(await placePourUnGroupe(supabase, q))) return { error: PG.tropDeGroupes, statut: 409 };
      if (!(await devenirMembre(supabase, moi, id, maintenant))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
    }
  }
  await effacer(supabase, [chemin, `${dossierInvites(id)}/${q}.json`]);
  return non ? {} : { groupe: await vueDuGroupe(supabase, g, await membresDe(supabase, id), q, maintenant) };
}
