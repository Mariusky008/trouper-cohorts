/**
 * 🧩 L'EFFET « COLLAGE » — LE PREMIER ESSAI DE LA MAQUETTE DE LA PIÈCE DU DUO (`docs/univers/piece-du-duo.md`, section 5 ;
 * `pieces-duo.ts`). La session de l'univers l'a relevé : des figurines détourées posées sur une pièce dessinée à part
 * peuvent faire autocollant (une autre lumière, pas d'ombre, une échelle approximative, pas de contact avec le siège).
 * Avant tout le reste, le propriétaire regarde DEUX VRAIES FIGURINES DANS UNE VRAIE PIÈCE, de deux façons :
 *
 * 1. POSÉES : chaque figurine, assise SANS son fauteuil (une image faite une fois par figurine, détourée au plus près),
 *    posée par l'écran sur l'image de la pièce, à sa place relevée, avec une ombre et la lumière de la pièce ;
 * 2. GÉNÉRÉE : une image du duo dans la pièce (faite une fois par duo, par pièce et par lumière), d'après la pièce et
 *    les deux poses — LA VERSION CHOISIE par le propriétaire (« très bien »). Les poses sont d'abord posées sur leurs
 *    places, à leur taille (un collage) ; le moteur les assoit pour de vrai dans leur silhouette seulement (un masque),
 *    recollée sur la pièce : les meubles, la télé, les cadres, l'étagère restent tels quels.
 *
 * Les figurines : celle de ce téléphone (sa figurine assise, si elle est du nouveau style) et celles des essais du lot 0
 * (des volontaires d'accord : détourées, ou leur constance assise ; pas celles qu'il a refusées). Rangé à part :
 * `pieces-duo/collage/` — `choix.json` (la pièce, les deux figurines, son avis), `poses/<empreinte>.png` (l'empreinte
 * de l'image d'origine : une nouvelle figurine, une nouvelle pose), `duos/<pièce>-<lumière>-<a>-<b>-2.png`. Un passage fait une
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
import { ANCRE_ASSISE, MOMENTS_DUO, PIECES_DUO, PLACES_PAR_DEFAUT, assisesDe, hauteurDuo, avisCollageValide, momentDuoValide, pieceDuoDe, pieceDuoValide, type ChoixCollage, type DuoVivant, type EtatCollage, type FigurineDuo, type MomentDuo, type PieceDuo, type PlaceDuo } from "./pieces-duo";
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
 * Le duo dans la pièce, D'APRÈS UN COLLAGE : les deux figurines sont d'abord posées sur la pièce, à leurs places et à leur
 * taille (`poserLesFigurines`) ; le moteur ne fait que les asseoir pour de vrai (le contact, la lumière, les ombres), dans
 * leur silhouette seulement (`zonePeinte`), sans rien déplacer ni agrandir. (Laissé libre, il refaisait la pièce en gros
 * plan, ou changeait ses fauteuils et retirait la platine, la table : les essais du propriétaire, le 15 novembre.)
 */
export function consigneDuoDansLaPiece(places: PlaceDuo[]): string {
  const ou = (p: PlaceDuo) => `about ${Math.round(p.x * 100)}% from the left and ${Math.round(p.y * 100)}% from the top`;
  return [
    "IMAGE 1 is a room in which two collectible figurines (big heads, small bodies) have just been placed on the two seats — a rough cut-out collage. IMAGE 2 and IMAGE 3 are those two figurines as they really are.",
    `Edit IMAGE 1 in the transparent (masked) area only — it follows the outline of the two figurines — so that they truly sit on their seats in this room: the figurine of IMAGE 2 on the left seat (${ou(places[0])}), the figurine of IMAGE 3 on the right seat (${ou(places[1])}), turned slightly toward each other, relaxed, like two close friends chatting.`,
    "Keep the room EXACTLY as it is: the same framing, the same camera, every object and every piece of furniture at the same place and the same size. Do not zoom in, do not crop, do not enlarge the seats.",
    "Keep each figurine at EXACTLY the same place and the same size as in IMAGE 1: they are small in the room, at the scale of their seats. Each figurine is entirely visible, from the top of its head to its feet.",
    "Do not redraw, move, bend or reshape the seats or any furniture: they stay exactly as they are; only the figurines and their soft shadows are painted.",
    "Each one truly sits on its seat: its bottom on the seat, its back against the backrest if there is one, its knees bent, its feet resting on the floor or hanging just above it — never sunk into the floor or the rug.",
    "Keep each figurine EXACTLY as in IMAGE 2 and IMAGE 3: same face, same hair, same clothes, same colors, same style.",
    "The figurines truly belong to the scene: the room's light falls on them, soft contact shadows where they touch the seats and the floor, no cut-out edges.",
    "Keep everything outside the masked area EXACTLY as it is.",
    "Add nothing else: no text, no other character, no animal.",
  ].join("\n");
}

