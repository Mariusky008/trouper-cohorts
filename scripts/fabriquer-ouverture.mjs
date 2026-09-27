/**
 * 🎬 FABRIQUER LES TROIS FILMS DE L'OUVERTURE
 *
 * ═══ POURQUOI CE SCRIPT EXISTE ════════════════════════════════════════════
 *
 * « Je ne peux pas les faire, mais toi, ne peux-tu pas les faire ? »
 *
 * CE QU'ON NE PEUT PAS FAIRE, ET IL FAUT LE DIRE EN PREMIER : faire marcher le
 * Fantôme. Ses trois fichiers sont des images plates — le Fantôme, le canapé et
 * la lampe y sont le même objet. Mesuré en essayant de le détourer : son corps
 * se sépare du canapé (luminance 173 contre 47), mais sa casquette est à 29,
 * plus sombre que le canapé, et reste dans le fond. Et même détouré, il
 * resterait le trou derrière lui. Bouger son corps demande le rendu d'origine,
 * en calques.
 *
 * CE QU'ON PEUT FAIRE, ET C'EST CE QUI COMPTE : animer ce qui PORTE LE CONCEPT.
 * Dans chacune des trois scènes, la chose à comprendre n'est pas que le Fantôme
 * remue — c'est qu'un écran s'allume, qu'une veste se pose sur lui, qu'on
 * retrouve la même en vitrine. Ces trois-là s'animent sans toucher au
 * personnage, parce que ce sont des lumières et des objets, pas de l'anatomie.
 *
 * ═══ CE QUE CHAQUE ACTE MONTRE ════════════════════════════════════════════
 *
 * 1. IL OUVRE CLIKME (2 s). Un doigt touche son téléphone, l'écran s'allume en
 *    rose. C'est le geste de départ, et il ne demande que de la lumière.
 *
 * 2. LA VESTE SE POSE SUR LUI (4 s). La vignette qu'il touche se soulève,
 *    grandit, vole jusqu'à son buste et s'y fond. C'EST TOUT LE PRODUIT EN UN
 *    GESTE — et c'est faisable parce qu'on anime une COPIE de la vignette :
 *    l'originale reste en place dessous, donc rien ne laisse de trou. Quand la
 *    copie se dissout, c'est le Fantôme déjà vêtu de l'image qui apparaît.
 *
 * 3. C'EST LA MÊME VESTE (3 s). Un cercle se trace autour de la veste en
 *    vitrine, puis autour de celle de son téléphone, et les deux battent
 *    ensemble. Puis une lumière chaude balaie la devanture : l'accueil.
 *
 * ═══ COMMENT ═════════════════════════════════════════════════════════════
 *
 * UNE IMAGE PAR VINGT-CINQUIÈME DE SECONDE, composée avec sharp par-dessus la
 * photo, puis encodée par ffmpeg. Les lueurs sont posées en `screen` — elles
 * AJOUTENT de la lumière au lieu de la recouvrir, ce qui est la seule façon
 * qu'un halo posé sur un personnage lumineux ne le ternisse pas.
 *
 * LES POSITIONS SONT EN POUR CENT, relevées sur une grille posée sur chaque
 * image. En points, elles seraient fausses au premier changement de rendu.
 */

import sharp from "../node_modules/sharp/lib/index.js";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";

const SRC = "public/direct/ouverture";
const TMP = "/tmp/claude-0/ouv-images";
/** 940 ET PAS 941 : H.264 refuse une dimension impaire. Mesuré, l'encodeur
    s'arrête sur « width not divisible by 2 ». */
const L = 940;
const H = 1672;
const FPS = 25;

/** Le chemin de ffmpeg, installé par imageio-ffmpeg. */
const FF = execFileSync("python3", [
  "-c",
  "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())",
]).toString().trim();

