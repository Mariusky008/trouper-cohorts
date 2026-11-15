/**
 * 🧩 L'EFFET « COLLAGE » — LE PREMIER ESSAI DE LA MAQUETTE DE LA PIÈCE DU DUO (`docs/univers/piece-du-duo.md`, section 5 ;
 * `pieces-duo.ts`). La session de l'univers l'a relevé : des figurines détourées posées sur une pièce dessinée à part
 * peuvent faire autocollant (une autre lumière, pas d'ombre, une échelle approximative, pas de contact avec le siège).
 * Avant tout le reste, le propriétaire regarde DEUX VRAIES FIGURINES DANS UNE VRAIE PIÈCE, de deux façons :
 *
 * 1. POSÉES : chaque figurine, assise SANS son fauteuil (une image faite une fois par figurine, détourée au plus près),
 *    posée par l'écran sur l'image de la pièce, à sa place relevée, avec une ombre et la lumière de la pièce ;
 * 2. GÉNÉRÉE : une image du duo dans la pièce (faite une fois par duo et par pièce), d'après la pièce et les deux poses.
 *
 * Les figurines : celle de ce téléphone (sa figurine assise, si elle est du nouveau style) et celles des essais du lot 0
 * (des volontaires d'accord : détourées, ou leur constance assise ; pas celles qu'il a refusées). Rangé à part :
 * `pieces-duo/collage/` — `choix.json` (la pièce, les deux figurines, son avis), `poses/<empreinte>.png` (l'empreinte
 * de l'image d'origine : une nouvelle figurine, une nouvelle pose), `duos/<pièce>-<a>-<b>.png`. Un passage fait une
 * image : la pose de la première, celle de la seconde, puis le duo.
 *
 * Réservé à l'administrateur (la page d'essais).
 *
 * FICHIER SERVEUR.
 */
import { createHash } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { lireFichePerso } from "./fiches-serveur";
import { SEAU_FIGURINES, depotDans, lireJson, signer, telecharger } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { PLACES_PAR_DEFAUT, avisCollageValide, pieceDuoValide, type ChoixCollage, type EtatCollage, type FigurineDuo, type PieceDuo, type PlaceDuo } from "./pieces-duo";
import { etatPiecesDuo, prendre, rendre } from "./pieces-duo-serveur";
import { estDetouree, type ResultatEssai } from "./univers-essais";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const DOSSIER = "pieces-duo/collage";
const LOT0 = "essais-univers";
const empreinte = (chemin: string) => createHash("sha1").update(chemin).digest("hex").slice(0, 12);
const MAX_FIGURINES = 24;

/** Une figurine qu'on peut poser : son repère, son nom à l'écran, son image d'origine (dans le seau). */
type Source = { id: string; nom: string; chemin: string };

/** La pose sans fauteuil, d'après la figurine assise dans le sien. */
export function consignePoseSansFauteuil(): string {
  return [
    "IMAGE 1 is a collectible figurine (big head, small body) seated in its own armchair.",
    "Show EXACTLY the same figurine — same face, same hair, same clothes, same colors, same materials, same style, same proportions — in the same seated pose, but WITHOUT the armchair: it sits on an invisible seat, thighs horizontal, knees bent, lower legs hanging down naturally, hands resting on its knees or its lap, facing the viewer, turned slightly three-quarters.",
    "Nothing else: no chair, no furniture, no base, no floor, no shadow, no text. Transparent background. The whole figurine visible, from the top of the head to the feet.",
  ].join("\n");
}

/** Le duo dans la pièce : la pièce telle quelle, les deux figurines assises à leurs places. */
export function consigneDuoDansLaPiece(places: PlaceDuo[]): string {
  const ou = (p: PlaceDuo) => `about ${Math.round(p.x * 100)}% from the left and ${Math.round(p.y * 100)}% from the top`;
  return [
    "IMAGE 1 is a room. IMAGE 2 and IMAGE 3 are two collectible figurines (big heads, small bodies), each seated on nothing.",
    `Seat the figurine of IMAGE 2 on the left empty seat of the room (${ou(places[0])}) and the figurine of IMAGE 3 on the right empty seat (${ou(places[1])}), turned slightly toward each other, relaxed, like two close friends chatting.`,
    "Keep each figurine EXACTLY as it is: same face, same hair, same clothes, same colors, same style.",
    "Keep the room EXACTLY as it is: same framing, same objects in the same places (the TV, the record player, the frames, the shelf, the window, the cat cushion), same light.",
    "The figurines truly belong to the scene: the same warm light from the left falls on them, soft contact shadows where they touch the seats, the right size for the seats (each one fills its seat like a small person would).",
    "Add nothing else: no text, no other character, no animal.",
  ].join("\n");
}

