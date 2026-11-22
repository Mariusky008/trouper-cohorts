"use client";

/**
 * 🐾 LE COMPAGNON QUI VIT (`docs/univers/compagnon.md`, lot C0) — une de ses boucles, une vidéo faite sur un fond vert uni,
 * jouée dans le téléphone, le vert retiré au vol : chaque image de la vidéo passe par une toile (`canvas`), où ce qui est
 * vert devient transparent (et le reflet vert des bords s'éteint). Un seul fichier MP4, lu partout — iPhone compris, qui
 * ne lit pas la transparence des WebM —, sans ffmpeg à la fabrication.
 *
 * `brut` : la vidéo telle qu'elle est faite (le fond vert), pour juger. La vidéo est muette (le son du compagnon, s'il
 * vient, sera un vrai bruitage enregistré).
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";

/** (la toile : assez fine pour un animal de la taille d'une figurine, assez légère pour un téléphone) */
const LARGEUR = 270;
const HAUTEUR = 480;
/**
 * Le vert (15 novembre 2026, « parfois il y a le détourage vert kaki autour du chat ») : la couleur du fond est mesurée
 * sur le bord de chaque image (sa médiane : un vert vif, plus sombre, un peu kaki) ; un point est d'autant plus « fond »
 * qu'il est plus vert que la moyenne de son rouge et de son bleu, rapporté à ce que l'est le fond — jusqu'à PART_BORD,
 * plein ; au-delà de PART_PLEIN, transparent ; entre les deux, à demi. Un point à demi est « démêlé » : on lui retire la
 * part du fond (il retrouve la couleur de l'animal, sans liseré) ; plus sombre que le fond, c'est une ombre — elle reste
 * une ombre, grise et douce. Le reflet vert des points pleins s'éteint, et le bord se resserre d'un point.
 * (22 novembre 2026, le propriétaire : « il reste une bordure verdâtre autour du chat », sur cette page aussi : l'ombre
 * vert sombre, kaki, que la vidéo laisse autour de lui est du fond — un point dont le vert passe nettement son rouge et
 * son bleu, rapporté à sa propre lumière (`OMBRE`) ; et l'ombre plus sombre que le fond n'est plus gardée grise.)
 */
const PART_BORD = 0.16;
const PART_PLEIN = 0.5;
/** (l'ombre verte : à partir de quel vert, rapporté à sa lumière, un point sombre est du fond ; plein au-delà) */
const OMBRE = [0.04, 0.12] as const;
const lisse = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** (le fond qu'on attend, quand le bord ne dit rien de vert) */
const FOND_PAR_DEFAUT = [20, 180, 60] as const;

type Video = HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number; cancelVideoFrameCallback?: (id: number) => void };

