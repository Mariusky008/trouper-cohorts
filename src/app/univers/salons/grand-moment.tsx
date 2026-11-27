"use client";

/**
 * 🎆 LE GRAND MOMENT, À L'ÉCRAN (`lib/direct/grands-moments.ts` ; `docs/univers/grands-moments.md`) : la figurine qui
 * réagit quitte son fauteuil (`de` : sa place dans la pièce) et grossit au centre ; derrière elle son aura, autour d'elle
 * ses émojis (et les confettis, les rayons, le nuage), au-dessus la bulle. Posé dans la pièce (`L` × `H`), par-dessus
 * tout ; on ne peut pas le toucher (la pièce reste vivante dessous). `figure` dessine sa figurine à une hauteur donnée,
 * avec la tête de l'émotion et son visage coloré.
 */
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { Bangers } from "next/font/google";
import { eclatsDuMoment, type Moment } from "@/lib/direct/grands-moments";

// (la lettre de BD de la bulle : servie par le site, pas par Google)
const bangers = Bangers({ weight: "400", subsets: ["latin"], display: "swap" });

const CONFETTIS = ["#FF2E9A", "#FFC23D", "#4FD1FF", "#7CFF6B", "#FFFFFF", "#A78BFF"];

export function GrandMoment({ id, m, mot, de, L, H, figure }: { id: string; m: Moment; mot: string; de: { x: number; y: number; h: number }; L: number; H: number; figure: (hauteur: number) => ReactNode }) {
  // (sa taille au centre : les trois quarts de la pièce, la place de la bulle au-dessus)
  const hs = Math.max(de.h, Math.round(Math.min(H * 0.74, H - 66)));
  const bas = 4;
  const eclats = useMemo(() => eclatsDuMoment(m, id, 14, Math.min(170, L * 0.42)), [m, id, L]);
  const confettis = useMemo(
    () =>
      m.confettis
        ? eclatsDuMoment({ ...m, sens: "eventail" }, `${id}·c`, 22, Math.min(190, L * 0.48)).map((x, k) => ({ ...x, c: CONFETTIS[k % CONFETTIS.length], tour: (k * 137) % 720 }))
        : [],
    [m, id, L],
  );
  const vars = {
    left: L / 2,
    bottom: bas,
    height: hs,
    ["--dx" as string]: `${Math.round(de.x - L / 2)}px`,
    ["--dy" as string]: `${Math.round(de.y - (H - bas))}px`,
    ["--k" as string]: (de.h / hs).toFixed(3),
    ["--c" as string]: m.couleur,
  } as CSSProperties;
  const centre = { left: L / 2, bottom: bas + hs * 0.55 };
  return (
    <div className={`gm${m.secoue ? " secoue" : ""}`} data-grand-moment={m.cle} data-pop={m.cle} aria-hidden="true" style={{ ["--c" as string]: m.couleur } as CSSProperties}>
      <span className="gm-voile" />
      {m.rayons && <span className="gm-rayons" style={{ left: L / 2, bottom: bas + hs * 0.45 }} />}
      <span className="gm-star" style={vars}>
        <span className="gm-aura" />
        <span className={`gm-fig ${m.geste}`}>{figure(hs)}</span>
        {m.nuage && <span className="gm-nuage">{m.nuage}</span>}
      </span>
      <span className="gm-bulle" data-bulle-moment style={{ left: L / 2, bottom: bas + hs + 8, maxWidth: Math.round(L * 0.86), fontFamily: bangers.style.fontFamily }}>
        {mot}
      </span>
      {eclats.map((x, k) => (
        <i
          key={k}
          className={`gm-eclat${m.sens === "tombe" ? " tombe" : ""}`}
          style={{ ...centre, fontSize: x.taille, animationDelay: `${420 + x.retard}ms`, animationDuration: `${x.duree}ms`, ["--px" as string]: `${x.x}px`, ["--py" as string]: `${x.y}px` } as CSSProperties}
        >
          {x.e}
        </i>
      ))}
      {confettis.map((x, k) => (
        <i key={`c${k}`} className="gm-confetti" style={{ ...centre, background: x.c, animationDelay: `${380 + x.retard}ms`, animationDuration: `${x.duree + 400}ms`, ["--px" as string]: `${x.x}px`, ["--py" as string]: `${Math.abs(x.y) * 0.6 + 40}px`, ["--tour" as string]: `${x.tour}deg` } as CSSProperties} />
      ))}
      <style>{STYLES_GRAND_MOMENT}</style>
    </div>
  );
}

