/**
 * 🎬 FABRIQUER LES TROIS FILMS DE L'OUVERTURE
 *
 * ═══ POURQUOI CE SCRIPT A ÉTÉ RÉÉCRIT ═════════════════════════════════════
 *
 * « C'est pas bon du tout, ça fait vraiment très pauvre comme animation.
 *   Veux-tu que je te donne les fantômes seuls ou autre chose seul ? »
 *
 * La première version n'animait pas le Fantôme : elle posait des lueurs et
 * faisait voler une vignette autour d'un personnage immobile. C'était pauvre,
 * et c'était pauvre pour une raison de fond — À L'ÉCRAN, CE QUI RACONTE, C'EST
 * LE PERSONNAGE. Tant qu'il ne bouge pas, aucune lumière ne sauve le plan.
 *
 * Le Fantôme est peint dans une image plate : on ne peut pas le faire bouger
 * en le découpant (mesuré : son corps se sépare du canapé à la luminance,
 * 173 contre 47, mais sa casquette est à 29, plus sombre que le canapé, et
 * reste dans le fond). Il n'y avait donc qu'une seule sortie : D'AUTRES
 * RENDUS DU MÊME PLAN, AVEC LE PERSONNAGE DANS UNE AUTRE POSE.
 *
 * Ils sont arrivés : neuf images, « dans l'ordre de 1 à 9 ». Trois par acte,
 * même cadrage, même lumière, seul le Fantôme change. Mesuré avant de s'en
 * servir : d'une pose à l'autre, 2 à 22 % des pixels bougent, et le reste est
 * identique au point près. C'est exactement ce qu'il faut pour animer image
 * par image : LE FOND NE BOUGE JAMAIS, SEUL LE PERSONNAGE SE TRANSFORME.
 *
 * ═══ CE QUE CHAQUE ACTE MONTRE ════════════════════════════════════════════
 *
 * 1. IL OUVRE CLIKME (2 s) — poses 1, 2, 3.
 *    Affalé dans son canapé · il lève son téléphone, l'écran s'allume dans ses
 *    yeux · il sourit. Trois poses, et on a compris qu'il vient d'ouvrir
 *    quelque chose qui l'intéresse.
 *
 * 2. LA VESTE SE POSE SUR LUI (4 s) — poses 4, 5, 6.
 *    Son écran le montre en tee-shirt · son doigt touche la vignette de la
 *    veste verte · la veste est sur lui. C'EST TOUT LE PRODUIT EN TROIS
 *    IMAGES, et c'est pour ça que l'acte dure quatre secondes quand les
 *    autres en durent deux et trois.
 *
 * 3. UNE VRAIE RENCONTRE (3 s) — poses 7, 8, 9.
 *    Il arrive devant la boutique, la même veste en vitrine · la commerçante
 *    le voit et s'avance · elle lui ouvre les bras. Personne ne vend rien :
 *    quelqu'un accueille quelqu'un.
 *
 * ═══ COMMENT ON PASSE D'UNE POSE À L'AUTRE ════════════════════════════════
 *
 * Trois poses en deux secondes, enchaînées sèchement, ça ferait un diaporama.
 * Ce qui en fait un mouvement, ce sont deux choses, et elles sont toutes les
 * deux dans ce fichier :
 *
 * A. LE FLOU DE BOUGÉ, ET SEULEMENT SUR CE QUI BOUGE. Pendant le fondu, on
 *    floute les deux poses — mais à travers UN MASQUE tiré de leur différence.
 *    Le fond, identique dans les deux, reste net. Un bras qui passe d'une
 *    position à l'autre en huit images laisse la traînée que laisserait un
 *    vrai bras ; le canapé derrière ne tremble pas. Sans ce masque, flouter
 *    tout le cadre se lirait comme une secousse de caméra — et la caméra ne
 *    doit pas bouger : « je veux que l'image remplisse l'écran sans bouger ».
 *
 * B. LE VOILE, POUR LA VESTE. Le passage 5 → 6 n'est pas un fondu : la veste
 *    DESCEND sur lui, par une ligne qui balaie le buste de haut en bas avec
 *    une lueur sur son bord. C'est le geste de l'essayage, et c'est le même
 *    langage que la révélation avant/après du reste de l'application.
 *
 * Tout le calcul se fait sur les pixels bruts, en arithmétique simple. Les
 * images tenues ne sont écrites qu'une fois et les répétitions sont des liens
 * durs : 270 images à l'écran, 21 fichiers sur le disque.
 */

