/**
 * 🧩 L'EFFET « COLLAGE » — LE PREMIER ESSAI DE LA MAQUETTE DE LA PIÈCE DU DUO (`docs/univers/piece-du-duo.md`, section 5 ;
 * `pieces-duo.ts`). La session de l'univers l'a relevé : des figurines détourées posées sur une pièce dessinée à part
 * peuvent faire autocollant (une autre lumière, pas d'ombre, une échelle approximative, pas de contact avec le siège).
 * Avant tout le reste, le propriétaire regarde DEUX VRAIES FIGURINES DANS UNE VRAIE PIÈCE, de deux façons :
 *
 * 1. POSÉES : chaque figurine, assise SANS son fauteuil (une image faite une fois par figurine, détourée au plus près),
 *    posée par l'écran sur l'image de la pièce, à sa place relevée, avec une ombre et la lumière de la pièce ;
 * 2. GÉNÉRÉE : une image du duo dans la pièce (faite une fois par duo, par pièce et par lumière), d'après la pièce et
 *    les deux poses — LA VERSION CHOISIE par le propriétaire (« très bien »). Seule la zone des deux places est peinte
 *    (un masque), puis recollée sur la pièce : la télé, les cadres, l'étagère restent à leur place relevée, au pixel près.
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
import { ANCRE_ASSISE, PLACES_PAR_DEFAUT, avisCollageValide, momentDuoValide, pieceDuoDe, pieceDuoValide, type ChoixCollage, type EtatCollage, type FigurineDuo, type MomentDuo, type PieceDuo, type PlaceDuo } from "./pieces-duo";
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

/**
 * Le duo dans la pièce : seule la zone des deux places est peinte (un masque), les deux figurines assises à leurs
 * places ; tout le reste de la pièce est gardé.
 */
export function consigneDuoDansLaPiece(places: PlaceDuo[]): string {
  const ou = (p: PlaceDuo) => `about ${Math.round(p.x * 100)}% from the left and ${Math.round(p.y * 100)}% from the top`;
  return [
    "IMAGE 1 is a room. IMAGE 2 and IMAGE 3 are two collectible figurines (big heads, small bodies), each seated on nothing.",
    "Edit IMAGE 1 in the transparent (masked) area only: that is where the two empty seats are.",
    `Seat the figurine of IMAGE 2 on the left empty seat of the room (${ou(places[0])}) and the figurine of IMAGE 3 on the right empty seat (${ou(places[1])}), turned slightly toward each other, relaxed, like two close friends chatting.`,
    "Keep each figurine EXACTLY as it is: same face, same hair, same clothes, same colors, same style.",
    "Keep everything outside the masked area EXACTLY as it is.",
    "The figurines truly belong to the scene: the room's light falls on them, soft contact shadows where they touch the seats, the right size for the seats (each one fills its seat like a small person would).",
    "Add nothing else: no text, no other character, no animal.",
  ].join("\n");
}

/**
 * 🎭 LA ZONE DES DEUX PLACES, en pixels (le masque, puis le recollage) : de la tête au pied des deux figurines assises,
 * avec de la marge. La hauteur d'une figurine assise compte pour au moins `HAUTEUR_MIN_DUO` de l'image (les relevés la
 * donnent souvent trop petite : l'essai du collage l'a montré).
 */
const HAUTEUR_MIN_DUO = 0.34;
export function zoneDesPlaces(places: PlaceDuo[], l: number, h: number): { left: number; top: number; width: number; height: number } {
  const hz = Math.max(HAUTEUR_MIN_DUO, ...places.map((p) => p.hauteur));
  const x1 = Math.max(0, Math.min(...places.map((p) => p.x)) * l - 0.55 * hz * h);
  const x2 = Math.min(l, Math.max(...places.map((p) => p.x)) * l + 0.55 * hz * h);
  const y1 = Math.max(0, (Math.min(...places.map((p) => p.y)) - ANCRE_ASSISE * hz - 0.06) * h);
  const y2 = Math.min(h, (Math.max(...places.map((p) => p.y)) + (1 - ANCRE_ASSISE) * hz + 0.04) * h);
  return { left: Math.round(x1), top: Math.round(y1), width: Math.max(1, Math.round(x2 - x1)), height: Math.max(1, Math.round(y2 - y1)) };
}

/** Le masque : opaque partout, transparent dans la zone (là seulement, le moteur peint). */
async function masqueDe(l: number, h: number, z: ReturnType<typeof zoneDesPlaces>): Promise<Buffer> {
  const brut = Buffer.alloc(l * h * 4, 255);
  for (let y = z.top; y < z.top + z.height; y++) for (let x = z.left; x < z.left + z.width; x++) brut[(y * l + x) * 4 + 3] = 0;
  return sharp(brut, { raw: { width: l, height: h, channels: 4 } }).png().toBuffer();
}

