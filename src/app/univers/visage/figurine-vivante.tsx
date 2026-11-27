"use client";

/**
 * 📷 UNE FIGURINE VIVANTE, POSÉE (le lot V2 ; `lib/direct/expressions-figurine.ts`, `docs/univers/decouvrir.md` section
 * 28.7) : son corps sans sa tête, puis sa tête — l'habituelle, ou l'une de ses expressions, toutes chargées d'avance
 * (changer est instantané) — qui penche (12° au plus : au-delà, on verrait le cou) et se tourne un peu, comme dans un
 * miroir. `hauteur` : de la tête au sol, en points. 🙂 (22 novembre 2026) Sans expression du moment (`e`), l'expression
 * de son humeur du jour (`v.humeur`), si elle est prête ; sinon sa tête habituelle. 🗣️ (25 novembre 2026) `bouche` : sa voix
 * est forte — sa tête « bouche ouverte » (`v.parle`, `lib/direct/bouche.ts`), si elle est prête. 🎆 (27 novembre 2026, les
 * grands moments) `teinte` : son visage prend la couleur de l'émotion (posée sur sa tête seulement, découpée par elle).
 */
import type { CSSProperties } from "react";
import { EXPRESSIONS_FIGURINE, type ExpressionFigurine, type FigurineVivante } from "@/lib/direct/expressions-figurine";

const borne = (v: number, a: number) => Math.max(-a, Math.min(a, v));

export function FigurineVivanteVue({ v, hauteur, e, roulis = 0, lacet = 0, bouche = false, teinte }: { v: FigurineVivante; hauteur: number; e: ExpressionFigurine | null; roulis?: number; lacet?: number; bouche?: boolean; teinte?: string }) {
  const w = hauteur * v.ratio;
  const ouverte = bouche && Boolean(v.parle);
  const choisie = e && v.expressions[e] ? e : v.humeur && v.expressions[v.humeur] ? v.humeur : null;
  // (la bouche ouverte passe devant, le temps d'un son fort : la tête choisie revient aussitôt)
  const vue = ouverte ? null : choisie;
  const [bx, by, bw, bh] = v.tete.boite;
  const origine = `${(((v.tete.pivot[0] - bx) / Math.max(0.01, bw)) * 100).toFixed(1)}% ${(((v.tete.pivot[1] - by) / Math.max(0.01, bh)) * 100).toFixed(1)}%`;
  const pose: CSSProperties = { left: `${bx * 100}%`, top: `${by * 100}%`, width: `${bw * 100}%`, height: `${bh * 100}%`, transformOrigin: origine, transform: `translateX(${(-borne(lacet, 0.6) * w * 0.08).toFixed(1)}px) rotate(${(-borne(roulis, 0.21) * 57.3).toFixed(1)}deg)` };
  return (
    <span className="fv" style={{ width: w, height: hauteur }} data-vivante data-expression={choisie ?? "neutre"} data-bouche={ouverte ? "1" : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fv-corps" src={v.corps} alt="" draggable={false} />
      <span className="fv-tete" style={pose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.tete.src} alt="" draggable={false} className={vue || ouverte ? "" : "vue"} />
        {EXPRESSIONS_FIGURINE.map((x) =>
          v.expressions[x.cle] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={x.cle} src={v.expressions[x.cle]} alt="" draggable={false} data-tete={x.cle} className={vue === x.cle ? "vue" : ""} />
          ) : null,
        )}
        {v.parle && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.parle} alt="" draggable={false} data-tete="parle" className={ouverte ? "vue" : ""} />
        )}
        {teinte && <Teinte src={(vue && v.expressions[vue]) || (ouverte && v.parle) || v.tete.src} couleur={teinte} />}
      </span>
      <style>{STYLES_VIVANTE}</style>
    </span>
  );
}

/** 🎆 La couleur de l'émotion sur son visage : un halo au milieu de sa tête, découpé par sa tête (rien autour). */
export function Teinte({ src, couleur }: { src: string; couleur: string }) {
  const masque = `url("${src}")`;
  return (
    <span
      className="fv-teinte"
      data-teinte
      style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", background: `radial-gradient(ellipse 48% 44% at 50% 58%, ${couleur}, transparent 78%)`, WebkitMaskImage: masque, maskImage: masque, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }}
    />
  );
}

export const STYLES_VIVANTE = `
.fv{position:relative;display:block;flex:none}
.fv-corps{position:absolute;inset:0;width:100%!important;height:100%!important;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5));user-select:none}
.fv-tete{position:absolute;transition:transform .18s ease-out}
.fv-tete img{position:absolute;inset:0;width:100%!important;height:100%!important;opacity:0!important;user-select:none;filter:none!important}
.fv-tete img.vue{opacity:1!important}
@media (prefers-reduced-motion:reduce){.fv-tete{transition:none}}
`;