import sharp from "../node_modules/sharp/lib/index.js";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, linkSync, statSync } from "node:fs";

const SRC = "public/direct/ouverture";
const POSES = `${SRC}/poses`;
const TMP = "/tmp/claude-0/ouv-images";

/** 940 ET PAS 941 : H.264 refuse une dimension impaire. Mesuré, l'encodeur
    s'arrête sur « width not divisible by 2 ». Les rendus font 941. */
const L = 940;
const H = 1672;
const FPS = 30;

/** Le chemin de ffmpeg, installé par imageio-ffmpeg. */
const FF = execFileSync("python3", [
  "-c",
  "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())",
]).toString().trim();

// ═══ LE DÉCOUPAGE ═════════════════════════════════════════════════════════
/**
 * Chaque acte est une suite de temps, à 30 images par seconde. `tenir` garde
 * la pose en cours ; `fondu` et `voile` passent à la suivante.
 *
 * LES TEMPS TENUS SONT PLUS LONGS QUE LES PASSAGES, et de loin. C'est la règle
 * du mouvement lisible : on regarde une pose, elle change vite, on regarde la
 * suivante. Un fondu long donne deux images transparentes superposées — le
 * défaut qui faisait « pauvre ».
 */
const ACTES = [
  {
    n: 1,
    titre: "il ouvre ClikMe",
    poses: [1, 2, 3],
    temps: [
      { tenir: 18 },                  // affalé
      { fondu: 8, flou: 9 },          // il lève le téléphone : le bras traîne
      { tenir: 16 },                  // l'écran s'allume dans ses yeux
      { fondu: 7, flou: 5 },
      { tenir: 11 },                  // il sourit
    ],
  },
  {
    n: 2,
    titre: "la veste se pose sur lui",
    poses: [4, 5, 6],
    temps: [
      { tenir: 32 },                  // lui en tee-shirt, dans son écran
      { fondu: 10, flou: 10 },        // sa main part vers la vignette
      { tenir: 22 },                  // il touche la veste
      { voile: 24 },                  // ELLE DESCEND SUR LUI
      { tenir: 32 },                  // il est vêtu — on laisse regarder
    ],
  },
  {
    n: 3,
    titre: "une vraie rencontre",
    poses: [7, 8, 9],
    temps: [
      { tenir: 24 },                  // il arrive, elle ne l'a pas vu
      { fondu: 9, flou: 7 },
      { tenir: 23 },                  // elle le voit et s'avance
      { fondu: 9, flou: 7 },
      { tenir: 25 },                  // elle lui ouvre les bras
    ],
  },
];

// ═══ DE QUOI DOSER LE TEMPS ═══════════════════════════════════════════════
/** Part doucement, arrive doucement : le mouvement d'un corps, pas d'un store
    qui claque. */
const adouci = (u) => u * u * (3 - 2 * u);
/** Monte puis redescend : le flou est maximal au milieu du passage, nul aux
    deux bouts — là où l'image doit être nette. */
const cloche = (u) => Math.sin(Math.PI * Math.max(0, Math.min(1, u)));
const borne = (v, a, b) => (v < a ? a : v > b ? b : v);

// ═══ LIRE LES POSES ═══════════════════════════════════════════════════════
const pixels = (n) =>
  sharp(`${POSES}/${n}.jpg`).removeAlpha().resize(L, H, { fit: "fill" }).raw().toBuffer();
const pixelsFlous = (n, r) =>
  sharp(`${POSES}/${n}.jpg`).removeAlpha().resize(L, H, { fit: "fill" })
    .blur(r).raw().toBuffer();

/**
 * LE MASQUE DE CE QUI BOUGE. On compare les deux poses pixel à pixel, on garde
 * ce qui diffère, puis on FLOUTE ce masque — le flou l'élargit, et c'est ce
 * qu'on veut : un masque à bord net découperait une silhouette de carton
 * autour du bras. Le `linear(3.2)` rattrape la lumière que le flou a diluée,
 * pour que le cœur du masque revienne à plein.
 */
