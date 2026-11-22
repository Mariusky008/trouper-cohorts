/**
 * 🎵 LA PLATINE DU SALON MUSIQUE, LE SERVEUR (`platine.ts` ; `docs/univers/decouvrir.md`, section 36 ; le lot M1).
 *
 * Écrite sur le salon : `decouvrir/salons/<maison>/<salon>/platine.json` — le morceau qui passe (son départ, à l'heure du
 * serveur), la file, le dernier fini. Tenue à l'heure par qui la lit (le pouls, l'entrée, une proposition) : un morceau
 * fini laisse la place au suivant, écrit une fois pour tous (`platineALHeure` est la même pour tout le monde).
 *
 * Ce qui est vérifié avant (que la personne est dans ce salon, que c'est le salon de la musique) l'est par
 * `salons-ouverts-serveur.ts` ; ici, la platine seulement.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { details } from "./selection-serveur";
import { videoYouTube } from "./tele";
import { PHRASES_PLATINE as P, PLATINE, platineALHeure, type PlatineSalon, type PropositionMorceau } from "./platine";
import type { MaisonSalons, VideoSalon } from "./salons-ouverts";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
export const cheminPlatine = (m: MaisonSalons, salon: string) => `decouvrir/salons/${m}/${salon}/platine.json`;
const TITRE_PAR_DEFAUT = "Un morceau YouTube";

const videoValide = (v: unknown): VideoSalon | null => {
  const x = (v ?? {}) as Partial<VideoSalon>;
  return /^[A-Za-z0-9_-]{11}$/.test(s(x.id)) ? { id: s(x.id), titre: s(x.titre).slice(0, 140) || TITRE_PAR_DEFAUT, chaine: s(x.chaine).slice(0, 80), duree: Math.max(0, Number(x.duree) || 0) } : null;
};
const propositionValide = (x: unknown): PropositionMorceau | null => {
  const o = (x ?? {}) as Partial<PropositionMorceau>;
  const video = videoValide(o.video);
  if (!video || !/^[0-9a-f]{8}$/.test(s(o.q))) return null;
  return { video, q: s(o.q), prenom: s(o.prenom) || "Quelqu’un", le: Number(o.le) || 0, coeurs: (Array.isArray(o.coeurs) ? o.coeurs : []).map(s).filter((c) => /^[0-9a-f]{8}$/.test(c)) };
};

/** La platine telle qu'elle est écrite (vide : rien ne passe, la file vide). */
export async function lirePlatine(supabase: Supabase, m: MaisonSalons, salon: string): Promise<PlatineSalon> {
  const o = await lireJson<PlatineSalon>(supabase, cheminPlatine(m, salon)).catch(() => ({}) as Partial<PlatineSalon>);
  const enCours = o.enCours ? propositionValide(o.enCours) : null;
  const file = (Array.isArray(o.file) ? o.file : []).map(propositionValide).filter((x): x is PropositionMorceau => Boolean(x)).slice(0, PLATINE.fileMax);
  const d = o.dernier;
  return {
    ...(enCours && Number(o.enCours?.depart) > 0 ? { enCours: { ...enCours, depart: Number(o.enCours?.depart) } } : {}),
    file,
    n: Number(o.n) || 0,
    ...(d && s(d.prenom) && s(d.titre) ? { dernier: { q: s(d.q), prenom: s(d.prenom), titre: s(d.titre), fin: Number(d.fin) || 0 } } : {}),
  };
}
async function ecrire(supabase: Supabase, m: MaisonSalons, salon: string, p: PlatineSalon): Promise<boolean> {
  return ecrireJson(supabase, cheminPlatine(m, salon), p);
}

/** ⏭️ La platine à l'heure : un morceau fini laisse la place au suivant (écrit une fois pour tous). */
export async function platineAJour(supabase: Supabase, m: MaisonSalons, salon: string, maintenant = Date.now()): Promise<PlatineSalon> {
  const avant = await lirePlatine(supabase, m, salon);
  const apres = platineALHeure(avant, maintenant);
  if (apres !== avant) await ecrire(supabase, m, salon, apres);
  return apres;
}

