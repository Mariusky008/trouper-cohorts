/**
 * 🎞️ DÉCOUVRIR, LE FIL « DE PIÈCE EN PIÈCE », CÔTÉ SERVEUR (le lot F1, 23 novembre 2026 ; `fil-decouvrir.ts`,
 * `docs/univers/fil.md`). Rien de nouveau n'est rangé : le fil lit ce qui existe déjà.
 *
 * - 🛋️ les salons où il y a quelqu'un d'autre que lui, en ce moment (`salonsEnDirect`) ;
 * - 📍 les figurines posées dans Autour, dans sa ville (les plus récentes, pas les siennes), assises avec leur mot ;
 * - ☀️ l'humeur du jour de ses proches (ceux à qui il parle), leur figurine qui en fait la tête ;
 * - sa figurine à lui, avec la tête de son humeur : elle est au bord de chaque pièce ;
 * - ce qui l'attend ailleurs : une invitation devant la télé d'un proche, des demandes de proche ;
 * - 🏡 (lot F2) les maisons ouvertes de ceux de son âge qui partagent une de ses passions (`maisonsPourLeFil`) ;
 * - 🎬 (lot F3) les séances en cours chez ses proches (`seancesDesProches`) ;
 * - 🧭 (lot F4) l'ordre (`ordreDuFil`) : ses proches en direct (leurs séances, les salons où ils sont), l'humeur de ses
 *   proches, ses passions, les maisons, Autour, les autres salons, puis ceux sans personne ; jamais deux fois de suite ;
 * - 🎁🚪 (lot F2) la surprise d'une visite qui l'attend dans « Messages » (un cadeau, quelqu'un qui a frappé) ;
 * - 🪑 à la fin, tous les autres salons, sans personne en ce moment (ses passions, la musique, le reste), avec ce qui s'y
 *   est dit aujourd'hui : on peut s'y asseoir le premier sans passer par « Tous les salons ».
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { salonsOuverts } from "./interrupteurs-serveur";
import { mesDemandes, mesInvitations, salonsEnDirect, seancesDesProches } from "./salons-ouverts-serveur";
import { carteDesFigurines, figurinesDuLieu } from "./autour-serveur";
import { lireLigne, prenomDe, prochesDe, saFigurineSignee } from "./ma-figurine-serveur";
import { humeurDuJour, poserProfil, qui8, seParlent } from "./talkie-serveur";
import { figurineDeLaMaison, teteDeLaMaison } from "./ma-maison-serveur";
import { pancarteDe } from "./mon-double-serveur";
import { humeurDe } from "./rituel";
import { estDouce } from "./humeur-reponse";
import { maisonsPourLeFil, mesVisites } from "./visites-serveur";
import { themeDe } from "./decouvrir";
import { ordreDuFil, type AutourFil, type FilVue, type HumeurFil, type MaisonFil, type PieceFil, type ProcheHumeurFil, type SalonFil, type SeanceFil, type SilhouetteFil } from "./fil-decouvrir";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/**
 * Sa figurine telle que le fil la montre : sa tête du jour (✨ choisie dans « Ma figurine », sinon celle de son humeur)
 * posée sur son corps, sinon sa figurine assise ; ✨ et sa pancarte, s'il en a une.
 */
export async function silhouetteDuFil(supabase: Supabase, h: string): Promise<SilhouetteFil | null> {
  const [tete, assise, pancarte] = await Promise.all([teteDeLaMaison(supabase, h).catch(() => null), figurineDeLaMaison(supabase, h).catch(() => null), pancarteDe(supabase, h).catch(() => "")]);
  const p = pancarte ? { pancarte } : {};
  if (tete) return { tete: tete.src, corps: { src: tete.corps, ratio: tete.ratio, boite: tete.boite }, ...p };
  const image = assise?.src || (await saFigurineSignee(supabase, h).catch(() => ""));
  return image ? { tete: image, image, ...p } : null;
}

/** ☀️ Ses proches (ceux à qui il parle) qui ont dit leur humeur aujourd'hui — les plus doux d'abord : on leur répond. */
async function humeursDesProches(supabase: Supabase, moi: Habitant): Promise<ProcheHumeurFil[]> {
  const miens = [...(await prochesDe(supabase, moi.id))].filter((h) => h !== moi.id).slice(0, 30);
  const vus = await Promise.all(
    miens.map(async (h): Promise<ProcheHumeurFil | null> => {
      const [humeur, parlent] = await Promise.all([humeurDuJour(supabase, h).catch(() => null), seParlent(supabase, moi.id, h).catch(() => false)]);
      const v = humeur && parlent ? humeurDe(humeur) : null;
      if (!humeur || !v) return null;
      const [cle, ligne, figurine] = await Promise.all([poserProfil(supabase, h), lireLigne(supabase, h).catch(() => ({ ligne: null })), silhouetteDuFil(supabase, h)]);
      if (!figurine) return null;
      return { cle, prenom: s(ligne.ligne?.prenom) || "Ton proche", humeur, emoji: v.emoji, nom: v.court, doux: estDouce(humeur), figurine };
    }),
  );
  return vus.filter((x): x is ProcheHumeurFil => Boolean(x)).sort((a, b) => Number(b.doux) - Number(a.doux)).slice(0, 4);
}

