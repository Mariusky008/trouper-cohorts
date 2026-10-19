/**
 * 🎬 LE MONTAGE DE L'INTERVIEW — fait par le téléphone, sans serveur.
 *
 * « Est-ce que le mode "en interview" a bien été pensé pour que le résultat
 * soit à la hauteur de ce que tu viens de réaliser ? » — « Oui, faisons
 * cela. » Le montage n'est plus l'ardoise à la craie : c'est l'émission FACE
 * AU FANTÔME, celle des épisodes de Jean-Marie et de Lou. Le clic et son nom
 * en géant ; une carte par question, que le reporter pose avec sa voix ; ses
 * réponses en plein écran, dans le cadre rose, avec ses mots qui s'allument un
 * à un ; les réponses courtes qui frappent ; le coup de zoom sur son plat ; la
 * carte de fin avec le prix et le bouton ; une musique, et la même petite
 * mélodie à chaque fin. Le dessin et les sons sont dans
 * `interview-signature.ts` ; ici, le plan, le son calé sur l'image et
 * l'enregistrement.
 *
 * ET PENDANT QU'IL RÉPOND, CE QU'IL MONTRE, au rythme de ses mots : son
 * visage, puis ses photos (trois au plus par question), une nouvelle image à
 * chaque phrase, et la photo de son produit juste avant qu'il le nomme (voir
 * `plansDeCoupe`) ; sur une photo, son visage reste dans un médaillon. S'il a
 * choisi de ne pas se montrer, c'est son fantôme qui parle, avec sa voix.
 * Le restaurant garde sa cloche, après le titre.
 *
 * ─── POURQUOI DANS LE TÉLÉPHONE ──────────────────────────────────────────
 *
 * Monter une vidéo sur un serveur demande une machine qui tourne plusieurs
 * minutes — ce n'est pas ce que sait faire l'hébergement du site. Le
 * téléphone, lui, sait dessiner une image trente fois par seconde et
 * l'enregistrer avec son son. Le montage se « joue » donc une fois, sous les
 * yeux du commerçant, et c'est cet enregistrement qui devient la vidéo : une
 * minute de montage pour une minute de vidéo, et rien à attendre ailleurs.
 *
 * ─── LE SON DE SA RÉPONSE VIENT DU FICHIER, PAS DU LECTEUR ───────────────
 *
 * Sur iPhone, un lecteur vidéo ne joue un son qu'après un toucher de l'écran,
 * et le montage démarre tout seul. Les prises sont donc jouées MUETTES pour
 * l'image, et leur son est décodé à part puis calé sur l'image au moment où
 * elle démarre vraiment. Si ce décodage échoue, on retombe sur le son du
 * lecteur, et l'écran d'essai dit lequel a servi.
 *
 * FICHIER NAVIGATEUR.
 */
import {
  CLOCHE,
  DEBIT_SON,
  SCRIPTS,
  REPLIQUES,
  carteDeQuestion,
  debitDuMontage,
  enDeuxLignes,
  enFrappes,
  enteteArdoise,
  frappesDesMots,
  morceauxDeMots,
  motsDesSousTitres,
  motsForts,
  plansDeCoupe,
  repliquesDuLieu,
  type Cote,
  type Mode,
  type ScriptInterview,
  type SousTitre,
} from "@/lib/direct/interview-fantome";
import {
  HAUTEUR,
  LARGEUR,
  bruitBlanc,
  couvrirImage,
  dessinerCadre,
  dessinerCarte,
  dessinerFin,
  dessinerFrappe,
  dessinerGrain,
  dessinerSousTitres,
  dessinerTitre,
  douce,
  eclairDuClic,
  fabriquerFondCarte,
  fabriquerGrain,
  fabriquerMusique,
  fabriquerVignette,
  flouter,
  fuite,
  rebond,
  reverbe,
  secousse,
  sonCarte,
  sonClic,
  sonFrappe,
  sonSignature,
  sonSortieCarte,
  sonTampon,
  sonTic,
  sonZoom,
  sortie,
  type Fin,
  type Polices,
  type SortieSon,
  type Titre,
} from "@/lib/direct/interview-signature";
import { BRODERIE, arcsDuNom, lignesDuNom, type Pt } from "@/lib/direct/fantome-assis";
import { fichierEnregistre } from "@/lib/direct/voix-fantome";

export { LARGEUR, HAUTEUR };
const IPS = 30;
const DOSSIER = "/direct/interview";

/** Le rose de ClikMe, celui du « ? » de la cloche. */
const ROSE = "#FF2E9A";

/* ═══ LES FORMATS QUE LE TÉLÉPHONE SAIT ÉCRIRE ═════════════════════════════
 *
 * Le MP4 d'abord : c'est ce que WhatsApp et Instagram acceptent sans
 * discuter. L'iPhone l'écrit ; les Chrome récents aussi. Les autres écrivent
 * du WebM, que l'écran d'essai signale — il faudra le convertir avant de le
 * publier ailleurs que sur ClikMe.
 */
const FORMATS = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export function formatVideo(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const f of FORMATS) {
    try {
      if (MediaRecorder.isTypeSupported(f)) return f;
    } catch {
      /* navigateur ancien : on laisse le défaut */
    }
  }
  return "";
}

/** Le chef qui ne se montre pas n'enregistre que sa voix. */
const FORMATS_AUDIO = ["audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

export function formatAudio(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const f of FORMATS_AUDIO) {
    try {
      if (MediaRecorder.isTypeSupported(f)) return f;
    } catch {
      /* navigateur ancien : on laisse le défaut */
    }
  }
  return "";
}

/* ═══ LES ÉLÉMENTS ═════════════════════════════════════════════════════════ */

export type Elements = {
  /** Le reporter de ClikMe, bouche fermée → grande ouverte. */
  reporter: HTMLImageElement[];
  /** Le fantôme du chef — à sa place quand il ne veut pas se montrer. */
  chef: HTMLImageElement[];
  logo: HTMLImageElement;
  /** SA VOIX, phrase par phrase, retrouvée par son texte — une phrase absente s'écrit au lieu de se dire. */
  voix: Record<string, AudioBuffer>;
  /** L'ouverture de la bouche, trente valeurs par seconde de phrase. */
  bouche: Record<string, Float32Array>;
  /** Ce qui a parlé pour le reporter : combien de phrases enregistrées, dites par le serveur, ou écrites. */
  sourceVoix: string;
  /** Les phrases qu'il n'a pas pu dire (pas enregistrées, et le serveur n'a pas encore sa voix). */
  voixManquantes: string[];
  /** La cloche du restaurant : le souffle quand elle se soulève, les clochettes. */
  sons: { cloches: AudioBuffer; souffle: AudioBuffer };
  /** La musique de l'émission, fabriquée note par note (voir `fabriquerMusique`) — `null` si ce téléphone n'a pas su. */
  musique: AudioBuffer | null;
  /** `bulle` : le texte (Poppins) ; `enseigne` : Playfair ; `affiche` : Anton. */
  police: { bulle: string; enseigne: string; affiche: string };
};

/**
 * Changer un texte, ou la voix (`INTERVIEW_VOIX_ID`) → changer ce numéro, sinon
 * le cache resservirait l'ancienne synthèse.
 */
export const VERSION_VOIX = "3";

function image(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const i = new Image();
    // UNE PHOTO D'AILLEURS (son stockage en ligne) SE DEMANDE « SANS COOKIES » : sans
    // cette permission, elle salirait le dessin et la vidéo ne pourrait plus s'enregistrer.
    if (/^https?:/i.test(src) && !src.startsWith(window.location.origin)) i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => ko(new Error(`Image introuvable : ${src}`));
    i.src = src;
  });
}

async function son(ctx: BaseAudioContext, src: string): Promise<AudioBuffer> {
  const r = await fetch(src);
  if (!r.ok) throw new Error(`Son introuvable : ${src}`);
  return ctx.decodeAudioData(await r.arrayBuffer());
}

/** L'énergie d'un son, par pas de `pas` secondes (première piste). */
export function energie(buf: AudioBuffer, pas: number): Float32Array {
  const d = buf.getChannelData(0);
  const n = Math.max(1, Math.round(buf.sampleRate * pas));
  const out = new Float32Array(Math.ceil(d.length / n));
  for (let k = 0; k < out.length; k++) {
    const a = k * n;
    const b = Math.min(d.length, a + n);
    let s = 0;
    for (let i = a; i < b; i++) s += d[i] * d[i];
    out[k] = Math.sqrt(s / Math.max(1, b - a));
  }
  return out;
}

/**
 * LA BOUCHE SUIT LA VOIX : l'énergie, ramenée entre 0 et 1, lissée sur trois
 * images. `depuis` ignore le début (pour la réponse du chef : le micro y a
 * entendu le reporter dans le haut-parleur, et son fantôme ne doit pas parler
 * à sa place).
 */