/**
 * 🔎 Le morceau d'une proposition : un clip de la radio du jour (`id`), ou un lien YouTube — sa fiche (titre, chaîne,
 * durée) ; ce qui ne se regarde pas ici (réservé aux adultes, en direct, pas lisible ailleurs, des mots d'alcool) ou n'a
 * pas la bonne durée est refusé. YouTube muet : il passe quand même, sous le nom « Un morceau YouTube ».
 */
export async function morceauPropose(p: { id?: unknown; lien?: unknown }, radio: readonly VideoSalon[]): Promise<{ video?: VideoSalon; error?: string }> {
  const id = s(p.id);
  if (id) {
    const v = radio.find((x) => x.id === id);
    return v ? { video: v } : { error: P.pasIci };
  }
  const y = videoYouTube(s(p.lien).slice(0, PLATINE.lienMax));
  if (!y) return { error: P.pasYouTube };
  const fiche = await details([y.id], { min: 1, max: 6 * 3600 }).then(
    (l) => l[0] ?? null,
    () => undefined,
  );
  if (fiche === null) return { error: P.pasIci };
  if (fiche && (fiche.duree < PLATINE.dureeMin || fiche.duree > PLATINE.dureeMax)) return { error: P.tropLong };
  return { video: fiche ? { id: fiche.id, titre: fiche.titre, chaine: fiche.chaine, duree: fiche.duree } : { id: y.id, titre: TITRE_PAR_DEFAUT, chaine: "", duree: 0 } };
}

/** 🎵 Proposer : un seul morceau par personne dans la file, dix au plus ; rien ne passe : il part tout de suite. */
export async function proposer(supabase: Supabase, x: { m: MaisonSalons; salon: string; q: string; prenom: string; video: VideoSalon }, maintenant = Date.now()): Promise<{ platine?: PlatineSalon; part?: boolean; error?: string; statut?: number }> {
  const p = platineALHeure(await lirePlatine(supabase, x.m, x.salon), maintenant);
  if (p.file.some((m) => m.q === x.q)) return { error: P.dejaUn, statut: 409 };
  if (p.file.length >= PLATINE.fileMax) return { error: P.filePleine, statut: 409 };
  const neuve = platineALHeure({ ...p, file: [...p.file, { video: x.video, q: x.q, prenom: x.prenom, le: maintenant, coeurs: [] }] }, maintenant);
  if (!(await ecrire(supabase, x.m, x.salon, neuve))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { platine: neuve, part: neuve.enCours?.q === x.q && neuve.enCours.le === maintenant };
}

/** ❤️ Un cœur (ou le retirer) sur le morceau de quelqu'un d'autre, dans la file. */
export async function aimer(supabase: Supabase, x: { m: MaisonSalons; salon: string; q: string; de: string }, maintenant = Date.now()): Promise<{ platine?: PlatineSalon; error?: string; statut?: number }> {
  const p = platineALHeure(await lirePlatine(supabase, x.m, x.salon), maintenant);
  const k = p.file.findIndex((m) => m.q === x.de);
  if (k < 0) return { error: "Ce morceau n’est plus dans la file.", statut: 404 };
  if (x.de === x.q) return { error: "C’est ton morceau 🙂", statut: 400 };
  const m = p.file[k];
  const coeurs = m.coeurs.includes(x.q) ? m.coeurs.filter((c) => c !== x.q) : [...m.coeurs, x.q];
  const neuve: PlatineSalon = { ...p, file: p.file.map((y, i) => (i === k ? { ...y, coeurs } : y)) };
  if (!(await ecrire(supabase, x.m, x.salon, neuve))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { platine: neuve };
}

/** ↩️ Retirer son morceau de la file (celui qui passe va jusqu'au bout). */
export async function retirer(supabase: Supabase, x: { m: MaisonSalons; salon: string; q: string }, maintenant = Date.now()): Promise<{ platine?: PlatineSalon; error?: string; statut?: number }> {
  const p = platineALHeure(await lirePlatine(supabase, x.m, x.salon), maintenant);
  if (!p.file.some((m) => m.q === x.q)) return { platine: p };
  const neuve: PlatineSalon = { ...p, file: p.file.filter((m) => m.q !== x.q) };
  if (!(await ecrire(supabase, x.m, x.salon, neuve))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { platine: neuve };
}
