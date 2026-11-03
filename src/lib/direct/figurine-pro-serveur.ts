/**
 * 🪀 SA FIGURINE, CÔTÉ SERVEUR — voir `figurine-pro.ts` pour la règle.
 *
 * LE MOTEUR : celui de l'essayage (`moteur-image.ts`), le plus proche de ChatGPT que le compte peut appeler, avec ses
 * replis : un modèle refusé fait passer au suivant ; un réglage inconnu est retiré et la demande rejouée. On demande
 * un FOND TRANSPARENT ; un moteur qui ne sait pas le faire rend un fond vert uni, que `detourerSurFondUni` retire.
 *
 * LE STOCKAGE : un seau public à elle, `figurines-pros` (elle passe dans des vidéos publiques), créé au premier dépôt.
 * Une adresse impossible à deviner par image. Son état (`<site>/etat.json`) : celle qu'il a validée, celle qui attend
 * son « C'est moi », ses essais du jour, et ses figurines du mois (une par édition). SON SELFIE N'Y VA JAMAIS : il sert à
 * la fabrication, puis il est oublié.
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { FamilleDouble } from "./double-metiers";
import { editionsDuMoment } from "./collection";
import { ESSAIS_PAR_JOUR, QUESTION_TRAITS, SUFFIXE_ENTIERE, consigneEdition, consigneFigurine, jourDe, traitsDe, type EtatFigurinePro, type Traits } from "./figurine-pro";
import { regarderImage } from "./dressing-serveur";
import { moteurRefuse, moteursDImage, noterRefus } from "./moteur-image";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export const SEAU_FIGURINES_PROS = s(process.env.FIGURINES_PROS_BUCKET) || "figurines-pros";
const essaisParJour = () => Math.max(1, Number(s(process.env.FIGURINE_ESSAIS_PAR_JOUR)) || ESSAIS_PAR_JOUR);

/** `traits` : ses traits en mots (`decrireTraits`), gardés avec sa figurine pour l'habiller sans la changer. */
type Validee = { chemin: string; le: string; traits?: Traits | null; modele?: string };
type Proposee = { chemin: string; le: string; modele: string; traits?: Traits | null };
export type Etat = {
  validee?: Validee | null;
  /** La première proposition (celles d'avant n'en avaient qu'une) ; `proposees` : toutes celles de l'essai. */
  proposee?: Proposee | null;
  proposees?: Proposee[] | null;
  essais?: { jour: string; n: number };
  /** Ses figurines du mois, par édition et par année (« automne-2026 »). */
  editions?: Record<string, { validee?: Validee | null; proposee?: Proposee | null; proposees?: Proposee[] | null }>;
  /** 🗂 Toutes celles qu'il a validées, dans l'ordre : on n'en retire jamais (`ajouterALaCollection`). */
  collection?: Piece[];
};
/** Une figurine de sa collection : `cle` vaut `selfie` (sa figurine de tous les jours) ou « automne-2026 ». */
export type Piece = { chemin: string; le: string; cle: string; nom: string; emoji: string; debut?: string; fin?: string };

/** Elle entre dans sa collection (une seule fois par image). */
export function ajouterALaCollection(e: Etat, p: Piece): Piece[] {
  const deja = e.collection ?? [];
  return deja.some((x) => x.chemin === p.chemin) ? deja : [...deja, p];
}

/** Celles validées avant que la collection existe (sa figurine de tous les jours) : on les y range à la lecture. */
function piecesDe(e: Etat): Piece[] {
  const pieces = [...(e.collection ?? [])];
  if (e.validee && !pieces.some((x) => x.chemin === e.validee?.chemin))
    pieces.push({ chemin: e.validee.chemin, le: e.validee.le, cle: "selfie", nom: "Ma figurine", emoji: "🪀" });
  return pieces;
}

// ─── le stockage ────────────────────────────────────────────────────────────────────────────────