export function CompagnonVivant({ src, titre, brut = false, className, style }: { src: string; titre: string; brut?: boolean; className?: string; style?: CSSProperties }) {
  const video = useRef<Video>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const [souci, setSouci] = useState("");

  useEffect(() => {
    const v = video.current;
    const c = toile.current;
    if (!v) return;
    void v.play().catch(() => undefined);
    if (brut || !c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    c.width = LARGEUR;
    c.height = HAUTEUR;
    let fini = false;
    let attente = 0;
    let derniere = -1;
    const detourer = () => {
      if (fini || v.readyState < 2 || v.currentTime === derniere) return;
      derniere = v.currentTime;
      ctx.clearRect(0, 0, LARGEUR, HAUTEUR);
      ctx.drawImage(v, 0, 0, LARGEUR, HAUTEUR);
      let img: ImageData;
      try {
        img = ctx.getImageData(0, 0, LARGEUR, HAUTEUR);
      } catch {
        // (la vidéo d'un autre site sans permission : la toile est « salie », on montre la vidéo telle quelle)
        fini = true;
        setSouci("Le fond ne peut pas être retiré ici : la vidéo est montrée telle quelle.");
        return;
      }
      const d = img.data;
      // (la couleur du fond : la médiane du bord de l'image)
      const rs: number[] = [];
      const gs: number[] = [];
      const bs: number[] = [];
      const prendre = (x: number, y: number) => {
        const k = (y * LARGEUR + x) * 4;
        rs.push(d[k]);
        gs.push(d[k + 1]);
        bs.push(d[k + 2]);
      };
      for (let x = 0; x < LARGEUR; x += 4) prendre(x, 0);
      for (let y = 0; y < HAUTEUR; y += 4) {
        prendre(0, y);
        prendre(LARGEUR - 1, y);
      }
      const mediane = (l: number[]) => l.sort((p, q) => p - q)[l.length >> 1];
      let fond: readonly number[] = [mediane(rs), mediane(gs), mediane(bs)];
      if (fond[1] - (fond[0] + fond[2]) / 2 < 60) fond = FOND_PAR_DEFAUT;
      const vertDuFond = fond[1] - (fond[0] + fond[2]) / 2;
      const alpha = new Uint8Array(LARGEUR * HAUTEUR);
      for (let i = 0, k = 0; i < d.length; i += 4, k++) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const part = (g - (r + b) / 2) / vertDuFond;
        // (l'ombre vert sombre, kaki : du fond aussi)
        const garde = 1 - lisse(8, 26, g) * lisse(OMBRE[0], OMBRE[1], g > 0 ? (g - Math.max(r, b)) / g : 0);
        if (part <= PART_BORD) {
          alpha[k] = Math.round(255 * garde);
          // (le reflet vert d'un point plein : éteint)
          if (g > r && g > b) d[i + 1] = r > b ? r : b;
          continue;
        }
        if (part >= PART_PLEIN || garde <= 0) {
          alpha[k] = 0;
          continue;
        }
        const f = 1 - (part - PART_BORD) / (PART_PLEIN - PART_BORD);
        const h = 1 - f;
        // (à demi : on retire la part du fond ; plus sombre que le fond, c'est une ombre — retirée aussi)
        const r2 = (r - h * fond[0]) / f;
        const g2 = (g - h * fond[1]) / f;
        const b2 = (b - h * fond[2]) / f;
        if (g2 < 0) {
          alpha[k] = 0;
          continue;
        }
        alpha[k] = Math.round(255 * f * garde);
        d[i] = r2;
        d[i + 2] = b2;
        d[i + 1] = Math.min(g2, Math.max(r2, b2));
      }
      // (le bord resserré d'un point : un point garde le moins opaque de lui et de ses quatre voisins)
      for (let y = 0, k = 0; y < HAUTEUR; y++) {
        for (let x = 0; x < LARGEUR; x++, k++) {
          let a = alpha[k];
          if (a && x > 0 && alpha[k - 1] < a) a = alpha[k - 1];
          if (a && x < LARGEUR - 1 && alpha[k + 1] < a) a = alpha[k + 1];
          if (a && y > 0 && alpha[k - LARGEUR] < a) a = alpha[k - LARGEUR];
          if (a && y < HAUTEUR - 1 && alpha[k + LARGEUR] < a) a = alpha[k + LARGEUR];
          d[k * 4 + 3] = a;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    // à chaque nouvelle image de la vidéo (sinon, à chaque image de l'écran, sans refaire la même)
    const suivante = () => {
      if (fini) return;
      detourer();
      if (v.requestVideoFrameCallback) attente = v.requestVideoFrameCallback(suivante);
      else attente = requestAnimationFrame(suivante);
    };
    suivante();
    return () => {
      fini = true;
      if (v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(attente);
      cancelAnimationFrame(attente);
    };
  }, [src, brut]);

  const voir = brut || Boolean(souci);
  return (
    <span className={className} style={{ position: "relative", display: "block", ...style }} role="img" aria-label={titre}>
      {/* (la vidéo reste dans la page — un iPhone ne décode pas une vidéo cachée —, invisible quand la toile la montre) */}
      <video
        ref={video}
        src={src}
        crossOrigin="anonymous"
        muted
        playsInline
        loop
        autoPlay
        preload="auto"
        aria-hidden="true"
        style={voir ? { width: "100%", height: "100%", objectFit: "contain", display: "block" } : { position: "absolute", left: 0, top: 0, width: 2, height: 2, opacity: 0, pointerEvents: "none" }}
      />
      {!voir && <canvas ref={toile} aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />}
      {souci && <small style={{ position: "absolute", left: 0, right: 0, bottom: 0, fontSize: 11, color: "#8a5a00", background: "rgba(255,250,243,.9)" }}>{souci}</small>}
    </span>
  );
}
