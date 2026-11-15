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
/** Le vert : ce qui est « plus vert que rouge et bleu » de plus de VERT_PLEIN est transparent ; jusqu'à VERT_BORD, à demi. */
const VERT_BORD = 18;
const VERT_PLEIN = 70;

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
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const autre = r > b ? r : b;
        const vert = g - autre;
        if (vert <= VERT_BORD) continue;
        if (vert >= VERT_PLEIN) {
          d[i + 3] = 0;
          continue;
        }
        d[i + 3] = Math.round(255 * (1 - (vert - VERT_BORD) / (VERT_PLEIN - VERT_BORD)));
        // (le reflet vert des bords : éteint)
        d[i + 1] = autre;
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