async function seauPret(supabase: Supabase): Promise<void> {
  const { data } = await supabase.storage.getBucket(SEAU_FIGURINES_PROS);
  if (data) return;
  const { error } = await supabase.storage.createBucket(SEAU_FIGURINES_PROS, { public: true });
  if (error && !/exist/i.test(error.message)) throw new Error(error.message);
}

const cheminEtat = (siteId: string) => `${siteId}/etat.json`;

export async function lireEtat(supabase: Supabase, siteId: string): Promise<Etat> {
  try {
    const { data } = await supabase.storage.from(SEAU_FIGURINES_PROS).download(cheminEtat(siteId));
    if (!data) return {};
    return JSON.parse(await data.text()) as Etat;
  } catch {
    return {};
  }
}

export async function ecrireEtat(supabase: Supabase, siteId: string, e: Etat): Promise<void> {
  await seauPret(supabase);
  const corps = Buffer.from(JSON.stringify(e));
  const { error } = await supabase.storage.from(SEAU_FIGURINES_PROS).upload(cheminEtat(siteId), corps, { contentType: "application/json", upsert: true });
  if (error) throw new Error(error.message);
}

/** Une figurine fabriquée : toujours ENTIÈRE désormais (`-entiere.png` : l'aperçu et le film la montrent telle quelle). */
export async function deposerImage(supabase: Supabase, siteId: string, png: Buffer): Promise<string> {
  await seauPret(supabase);
  const chemin = `${siteId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${SUFFIXE_ENTIERE}.png`;
  const { error } = await supabase.storage.from(SEAU_FIGURINES_PROS).upload(chemin, png, { contentType: "image/png", upsert: false });
  if (error) throw new Error(error.message);
  return chemin;
}