async function masqueDuMouvement(A, B) {
  const n = L * H;
  const m = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    const d = Math.abs(A[i * 3] - B[i * 3])
      + Math.abs(A[i * 3 + 1] - B[i * 3 + 1])
      + Math.abs(A[i * 3 + 2] - B[i * 3 + 2]);
    if (d > 30) m[i] = 255;
  }
  /* `toColourspace("b-w")` N'EST PAS UN DÉTAIL : sans lui, sharp rend le
     masque en sRGB, donc sur TROIS octets par point. On lit alors un octet
     sur trois et le masque ne vaut plus rien — mesuré, il tombait d'une
     moyenne de 59 à 3, et le voile de la veste ne se voyait pas. */
  const flou = await sharp(m, { raw: { width: L, height: H, channels: 1 } })
    .blur(20).linear(3.2, 0).toColourspace("b-w").raw().toBuffer();
  if (flou.length !== n) throw new Error(`masque à ${flou.length / n} canaux`);
  return flou;
}

/**
 * LA COURSE DU VOILE, LIGNE PAR LIGNE.
 *
 * Un voile qui descend à vitesse constante passe le même temps sur les rangées
 * vides que sur le buste. Mesuré sur le passage 5 → 6 : la course fait 1400
 * points, dont 500 seulement portent la veste — la révélation se jouait en
 * neuf images sur vingt-quatre, et le reste était de l'attente.
 *
 * Alors on ne donne pas au voile une VITESSE, on lui donne une DETTE : chaque
 * rangée pèse ce qu'elle change. La ligne avance vite là où il n'y a rien et
 * lentement là où la veste se pose. À temps égal, quantité révélée égale.
 *
 * Le `socle` est ce qui empêche la ligne de sauter d'un bloc : même une rangée
 * qui ne change pas garde un petit poids, donc le voile la traverse au lieu de
 * l'enjamber.
 */
function courseDuVoile(m, flou) {
  const parLigne = new Float64Array(H);
  let fort = 0, haut = H, bas = 0;
  for (let y = 0; y < H; y++) {
    let c = 0;
    for (let x = 0; x < L; x++) if (m[y * L + x] > 90) c++;
    parLigne[y] = c;
    if (c > fort) fort = c;
    if (c > 0) { if (y < haut) haut = y; bas = y; }
  }
  const socle = fort * 0.08;
  const debut = Math.max(0, haut - flou);
  const fin = Math.min(H - 1, bas + flou);
  const cumul = new Float64Array(fin - debut + 2);
  for (let y = debut; y <= fin; y++)
    cumul[y - debut + 1] = cumul[y - debut] + parLigne[y] + socle;
  const total = cumul[cumul.length - 1];
  /** À quelle rangée en est le voile quand il a révélé la part `u` du total. */
  return (u) => {
    const vise = u * total;
    let a = 0, b = cumul.length - 1;
    while (a < b) { const mi = (a + b) >> 1; if (cumul[mi] < vise) a = mi + 1; else b = mi; }
    return debut + a;
  };
}

const ecrire = (rgb, chemin) =>
  sharp(Buffer.from(rgb), { raw: { width: L, height: H, channels: 3 } })
    .jpeg({ quality: 92, mozjpeg: true }).toFile(chemin);