/**
 * 🧩 LE COLLAGE de départ : les deux poses sans fauteuil, posées sur la pièce — le point qui touche le siège sur sa place
 * (en points d'assise), la hauteur des deux (`hauteurDuo`). Fondu à la main, pixel par pixel (comme le recollage).
 * `presence` : où sont les figurines (leur opacité, de 0 à 255), pour la zone peinte.
 */
async function poserLesFigurines(piece: Buffer, poses: [Buffer, Buffer], places: PlaceDuo[], l: number, h: number): Promise<{ collage: Buffer; presence: Uint8Array; haut: number }> {
  const fond = Buffer.from(await sharp(piece).resize(l, h, { fit: "fill" }).removeAlpha().toColourspace("srgb").raw().toBuffer());
  const presence = new Uint8Array(l * h);
  const haut = Math.max(8, Math.round(hauteurDuo(places) * h));
  for (const [k, pose] of poses.entries()) {
    const { data, info } = await sharp(pose).resize({ height: haut }).ensureAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    const n = info.channels;
    const gauche = Math.round(places[k].x * l - info.width / 2);
    const dessus = Math.round(places[k].y * h - ANCRE_ASSISE * info.height);
    for (let y = 0; y < info.height; y++) {
      const Y = dessus + y;
      if (Y < 0 || Y >= h) continue;
      for (let x = 0; x < info.width; x++) {
        const X = gauche + x;
        if (X < 0 || X >= l) continue;
        const i = (y * info.width + x) * n;
        const a = n >= 4 ? data[i + 3] : 255;
        if (a <= 0) continue;
        const t = a / 255;
        const o = (Y * l + X) * 3;
        for (let c = 0; c < 3; c++) fond[o + c] = Math.round(fond[o + c] * (1 - t) + data[i + c] * t);
        presence[Y * l + X] = Math.max(presence[Y * l + X], a);
      }
    }
  }
  return { collage: await sharp(fond, { raw: { width: l, height: h, channels: 3 } }).png().toBuffer(), presence, haut };
}

type ZonePx = { left: number; top: number; width: number; height: number };
/** Ce qui est peint : une boîte, et dedans, pixel par pixel, de 0 (la pièce telle quelle) à 1 (l'image rendue). */
type Peinte = { zone: ZonePx; poids: Float32Array };

/**
 * 🎭 CE QUI EST PEINT : la silhouette des deux figurines posées, prolongée un peu vers le bas (leurs ombres sur le siège et
 * le sol), élargie d'une marge fine, puis fondue — rien d'autre de la pièce, ni ses meubles, ni ses objets. (Une marge
 * large laissait le moteur déformer les sièges autour d'elles : le quatrième essai.) (Une grande zone rectangulaire laissait
 * le moteur changer les fauteuils et retirer la platine, la table, l'évier : le troisième essai du propriétaire.)
 */