export const STYLES_GRAND_MOMENT = `
.gm{position:absolute;inset:0;pointer-events:none;z-index:950;overflow:hidden}
.gm.secoue{animation:gm-secoue .42s linear .45s 1}
.gm-voile{position:absolute;inset:0;background:radial-gradient(70% 62% at 50% 72%,color-mix(in srgb,var(--c) 38%,transparent),transparent 72%);animation:gm-apparait .35s ease-out both}
.gm-rayons{position:absolute;width:640px;height:640px;margin-left:-320px;margin-bottom:-320px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.17) 0 4deg,transparent 4deg 14deg);mix-blend-mode:screen;animation:gm-tourne 1.4s linear infinite,gm-apparait .4s ease-out both}
.gm-star{position:absolute;display:flex;align-items:flex-end;justify-content:center;transform:translateX(-50%);transform-origin:50% 100%;animation:gm-arrive .55s cubic-bezier(.2,.9,.3,1.25) both}
.gm-aura{position:absolute;left:-28%;right:-28%;bottom:-4%;top:-10%;border-radius:50%;background:radial-gradient(closest-side,var(--c),color-mix(in srgb,var(--c) 40%,transparent) 55%,transparent);filter:blur(16px);animation:gm-aura .9s ease-in-out infinite alternate}
.gm-fig{position:relative;display:block;transform-origin:50% 100%;filter:drop-shadow(0 0 14px color-mix(in srgb,var(--c) 70%,transparent)) drop-shadow(0 10px 14px rgba(0,0,0,.55))}
.gm-fig img{display:block;height:100%;width:auto}
.gm-fig.sautille{animation:gm-sautille .42s ease-in-out .55s 6}
.gm-fig.flotte{animation:gm-flotte .9s ease-in-out .55s 3 alternate}
.gm-fig.bondit{animation:gm-bondit .5s cubic-bezier(.2,.9,.3,1.4) .5s 1}
.gm-fig.tremble{animation:gm-tremble .07s linear .5s 30 alternate}
.gm-fig.affaisse{animation:gm-affaisse .9s ease-out .55s both}
.gm-fig.saute{animation:gm-saute .5s ease-out .55s 4}
.gm-nuage{position:absolute;left:50%;top:-14%;transform:translateX(-50%);font-size:44px;animation:gm-apparait .4s ease-out .4s both}
.gm-bulle{position:absolute;transform:translateX(-50%) rotate(-3deg);font-size:26px;font-weight:400;line-height:1;letter-spacing:.03em;text-align:center;padding:9px 14px 7px;border-radius:16px;border:3px solid #1b0a17;background:var(--c);color:#1b0a17;box-shadow:4px 5px 0 #1b0a17;white-space:normal;overflow-wrap:anywhere;animation:gm-bulle .4s cubic-bezier(.2,.9,.3,1.5) .35s both;z-index:2}
.gm-bulle::after{content:"";position:absolute;left:44%;bottom:-15px;border:8px solid transparent;border-top:13px solid #1b0a17}
.gm-eclat{position:absolute;font-style:normal;line-height:1;opacity:0;transform:translate(-50%,50%) scale(.3);animation-name:gm-eclat;animation-timing-function:cubic-bezier(.15,.7,.3,1);animation-fill-mode:forwards}
.gm-eclat.tombe{animation-name:gm-tombe}
.gm-confetti{position:absolute;width:7px;height:12px;border-radius:2px;opacity:0;animation-name:gm-confetti;animation-timing-function:cubic-bezier(.2,.6,.4,1);animation-fill-mode:forwards}
@keyframes gm-arrive{from{transform:translate(calc(-50% + var(--dx)),var(--dy)) scale(var(--k))}70%{transform:translateX(-50%) scale(1.1)}to{transform:translateX(-50%) scale(1)}}
@keyframes gm-apparait{from{opacity:0}to{opacity:1}}
@keyframes gm-tourne{to{rotate:14deg}}
@keyframes gm-aura{from{transform:scale(.92);opacity:.75}to{transform:scale(1.08);opacity:1}}
@keyframes gm-sautille{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6%) rotate(3deg)}}
@keyframes gm-flotte{from{transform:translateY(0)}to{transform:translateY(-6%)}}
@keyframes gm-bondit{0%{transform:scale(1)}40%{transform:scale(1.12) translateY(-3%)}100%{transform:scale(1)}}
@keyframes gm-tremble{from{transform:translateX(-1.5%)}to{transform:translateX(1.5%)}}
@keyframes gm-affaisse{to{transform:scaleY(.93) translateY(3%)}}
@keyframes gm-saute{0%,100%{transform:translateY(0)}45%{transform:translateY(-11%)}}
@keyframes gm-bulle{from{opacity:0;transform:translateX(-50%) rotate(-3deg) scale(.3)}to{opacity:1;transform:translateX(-50%) rotate(-3deg) scale(1)}}
@keyframes gm-eclat{0%{opacity:0;transform:translate(-50%,50%) scale(.3)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--px)),calc(50% + var(--py))) scale(1)}}
@keyframes gm-tombe{0%{opacity:0;transform:translate(calc(-50% + var(--px) * .3),calc(50% - 90px)) scale(.8)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--px)),calc(50% + var(--py))) scale(1)}}
@keyframes gm-confetti{0%{opacity:1;transform:translate(-50%,-40px) rotate(0)}100%{opacity:0;transform:translate(calc(-50% + var(--px)),var(--py)) rotate(var(--tour))}}
@keyframes gm-secoue{0%,100%{transform:none}20%{transform:translate(-5px,2px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-4px,-2px)}80%{transform:translate(3px,3px)}}
@media (prefers-reduced-motion:reduce){.gm,.gm *{animation:none!important}.gm-eclat,.gm-confetti,.gm-rayons{display:none}.gm-bulle{opacity:1}}
`;
