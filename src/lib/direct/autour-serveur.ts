/**
 * 📍 AUTOUR DE MOI — le serveur (le partagé : `autour.ts` ; le plan : `docs/reprise.md`, section 4).
 *
 * RANGÉ DANS LE SEAU, PAS DE TABLE :
 *   · `autour/<ville>/<lieu>/<mème>.<qui>.<habitant>.json` = { id, h, le, qui, mot?, nomLieu?, reponseA? } — QUI LE
 *     VOIT ET DE QUI IL EST SONT DANS LE NOM : une liste du dossier suffit pour compter ce qu'une personne peut voir,
 *     sans ouvrir un seul fichier ;
 *   · `<habitant>/autour/<mème>.json` = { ville, lieu, qui, le } : les siens (le retirer, son profil) ;
 *   · `<habitant>/autour-jour/<jour>.json` = { <lieu>: n } : trois par lieu et par jour, au plus ;
 *   · `profils/<clé>.json` = { h } : son profil se demande par une clé publique, jamais par son identifiant.
 * Un mème n'est posé qu'à un endroit : le reposer ailleurs le déplace.
 *
 * FICHIER SERVEUR.
 */
import { createHash, randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { motInterdit } from "@/lib/direct/mots-interdits";
import { lirePhotosDuLieu } from "@/lib/site-internet/photos-du-lieu";
import { parleDAlcool } from "@/lib/direct/meme-surprise";
import { SANS_AGE, SEAU_FIGURINES, aConfirmeSonAge, ajouterProche, cartesDeMemes, ecrireJson, lireJson, memeDeposable, memesCaches, prochesDe, retirerProche, saFigurineSignee } from "@/lib/direct/ma-figurine-serveur";
import { calquesDeFigurine } from "@/lib/direct/calques-figurine-serveur";
import { sesExpressions } from "@/lib/direct/expressions-figurine-serveur";
import { ecrireSaPancarte, pancarteDe, teteChoisieDuJour } from "@/lib/direct/mon-double-serveur";
import { EXPRESSIONS_FIGURINE, expressionFigurineValide, type ExpressionFigurine } from "@/lib/direct/expressions-figurine";
import { figurineDeLaMaison } from "@/lib/direct/ma-maison-serveur";
import {
  EMOJIS_LIEUX_PUBLICS,
  MOT_DU_JOUR_MAX,
  POSES_PAR_JOUR,
  heureDePose,
  idDePose,
  poseEnCours,
  type FigurinePosee,
  type MesTetes,
  type TeteChoisie,
  MOT_MAX,
  NOM_LIEU_PUBLIC_MAX,
  PAR_LIEU_PAR_JOUR,
  centreDeZone,
  emojiDuCommerce,
  estZone,
  idLieuPublic,
  lieuIdValide,
  nomLieuPropre,
  quiValide,
  zoneDe,
  type Lieu,
  type LieuPublic,
  type MemeAutour,
  type ProfilAutour,
  type Qui,
} from "@/lib/direct/autour";

type Supabase = ReturnType<typeof createAdminClient>;
type Ligne = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const jourParis = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

type Depot = { id: string; h: string; le: string; qui: Qui; mot?: string; nomLieu?: string; reponseA?: string };
const nomFichier = (id: string, qui: Qui, h: string) => `${id}.${qui}.${h}.json`;
const lireNom = (n: string): { id: string; qui: Qui; h: string } | null => {
  const m = /^([a-z0-9]{12})\.(tous|proches|moi)\.([0-9a-f-]{36})\.json$/.exec(n);
  return m ? { id: m[1], qui: m[2] as Qui, h: m[3] } : null;
};
export const cleProfil = (h: string) => createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

/**
 * 👀 QUI REGARDE : lui (ou personne), et les proches de chaque AUTEUR (lus une fois par auteur).
 *
 * Peut-il voir ce dépôt ? « Tout le monde » : oui. « Moi seul » : son auteur. « Mes proches » : son auteur, et ceux que
 * L'AUTEUR a dans SES proches (ses duos, ceux qu'il a ajoutés) — jamais quelqu'un qui l'aurait ajouté, lui, de son côté
 * (le 7 novembre 2026, avec « 👯 Ajouter en proche » : s'ajouter ne donne rien à voir).
 */
type Regard = { moi: string | null; prochesDe: (h: string) => Promise<Set<string>> };
function regardDe(supabase: Supabase, moi: string | null): Regard {
  const lus = new Map<string, Promise<Set<string>>>();
  return {
    moi,
    prochesDe: (h) => {
      if (!lus.has(h)) lus.set(h, prochesDe(supabase, h));
      return lus.get(h)!;
    },
  };
}
async function visible(d: { qui: Qui; h: string }, r: Regard): Promise<boolean> {
  if (d.qui === "tous") return true;
  if (!r.moi) return false;
  if (d.h === r.moi) return true;
  return d.qui === "proches" && (await r.prochesDe(d.h)).has(r.moi);
}

async function lister(supabase: Supabase, dossier: string): Promise<{ name: string; created_at?: string }[]> {
  const tout: { name: string; created_at?: string }[] = [];
  for (let debut = 0; debut < 20_000; debut += 1000) {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 1000, offset: debut, sortBy: { column: "created_at", order: "desc" } });
    const lot = (Array.isArray(data) ? data : []) as { name?: string; created_at?: string }[];
    tout.push(...lot.map((x) => ({ name: s(x.name), created_at: x.created_at })));
    if (lot.length < 1000) break;
  }
  return tout;
}

// ─── les commerces de la ville, avec leurs coordonnées ; et ses lieux publics ──────────────────────────────────────
// (`public` : un lieu public nommé, avec son emoji — `lieuxFixesDe`)
type Commerce = { id: string; nom: string; activite: string; lat: number; lng: number; public?: true; emoji?: string };
const villeDe = (city: unknown) => villeSlug(s(city).replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim());
export async function commercesDe(supabase: Supabase, ville: string): Promise<Commerce[]> {
  if (!ville) return [];
  try {
    const { data, error } = await supabase
      .from("human_vitrine_sites")
      .select("slug, business_name, city, activite, latitude, longitude")
      .eq("est_client", true)
      .not("latitude", "is", null)
      .limit(500);
    if (error) return []; // (les colonnes latitude/longitude pas encore migrées : pas de commerces sur la carte)
    return ((Array.isArray(data) ? data : []) as Ligne[])
      .filter((x) => villeDe(x.city) === ville && /^[a-z0-9-]{2,120}$/.test(s(x.slug)) && Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude)))
      .map((x) => ({ id: `c-${s(x.slug)}`, nom: s(x.business_name), activite: s(x.activite), lat: Number(x.latitude), lng: Number(x.longitude) }));
  } catch {
    return [];
  }
}

