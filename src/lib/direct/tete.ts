"use client";

// 💇 LA TÊTE, À SA VRAIE TAILLE — pour que le moteur ne puisse plus confondre.
//
// ═══ CE QUE LE NOUVEAU MOTEUR N'A PAS SUFFI À RÉGLER ═══════════════════════
//
// « Elle fait plus naturelle, mais le visage n'est toujours pas le même que sur
// la photo de départ. »
//
// LE RENDU A GAGNÉ EN NATUREL, PAS EN RESSEMBLANCE, ET SES TROIS PHOTOS DISENT
// POURQUOI. Le costume, l'allée, la pose : tout est resté. Seul le visage a
// changé — et il est devenu, trait pour trait, celui du mannequin de la photo
// de coupe : la peau plus claire, les yeux, la mâchoire. Ce n'est pas un
// visage inventé, c'est un visage RECOPIÉ.
//
// DEUX CHOSES LE RENDENT POSSIBLE, ET AUCUNE NE DÉPEND DU MOTEUR :
//
//   · LA RÉFÉRENCE MONTRE UN VISAGE, EN GRAND. Six cents points de haut, la
//     moitié de l'image, net, de face. Sa photo à lui montre le sien sur cent
//     vingt points, au milieu d'une allée. Quand un modèle doit poser « ces
//     cheveux » sur une tête, il prend la tête qu'il voit le mieux.
//   · SA TÊTE EST MINUSCULE DANS SA PHOTO. Un visage de cent vingt points sur
//     deux mille, c'est ce que le moteur doit garder à l'identique pendant qu'il
//     refait tout ce qu'il y a autour.
//
// ═══ LES DEUX RÉPONSES, ET ELLES SONT DE L'ARITHMÉTIQUE ═══════════════════
//
//   1. ON CACHE LE VISAGE DE LA RÉFÉRENCE. Des sourcils au menton, un aplat
//      gris : il reste une chevelure sur une tête, et plus aucun visage à
//      recopier. Le moteur ne peut plus prendre ce qu'on ne lui donne pas.
//   2. ON TRAVAILLE SUR SA TÊTE, PAS SUR SA SILHOUETTE. On découpe un cadre
//      autour de sa tête, on l'agrandit, on l'envoie : son visage y fait
//      trois cents points au lieu de cent vingt. Le rendu revient, on le
//      recolle à sa place, en fondu, sur la photo d'origine. Tout ce qui est
//      hors du cadre — le costume, les jambes, l'allée — est SA PHOTO, au
//      point près, parce que le moteur ne l'a jamais reçu.
//
// ET LE DÉTECTEUR APPREND À TROUVER UNE PETITE TÊTE. MediaPipe ne voit pas un
// visage de cent vingt points sur une photo en pied — c'est mesuré, et c'est
// pour ça qu'aucun verrou ne s'était jamais posé sur ses essais. On le lui
// montre donc par morceaux agrandis : voir `trouverLaTete`.

import { alignementSurLeRendu, chargerLeVisage, trouverLeVisage } from "@/lib/direct/visage";

type Point = { x: number; y: number };
type Boite = { x: number; y: number; l: number; h: number };

function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, non) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => non(new Error("image illisible"));
    i.src = src;
  });
}

function toile(l: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(l));
  c.height = Math.max(1, Math.round(h));
  const g = c.getContext("2d");
  if (!g) throw new Error("canvas indisponible");
  return [c, g];
}