export function ouvertures(buf: AudioBuffer, depuis = 0): Float32Array {
  const e = energie(buf, 1 / IPS);
  const k0 = Math.min(e.length, Math.max(0, Math.floor(depuis * IPS)));
  const tri = Array.from(e.subarray(k0)).filter((v) => v > 0).sort((a, b) => a - b);
  const ref = tri[Math.floor(tri.length * 0.92)] || 1;
  const o = new Float32Array(e.length);
  for (let k = k0; k < e.length; k++) {
    const m = ((e[k - 1] ?? e[k]) + e[k] + (e[k + 1] ?? e[k])) / 3;
    o[k] = Math.min(1, m / ref);
  }
  return o;
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * LA VOIX DU FANTÔME, PHRASE PAR PHRASE.
 *
 * D'abord ses enregistrements (`voix-fantome.ts`) ; une phrase qu'il n'a pas
 * enregistrée est demandée au serveur, qui la dit avec la même voix — quand
 * il en a l'identifiant. Sinon, elle n'a pas de son : l'écran et la carte
 * l'écrivent. Au premier « pas encore réglée » (503), on n'insiste plus.
 * Deux demandes à la fois seulement — un compte ElevenLabs modeste en refuse
 * davantage.
 */
async function chargerVoix(
  ctx: BaseAudioContext,
  textes: readonly string[],
  metier: string,
): Promise<{ voix: Record<string, AudioBuffer>; source: string; manquantes: string[] }> {
  const voix: Record<string, AudioBuffer> = {};
  const manquantes: string[] = [];
  let enregistrees = 0;
  let parLeServeur = 0;
  let serveurSansVoix = false;
  const une = async (texte: string): Promise<"enregistree" | "serveur" | null> => {
    const f = fichierEnregistre(texte);
    if (f) {
      try {
        voix[texte] = await son(ctx, f);
        return "enregistree";
      } catch {
        /* un fichier qui ne se lit pas : on demande au serveur */
      }
    }
    if (serveurSansVoix) return null;
    const stop = new AbortController();
    const minuterie = setTimeout(() => stop.abort(), 25_000);
    try {
      const r = await fetch(`/api/direct/interview/voix?m=${encodeURIComponent(metier)}&t=${encodeURIComponent(texte)}&v=${VERSION_VOIX}`, { signal: stop.signal });
      if (r.ok) {
        voix[texte] = await ctx.decodeAudioData(await r.arrayBuffer());
        return "serveur";
      }
      if (r.status === 503) serveurSansVoix = true;
    } catch {
      /* réseau : cette phrase s'écrira */
    } finally {
      clearTimeout(minuterie);
    }
    return null;
  };
  const file = [...new Set(textes.filter((t) => t.trim()))];
  await Promise.all(
    [0, 1].map(async () => {
      while (file.length) {
        const t = file.shift()!;
        const d = await une(t);
        if (d === "enregistree") enregistrees += 1;
        else if (d === "serveur") parLeServeur += 1;
        else manquantes.push(t);
      }
    }),
  );
  const source = `voix du fantôme : ${enregistrees} enregistrée${enregistrees > 1 ? "s" : ""}, ${parLeServeur} par le serveur, ${manquantes.length} écrite${manquantes.length > 1 ? "s" : ""}`;
  return { voix, source, manquantes };
}

/**
 * LES POLICES DE L'ÉMISSION SONT CELLES DE L'APPLICATION : Poppins pour le
 * texte, Playfair pour l'enseigne, Anton pour l'affiche. `next/font` leur
 * donne un nom à lui, qu'on lit sur un élément plutôt que de le deviner.
 */
async function polices(): Promise<Elements["police"]> {
  // LA CRAIE N'EST PLUS DANS LE MONTAGE, mais l'écran du direct en mode fantôme écrit
  // encore son plat sur l'ardoise (`.ei-ardoise-fond`) : sa police se charge toujours ici.
  if (typeof FontFace !== "undefined") {
    for (const [poids, fichier] of [["400", "kalam-400"], ["700", "kalam-700"]] as const) {
      try {
        const f = new FontFace("Craie ClikMe", `url(${DOSSIER}/${fichier}.woff2) format("woff2")`, { weight: poids });
        await f.load();
        document.fonts.add(f);
      } catch {
        /* la craie retombera sur une écriture manuscrite du système */
      }
    }
  }
  const lire = (variable: string, repli: string) => {
    const sonde = document.createElement("span");
    sonde.style.fontFamily = `var(${variable}), ${repli}`;
    sonde.textContent = "a";
    document.body.appendChild(sonde);
    const f = getComputedStyle(sonde).fontFamily || repli;
    sonde.remove();
    return f;
  };
  const bulle = lire("--font-clikme", "Poppins, system-ui, sans-serif");
  const enseigne = lire("--font-enseigne", "Georgia, serif");
  const affiche = lire("--font-affiche", "Impact, 'Arial Narrow', sans-serif");
  try {
    await Promise.all([
      document.fonts.load(`600 27px ${bulle}`),
      document.fonts.load(`800 60px ${bulle}`),
      document.fonts.load(`900 60px ${bulle}`),
      document.fonts.load(`italic 600 30px ${enseigne}`),
      document.fonts.load(`200px ${affiche}`),
    ]);
  } catch {
    /* repli sur la police du système */
  }
  return { bulle, enseigne, affiche };
}

/**
 * LES IMAGES DE SON FANTÔME, bouche fermée → grande ouverte, même cadre. Par
 * défaut, le chef du Bordeaux ; au comptoir, le fantôme de son métier (ses
 * poses « repos », « parle-1 », « parle-2 »).
 */
export const CHEF_DU_BORDEAUX = [0, 1, 2, 3].map((k) => `${DOSSIER}/chef-${k}.webp`);
export const chefEnPied = (dossier: string) => ["repos", "parle-1", "parle-2", "parle-2"].map((p) => `${dossier}${p}.webp`);

/**
 * `textes` : LES PHRASES DE SON INTERVIEW, et elles seules — où se placer, les
 * questions du jour, le merci, l'au revoir. `metier` : pour que le serveur
 * vérifie que ce sont bien les textes validés de son métier.
 */
export async function chargerElements(
  ctx: BaseAudioContext,
  imagesDuChef: string[] = CHEF_DU_BORDEAUX,
  textes: readonly string[] = [],
  metier = "table",
): Promise<Elements> {
  const quatre = (nom: string) => Promise.all([0, 1, 2, 3].map((k) => image(`${DOSSIER}/${nom}-${k}.webp`)));
  const [reporter, chef, logo, voix, cloches, souffle, police, musique] = await Promise.all([
    quatre("reporter"),
    Promise.all(imagesDuChef.map(image)),
    image("/clikme-logo-blanc.png"),
    chargerVoix(ctx, textes, metier),
    son(ctx, `${DOSSIER}/cloches.mp3`),
    son(ctx, `${DOSSIER}/souffle.mp3`),
    polices(),
    // LA MUSIQUE : seize secondes rendues hors du temps — sans elle, la vidéo se fait quand même
    fabriquerMusique(ctx.sampleRate).catch(() => null),
  ]);
  const bouche: Record<string, Float32Array> = {};
  for (const [t, b] of Object.entries(voix.voix)) bouche[t] = ouvertures(b);
  return {
    reporter,
    chef,
    logo,
    voix: voix.voix,
    bouche,
    sourceVoix: voix.source,
    voixManquantes: voix.manquantes,
    sons: { cloches, souffle },
    musique,
    police,
  };
}

/* ═══ LES OUTILS DE DESSIN ═════════════════════════════════════════════════ */

const borne = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** Départ et arrivée en douceur. */
const doux = (x: number) => {
  const t = borne(x);
  return t * t * (3 - 2 * t);
};
/** 0 avant `debut`, 1 après `debut + duree`, en douceur entre les deux. */
const entree = (t: number, debut: number, duree: number) => doux((t - debut) / duree);

function toile(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function couperLignes(c2d: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const lignes: string[] = [];
  for (const seg of texte.split("|")) {
    let cur = "";
    for (const m of seg.split(" ").filter(Boolean)) {
      const essai = cur ? `${cur} ${m}` : m;
      if (cur && c2d.measureText(essai).width > largeur) {
        lignes.push(cur);
        cur = m;
      } else cur = essai;
    }
    if (cur) lignes.push(cur);
  }
  return lignes;
}

function cheminArrondi(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ─── le fantôme ─── */
export type Place = { cx: number; bas: number; h: number };
export function dessinerFantome(
  c2d: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  p: Place,
  t: number,
  ouverture: number,
  angle = 0,
  alpha = 1,
) {
  if (alpha <= 0) return;
  const img = images[Math.min(3, Math.round(borne(ouverture) * 3))];
  const souffle = Math.sin(t * 2 * Math.PI * 1.05);
  const sx = 1 - 0.02 * ouverture + 0.012 * souffle;
  const sy = 1 + 0.03 * ouverture - 0.012 * souffle;
  const h = p.h * sy;
  const w = p.h * (img.width / img.height) * sx;
  const flotte = (p.h / 600) * 11 * Math.sin(t * 2 * Math.PI * 0.55);
  // son ombre au sol, qui ne flotte pas : un disque flou, écrasé
  c2d.save();
  c2d.translate(p.cx, p.bas - 6);
  c2d.scale(1, 0.18);
  const r = w * 0.32;
  const om = c2d.createRadialGradient(0, 0, 0, 0, 0, r);
  om.addColorStop(0, `rgba(0,0,0,${0.32 * alpha})`);
  om.addColorStop(1, "rgba(0,0,0,0)");
  c2d.fillStyle = om;
  c2d.fillRect(-r, -r, 2 * r, 2 * r);
  c2d.restore();
  c2d.save();
  c2d.globalAlpha = alpha;
  c2d.translate(p.cx, p.bas + flotte);
  if (angle) c2d.rotate((angle * Math.PI) / 180);
  c2d.drawImage(img, -w / 2, -h, w, h);
  c2d.restore();
}

/**
 * UNE IMAGE (le chef filmé, sa photo, sa vidéo) RECADRÉE POUR REMPLIR UN
 * RECTANGLE sans la déformer, un peu au-dessus du milieu — c'est là que sont
 * les visages, debout derrière un comptoir. `zoom` > 1 resserre (le lent
 * travelling sur une photo).
 */
function couvrir(
  c2d: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom = 1,
  focus = 0.38,
) {
  if (!sw || !sh) {
    c2d.fillStyle = "#14110F";
    c2d.fillRect(x, y, w, h);
    return;
  }
  const s = Math.max(w / sw, h / sh) * zoom;
  const cw = w / s;
  const ch = h / s;
  c2d.drawImage(src, (sw - cw) / 2, (sh - ch) * focus, cw, ch, x, y, w, h);
}

const tailleDe = (m: HTMLVideoElement | HTMLImageElement): [number, number] =>
  m instanceof HTMLVideoElement ? [m.videoWidth, m.videoHeight] : [m.naturalWidth, m.naturalHeight];

/** Son visage dans un médaillon, pendant que sa photo ou sa vidéo passe en grand. */
function medaillon(c2d: CanvasRenderingContext2D, v: HTMLVideoElement, cx: number, cy: number, r: number, alpha: number) {
  if (alpha <= 0) return;
  c2d.save();
  c2d.globalAlpha = alpha;
  c2d.shadowColor = "rgba(0,0,0,.45)";
  c2d.shadowBlur = 18;
  c2d.beginPath();
  c2d.arc(cx, cy, r + 6, 0, Math.PI * 2);
  c2d.fillStyle = "#fff";
  c2d.fill();
  c2d.shadowColor = "transparent";
  c2d.beginPath();
  c2d.arc(cx, cy, r, 0, Math.PI * 2);
  c2d.clip();
  const [vw, vh] = tailleDe(v);
  couvrir(c2d, v, vw, vh, cx - r, cy - r, 2 * r, 2 * r, 1.05, 0.32);
  c2d.restore();
}

function noir(c2d: CanvasRenderingContext2D, a: number) {
  if (a <= 0) return;
  c2d.save();
  c2d.globalAlpha = borne(a);
  c2d.fillStyle = "#000";
  c2d.fillRect(0, 0, LARGEUR, HAUTEUR);
  c2d.restore();
}

/* ═══ LA CLOCHE DU RESTAURANT ══════════════════════════════════════════════
 *
 * L'étape 1 de l'expérience (`boutique/experience-table.tsx`), rejouée dans la
 * vidéo : les mêmes images, aux mêmes places — en fractions du cadre, qui a la
 * proportion de la salle (9 × 16, comme la vidéo) —, et le même mouvement de
 * la cloche. Seule différence : personne ne la touche, elle se soulève toute
 * seule, et le plat apparaît dessous.
 */
const RESTAURANT = {
  salle: "/direct/table/restaurant/salle.webp",
  cloche: "/direct/table/restaurant/cloche-cuivre.webp",
  assis: "/direct/double/assis/montre.webp",
};
/** Un pixel CSS de l'expérience vue sur un téléphone de 390 px de large, en pixels de la vidéo. */
const PX = LARGEUR / 390;
/** La place laissée autour de la cloche pour son ombre. */
const MARGE_OMBRE = 80;
const TITRE_CLOCHE = { texte: "Qu’est-ce que le chef te prépare aujourd’hui", fin: " ?", haut: 124 * (HAUTEUR / 844) };

/** Tout ce qui ne bouge pas, dessiné une fois : sur un téléphone, une ombre floue par image coûte cher. */
type DecorCloche = {
  /** Étape 1 : la salle, son voile, le fantôme assis et son nom brodé, le pied de page. */
  fond: HTMLCanvasElement;
  /** La cloche et son ombre (MARGE_OMBRE tout autour). */
  cloche: HTMLCanvasElement;
  titre: { toile: HTMLCanvasElement; marge: number };
  fleche: HTMLCanvasElement;
  /** Étape 2 : la même salle, remontée d'un quart et assombrie, sous son voile. */
  fond2: HTMLCanvasElement;
  /** Le plat en pleine largeur, fondu en haut et en bas — ou sa scène, l'assiette et son fantôme. */
  plat: { toile: HTMLCanvasElement; y: number };
  /** « ♥ Le coup de cœur du chef ». */
  badge: HTMLCanvasElement;
  /** Le trait, le nom du plat et son prix. */
  carte: HTMLCanvasElement;
  /** Le bas de la cloche (milieu) et sa taille. */
  g: { cx: number; bas: number; w: number; h: number };
};

/** `cubic-bezier()` du CSS, pour rejouer les mêmes mouvements. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const f = (u: number, a: number, b: number) => 3 * (1 - u) * (1 - u) * u * a + 3 * (1 - u) * u * u * b + u * u * u;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let bas = 0;
    let haut = 1;
    let u = x;
    for (let i = 0; i < 22; i++) {
      u = (bas + haut) / 2;
      if (f(u, x1, x2) < x) bas = u;
      else haut = u;
    }
    return f(u, y1, y2);
  };
}
/** `xrSouleve` : cubic-bezier(.3,.1,.3,1). */
const SOULEVE = bezier(0.3, 0.1, 0.3, 1);
const SORTIE = bezier(0, 0, 0.58, 1);
const EASE = bezier(0.25, 0.1, 0.25, 1);

/** Les lignes d'un titre, équilibrées comme `text-wrap: balance`. */
function lignesEquilibrees(c2d: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const coupe = (l: number) => couperLignes(c2d, texte, l);
  const n = coupe(largeur).length;
  let bas = largeur / Math.max(1, n);
  let haut = largeur;
  for (let i = 0; i < 14; i++) {
    const m = (bas + haut) / 2;
    if (coupe(m).length > n) bas = m;
    else haut = m;
  }
  return coupe(haut);
}

/** Un point d'une courbe de Bézier quadratique, et sa direction. */
function surCourbe(arc: readonly Pt[], t: number) {
  const [p0, p1, p2] = arc;
  const u = 1 - t;
  return {
    x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    a: Math.atan2(2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]), 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])),
  };
}
function longueursArc(arc: readonly Pt[], n = 80): number[] {
  const cum = [0];
  let avant = surCourbe(arc, 0);
  for (let i = 1; i <= n; i++) {
    const q = surCourbe(arc, i / n);
    cum.push(cum[i - 1] + Math.hypot(q.x - avant.x, q.y - avant.y));
    avant = q;
  }
  return cum;
}