/**
 * 🖼️ LA PHOTO D'UN COMMERCE, en haut de la page de son lieu : comme sa page de famille (`app/f/[slug]`) — sa
 * couverture ClikMe (si elle est faite, et qu'il n'est pas revenu à l'originale : `couvertureAffichee`), sinon sa
 * devanture, sa salle, ou la première photo de sa fiche Google. Une adresse https seulement : jamais une photo à lui en
 * `data:` (bien trop lourde ici). Rien : la page garde son fond, et son emoji.
 */
async function photoDuCommerce(supabase: Supabase, slug: string): Promise<string> {
  try {
    const { data } = await supabase.from("human_vitrine_sites").select("diagnostic, metadata").eq("slug", slug).maybeSingle();
    const row = (data ?? {}) as Ligne;
    const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Ligne;
    const c = (diag.couverture && typeof diag.couverture === "object" ? diag.couverture : {}) as Ligne;
    const lieu = lirePhotosDuLieu(row.metadata);
    const google = Array.isArray(diag.photos) ? diag.photos.map(s) : [];
    return [c.etat !== "originale" ? s(c.url) : "", lieu.devanture?.url, lieu.interieur?.url, ...google].map(s).find((u) => /^https:\/\//i.test(u)) ?? "";
  } catch {
    return "";
  }
}

/** 🏛️ Les lieux publics nommés d'une ville (`lieux-publics/<ville>.json`), placés par l'admin. */
const cheminLieuxPublics = (ville: string) => `lieux-publics/${ville}.json`;
export async function lieuxPublicsDe(supabase: Supabase, ville: string): Promise<LieuPublic[]> {
  if (!ville) return [];
  const f = await lireJson<{ lieux?: unknown[] }>(supabase, cheminLieuxPublics(ville));
  return (Array.isArray(f.lieux) ? f.lieux : [])
    .map((x) => (x && typeof x === "object" ? (x as Ligne) : {}))
    .map((x) => ({ id: s(x.id), nom: s(x.nom), emoji: s(x.emoji) || "📍", lat: Number(x.lat), lng: Number(x.lng) }))
    .filter((x) => /^p-[a-z0-9-]{2,60}$/.test(x.id) && x.nom && Number.isFinite(x.lat) && Number.isFinite(x.lng));
}
/** Les lieux où l'on dépose par leur nom : les commerces clients, et les lieux publics. */
export async function lieuxFixesDe(supabase: Supabase, ville: string): Promise<Commerce[]> {
  const [commerces, publics] = await Promise.all([commercesDe(supabase, ville), lieuxPublicsDe(supabase, ville)]);
  return [...commerces, ...publics.map((p) => ({ id: p.id, nom: p.nom, activite: "", lat: p.lat, lng: p.lng, public: true as const, emoji: p.emoji }))];
}
const emojiDe = (c: Commerce) => c.emoji || emojiDuCommerce(c.activite);

/**
 * 🏛️ L'ADMIN PLACE UN LIEU PUBLIC (son nom, son emoji, sa position : touchée sur la vraie carte), ou le retire. Un lieu
 * retiré quitte la carte ; les mèmes qui y étaient ne se montrent plus.
 */
export async function placerLieuPublic(supabase: Supabase, ville: unknown, x: { nom?: unknown; emoji?: unknown; lat?: unknown; lng?: unknown }): Promise<{ lieu?: LieuPublic; error?: string }> {
  const v = villeSlug(s(ville));
  if (!v) return { error: "Quelle ville ?" };
  const nom = s(x.nom).replace(/\s+/g, " ").trim().slice(0, NOM_LIEU_PUBLIC_MAX);
  const id = idLieuPublic(nom);
  if (!id || motInterdit(nom)) return { error: "Donne-lui un nom (2 lettres au moins)." };
  const emoji = (EMOJIS_LIEUX_PUBLICS as readonly string[]).includes(s(x.emoji)) ? s(x.emoji) : "📍";
  const lat = Number(x.lat);
  const lng = Number(x.lng);
  // (la France métropolitaine, à peu près : une position touchée sur la carte, pas un zéro oublié)
  if (!(lat > 41 && lat < 51.5 && lng > -5.5 && lng < 10)) return { error: "Touche la carte, là où il est." };
  const avant = await lieuxPublicsDe(supabase, v);
  const lieu: LieuPublic = { id, nom, emoji, lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
  const ok = await ecrireJson(supabase, cheminLieuxPublics(v), { lieux: [...avant.filter((l) => l.id !== id), lieu] });
  return ok ? { lieu } : { error: "Pas enregistré." };
}
export async function retirerLieuPublic(supabase: Supabase, ville: unknown, id: unknown): Promise<{ error?: string }> {
  const v = villeSlug(s(ville));
  const avant = await lieuxPublicsDe(supabase, v);
  if (!avant.some((l) => l.id === s(id))) return { error: "Ce lieu n’existe pas." };
  return (await ecrireJson(supabase, cheminLieuxPublics(v), { lieux: avant.filter((l) => l.id !== s(id)) })) ? {} : { error: "Pas enregistré." };
}

// ─── déposer, retirer ──────────────────────────────────────────────────────────────────────────────────────────────
export type Demande = { meme: unknown; lieu?: unknown; ici?: unknown; qui?: unknown; mot?: unknown; nomLieu?: unknown; reponseA?: unknown };

/**
 * 📍 DÉPOSER SON MÈME : dans un commerce de sa ville (`lieu`), ou « Ailleurs » (`ici` : sa position, ARRONDIE ici en une
 * zone d'environ 500 m — elle n'est gardée nulle part telle quelle). `reponseA` : le mème du même lieu auquel il répond.
 */
// (`aPrevenir` : l'auteur du mème auquel il répond — à prévenir s'il peut voir la réponse : `appli-collection-serveur.ts`)
export type APrevenir = { auteur: string; meme: string; ou: string; url: string };
export async function deposer(supabase: Supabase, habitant: Habitant, d: Demande): Promise<{ ok?: true; lieu?: string; error?: string; statut?: number; age?: true; aPrevenir?: APrevenir }> {
  // 🔞 un mème dans la ville : réservé aux 15 ans et plus (son âge déclaré : `ma-figurine.ts`, `AGE_MINIMUM`)
  if (!(await aConfirmeSonAge(supabase, habitant.id))) return SANS_AGE;
  const ville = habitant.villeSlug;
  if (!ville) return { error: "Il faut d’abord ta ville.", statut: 400 };
  const qui = quiValide(d.qui ?? "tous");
  if (!qui) return { error: "Qui le voit ? Tout le monde, tes proches, ou toi seul.", statut: 400 };
  const peut = await memeDeposable(supabase, habitant, d.meme);
  if (!peut.ok) return { error: peut.error, statut: 400 };
  const id = s(d.meme);
  // LE LIEU : un commerce de sa ville, une zone « Ailleurs » qui a déjà des mèmes (pour y répondre), ou sa zone
  let lieu = "";
  let zoneExistante = false;
  if (d.lieu) {
    const l = s(d.lieu);
    const existe = !lieuIdValide(l)
      ? false
      : estZone(l)
        ? (await lister(supabase, `autour/${ville}/${l}`)).some((x) => lireNom(x.name))
        : (await lieuxFixesDe(supabase, ville)).some((c) => c.id === l);
    if (!existe) return { error: "Ce lieu n’est pas à " + ville + ".", statut: 400 };
    lieu = l;
    zoneExistante = estZone(l);
  } else {
    const p = (d.ici && typeof d.ici === "object" ? d.ici : {}) as { lat?: unknown; lng?: unknown };
    const z = zoneDe(Number(p.lat), Number(p.lng));
    if (!z) return { error: "Choisis un lieu, ou laisse ton téléphone dire où tu es.", statut: 400 };
    lieu = z.id;
  }
  // LE PETIT MOT, LE PETIT NOM (zone) : courts, sans gros mot, rien d'alcoolisé, pas d'adresse
  const mot = s(d.mot).replace(/\s+/g, " ").trim().slice(0, MOT_MAX);
  if (mot && (motInterdit(mot) || parleDAlcool(mot))) return { error: "Ça, ta figurine ne le dit pas. Écris autre chose 🙂", statut: 400 };
  // (une zone garde le petit nom que lui a donné son premier mème : y répondre ne la renomme pas)
  const nl = estZone(lieu) && !zoneExistante ? nomLieuPropre(d.nomLieu) : {};
  if (nl.refus) return { error: nl.refus, statut: 400 };
  if (nl.nom && (motInterdit(nl.nom) || parleDAlcool(nl.nom))) return { error: "Ce petit nom ne passe pas. Écris autre chose 🙂", statut: 400 };
  // UNE RÉPONSE : à un mème du même lieu, qu'il peut voir
  const reponseA = s(d.reponseA);
  let origine: { id: string; qui: Qui; h: string } | null = null;
  if (reponseA) {
    if (!/^[a-z0-9]{12}$/.test(reponseA) || reponseA === id) return { error: "Ce mème n’existe plus.", statut: 400 };
    const la = (await lister(supabase, `autour/${ville}/${lieu}`)).map((x) => lireNom(x.name)).find((x) => x?.id === reponseA);
    if (!la || !(await visible(la, regardDe(supabase, habitant.id)))) return { error: "Ce mème n’est plus à cet endroit.", statut: 400 };
    origine = la;
  }
  // TROIS PAR LIEU ET PAR JOUR
  const jour = jourParis();
  const cheminJour = `${habitant.id}/autour-jour/${jour}.json`;
  const parLieu = await lireJson<Record<string, number>>(supabase, cheminJour);
  const avant = await lireJson<{ ville: string; lieu: string; qui: Qui }>(supabase, `${habitant.id}/autour/${id}.json`);
  const memeLieu = avant.lieu === lieu && avant.ville === ville;
  if (!memeLieu && (Number(parLieu[lieu]) || 0) >= PAR_LIEU_PAR_JOUR) return { error: `Trois mèmes ici aujourd’hui, c’est le maximum. Reviens demain !`, statut: 429 };
  // UN MÈME N'EST QU'À UN ENDROIT : l'ancien dépôt s'en va
  if (avant.lieu && avant.ville) await supabase.storage.from(SEAU_FIGURINES).remove([`autour/${avant.ville}/${avant.lieu}/${nomFichier(id, quiValide(avant.qui) ?? "tous", habitant.id)}`]);
  const depot: Depot = { id, h: habitant.id, le: new Date().toISOString(), qui, ...(mot ? { mot } : {}), ...(nl.nom ? { nomLieu: nl.nom } : {}), ...(reponseA ? { reponseA } : {}) };
  const ok =
    (await ecrireJson(supabase, `autour/${ville}/${lieu}/${nomFichier(id, qui, habitant.id)}`, depot)) &&
    (await ecrireJson(supabase, `${habitant.id}/autour/${id}.json`, { ville, lieu, qui, le: depot.le })) &&
    (await ecrireJson(supabase, `profils/${cleProfil(habitant.id)}.json`, { h: habitant.id })) &&
    (memeLieu || (await ecrireJson(supabase, cheminJour, { ...parLieu, [lieu]: (Number(parLieu[lieu]) || 0) + 1 })));
  if (!ok) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  // ↩️ L'AUTEUR DU MÈME AUQUEL IL RÉPOND, s'il peut voir cette réponse (pas « moi seul » ; « mes proches » : s'il en est)
  if (origine && origine.h !== habitant.id && (await visible({ qui, h: habitant.id }, regardDe(supabase, origine.h)))) {
    const c = estZone(lieu) ? null : (await lieuxFixesDe(supabase, ville)).find((x) => x.id === lieu);
    // (une zone : le petit nom de la soirée, celui du mème auquel il répond)
    const ou = c ? `${emojiDe(c)} ${c.nom}` : `✨ ${s((await lireJson<Depot>(supabase, `autour/${ville}/${lieu}/${nomFichier(origine.id, origine.qui, origine.h)}`)).nomLieu) || "Quelque part par ici"}`;
    return { ok: true, lieu, aPrevenir: { auteur: origine.h, meme: id, ou, url: `/collection?autour=${encodeURIComponent(lieu)}&meme=${id}#autour` } };
  }
  return { ok: true, lieu };
}

/** Il retire son mème de l'endroit où il l'avait posé. */
export async function retirer(supabase: Supabase, habitant: Habitant, meme: unknown): Promise<{ ok: true }> {
  await retirerDepot(supabase, habitant.id, s(meme));
  return { ok: true };
}
/** Son dépôt quitte la carte (lui, ou la modération : `moderation-serveur.ts`). */
export async function retirerDepot(supabase: Supabase, h: string, id: string): Promise<void> {
  if (!/^[a-z0-9]{12}$/.test(id) || !h) return;
  const avant = await lireJson<{ ville: string; lieu: string; qui: Qui }>(supabase, `${h}/autour/${id}.json`);
  if (avant.ville && avant.lieu) {
    await supabase.storage.from(SEAU_FIGURINES).remove([`autour/${avant.ville}/${avant.lieu}/${nomFichier(id, quiValide(avant.qui) ?? "tous", h)}`, `${h}/autour/${id}.json`]);
  }
}
/** 🛡️ Où il est déposé, pour la modération : le lieu (son nom), qui le voit, son petit mot. */
export async function depotPourModeration(supabase: Supabase, h: string, id: string): Promise<{ lieu: string; nom: string; qui: Qui; mot?: string } | null> {
  if (!/^[a-z0-9]{12}$/.test(id) || !h) return null;
  const avant = await lireJson<{ ville: string; lieu: string; qui: Qui }>(supabase, `${h}/autour/${id}.json`);
  if (!avant.ville || !avant.lieu) return null;
  const qui = quiValide(avant.qui) ?? "tous";
  const d = await lireJson<Depot>(supabase, `autour/${avant.ville}/${avant.lieu}/${nomFichier(id, qui, h)}`);
  const commerce = estZone(avant.lieu) ? null : (await lieuxFixesDe(supabase, avant.ville)).find((c) => c.id === avant.lieu);
  return { lieu: avant.lieu, nom: commerce?.nom || s(d.nomLieu) || "Ailleurs, quelque part par ici", qui, ...(s(d.mot) ? { mot: s(d.mot) } : {}) };
}

// ─── lire : la carte, un lieu, un profil ───────────────────────────────────────────────────────────────────────────
type Pose = { id: string; qui: Qui; h: string; le: string };
/** Ce qu'il peut voir dans un lieu, les plus récents d'abord. */
async function posesVisibles(supabase: Supabase, ville: string, lieu: string, regard: Regard): Promise<Pose[]> {
  const poses = (await lister(supabase, `autour/${ville}/${lieu}`))
    .map((x) => {
      const n = lireNom(x.name);
      return n ? { ...n, le: s(x.created_at) } : null;
    })
    .filter((x): x is Pose => Boolean(x));
  const vues = await Promise.all(poses.map((p) => visible(p, regard)));
  return poses.filter((_, k) => vues[k]);
}

/** Des poses en cartes : la vidéo, le prénom, les réactions ; et ce que dit le dépôt (mot, petit nom, réponse). */
async function enCartes(supabase: Supabase, ville: string, lieu: string, poses: Pose[], moi: Habitant | null, max = 40): Promise<MemeAutour[]> {
  const garde = poses.slice(0, max);
  const [cartes, depots] = await Promise.all([
    cartesDeMemes(supabase, garde.map((p) => p.id), ville, moi),
    Promise.all(garde.map((p) => lireJson<Depot>(supabase, `autour/${ville}/${lieu}/${nomFichier(p.id, p.qui, p.h)}`))),
  ]);
  const parId = new Map(garde.map((p, k) => [p.id, { pose: p, depot: depots[k] }]));
  const reponses = new Map<string, number>();
  for (const d of depots) if (s(d.reponseA)) reponses.set(s(d.reponseA), (reponses.get(s(d.reponseA)) ?? 0) + 1);
  return cartes
    .map((c) => {
      const x = parId.get(c.id);
      if (!x) return null;
      const d = x.depot;
      return {
        ...c,
        lieu,
        qui: x.pose.qui,
        profil: cleProfil(x.pose.h),
        reponses: reponses.get(c.id) ?? 0,
        ...(s(d.mot) ? { mot: s(d.mot) } : {}),
        ...(s(d.nomLieu) ? { nomLieu: s(d.nomLieu) } : {}),
        ...(s(d.reponseA) ? { reponseA: s(d.reponseA) } : {}),
      } as MemeAutour;
    })
    .filter((x): x is MemeAutour => Boolean(x));
}

/**
 * 🗺️ LA CARTE D'UNE VILLE : ses commerces (avec ce qu'il peut y voir), les zones qui ont des mèmes, et les derniers
 * mèmes autour de lui. Une zone se montre à son CENTRE, jamais à la position de qui que ce soit.
 */
export async function carteDe(supabase: Supabase, ville: string, moi: Habitant | null): Promise<{ ville: string; lieux: Lieu[]; derniers: MemeAutour[] }> {
  if (!ville) return { ville, lieux: [], derniers: [] };
  const [commerces, dossiers] = await Promise.all([lieuxFixesDe(supabase, ville), lister(supabase, `autour/${ville}`)]);
  const ids = new Set([...commerces.map((c) => c.id), ...dossiers.map((d) => d.name).filter((n) => lieuIdValide(n))]);
  const poses = new Map<string, Pose[]>();
  const regard = regardDe(supabase, moi?.id ?? null);
  await Promise.all([...ids].map(async (l) => poses.set(l, await posesVisibles(supabase, ville, l, regard))));
  // (un mème signalé, ou retiré par la modération, ne compte plus sur la carte)
  const caches = await memesCaches(supabase, [...poses.values()].flat().map((p) => p.id));
  if (caches.size) for (const [l, p] of poses) poses.set(l, p.filter((x) => !caches.has(x.id)));
  const visages = new Map<string, Promise<string>>();
  const visage = (h: string) => {
    if (!visages.has(h)) visages.set(h, saFigurineSignee(supabase, h).catch(() => ""));
    return visages.get(h)!;
  };
  const lieux: Lieu[] = [];
  for (const id of ids) {
    const p = poses.get(id) ?? [];
    const c = commerces.find((x) => x.id === id);
    const centre = c ? { lat: c.lat, lng: c.lng } : centreDeZone(id);
    if (!centre || (!c && !p.length)) continue;
    const auteurs = [...new Set(p.map((x) => x.h))].slice(0, 3);
    // (le petit nom d'une zone : celui de son premier mème, le plus ancien)
    const premier = p[p.length - 1];
    const nomZone = !c && premier ? s((await lireJson<Depot>(supabase, `autour/${ville}/${id}/${nomFichier(premier.id, premier.qui, premier.h)}`)).nomLieu) : "";
    lieux.push({
      id,
      type: c ? (c.public ? "public" : "commerce") : "zone",
      nom: c ? c.nom : nomZone || "Quelque part par ici",
      emoji: c ? emojiDe(c) : "✨",
      lat: centre.lat,
      lng: centre.lng,
      n: p.length,
      visages: (await Promise.all(auteurs.map(visage))).filter(Boolean),
      ...(c?.activite ? { activite: c.activite } : {}),
    });
  }
  // LES DERNIERS AUTOUR DE LUI : les plus récents, tous lieux confondus
  const recents = [...poses.entries()]
    .flatMap(([l, ps]) => ps.map((p) => ({ l, p })))
    .sort((a, b) => b.p.le.localeCompare(a.p.le))
    .slice(0, 8);
  const derniers = (await Promise.all(recents.map(({ l, p }) => enCartes(supabase, ville, l, [p], moi, 1)))).flat();
  return { ville, lieux: lieux.sort((a, b) => b.n - a.n), derniers };
}

/** 📍 Les mèmes d'un lieu, pour le swipe : ce qu'il peut voir, les plus récents d'abord (ses proches devant). */
export async function memesDuLieu(supabase: Supabase, ville: string, lieu: string, moi: Habitant | null): Promise<{ lieu: Lieu | null; memes: MemeAutour[] }> {
  if (!ville || !lieuIdValide(lieu)) return { lieu: null, memes: [] };
  const [poses, commerces] = await Promise.all([posesVisibles(supabase, ville, lieu, regardDe(supabase, moi?.id ?? null)), estZone(lieu) ? Promise.resolve([]) : lieuxFixesDe(supabase, ville)]);
  const c = commerces.find((x) => x.id === lieu);
  const centre = c ? { lat: c.lat, lng: c.lng } : centreDeZone(lieu);
  if (!centre || (!c && !poses.length)) return { lieu: null, memes: [] };
  const [memes, photo] = await Promise.all([enCartes(supabase, ville, lieu, poses, moi), c && !c.public ? photoDuCommerce(supabase, lieu.slice(2)) : Promise.resolve("")]);
  return {
    lieu: {
      id: lieu,
      type: c ? (c.public ? "public" : "commerce") : "zone",
      nom: c ? c.nom : [...memes].reverse().find((m) => m.nomLieu)?.nomLieu || "Quelque part par ici",
      emoji: c ? emojiDe(c) : "✨",
      lat: centre.lat,
      lng: centre.lng,
      n: memes.length,
      visages: [],
      ...(c?.activite ? { activite: c.activite } : {}),
      ...(photo ? { photo } : {}),
    },
    memes,
  };
}

/** 👤 Le profil d'un créateur : sa figurine, ses mèmes déposés pour TOUT LE MONDE et leurs lieux ; jamais sa position. */
export async function profilDe(supabase: Supabase, cle: unknown, moi: Habitant | null): Promise<ProfilAutour | null> {
  if (!/^[a-f0-9]{16}$/.test(s(cle))) return null;
  const h = s((await lireJson<{ h: string }>(supabase, `profils/${s(cle)}.json`)).h);
  if (!h) return null;
  const { data } = await supabase.from("clik_ma_figurine").select("prenom").eq("habitant_id", h).maybeSingle();
  const prenom = s((data as Ligne | null)?.prenom);
  const [image, siens] = await Promise.all([saFigurineSignee(supabase, h).catch(() => ""), lister(supabase, `${h}/autour`)]);
  const fiches = await Promise.all(
    siens
      .map((x) => /^([a-z0-9]{12})\.json$/.exec(x.name)?.[1] ?? "")
      .filter(Boolean)
      .slice(0, 30)
      .map(async (id) => ({ id, f: await lireJson<{ ville: string; lieu: string; qui: Qui; le: string }>(supabase, `${h}/autour/${id}.json`) })),
  );
  const publics = fiches.filter((x) => x.f.qui === "tous" && s(x.f.ville) && s(x.f.lieu)).map((x) => ({ id: x.id, ville: s(x.f.ville), lieu: s(x.f.lieu), le: s(x.f.le) }));
  const memes = (await Promise.all(publics.map((x) => enCartes(supabase, x.ville, x.lieu, [{ id: x.id, qui: "tous", h, le: x.le }], moi, 1)))).flat();
  const commerces = new Map<string, string>();
  for (const v of [...new Set(publics.map((x) => x.ville))]) for (const c of await lieuxFixesDe(supabase, v)) commerces.set(c.id, c.nom);
  const lieux = new Map<string, { id: string; nom: string; n: number }>();
  for (const m of memes) {
    const nom = commerces.get(m.lieu) ?? m.nomLieu ?? "Quelque part par ici";
    const l = lieux.get(m.lieu) ?? { id: m.lieu, nom, n: 0 };
    l.n++;
    lieux.set(m.lieu, l);
  }
  // (son profil à lui ; sinon, est-il dans ses proches ?)
  const lui = moi?.id === h;
  const proche = moi && !lui ? (await prochesDe(supabase, moi.id)).has(h) : false;
  return { cle: s(cle), prenom, image, memes, lieux: [...lieux.values()].sort((a, b) => b.n - a.n), ...(lui ? { moi: true } : {}), ...(proche ? { proche: true } : {}) };
}

/**
 * 👯 « AJOUTER EN PROCHE », depuis son profil (ou l'en retirer) : il entre dans SA liste — il verra ce que celui-ci dépose
 * pour « Mes proches », et ses mèmes passeront devant pour lui. Par la clé du profil, jamais par l'identifiant.
 */
export async function devenirProche(supabase: Supabase, moi: Habitant, cle: unknown, oui: unknown): Promise<{ proche?: boolean; error?: string; statut?: number }> {
  if (!/^[a-f0-9]{16}$/.test(s(cle))) return { error: "Ce profil n’existe pas.", statut: 404 };
  const h = s((await lireJson<{ h: string }>(supabase, `profils/${s(cle)}.json`)).h);
  if (!h) return { error: "Ce profil n’existe pas.", statut: 404 };
  if (h === moi.id) return { error: "C’est toi 🙂", statut: 400 };
  const ok = oui === true ? await ajouterProche(supabase, moi.id, h) : await retirerProche(supabase, moi.id, h);
  return ok ? { proche: oui === true } : { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
}

// ═══ 🧍 LA FIGURINE POSÉE (22 novembre 2026, le nouvel « Autour » ; `docs/univers/autour.md`) ═══════════════════════
/*
 * RANGÉ DANS LE SEAU, COMME LES MÈMES :
 *   · `autour-fig/<ville>/<lieu>/<pose>.<qui>.<habitant>.json` = { id, h, le, qui, mot, tete, nomLieu?, reponseA? } — qui
 *     la voit et de qui elle est sont dans le nom ; l'identifiant de la pose porte son heure (`idDePose`) : passées 24 h,
 *     elle ne se montre plus, sans ouvrir un seul fichier ;
 *   · `<habitant>/autour-fig/<pose>.json` = { ville, lieu, qui } : les siennes (la retirer) ;
 *   · `<habitant>/autour-fig-jour/<jour>.json` = { n } : trois par jour, au plus ;
 *   · `autour-fig-signal/<pose>.json` = { par: [habitants] } : trois signalements, elle s'en va ; et
 *     `<habitant>/autour-fig-caches.json` = { ids } : celui qui la signale ne la voit plus.
 */
type DepotFig = { id: string; h: string; le: string; qui: Qui; mot: string; tete: TeteChoisie; nomLieu?: string; reponseA?: string };
const dossierFig = (ville: string, lieu: string) => `autour-fig/${ville}/${lieu}`;
type PoseFig = { id: string; qui: Qui; h: string };
const tetesCachees = async (supabase: Supabase, h: string | null) => (h ? new Set(((await lireJson<{ ids?: string[] }>(supabase, `${h}/autour-fig-caches.json`)).ids ?? []).map(s)) : new Set<string>());

/** Les poses en cours d'un lieu (moins de 24 h) qu'il peut voir, les plus récentes d'abord. */
async function posesFigVisibles(supabase: Supabase, ville: string, lieu: string, regard: Regard, caches: Set<string>, maintenant = Date.now()): Promise<PoseFig[]> {
  const poses = (await lister(supabase, dossierFig(ville, lieu)))
    .map((x) => lireNom(x.name))
    .filter((x): x is PoseFig => Boolean(x) && poseEnCours(x!.id, maintenant) && !caches.has(x!.id))
    .sort((a, b) => heureDePose(b.id) - heureDePose(a.id));
  const vues = await Promise.all(poses.map((p) => visible(p, regard)));
  return poses.filter((_, k) => vues[k]);
}

/**
 * 🧍 SA FIGURINE POUR UNE POSE : la tête qu'elle fait (son humeur du jour, ou une de ses expressions — prête et découpée
 * sur ses calques d'aujourd'hui ; sinon sa tête habituelle), et son corps sans sa tête pour la poser assise. Sans ses
 * calques : sa figurine d'une seule image.
 */
type Silhouette = Pick<FigurinePosee, "tete" | "corps" | "image">;
async function silhouetteDe(supabase: Supabase, h: string, tete: TeteChoisie): Promise<Silhouette> {
  // (✨ « humeur », c'est sa tête du jour : celle qu'il a choisie dans « Ma figurine », sinon celle de son humeur)
  const [calques, expr, duJour] = await Promise.all([calquesDeFigurine(supabase, h, { fabriquer: false }).catch(() => null), sesExpressions(supabase, h).catch(() => null), tete === "humeur" ? teteChoisieDuJour(supabase, h).catch(() => null) : Promise.resolve(null)]);
  const e: ExpressionFigurine | null = tete === "humeur" ? duJour : tete;
  const memeDecoupe = Boolean(calques && expr && (expr.etat.decoupe ?? 1) === (calques.decoupe ?? 1));
  const src = (e && memeDecoupe ? expr?.etat.tetes[e] : "") || calques?.tete.fichier || "";
  if (calques?.sansTete && src) return { tete: src, corps: { src: calques.sansTete.fichier, ratio: calques.ratio, boite: calques.tete.boite } };
  const image = (await figurineDeLaMaison(supabase, h).catch(() => null))?.src || (await saFigurineSignee(supabase, h).catch(() => ""));
  return { tete: image, ...(image ? { image } : {}) };
}
function silhouettes(supabase: Supabase) {
  const lus = new Map<string, Promise<Silhouette>>();
  return (h: string, tete: TeteChoisie) => {
    const k = `${h}:${tete}`;
    if (!lus.has(k)) lus.set(k, silhouetteDe(supabase, h, tete));
    return lus.get(k)!;
  };
}
async function prenomsDe(supabase: Supabase, hs: string[]): Promise<Map<string, string>> {
  const l = [...new Set(hs)];
  if (!l.length) return new Map();
  const { data } = await supabase.from("clik_ma_figurine").select("habitant_id, prenom").in("habitant_id", l);
  return new Map(((Array.isArray(data) ? data : []) as Ligne[]).map((x) => [s(x.habitant_id), s(x.prenom) || "Quelqu’un"]));
}

/** Des poses en figurines vues : le dépôt (mot, tête, réponse), son prénom, sa silhouette. */
async function enFigurines(supabase: Supabase, ville: string, lieu: string, poses: PoseFig[], moi: string | null, o: { silhouette?: ReturnType<typeof silhouettes>; prenoms?: Map<string, string> } = {}): Promise<FigurinePosee[]> {
  const sil = o.silhouette ?? silhouettes(supabase);
  const [depots, prenoms] = await Promise.all([Promise.all(poses.map((p) => lireJson<DepotFig>(supabase, `${dossierFig(ville, lieu)}/${nomFichier(p.id, p.qui, p.h)}`))), o.prenoms ?? prenomsDe(supabase, poses.map((p) => p.h))]);
  const vues = await Promise.all(
    poses.map(async (p, k): Promise<FigurinePosee | null> => {
      const d = depots[k];
      if (!s(d.mot)) return null;
      const tete: TeteChoisie = d.tete === "humeur" || expressionFigurineValide(d.tete) ? d.tete : "humeur";
      const v = await sil(p.h, tete);
      const le = heureDePose(p.id);
      return {
        id: p.id,
        lieu,
        prenom: prenoms.get(p.h) ?? "Quelqu’un",
        profil: cleProfil(p.h),
        mot: s(d.mot),
        le: new Date(le).toISOString(),
        fin: new Date(le + 24 * 3600_000).toISOString(),
        qui: p.qui,
        moi: p.h === moi,
        ...v,
        ...(s(d.reponseA) ? { reponseA: s(d.reponseA) } : {}),
        ...(s(d.nomLieu) ? { nomLieu: s(d.nomLieu) } : {}),
      };
    }),
  );
  return vues.filter((x): x is FigurinePosee => Boolean(x));
}

/**
 * 🗺️ LA CARTE DES FIGURINES D'UNE VILLE : ses lieux (les têtes des figurines posées aujourd'hui, leur nombre), les zones
 * qui en ont, et les dernières posées autour de lui. Une zone se montre à son CENTRE.
 */
export async function carteDesFigurines(supabase: Supabase, ville: string, moi: Habitant | null): Promise<{ ville: string; lieux: Lieu[]; derniers: FigurinePosee[] }> {
  if (!ville) return { ville, lieux: [], derniers: [] };
  const maintenant = Date.now();
  const [fixes, dossiers, caches] = await Promise.all([lieuxFixesDe(supabase, ville), lister(supabase, `autour-fig/${ville}`), tetesCachees(supabase, moi?.id ?? null)]);
  const ids = new Set([...fixes.map((c) => c.id), ...dossiers.map((d) => d.name).filter((n) => lieuIdValide(n))]);
  const regard = regardDe(supabase, moi?.id ?? null);
  const poses = new Map<string, PoseFig[]>();
  await Promise.all([...ids].map(async (l) => poses.set(l, await posesFigVisibles(supabase, ville, l, regard, caches, maintenant))));
  const sil = silhouettes(supabase);
  const prenoms = await prenomsDe(supabase, [...poses.values()].flat().map((p) => p.h));
  // (les plus récentes, tous lieux confondus : la feuille du bas — et les têtes des épingles)
  const recentes = [...poses.entries()].flatMap(([l, ps]) => ps.map((p) => ({ l, p }))).sort((a, b) => heureDePose(b.p.id) - heureDePose(a.p.id));
  const vues = new Map<string, FigurinePosee>();
  await Promise.all(
    recentes.slice(0, 40).map(async ({ l, p }) => {
      const [v] = await enFigurines(supabase, ville, l, [p], moi?.id ?? null, { silhouette: sil, prenoms });
      if (v) vues.set(v.id, v);
    }),
  );
  const lieux: Lieu[] = [];
  for (const id of ids) {
    const ps = (poses.get(id) ?? []).filter((p) => vues.has(p.id));
    const c = fixes.find((x) => x.id === id);
    const centre = c ? { lat: c.lat, lng: c.lng } : centreDeZone(id);
    if (!centre || (!c && !ps.length)) continue;
    const premiere = ps[ps.length - 1] ? vues.get(ps[ps.length - 1].id) : undefined;
    lieux.push({
      id,
      type: c ? (c.public ? "public" : "commerce") : "zone",
      nom: c ? c.nom : premiere?.nomLieu || "Quelque part par ici",
      emoji: c ? emojiDe(c) : "✨",
      lat: centre.lat,
      lng: centre.lng,
      n: ps.length,
      visages: ps
        .slice(0, 3)
        .map((p) => vues.get(p.id)?.tete ?? "")
        .filter(Boolean),
      ...(c?.activite ? { activite: c.activite } : {}),
    });
  }
  const derniers = recentes
    .slice(0, 8)
    .map(({ p }) => vues.get(p.id))
    .filter((x): x is FigurinePosee => Boolean(x))
    // (la feuille du bas montre des têtes : pas besoin du corps)
    .map((x) => ({ ...x, corps: undefined }));
  return { ville, lieux: lieux.sort((a, b) => b.n - a.n), derniers };
}

/** 📍 Les figurines posées dans un lieu, aujourd'hui : assises, chacune avec son mot (les réponses à côté de la leur). */
export async function figurinesDuLieu(supabase: Supabase, ville: string, lieu: string, moi: Habitant | null): Promise<{ lieu: Lieu | null; figurines: FigurinePosee[] }> {
  if (!ville || !lieuIdValide(lieu)) return { lieu: null, figurines: [] };
  const [caches, fixes] = await Promise.all([tetesCachees(supabase, moi?.id ?? null), estZone(lieu) ? Promise.resolve([] as Commerce[]) : lieuxFixesDe(supabase, ville)]);
  const poses = await posesFigVisibles(supabase, ville, lieu, regardDe(supabase, moi?.id ?? null), caches);
  const c = fixes.find((x) => x.id === lieu);
  const centre = c ? { lat: c.lat, lng: c.lng } : centreDeZone(lieu);
  if (!centre || (!c && !poses.length)) return { lieu: null, figurines: [] };
  const [vues, photo] = await Promise.all([enFigurines(supabase, ville, lieu, poses.slice(0, 24), moi?.id ?? null), c && !c.public ? photoDuCommerce(supabase, lieu.slice(2)) : Promise.resolve("")]);
  // (une réponse s'assoit juste après celle à côté de laquelle elle s'est posée)
  const dansLOrdre: FigurinePosee[] = [];
  const reponses = vues.filter((v) => v.reponseA && vues.some((o) => o.id === v.reponseA));
  for (const v of vues) {
    if (reponses.includes(v)) continue;
    dansLOrdre.push(v, ...reponses.filter((r) => r.reponseA === v.id).reverse());
  }
  return {
    lieu: {
      id: lieu,
      type: c ? (c.public ? "public" : "commerce") : "zone",
      nom: c ? c.nom : [...vues].reverse().find((v) => v.nomLieu)?.nomLieu || "Quelque part par ici",
      emoji: c ? emojiDe(c) : "✨",
      lat: centre.lat,
      lng: centre.lng,
      n: vues.length,
      visages: [],
      ...(c?.activite ? { activite: c.activite } : {}),
      ...(photo ? { photo } : {}),
    },
    figurines: dansLOrdre,
  };
}

/**
 * 😊 Ses têtes, au moment de poser : sa tête du jour (✨ celle choisie dans « Ma figurine », sinon celle de son humeur — si
 * elle est prête), puis ses expressions prêtes ; 🪧 sa pancarte, qui est son mot du jour (pour le préremplir).
 */
export async function mesTetes(supabase: Supabase, h: string): Promise<MesTetes> {
  const [calques, expr, e, pancarte] = await Promise.all([calquesDeFigurine(supabase, h, { fabriquer: false }).catch(() => null), sesExpressions(supabase, h).catch(() => null), teteChoisieDuJour(supabase, h).catch(() => null), pancarteDe(supabase, h).catch(() => "")]);
  const ok = Boolean(calques && expr && (expr.etat.decoupe ?? 1) === (calques.decoupe ?? 1));
  const tetes = ok ? EXPRESSIONS_FIGURINE.filter((x) => expr!.etat.tetes[x.cle]).map((x) => ({ cle: x.cle, src: expr!.etat.tetes[x.cle]!, nom: x.nom })) : [];
  const t = e ? tetes.find((x) => x.cle === e) : undefined;
  return { humeur: t ? { e: t.cle, src: t.src, nom: t.nom } : null, tetes, habituelle: calques?.tete.fichier || (await figurineDeLaMaison(supabase, h).catch(() => null))?.src || (await saFigurineSignee(supabase, h).catch(() => "")), ...(pancarte ? { pancarte } : {}) };
}

export type DemandePose = { lieu?: unknown; ici?: unknown; qui?: unknown; mot?: unknown; tete?: unknown; nomLieu?: unknown; reponseA?: unknown };
/**
 * 🧍 POSER SA FIGURINE : dans un lieu de sa ville (`lieu` : un commerce, un lieu public, une zone qui a déjà des
 * figurines — pour y répondre), ou « Ailleurs » (`ici` : sa position, ARRONDIE en une zone d'environ 500 m ; elle n'est
 * gardée nulle part telle quelle). Son mot du jour, la tête qu'elle fait, qui la voit ; `reponseA` : la figurine du même
 * lieu à côté de laquelle elle s'assoit. Trois par jour ; une seule par lieu (la reposer au même endroit la remplace).
 */
export async function poserSaFigurine(supabase: Supabase, habitant: Habitant, d: DemandePose): Promise<{ ok?: true; lieu?: string; id?: string; error?: string; statut?: number; age?: true; aPrevenir?: APrevenir }> {
  if (!(await aConfirmeSonAge(supabase, habitant.id))) return SANS_AGE;
  const ville = habitant.villeSlug;
  if (!ville) return { error: "Il faut d’abord ta ville.", statut: 400 };
  const qui = quiValide(d.qui ?? "tous");
  if (!qui) return { error: "Qui la voit ? Tout le monde, tes proches, ou toi seul.", statut: 400 };
  const mot = s(d.mot).replace(/\s+/g, " ").trim().slice(0, MOT_DU_JOUR_MAX);
  if (!mot) return { error: "Écris ton mot du jour : c’est lui qu’on lit en premier.", statut: 400 };
  if (motInterdit(mot) || parleDAlcool(mot)) return { error: "Ça, ta figurine ne le dit pas. Écris autre chose 🙂", statut: 400 };
  const tete: TeteChoisie = d.tete === "humeur" || expressionFigurineValide(d.tete) ? (d.tete as TeteChoisie) : "humeur";
  const [calques, figurine] = await Promise.all([calquesDeFigurine(supabase, habitant.id, { fabriquer: false }).catch(() => null), figurineDeLaMaison(supabase, habitant.id).catch(() => null)]);
  // (une figurine de l'ancien style, d'une seule image, se pose aussi : on la montre entière)
  if (!calques && !figurine && !(await saFigurineSignee(supabase, habitant.id).catch(() => ""))) return { error: "Crée d’abord ta figurine.", statut: 409 };
  const maintenant = Date.now();
  // LE LIEU
  let lieu = "";
  let zoneExistante = false;
  if (d.lieu) {
    const l = s(d.lieu);
    const existe = !lieuIdValide(l) ? false : estZone(l) ? (await lister(supabase, dossierFig(ville, l))).some((x) => lireNom(x.name) && poseEnCours(lireNom(x.name)!.id, maintenant)) : (await lieuxFixesDe(supabase, ville)).some((c) => c.id === l);
    if (!existe) return { error: "Ce lieu n’est pas à " + ville + ".", statut: 400 };
    lieu = l;
    zoneExistante = estZone(l);
  } else {
    const p = (d.ici && typeof d.ici === "object" ? d.ici : {}) as { lat?: unknown; lng?: unknown };
    const z = zoneDe(Number(p.lat), Number(p.lng));
    if (!z) return { error: "Choisis un lieu, ou laisse ton téléphone dire où tu es.", statut: 400 };
    lieu = z.id;
  }
  const nl = estZone(lieu) && !zoneExistante ? nomLieuPropre(d.nomLieu) : {};
  if (nl.refus) return { error: nl.refus, statut: 400 };
  if (nl.nom && (motInterdit(nl.nom) || parleDAlcool(nl.nom))) return { error: "Ce petit nom ne passe pas. Écris autre chose 🙂", statut: 400 };
  const dansLeLieu = (await lister(supabase, dossierFig(ville, lieu))).map((x) => lireNom(x.name)).filter((x): x is PoseFig => Boolean(x) && poseEnCours(x!.id, maintenant));
  // À CÔTÉ DE QUELQU'UN : une figurine du même lieu, en cours, qu'il peut voir (pas la sienne)
  const reponseA = s(d.reponseA);
  let origine: PoseFig | null = null;
  if (reponseA) {
    const la = dansLeLieu.find((x) => x.id === reponseA);
    if (!la || la.h === habitant.id || !(await visible(la, regardDe(supabase, habitant.id)))) return { error: "Cette figurine n’est plus là.", statut: 400 };
    origine = la;
  }
  // UNE SEULE PAR LIEU (la sienne d'avant s'en va) ; TROIS PAR JOUR
  const avant = dansLeLieu.filter((x) => x.h === habitant.id);
  const jour = jourParis();
  const cheminJour = `${habitant.id}/autour-fig-jour/${jour}.json`;
  const n = Number((await lireJson<{ n?: number }>(supabase, cheminJour)).n) || 0;
  if (!avant.length && n >= POSES_PAR_JOUR) return { error: "Trois figurines posées aujourd’hui, c’est le maximum. Reviens demain !", statut: 429 };
  if (avant.length) await supabase.storage.from(SEAU_FIGURINES).remove(avant.flatMap((x) => [`${dossierFig(ville, lieu)}/${nomFichier(x.id, x.qui, x.h)}`, `${habitant.id}/autour-fig/${x.id}.json`]));
  const id = idDePose(maintenant, randomBytes(4).toString("hex"));
  const depot: DepotFig = { id, h: habitant.id, le: new Date(maintenant).toISOString(), qui, mot, tete, ...(nl.nom ? { nomLieu: nl.nom } : {}), ...(origine ? { reponseA } : {}) };
  const ok =
    (await ecrireJson(supabase, `${dossierFig(ville, lieu)}/${nomFichier(id, qui, habitant.id)}`, depot)) &&
    (await ecrireJson(supabase, `${habitant.id}/autour-fig/${id}.json`, { ville, lieu, qui })) &&
    (await ecrireJson(supabase, `profils/${cleProfil(habitant.id)}.json`, { h: habitant.id })) &&
    (avant.length > 0 || (await ecrireJson(supabase, cheminJour, { n: n + 1 })));
  if (!ok) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  // (🪧 « Ma figurine » : son mot du jour est aussi la pancarte de sa figurine, partout, jusqu'à ce qu'il la change —
  // sans la compter comme son double préparé : seul « Ma figurine » enlève la pastille)
  await ecrireSaPancarte(supabase, habitant.id, mot, { preparer: false }).catch(() => undefined);
  // (↩️ celui à côté de qui il s'assoit est prévenu, s'il peut voir la sienne)
  if (origine && (await visible({ qui, h: habitant.id }, regardDe(supabase, origine.h)))) {
    const c = estZone(lieu) ? null : (await lieuxFixesDe(supabase, ville)).find((x) => x.id === lieu);
    const ou = c ? `${emojiDe(c)} ${c.nom}` : `✨ ${nl.nom || "Quelque part par ici"}`;
    return { ok: true, lieu, id, aPrevenir: { auteur: origine.h, meme: id, ou, url: `/collection?autour=${encodeURIComponent(lieu)}&pose=${id}#autour` } };
  }
  return { ok: true, lieu, id };
}

/** ↩️ Il retire sa figurine (à tout moment). */
export async function retirerSaFigurine(supabase: Supabase, habitant: Habitant, id: unknown): Promise<{ ok: true }> {
  const i = s(id);
  if (!/^[a-z0-9]{12}$/.test(i)) return { ok: true };
  const f = await lireJson<{ ville?: string; lieu?: string; qui?: Qui }>(supabase, `${habitant.id}/autour-fig/${i}.json`);
  if (f.ville && f.lieu) await supabase.storage.from(SEAU_FIGURINES).remove([`${dossierFig(s(f.ville), s(f.lieu))}/${nomFichier(i, quiValide(f.qui) ?? "tous", habitant.id)}`, `${habitant.id}/autour-fig/${i}.json`]);
  return { ok: true };
}

/** 🚩 Signaler une figurine posée : il ne la voit plus ; trois signalements de trois personnes, elle s'en va. */
export async function signalerUneFigurine(supabase: Supabase, habitant: Habitant, lieu: unknown, id: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const ville = habitant.villeSlug;
  const l = s(lieu);
  const i = s(id);
  if (!ville || !lieuIdValide(l) || !/^[a-z0-9]{12}$/.test(i)) return { error: "Cette figurine n’est plus là.", statut: 404 };
  const la = (await lister(supabase, dossierFig(ville, l))).map((x) => lireNom(x.name)).find((x) => x?.id === i);
  if (!la) return { error: "Cette figurine n’est plus là.", statut: 404 };
  if (la.h === habitant.id) return { error: "C’est la tienne : retire-la plutôt.", statut: 400 };
  const caches = await lireJson<{ ids?: string[] }>(supabase, `${habitant.id}/autour-fig-caches.json`);
  await ecrireJson(supabase, `${habitant.id}/autour-fig-caches.json`, { ids: [...new Set([...(caches.ids ?? []).map(s), i])].slice(-200) });
  const sig = await lireJson<{ par?: string[] }>(supabase, `autour-fig-signal/${i}.json`);
  const par = [...new Set([...(sig.par ?? []).map(s), habitant.id])];
  await ecrireJson(supabase, `autour-fig-signal/${i}.json`, { par, lieu: l, ville, h: la.h });
  if (par.length >= 3) await supabase.storage.from(SEAU_FIGURINES).remove([`${dossierFig(ville, l)}/${nomFichier(la.id, la.qui, la.h)}`, `${la.h}/autour-fig/${la.id}.json`]);
  return { ok: true };
}