/** Une image de son dossier (sa figurine validée, pour l'habiller). */
export async function lireImage(supabase: Supabase, chemin: string): Promise<Buffer | null> {
  try {
    const { data } = await supabase.storage.from(SEAU_FIGURINES_PROS).download(chemin);
    return data ? Buffer.from(await data.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

const urlDe = (supabase: Supabase, chemin: string | undefined) => (chemin ? supabase.storage.from(SEAU_FIGURINES_PROS).getPublicUrl(chemin).data.publicUrl : null);

/** L'édition du moment (celle de `collection.ts`), et sa clé avec l'année de son début : « automne-2026 ». */
export function editionDuJour(maintenant = new Date()) {
  const { maintenant: e, ensuite } = editionsDuMoment(jourDe(maintenant));
  return { edition: e ? { ...e, cleAnnee: `${e.cle}-${e.debut.slice(0, 4)}` } : null, ensuite };
}

/** Les propositions d'un essai : `proposees`, ou la seule `proposee` d'avant. */
export function propositionsDe(e: { proposee?: Proposee | null; proposees?: Proposee[] | null }): Proposee[] {
  if (e.proposees?.length) return e.proposees;
  return e.proposee ? [e.proposee] : [];
}

/** Celle qu'il a choisie parmi les propositions (`choix` : son rang ; la première par défaut). */
export function propositionChoisie(e: { proposee?: Proposee | null; proposees?: Proposee[] | null }, choix: unknown): Proposee | null {
  const l = propositionsDe(e);
  const k = typeof choix === "number" && Number.isInteger(choix) && choix >= 0 && choix < l.length ? choix : 0;
  return l[k] ?? null;
}

export function etatPublic(supabase: Supabase, e: Etat, maintenant = new Date()): EtatFigurinePro {
  const faits = e.essais?.jour === jourDe(maintenant) ? e.essais.n : 0;
  const { edition, ensuite } = editionDuJour(maintenant);
  const sienne = edition ? e.editions?.[edition.cleAnnee] : undefined;
  const urls = (l: (Proposee | null | undefined)[]) => l.map((p) => urlDe(supabase, p?.chemin)).filter((u): u is string => Boolean(u));
  // LE MOTEUR DE CHACUNE, en clair : il nous dit lequel lui ressemble, lequel fait figurine
  const voiesDe = (l: Proposee[]) => l.filter((p) => urlDe(supabase, p.chemin)).map((p) => (/^gemini/i.test(p.modele) ? "Gemini" : "OpenAI"));
  return {
    validee: urlDe(supabase, e.validee?.chemin),
    proposee: urlDe(supabase, e.proposee?.chemin),
    proposees: urls(propositionsDe(e)),
    voies: voiesDe(propositionsDe(e)),
    essaisRestants: Math.max(0, essaisParJour() - faits),
    edition: edition
      ? {
          cle: edition.cleAnnee,
          nom: edition.nom,
          emoji: edition.emoji,
          jours: edition.jours,
          validee: urlDe(supabase, sienne?.validee?.chemin),
          proposee: urlDe(supabase, sienne?.proposee?.chemin),
          proposees: urls(sienne ? propositionsDe(sienne) : []),
          voies: voiesDe(sienne ? propositionsDe(sienne) : []),
        }
      : null,
    ensuite: ensuite ? { nom: ensuite.nom, emoji: ensuite.emoji, jours: ensuite.jours } : null,
    collection: piecesDe(e)
      .sort((a, b) => b.le.localeCompare(a.le))
      .map((p) => ({
        url: urlDe(supabase, p.chemin) ?? "",
        cle: p.cle,
        nom: p.nom,
        emoji: p.emoji,
        le: jourDe(new Date(p.le)),
        debut: p.debut ?? null,
        fin: p.fin ?? null,
        actuelle: p.chemin === e.validee?.chemin,
        dansLesFilms: p.chemin === (sienne?.validee?.chemin ?? e.validee?.chemin),
      }))
      .filter((f) => f.url),
  };
}

// ─── le détourage ───────────────────────────────────────────────────────────────────────────────

/**
 * RETIRER UN FOND UNI — le vert qu'on a demandé quand le moteur ne sait pas rendre de fond transparent.
 *
 * PAS UNE CLÉ DE COULEUR, UN REMPLISSAGE DEPUIS LES BORDS. Une clé de couleur retire tout ce qui ressemble au fond, où
 * que ce soit : sur une figurine au teint rosé ou en chemise bordeaux, elle ronge le visage (essayé : la moitié de la
 * figurine du chef est partie). Ici, on part des bords de l'image et l'on n'avance que de proche en proche, sur ce qui
 * ressemble au fond : ce qui est entouré par la figurine reste à elle. Puis on adoucit le bord (un pixel) et l'on
 * retire le reflet du fond sur ce bord.
 */
export async function detourerSurFondUni(img: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const px = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
  // la couleur du fond : la médiane des bords
  const bords: number[][] = [[], [], []];
  for (let x = 0; x < w; x += 2)
    for (const y of [0, 1, h - 2, h - 1]) for (let c = 0; c < 3; c++) bords[c].push(px[(y * w + x) * 4 + c]);
  for (let y = 0; y < h; y += 2)
    for (const x of [0, 1, w - 2, w - 1]) for (let c = 0; c < 3; c++) bords[c].push(px[(y * w + x) * 4 + c]);
  const fond = bords.map((l) => l.sort((a, b) => a - b)[Math.floor(l.length / 2)]);
  /* LA DISTANCE SE MESURE SUR LA TEINTE, PAS SUR LA LUMIÈRE. En rouge-vert-bleu, un magenta foncé est aussi près
     d'une chemise olive que d'un pli du fond (essayé : le remplissage a traversé la figurine). En chrominance (Cb, Cr),
     la peau, le noir, l'olive et le magenta sont loin les uns des autres, et une ombre sur le fond reste du fond : la
     lumière ne compte que pour un tiers. */
  const ycc = (r: number, g: number, b: number) => [0.299 * r + 0.587 * g + 0.114 * b, 128 - 0.1687 * r - 0.3313 * g + 0.5 * b, 128 + 0.5 * r - 0.4187 * g - 0.0813 * b];
  const [fy, fcb, fcr] = ycc(fond[0], fond[1], fond[2]);
  const dist = (i: number, y0: number, cb0: number, cr0: number) => {
    const [y, cb, cr] = ycc(px[i], px[i + 1], px[i + 2]);
    return Math.hypot(cb - cb0, cr - cr0, 0.35 * (y - y0));
  };
  const auFond = (i: number) => dist(i, fy, fcb, fcr);
  /* LES SEUILS SUIVENT LE FOND MESURÉ : un fond généré bien plat (un vert d'incrustation) n'a presque aucun écart, on
     peut serrer ; un fond photographié (un feutre, un dégradé) en a, on desserre juste ce qu'il faut. */
  const ecarts: number[] = [];
  for (let x = 0; x < w; x += 3) for (const y of [0, h - 1]) ecarts.push(auFond((y * w + x) * 4));
  for (let y = 0; y < h; y += 3) for (const x of [0, w - 1]) ecarts.push(auFond((y * w + x) * 4));
  ecarts.sort((a, b) => a - b);
  const p95 = ecarts[Math.floor(ecarts.length * 0.95)] ?? 0;
  const LOIN = Math.min(14, Math.max(6, p95 * 1.5)); // assez près du fond : c'est du fond
  const VOISIN = 3; // ou presque pareil que son voisin de fond (un dégradé, une ombre douce)…
  const PLAFOND = LOIN * 1.6; // …sans jamais s'en éloigner trop

  const estFond = new Uint8Array(w * h);
  const file = new Int32Array(w * h);
  let debut = 0;
  let fin = 0;
  const pousser = (k: number) => {
    estFond[k] = 1;
    file[fin++] = k;
  };
  for (let x = 0; x < w; x++)
    for (const y of [0, h - 1]) {
      const k = y * w + x;
      if (!estFond[k] && auFond(k * 4) < PLAFOND) pousser(k);
    }
  for (let y = 0; y < h; y++)
    for (const x of [0, w - 1]) {
      const k = y * w + x;
      if (!estFond[k] && auFond(k * 4) < PLAFOND) pousser(k);
    }
  while (debut < fin) {
    const k = file[debut++];
    const x = k % w;
    const y = (k - x) / w;
    const i = k * 4;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (estFond[n]) continue;
      const j = n * 4;
      const aFond = auFond(j);
      const [vy, vcb, vcr] = ycc(px[i], px[i + 1], px[i + 2]);
      const aVoisin = dist(j, vy, vcb, vcr);
      if (aFond < LOIN || (aVoisin < VOISIN && aFond < PLAFOND)) pousser(n);
    }
  }
  // le fond s'efface ; le bord de la figurine s'adoucit et perd le reflet du fond
  for (let k = 0; k < w * h; k++) {
    const i = k * 4;
    if (estFond[k]) {
      px[i + 3] = 0;
      continue;
    }
    const x = k % w;
    const y = (k - x) / w;
    const auBord = (x > 0 && estFond[k - 1]) || (x < w - 1 && estFond[k + 1]) || (y > 0 && estFond[k - w]) || (y < h - 1 && estFond[k + w]);
    if (!auBord) continue;
    const a = Math.min(1, Math.max(0.25, (auFond(i) - LOIN / 2) / (2 * LOIN)));
    px[i + 3] = Math.round(255 * a);
    // le reflet : on retire au pixel la part de fond qu'il porte
    const part = 1 - a;
    for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, Math.round((px[i + c] - part * fond[c]) / Math.max(0.25, a))));
  }
  return sharp(Buffer.from(px.buffer, px.byteOffset, px.length), { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

/** Un fond déjà transparent ? Les quatre coins le disent. */
async function dejaTransparente(img: Buffer): Promise<boolean> {
  const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const coins = [0, w - 1, (h - 1) * w, h * w - 1];
  return coins.every((k) => data[k * 4 + 3] < 16);
}

/** La figurine seule : rognée au plus près (un peu de marge), dans toute la définition rendue (1 536 pixels de haut au plus). */
export async function rogner(img: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) throw new Error("Image vide");
  const m = Math.round(0.02 * Math.max(x1 - x0, y1 - y0));
  const left = Math.max(0, x0 - m);
  const top = Math.max(0, y0 - m);
  const width = Math.min(w - left, x1 - x0 + 1 + 2 * m);
  // LE BAS AU RAS DES HANCHES : c'est sous ses vêtements que le ressort s'accroche
  const height = Math.min(h - top, y1 + 1 - top);
  return sharp(img).extract({ left, top, width, height }).resize({ height: 1536, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
}

// ─── la fabrication ─────────────────────────────────────────────────────────────────────────────

/** Ce que rend UNE demande au moteur. */
type Rendu = { png: Buffer; modele: string } | { erreur: string; statut: number };
/** Ce que rend une fabrication : une ou deux propositions (une par voie), au choix. */
export type Fabrication = { images: { png: Buffer; modele: string; voie: string }[]; traits?: Traits | null } | { erreur: string; statut: number };

const cleGemini = () => s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);

/**
 * DEUX PROPOSITIONS PAR ESSAI, par deux voies différentes, parties en même temps (le temps d'une seule) :
 *   · GEMINI d'abord, s'il a une clé : c'est avec lui que le propriétaire a fait sa figurine d'Halloween, celle qu'il
 *     montre en exemple ; il garde bien un visage d'une image à l'autre ;
 *   · OPENAI ensuite, en fidélité « high » (il colle au selfie) — ou, sans Gemini, OpenAI deux fois : « high » et « low »
 *     (il réinterprète). `FIGURINE_FIDELITES` règle les fidélités d'OpenAI (« high,low » par défaut).
 * Il choisit celle qui lui ressemble ; ses choix (le `modele` gardé avec sa figurine) diront quelle voie garder.
 */
function fidelites(): string[] {
  const l = (s(process.env.FIGURINE_FIDELITES) || s(process.env.FIGURINE_FIDELITE) || "high,low")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x === "high" || x === "low");
  const uniques = [...new Set(l)];
  return uniques.length ? uniques : ["high", "low"];
}

type Voie = { nom: "gemini" } | { nom: "openai"; fidelite: string };
function voies(): Voie[] {
  const f = fidelites();
  if (cleGemini() && s(process.env.FIGURINE_SANS_GEMINI) !== "1") return [{ nom: "gemini" }, { nom: "openai", fidelite: f[0] }];
  return f.slice(0, 2).map((fidelite) => ({ nom: "openai" as const, fidelite }));
}

/**
 * 🎨 UNE IMAGE DE RÉFÉRENCE DE STYLE, FACULTATIVE (`FIGURINE_REFERENCE_URL`) — le moyen le plus sûr d'obtenir LE rendu
 * voulu (la figurine d'Halloween du propriétaire) : elle part en seconde image avec chaque fabrication, et la consigne
 * dit qu'on n'en prend que le style, jamais le visage ni la tenue. Jamais dans le dépôt : une adresse, posée en
 * production par le propriétaire, pour une image qu'il a le droit d'envoyer aux moteurs (un visage dont la personne
 * est d'accord, ou une figurine sans vrai visage). Lue une fois, puis gardée en mémoire.
 */
let referenceEnMemoire: { url: string; png: Buffer | null } | null = null;
async function lireReference(): Promise<Buffer | null> {
  const url = s(process.env.FIGURINE_REFERENCE_URL);
  if (!/^https:\/\//.test(url)) return null;
  if (referenceEnMemoire?.url === url) return referenceEnMemoire.png;
  let png: Buffer | null = null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (r.ok) {
      const brut = Buffer.from(await r.arrayBuffer());
      if (brut.length <= 12 * 1024 * 1024)
        png = await sharp(brut).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).png().toBuffer();
    }
  } catch {
    png = null;
  }
  if (!png) console.error("[figurine] la référence de style ne s'ouvre pas :", url.slice(0, 120));
  referenceEnMemoire = { url, png };
  return png;
}

/** Ce que dit la consigne quand la référence part avec (avant le reste de la consigne). */
const AVEC_REFERENCE = [
  "You are given two images.",
  "IMAGE 1 is the subject: the figurine must be them — their face, features, hair, facial hair and expression (or, for an edition, this very figurine).",
  "IMAGE 2 is ONLY A STYLE REFERENCE: copy exactly its rendering style — the kind of object (a painted-resin bobblehead figurine on an exposed spring and a round wooden base), its proportions (the big head, the slim body), its materials and skin finish, its lighting and its photo style.",
  "NEVER copy anything else from image 2: not its face, not its hair, not its body shape, not its outfit, not its accessories, not its background, not its text.",
  "",
].join("\n");

async function propositions(o: { image: Buffer; consigne: (fond: "transparent" | "vert") => string; avant: number }): Promise<Fabrication> {
  const liste = voies();
  const reference = await lireReference();
  const avec = reference ? { ...o, reference, consigne: (fond: "transparent" | "vert") => AVEC_REFERENCE + o.consigne(fond) } : o;
  const rendus = await Promise.all(liste.map((v) => (v.nom === "gemini" ? genererParGemini(avec) : generer({ ...avec, fidelite: v.fidelite }))));
  const images = rendus.flatMap((r, k) => {
    if ("erreur" in r) {
      console.error("[figurine] une voie a échoué :", JSON.stringify({ voie: liste[k], erreur: r.erreur }));
      return [];
    }
    const v = liste[k];
    return [{ ...r, voie: v.nom === "gemini" ? "gemini" : `openai-${v.fidelite}` }];
  });
  if (images.length) return { images };
  return rendus.find((r) => "erreur" in r) as { erreur: string; statut: number };
}

/**
 * PAR GEMINI (le modèle d'image de Google) : il ne rend pas de fond transparent — on lui demande le vert d'incrustation,
 * retiré ici (`detourerSurFondUni`). Les modèles essayés dans l'ordre (`GEMINI_FIGURINE_MODEL` pour en imposer un) ; le
 * format portrait 2:3 demandé, et redemandé sans format si le modèle le refuse (comme les couvertures).
 */
async function genererParGemini(o: { image: Buffer; reference?: Buffer; consigne: (fond: "transparent" | "vert") => string; avant: number }): Promise<Rendu> {
  const cle = cleGemini();
  if (!cle) return { erreur: "Pas de clé Gemini.", statut: 503 };
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const impose = s(process.env.GEMINI_FIGURINE_MODEL);
  const modeles = impose ? [impose] : [s(process.env.GEMINI_IMAGE_MODEL), "gemini-3-pro-image-preview", "gemini-2.5-flash-image"].filter(Boolean);
  const image = (await sharp(o.image).flatten({ background: "#ffffff" }).png().toBuffer()).toString("base64");
  let derniere = "Gemini n'a pas répondu.";
  for (const modele of [...new Set(modeles)]) {
    for (const avecFormat of [true, false]) {
      const reste = o.avant - Date.now();
      if (reste < 20_000) return { erreur: "La fabrication a pris trop de temps. Réessayez dans un instant.", statut: 504 };
      let r: Response;
      try {
        r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": cle },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: "image/png", data: image } },
                  ...(o.reference ? [{ inlineData: { mimeType: "image/png", data: o.reference.toString("base64") } }] : []),
                  { text: o.consigne("vert") },
                ],
              },
            ],
            generationConfig: avecFormat ? { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "2:3" } } : { responseModalities: ["IMAGE", "TEXT"] },
          }),
          signal: AbortSignal.timeout(reste - 10_000),
        });
      } catch {
        return { erreur: "La fabrication a pris trop de temps. Réessayez dans un instant.", statut: 504 };
      }
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] } | null;
        const d = (j?.candidates?.[0]?.content?.parts ?? []).find((x) => x.inlineData?.data)?.inlineData?.data;
        if (!d) {
          derniere = "Gemini n'a pas rendu d'image.";
          break;
        }
        try {
          const png = await detourerSurFondUni(Buffer.from(d, "base64"));
          return { png: await rogner(png), modele };
        } catch {
          return { erreur: "L'image rendue n'a pas pu être préparée. Réessayez.", statut: 502 };
        }
      }
      derniere = `Gemini (${modele}) a répondu ${r.status} : ${(await r.text().catch(() => "")).slice(0, 160)}`;
      // 400 : peut-être le format ; on redemande sans. 404 : ce modèle n'existe pas ici, on passe au suivant.
      if (r.status !== 400) break;
    }
  }
  return { erreur: derniere, statut: 502 };
}