/** La boîte de tous les points d'un maillage, en pixels de l'image. */
function boiteDe(points: Point[]): Boite {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, l: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/**
 * ═══ OÙ EST LA TÊTE, MÊME PETITE ═══════════════════════════════════════════
 *
 * D'ABORD L'IMAGE ENTIÈRE : sur un portrait, c'est trouvé du premier coup.
 *
 * SINON, PAR MORCEAUX AGRANDIS. Le détecteur de MediaPipe est fait pour un
 * visage qui occupe une bonne part de l'image. On découpe donc le haut de la
 * photo en carrés qui se chevauchent — de plus en plus petits — et on les lui
 * montre un par un, agrandis : dans un carré du tiers de la largeur, un visage
 * de cent vingt points en occupe le quart, et il le voit. Le premier trouvé
 * est ramené dans les coordonnées de la photo entière.
 *
 * LE BAS DE L'IMAGE N'EST PAS FOUILLÉ : une tête n'est jamais aux genoux, et
 * chaque carré coûte quelques dizaines de millisecondes.
 */
export async function trouverLaTete(src: string): Promise<{ boite: Boite; l: number; h: number } | null> {
  try {
    const d = await chargerLeVisage();
    const img = await charger(src);
    const L = img.naturalWidth;
    const H = img.naturalHeight;
    const lire = (s: HTMLImageElement | HTMLCanvasElement, ox: number, oy: number, e: number, sl: number, sh: number) => {
      const r = d.detect(s);
      const pts = (r.faceLandmarks ?? []).find((p) => p && p.length >= 400);
      if (!pts) return null;
      return boiteDe(pts.map((p) => ({ x: ox + (p.x * sl) / e, y: oy + (p.y * sh) / e })));
    };
    const entiere = lire(img, 0, 0, 1, L, H);
    if (entiere) return { boite: entiere, l: L, h: H };

    const cote = Math.min(L, H);
    const [c, g] = toile(640, 640);
    for (const part of [2, 3, 4]) {
      const T = Math.round(cote / part);
      const pas = Math.max(1, Math.round(T / 2));
      const bas = Math.min(H, Math.round(H * 0.72));
      for (let y = 0; y + T <= bas || y === 0; y += pas) {
        for (let x = 0; x + T <= L; x += pas) {
          g.clearRect(0, 0, 640, 640);
          g.drawImage(img, x, y, T, T, 0, 0, 640, 640);
          const e = 640 / T;
          const b = lire(c, x, y, e, 640, 640);
          if (b) return { boite: b, l: L, h: H };
        }
        if (y + T >= bas) break;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * ═══ LE VISAGE DE LA RÉFÉRENCE, CACHÉ ══════════════════════════════════════
 *
 * DES SOURCILS AU MENTON, PAS PLUS HAUT. Au-dessus des sourcils commence ce
 * qu'on essaie : le front, la frange, la ligne des cheveux. On les laisse.
 *
 * UN APLAT GRIS NEUTRE, ET PAS UN FLOU. Un flou garde la couleur de la peau —
 * et « une peau plus claire » est précisément ce qui est passé sur lui.
 *
 * SANS VISAGE TROUVÉ, LA RÉFÉRENCE PART TELLE QUELLE : une nuque vue de dos,
 * un motif rasé, une frange en gros plan n'ont pas de visage à cacher.
 */
export async function cacherLeVisage(src: string): Promise<{ image: string; cache: boolean }> {
  const v = await trouverLeVisage(src).catch(() => null);
  if (!v) return { image: src, cache: false };
  const img = await charger(src);
  const [c, g] = toile(img.naturalWidth, img.naturalHeight);
  g.drawImage(img, 0, 0);
  /* L'OVALE DE MEDIAPIPE, RABOTÉ À RAS DES SOURCILS : c'est déjà le contour
     « intérieur » du module de visage, qu'on élargit un peu pour couvrir les
     joues jusqu'aux oreilles. */
  const b = v.boite;
  const cx = b.x + b.l / 2;
  const cy = b.y + b.h / 2;
  const poly = v.interieur.map((p) => ({ x: cx + (p.x - cx) * 1.14, y: p.y + (p.y > cy ? (p.y - cy) * 0.1 : 0) }));
  const tracer = () => {
    g.beginPath();
    poly.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.closePath();
  };
  /* LE BORD EST ADOUCI PAR UN HALO, pas par un filtre : `ctx.filter` manque
     encore à une partie des Safari, et un bord franc attire l'œil du moteur. */
  g.fillStyle = "#808080";
  g.shadowColor = "#808080";
  g.shadowBlur = Math.max(6, b.l * 0.06);
  tracer();
  g.fill();
  g.shadowBlur = 0;
  tracer();
  g.fill();
  return { image: c.toDataURL("image/jpeg", 0.92), cache: true };
}

/** Le cadre découpé autour de la tête, dans les pixels de la photo. */
export type CadreTete = { x: number; y: number; l: number; h: number };

/** Ce que le moteur reçoit : le cadre, agrandi à cette taille. */
const ENVOI = { l: 1024, h: 1280 };

/**
 * ═══ LE CADRE AUTOUR DE LA TÊTE ═══════════════════════════════════════════
 *
 * QUATRE LARGEURS DE VISAGE, ET DE LA PLACE AU-DESSUS. Une coupe bouclée
 * prend du volume sur les côtés et en hauteur : on laisse une hauteur de
 * visage au-dessus du front, et assez de côté pour des boucles. Le cadre a le
 * format de l'envoi — quatre sur cinq — pour être agrandi sans être déformé.
 *
 * ON NE DÉCOUPE QUE SI LA TÊTE EST PETITE. Sur un portrait serré, le visage
 * fait déjà le tiers de l'image : le découper n'apporterait rien, et le
 * recoller ajouterait une couture pour rien. `null` veut dire : envoie la
 * photo entière.
 */
export function cadrerLaTete(t: { boite: Boite; l: number; h: number }): CadreTete | null {
  const { boite: b, l: L, h: H } = t;
  if (b.l / L > 0.26) return null;
  let l = b.l * 4.2;
  let h = (l * ENVOI.h) / ENVOI.l;
  if (l > L || h > H) {
    const e = Math.min(L / l, H / h);
    l *= e;
    h *= e;
  }
  const x = Math.min(Math.max(0, b.x + b.l / 2 - l / 2), L - l);
  const y = Math.min(Math.max(0, b.y - b.h * 1.05), H - h);
  /* UN CADRE PRESQUE AUSSI GRAND QUE LA PHOTO NE SERT À RIEN : c'est la photo. */
  if ((l * h) / (L * H) > 0.55) return null;
  return { x: Math.round(x), y: Math.round(y), l: Math.round(l), h: Math.round(h) };
}

/** Le cadre, découpé et agrandi à la taille d'envoi, en JPEG. */
export async function decouperLaTete(src: string, k: CadreTete): Promise<string> {
  const img = await charger(src);
  const [c, g] = toile(ENVOI.l, ENVOI.h);
  g.imageSmoothingQuality = "high";
  g.drawImage(img, k.x, k.y, k.l, k.h, 0, 0, ENVOI.l, ENVOI.h);
  return c.toDataURL("image/jpeg", 0.94);
}

/**
 * ═══ ET LE RENDU REVIENT À SA PLACE ════════════════════════════════════════
 *
 * TROIS GESTES, DANS CET ORDRE :
 *
 *   1. ON LE RECALE. Le moteur recadre parfois de quelques points ; recollé
 *      tel quel, le bord du cadre montrerait deux épaules. Les repères du
 *      visage — yeux, nez, bouche, qui ne bougent pas sous une coupe — donnent
 *      le déplacement exact, et on l'annule.
 *   2. ON RATTRAPE SA LUMIÈRE. Un moteur d'image réchauffe ou assombrit un peu
 *      toute l'image. On mesure l'écart sur la bordure du cadre, qui est du
 *      décor intact des deux côtés, et on le corrige partout : sans ça, le
 *      cadre se verrait comme un rectangle un peu plus jaune.
 *   3. ON LE FOND DANS LA PHOTO. L'opacité monte du bord vers l'intérieur sur
 *      un sixième du cadre : aucune couture, et la tête est entièrement le
 *      rendu.
 */
export async function recollerLaTete(photo: string, k: CadreTete, envoye: string, rendu: string): Promise<string> {
  const [fond, r] = await Promise.all([charger(photo), charger(rendu)]);
  const [cale, gc] = toile(ENVOI.l, ENVOI.h);

  // 1 · RECALER
  const vA = await trouverLeVisage(envoye).catch(() => null);
  /* ON LUI DIT QUEL VISAGE CHERCHER : s'il en voit deux, celui qui ressemble
     le plus au sien. Voir `trouverLeVisage`. */
  const vB = vA ? await trouverLeVisage(rendu, vA).catch(() => null) : null;
  const ali = vA && vB ? alignementSurLeRendu(vA, vB) : null;
  if (ali) {
    /* L'ALIGNEMENT VA DE L'ENVOI VERS LE RENDU : q = z·p + t. On dessine le
       rendu dans le repère de l'envoi, donc avec l'inverse — p = (q − t)/z. */
    const n = ali.a * ali.a + ali.b * ali.b;
    const wa = ali.a / n;
    const wb = -ali.b / n;
    gc.setTransform(wa, wb, -wb, wa, -(wa * ali.e - wb * ali.f), -(wb * ali.e + wa * ali.f));
    gc.drawImage(r, 0, 0);
    gc.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    gc.drawImage(r, 0, 0, ENVOI.l, ENVOI.h);
  }

  // 2 · LA LUMIÈRE, MESURÉE SUR LA BORDURE
  const [, gr] = toile(ENVOI.l, ENVOI.h);
  gr.drawImage(await charger(envoye), 0, 0, ENVOI.l, ENVOI.h);
  const A = gr.getImageData(0, 0, ENVOI.l, ENVOI.h).data;
  const px = gc.getImageData(0, 0, ENVOI.l, ENVOI.h);
  const B = px.data;
  const bord = Math.round(ENVOI.l * 0.08);
  const somme = [0, 0, 0, 0, 0, 0];
  for (let y = 0; y < ENVOI.h; y += 2) {
    for (let x = 0; x < ENVOI.l; x += 2) {
      if (x > bord && x < ENVOI.l - bord && y > bord && y < ENVOI.h - bord) continue;
      const i = (y * ENVOI.l + x) * 4;
      if (B[i + 3] < 250) continue;
      for (let c = 0; c < 3; c++) {
        somme[c] += A[i + c];
        somme[c + 3] += B[i + c];
      }
    }
  }
  const gain = [0, 1, 2].map((c) =>
    somme[c + 3] > 0 ? Math.min(1.2, Math.max(0.83, somme[c] / somme[c + 3])) : 1,
  );

  // 3 · LE FONDU
  const F = ENVOI.l / 6;
  for (let y = 0; y < ENVOI.h; y++) {
    for (let x = 0; x < ENVOI.l; x++) {
      const i = (y * ENVOI.l + x) * 4;
      const d = Math.min(x, y, ENVOI.l - 1 - x, ENVOI.h - 1 - y);
      const t = Math.min(1, d / F);
      const lisse = t * t * (3 - 2 * t);
      B[i] = Math.min(255, B[i] * gain[0]);
      B[i + 1] = Math.min(255, B[i + 1] * gain[1]);
      B[i + 2] = Math.min(255, B[i + 2] * gain[2]);
      B[i + 3] = Math.round((B[i + 3] / 255) * lisse * 255);
    }
  }
  gc.putImageData(px, 0, 0);

  const [fin, gf] = toile(fond.naturalWidth, fond.naturalHeight);
  gf.drawImage(fond, 0, 0);
  gf.imageSmoothingQuality = "high";
  gf.drawImage(cale, 0, 0, ENVOI.l, ENVOI.h, k.x, k.y, k.l, k.h);
  return fin.toDataURL("image/jpeg", 0.92);
}