/**
 * LE RECOLLAGE : de l'image rendue, on ne garde que la zone des places (ses bords fondus), recollée sur la pièce
 * d'origine. La télé, les cadres, l'étagère restent alors exactement à leur place relevée, au pixel près (le moteur,
 * même masqué, retouche parfois un peu le reste).
 */
async function recoller(piece: Buffer, rendue: Buffer, l: number, h: number, z: ReturnType<typeof zoneDesPlaces>): Promise<Buffer> {
  // (le fondu fait à la main, pixel par pixel : les canaux et l'ordre des opérations de sharp ne sont pas les mêmes
  // partout — dans l'app, un calque avec sa transparence ajoutée passait entier par-dessus la pièce)
  const brut = (b: Buffer) => sharp(b).resize(l, h, { fit: "fill" }).removeAlpha().toColourspace("srgb").raw().toBuffer();
  const [a, b] = await Promise.all([brut(piece), brut(rendue)]);
  const plume = Math.max(2, Math.round(Math.min(z.width, z.height) * 0.06));
  const sortie = Buffer.from(a);
  for (let y = z.top; y < z.top + z.height; y++)
    for (let x = z.left; x < z.left + z.width; x++) {
      // (1 au cœur de la zone, 0 sur son bord : un fondu sur `plume` pixels)
      const t = Math.min(1, Math.min(x - z.left + 0.5, z.left + z.width - x - 0.5, y - z.top + 0.5, z.top + z.height - y - 0.5) / plume);
      const k = (y * l + x) * 3;
      for (let c = 0; c < 3; c++) sortie[k + c] = Math.round(a[k + c] * (1 - t) + b[k + c] * t);
    }
  return sharp(sortie, { raw: { width: l, height: h, channels: 3 } }).png().toBuffer();
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
/** Une image du duo par pièce ET par lumière (le matin, le soir, la nuit), faite à sa première visite, puis gardée. */
const nomDuo = (piece: PieceDuo, moment: MomentDuo, a: Source, b: Source) => `${piece}-${moment}-${empreinte(a.chemin)}-${empreinte(b.chemin)}.png`;
/** La pièce dans une lumière : son image première dans son moment à elle, une retouche pour les deux autres. */
const cheminDecor = (piece: PieceDuo, moment: MomentDuo) => `pieces-duo/${piece}/${moment === pieceDuoDe(piece).moment ? "decor.png" : `lumiere-${moment}.png`}`;
const momentDuChoix = (c: ChoixCollage) => c.moment ?? pieceDuoDe(c.piece).moment;

async function lireChoix(supabase: Supabase): Promise<ChoixCollage | null> {
  const c = await lireJson<ChoixCollage>(supabase, `${DOSSIER}/choix.json`);
  return pieceDuoValide(c.piece) && s(c.a) && s(c.b)
    ? { piece: c.piece, a: s(c.a), b: s(c.b), ...(momentDuoValide(c.moment) ? { moment: c.moment } : {}), ...(avisCollageValide(c.avis) ? { avis: c.avis } : {}), ...(s(c.note) ? { note: s(c.note) } : {}) }
    : null;
}
const ecrireChoix = (supabase: Supabase, c: ChoixCollage) => depotDans(supabase, DOSSIER).ecrire("choix.json", Buffer.from(JSON.stringify(c)), "application/json");

/**
 * La pièce dans une lumière (signée ; rien si cette lumière n'est pas faite), les lumières faites de la pièce, et ses
 * deux places, de gauche à droite (celles par défaut si elle n'a pas été relevée).
 */
async function placesDe(supabase: Supabase, piece: PieceDuo, moment?: MomentDuo): Promise<{ decor?: string; moments: MomentDuo[]; places: PlaceDuo[] }> {
  const v = (await etatPiecesDuo(supabase)).pieces.find((p) => p.cle === piece);
  const places = v?.emplacements?.places.length === 2 ? [...v.emplacements.places].sort((a, b) => a.x - b.x) : PLACES_PAR_DEFAUT;
  const sien = pieceDuoDe(piece).moment;
  const lumiere = (m: MomentDuo) => (m === sien ? v?.decor : v?.lumieres?.[m]) || "";
  const moments = v?.decor ? (["matin", "soir", "nuit"] as const).filter((m) => lumiere(m)) : [];
  const decor = lumiere(moment ?? sien);
  return { ...(decor ? { decor } : {}), moments, places };
}

/** 🧩 Ce que la page montre : les figurines, le choix, la pièce et ses places, les poses et le duo faits. */
export async function etatCollage(supabase: Supabase, moi: string | null): Promise<EtatCollage> {
  const [srcs, choix] = await Promise.all([sources(supabase, moi), lireChoix(supabase)]);
  const figurines: FigurineDuo[] = await Promise.all(srcs.map(async (x) => ({ id: x.id, nom: x.nom, image: await signer(supabase, x.chemin) })));
  const etat: EtatCollage = { figurines, choix, moments: [], places: PLACES_PAR_DEFAUT, poses: {}, moteur: Boolean(cle()) };
  const a = srcs.find((x) => x.id === choix?.a);
  const b = srcs.find((x) => x.id === choix?.b);
  if (!choix || !a || !b) return { ...etat, choix: null };
  const [{ decor, moments, places }, poses, duos] = await Promise.all([
    placesDe(supabase, choix.piece, momentDuChoix(choix)),
    depotDans(supabase, `${DOSSIER}/poses`)
      .lister()
      .catch(() => [] as string[]),
    depotDans(supabase, `${DOSSIER}/duos`)
      .lister()
      .catch(() => [] as string[]),
  ]);
  const signee = async (src: Source) => (poses.includes(`${empreinte(src.chemin)}.png`) ? await signer(supabase, cheminPose(src)) : "");
  const [pa, pb] = await Promise.all([signee(a), signee(b)]);
  const duo = nomDuo(choix.piece, momentDuChoix(choix), a, b);
  return {
    ...etat,
    ...(decor ? { decor } : {}),
    moment: momentDuChoix(choix),
    moments,
    places,
    poses: { ...(pa ? { a: pa } : {}), ...(pb ? { b: pb } : {}) },
    ...(duos.includes(duo) ? { generee: await signer(supabase, `${DOSSIER}/duos/${duo}`) } : {}),
  };
}

/** Choisir la pièce, sa lumière (la sienne par défaut) et les deux figurines (l'avis précédent s'efface). */
export async function choisirCollage(supabase: Supabase, moi: string | null, piece: unknown, a: unknown, b: unknown, moment?: unknown): Promise<{ erreur?: string }> {
  if (!pieceDuoValide(piece)) return { erreur: "Quelle pièce ?" };
  const m = momentDuoValide(moment) ? moment : pieceDuoDe(piece).moment;
  const lieu = await placesDe(supabase, piece, m);
  if (!lieu.moments.length) return { erreur: "Cette pièce n’est pas encore faite." };
  if (!lieu.decor) return { erreur: "Cette lumière n’est pas encore faite (« Faire ce qui manque », plus haut)." };
  const srcs = await sources(supabase, moi);
  if (!srcs.some((x) => x.id === a) || !srcs.some((x) => x.id === b) || a === b) return { erreur: "Choisis deux figurines différentes." };
  await ecrireChoix(supabase, { piece, a: String(a), b: String(b), moment: m });
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
    const duo = nomDuo(choix.piece, momentDuChoix(choix), a, b);
    if (
      (
        await depotDans(supabase, `${DOSSIER}/duos`)
          .lister()
          .catch(() => [] as string[])
      ).includes(duo)
    )
      return {};
    const piece = await telecharger(supabase, cheminDecor(choix.piece, momentDuChoix(choix)));
    const [pa, pb] = await Promise.all([telecharger(supabase, cheminPose(a)), telecharger(supabase, cheminPose(b))]);
    if (!piece || !pa || !pb) return { erreur: "La pièce ou une pose est introuvable." };
    const { places } = await placesDe(supabase, choix.piece, momentDuChoix(choix));
    const meta = await sharp(piece).metadata();
    const [l, h] = [meta.width ?? 0, meta.height ?? 0];
    if (!l || !h) return { erreur: "La pièce n’a pas pu être lue." };
    const zone = zoneDesPlaces(places, l, h);
    const masque = await masqueDe(l, h, zone);
    const r = await demanderUneImage({ images: [piece, pa, pb], masque, consigne: consigneDuoDansLaPiece(places), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
    if ("erreur" in r) return { erreur: r.erreur };
    await depotDans(supabase, `${DOSSIER}/duos`).ecrire(duo, await recoller(piece, r.png, l, h, zone), "image/png");
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
  const chemins = [`${DOSSIER}/duos/${nomDuo(choix.piece, momentDuChoix(choix), a, b)}`, ...(quoi === "poses" ? [cheminPose(a), cheminPose(b)] : [])];
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