/**
 * 🔎 SES TRAITS, VUS SUR LE SELFIE (voir `QUESTION_TRAITS`) : le modèle de vision du dressing (`regarderImage`). Au plus
 * trente-cinq secondes : sans réponse, on fabrique quand même, sans eux.
 */
export async function decrireTraits(photo: Buffer): Promise<Traits | null> {
  try {
    const jpeg = await sharp(photo).resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    const vu = await Promise.race([
      regarderImage({ type: "image/jpeg", donnees: jpeg.toString("base64") }, QUESTION_TRAITS),
      new Promise<{ erreur: string }>((ok) => setTimeout(() => ok({ erreur: "trop long" }), 35_000)),
    ]);
    if ("erreur" in vu) {
      console.error("[figurine] traits non décrits :", String(vu.erreur).slice(0, 200));
      return null;
    }
    return traitsDe(vu);
  } catch {
    return null;
  }
}

/**
 * DU SELFIE À LA FIGURINE. `avant` : l'heure limite (la fonction a cinq minutes ; on abandonne avant, avec une
 * raison, plutôt qu'un 504 muet).
 */
export async function fabriquerFigurine(o: { selfie: Buffer; famille: FamilleDouble; avant: number }): Promise<Fabrication> {
  let photo: Buffer;
  try {
    // LE SENS DE LA PHOTO : celui du téléphone (EXIF), puis 1 024 pixels au plus
    photo = await sharp(o.selfie).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    return { erreur: "Ce selfie ne s'ouvre pas. Reprenez-le, ou choisissez une photo JPEG.", statut: 400 };
  }
  const traits = await decrireTraits(photo);
  const f = await propositions({ image: photo, consigne: (fond) => consigneFigurine(o.famille, fond, traits), avant: o.avant });
  return "erreur" in f ? f : { ...f, traits };
}