/** Les figurines qu'on peut poser : celle de ce téléphone, puis celles des essais (les aimées d'abord). */
async function sources(supabase: Supabase, moi: string | null): Promise<Source[]> {
  const l: Source[] = [];
  if (moi) {
    const perso = await lireFichePerso(supabase, moi).catch(() => ({ fiche: null }));
    const assise = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
    if (assise) l.push({ id: "moi", nom: "Ta figurine (ce téléphone)", chemin: assise });
  }
  const noms = await depotDans(supabase, `${LOT0}/resultats`)
    .lister()
    .catch(() => [] as string[]);
  const fiches = await Promise.all(noms.filter((n) => /^[a-z0-9]{12}\.json$/.test(n)).map((n) => lireJson<ResultatEssai>(supabase, `${LOT0}/resultats/${n}`)));
  const bonnes = fiches
    .filter((r) => r.id && r.etat === "fait" && r.avis !== "non" && ((r.type === "figurine" && estDetouree(s(r.variante))) || (r.type === "constance" && r.variante !== "debout")))
    .sort((a, b) => Number(b.avis === "oui") - Number(a.avis === "oui") || s(b.le).localeCompare(s(a.le)))
    .slice(0, MAX_FIGURINES);
  const personnes = new Map<string, string>();
  for (const p of new Set(bonnes.map((r) => s(r.personne)).filter(Boolean)))
    personnes.set(p, s((await lireJson<{ nom: string }>(supabase, `${LOT0}/personnes/${p}.json`)).nom) || "Volontaire");
  for (const r of bonnes) l.push({ id: s(r.id), nom: `${personnes.get(s(r.personne)) ?? "Volontaire"}${r.avis === "oui" ? " 👍" : ""}`, chemin: `${LOT0}/resultats/${r.id}.png` });
  return l;
}

const cheminPose = (src: Source) => `${DOSSIER}/poses/${empreinte(src.chemin)}.png`;
const nomDuo = (piece: PieceDuo, a: Source, b: Source) => `${piece}-${empreinte(a.chemin)}-${empreinte(b.chemin)}.png`;

async function lireChoix(supabase: Supabase): Promise<ChoixCollage | null> {
  const c = await lireJson<ChoixCollage>(supabase, `${DOSSIER}/choix.json`);
  return pieceDuoValide(c.piece) && s(c.a) && s(c.b) ? { piece: c.piece, a: s(c.a), b: s(c.b), ...(avisCollageValide(c.avis) ? { avis: c.avis } : {}), ...(s(c.note) ? { note: s(c.note) } : {}) } : null;
}
const ecrireChoix = (supabase: Supabase, c: ChoixCollage) => depotDans(supabase, DOSSIER).ecrire("choix.json", Buffer.from(JSON.stringify(c)), "application/json");

/** Les deux places de la pièce, de gauche à droite (celles par défaut si elle n'a pas été relevée). */
async function placesDe(supabase: Supabase, piece: PieceDuo): Promise<{ decor?: string; places: PlaceDuo[] }> {
  const v = (await etatPiecesDuo(supabase)).pieces.find((p) => p.cle === piece);
  const places = v?.emplacements?.places.length === 2 ? [...v.emplacements.places].sort((a, b) => a.x - b.x) : PLACES_PAR_DEFAUT;
  return { ...(v?.decor ? { decor: v.decor } : {}), places };
}

/** 🧩 Ce que la page montre : les figurines, le choix, la pièce et ses places, les poses et le duo faits. */
export async function etatCollage(supabase: Supabase, moi: string | null): Promise<EtatCollage> {
  const [srcs, choix] = await Promise.all([sources(supabase, moi), lireChoix(supabase)]);
  const figurines: FigurineDuo[] = await Promise.all(srcs.map(async (x) => ({ id: x.id, nom: x.nom, image: await signer(supabase, x.chemin) })));
  const etat: EtatCollage = { figurines, choix, places: PLACES_PAR_DEFAUT, poses: {}, moteur: Boolean(cle()) };
  const a = srcs.find((x) => x.id === choix?.a);
  const b = srcs.find((x) => x.id === choix?.b);
  if (!choix || !a || !b) return { ...etat, choix: null };
  const [{ decor, places }, poses, duos] = await Promise.all([
    placesDe(supabase, choix.piece),
    depotDans(supabase, `${DOSSIER}/poses`)
      .lister()
      .catch(() => [] as string[]),
    depotDans(supabase, `${DOSSIER}/duos`)
      .lister()
      .catch(() => [] as string[]),
  ]);
  const signee = async (src: Source) => (poses.includes(`${empreinte(src.chemin)}.png`) ? await signer(supabase, cheminPose(src)) : "");
  const [pa, pb] = await Promise.all([signee(a), signee(b)]);
  const duo = nomDuo(choix.piece, a, b);
  return {
    ...etat,
    ...(decor ? { decor } : {}),
    places,
    poses: { ...(pa ? { a: pa } : {}), ...(pb ? { b: pb } : {}) },
    ...(duos.includes(duo) ? { generee: await signer(supabase, `${DOSSIER}/duos/${duo}`) } : {}),
  };
}