// ═══ FABRIQUER UN ACTE ════════════════════════════════════════════════════
async function fabriquer(acte) {
  const nom = (i) => `${TMP}/a${acte.n}-${String(i).padStart(4, "0")}.jpg`;
  const poses = await Promise.all(acte.poses.map(pixels));
  let image = 0;      // le numéro de l'image à écrire
  let pose = 0;       // la pose en cours
  let derniereTenue = -1;  // le fichier déjà écrit pour cette pose

  for (const temps of acte.temps) {
    if (temps.tenir !== undefined) {
      /* LES IMAGES TENUES NE SONT ÉCRITES QU'UNE FOIS. Les suivantes sont des
         liens durs vers la même : ffmpeg les lit comme des images à part
         entière, et le disque n'en garde qu'une. */
      for (let k = 0; k < temps.tenir; k++, image++) {
        if (derniereTenue < 0) { await ecrire(poses[pose], nom(image)); derniereTenue = image; }
        else linkSync(nom(derniereTenue), nom(image));
      }
      continue;
    }

    const A = poses[pose];
    const B = poses[pose + 1];
    const m = await masqueDuMouvement(A, B);
    const n = L * H;

    if (temps.fondu !== undefined) {
      const flouA = await pixelsFlous(acte.poses[pose], temps.flou);
      const flouB = await pixelsFlous(acte.poses[pose + 1], temps.flou);
      for (let k = 0; k < temps.fondu; k++, image++) {
        const u = (k + 1) / (temps.fondu + 1);
        const e = adouci(u);
        const f = cloche(u);          // la force du flou, nulle aux deux bouts
        const sortie = Buffer.alloc(n * 3);
        for (let i = 0; i < n; i++) {
          /* LE FLOU PASSE PAR LE MASQUE : `mk` vaut 1 sur le personnage qui
             bouge, 0 sur le fond. Le fond reste donc net d'un bout à l'autre
             du passage, et c'est lui qui tient le plan immobile. */
          const mk = (m[i] / 255) * f;
          for (let c = 0; c < 3; c++) {
            const j = i * 3 + c;
            const a = A[j] + (flouA[j] - A[j]) * mk;
            const b = B[j] + (flouB[j] - B[j]) * mk;
            sortie[j] = a + (b - a) * e;
          }
        }
        await ecrire(sortie, nom(image));
      }
    } else {
      /* ═══ LE VOILE : LA VESTE DESCEND SUR LUI ═══════════════════════════
         Une ligne traverse le buste de haut en bas. Au-dessus d'elle, la pose
         habillée ; en dessous, celle en tee-shirt. Le bord est adouci sur une
         centaine de points — un bord net se lirait comme un rideau d'interface
         qui passe devant, pas comme un vêtement qui se pose. Et une lueur
         suit la ligne, parce que c'est ce qui fait qu'on la regarde. */
      const flou = Math.round(H * 0.055);
      const ou = courseDuVoile(m, flou);
      for (let k = 0; k < temps.voile; k++, image++) {
        const ligne = ou(adouci((k + 1) / (temps.voile + 1)));
        const sortie = Buffer.alloc(n * 3);
        for (let y = 0; y < H; y++) {
          const v = borne((ligne - y) / flou, 0, 1);
          const lueur = Math.exp(-Math.pow((y - ligne) / (flou * 0.45), 2)) * 110;
          for (let x = 0; x < L; x++) {
            const i = y * L + x;
            const mk = m[i] / 255;
            const a = mk * v;
            const l = lueur * mk;
            for (let c = 0; c < 3; c++) {
              const j = i * 3 + c;
              sortie[j] = borne(A[j] + (B[j] - A[j]) * a + l, 0, 255);
            }
          }
        }
        await ecrire(sortie, nom(image));
      }
    }
    pose++;
    derniereTenue = -1;
  }

  console.log(`acte ${acte.n} · ${acte.titre} · ${image} images = ${(image / FPS).toFixed(2)} s`);

  /* L'ENCODAGE. `faststart` met l'index en tête du fichier : sans lui, le
     navigateur doit charger tout le mp4 avant de pouvoir commencer. */
  execFileSync(FF, ["-loglevel", "error", "-y", "-framerate", String(FPS),
    "-i", `${TMP}/a${acte.n}-%04d.jpg`, "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-crf", "22", "-movflags", "+faststart", "-an", `${SRC}/${acte.n}.mp4`]);
  execFileSync(FF, ["-loglevel", "error", "-y", "-framerate", String(FPS),
    "-i", `${TMP}/a${acte.n}-%04d.jpg`, "-c:v", "libvpx-vp9", "-b:v", "0",
    "-crf", "34", "-row-mt", "1", "-an", `${SRC}/${acte.n}.webm`]);

  /* L'AFFICHE DE L'ACTE, C'EST SA PREMIÈRE POSE. Elle est ce que le composant
     montre tant que le film n'est pas chargé, et ce qu'il garde pour toujours
     si le film manque — donc elle doit être la première image du film, sinon
     le passage de l'affiche au film se voit. */
  await sharp(`${POSES}/${acte.poses[0]}.jpg`).resize(L, H, { fit: "fill" })
    .jpeg({ quality: 88, mozjpeg: true }).toFile(`${SRC}/${acte.n}.jpg`);
}

// ═══ EN ROUTE ═════════════════════════════════════════════════════════════
if (!existsSync(`${POSES}/9.jpg`)) {
  console.error(`Il manque les neuf poses dans ${POSES}/ (1.jpg … 9.jpg).`);
  process.exit(1);
}
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
for (const a of ACTES) await fabriquer(a);
for (const a of ACTES)
  for (const ext of ["mp4", "webm"])
    if (existsSync(`${SRC}/${a.n}.${ext}`))
      console.log(`  ${a.n}.${ext}`, Math.round(statSync(`${SRC}/${a.n}.${ext}`).size / 1024), "ko");
