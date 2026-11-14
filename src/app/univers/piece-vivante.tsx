"use client";

/**
 * 🎬 DANS SES PIÈCES — chaque pièce entière à l'écran, vivante (14 novembre 2026, `lib/direct/pieces-vivantes-serveur.ts`) :
 * l'image fixe, sa vidéo en boucle par-dessus (avant la fin, elle s'efface sur l'image fixe, qui est sa première image,
 * et repart en fondu), sa figurine assise à la place repérée, ses vedettes — on en touche une, la caméra s'en approche
 * (jamais de vide autour de la pièce), sa carte monte. D'une pièce à l'autre : glisser, ou les flèches.
 * Servi à « Ma maison » (l'onglet) et à l'essai de l'administrateur (`/admin/humain/univers-essais`).
 */
import { useEffect, useRef, useState, type RefObject } from "react";

import type { Cadre, PieceVue } from "@/lib/direct/pieces-vivantes";
export type { PieceVue };

/** Le cadre d'un objet, en % de la scène. */
const style = (c: Cadre) => ({ left: `${c.x}%`, top: `${c.y}%`, width: `${c.l}%`, height: `${c.h}%` });

/** 🔁 LA BOUCLE SANS COUTURE d'une vidéo posée sur son image fixe (qui est sa première image). */
export function useBoucle(video: RefObject<HTMLVideoElement | null>, joue = true) {
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (!joue) {
      v.pause();
      return;
    }
    let fondu = false;
    const temps = () => {
      if (!fondu && v.duration && v.duration - v.currentTime < 0.9) {
        fondu = true;
        v.style.opacity = "0";
      }
    };
    const fin = () => {
      v.currentTime = 0;
      void v.play().catch(() => undefined);
      v.style.opacity = "1";
      fondu = false;
    };
    v.addEventListener("timeupdate", temps);
    v.addEventListener("ended", fin);
    void v.play().catch(() => undefined);
    return () => {
      v.removeEventListener("timeupdate", temps);
      v.removeEventListener("ended", fin);
    };
  }, [video, joue]);
}

/** 🎬 En plein écran, dans ses pièces (`depart` : la première montrée). */
export function DansLesPieces({ pieces, depart = 0, figurine, youtube = "", onFermer }: { pieces: PieceVue[]; depart?: number; figurine?: string; youtube?: string; onFermer: () => void }) {
  const [n, setN] = useState(Math.min(Math.max(0, depart), pieces.length - 1));
  const [vise, setVise] = useState<string | null>(null);
  const aller = (k: number) => {
    setVise(null);
    setN((x) => Math.min(pieces.length - 1, Math.max(0, x + k)));
  };
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") return vise ? setVise(null) : onFermer();
      if (!vise && e.key === "ArrowRight") aller(1);
      if (!vise && e.key === "ArrowLeft") aller(-1);
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  });
  // (glisser d'une pièce à l'autre, quand on ne regarde pas un objet de près)
  const depuis = useRef<{ x: number; y: number } | null>(null);
  const p = pieces[n];
  if (!p) return null;
  return (
    <div
      className="pv-plein"
      role="dialog"
      aria-label={`Dans ${p.nom.toLowerCase()}`}
      onPointerDown={(e) => (depuis.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const d = depuis.current;
        depuis.current = null;
        if (!d || vise) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - d.y) * 1.4) aller(dx < 0 ? 1 : -1);
      }}
    >
      <style>{STYLES_PIECE_VIVANTE}</style>
      <UnePiece key={p.piece} p={p} figurine={figurine} youtube={p.piece === "tele" ? youtube : ""} vise={vise} setVise={setVise} />
      <header className="pv-tete">
        <button type="button" className="pv-retour" onClick={() => (vise ? setVise(null) : onFermer())}>
          ← {vise ? p.nom : "Sortir"}
        </button>
        {!vise && <span className="pv-nom">{p.nom}</span>}
      </header>
      {!vise && pieces.length > 1 && (
        <nav className="pv-nav" aria-label="Tes pièces">
          <button type="button" className="pv-fleche" disabled={n === 0} onClick={() => aller(-1)} aria-label="La pièce d’avant">
            ‹
          </button>
          <span className="pv-points">
            {pieces.map((x, k) => (
              <i key={x.piece} className={k === n ? "la" : ""} />
            ))}
          </span>
          <button type="button" className="pv-fleche" disabled={n === pieces.length - 1} onClick={() => aller(1)} aria-label="La pièce d’après">
            ›
          </button>
        </nav>
      )}
    </div>
  );
}

