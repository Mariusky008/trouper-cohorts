/**
 * 🪧 LA PANCARTE DE SA FIGURINE (« Ma figurine », 25 novembre 2026 ; `lib/direct/mon-double.ts`) : une planchette crème,
 * écrite à la main, tenue au-dessus de sa tête par un petit bâton — la même partout (sa maison, le fil, les salons, chez
 * ceux qui le visitent). Posée en `position: absolute` au-dessus de ce qui la porte (`bas` : sa hauteur depuis le bas
 * de ce conteneur, en points ou en pourcentage).
 */
import type { CSSProperties } from "react";

export function Pancarte({ texte, taille = 14, bas = "100%", style }: { texte: string; taille?: number; bas?: string; style?: CSSProperties }) {
  if (!texte) return null;
  return (
    <span className="pcte" data-pancarte={texte} style={{ bottom: bas, fontSize: taille, ...style }} aria-label={`Sa pancarte : ${texte}`}>
      <span className="pcte-planche">{texte}</span>
      <i className="pcte-baton" aria-hidden="true" />
      <style>{STYLES_PANCARTE}</style>
    </span>
  );
}

export const STYLES_PANCARTE = `
.pcte{position:absolute;left:50%;z-index:4;display:flex;flex-direction:column;align-items:center;width:max-content;max-width:min(240px,160%);transform:translateX(-50%) rotate(-3deg);transform-origin:50% 100%;pointer-events:none}
.pcte-planche{display:block;box-sizing:border-box;padding:.3em .6em .25em;border-radius:6px;background:#fff4e6;color:#2a1a10;font-family:var(--font-main-levee),Caveat,'Segoe Print',cursive;font-weight:700;font-size:1.25em;line-height:1.02;text-align:center;overflow-wrap:anywhere;box-shadow:0 6px 14px -6px rgba(0,0,0,.6),inset 0 -2px 0 rgba(122,90,68,.25)}
.pcte-baton{display:block;width:3px;height:.9em;border-radius:2px;background:#7a5a44}
`;