/** LE TEXTE POSÉ LETTRE À LETTRE SUR LA COURBE, centré — le `textPath` de l'expérience, à la main. */
function texteSurCourbe(c2d: CanvasRenderingContext2D, texte: string, arc: readonly Pt[], peindre: (ch: string, x: number) => void) {
  const cum = longueursArc(arc);
  const L = cum[cum.length - 1];
  const lettres = [...texte];
  const largeurs = lettres.map((ch) => c2d.measureText(ch).width);
  let s = (L - largeurs.reduce((a, b) => a + b, 0)) / 2;
  lettres.forEach((ch, i) => {
    const mi = s + largeurs[i] / 2;
    let j = 1;
    while (j < cum.length - 1 && cum[j] < mi) j++;
    const t = (j - 1 + (mi - cum[j - 1]) / Math.max(1e-6, cum[j] - cum[j - 1])) / (cum.length - 1);
    const p = surCourbe(arc, borne(t));
    c2d.save();
    c2d.translate(p.x, p.y);
    c2d.rotate(p.a);
    peindre(ch, -largeurs[i] / 2);
    c2d.restore();
    s += largeurs[i];
  });
}

/**
 * SON NOM BRODÉ SUR LA CASQUETTE ET LE TABLIER, par-dessus l'image posée en
 * `x, y, w, h` — les arcs, la taille et le fil crème de l'expérience.
 */
function broderie(c2d: CanvasRenderingContext2D, nom: string, x: number, y: number, w: number, h: number, police: string) {
  const b = BRODERIE.montre;
  const lignes = lignesDuNom(nom);
  const arcs = arcsDuNom(b.arc, lignes.length).map((arc) => arc.map(([u, v]) => [x + u * w, y + v * h] as Pt));
  let taille = (lignes.length === 1 ? 0.074 : 0.05) * h;
  c2d.font = `italic 400 ${taille}px ${police}`;
  lignes.forEach((l, i) => {
    const place = longueursArc(arcs[i]).pop()! * 0.98;
    const long = c2d.measureText(l).width;
    if (long > place) taille = Math.min(taille, (taille * place) / long);
  });
  const fil = c2d.createLinearGradient(x + 0.3 * w, y, x + 0.75 * w, y + 0.06 * h);
  fil.addColorStop(0, "#F7EEDF");
  fil.addColorStop(0.55, "#EADCC5");
  fil.addColorStop(1, "#BFAE93");
  const brode = (dessiner: (peindre: (ch: string, x0: number) => void) => void, t: number, couleur: string | CanvasGradient) => {
    c2d.save();
    c2d.font = `italic 400 ${t}px ${police}`;
    c2d.textBaseline = "alphabetic";
    c2d.shadowColor = "rgba(0,0,0,.55)";
    c2d.shadowBlur = Math.max(1, h / 1010);
    c2d.shadowOffsetY = (1.6 * h) / 1010;
    c2d.lineWidth = t * 0.07;
    c2d.strokeStyle = "rgba(30,18,10,.55)";
    c2d.fillStyle = couleur;
    // LE CONTOUR D'ABORD, PUIS LE FIL : « paint-order: stroke » de l'expérience
    dessiner((ch, x0) => c2d.strokeText(ch, x0, 0));
    c2d.shadowColor = "transparent";
    dessiner((ch, x0) => c2d.fillText(ch, x0, 0));
    c2d.restore();
  };
  lignes.forEach((l, i) => brode((peindre) => texteSurCourbe(c2d, l, arcs[i], peindre), taille, fil));
  // le plastron du tablier
  const [tx, ty, tl, tr] = b.tablier;
  let f = 0.044 * h;
  c2d.font = `italic 400 ${f}px ${police}`;
  const long = c2d.measureText(nom).width;
  if (long > tl * w) f = (f * tl * w) / long;
  c2d.save();
  c2d.translate(x + tx * w, y + ty * h);
  c2d.rotate((tr * Math.PI) / 180);
  c2d.font = `italic 400 ${f}px ${police}`;
  const lt = c2d.measureText(nom).width;
  brode((peindre) => peindre(nom, -lt / 2), f, "#E6D7C0");
  c2d.restore();
}

/**
 * LE PLAT DE L'ÉTAPE 2, EN PLEINE LARGEUR — `.xr-plat-photo` de l'expérience.
 * « Le plat est entouré de flou au lieu d'être dans son assiette » : un ovale,
 * puis une carte posée sur la table, ne valaient pas l'étape 2. On fait comme
 * elle : SA SCÈNE quand le restaurant en a une (l'assiette servie, son fantôme
 * assis derrière — composée une fois pour toutes), sinon SA PHOTO, telle
 * qu'il l'a prise, sur toute la largeur, fondue dans la nuit en haut et en bas.
 */
function platPleinePage(img: HTMLImageElement, scene: boolean): { toile: HTMLCanvasElement; y: number } {
  const W = LARGEUR;
  const h = scene ? (W * img.naturalHeight) / img.naturalWidth : 0.48 * HAUTEUR;
  const c = toile(W, h);
  const g = c.getContext("2d")!;
  if (scene) g.drawImage(img, 0, 0, W, h);
  else couvrir(g, img, img.naturalWidth, img.naturalHeight, 0, 0, W, h, 1, 0.6);
  // le fondu, comme le `mask-image` du CSS (scène : 7 % / 90 % ; photo : 9 % / 84 %)
  const [haut, bas] = scene ? [0.07, 0.9] : [0.09, 0.84];
  const m = g.createLinearGradient(0, 0, 0, h);
  m.addColorStop(0, "rgba(0,0,0,0)");
  m.addColorStop(haut, "rgba(0,0,0,1)");
  m.addColorStop(bas, "rgba(0,0,0,1)");
  m.addColorStop(1, "rgba(0,0,0,0)");
  g.globalCompositeOperation = "destination-in";
  g.fillStyle = m;
  g.fillRect(0, 0, W, h);
  return { toile: c, y: (scene ? 0.158 : 0.13) * HAUTEUR };
}

/**
 * LA SCÈNE DE L'ÉTAPE 1, PRÉPARÉE : les places du CSS de l'expérience
 * (`.xr-cloche` left 3 %, bottom 33 %, width 76 % ; `.xr-fant.montre` right
 * −8 %, bottom 40 % ; le titre à 124 px du haut), dans le cadre
 * de la vidéo, qui a la proportion de la salle. Rejette si une image manque —
 * la vidéo se monte alors sans la cloche, et l'écran d'essai le dit.
 */