function zonePeinte(presence: Uint8Array, l: number, h: number, haut: number): Peinte {
  const marge = Math.max(2, Math.round(haut * 0.03));
  const plume = Math.max(2, Math.round(haut * 0.03));
  const R = marge + plume;
  const SEUIL = 24;
  // (les ombres tombent sous la figurine : sa silhouette prolongée vers le bas, sur le siège et le sol)
  const ombre = Math.max(1, Math.round(haut * 0.05));
  const dedans = (x: number, y: number) => {
    for (let k = 0; k <= ombre; k += Math.max(1, Math.floor(ombre / 4))) if (y - k >= 0 && presence[(y - k) * l + x] > SEUIL) return true;
    return false;
  };
  let [x0, y0, x1, y1] = [l, h, -1, -1];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < l; x++)
      if (presence[y * l + x] > SEUIL) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return { zone: { left: 0, top: 0, width: 0, height: 0 }, poids: new Float32Array(0) };
  const left = Math.max(0, x0 - R);
  const top = Math.max(0, y0 - R);
  const width = Math.min(l, x1 + R + 1) - left;
  const height = Math.min(h, y1 + ombre + R + 1) - top;
  // (la distance de chaque pixel à la figurine la plus proche : deux passages, en avant puis en arrière)
  const d = new Float32Array(width * height).fill(1e9);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (dedans(left + x, top + y)) d[y * width + x] = 0;
  const D = Math.SQRT2;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, d[i - width] + 1);
        if (x > 0) v = Math.min(v, d[i - width - 1] + D);
        if (x < width - 1) v = Math.min(v, d[i - width + 1] + D);
      }
      d[i] = v;
    }
  for (let y = height - 1; y >= 0; y--)
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      let v = d[i];
      if (x < width - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < height - 1) {
        v = Math.min(v, d[i + width] + 1);
        if (x < width - 1) v = Math.min(v, d[i + width + 1] + D);
        if (x > 0) v = Math.min(v, d[i + width - 1] + D);
      }
      d[i] = v;
    }
  // (1 sur la figurine et dans la marge, puis un fondu sur `plume` pixels)
  const poids = new Float32Array(width * height);
  for (let i = 0; i < poids.length; i++) poids[i] = Math.max(0, Math.min(1, (R - d[i]) / plume));
  return { zone: { left, top, width, height }, poids };
}

/** Le masque : opaque partout, transparent là où l'on peint (là seulement, le moteur peint). */
async function masqueDe(l: number, h: number, p: Peinte): Promise<Buffer> {
  const brut = Buffer.alloc(l * h * 4, 255);
  const z = p.zone;
  for (let y = 0; y < z.height; y++) for (let x = 0; x < z.width; x++) if (p.poids[y * z.width + x] > 0) brut[((z.top + y) * l + z.left + x) * 4 + 3] = 0;
  return sharp(brut, { raw: { width: l, height: h, channels: 4 } }).png().toBuffer();
}

/**
 * LE RECOLLAGE : de l'image rendue, on ne garde que ce qui est peint (ses bords fondus), recollé sur la pièce d'origine.
 * Tout le reste — les meubles, la télé, les cadres, l'étagère — reste exactement tel quel, au pixel près (le moteur, même
 * masqué, retouche le reste).
 */