/** Choisir la pièce et les deux figurines (l'avis précédent s'efface). */
export async function choisirCollage(supabase: Supabase, moi: string | null, piece: unknown, a: unknown, b: unknown): Promise<{ erreur?: string }> {
  if (!pieceDuoValide(piece)) return { erreur: "Quelle pièce ?" };
  if (!(await placesDe(supabase, piece)).decor) return { erreur: "Cette pièce n’est pas encore faite." };
  const srcs = await sources(supabase, moi);
  if (!srcs.some((x) => x.id === a) || !srcs.some((x) => x.id === b) || a === b) return { erreur: "Choisis deux figurines différentes." };
  await ecrireChoix(supabase, { piece, a: String(a), b: String(b) });
  return {};
}

/** 🛠️ Un passage : la pose de la première figurine, celle de la seconde, puis le duo dans la pièce. */
export async function fabriquerCollage(supabase: Supabase, moi: string | null, avant: number): Promise<{ fait?: "pose-a" | "pose-b" | "duo"; erreur?: string }> {
  const choix = await lireChoix(supabase);
  const srcs = await sources(supabase, moi);
  const a = srcs.find((x) => x.id === choix?.a);
  const b = srcs.find((x) => x.id === choix?.b);
  if (!choix || !a || !b) return { erreur: "Choisis d’abord une pièce et deux figurines." };
  if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
  const d = depotDans(supabase, DOSSIER);
  const qui = await prendre(d);
  if (!qui) return { erreur: "Un passage est déjà en train : patiente une minute." };
  try {
    const poses = await depotDans(supabase, `${DOSSIER}/poses`)
      .lister()
      .catch(() => [] as string[]);
    for (const [k, src] of [
      ["a", a],
      ["b", b],
    ] as const) {
      if (poses.includes(`${empreinte(src.chemin)}.png`)) continue;
      const figurine = await telecharger(supabase, src.chemin);
      if (!figurine) return { erreur: `La figurine « ${src.nom} » est introuvable.` };
      const r = await demanderUneImage({ images: [figurine], consigne: consignePoseSansFauteuil(), transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
      if ("erreur" in r) return { erreur: r.erreur };
      // (détourée au plus près : le point qui touche le siège se place alors d'après sa hauteur, `ANCRE_ASSISE`)
      const png = await sharp(r.png)
        .trim()
        .png()
        .toBuffer()
        .catch(() => sharp(r.png).png().toBuffer());
      await depotDans(supabase, `${DOSSIER}/poses`).ecrire(`${empreinte(src.chemin)}.png`, png, "image/png");
      return { fait: k === "a" ? "pose-a" : "pose-b" };
    }
    const duo = nomDuo(choix.piece, a, b);
    if (
      (
        await depotDans(supabase, `${DOSSIER}/duos`)
          .lister()
          .catch(() => [] as string[])
      ).includes(duo)
    )
      return {};
    const piece = await telecharger(supabase, `pieces-duo/${choix.piece}/decor.png`);
    const [pa, pb] = await Promise.all([telecharger(supabase, cheminPose(a)), telecharger(supabase, cheminPose(b))]);
    if (!piece || !pa || !pb) return { erreur: "La pièce ou une pose est introuvable." };
    const { places } = await placesDe(supabase, choix.piece);
    const r = await demanderUneImage({ images: [piece, pa, pb], consigne: consigneDuoDansLaPiece(places), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
    if ("erreur" in r) return { erreur: r.erreur };
    await depotDans(supabase, `${DOSSIER}/duos`).ecrire(duo, await sharp(r.png).png().toBuffer(), "image/png");
    return { fait: "duo" };
  } finally {
    await rendre(d, qui);
  }
}

/** Refaire les deux poses (et donc le duo), ou le duo seul. */
export async function refaireCollage(supabase: Supabase, moi: string | null, quoi: "poses" | "duo"): Promise<void> {
  const choix = await lireChoix(supabase);
  const srcs = await sources(supabase, moi);
  const a = srcs.find((x) => x.id === choix?.a);
  const b = srcs.find((x) => x.id === choix?.b);
  if (!choix || !a || !b) return;
  const chemins = [`${DOSSIER}/duos/${nomDuo(choix.piece, a, b)}`, ...(quoi === "poses" ? [cheminPose(a), cheminPose(b)] : [])];
  await supabase.storage
    .from(SEAU_FIGURINES)
    .remove(chemins)
    .catch(() => undefined);
}

/** 👍 / 👎 : laquelle des deux tient (et un mot). */
export async function avisSurCollage(supabase: Supabase, avis: unknown, note: unknown): Promise<{ erreur?: string }> {
  const choix = await lireChoix(supabase);
  if (!choix) return { erreur: "Choisis d’abord une pièce et deux figurines." };
  if (!avisCollageValide(avis)) return { erreur: "Quel avis ?" };
  await ecrireChoix(supabase, { ...choix, avis, ...(s(note) ? { note: s(note).slice(0, 500) } : {}) });
  return {};
}