async function preparerCloche(
  quoi: { photo: string; scene?: string },
  r: Reglages,
  police: Elements["police"],
): Promise<DecorCloche> {
  // SA SCÈNE SI ELLE EXISTE ET SE CHARGE ; sinon sa photo
  const vue = quoi.scene ? await image(quoi.scene).then((img) => ({ img, scene: true })).catch(() => null) : null;
  const [salle, cloche, assis, plat] = await Promise.all([
    image(RESTAURANT.salle),
    image(RESTAURANT.cloche),
    image(RESTAURANT.assis),
    vue ? Promise.resolve(vue) : image(quoi.photo).then((img) => ({ img, scene: false })),
  ]);
  const W = LARGEUR;
  const H = HAUTEUR;

  // LE FOND : la salle, le voile de l'étape 1, le fantôme assis qui montre la cloche, son nom brodé
  const fond = toile(W, H);
  const f = fond.getContext("2d")!;
  couvrir(f, salle, salle.naturalWidth, salle.naturalHeight, 0, 0, W, H, 1, 0.5);
  const voile = f.createLinearGradient(0, 0, 0, H);
  voile.addColorStop(0, "rgba(18,12,9,.7)");
  voile.addColorStop(0.3, "rgba(18,12,9,.25)");
  voile.addColorStop(0.55, "rgba(18,12,9,.1)");
  voile.addColorStop(1, "rgba(18,12,9,.7)");
  f.fillStyle = voile;
  f.fillRect(0, 0, W, H);
  // UN PEU PLUS GRAND QUE LES 24 % DU CSS : un téléphone est plus haut que la vidéo
  // (390 × 844 contre 9 × 16), et c'est à côté de la cloche qu'on le juge — sur le
  // téléphone, il fait les sept dixièmes de sa largeur.
  const fh = 0.27 * H;
  const fw = (fh * assis.naturalWidth) / assis.naturalHeight;
  const fx = 1.08 * W - fw;
  const fy = 0.6 * H - fh;
  f.save();
  f.shadowColor = "rgba(0,0,0,.45)";
  f.shadowOffsetY = 10 * PX;
  f.shadowBlur = 14 * PX;
  f.drawImage(assis, fx, fy, fw, fh);
  f.restore();
  broderie(f, r.commerce, fx, fy, fw, fh, police.enseigne);
  // « Une rencontre avec … », entre deux traits, en bas — sur les deux étapes
  const piedDePage = (g: CanvasRenderingContext2D) => {
    g.save();
    g.font = `500 ${15 * PX}px ${police.bulle}`;
    g.fillStyle = "#F3E2D0";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const pied = `Une rencontre avec ${r.commerce}`;
    const yPied = H - 44;
    g.fillText(pied, W / 2, yPied);
    const lp = g.measureText(pied).width;
    const trait = Math.max(14 * PX, Math.min(56 * PX, (W - lp) / 2 - 24 * PX - 30));
    g.fillStyle = "rgba(255,244,230,.4)";
    g.fillRect(W / 2 - lp / 2 - 12 * PX - trait, yPied - 1, trait, 2);
    g.fillRect(W / 2 + lp / 2 + 12 * PX, yPied - 1, trait, 2);
    g.restore();
  };
  piedDePage(f);

  // LA CLOCHE ET SON OMBRE (`drop-shadow(0 16px 16px rgba(0,0,0,.55))`)
  const w = 0.76 * W;
  const h = (w * cloche.naturalHeight) / cloche.naturalWidth;
  const cl = toile(w + 2 * MARGE_OMBRE, h + 2 * MARGE_OMBRE);
  const c = cl.getContext("2d")!;
  c.shadowColor = "rgba(0,0,0,.55)";
  c.shadowOffsetY = 16 * PX;
  c.shadowBlur = 16 * PX;
  c.drawImage(cloche, MARGE_OMBRE, MARGE_OMBRE, w, h);
  const cx = 0.03 * W + w / 2;
  const bas = 0.67 * H;

  // LE TITRE, avec son « ? » rose
  const taille = 0.094 * W;
  const largeur = W - 2 * 22 * PX;
  const interligne = taille * 1.08;
  const t0 = toile(1, 1).getContext("2d")!;
  const policeTitre = `800 ${taille}px ${police.bulle}`;
  t0.font = policeTitre;
  const lignes = lignesEquilibrees(t0, TITRE_CLOCHE.texte + TITRE_CLOCHE.fin, largeur);
  const marge = 60;
  const ti = toile(W, lignes.length * interligne + 2 * marge);
  const tc = ti.getContext("2d")!;
  tc.font = policeTitre;
  if ("letterSpacing" in tc) tc.letterSpacing = `${-0.025 * taille}px`;
  tc.textBaseline = "middle";
  tc.shadowColor = "rgba(0,0,0,.6)";
  tc.shadowOffsetY = 4 * PX;
  tc.shadowBlur = 26 * PX;
  lignes.forEach((l, i) => {
    const derniere = i === lignes.length - 1 && l.endsWith(TITRE_CLOCHE.fin);
    const blanc = derniere ? l.slice(0, -TITRE_CLOCHE.fin.length) : l;
    const lb = tc.measureText(blanc).width;
    const lr = derniere ? tc.measureText(TITRE_CLOCHE.fin).width : 0;
    const x = (W - lb - lr) / 2;
    const y = marge + interligne * (i + 0.5);
    tc.fillStyle = "#FFF4E6";
    tc.fillText(blanc, x, y);
    if (derniere) {
      tc.fillStyle = ROSE;
      tc.fillText(TITRE_CLOCHE.fin, x + lb, y);
    }
  });

  // LA FLÈCHE ROSE, qui luit
  const fl = toile(120, 120);
  const fc = fl.getContext("2d")!;
  fc.font = `800 ${30 * PX}px ${police.bulle}`;
  fc.textAlign = "center";
  fc.textBaseline = "middle";
  fc.fillStyle = ROSE;
  fc.shadowColor = "rgba(255,46,154,.7)";
  fc.shadowBlur = 12 * PX;
  fc.fillText("↑", 60, 60);

  // ═══ L'ÉTAPE 2 ═══ la salle remontée d'un quart (`.xr-plan.remonte`), assombrie, sous le voile de l'étape 2
  const fond2 = toile(W, H);
  const f2 = fond2.getContext("2d")!;
  f2.fillStyle = "#120C09";
  f2.fillRect(0, 0, W, H);
  couvrir(f2, salle, salle.naturalWidth, salle.naturalHeight, 0, -0.24 * H, W, H, 1, 0.5);
  f2.fillStyle = "rgba(0,0,0,.22)"; // `brightness(.78)`
  f2.fillRect(0, 0, W, H);
  const voile2 = f2.createLinearGradient(0, 0, 0, H);
  voile2.addColorStop(0, "rgba(18,12,9,.6)");
  voile2.addColorStop(0.22, "rgba(18,12,9,0)");
  voile2.addColorStop(0.46, "rgba(18,12,9,0)");
  voile2.addColorStop(0.64, "rgba(18,12,9,.75)");
  voile2.addColorStop(0.82, "rgba(18,12,9,.97)");
  voile2.addColorStop(1, "#120C09");
  f2.fillStyle = voile2;
  f2.fillRect(0, 0, W, H);
  piedDePage(f2);

  // « ♥ Le coup de cœur du chef » (`.xr-badge`)
  const tb = 16 * PX;
  const t1 = toile(1, 1).getContext("2d")!;
  t1.font = `700 ${tb}px ${police.bulle}`;
  const motBadge = "Le coup de cœur du chef";
  const bw = 14 * PX + 22 * PX + 10 * PX + t1.measureText(motBadge).width + 18 * PX;
  const bh = 42 * PX;
  const badge = toile(bw + 4, bh + 4);
  const bc = badge.getContext("2d")!;
  cheminArrondi(bc, 2, 2, bw, bh, bh / 2);
  bc.fillStyle = "rgba(18,12,9,.72)";
  bc.fill();
  bc.lineWidth = 1.5 * PX;
  bc.strokeStyle = ROSE;
  bc.stroke();
  bc.save();
  bc.translate(2 + 14 * PX, 2 + (bh - 22 * PX) / 2);
  bc.scale((22 * PX) / 24, (22 * PX) / 24);
  bc.fillStyle = ROSE;
  bc.fill(new Path2D("M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.4 2.9 4.2 6.2C19.5 15.4 12 20 12 20Z"));
  bc.restore();
  bc.font = `700 ${tb}px ${police.bulle}`;
  bc.fillStyle = "#FFF4E6";
  bc.textBaseline = "middle";
  bc.fillText(motBadge, 2 + 14 * PX + 22 * PX + 10 * PX, 2 + bh / 2);

  // LE TRAIT, LE NOM DU PLAT ET SON PRIX (`.xr-trait`, `.xr-plat`, `.xr-prix`)
  const ca = toile(W, 220);
  const cc = ca.getContext("2d")!;
  const trait2 = cc.createLinearGradient(W * 0.3, 0, W * 0.7, 0);
  trait2.addColorStop(0, "rgba(255,244,230,0)");
  trait2.addColorStop(0.5, "rgba(255,244,230,.4)");
  trait2.addColorStop(1, "rgba(255,244,230,0)");
  cc.fillStyle = trait2;
  cc.fillRect(W * 0.3, 10, W * 0.4, 2);
  cc.textAlign = "center";
  cc.textBaseline = "middle";
  cc.font = `600 ${20 * PX}px ${police.bulle}`;
  cc.fillStyle = "#FFF4E6";
  const lignesPlat = couperLignes(cc, r.plat.trim(), W - 90).slice(0, 2);
  lignesPlat.forEach((l, i) => cc.fillText(l, W / 2, 62 + i * 44));
  if (r.prix.trim()) {
    cc.font = `400 ${17 * PX}px ${police.bulle}`;
    cc.fillStyle = "#E8D5C2";
    cc.fillText(r.prix.trim(), W / 2, 62 + lignesPlat.length * 44 + 8);
  }

  return {
    fond,
    cloche: cl,
    titre: { toile: ti, marge },
    fleche: fl,
    fond2,
    plat: platPleinePage(plat.img, plat.scene),
    badge,
    carte: ca,
    g: { cx, bas, w, h },
  };
}

/**
 * LA DÉCOUVERTE, IMAGE PAR IMAGE — les deux premières étapes de l'expérience.
 * Étape 1 : le titre monte, la flèche sautille, puis à `CLOCHE.leve` la cloche
 * se soulève (`xrSouleve`, 0,85 s) et la lueur s'allume (`xrLueur`, 0,9 s).
 * Étape 2, à la fin du geste comme dans l'application (0,9 s) : la salle
 * remonte en fondu, le plat arrive (`xrArrive`), le badge monte (`xrMonte`),
 * puis son nom et son prix.
 */
function decouverte(c2d: CanvasRenderingContext2D, d: DecorCloche, t: number) {
  const { cx, bas, w, h } = d.g;
  const a = t - CLOCHE.leve;
  /** Le temps de l'étape 2. */
  const b = a - 0.9;
  const deux = doux(b / 0.6);

  // ═══ ÉTAPE 1 ═══
  if (deux < 1) {
    c2d.drawImage(d.fond, 0, 0);

    // LA LUEUR, derrière la cloche
    if (a > 0) {
      const p = a / 0.9;
      const echelle = 0.6 + 1.8 * SORTIE(p);
      const op = p < 0.5 ? SORTIE(p / 0.5) : 1 - 0.1 * SORTIE((p - 0.5) / 0.5);
      const lw = 0.8 * w;
      const lh = 0.6 * h;
      c2d.save();
      c2d.globalAlpha = op;
      c2d.translate(cx, bas - 0.08 * h - lh / 2);
      c2d.scale(echelle, (echelle * lh) / lw);
      const g = c2d.createRadialGradient(0, 0, 0, 0, 0, lw / 2);
      g.addColorStop(0, "rgba(255,226,170,.95)");
      g.addColorStop(0.5, "rgba(255,176,90,.5)");
      g.addColorStop(1, "rgba(255,176,90,0)");
      c2d.fillStyle = g;
      c2d.fillRect(-lw / 2, -lw / 2, lw, lw);
      c2d.restore();
    }

    // LA CLOCHE : posée, puis `xrSouleve` — elle se décolle, puis s'envole en tournant
    const p = a / 0.85;
    if (p < 1) {
      let tx = 0;
      let ty = 0;
      let r = 0;
      if (p > 0 && p < 0.3) {
        const q = SOULEVE(p / 0.3);
        ty = -14 * PX * q;
        r = -2 * q;
      } else if (p >= 0.3) {
        const q = SOULEVE((p - 0.3) / 0.7);
        tx = 0.18 * w * q;
        ty = -14 * PX + (-1.5 * h + 14 * PX) * q;
        r = -2 - 22 * q;
      }
      c2d.save();
      c2d.globalAlpha = 1 - SOULEVE(borne(p));
      c2d.translate(cx + tx, bas + ty);
      c2d.rotate((r * Math.PI) / 180);
      c2d.drawImage(d.cloche, -w / 2 - MARGE_OMBRE, -h - MARGE_OMBRE);
      c2d.restore();
    }

    // LA FLÈCHE, tant que la cloche est posée (`xrHop`, 1,4 s)
    if (a < 0) {
      const saut = 8 * PX * (0.5 - 0.5 * Math.cos((t / 1.4) * 2 * Math.PI));
      c2d.save();
      c2d.globalAlpha = entree(t, 0.3, 0.3);
      c2d.drawImage(d.fleche, cx - d.fleche.width / 2, bas - h - 16 * PX - saut - d.fleche.height / 2);
      c2d.restore();
    }

    // LE TITRE (`xrMonte`, 0,7 s)
    const m = EASE(borne(t / 0.7));
    c2d.save();
    c2d.globalAlpha = m;
    c2d.drawImage(d.titre.toile, 0, TITRE_CLOCHE.haut - d.titre.marge + 14 * PX * (1 - m));
    c2d.restore();
  }

  // ═══ ÉTAPE 2 ═══
  if (deux > 0) {
    c2d.save();
    c2d.globalAlpha = deux;
    c2d.drawImage(d.fond2, 0, 0);
    c2d.restore();

    // LE PLAT (`xrArrive`, 0,6 s : il monte de 20 px et grandit de 4 %), puis la caméra s'en approche
    const k = EASE(borne(b / 0.6));
    if (k > 0) {
      const zoom = (0.96 + 0.04 * k) * (1 + 0.04 * borne((b - 0.6) / 3.4));
      const pl = d.plat;
      c2d.save();
      c2d.globalAlpha = k;
      c2d.translate(LARGEUR / 2, pl.y + pl.toile.height / 2 + 20 * PX * (1 - k));
      c2d.scale(zoom, zoom);
      c2d.drawImage(pl.toile, -LARGEUR / 2, -pl.toile.height / 2);
      c2d.restore();
    }

    // LE BADGE (`xrMonte`, 0,6 s) — une fois le titre de l'étape 1 effacé
    const kb = EASE(borne((b - 0.45) / 0.6));
    if (kb > 0) {
      c2d.save();
      c2d.globalAlpha = kb;
      c2d.drawImage(d.badge, 0.05 * LARGEUR, (112 / 844) * HAUTEUR + 14 * PX * (1 - kb));
      c2d.restore();
    }

    // SON NOM ET SON PRIX
    const n = doux((b - 0.5) / 0.5);
    if (n > 0) {
      c2d.save();
      c2d.globalAlpha = n;
      c2d.drawImage(d.carte, 0, 0.655 * HAUTEUR + 16 * (1 - n));
      c2d.restore();
    }
  }

  noir(c2d, 1 - t / 0.3);
  noir(c2d, (t - (CLOCHE.duree - 0.35)) / 0.35);
}

