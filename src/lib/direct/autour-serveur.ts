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
import { createHash } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { motInterdit } from "@/lib/direct/mots-interdits";
import { lirePhotosDuLieu } from "@/lib/site-internet/photos-du-lieu";
import { parleDAlcool } from "@/lib/direct/meme-surprise";
import { SANS_AGE, SEAU_FIGURINES, aConfirmeSonAge, ajouterProche, cartesDeMemes, ecrireJson, lireJson, memeDeposable, prochesDe, retirerProche, saFigurineSignee } from "@/lib/direct/ma-figurine-serveur";
import {
  MOT_MAX,
  PAR_LIEU_PAR_JOUR,
  centreDeZone,
  emojiDuCommerce,
  estZone,
  lieuIdValide,
  nomLieuPropre,
  quiValide,
  zoneDe,
  type Lieu,
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
type Regard = { moi: Habitant | null; prochesDe: (h: string) => Promise<Set<string>> };
function regardDe(supabase: Supabase, moi: Habitant | null): Regard {
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
  if (d.h === r.moi.id) return true;
  return d.qui === "proches" && (await r.prochesDe(d.h)).has(r.moi.id);
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

// ─── les commerces de la ville, avec leurs coordonnées ────────────────────────────────────────────────────────────
type Commerce = { id: string; nom: string; activite: string; lat: number; lng: number };
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

// ─── déposer, retirer ──────────────────────────────────────────────────────────────────────────────────────────────
export type Demande = { meme: unknown; lieu?: unknown; ici?: unknown; qui?: unknown; mot?: unknown; nomLieu?: unknown; reponseA?: unknown };

/**
 * 📍 DÉPOSER SON MÈME : dans un commerce de sa ville (`lieu`), ou « Ailleurs » (`ici` : sa position, ARRONDIE ici en une
 * zone d'environ 500 m — elle n'est gardée nulle part telle quelle). `reponseA` : le mème du même lieu auquel il répond.
 */
export async function deposer(supabase: Supabase, habitant: Habitant, d: Demande): Promise<{ ok?: true; lieu?: string; error?: string; statut?: number; age?: true }> {
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
        : (await commercesDe(supabase, ville)).some((c) => c.id === l);
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
  if (reponseA) {
    if (!/^[a-z0-9]{12}$/.test(reponseA) || reponseA === id) return { error: "Ce mème n’existe plus.", statut: 400 };
    const la = (await lister(supabase, `autour/${ville}/${lieu}`)).map((x) => lireNom(x.name)).find((x) => x?.id === reponseA);
    if (!la || !(await visible(la, regardDe(supabase, habitant)))) return { error: "Ce mème n’est plus à cet endroit.", statut: 400 };
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
  return ok ? { ok: true, lieu } : { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
}

/** Il retire son mème de l'endroit où il l'avait posé. */
export async function retirer(supabase: Supabase, habitant: Habitant, meme: unknown): Promise<{ ok: true }> {
  const id = s(meme);
  if (!/^[a-z0-9]{12}$/.test(id)) return { ok: true };
  const avant = await lireJson<{ ville: string; lieu: string; qui: Qui }>(supabase, `${habitant.id}/autour/${id}.json`);
  if (avant.ville && avant.lieu) {
    await supabase.storage.from(SEAU_FIGURINES).remove([`autour/${avant.ville}/${avant.lieu}/${nomFichier(id, quiValide(avant.qui) ?? "tous", habitant.id)}`, `${habitant.id}/autour/${id}.json`]);
  }
  return { ok: true };
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
  const [commerces, dossiers] = await Promise.all([commercesDe(supabase, ville), lister(supabase, `autour/${ville}`)]);
  const ids = new Set([...commerces.map((c) => c.id), ...dossiers.map((d) => d.name).filter((n) => lieuIdValide(n))]);
  const poses = new Map<string, Pose[]>();
  const regard = regardDe(supabase, moi);
  await Promise.all([...ids].map(async (l) => poses.set(l, await posesVisibles(supabase, ville, l, regard))));
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
      type: c ? "commerce" : "zone",
      nom: c ? c.nom : nomZone || "Quelque part par ici",
      emoji: c ? emojiDuCommerce(c.activite) : "✨",
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
  const [poses, commerces] = await Promise.all([posesVisibles(supabase, ville, lieu, regardDe(supabase, moi)), estZone(lieu) ? Promise.resolve([]) : commercesDe(supabase, ville)]);
  const c = commerces.find((x) => x.id === lieu);
  const centre = c ? { lat: c.lat, lng: c.lng } : centreDeZone(lieu);
  if (!centre || (!c && !poses.length)) return { lieu: null, memes: [] };
  const [memes, photo] = await Promise.all([enCartes(supabase, ville, lieu, poses, moi), c ? photoDuCommerce(supabase, lieu.slice(2)) : Promise.resolve("")]);
  return {
    lieu: {
      id: lieu,
      type: c ? "commerce" : "zone",
      nom: c ? c.nom : [...memes].reverse().find((m) => m.nomLieu)?.nomLieu || "Quelque part par ici",
      emoji: c ? emojiDuCommerce(c.activite) : "✨",
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
  for (const v of [...new Set(publics.map((x) => x.ville))]) for (const c of await commercesDe(supabase, v)) commerces.set(c.id, c.nom);
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