/** 🍂 SA FIGURINE DU MOIS : sa figurine validée, habillée pour l'édition (le visage ne change pas). */
export async function habillerFigurine(o: {
  buste: Buffer;
  cleEdition: string;
  nomEdition: string;
  /** Ses traits, gardés avec sa figurine validée (absents pour celles d'avant). */
  traits?: Traits | null;
  avant: number;
}): Promise<Fabrication> {
  let image: Buffer;
  try {
    // SUR UN FOND BLANC UNI : le moteur voit la figurine comme une photo de studio, pas un découpage
    image = await sharp(o.buste).flatten({ background: "#ffffff" }).resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    return { erreur: "Ta figurine ne s'ouvre pas. Refais-la à partir d'un selfie.", statut: 400 };
  }
  return propositions({ image, consigne: (fond) => consigneEdition(o.cleEdition, o.nomEdition, fond, o.traits), avant: o.avant });
}

/** UNE IMAGE DEMANDÉE AU MOTEUR, à partir d'une image : les replis de moteur et de réglages, puis la figurine seule. */
async function generer(o: { image: Buffer; reference?: Buffer; consigne: (fond: "transparent" | "vert") => string; avant: number; fidelite: string }): Promise<Rendu> {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return { erreur: "La fabrication des figurines n'est pas encore branchée ici (moteur d'image absent).", statut: 503 };
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  const photo = o.image;
  const { liste } = await moteursDImage(cle, base);
  let derniere = "Le moteur d'image n'a pas répondu.";
  for (let m = 0; m < liste.length; m++) {
    const modele = liste[m];
    const reglages: Record<string, string> = {
      size: "1024x1536",
      quality: s(process.env.FIGURINE_QUALITE) || "high",
      // LA FIDÉLITÉ : en « high », le moteur RECOPIE l'image d'entrée (le visage du selfie collé tel quel, l'ancienne
      // tenue gardée sous le déguisement) ; en « low », il la réinterprète (la figurine, mais un visage qui s'éloigne).
      // Une proposition de chaque (`propositions`).
      input_fidelity: o.fidelite,
      background: "transparent",
      output_format: "png",
    };
    for (let essai = 0; essai < 4; essai++) {
      const fond = reglages.background === "transparent" ? "transparent" : "vert";
      const forme = new FormData();
      forme.append("model", modele);
      forme.append("prompt", o.consigne(fond));
      forme.append("n", "1");
      for (const [k, v] of Object.entries(reglages)) forme.append(k, v);
      forme.append("image[]", new File([new Uint8Array(photo)], "image.png", { type: "image/png" }));
      if (o.reference) forme.append("image[]", new File([new Uint8Array(o.reference)], "reference.png", { type: "image/png" }));
      const reste = o.avant - Date.now();
      if (reste < 20_000) return { erreur: "La fabrication a pris trop de temps. Réessayez dans un instant.", statut: 504 };
      let r: Response;
      try {
        r = await fetch(`${base}/v1/images/edits`, { method: "POST", headers: { authorization: `Bearer ${cle}` }, body: forme, signal: AbortSignal.timeout(reste - 10_000) });
      } catch {
        return { erreur: "La fabrication a pris trop de temps. Réessayez dans un instant.", statut: 504 };
      }
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as { data?: { b64_json?: string }[] } | null;
        const b64 = j?.data?.[0]?.b64_json;
        if (!b64) return { erreur: "Le moteur d'image n'a pas rendu d'image.", statut: 502 };
        try {
          let png: Buffer = Buffer.from(b64, "base64");
          if (!(await dejaTransparente(png))) png = await detourerSurFondUni(png);
          return { png: await rogner(png), modele };
        } catch {
          return { erreur: "L'image rendue n'a pas pu être préparée. Réessayez.", statut: 502 };
        }
      }
      const txt = await r.text().catch(() => "");
      derniere = `Le moteur d'image a répondu ${r.status}.`;
      if (r.status === 400) {
        // UN RÉGLAGE INCONNU DE CE MOTEUR : on le retire et on rejoue (sans fond transparent → fond vert, détouré ici)
        const inconnus = Object.keys(reglages).filter((k) =>
          new RegExp(`(unknown|unsupported|unrecognized|not supported|invalid)[^.]{0,60}${k}|${k}[^.]{0,60}(unknown|unsupported|not supported|invalid)`, "i").test(txt),
        );
        if (inconnus.length) {
          for (const k of inconnus) delete reglages[k];
          continue;
        }
        if (/safety|rejected|moderation/i.test(txt))
          return { erreur: "Le moteur d'image a refusé cette photo. Essayez un autre selfie : de face, bien éclairé, vous seul.", statut: 422 };
      }
      if (m < liste.length - 1 && moteurRefuse(r.status, txt)) {
        noterRefus(modele);
        break;
      }
      console.error("[figurine] refus du moteur", JSON.stringify({ modele, statut: r.status, pourquoi: txt.slice(0, 300) }));
      return { erreur: derniere, statut: 502 };
    }
  }
  return { erreur: derniere, statut: 502 };
}