// ═══ DE QUOI DOSER LE TEMPS ═══════════════════════════════════════════════
/** 0 avant `a`, 1 après `b`, et le chemin entre les deux. */
const entre = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
/** Part vite, arrive doucement — c'est le mouvement d'un objet qu'on lâche. */
const doux = (u) => 1 - Math.pow(1 - u, 3);
/** Monte puis redescend : pour ce qui apparaît et s'efface. */
const cloche = (u) => Math.sin(Math.PI * Math.max(0, Math.min(1, u)));
const px = (p) => Math.round((L * p) / 100);
const py = (p) => Math.round((H * p) / 100);

/** Une lueur ronde, à poser en `screen`. */
function halo(cx, cy, r, force, teinte = "255,190,235") {
  if (force <= 0.002) return "";
  return `<radialGradient id="g${cx}${cy}${r}"><stop offset="0" stop-color="rgb(${teinte})" stop-opacity="${force.toFixed(3)}"/><stop offset="1" stop-color="rgb(${teinte})" stop-opacity="0"/></radialGradient><circle cx="${px(cx)}" cy="${py(cy)}" r="${px(r)}" fill="url(#g${cx}${cy}${r})"/>`;
}

/**
 * UN ECRAN QUI S'ALLUME, ET PAS UNE FLAQUE RONDE.
 *
 * MESURE A L'ECRAN, PREMIERE VERSION : un halo rond pose sur son telephone
 * debordait sur sa main et sur le canape — on voyait une tache rose, pas un
 * ecran. Un ecran a la forme d'un ecran : un rectangle aux coins ronds, flou
 * juste ce qu'il faut pour que le bord ne se decoupe pas.
 */
function ecran(x, y, l, h, force) {
  if (force <= 0.01) return "";
  const id = `e${Math.round(x * 10)}${Math.round(y * 10)}`;
  return `<filter id="f${id}"><feGaussianBlur stdDeviation="${px(0.9)}"/></filter><rect x="${px(x - l / 2)}" y="${py(y - h / 2)}" width="${px(l)}" height="${py(h)}" rx="${px(1.2)}" fill="rgba(255,205,240,${force.toFixed(3)})" filter="url(#f${id})"/>`;
}

/** Un anneau qui s'ouvre : le doigt qui vient de toucher. */
function onde(cx, cy, u) {
  if (u <= 0 || u >= 1) return "";
  const r = px(1.5) + px(7) * doux(u);
  return `<circle cx="${px(cx)}" cy="${py(cy)}" r="${r}" fill="none" stroke="rgba(255,255,255,${(0.85 * (1 - u)).toFixed(3)})" stroke-width="${(6 * (1 - u) + 2).toFixed(1)}"/>`;
}

/** Un cercle qui se trace autour de quelque chose qu'on désigne. */
function cercle(x, y, rx, ry, u, force) {
  if (force <= 0.01) return "";
  const p = 2 * Math.PI * Math.max(px(rx), py(ry));
  return `<ellipse cx="${px(x)}" cy="${py(y)}" rx="${px(rx)}" ry="${py(ry)}" fill="none" stroke="rgba(255,46,154,${force.toFixed(3)})" stroke-width="7" stroke-linecap="round" stroke-dasharray="${p.toFixed(0)}" stroke-dashoffset="${(p * (1 - doux(u))).toFixed(0)}" transform="rotate(-90 ${px(x)} ${py(y)})"/>`;
}

const svg = (dedans) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}">${dedans}</svg>`);