/* ═══ LE MONTAGE ═══════════════════════════════════════════════════════════ */

export type Reglages = {
  commerce: string;
  ville: string;
  plat: string;
  prix: string;
  /**
   * Où était le reporter sur l'aperçu, pendant l'interview. Le montage ne
   * s'en sert plus : le reporter n'est plus à l'image pendant les réponses —
   * il pose ses questions sur les cartes.
   */
  coteApercu: Cote;
  /** Le chef filmé, ou son fantôme à sa place. */
  mode: Mode;
  /**
   * La photo de son plat : la vidéo s'ouvre alors sur la cloche qu'on soulève.
   * `scene` : l'assiette servie avec son fantôme derrière, quand le restaurant
   * en a une (l'étape 2 de l'expérience la montre à la place de la photo).
   */
  cloche: { photo: string; scene?: string } | null;
  /** Ses mots, selon son métier : les questions, l'au revoir — le restaurant par défaut. */
  script?: ScriptInterview;
  /**
   * LA PHOTO DE CE QU'IL PRÉSENTE AUJOURD'HUI (sa pièce, son bouquet, son plat) :
   * le fond du titre, la carte postale de la fin, et le plan de coupe quand il
   * la nomme. Celle de la cloche, pour un restaurant.
   */
  photo?: string | null;
};

/** La photo ou la vidéo qu'il a ajoutée à une question, après l'interview. */
export type Media = { genre: "photo" | "video"; url: string };

export type PriseAMonter = {
  /** La vidéo de la prise — `null` quand il n'a enregistré que sa voix. */
  url: string | null;
  /** Le titre de sa carte, en très gros (« LE GESTE », « JEAN OU ROBE ? »). */
  titre: string;
  /** La question, écrite sous le titre. */
  question: string;
  /** Ce que le reporter a dit à voix haute, en secondes depuis le début de la prise (rien pour une question écrite). */
  paroles: { texte: string; debut: number }[];
  questionFin: number;
  /**
   * Où sa réponse commence vraiment : après qu'il a touché « Je réponds », à son premier mot. Entre la
   * fin de la question et ce moment, il réfléchissait — le montage coupe ce temps (voir `resserrer`).
   * Absent : sa réponse suit la question.
   */
  reponseDebut?: number | null;
  /** Où couper la prise : la fin de sa parole, plus un souffle. */
  coupe: number;
  /** Le son de la prise, décodé — `null` si le téléphone n'a pas su. */
  audio: AudioBuffer | null;
  /** La bouche de son fantôme, trente valeurs par seconde de prise (quand il ne se montre pas). */
  bouche: Float32Array | null;
  sousTitres: SousTitre[];
  /**
   * SA VOIX RESSERRÉE : ses « euh », ses silences de plus d'une demi-seconde, ses débuts de phrase ratés
   * — en secondes depuis le début de la prise (voir `interview-resserrer.ts`). Retirés du son, de la
   * bouche, des sous-titres et de la vidéo ; chaque saut est caché par une photo ou un coup de zoom.
   */
  coupes?: { de: number; a: number }[];
  /** Les photos ou vidéos qu'il a ajoutées à cette réponse (trois au plus) : elles passent au rythme de ses mots. */
  medias: Media[];
};

export type Montage = {
  blob: Blob;
  type: string;
  duree: number;
  /** Ce qui a servi pour le son des réponses, prise par prise. */
  sonDesReponses: ("fichier" | "lecteur" | "aucun")[];
  /** La photo ou la vidéo de chaque réponse : montrée, absente, ou illisible par ce téléphone. */
  mediaDesReponses: ("montre" | "aucun" | "illisible")[];
  /** La cloche du restaurant : montrée, pas demandée, ou sa photo illisible. */
  cloche: "montree" | "aucune" | "illisible";
};

type Segment = { genre: "titre" } | { genre: "cloche" } | { genre: "prise"; k: number } | { genre: "fin" };

/** Un morceau gardé d'une prise : de `de` à `a` dans la prise, à partir de `m` dans le montage. */
type Garde = { de: number; a: number; m: number };

/** Les morceaux gardés entre des coupes triées ; le dernier va jusqu'au bout de la prise. */
function gardesEntre(coupes: readonly { de: number; a: number }[]): Garde[] {
  const g: Garde[] = [];
  let t = 0;
  let m = 0;
  for (const c of coupes) {
    if (c.de > t) {
      g.push({ de: t, a: c.de, m });
      m += c.de - t;
    }
    t = Math.max(t, c.a);
  }
  g.push({ de: t, a: Infinity, m });
  return g;
}
/** Un instant de la prise → le montage (dans une coupe : là où elle est recollée). */
const versMontage = (g: readonly Garde[], x: number) => {
  for (const s of g) if (x < s.a) return s.m + Math.max(0, x - s.de);
  return x;
};
/** Le morceau gardé où tombe l'instant `t` du montage. */
const gardeA = (g: readonly Garde[], t: number) => g.find((s) => t < s.m + (s.a - s.de)) ?? g[g.length - 1];

/**
 * ✂️ LE TEMPS DE RÉFLEXION ET SES HÉSITATIONS, COUPÉS. « Peut-être aussi peut-il avoir d'abord la
 * question, et quand il est prêt il appuie sur enregistrer. » Puis : « le montage couperait les "euh",
 * les silences de plus d'une demi-seconde et les débuts de phrase ratés ». La prise a tourné pendant
 * tout ça ; on retire ces morceaux de son son (recollé sans clic, en fondu de quelques millisecondes),
 * de la bouche de son fantôme et de ses sous-titres. Le montage travaille ensuite sur la prise
 * resserrée ; seule sa vidéo saute ces morceaux à la lecture (voir `tic`), guidée par `gardes`.
 */
function resserrer(ctx: BaseAudioContext, p: PriseAMonter, coupes: readonly { de: number; a: number }[]): { prise: PriseAMonter; gardes: Garde[] } {
  const gardes = gardesEntre(coupes);
  if (!coupes.length) return { prise: p, gardes };
  const t = (x: number) => versMontage(gardes, x);
  let audio = p.audio;
  if (audio) {
    const sr = audio.sampleRate;
    const morceaux = gardes
      .map((g) => [Math.min(audio!.length, Math.round(g.de * sr)), Math.min(audio!.length, Number.isFinite(g.a) ? Math.round(g.a * sr) : audio!.length)] as const)
      .filter(([i0, i1]) => i1 > i0);
    const total = morceaux.reduce((n, [i0, i1]) => n + i1 - i0, 0);
    const b = ctx.createBuffer(audio.numberOfChannels, Math.max(1, total), sr);
    const fondu = Math.round(0.006 * sr);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const src = audio.getChannelData(c);
      const dst = b.getChannelData(c);
      let o = 0;
      morceaux.forEach(([i0, i1], k) => {
        dst.set(src.subarray(i0, i1), o);
        const n = Math.min(fondu, (i1 - i0) >> 1);
        // RECOLLÉ SANS CLIC : un fondu de six millisecondes de part et d'autre de chaque coupe
        for (let j = 0; j < n; j++) {
          if (k > 0) dst[o + j] *= j / n;
          if (k < morceaux.length - 1) dst[o + i1 - i0 - 1 - j] *= j / n;
        }
        o += i1 - i0;
      });
    }
    audio = b;
  }
  let bouche = p.bouche;
  if (bouche) {
    const garde: number[] = [];
    for (const g of gardes) {
      const j0 = Math.min(bouche.length, Math.round(g.de * IPS));
      const j1 = Math.min(bouche.length, Number.isFinite(g.a) ? Math.round(g.a * IPS) : bouche.length);
      for (let j = j0; j < j1; j++) garde.push(bouche[j]);
    }
    bouche = Float32Array.from(garde);
  }
  const dansUneCoupe = (x: number) => coupes.some((c) => x >= c.de && x < c.a);
  const sousTitres = p.sousTitres
    .map((x) => {
      const mots = x.mots?.filter((w) => !dansUneCoupe((w.a + w.b) / 2)).map((w) => ({ ...w, a: t(w.a), b: t(w.b) }));
      if (x.mots && !mots?.length) return null;
      return { ...x, debut: t(x.debut), fin: t(x.fin), ...(mots ? { mots, texte: mots.map((w) => w.m).join(" ") } : {}) };
    })
    // ce qui a été dit dans une coupe (un « euh », un client pendant qu'il réfléchissait) part avec
    .filter((x): x is SousTitre => x != null && x.fin - x.debut >= 0.1);
  return {
    prise: { ...p, audio, bouche, sousTitres, coupe: Math.max(p.questionFin + 0.8, t(p.coupe)) },
    gardes,
  };
}
type MediaPret = { genre: "photo"; img: HTMLImageElement } | { genre: "video"; v: HTMLVideoElement };

/** Un lecteur muet, prêt à donner ses images. */
function lecteurMuet(url: string, boucle = false): Promise<HTMLVideoElement> {
  return new Promise((ok) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.loop = boucle;
    v.setAttribute("playsinline", "");
    v.preload = "auto";
    // VISIBLE, MAIS À PEINE : un lecteur caché du tout n'avance plus ses images sur certains téléphones.
    Object.assign(v.style, { position: "fixed", left: "0", top: "0", width: "2px", height: "2px", opacity: "0.01", pointerEvents: "none" });
    const fini = () => ok(v);
    v.addEventListener("loadeddata", fini, { once: true });
    v.addEventListener("error", fini, { once: true });
    setTimeout(fini, 5000);
    v.src = url;
    document.body.appendChild(v);
  });
}

/**
 * LES TEMPS DE LA SIGNATURE, en secondes. Le titre : un instant de noir, le
 * clic, son nom. Les cartes : elles arrivent en coup de fouet et repartent en
 * fonçant vers nous juste avant sa réponse.
 */
const TITRE = { clic: 0.25, duree: 3.1 } as const;
const FOUET = 0.24;
const CARTE_SORTIE = 0.2;
/** La musique : pleine sur le titre et la fin, étouffée sous les questions, tout bas sous ses réponses. */
const MUSIQUE = { pleine: 0.3, question: 0.16, reponse: 0.055, adieu: 0.12 } as const;

/** « CE MIDI AU BORDEAUX », « AUJOURD'HUI CHEZ MAISON LOU », « AUJOURD'HUI À L'ATELIER ». */
function enteteEnCapitales(commerce: string, quand: string): string {
  const e = enteteArdoise(commerce, quand);
  return `${e.avant}${/['’]$/.test(e.avant) ? "" : " "}${e.nom}`.toLocaleUpperCase("fr-FR");
}