async function recoller(piece: Buffer, rendue: Buffer, l: number, h: number, p: Peinte): Promise<Buffer> {
  // (le fondu fait à la main, pixel par pixel : les canaux et l'ordre des opérations de sharp ne sont pas les mêmes
  // partout — dans l'app, un calque avec sa transparence ajoutée passait entier par-dessus la pièce)
  const brut = (b: Buffer) => sharp(b).resize(l, h, { fit: "fill" }).removeAlpha().toColourspace("srgb").raw().toBuffer();
  const [a, b] = await Promise.all([brut(piece), brut(rendue)]);
  const sortie = Buffer.from(a);
  const z = p.zone;
  for (let y = 0; y < z.height; y++)
    for (let x = 0; x < z.width; x++) {
      const t = p.poids[y * z.width + x];
      if (t <= 0) continue;
      const k = ((z.top + y) * l + z.left + x) * 3;
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
/**
 * Une image du duo par pièce ET par lumière (le matin, le soir, la nuit), faite à sa première visite, puis gardée.
 * Son nom finit par l'empreinte des deux places : les ajuster (la page d'essais, « ✋ Ajuster leurs places ») refait
 * l'image à la prochaine visite. (Les images d'avant le 16 novembre — têtes coupées, la pièce en gros plan, les meubles
 * changés — ne servent plus.)
 */
const nomDuo = (piece: PieceDuo, moment: MomentDuo, a: Source, b: Source, places: PlaceDuo[]) =>
  `${piece}-${moment}-${empreinte(a.chemin)}-${empreinte(b.chemin)}-${empreinte(JSON.stringify(places.map((p) => [p.x, p.y, p.hauteur].map((v) => Math.round(v * 1000)))))}.png`;
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
async function placesDe(supabase: Supabase, piece: PieceDuo, moment?: MomentDuo): Promise<{ decor?: string; moments: MomentDuo[]; places: PlaceDuo[]; posees: boolean }> {
  const v = (await etatPiecesDuo(supabase)).pieces.find((p) => p.cle === piece);
  const { places, posees } = placesDeLaVue(v);
  const sien = pieceDuoDe(piece).moment;
  const lumiere = (m: MomentDuo) => (m === sien ? v?.decor : v?.lumieres?.[m]) || "";
  const moments = v?.decor ? (["matin", "soir", "nuit"] as const).filter((m) => lumiere(m)) : [];
  const decor = lumiere(moment ?? sien);
  return { ...(decor ? { decor } : {}), moments, places, posees };
}

/** Les deux places d'une pièce, en points d'assise (une place tracée à la main est la boîte de la figurine entière, `assisesDe`), de gauche à droite ; celles par défaut s'il n'y en a pas deux. */
function placesDeLaVue(v: { emplacements?: { places: PlaceDuo[] }; ajuste?: boolean } | undefined): { places: PlaceDuo[]; posees: boolean } {
  const posees = v?.emplacements?.places.length === 2;
  return { places: posees && v?.emplacements ? assisesDe([...v.emplacements.places].sort((a, b) => a.x - b.x), Boolean(v.ajuste)) : PLACES_PAR_DEFAUT, posees };
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
  const duo = nomDuo(choix.piece, momentDuChoix(choix), a, b, places);
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
  return fabriquerDuo(supabase, a, b, choix.piece, momentDuChoix(choix), avant);
}

/**
 * La fabrication d'un duo dans une pièce et une lumière, un passage à la fois : la pose sans fauteuil de la première
 * figurine, celle de la seconde (faites une fois, gardées pour toutes les pièces), puis le duo (une fois par pièce et
 * par lumière). Rien quand tout est fait.
 */
async function fabriquerDuo(supabase: Supabase, a: Source, b: Source, pieceDuo: PieceDuo, moment: MomentDuo, avant: number): Promise<{ fait?: "pose-a" | "pose-b" | "duo"; erreur?: string }> {
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
    const { places, posees } = await placesDe(supabase, pieceDuo, moment);
    const duo = nomDuo(pieceDuo, moment, a, b, places);
    if (
      (
        await depotDans(supabase, `${DOSSIER}/duos`)
          .lister()
          .catch(() => [] as string[])
      ).includes(duo)
    )
      return {};
    // (les figurines se posent sur les sièges : sans leurs deux places, elles tomberaient à côté)
    if (!posees) return { erreur: "Les deux places de cette pièce ne sont pas encore tracées (« 🛋️ La pièce du duo », ✋)." };
    const piece = await telecharger(supabase, cheminDecor(pieceDuo, moment));
    const [pa, pb] = await Promise.all([telecharger(supabase, cheminPose(a)), telecharger(supabase, cheminPose(b))]);
    if (!piece || !pa || !pb) return { erreur: "La pièce ou une pose est introuvable." };
    const meta = await sharp(piece).metadata();
    const [l, h] = [meta.width ?? 0, meta.height ?? 0];
    if (!l || !h) return { erreur: "La pièce n’a pas pu être lue." };
    const { collage, presence, haut } = await poserLesFigurines(piece, [pa, pb], places, l, h);
    const zone = zonePeinte(presence, l, h, haut);
    const masque = await masqueDe(l, h, zone);
    const r = await demanderUneImage({ images: [collage, pa, pb], masque, consigne: consigneDuoDansLaPiece(places), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
    if ("erreur" in r) return { erreur: r.erreur };
    await depotDans(supabase, `${DOSSIER}/duos`).ecrire(duo, await recoller(piece, r.png, l, h, zone), "image/png");
    return { fait: "duo" };
  } finally {
    await rendre(d, qui);
  }
}

// ─── 🛋️ LA PIÈCE VIVANTE (la maquette, `docs/univers/piece-du-duo.md`, section 12) ──────────────────────────────────
/** Le duo de la maquette : les deux figurines choisies dans l'essai du collage, et ses images faites (pièce, lumière). */
export async function duoVivant(supabase: Supabase, moi: string | null): Promise<DuoVivant | null> {
  const [choix, srcs] = await Promise.all([lireChoix(supabase), sources(supabase, moi)]);
  const a = srcs.find((x) => x.id === choix?.a);
  const b = srcs.find((x) => x.id === choix?.b);
  if (!a || !b) return null;
  const [faits, vues] = await Promise.all([
    depotDans(supabase, `${DOSSIER}/duos`)
      .lister()
      .catch(() => [] as string[]),
    etatPiecesDuo(supabase).then((e) => e.pieces),
  ]);
  const duos: DuoVivant["duos"] = {};
  for (const p of PIECES_DUO)
    for (const m of MOMENTS_DUO) {
      const n = nomDuo(p.cle, m.cle, a, b, placesDeLaVue(vues.find((v) => v.cle === p.cle)).places);
      if (faits.includes(n)) duos[`${p.cle}-${m.cle}`] = await signer(supabase, `${DOSSIER}/duos/${n}`);
    }
  const prenom = (x: Source) => (x.id === "moi" ? "Toi" : x.nom.replace(/ 👍$/, ""));
  return { a: { id: a.id, nom: prenom(a) }, b: { id: b.id, nom: prenom(b) }, duos };
}

/** Un passage pour le duo de la maquette dans une pièce et une lumière (à sa première visite). */
export async function fabriquerDuoVivant(supabase: Supabase, moi: string | null, piece: unknown, moment: unknown, avant: number): Promise<{ fait?: "pose-a" | "pose-b" | "duo"; erreur?: string }> {
  if (!pieceDuoValide(piece) || !momentDuoValide(moment)) return { erreur: "Quelle pièce, quelle lumière ?" };
  const [choix, srcs] = await Promise.all([lireChoix(supabase), sources(supabase, moi)]);
  const a = srcs.find((x) => x.id === choix?.a);
  const b = srcs.find((x) => x.id === choix?.b);
  if (!a || !b) return { erreur: "Choisis d’abord vos deux figurines dans l’essai du collage." };
  if (!(await placesDe(supabase, piece, moment)).decor) return { erreur: "Cette pièce n’est pas encore faite dans cette lumière." };
  return fabriquerDuo(supabase, a, b, piece, moment, avant);
}

/** Refaire les deux poses (et donc le duo), ou le duo seul. */
export async function refaireCollage(supabase: Supabase, moi: string | null, quoi: "poses" | "duo"): Promise<void> {
  const choix = await lireChoix(supabase);
  const srcs = await sources(supabase, moi);
  const a = srcs.find((x) => x.id === choix?.a);
  const b = srcs.find((x) => x.id === choix?.b);
  if (!choix || !a || !b) return;
  const { places } = await placesDe(supabase, choix.piece, momentDuChoix(choix));
  const chemins = [`${DOSSIER}/duos/${nomDuo(choix.piece, momentDuChoix(choix), a, b, places)}`, ...(quoi === "poses" ? [cheminPose(a), cheminPose(b)] : [])];
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