/** 📍 Les figurines posées dans sa ville (les plus récentes, pas les siennes), assises : deux au plus. */
async function poseesAutour(supabase: Supabase, moi: Habitant): Promise<AutourFil[]> {
  const ville = moi.villeSlug;
  if (!ville) return [];
  const carte = await carteDesFigurines(supabase, ville, moi);
  const recentes = carte.derniers.filter((f) => !f.moi).slice(0, 2);
  const vues = await Promise.all(
    recentes.map(async (f): Promise<AutourFil | null> => {
      const lieu = await figurinesDuLieu(supabase, ville, f.lieu, moi);
      const assise = lieu.figurines.find((x) => x.id === f.id) ?? f;
      return lieu.lieu ? { sorte: "autour", lieu: f.lieu, nomLieu: lieu.lieu.nom, figurine: assise } : null;
    }),
  );
  return vues.filter((x): x is AutourFil => Boolean(x));
}

/** 🏡 (lot F2) Les maisons ouvertes pour lui, avec la figurine de chacun (sans figurine, la maison ne vient pas). */
async function maisonsOuvertes(supabase: Supabase, moi: Habitant): Promise<MaisonFil[]> {
  const maisons = await maisonsPourLeFil(supabase, moi.id);
  const vues = await Promise.all(
    maisons.map(async (m): Promise<MaisonFil | null> => {
      const [figurine, t] = [await silhouetteDuFil(supabase, m.h).catch(() => null), themeDe(m.passion)];
      if (!figurine || !t) return null;
      return { sorte: "maison", cle: m.cle, prenom: m.prenom, image: m.image, figurine, passion: { e: t.e, nom: t.nom, court: t.court }, ...(m.coucou ? { coucou: m.coucou } : {}) };
    }),
  );
  return vues.filter((x): x is MaisonFil => Boolean(x));
}

/** 🎁🚪 (lot F2) La surprise d'une visite qui l'attend : un cadeau à ouvrir d'abord, sinon quelqu'un qui a frappé. */
async function surpriseDeVisite(supabase: Supabase, moi: Habitant): Promise<FilVue["surprise"]> {
  const v = await mesVisites(supabase, moi.id);
  const cadeau = v?.enAttente[0];
  if (cadeau) return { genre: "cadeau", prenom: cadeau.de };
  const toc = v?.passes.find((x) => x.nouveau && !x.ignore);
  return toc ? { genre: "toc", prenom: toc.prenom } : undefined;
}

/** 🧭 (lot F4) Ses proches (des deux côtés) qui sont dans ces salons en ce moment : leurs identifiants courts. */
async function prochesDansLesSalons(supabase: Supabase, moi: Habitant, salons: SalonFil[]): Promise<Set<string>> {
  const ici = new Set(salons.flatMap((x) => x.presents.map((p) => p.q)));
  if (!ici.size) return new Set();
  const miens = [...(await prochesDe(supabase, moi.id))].filter((h) => h !== moi.id && ici.has(qui8(h))).slice(0, 30);
  const parlent = await Promise.all(miens.map((h) => seParlent(supabase, moi.id, h).catch(() => false)));
  return new Set(miens.filter((_, i) => parlent[i]).map(qui8));
}

/** 🎞️ Le fil : ses pièces, dans l'ordre (`ordreDuFil`, lot F4), et sa figurine. */
export async function filDecouvrir(supabase: Supabase, moi: Habitant): Promise<FilVue> {
  const ouverts = salonsOuverts();
  const [prenom, figurine, direct, autour, humeurs, invitations, demandes, maisons, surprise, seances] = await Promise.all([
    prenomDe(supabase, moi).catch(() => ""),
    silhouetteDuFil(supabase, moi.id),
    ouverts ? salonsEnDirect(supabase, moi).catch((): Awaited<ReturnType<typeof salonsEnDirect>> => ({ salons: [] })) : Promise.resolve<Awaited<ReturnType<typeof salonsEnDirect>>>({ salons: [] }),
    poseesAutour(supabase, moi).catch(() => [] as AutourFil[]),
    humeursDesProches(supabase, moi).catch(() => [] as ProcheHumeurFil[]),
    mesInvitations(supabase, moi).catch(() => []),
    ouverts ? mesDemandes(supabase, moi).catch(() => []) : Promise.resolve([]),
    maisonsOuvertes(supabase, moi).catch(() => [] as MaisonFil[]),
    surpriseDeVisite(supabase, moi).catch(() => undefined),
    seancesDesProches(supabase, moi).catch(() => [] as SeanceFil[]),
  ]);
  const proches = await prochesDansLesSalons(supabase, moi, direct.salons).catch(() => new Set<string>());
  const vivants = direct.salons
    .filter((x) => x.presents.length)
    .map((x): SalonFil => {
      const la = x.presents.filter((p) => proches.has(p.q)).map((p) => p.prenom);
      return la.length ? { ...x, proches: la } : x;
    });
  const vides = direct.salons.filter((x) => !x.presents.length);
  // (🧭 lot F4 : ses proches en direct — leurs séances, les salons où ils sont —, l'humeur de ses proches, ses passions,
  // les maisons, Autour, les autres salons ; puis ceux sans personne)
  const avecProches = vivants.filter((x) => x.proches);
  const passions = vivants.filter((x) => !x.proches && x.mien);
  const autres = vivants.filter((x) => !x.proches && !x.mien);
  const humeur: HumeurFil[] = humeurs.length ? [{ sorte: "humeur", proches: humeurs }] : [];
  const groupes: PieceFil[][] = [seances, avecProches, humeur, passions, maisons, autour, autres, vides];
  const inv = invitations[0];
  return {
    moi: { prenom: prenom || "Toi", figurine },
    ...(direct.age ? { age: true as const } : {}),
    pieces: ordreDuFil(groupes),
    ...(inv ? { invitation: { cle: inv.cle, prenom: inv.prenom } } : {}),
    ...(demandes.length ? { demandes: demandes.length } : {}),
    ...(surprise ? { surprise } : {}),
  };
}
