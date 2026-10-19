"use client";

// 👖 ELLE, AVEC SON JEAN ET LA PIÈCE — l'avant et le look, l'un sur l'autre.
//
// « On voit la personne réellement avec son propre jean et le pull de Lili
// Ross. » La même photo deux fois : l'avant (la personne de l'essai, dans ses
// vêtements) et le look rendu par le moteur (voir `LookVitrine`), aux mêmes
// dimensions — ils se superposent au pixel près, et un balayage passe de l'un
// à l'autre. Servi à l'étape 2 (la garde-robe) et à l'étape 3 (Ma Maison).
//
// L'ÉCRAN DIT CE QUE C'EST : un rendu indicatif, sur une personne de
// démonstration. Le haut, lui, est le sien — ou l'exemple, dit comme tel.
//
// AUCUN MINUTEUR : tout se joue en CSS, à partir de `delai` (en secondes).
import type { CSSProperties } from "react";
import type { LookVitrineCarte } from "@/lib/site-internet/essai-vitrine-donnees";

export function LookSurElle({ look, delai = 0, classe = "" }: { look: LookVitrineCarte; delai?: number; classe?: string }) {
  if (!look.apres) return null;
  return (
    <figure className={`ls ${classe}`} style={{ "--ls-d": `${delai}s` } as CSSProperties} aria-label={`Sur elle : son jean et ${look.nom.toLowerCase()}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ls-av" src={look.avant} alt="" />
      <span className="ls-ap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={look.apres} alt="" />
      </span>
      <i className="ls-scan" aria-hidden="true" />
      <span className="ls-k av">Sa photo</span>
      <span className="ls-k ap">Avec son jean ✨</span>
      <StylesLook />
    </figure>
  );
}

function StylesLook() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ls{position:relative;margin:0;aspect-ratio:2 / 3;overflow:hidden;border-radius:16px;background:#1A120D;isolation:isolate;
  box-shadow:0 18px 40px rgba(0,0,0,.4);}
.ls img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.ls-ap{position:absolute;inset:0;clip-path:inset(0 100% 0 0);
  animation:lsBalaie 1.3s cubic-bezier(.65,0,.3,1) calc(var(--ls-d) + .8s) forwards;}
.ls-scan{position:absolute;top:0;bottom:0;left:0;width:3px;z-index:2;opacity:0;
  background:linear-gradient(180deg,transparent,#fff 18%,#FFD9EC 50%,#fff 82%,transparent);
  box-shadow:0 0 18px 4px rgba(255,79,160,.65);
  animation:lsScan 1.3s cubic-bezier(.65,0,.3,1) calc(var(--ls-d) + .8s) forwards;}
.ls-k{position:absolute;left:10px;top:10px;z-index:3;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
  color:#fff;background:rgba(18,12,9,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
.ls-k.av{animation:lsSort .3s ease calc(var(--ls-d) + 1.5s) forwards;}
.ls-k.ap{opacity:0;background:linear-gradient(90deg,#FF4FA0,#F5A23A);
  animation:lsEntre .4s cubic-bezier(.34,1.5,.64,1) calc(var(--ls-d) + 2s) forwards;}
.ls-ex{position:absolute;left:50%;bottom:9px;z-index:3;transform:translateX(-50%);white-space:nowrap;padding:3px 9px;border-radius:7px;
  font-size:10.5px;font-weight:700;color:#FFF4E6;background:rgba(18,12,9,.6);}
@keyframes lsBalaie{to{clip-path:inset(0 0 0 0)}}
@keyframes lsScan{0%{opacity:0;left:0}12%{opacity:1}88%{opacity:1}100%{opacity:0;left:100%}}
@keyframes lsSort{to{opacity:0;transform:translateY(-4px)}}
@keyframes lsEntre{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
  .ls-ap{animation:none;clip-path:none;}
  .ls-scan,.ls-k.av{display:none;}
  .ls-k.ap{animation:none;opacity:1;}
}
`,
      }}
    />
  );
}