// ═══ LES TROIS ACTES ══════════════════════════════════════════════════════
const ACTES = [
  {
    n: 1,
    duree: 2,
    /* IL OUVRE CLIKME. Son téléphone est dans sa main droite, écran vers lui. */
    calques(t) {
      /* IL S'ALLUME VITE PUIS SE STABILISE, comme un vrai écran : la montée est
         courte, et ce qui suit n'est qu'un souffle. */
      const clair = entre(t, 0.5, 0.95);
      return {
        lueurs:
          /* SON HALO RESPIRE. Il est lumineux : ajouter de la lumière sur lui
             est la seule animation qui ne demande pas de le déplacer. */
          halo(47, 44, 26, 0.1 + 0.05 * Math.sin(t * 2.6)) +
          /* LA LUEUR QUI SORT DE L'ÉCRAN ET TOMBE SUR SA MAIN — petite, sinon
             ce n'est plus un écran, c'est une lampe. */
          halo(61, 46, 4.5, 0.42 * clair * (0.92 + 0.08 * Math.sin(t * 5)), "255,120,200") +
          /* ET L'ÉCRAN LUI-MÊME, à sa forme et à sa place. */
          ecran(61, 46, 6.4, 4.2, 0.62 * clair * (0.94 + 0.06 * Math.sin(t * 5))),
        traits: onde(61, 46, entre(t, 0.28, 0.85)),
      };
    },
  },
  {
    n: 2,
    duree: 4,
    /* LA VESTE SE POSE SUR LUI. On anime une COPIE de la vignette : l'originale
       reste dessous, donc le vol ne laisse aucun trou. */
    /* ELLE ATTERRIT SUR SON BUSTE, PAS SUR SON VISAGE. Premiere version :
       elle finissait a 55 % de hauteur sur 19 % de haut, donc son bord
       superieur couvrait la tete du Fantome au moment de l'atterrissage — on
       voyait une carte glisser sur lui, pas un vetement se poser. */
    vol: { de: { x: 50, y: 68, l: 10, h: 8 }, vers: { x: 64, y: 58.5, l: 27, h: 13 } },
    calques(t) {
      const pose = entre(t, 1.75, 2.45);
      return {
        lueurs:
          halo(64, 48, 22, 0.08 + 0.04 * Math.sin(t * 2.4)) +
          /* LA VESTE ARRIVE : une lueur rose sur son buste, qui monte et
             retombe. C'est le moment où l'on comprend ce qui vient de se
             passer. */
          halo(64, 55, 20, 0.5 * cloche(pose), "255,120,200") +
          /* PUIS LE BOUTON RESPIRE : la suite est là. */
          halo(64, 62.5, 15, 0.3 * cloche(entre(t, 2.7, 3.9)), "255,150,215"),
        traits: onde(50, 68, entre(t, 0.15, 0.75)),
      };
    },
  },
  {
    n: 3,
    duree: 3,
    /* C'EST LA MÊME VESTE — en vitrine et sur son écran — puis l'accueil. */
    calques(t) {
      const vitrine = entre(t, 0.2, 1.1);
      const surEcran = entre(t, 0.8, 1.6);
      const ensemble = cloche(entre(t, 1.5, 2.25));
      /* LES CERCLES DESIGNENT, PUIS ILS PARTENT. Laisses en place jusqu'au
         bout, ils cessaient d'etre un geste pour devenir une annotation —
         l'ecran finissait avec deux ronds roses dessus. */
      const tiennent = 1 - entre(t, 2.2, 2.8);
      return {
        lueurs:
          halo(28, 58, 24, 0.08 + 0.04 * Math.sin(t * 2.4)) +
          halo(48.5, 32, 11, 0.34 * ensemble, "255,120,200") +
          halo(60, 53, 9, 0.34 * ensemble, "255,120,200") +
          /* LA LUMIÈRE DE LA PORTE : elle accueille, et la chaleur monte. */
          halo(80, 42, 30, 0.22 * entre(t, 1.5, 2.9), "255,210,150"),
        traits:
          cercle(48.5, 32, 9.5, 7.5, vitrine, 0.9 * vitrine * tiennent) +
          /* CELUI DU TELEPHONE ETAIT TROP FAIBLE POUR SE VOIR sur un ecran deja
             lumineux : on le trace plus net et un peu plus large. */
          cercle(60, 52.5, 8.5, 6, surEcran, 1 * surEcran * tiennent),
      };
    },
  },
];

// ═══ ON FABRIQUE ══════════════════════════════════════════════════════════
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