function UnePiece({ p, figurine, youtube, vise, setVise }: { p: PieceVue; figurine?: string; youtube: string; vise: string | null; setVise: (x: string | null) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [son, setSon] = useState(false);
  useBoucle(video);
  const objets = p.objets?.objets ?? [];
  const cible = objets.find((o) => o.cle === vise);
  // (s'approcher : le centre de l'objet au centre de l'écran, assez gros pour le voir — jamais plus de 2,6 fois ; près
  // d'un bord, le cadre s'arrête au bord de la pièce : jamais de vide à côté)
  const zoom = cible ? Math.max(1.4, Math.min(2.6, 70 / cible.l, 52 / cible.h)) : 1;
  const [ecranL, ecranH] = typeof window === "undefined" ? [390, 844] : [window.innerWidth, window.innerHeight];
  const sceneL = Math.min(ecranL, (ecranH * 9) / 16);
  const borne = (c: number, vu: number) => (vu >= 1 ? 50 : Math.min(100 - 50 * vu, Math.max(50 * vu, c)));
  const cx = cible ? borne(cible.x + cible.l / 2, ecranL / (sceneL * zoom)) : 50;
  const cy = cible ? borne(cible.y + cible.h / 2, ecranH / (((sceneL * 16) / 9) * zoom)) : 50;
  const transform = cible ? `translate(-50%, -50%) scale(${zoom.toFixed(3)}) translate(${(50 - cx).toFixed(2)}%, ${(50 - cy).toFixed(2)}%)` : "translate(-50%, -50%)";
  const place = p.objets?.place ?? { x: 35, y: 70, l: 30, h: 18 };
  const vedette = p.vedettes.find((v) => v.cle === vise);
  const ecran = p.objets?.ecran;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pv-fond" src={p.vue} alt="" aria-hidden="true" />
      <div className={`pv-scene${cible ? " vise" : ""}`} style={{ transform }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pv-fixe" src={p.vue} alt={p.nom} draggable={false} />
        {p.video && <video ref={video} className="pv-video" src={p.video} muted playsInline autoPlay preload="auto" />}
        {youtube && ecran && (
          <iframe
            className="pv-ecran"
            style={style(ecran)}
            src={`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&mute=${son ? 0 : 1}&loop=1&playlist=${youtube}&controls=0&playsinline=1&rel=0`}
            title="Ce que tu regardes en ce moment"
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        )}
        {figurine && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="pv-figurine"
            src={figurine}
            alt="Toi, dans ton fauteuil"
            draggable={false}
            style={{ left: `${place.x + place.l / 2}%`, top: `${place.y + place.h * 0.92}%`, height: `${Math.max(18, Math.min(30, place.h * 1.7)).toFixed(1)}%` }}
          />
        )}
        {objets.map((o, k) => (
          <button key={o.cle} type="button" className="pv-objet" data-objet={o.cle} style={style(o)} onClick={() => setVise(vise === o.cle ? null : o.cle)} aria-label={p.vedettes.find((v) => v.cle === o.cle)?.nom ?? o.cle}>
            <i style={{ animationDelay: `${0.6 + k * 0.35}s` }} />
          </button>
        ))}
      </div>
      <div className={`pv-voile${cible ? " la" : ""}`} aria-hidden="true" onClick={() => setVise(null)} />
      {!vise && objets.length > 0 && <p className="pv-indice">Touche ce qui bouge</p>}
      {vedette && (
        <div className="pv-carte" role="status">
          <b>{vedette.nom}</b>
          <span>{vedette.dit}</span>
          {vedette.cle === "tele" && youtube && ecran && (
            <button type="button" className="pv-son" onClick={() => setSon(!son)}>
              {son ? "🔇 Couper le son" : "🔊 Le son"}
            </button>
          )}
        </div>
      )}
    </>
  );
}

