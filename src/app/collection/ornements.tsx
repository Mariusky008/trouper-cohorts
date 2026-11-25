/**
 * 🔥🎧❤️ « ELLE CHANGE TOUTE SEULE » (`lib/direct/ornements.ts` ; `docs/univers/ma-figurine.md`, section 3) : ce que sa
 * figurine porte toute seule, posé par-dessus elle comme sa tête du jour — l'auréole (7 jours de suite), l'accessoire de
 * sa passion du moment, le cœur de son dernier souvenir avec un proche ; et, en petites étiquettes (`etiquettes`), « 🔥 5 »
 * et « 🎁 offert par Sam ».
 *
 * Posé en `position: absolute; inset: 0` dans ce qui porte sa figurine (le même cadre que son image) : la boîte de sa
 * tête (`o.boite`, de 0 à 1) place les détails. Sans boîte (une figurine de l'ancien style), seules les étiquettes.
 * Le même partout : sa maison (chez lui, en visite), son double du jour, le fil, les salons.
 */
import type { CSSProperties, ReactNode } from "react";
import { PHRASES_ORNEMENTS, SERIE_AUREOLE, SERIE_MIN, aDesOrnements, type Ornements as O, type SorteAccessoire } from "@/lib/direct/ornements";

/** Sur sa tête (dans la boîte de sa tête, 100 × 100 ; ce qui dépasse en haut reste visible). */
const SUR_LA_TETE: Partial<Record<SorteAccessoire, ReactNode>> = {
  casque: (
    <>
      <path d="M10 58Q8 0 50 0Q92 0 90 58" stroke="#2a1a1f" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="0" y="44" width="16" height="30" rx="6" fill="#ff2e9a" />
      <rect x="84" y="44" width="16" height="30" rx="6" fill="#ff2e9a" />
    </>
  ),
  "casque-micro": (
    <>
      <path d="M10 58Q8 0 50 0Q92 0 90 58" stroke="#1f2a3a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="0" y="44" width="16" height="30" rx="6" fill="#3ad1ff" />
      <rect x="84" y="44" width="16" height="30" rx="6" fill="#3ad1ff" />
      <path d="M92 70Q90 92 66 90" stroke="#1f2a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="64" cy="90" r="5" fill="#1f2a3a" />
    </>
  ),
  toque: (
    <>
      <circle cx="30" cy="-18" r="17" fill="#fffaf2" stroke="#e5d9c8" strokeWidth="2" />
      <circle cx="50" cy="-26" r="19" fill="#fffaf2" stroke="#e5d9c8" strokeWidth="2" />
      <circle cx="70" cy="-18" r="17" fill="#fffaf2" stroke="#e5d9c8" strokeWidth="2" />
      <rect x="20" y="-16" width="60" height="26" rx="5" fill="#fffaf2" stroke="#e5d9c8" strokeWidth="2" />
    </>
  ),
  oreilles: (
    <>
      <path d="M14 22L22 -16L44 10Z" fill="#3b2418" />
      <path d="M21 14L25 -4L36 10Z" fill="#ff9ec4" />
      <path d="M56 10L78 -16L86 22Z" fill="#3b2418" />
      <path d="M64 10L75 -4L79 14Z" fill="#ff9ec4" />
    </>
  ),
  couronne: (
    <>
      <path d="M26 10L26 -12L37 0L50 -18L63 0L74 -12L74 10Z" fill="#f6b54b" stroke="#c98a1f" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="50" cy="1" r="4" fill="#ff2e9a" />
    </>
  ),
  bandeau: (
    <>
      <rect x="4" y="16" width="92" height="11" rx="3" fill="#fffaf2" stroke="#e0322e" strokeWidth="2" />
      <circle cx="50" cy="21.5" r="4" fill="#e0322e" />
      <path d="M94 22L104 34M94 22L106 26" stroke="#fffaf2" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
};

export function Ornements({ o, taille = 11, etiquettes = true }: { o: O | null | undefined; taille?: number; etiquettes?: boolean }) {
  if (!aDesOrnements(o)) return null;
  const serie = o.serie ?? 0;
  const b = o.boite;
  const a = o.accessoire;
  const surLaTete = a ? SUR_LA_TETE[a.sorte] : null;
  // (la boîte de sa tête, en pourcentages du cadre de sa figurine)
  const dans = (x: number, y: number, l: number, h: number): CSSProperties => ({ left: `${x * 100}%`, top: `${y * 100}%`, width: `${l * 100}%`, height: `${h * 100}%` });
  return (
    <span className="orn" aria-hidden="true" data-ornements={[serie >= SERIE_AUREOLE ? "aureole" : "", a?.theme ?? "", o.coeur ? "coeur" : ""].filter(Boolean).join(" ")}>
      {b && serie >= SERIE_AUREOLE && (
        <svg className="orn-svg orn-aureole" viewBox="0 0 100 30" preserveAspectRatio="none" style={dans(b[0] + b[2] * 0.08, b[1] - b[3] * 0.2, b[2] * 0.84, b[3] * 0.22)} data-aureole>
          <ellipse cx="50" cy="15" rx="46" ry="11" fill="none" stroke="#ffd36e" strokeWidth="5" />
          <ellipse cx="50" cy="15" rx="46" ry="11" fill="none" stroke="#fff4c2" strokeWidth="1.6" />
        </svg>
      )}
      {b && surLaTete && (
        <svg className="orn-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={dans(b[0], b[1], b[2], b[3])} data-accessoire={a!.sorte}>
          {surLaTete}
        </svg>
      )}
      {b && a?.sorte === "echarpe" && (
        <svg className="orn-svg" viewBox="0 0 100 60" preserveAspectRatio="xMidYMin meet" style={dans(b[0] + b[2] * 0.05, b[1] + b[3] * 0.84, b[2] * 0.9, b[3] * 0.55)} data-accessoire="echarpe">
          <path d="M6 8Q50 30 94 8L94 24Q50 46 6 24Z" fill="#2f5fd0" />
          <path d="M26 17L28 30M50 22V36M74 17L72 30" stroke="#fff" strokeWidth="4" />
          <path d="M64 26L70 58L82 55L74 24Z" fill="#2f5fd0" />
          <path d="M68 40h11M70 47h11" stroke="#fff" strokeWidth="3" />
        </svg>
      )}
      {b && a?.sorte === "badge" && (
        <svg className="orn-svg" viewBox="0 0 40 40" style={dans(b[0] + b[2] * 0.62, b[1] + b[3] * 1.2, b[2] * 0.3, b[3] * 0.3)} data-accessoire="badge">
          <circle cx="20" cy="20" r="18" fill="#fff4e6" stroke="#f6b54b" strokeWidth="3" />
          <text x="20" y="27" textAnchor="middle" fontSize="20">
            {a.e}
          </text>
        </svg>
      )}
      {b && o.coeur && (
        <svg className="orn-svg orn-coeur" viewBox="0 0 24 22" style={dans(b[0] + b[2] * 0.14, b[1] + b[3] * 1.24, b[2] * 0.22, b[3] * 0.2)} data-coeur>
          <path d="M12 21L2.5 11.5C-1 8 1.5 1.5 6.5 1.5C9 1.5 10.8 3 12 5C13.2 3 15 1.5 17.5 1.5C22.5 1.5 25 8 21.5 11.5Z" fill="#ff2e9a" stroke="#fff4e6" strokeWidth="1.6" />
        </svg>
      )}
      {etiquettes && serie >= SERIE_MIN && (
        <i className="orn-serie" style={{ fontSize: taille }} data-serie={serie}>
          🔥 {serie}
        </i>
      )}
      {etiquettes && o.coeur && (
        <i className="orn-souvenir" style={{ fontSize: taille }} data-souvenir={o.coeur.sorte}>
          {PHRASES_ORNEMENTS.coeur(o.coeur)}
        </i>
      )}
      <style>{STYLES_ORNEMENTS}</style>
    </span>
  );
}

export const STYLES_ORNEMENTS = `
.orn{position:absolute;inset:0;z-index:3;pointer-events:none}
.orn-svg{position:absolute;overflow:visible}
.orn-aureole{filter:drop-shadow(0 0 4px rgba(255,211,110,.8));animation:orn-aureole 3s ease-in-out infinite}
@keyframes orn-aureole{0%,100%{opacity:.75}50%{opacity:1}}
.orn-coeur{animation:orn-bat 1.6s ease-in-out infinite;transform-origin:50% 60%}
@keyframes orn-bat{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}}
.orn-serie,.orn-souvenir{position:absolute;padding:.2em .55em;border-radius:999px;font-style:normal;font-weight:800;line-height:1.2;white-space:nowrap;box-shadow:0 4px 10px -4px rgba(0,0,0,.5)}
.orn-serie{left:0;bottom:2%;background:#f5a23a;color:#2a1500}
.orn-souvenir{top:calc(100% + 3px);left:50%;transform:translateX(-50%);background:#261b16;color:#fff4e6;font-weight:600;box-shadow:0 0 0 1px rgba(255,196,140,.25),0 4px 10px -4px rgba(0,0,0,.5)}
@media (prefers-reduced-motion: reduce){.orn-aureole,.orn-coeur{animation:none}}
`;