for (const acte of ACTES) {
  const fond = await sharp(`${SRC}/${acte.n}.jpg`).resize(L, H).png().toBuffer();
  /* LA VIGNETTE QUI VOLE : on la découpe une fois, on la repose à chaque image
     à sa taille et à sa place du moment. */
  let vignette = null;
  if (acte.vol) {
    const d = acte.vol.de;
    vignette = await sharp(fond)
      .extract({ left: px(d.x - d.l / 2), top: py(d.y - d.h / 2), width: px(d.l), height: py(d.h) })
      .png()
      .toBuffer();
  }

  const images = Math.round(acte.duree * FPS);
  for (let i = 0; i < images; i++) {
    const t = i / FPS;
    const { lueurs, traits } = acte.calques(t);
    const poses = [];

    if (vignette) {
      /* ELLE PART DOUCEMENT, ARRIVE DOUCEMENT, ET S'EFFACE EN ARRIVANT : c'est
         en se dissolvant qu'elle laisse voir le Fantôme déjà vêtu dessous. */
      const u = entre(t, 0.45, 2.2);
      if (u > 0 && u < 1) {
        const e = doux(u);
        const { de, vers } = acte.vol;
        const l = Math.round(px(de.l + (vers.l - de.l) * e));
        const h = Math.round(py(de.h + (vers.h - de.h) * e));
        const cx = px(de.x + (vers.x - de.x) * e);
        const cy = py(de.y + (vers.y - de.y) * e);
        /* ELLE NE DEPASSE JAMAIS LA MOITIE, ET ELLE S'EFFACE EN ARRIVANT.
           Pleine, elle se lisait comme une carte d'interface qui glisse ; a
           mi-transparence, elle se lit comme un vetement qui vient se poser. */
        const opacite = 0.58 * Math.min(1, (1 - u) * 2.6) * Math.min(1, u * 5);
        /* ET SES BORDS SONT FLOUS. Un rectangle net sur une photo est un objet
           colle dessus ; un bord fondu appartient a l'image. */
        const voile = await sharp(Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}"><filter id="v"><feGaussianBlur stdDeviation="${Math.max(2, Math.round(l * 0.06))}"/></filter><rect x="${Math.round(l * 0.07)}" y="${Math.round(h * 0.07)}" width="${Math.round(l * 0.86)}" height="${Math.round(h * 0.86)}" rx="${Math.round(h * 0.18)}" fill="rgba(255,255,255,${opacite.toFixed(3)})" filter="url(#v)"/></svg>`,
        )).resize(l, h).png().toBuffer();
        poses.push({
          input: await sharp(vignette)
            .resize(l, h, { fit: "fill" })
            .composite([{ input: voile, blend: "dest-in" }])
            .png()
            .toBuffer(),
          left: Math.max(0, cx - Math.round(l / 2)),
          top: Math.max(0, cy - Math.round(h / 2)),
        });
      }
    }
    if (lueurs) poses.push({ input: svg(lueurs), blend: "screen" });
    if (traits) poses.push({ input: svg(traits) });

    await sharp(fond)
      .composite(poses)
      .jpeg({ quality: 94 })
      .toFile(`${TMP}/a${acte.n}-${String(i).padStart(4, "0")}.jpg`);
  }
  console.log(`acte ${acte.n} · ${images} images`);

  /* L'ENCODAGE. `faststart` met l'index en tête du fichier : sans lui, le
     navigateur doit charger tout le mp4 avant de pouvoir commencer. */
  execFileSync(FF, ["-loglevel", "error", "-y", "-framerate", String(FPS),
    "-i", `${TMP}/a${acte.n}-%04d.jpg`, "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-crf", "23", "-movflags", "+faststart", "-an", `${SRC}/${acte.n}.mp4`]);
  execFileSync(FF, ["-loglevel", "error", "-y", "-framerate", String(FPS),
    "-i", `${TMP}/a${acte.n}-%04d.jpg`, "-c:v", "libvpx-vp9", "-b:v", "0",
    "-crf", "36", "-row-mt", "1", "-an", `${SRC}/${acte.n}.webm`]);
}

for (const a of ACTES)
  for (const ext of ["mp4", "webm"])
    if (existsSync(`${SRC}/${a.n}.${ext}`))
      console.log(`  ${a.n}.${ext}`, Math.round((await import("node:fs")).statSync(`${SRC}/${a.n}.${ext}`).size / 1024), "ko");