/** 🎬 Ses pièces, en vignettes (la page de visite) : un toucher, on entre. */
export function VignettesPieces({ pieces, onEntrer }: { pieces: PieceVue[]; onEntrer: (n: number) => void }) {
  return (
    <div className="pv-vignettes" role="list">
      <style>{STYLES_VIGNETTES}</style>
      {pieces.map((p, n) => (
        <button key={p.piece} type="button" role="listitem" className="pv-vignette" data-piece={p.piece} onClick={() => onEntrer(n)} aria-label={`Entrer dans ${p.nom.toLowerCase()}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.vue} alt="" draggable={false} />
          <b>{p.nom}</b>
          {p.video && <i aria-hidden="true">▶</i>}
        </button>
      ))}
    </div>
  );
}
const STYLES_VIGNETTES = `
.pv-vignettes{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 6px;scrollbar-width:none}
.pv-vignettes::-webkit-scrollbar{display:none}
.pv-vignette{position:relative;flex:0 0 38%;max-width:170px;aspect-ratio:9/16;padding:0;border:0;border-radius:16px;overflow:hidden;background:#1a0f14;scroll-snap-align:start;cursor:pointer;box-shadow:0 12px 26px -14px rgba(0,0,0,.8)}
.pv-vignette img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pv-vignette b{position:absolute;left:8px;right:8px;bottom:8px;padding:5px 8px;border-radius:999px;background:rgba(20,10,14,.66);color:#FFF4E6;font-size:12.5px;font-weight:900;text-align:center;backdrop-filter:blur(6px)}
.pv-vignette i{position:absolute;right:8px;top:8px;width:26px;height:26px;border-radius:50%;background:#FF2E9A;color:#fff;font-style:normal;font-size:12px;line-height:26px;text-align:center}
`;

export const STYLES_PIECE_VIVANTE = `
.pv-plein{position:fixed;inset:0;z-index:1000;overflow:hidden;background:#0d0705;color:#fff;font-family:system-ui,sans-serif;touch-action:pan-y}
.pv-fond{position:absolute;inset:-40px;width:calc(100% + 80px);height:calc(100% + 80px);object-fit:cover;filter:blur(28px) brightness(.55);transform:scale(1.1)}
.pv-scene{position:absolute;left:50%;top:50%;width:min(100vw,56.25dvh);aspect-ratio:9/16;transform-origin:50% 50%;transition:transform .9s cubic-bezier(.22,.9,.24,1);box-shadow:0 0 60px rgba(0,0,0,.6);animation:pv-entre .45s ease both}
@keyframes pv-entre{from{opacity:0}to{opacity:1}}
.pv-fixe,.pv-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;user-select:none}
.pv-video{transition:opacity .85s ease}
.pv-ecran{position:absolute;border:0;pointer-events:none;background:#000}
.pv-figurine{position:absolute;width:auto;max-width:none;transform:translate(-50%,-100%);transform-origin:50% 100%;filter:drop-shadow(0 12px 14px rgba(0,0,0,.5));animation:pv-souffle 4.2s ease-in-out infinite;pointer-events:none}
@keyframes pv-souffle{0%,100%{transform:translate(-50%,-100%) scaleY(1)}50%{transform:translate(-50%,-100%) scaleY(1.012)}}
.pv-objet{position:absolute;padding:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pv-objet i{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;box-shadow:0 0 0 0 rgba(255,255,255,.7);opacity:0;animation:pv-repere 2.4s ease-out 3 both}
@keyframes pv-repere{0%{opacity:0;box-shadow:0 0 0 0 rgba(255,255,255,.75)}15%{opacity:.95}70%{opacity:.9;box-shadow:0 0 0 22px rgba(255,255,255,0)}100%{opacity:0;box-shadow:0 0 0 22px rgba(255,255,255,0)}}
.pv-scene.vise .pv-objet i{display:none}
.pv-voile{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 34%,rgba(0,0,0,.62) 78%);opacity:0;transition:opacity .9s ease}
.pv-voile.la{opacity:1;pointer-events:auto}
.pv-tete{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top)) 14px 10px}
.pv-retour{padding:9px 14px;border:0;border-radius:999px;background:rgba(20,10,8,.62);color:#fff;font:inherit;font-weight:800;backdrop-filter:blur(8px);cursor:pointer}
.pv-nom{font-weight:900;font-size:18px;text-shadow:0 2px 10px rgba(0,0,0,.7)}
.pv-indice{position:absolute;left:50%;bottom:calc(max(22px,env(safe-area-inset-bottom)) + 52px);transform:translateX(-50%);margin:0;padding:8px 14px;border-radius:999px;background:rgba(20,10,8,.55);font-size:14px;font-weight:700;white-space:nowrap;animation:pv-passe 5s ease forwards}
@keyframes pv-passe{0%{opacity:0}12%{opacity:1}80%{opacity:1}100%{opacity:0}}
.pv-nav{position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:6px 8px;border-radius:999px;background:rgba(20,10,8,.55);backdrop-filter:blur(8px)}
.pv-fleche{width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:24px;line-height:1;cursor:pointer}
.pv-fleche:disabled{opacity:.3}
.pv-points{display:flex;gap:6px}
.pv-points i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.4)}
.pv-points i.la{background:#fff}
.pv-carte{position:absolute;left:14px;right:14px;bottom:max(18px,env(safe-area-inset-bottom));display:grid;gap:4px;max-width:440px;margin:0 auto;padding:14px 16px;border-radius:18px;background:rgba(255,248,240,.94);color:#2b1a0c;box-shadow:0 18px 40px -16px rgba(0,0,0,.7);animation:pv-monte .55s cubic-bezier(.22,.9,.24,1) both}
.pv-carte b{font-size:18px}
.pv-son{justify-self:start;margin-top:6px;padding:8px 14px;border:0;border-radius:999px;background:#2b1a0c;color:#fff;font:inherit;font-weight:800;cursor:pointer}
@keyframes pv-monte{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.pv-scene,.pv-video{transition:none}.pv-figurine,.pv-objet i,.pv-scene{animation:none}}
`;
