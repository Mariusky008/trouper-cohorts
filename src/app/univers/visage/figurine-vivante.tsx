"use client";

/**
 * 📷 UNE FIGURINE VIVANTE, POSÉE (le lot V2 ; `lib/direct/expressions-figurine.ts`, `docs/univers/decouvrir.md` section
 * 28.7) : son corps sans sa tête, puis sa tête — l'habituelle, ou l'une de ses cinq expressions, toutes chargées d'avance
 * (changer est instantané) — qui penche (12° au plus : au-delà, on verrait le cou) et se tourne un peu, comme dans un
 * miroir. `hauteur` : de la tête au sol, en points.
 */
import type { CSSProperties } from "react";
import type { FigurineVivante } from "@/lib/direct/expressions-figurine";
import { EXPRESSIONS_VISAGE, type ExpressionVisage } from "@/lib/direct/visage-essai";

const borne = (v: number, a: number) => Math.max(-a, Math.min(a, v));

export function FigurineVivanteVue({ v, hauteur, e, roulis = 0, lacet = 0 }: { v: FigurineVivante; hauteur: number; e: ExpressionVisage | null; roulis?: number; lacet?: number }) {
  const w = hauteur * v.ratio;
  const [bx, by, bw, bh] = v.tete.boite;
  const origine = `${(((v.tete.pivot[0] - bx) / Math.max(0.01, bw)) * 100).toFixed(1)}% ${(((v.tete.pivot[1] - by) / Math.max(0.01, bh)) * 100).toFixed(1)}%`;
  const pose: CSSProperties = { left: `${bx * 100}%`, top: `${by * 100}%`, width: `${bw * 100}%`, height: `${bh * 100}%`, transformOrigin: origine, transform: `translateX(${(-borne(lacet, 0.6) * w * 0.08).toFixed(1)}px) rotate(${(-borne(roulis, 0.21) * 57.3).toFixed(1)}deg)` };
  return (
    <span className="fv" style={{ width: w, height: hauteur }} data-vivante data-expression={e ?? "neutre"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fv-corps" src={v.corps} alt="" draggable={false} />
      <span className="fv-tete" style={pose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.tete.src} alt="" draggable={false} className={e ? "" : "vue"} />
        {EXPRESSIONS_VISAGE.map((x) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.cle} src={v.expressions[x.cle]} alt="" draggable={false} data-tete={x.cle} className={e === x.cle ? "vue" : ""} />
        ))}
      </span>
      <style>{STYLES_VIVANTE}</style>
    </span>
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