export async function monter(o: {
  ctx: AudioContext;
  el: Elements;
  prises: PriseAMonter[];
  reglages: Reglages;
  toile: HTMLCanvasElement;
  /** Le commerçant entend-il le montage pendant qu'il se fabrique ? */
  ecouter: boolean;
  surProgres?: (p: number) => void;
  /** L'image d'attente du lecteur : son nom en géant, une fois posé. */
  surAffiche?: (image: string) => void;
  signal?: AbortSignal;
}): Promise<Montage> {
  const { ctx, el, reglages } = o;
  /* ✂️ CE QUI EST COUPÉ DE CHAQUE PRISE (voir `resserrer`) : son temps de réflexion — de la fin de la
     question à sa réponse, retiré trois dixièmes plus tôt pour que sa vidéo le saute sous la carte —, puis
     ses hésitations, s'il y a son son (sans lui, c'est le lecteur qui joue sa voix, telle quelle). */
  const reflexion = o.prises.map((p) => (p.reponseDebut != null && p.questionFin > 0.4 && p.reponseDebut > p.questionFin + 0.3 ? p.reponseDebut - p.questionFin : 0));
  const coupesDe = o.prises.map((p, k) => {
    const l: { de: number; a: number }[] = reflexion[k] ? [{ de: p.questionFin - 0.3, a: p.questionFin - 0.3 + reflexion[k] }] : [];
    const apres = (l[0]?.a ?? p.questionFin) + 0.05;
    if (p.audio) for (const c of p.coupes ?? []) if (c.de >= apres && c.a > c.de && c.de >= (l[l.length - 1]?.a ?? 0)) l.push({ de: c.de, a: c.a });
    return l;
  });
  const resserrees = o.prises.map((p, k) => resserrer(ctx, p, coupesDe[k]));
  const prises = resserrees.map((x) => x.prise);
  const gardes = resserrees.map((x) => x.gardes);
  /** Les sauts de sa réponse (pas celui de sa réflexion, caché par la carte), dans le temps du montage. */
  const sautsReponse = coupesDe.map((l, k) => l.slice(reflexion[k] ? 1 : 0).map((c) => versMontage(gardes[k], c.a)));
  const c2d = o.toile.getContext("2d");
  if (!c2d) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");
  if (typeof o.toile.captureStream !== "function") throw new Error("Ce téléphone ne sait pas enregistrer un dessin animé (captureStream).");
  o.toile.width = LARGEUR;
  o.toile.height = HAUTEUR;
  const enFantome = reglages.mode === "fantome";
  const script = reglages.script ?? SCRIPTS.table;
  const LIEU = repliquesDuLieu(reglages.commerce, script);
  const P: Polices = { affiche: el.police.affiche, texte: el.police.bulle, serif: el.police.enseigne };

  /* ─── les lecteurs (muets) et les photos ─── */
  const lecteurs = await Promise.all(prises.map((p) => (p.url ? lecteurMuet(p.url) : Promise.resolve(null))));
  /**
   * LA DOUBLURE : un second lecteur de la même prise, quand sa réponse a des sauts. Pendant que l'un joue,
   * l'autre attend, déjà calé sur le morceau suivant ; au saut, on passe de l'un à l'autre. Un lecteur
   * qui cherche un autre instant de la vidéo met jusqu'à un tiers de seconde à repartir : l'image se
   * figerait sur sa bouche pendant que sa voix continue.
   */
  const doublures = await Promise.all(prises.map((p, k) => (p.url && p.audio && sautsReponse[k].length ? lecteurMuet(p.url) : Promise.resolve(null))));
  /** Le lecteur qu'on voit, prise par prise : le premier, ou sa doublure après un saut. */
  const actifs = [...lecteurs];
  const preparer = async (m: Media): Promise<MediaPret | null> => {
    if (m.genre === "photo") {
      const img = await image(m.url).catch(() => null);
      return img ? { genre: "photo", img } : null;
    }
    const v = await lecteurMuet(m.url, true);
    return v.videoWidth ? { genre: "video", v } : null;
  };
  const chargees = await Promise.all(prises.map((p) => Promise.all(p.medias.map(preparer))));
  /** Ses photos et vidéos lisibles, réponse par réponse. */
  const medias: MediaPret[][] = chargees.map((l) => l.filter((m): m is MediaPret => m != null));
  // LA CLOCHE : préparée une fois ; une photo illisible et la vidéo s'en passe
  const decor = reglages.cloche ? await preparerCloche(reglages.cloche, reglages, el.police).catch(() => null) : null;

  /* ─── ce qui ne bouge pas, dessiné une fois ─── */
  const vignette = fabriquerVignette();
  const grain = fabriquerGrain();
  const fondCarte = fabriquerFondCarte();
  // LA PHOTO DU JOUR : celle de la cloche, sinon la première qu'il a ajoutée à une réponse
  let imageDuJour: HTMLImageElement | null = null;
  const adresseDuJour = reglages.cloche?.photo ?? reglages.photo ?? null;
  if (adresseDuJour) imageDuJour = await image(adresseDuJour).catch(() => null);
  for (const l of medias) for (const m of l) if (!imageDuJour && m.genre === "photo") imageDuJour = m.img;
  const photoDuJour = imageDuJour ? { src: imageDuJour as CanvasImageSource, w: imageDuJour.naturalWidth, h: imageDuJour.naturalHeight } : null;
  // LE FOND DU TITRE ET DE LA FIN : la photo du jour floutée — sinon la première image de lui
  let fond: HTMLCanvasElement | null = null;
  try {
    if (photoDuJour) fond = flouter(photoDuJour.src, photoDuJour.w, photoDuJour.h);
    else {
      const v = lecteurs.find((x) => x && x.videoWidth);
      if (v) fond = flouter(v, v.videoWidth, v.videoHeight);
    }
  } catch {
    fond = null;
  }
  /** Une image de lui pendant sa première réponse : la carte postale de la fin, quand il n'a pas de photo. */
  let instantane: { src: HTMLCanvasElement; w: number; h: number } | null = null;
  /** La dernière image d'un plan, pour que la carte suivante la chasse en coup de fouet. */
  const derniere = toile(LARGEUR, HAUTEUR);
  const dg = derniere.getContext("2d")!;
  let aDerniere = false;
  /** La carte, dessinée à part quand elle doit glisser ou s'envoler. */
  const carteT = toile(LARGEUR, HAUTEUR);
  const cg = carteT.getContext("2d")!;

  /* ─── les mots de ses réponses ─── */
  const n = prises.length;
  const cartes = prises.map((p, k) => carteDeQuestion(p.titre, k, n, p.question));
  const forts = motsForts(reglages.plat, reglages.prix);
  const mots = prises.map((p) => motsDesSousTitres(p.sousTitres, forts));
  const frappent = mots.map((m) => enFrappes(m));
  const morceaux = mots.map((m, k) => (frappent[k] ? [] : morceauxDeMots(m)));
  const frappes = mots.map((m, k) => (frappent[k] ? frappesDesMots(m) : []));
  // LE COUP DE ZOOM : sur le premier mot fort de sa réponse (son plat, son prix)
  const zoomA = mots.map((m, k) => (frappent[k] ? null : (m.find((w) => w.fort)?.a ?? null)));
  // LES PLANS DE COUPE : ses photos à lui, plus la photo du jour, qui revient quand il nomme son produit.
  // Son fantôme sans photo garde l'écran pour lui seul, en grand.
  const vues: MediaPret[][] = medias.map((l, k) =>
    imageDuJour && (l.length || (lecteurs[k] && !enFantome)) && !l.some((m) => m.genre === "photo" && m.img === imageDuJour)
      ? [...l, { genre: "photo", img: imageDuJour }]
      : l,
  );
  const plans = prises.map((p, k) =>
    plansDeCoupe({
      debut: p.questionFin + 0.05,
      fin: p.coupe,
      mots: mots[k],
      medias: vues[k].length,
      produit: imageDuJour ? vues[k].findIndex((m) => m.genre === "photo" && m.img === imageDuJour) : null,
      visage: Boolean(lecteurs[k]) && !enFantome,
      produitSeul: !medias[k].length,
      sauts: sautsReponse[k],
    }),
  );
  /**
   * LE COUP DE ZOOM DES SAUTS : quand un saut tombe sur son visage (pas de photo pour le cacher), l'image
   * passe d'un cadrage à l'autre — un peu plus serré, puis normal, puis plus serré —, comme sur les Reels :
   * le saut devient un effet, pas un accroc.
   */
  const cadrageDesSauts = (k: number, tc: number) => (sautsReponse[k].filter((x) => tc >= x).length % 2 ? 1.09 : 1);

  /* ─── le son : un bus, un compresseur, la sortie enregistrée (et les haut-parleurs si on écoute) ─── */
  const enregistree = ctx.createMediaStreamDestination();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.attack.value = 0.005;
  comp.release.value = 0.2;
  // ET UN LIMITEUR derrière : un clic qui tombe sur un temps fort de la musique ne sature pas
  const limite = ctx.createDynamicsCompressor();
  limite.threshold.value = -2;
  limite.knee.value = 0;
  limite.ratio.value = 20;
  limite.attack.value = 0.002;
  limite.release.value = 0.1;
  const bus = ctx.createGain();
  bus.connect(comp);
  comp.connect(limite);
  limite.connect(enregistree);
  const ecoute = ctx.createGain();
  ecoute.gain.value = o.ecouter ? 1 : 0;
  limite.connect(ecoute);
  ecoute.connect(ctx.destination);
  const sources: AudioScheduledSourceNode[] = [];
  const salle = reverbe(ctx);
  const retour = ctx.createGain();
  retour.gain.value = 0.3;
  salle.connect(retour);
  retour.connect(bus);
  const effets = ctx.createGain();
  effets.gain.value = 0.9;
  effets.connect(bus);
  const S: SortieSon = { ctx, bruit: bruitBlanc(ctx), dest: effets, salle };

  const jouer = (buf: AudioBuffer, quand: number, gain = 1, offset = 0, duree?: number) => {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(g);
    g.connect(bus);
    const q = Math.max(ctx.currentTime, quand);
    const off = offset + Math.max(0, ctx.currentTime - quand);
    if (duree != null) {
      if (duree - (q - quand) <= 0.02) return;
      s.start(q, off, duree - (q - quand) + 0.05);
      g.gain.setValueAtTime(gain, quand + Math.max(0, duree - 0.08));
      g.gain.linearRampToValueAtTime(0, quand + duree);
    } else {
      if (off >= buf.duration) return;
      s.start(q, off);
    }
    sources.push(s);
  };

  // LA MUSIQUE, en boucle, qui baisse et s'étouffe selon ce qui se dit
  const musique = ctx.createGain();
  musique.gain.value = 0;
  const filtre = ctx.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.value = 18000;
  filtre.Q.value = 0.8;
  musique.connect(filtre);
  filtre.connect(bus);
  const niveau = (quand: number, v: number, en = 0.25) => {
    musique.gain.cancelScheduledValues(quand);
    musique.gain.setTargetAtTime(Math.max(0.0001, v), quand, en / 3);
  };
  const etouffer = (quand: number, f: number, en = 0.25) => {
    filtre.frequency.cancelScheduledValues(quand);
    filtre.frequency.setTargetAtTime(f, quand, en / 3);
  };

  /* ─── l'enregistreur ─── */
  const format = formatVideo();
  const flux = new MediaStream([...o.toile.captureStream(IPS).getVideoTracks(), ...enregistree.stream.getAudioTracks()]);
  // L'AU REVOIR : sa voix s'il l'a, sinon la bulle seule, le temps de la lire
  const texteAdieu = REPLIQUES[LIEU.adieu];
  const voixAdieu = el.voix[texteAdieu] ?? null;
  const adieu = voixAdieu?.duration ?? 1.6;
  /** La mélodie de fin : quand le fantôme a dit au revoir, jamais avant 3,4 s. */
  const SIGNATURE = Math.max(3.4, 1.6 + adieu + 0.35);
  const dFin = SIGNATURE + 1.7;
  // LA LONGUEUR PRÉVUE : le titre, la cloche, ses réponses coupées, la fin — voir `debitDuMontage`.
  const prevue = TITRE.duree + (decor ? CLOCHE.duree : 0) + prises.reduce((t, p) => t + p.coupe, 0) + dFin;
  const rec = new MediaRecorder(flux, {
    ...(format ? { mimeType: format } : {}),
    videoBitsPerSecond: debitDuMontage(prevue),
    audioBitsPerSecond: DEBIT_SON,
  });
  const morceauxVideo: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) morceauxVideo.push(e.data);
  };
  const arrete = new Promise<void>((ok) => (rec.onstop = () => ok()));

  /* ─── le plan ─── */
  // LE RESTAURANT : après le titre, on soulève la cloche, puis viennent les questions
  const segments: Segment[] = [
    { genre: "titre" },
    ...(decor ? [{ genre: "cloche" as const }] : []),
    ...prises.map((_, k) => ({ genre: "prise" as const, k })),
    { genre: "fin" },
  ];
  const sonDesReponses: Montage["sonDesReponses"] = prises.map(() => "aucun");

  const plat = reglages.plat.trim() || script.quoi;
  const titre: Titre = {
    fond,
    nom: reglages.commerce,
    haut: [reglages.ville.trim(), script.quand].filter(Boolean).join(" · ").toLocaleUpperCase("fr-FR"),
    bas: reglages.plat.trim() && reglages.plat.trim() !== script.quoi ? [script.quoi.toLocaleLowerCase("fr-FR"), plat] : ["", plat],
  };
  const nomCadre = reglages.ville.trim() ? `${reglages.commerce} · ${reglages.ville.trim()}` : reglages.commerce;
  const NOM = reglages.commerce.toLocaleUpperCase("fr-FR");
  const fin: Fin = {
    fond,
    photo: null,
    legende: plat,
    entete: enteteEnCapitales(reglages.commerce, script.quand),
    plat: enDeuxLignes(plat, 16),
    prix: reglages.prix.trim(),
    infos: reglages.ville.trim(),
    bouton: "À découvrir sur",
    logo: el.logo,
    tampon: `FACE AU FANTÔME · ${NOM} · `.length <= 40 ? `FACE AU FANTÔME · ${NOM} · ` : "FACE AU FANTÔME · FACE AU FANTÔME · ",
    mention: "La voix du fantôme est une voix de synthèse",
  };
  const bulleFin = { lignes: enDeuxLignes(texteAdieu, 14), de: 1.6, a: 1.6 + adieu + 0.3 };

  /* les places : le reporter en bas à droite des cartes ; le fantôme du chef, quand il ne se montre pas */
  const REPORTER_CARTE: Place = { cx: 560, bas: 1290, h: 430 };
  const CHEF_GRAND: Place = { cx: 360, bas: 1236, h: 560 };
  const CHEF_COIN: Place = { cx: 590, bas: 1262, h: 300 };
  const bouche = (texte: string, t: number) => {
    const b = el.bouche[texte];
    const i = Math.floor(t * IPS);
    return b && i >= 0 && i < b.length ? b[i] : 0;
  };
  const boucheReporter = (paroles: { texte: string; debut: number }[], t: number) => {
    for (const p of paroles) {
      const v = el.voix[p.texte];
      if (v && t >= p.debut && t < p.debut + v.duration) return bouche(p.texte, t - p.debut);
    }
    return 0;
  };

  /* ─── chaque image ─── */
  const dessinerTitreA = (t: number) => {
    const u = t - TITRE.clic;
    if (u < 0) {
      c2d.fillStyle = "#000";
      c2d.fillRect(0, 0, LARGEUR, HAUTEUR);
    } else dessinerTitre(c2d, P, titre, u);
    eclairDuClic(c2d, u);
    dessinerGrain(c2d, grain, t);
  };

  /** Le plan de coupe de cet instant. */
  const planA = (k: number, tc: number) => plans[k].find((x) => tc >= x.de && tc < x.a) ?? plans[k][tc < plans[k][0].de ? 0 : plans[k].length - 1];

  /** Ce qu'on voit pendant sa réponse : lui, une de ses photos (selon ses mots), ou son fantôme sur le fond. */
  const visuel = (k: number, tc: number, z: number) => {
    const v = actifs[k];
    const pl = planA(k, tc);
    if (pl.quoi === "visage" && v) couvrirImage(c2d, v, v.videoWidth, v.videoHeight, { z: z * cadrageDesSauts(k, tc) });
    else if (typeof pl.quoi === "number" && vues[k][pl.quoi]) {
      const m = vues[k][pl.quoi];
      // UNE PHOTO NE RESTE PAS FIGÉE : elle avance doucement, une fois vers la gauche, une fois vers la droite
      const u = borne((tc - pl.de) / Math.max(0.5, pl.a - pl.de));
      const sens = pl.quoi % 2 ? 1 : -1;
      if (m.genre === "photo") couvrirImage(c2d, m.img, m.img.naturalWidth, m.img.naturalHeight, { z: z * (1.04 + 0.08 * u), fx: 0.5 + sens * 0.05 * (u - 0.5) });
      else couvrirImage(c2d, m.v, m.v.videoWidth, m.v.videoHeight, { z });
    } else c2d.drawImage(fond ?? fondCarte, 0, 0);
    c2d.drawImage(vignette, 0, 0);
    // SON VISAGE RESTE LÀ, dans un médaillon, quand on montre ce dont il parle
    if (v && !enFantome && pl.quoi !== "visage") medaillon(c2d, v, 598, 236, 86, 1);
  };

  /** Le reporter sur la carte : il arrive en rebondissant, et sa bouche suit sa voix. */
  const reporterSurCarte = (g: CanvasRenderingContext2D, k: number, tl: number, tc: number) => {
    const a = rebond((tl - 0.18) / 0.4);
    if (a <= 0) return;
    dessinerFantome(g, el.reporter, { ...REPORTER_CARTE, h: REPORTER_CARTE.h * a }, tl, boucheReporter(prises[k].paroles, tc), 1.7 * Math.sin(tl * 1.7));
  };
  const carteDans = (g: CanvasRenderingContext2D, k: number, tl: number, tc: number) => {
    dessinerCarte(g, P, fondCarte, cartes[k], tl);
    reporterSurCarte(g, k, tl, tc);
  };

  const prise = (k: number, tc: number, tl: number) => {
    const p = prises[k];
    const debutReponse = p.questionFin + 0.05;
    const repond = tc - debutReponse;
    // LE COUP DE ZOOM, puis l'image revient doucement
    const uz = zoomA[k] != null ? tc - (zoomA[k] as number) : -1;
    const z = uz >= 0 ? 1 + 0.14 * sortie(uz / 0.28) - 0.08 * douce((uz - 0.28) / 1.5) : 1;
    // LES FRAPPES secouent l'image
    let dx = 0;
    let dy = 0;
    for (const f of frappes[k]) {
      const [x, y] = secousse(tc - f.a);
      dx += x;
      dy += y;
    }

    if (repond < -CARTE_SORTIE) {
      // LA CARTE DE LA QUESTION — qui chasse l'image d'avant en coup de fouet
      if (tl < FOUET && aDerniere) {
        const e = sortie(tl / FOUET);
        carteDans(cg, k, tl, tc);
        c2d.drawImage(derniere, -LARGEUR * e, 0);
        c2d.drawImage(carteT, LARGEUR * (1 - e), 0);
        c2d.save();
        c2d.globalAlpha = 0.16;
        for (const tr of [18, 36]) {
          c2d.drawImage(derniere, -LARGEUR * e - tr * (1 - e), 0);
          c2d.drawImage(carteT, LARGEUR * (1 - e) + tr * (1 - e), 0);
        }
        c2d.restore();
      } else carteDans(c2d, k, tl, tc);
    } else {
      c2d.save();
      c2d.translate(dx, dy);
      visuel(k, tc, z);
      c2d.restore();
      // le flou du coup de zoom : l'image, deux fois de plus, un peu plus grande
      if (uz >= 0 && uz < 0.3) {
        const force = Math.sin((Math.PI * uz) / 0.3);
        c2d.save();
        for (const j of [1, 2]) {
          const s = 1 + 0.035 * j * force;
          c2d.globalAlpha = 0.16 * force;
          c2d.drawImage(o.toile, (LARGEUR * (1 - s)) / 2, (HAUTEUR * (1 - s)) / 2, LARGEUR * s, HAUTEUR * s);
        }
        c2d.restore();
      }
      if (uz >= 0) fuite(c2d, uz / 0.7, 0.9);
      if (repond >= 0) {
        // SON FANTÔME, quand il ne se montre pas : il parle avec SA voix
        if (enFantome) {
          const i = Math.floor(tc * IPS);
          const ouv = p.bouche && i < p.bouche.length ? p.bouche[i] : 0;
          dessinerFantome(c2d, el.chef, vues[k].length ? CHEF_COIN : CHEF_GRAND, tc + 0.7, ouv, 2 * Math.sin(tc * 1.3));
        }
        dessinerCadre(c2d, P, repond, nomCadre);
        const yMots = enFantome && !vues[k].length ? 470 : 923;
        dessinerSousTitres(c2d, P, morceaux[k].find((m) => tc >= m.de && tc < m.fin), tc, yMots);
        for (const f of frappes[k]) dessinerFrappe(c2d, P, f.m, tc - f.a, f.fin - f.a);
      } else {
        // LA CARTE S'ENVOLE vers nous et laisse voir sa réponse
        const e = sortie((repond + CARTE_SORTIE) / CARTE_SORTIE);
        carteDans(cg, k, tl, tc);
        c2d.save();
        c2d.globalAlpha = 1 - e;
        c2d.translate(LARGEUR / 2, HAUTEUR / 2);
        c2d.scale(1 + 0.6 * e, 1 + 0.6 * e);
        c2d.drawImage(carteT, -LARGEUR / 2, -HAUTEUR / 2);
        c2d.restore();
      }
    }
    // UNE IMAGE DE LUI, pour la carte postale de la fin
    const v = actifs[k];
    if (!photoDuJour && !instantane && !enFantome && v && v.videoWidth && repond > 1.2 && planA(k, tc).quoi === "visage") {
      const t2 = toile(540, 960);
      couvrirImage(t2.getContext("2d")!, v, v.videoWidth, v.videoHeight, { w: 540, h: 960 });
      instantane = { src: t2, w: 540, h: 960 };
    }
    dessinerGrain(c2d, grain, tc + k * 7);
  };

  const dessinerFinA = (t: number) => {
    fin.photo = photoDuJour ?? instantane;
    const i = Math.floor((t - bulleFin.de) * IPS);
    const b = el.bouche[texteAdieu];
    const ouv = b && i >= 0 && i < b.length ? b[i] : 0;
    dessinerFin(
      c2d,
      P,
      fin,
      t,
      t,
      SIGNATURE,
      (cx, cy, r) => {
        const img = el.reporter[Math.min(3, Math.round(borne(ouv) * 3))];
        const w = 2.5 * r;
        const h = (img.height * w) / Math.max(1, img.width);
        c2d.drawImage(img, cx - w / 2, cy - r * 0.78, w, h);
      },
      bulleFin,
    );
    eclairDuClic(c2d, t);
    dessinerGrain(c2d, grain, t + 99);
    noir(c2d, (t - (dFin - 0.45)) / 0.45);
  };

  /* ─── les sons de chaque temps, posés quand il commence ─── */
  const sonsTitre = (t0: number) => {
    niveau(t0, MUSIQUE.pleine, 0.15);
    sonClic(S, t0 + TITRE.clic);
  };
  const sonsCloche = (t0: number) => {
    niveau(t0, MUSIQUE.pleine * 0.8, 0.5);
    jouer(el.sons.souffle, t0 + CLOCHE.leve, 0.55);
    jouer(el.sons.cloches, t0 + CLOCHE.leve + 0.3, 0.55);
  };
  const sonsCarte = (t0: number) => {
    sonCarte(S, t0 + 0.02);
    etouffer(t0, 700);
    niveau(t0, MUSIQUE.question);
  };
  /** La question d'une prise : la voix du reporter. `zero` = l'heure de son début. */
  const sonsQuestion = (k: number, zero: number) => {
    for (const pa of prises[k].paroles) if (el.voix[pa.texte]) jouer(el.voix[pa.texte], zero + pa.debut, 0.95);
  };
  /**
   * Sa réponse : la carte qui s'envole, la musique qui se tait, ses frappes, et SA voix. Posés quand la
   * prise démarre — ou, quand sa vidéo saute son temps de réflexion, une fois le saut fait : `zero` est
   * alors l'heure à laquelle la prise aurait commencé sans ce temps-là.
   */
  const sonsReponse = (k: number, zero: number, v: HTMLVideoElement | null) => {
    const p = prises[k];
    const rep = zero + p.questionFin + 0.05;
    sonSortieCarte(S, rep - CARTE_SORTIE);
    etouffer(rep - 0.1, 18000, 0.3);
    niveau(rep - 0.1, MUSIQUE.reponse, 0.3);
    for (const f of frappes[k]) sonFrappe(S, zero + f.a);
    if (zoomA[k] != null) sonZoom(S, zero + (zoomA[k] as number));
    // SA RÉPONSE : muette pendant la question (le micro a entendu le reporter
    // dans le haut-parleur), puis à pleine voix.
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.setValueAtTime(0, zero + p.questionFin + 0.05);
    g.gain.linearRampToValueAtTime(1, zero + p.questionFin + 0.15);
    g.connect(bus);
    if (p.audio) {
      const s = ctx.createBufferSource();
      s.buffer = p.audio;
      s.connect(g);
      const depuis = Math.max(0, ctx.currentTime - zero);
      s.start(ctx.currentTime, Math.min(p.audio.duration - 0.01, depuis));
      s.stop(zero + p.coupe + 0.05);
      sources.push(s);
      sonDesReponses[k] = "fichier";
    } else if (v) {
      try {
        const s = ctx.createMediaElementSource(v);
        v.muted = false;
        s.connect(g);
        sonDesReponses[k] = "lecteur";
      } catch {
        sonDesReponses[k] = "aucun";
      }
    }
  };
  const sonsFin = (t0: number) => {
    etouffer(t0, 18000, 0.15);
    niveau(t0, MUSIQUE.pleine, 0.2);
    sonClic(S, t0);
    for (const d of [0.55, 0.68, 0.82, 0.95, 1.25]) sonTic(S, t0 + d);
    sonTampon(S, t0 + 1.0);
    niveau(t0 + bulleFin.de - 0.1, MUSIQUE.adieu, 0.2);
    if (voixAdieu) jouer(voixAdieu, t0 + bulleFin.de, 0.95);
    niveau(t0 + bulleFin.de + adieu + 0.05, MUSIQUE.pleine, 0.3);
    sonSignature(S, t0 + SIGNATURE);
    etouffer(t0 + SIGNATURE, 900, 0.3);
    niveau(t0 + SIGNATURE + 0.2, 0.0001, 2.4);
  };

  /* ─── la boucle : l'horloge du son mène, l'image suit ─── */
  if (ctx.state !== "running") await ctx.resume().catch(() => {});
  dessinerTitreA(0);
  rec.start(1000);
  const T0 = ctx.currentTime + 0.12;
  if (el.musique) {
    const boucle = ctx.createBufferSource();
    boucle.buffer = el.musique;
    boucle.loop = true;
    boucle.connect(musique);
    // LE PREMIER TEMPS TOMBE SUR LE CLIC
    boucle.start(T0 + TITRE.clic);
    sources.push(boucle);
  }
  sonsTitre(T0);

  let seg = 0;
  let debutSeg = T0;
  let lance = false;
  let sonsPoses = false;
  let mediaLance = false;
  /** Sa vidéo a sauté son temps de réflexion ; et les sons de sa réponse sont posés (`zeroReponse` : leur zéro). */
  let saute = false;
  let reponsePosee = false;
  let zeroReponse = 0;
  /** Le morceau gardé sur lequel la doublure attend (−1 : aucun). */
  let calage = -1;
  /** Ce que met un lecteur à repartir après avoir cherché un instant, mesuré sur ce téléphone. */
  let latence = 0.25;
  let chercheDepuis = -1;
  let derniereImage = -1;
  let bloqueDepuis = 0;
  let affiche = false;
  let erreur: Error | null = null;

  await new Promise<void>((fini) => {
    const suivant = (maintenant: number) => {
      const s = segments[seg];
      if (s.genre === "prise") {
        lecteurs[s.k]?.pause();
        doublures[s.k]?.pause();
        for (const m of medias[s.k]) if (m.genre === "video") m.v.pause();
      }
      // la dernière image du plan, pour le coup de fouet de la carte suivante
      dg.drawImage(o.toile, 0, 0);
      aDerniere = true;
      seg += 1;
      debutSeg = maintenant;
      lance = false;
      sonsPoses = false;
      mediaLance = false;
      saute = false;
      reponsePosee = false;
      calage = -1;
      chercheDepuis = -1;
      if (seg >= segments.length) return fini();
      const g = segments[seg].genre;
      if (g === "cloche") sonsCloche(maintenant);
      if (g === "prise") sonsCarte(maintenant);
      if (g === "fin") sonsFin(maintenant);
    };
    const tic = () => {
      if (seg >= segments.length) return;
      if (erreur) return fini();
      if (o.signal?.aborted) {
        erreur = new Error("Montage interrompu.");
        return fini();
      }
      const maintenant = ctx.currentTime;
      const t = maintenant - debutSeg;
      const s = segments[seg];
      const dessiner = maintenant - derniereImage >= 1 / (IPS + 2);
      if (s.genre === "titre") {
        if (dessiner) dessinerTitreA(Math.max(0, t));
        if (dessiner && !affiche && t >= 2.7) {
          affiche = true;
          try {
            o.surAffiche?.(o.toile.toDataURL("image/jpeg", 0.82));
          } catch {
            /* pas d'image d'attente : le lecteur montrera sa première image */
          }
        }
        if (t >= TITRE.duree) suivant(maintenant);
      } else if (s.genre === "cloche") {
        if (dessiner && decor) decouverte(c2d, decor, Math.max(0, t));
        if (t >= CLOCHE.duree) suivant(maintenant);
      } else if (s.genre === "prise") {
        const v = actifs[s.k];
        const p = prises[s.k];
        let tc = t;
        if (v) {
          // FILMÉ : la vidéo mène, et le son se cale sur elle quand elle tourne vraiment
          if (!lance) {
            lance = true;
            bloqueDepuis = maintenant;
            v.currentTime = 0;
            v.play().catch(() => {
              /* muet : la lecture ne devrait jamais être refusée — sinon, le garde-fou ci-dessous passe la prise */
            });
          }
          const g = gardes[s.k];
          const d = reflexion[s.k];
          if (reponsePosee && p.audio) {
            // ═══ SA RÉPONSE EST LANCÉE : SON SON MÈNE, ET SA VIDÉO LE SUIT ═══ Elle saute ses « euh » et ses
            // silences : au bout d'un morceau gardé, on passe à la doublure, déjà calée sur le suivant.
            tc = maintenant - zeroReponse;
            const ici = gardeA(g, tc);
            const i = g.indexOf(ici);
            const apres = g[i + 1];
            const finIci = ici.m + (ici.a - ici.de);
            const autre = v === lecteurs[s.k] ? doublures[s.k] : lecteurs[s.k];
            // ce que met ce téléphone à repartir après avoir cherché
            if (chercheDepuis >= 0 && !v.seeking) {
              latence = borne(maintenant - chercheDepuis, 0.05, 0.6);
              chercheDepuis = -1;
            }
            // LA DOUBLURE ATTEND SUR LE MORCEAU SUIVANT
            if (autre && apres && calage !== i + 1) {
              autre.pause();
              autre.playbackRate = 1;
              autre.currentTime = apres.de;
              calage = i + 1;
            }
            if (apres && tc >= finIci - 0.03) {
              if (autre && calage === i + 1 && !autre.seeking && autre.readyState >= 2) {
                // LE SAUT : on passe à la doublure, déjà au bon endroit
                actifs[s.k] = autre;
                autre.play().catch(() => {});
                v.pause();
                v.playbackRate = 1;
                calage = -1;
              } else if (!v.seeking && v.currentTime < apres.de) {
                // pas de doublure prête : le lecteur cherche lui-même, en avance de ce qu'il met à repartir
                v.currentTime = apres.de + latence;
                chercheDepuis = maintenant;
              }
            } else if (!v.seeking && !v.paused && tc > ici.m + 0.15 && tc < finIci - 0.1) {
              // EN RETARD OU EN AVANCE : il accélère ou ralentit un peu ; très loin, il cherche
              const ecart = ici.de + (tc - ici.m) - v.currentTime;
              if (Math.abs(ecart) > 0.8) {
                v.currentTime = ici.de + (tc - ici.m) + latence;
                chercheDepuis = maintenant;
              } else v.playbackRate = ecart > 0.04 ? 1.25 : ecart < -0.04 ? 0.8 : 1;
            }
            bloqueDepuis = maintenant;
          } else {
            // LE SAUT : sous la carte, juste avant qu'elle s'envole, sa vidéo passe son temps de réflexion
            if (d && !saute && v.currentTime >= g[0].a) {
              saute = true;
              v.currentTime = g[1].de + (v.currentTime - g[0].a);
            }
            tc = versMontage(g, v.currentTime);
            if (tc > 0.02 && !sonsPoses) {
              sonsPoses = true;
              sonsQuestion(s.k, maintenant - tc);
              if (!d) {
                reponsePosee = true;
                zeroReponse = maintenant - tc;
                sonsReponse(s.k, zeroReponse, v);
              }
            }
            // …et le son de sa réponse part quand l'image repart, calé sur elle
            if (d && saute && !reponsePosee && !v.seeking && tc > p.questionFin - 0.27) {
              reponsePosee = true;
              zeroReponse = maintenant - tc;
              sonsReponse(s.k, zeroReponse, v);
            }
            if (tc > 0.02 && !v.seeking) bloqueDepuis = maintenant;
          }
        } else if (!sonsPoses) {
          // SA VOIX SEULE : c'est l'horloge qui mène (son son est déjà sans le temps de réflexion)
          sonsPoses = true;
          sonsQuestion(s.k, debutSeg);
          sonsReponse(s.k, debutSeg, null);
        }
        // SES VIDÉOS tournent dès le début de sa réponse : un plan de coupe peut tomber dessus à tout moment
        if (!mediaLance && tc > p.questionFin) {
          mediaLance = true;
          for (const m of medias[s.k]) {
            if (m.genre !== "video") continue;
            m.v.currentTime = 0;
            m.v.play().catch(() => {});
          }
        }
        if (dessiner) prise(s.k, tc, t);
        if (tc >= p.coupe || (v && (v.ended || maintenant - bloqueDepuis > 3))) suivant(maintenant);
      } else {
        if (dessiner) dessinerFinA(Math.max(0, t));
        if (t >= dFin) suivant(maintenant);
      }
      if (seg >= segments.length) return;
      if (dessiner) derniereImage = maintenant;
      o.surProgres?.(borne((maintenant - T0) / prevue));
      requestAnimationFrame(tic);
    };
    requestAnimationFrame(tic);
  });

  // une image noire de plus, puis on arrête
  noir(c2d, 1);
  await attendre(150);
  if (rec.state !== "inactive") rec.stop();
  await arrete;
  for (const s of sources) {
    try {
      s.stop();
    } catch {
      /* déjà arrêtée */
    }
  }
  bus.disconnect();
  comp.disconnect();
  limite.disconnect();
  ecoute.disconnect();
  musique.disconnect();
  salle.disconnect();
  const aRanger = [...lecteurs, ...doublures, ...medias.flat().map((m) => (m.genre === "video" ? m.v : null))];
  for (const v of aRanger) {
    if (!v) continue;
    v.pause();
    v.removeAttribute("src");
    v.load();
    v.remove();
  }
  flux.getTracks().forEach((t) => t.stop());
  if (erreur) throw erreur;
  const type = rec.mimeType || format || "video/webm";
  // UNE VIDÉO QUE CE TÉLÉPHONE NE SAIT PAS LIRE NE DISPARAÎT PAS EN SILENCE : l'écran d'essai le dit
  const mediaDesReponses = prises.map((p, k) => (!p.medias.length ? "aucun" : chargees[k].every(Boolean) ? "montre" : "illisible")) as Montage["mediaDesReponses"];
  const cloche: Montage["cloche"] = !reglages.cloche ? "aucune" : decor ? "montree" : "illisible";
  return { blob: new Blob(morceauxVideo, { type }), type, duree: ctx.currentTime - T0, sonDesReponses, mediaDesReponses, cloche };
}
