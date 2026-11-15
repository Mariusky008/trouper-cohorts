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
 *    places, à la taille des sièges (un collage) ; le moteur les assoit pour de vrai dans une zone autour d'elles (un
 *    masque), recollée sur la pièce : la télé, les cadres, l'étagère restent à leur place relevée.
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
import { ANCRE_ASSISE, MOMENTS_DUO, PIECES_DUO, PLACES_PAR_DEFAUT, hauteurDuo, zoneDesFigurines, zoneDuMasque, avisCollageValide, momentDuoValide, pieceDuoDe, pieceDuoValide, type ChoixCollage, type DuoVivant, type EtatCollage, type FigurineDuo, type MomentDuo, type PieceDuo, type PlaceDuo, type Zone } from "./pieces-duo";
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
 * Le duo dans la pièce, D'APRÈS UN COLLAGE : les deux figurines sont d'abord posées sur la pièce, à leurs places et à la
 * taille des sièges (`poserLesFigurines`) ; le moteur ne fait que les asseoir pour de vrai (le contact, la lumière, les
 * ombres), dans la zone masquée, sans rien déplacer ni agrandir. (Laissé libre de leur taille, il refaisait la pièce en
 * gros plan : le second essai du propriétaire, « on ne voit plus que les deux figurines ».)
 */
export function consigneDuoDansLaPiece(places: PlaceDuo[]): string {
  const ou = (p: PlaceDuo) => `about ${Math.round(p.x * 100)}% from the left and ${Math.round(p.y * 100)}% from the top`;
  return [
    "IMAGE 1 is a room in which two collectible figurines (big heads, small bodies) have just been placed on the two seats — a rough cut-out collage. IMAGE 2 and IMAGE 3 are those two figurines as they really are.",
    `Edit IMAGE 1 in the transparent (masked) area only, so that the two figurines truly sit on their seats in this room: the figurine of IMAGE 2 on the left seat (${ou(places[0])}), the figurine of IMAGE 3 on the right seat (${ou(places[1])}), turned slightly toward each other, relaxed, like two close friends chatting.`,
    "Keep the room EXACTLY as it is: the same framing, the same camera, every object and every piece of furniture at the same place and the same size. Do not zoom in, do not crop, do not enlarge the seats.",
    "Keep each figurine at EXACTLY the same place and the same size as in IMAGE 1: they are small in the room, at the scale of their seats. Each figurine is entirely visible, from the top of its head to its feet.",
    "Each one truly sits on its seat: its bottom on the seat, its back against the backrest if there is one, its knees bent, its feet resting on the floor or hanging just above it — never sunk into the floor or the rug.",
    "Keep each figurine EXACTLY as in IMAGE 2 and IMAGE 3: same face, same hair, same clothes, same colors, same style.",
    "The figurines truly belong to the scene: the room's light falls on them, soft contact shadows where they touch the seats and the floor, no cut-out edges.",
    "Keep everything outside the masked area EXACTLY as it is.",
    "Add nothing else: no text, no other character, no animal.",
  ].join("\n");
}

/**
 * 🧩 LE COLLAGE de départ : les deux poses sans fauteuil, posées sur la pièce — le point qui touche le siège sur sa place,
 * la hauteur des deux (`hauteurDuo`). Fondu à la main, pixel par pixel (comme le recollage).
 */
async function poserLesFigurines(piece: Buffer, poses: [Buffer, Buffer], places: PlaceDuo[], l: number, h: number): Promise<Buffer> {
  const fond = Buffer.from(await sharp(piece).resize(l, h, { fit: "fill" }).removeAlpha().toColourspace("srgb").raw().toBuffer());
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
        const t = n >= 4 ? data[i + 3] / 255 : 1;
        if (t <= 0) continue;
        const o = (Y * l + X) * 3;
        for (let c = 0; c < 3; c++) fond[o + c] = Math.round(fond[o + c] * (1 - t) + data[i + c] * t);
      }
    }
  }
  return sharp(fond, { raw: { width: l, height: h, channels: 3 } }).png().toBuffer();
}

type ZonePx = { left: number; top: number; width: number; height: number };
const enPixels = ([x, y, w, ht]: Zone, l: number, h: number): ZonePx => ({ left: Math.round(x * l), top: Math.round(y * h), width: Math.max(1, Math.round(w * l)), height: Math.max(1, Math.round(ht * h)) });

/**
 * 🎭 CE QUI EST PEINT, pixel par pixel (de 0, la pièce telle quelle, à 1, l'image rendue) : la zone du masque
 * (`zoneDuMasque`, `pieces-duo.ts`), ses bords fondus — sans les objets de la pièce (la télé, la platine, les cadres,
 * l'étagère, la fenêtre) qui ne touchent pas les figurines : ceux-là restent exactement à leur place relevée.
 */
function zonePeinte(places: PlaceDuo[], objets: Zone[], l: number, h: number): { zone: ZonePx; poids: (x: number, y: number) => number } {
  const zone = enPixels(zoneDuMasque(places, h / l), l, h);
  const [fx, fy, fw, fh] = zoneDesFigurines(places, h / l);
  const proteges = objets.filter(([x, y, w, ht]) => !(x < fx + fw && x + w > fx && y < fy + fh && y + ht > fy)).map((o) => enPixels(o, l, h));
  const plume = Math.max(2, Math.round(Math.min(zone.width, zone.height) * 0.05));
  const poids = (x: number, y: number) => {
    let t = Math.min(1, Math.min(x - zone.left + 0.5, zone.left + zone.width - x - 0.5, y - zone.top + 0.5, zone.top + zone.height - y - 0.5) / plume);
    for (const o of proteges) {
      if (t <= 0) break;
      // (la distance au rectangle de l'objet : 0 dedans, puis un fondu)
      const dx = Math.max(o.left - x - 0.5, 0, x + 0.5 - o.left - o.width);
      const dy = Math.max(o.top - y - 0.5, 0, y + 0.5 - o.top - o.height);
      t = Math.min(t, Math.hypot(dx, dy) / plume);
    }
    return Math.max(0, t);
  };
  return { zone, poids };
}

/** Le masque : opaque partout, transparent là où l'on peint (là seulement, le moteur peint). */
async function masqueDe(l: number, h: number, p: ReturnType<typeof zonePeinte>): Promise<Buffer> {
  const brut = Buffer.alloc(l * h * 4, 255);
  const z = p.zone;
  for (let y = z.top; y < z.top + z.height; y++) for (let x = z.left; x < z.left + z.width; x++) if (p.poids(x, y) > 0) brut[(y * l + x) * 4 + 3] = 0;
  return sharp(brut, { raw: { width: l, height: h, channels: 4 } }).png().toBuffer();
}

/**
 * LE RECOLLAGE : de l'image rendue, on ne garde que ce qui est peint (ses bords fondus), recollé sur la pièce d'origine.
 * La télé, les cadres, l'étagère restent alors exactement à leur place relevée, au pixel près (le moteur, même masqué,
 * retouche parfois un peu le reste).
 */
async function recoller(piece: Buffer, rendue: Buffer, l: number, h: number, p: ReturnType<typeof zonePeinte>): Promise<Buffer> {
  // (le fondu fait à la main, pixel par pixel : les canaux et l'ordre des opérations de sharp ne sont pas les mêmes
  // partout — dans l'app, un calque avec sa transparence ajoutée passait entier par-dessus la pièce)
  const brut = (b: Buffer) => sharp(b).resize(l, h, { fit: "fill" }).removeAlpha().toColourspace("srgb").raw().toBuffer();
  const [a, b] = await Promise.all([brut(piece), brut(rendue)]);
  const sortie = Buffer.from(a);
  const z = p.zone;
  for (let y = z.top; y < z.top + z.height; y++)
    for (let x = z.left; x < z.left + z.width; x++) {
      const t = p.poids(x, y);
      if (t <= 0) continue;
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
/**
 * Une image du duo par pièce ET par lumière (le matin, le soir, la nuit), faite à sa première visite, puis gardée.
 * `-3` : d'après un collage, à la taille des sièges (le 15 novembre) — les premières (têtes coupées), puis les `-2` (la
 * pièce refaite en gros plan), ne servent plus.
 */
const nomDuo = (piece: PieceDuo, moment: MomentDuo, a: Source, b: Source) => `${piece}-${moment}-${empreinte(a.chemin)}-${empreinte(b.chemin)}-3.png`;
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
async function placesDe(supabase: Supabase, piece: PieceDuo, moment?: MomentDuo): Promise<{ decor?: string; moments: MomentDuo[]; places: PlaceDuo[]; posees: boolean; objets: Zone[] }> {
  const v = (await etatPiecesDuo(supabase)).pieces.find((p) => p.cle === piece);
  const posees = v?.emplacements?.places.length === 2;
  const places = posees && v?.emplacements ? [...v.emplacements.places].sort((a, b) => a.x - b.x) : PLACES_PAR_DEFAUT;
  const e = v?.emplacements;
  const objets = e ? [e.tele, e.platine, ...e.cadres, e.etagere, e.fenetre].filter((z): z is Zone => Boolean(z)) : [];
  const sien = pieceDuoDe(piece).moment;
  const lumiere = (m: MomentDuo) => (m === sien ? v?.decor : v?.lumieres?.[m]) || "";
  const moments = v?.decor ? (["matin", "soir", "nuit"] as const).filter((m) => lumiere(m)) : [];
  const decor = lumiere(moment ?? sien);
  return { ...(decor ? { decor } : {}), moments, places, posees, objets };
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
    const duo = nomDuo(pieceDuo, moment, a, b);
    if (
      (
        await depotDans(supabase, `${DOSSIER}/duos`)
          .lister()
          .catch(() => [] as string[])
      ).includes(duo)
    )
      return {};
    const { places, posees, objets } = await placesDe(supabase, pieceDuo, moment);
    // (les figurines se posent sur les sièges : sans leurs deux places, elles tomberaient à côté)
    if (!posees) return { erreur: "Les deux places de cette pièce ne sont pas encore tracées (« 🛋️ La pièce du duo », ✋)." };
    const piece = await telecharger(supabase, cheminDecor(pieceDuo, moment));
    const [pa, pb] = await Promise.all([telecharger(supabase, cheminPose(a)), telecharger(supabase, cheminPose(b))]);
    if (!piece || !pa || !pb) return { erreur: "La pièce ou une pose est introuvable." };
    const meta = await sharp(piece).metadata();
    const [l, h] = [meta.width ?? 0, meta.height ?? 0];
    if (!l || !h) return { erreur: "La pièce n’a pas pu être lue." };
    const zone = zonePeinte(places, objets, l, h);
    const masque = await masqueDe(l, h, zone);
    const collage = await poserLesFigurines(piece, [pa, pb], places, l, h);
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
  const faits = await depotDans(supabase, `${DOSSIER}/duos`)
    .lister()
    .catch(() => [] as string[]);
  const duos: DuoVivant["duos"] = {};
  for (const p of PIECES_DUO)
    for (const m of MOMENTS_DUO) {
      const n = nomDuo(p.cle, m.cle, a, b);
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
