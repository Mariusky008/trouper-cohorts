"use client";
// 👻 LE FANTÔME ANIMÉ — douze expressions dessinées, un mouvement par humeur,
// et le clignement au repos. Sorti du duel (`duel-salon.tsx`) pour vivre aussi
// dans Ma Maison : un seul Fantôme dans toute l'application.
//
// LE STYLE VOYAGE AVEC LUI (`CSS_FANTOME`) : qui l'affiche pose
// `<StylesFantome />`, ou glisse la chaîne dans sa propre feuille.
import { useEffect } from "react";
import type { Humeur } from "@/lib/direct/fantome-salon";

// ─── 👻 LE FANTÔME ANIMÉ ────────────────────────────────────────────────────

/**
 * UNE EXPRESSION DESSINÉE PAR HUMEUR. Les douze dessins sont calés sur la
 * même toile : même taille de corps, même pied, même centre — il change de
 * tête sans sauter. La toile déborde la boîte de 21 % de chaque côté, pour
 * que la loupe ou le bras tendu sortent sans rapetisser le corps.
 */
const DESSINS = "/direct/fantome-humeurs";
const IMAGE_HUMEUR: Record<Humeur, string> = {
  idle: `${DESSINS}/fantome-idle.webp`,
  curious: `${DESSINS}/fantome-curious.webp`,
  thinking: `${DESSINS}/fantome-thinking.webp`,
  searching: `${DESSINS}/fantome-searching.webp`,
  excited: `${DESSINS}/fantome-excited.webp`,
  love: `${DESSINS}/fantome-love.webp`,
  surprised: `${DESSINS}/fantome-surprised.webp`,
  pointing: `${DESSINS}/fantome-pointing.webp`,
  whisper: `${DESSINS}/fantome-whisper.webp`,
  celebrate: `${DESSINS}/fantome-celebrate.webp`,
  urgent: `${DESSINS}/fantome-urgent.webp`,
  quiet: `${DESSINS}/fantome-quiet.webp`,
};
/** La pose neutre, yeux fermés : elle passe un instant par-dessus pour le clignement. */
const CLIGNE = `${DESSINS}/fantome-idle-cligne.webp`;
/** La pose neutre cadrée comme l'ancienne image : le petit rond devant « ClikMe » dans le fil. */
export const FANTOME_AVATAR = `${DESSINS}/fantome-avatar.webp`;

/**
 * CHARGER LES DOUZE TÊTES DÈS LE PREMIER FANTÔME : sans ça, la première fois
 * qu'il change d'humeur, l'image arrive en retard et il disparaît un instant.
 */
let dessinsCharges = false;
function chargerLesDessins() {
  if (dessinsCharges || typeof window === "undefined") return;
  dessinsCharges = true;
  for (const src of [...Object.values(IMAGE_HUMEUR), CLIGNE]) {
    const im = new Image();
    im.decoding = "async";
    im.src = src;
  }
}

/**
 * LE FANTÔME DE CLIKME, DANS L'HUMEUR DU MOMENT. Une tête dessinée par
 * humeur, et par-dessus le mouvement, les bulles et les accessoires — il
 * réagit à l'action, il ne la cache pas.
 */
export function FantomeAnime({
  humeur,
  taille = 96,
  accessoire,
  classe,
}: {
  humeur: Humeur;
  taille?: number;
  accessoire?: "porte-voix" | "couronne" | "question" | "valide";
  classe?: string;
}) {
  const src = IMAGE_HUMEUR[humeur];
  useEffect(chargerLesDessins, []);
  return (
    <span
      className={`fa fa-${humeur}${classe ? ` ${classe}` : ""}`}
      style={{ width: taille, height: Math.round(taille * 0.92), ["--t" as string]: `${taille}px` }}
      aria-hidden="true"
    >
      {/* L'OMBRE AU SOL : elle rétrécit quand il monte — c'est elle qui fait voir le mouvement. */}
      <i className="fa-ombre" />
      {/* LE CORPS, ET CE QU'IL PORTE : la couronne et le porte-voix bougent AVEC lui. */}
      <span className="fa-corps">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={src} src={src} alt="" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {humeur === "idle" && <img className="fa-cligne" src={CLIGNE} alt="" draggable={false} />}
        {accessoire === "couronne" && <i className="fa-acc cr">👑</i>}
        {accessoire === "porte-voix" && <i className="fa-acc pv">📣</i>}
      </span>
      {humeur === "curious" && <i className="fa-bulle">👀</i>}
      {humeur === "thinking" && (
        <i className="fa-bulle pts">
          <b />
          <b />
          <b />
        </i>
      )}
      {humeur === "surprised" && <i className="fa-bulle">!</i>}
      {humeur === "love" && (
        <>
          <i className="fa-coeur c1">❤</i>
          <i className="fa-coeur c2">❤</i>
          <i className="fa-coeur c3">❤</i>
        </>
      )}
      {humeur === "celebrate" && (
        <span className="fa-confettis">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      )}
      {humeur === "urgent" && <i className="fa-halo" />}
      {accessoire === "question" && humeur !== "curious" && humeur !== "surprised" && <i className="fa-bulle q">?</i>}
      {accessoire === "valide" && <i className="fa-bulle ok">✓</i>}
    </span>
  );
}

export const CSS_FANTOME = `
/* 👻 LE FANTÔME ANIMÉ — UN MOUVEMENT DE FOND QUI NE S'ARRÊTE JAMAIS, ET UNE
   ENTRÉE PROPRE À CHAQUE HUMEUR. Avant, la plupart des humeurs jouaient une ou
   deux fois puis le figeaient : sur la carte du résultat, il ne bougeait plus
   au bout d'une seconde. Les amplitudes suivent sa taille (--t). */
.fa{position:relative;display:inline-block;flex:none;}
.fa-ombre{position:absolute;left:24%;right:24%;bottom:-5%;height:9%;border-radius:50%;
  background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));animation:fa-ombre 2.6s ease-in-out infinite;}
@keyframes fa-ombre{0%,100%{transform:scale(1);opacity:.8;}50%{transform:scale(.7);opacity:.4;}}
.fa-corps{position:absolute;inset:0;display:block;transform-origin:50% 92%;animation:fa-respire 2.6s ease-in-out infinite;}
.fa-corps img{position:absolute;inset:-21%;display:block;width:142%;height:142%;max-width:none;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(255,140,220,.3));animation:fa-change .3s ease-out;}
.fa-corps img.fa-cligne{opacity:0;animation:fa-cligne 4.8s linear 1.2s infinite;}
@keyframes fa-cligne{0%,93%,100%{opacity:0;}93.6%,96%{opacity:1;}}
@keyframes fa-change{from{transform:scale(.86);opacity:.3;}to{transform:none;opacity:1;}}
/* LE FOND : il respire — monte en s'étirant, redescend en s'écrasant un peu. */
@keyframes fa-respire{0%,100%{transform:translateY(0) scale(1.035,.965);}50%{transform:translateY(calc(var(--t,96px) * -.09)) scale(.975,1.03);}}
/* CURIEUX : il penche la tête d'un côté, puis de l'autre. */
.fa-curious .fa-corps{animation:fa-penche 2.4s ease-in-out infinite;}
@keyframes fa-penche{0%,100%{transform:rotate(-9deg);}50%{transform:rotate(11deg) translateY(calc(var(--t,96px) * -.06));}}
/* IL RÉFLÉCHIT : la tête de côté, lentement. */
.fa-thinking .fa-corps{animation:fa-pense 3s ease-in-out infinite;}
@keyframes fa-pense{0%,100%{transform:rotate(-10deg);}50%{transform:rotate(-4deg) translateY(calc(var(--t,96px) * -.07));}}
/* IL CHERCHE : la loupe balaie de gauche à droite. */
.fa-searching .fa-corps{animation:fa-cherche 1.5s ease-in-out infinite;}
@keyframes fa-cherche{0%,100%{transform:translateX(calc(var(--t,96px) * -.1)) rotate(-8deg);}50%{transform:translateX(calc(var(--t,96px) * .1)) rotate(8deg);}}
/* EXCITÉ : il sautille tant que ça dure. */
.fa-excited .fa-corps{animation:fa-sautille .62s cubic-bezier(.3,.7,.4,1) infinite;}
.fa-excited .fa-ombre{animation-duration:.62s;}
@keyframes fa-sautille{0%,100%{transform:translateY(0) scale(1.07,.93);}45%{transform:translateY(calc(var(--t,96px) * -.17)) scale(.96,1.05);}}
/* AMOUREUX : son cœur bat — deux pulsations, une pause. */
.fa-love .fa-corps{animation:fa-coeurbat 1.3s ease-in-out infinite;}
@keyframes fa-coeurbat{0%,42%,100%{transform:scale(1);}12%{transform:scale(1.1);}26%{transform:scale(1.04);}}
/* SURPRIS : un sursaut, puis il se reprend et respire. */
.fa-surprised .fa-corps{animation:fa-sursaut .7s cubic-bezier(.2,.8,.3,1) both,fa-respire 2.6s ease-in-out .7s infinite;}
@keyframes fa-sursaut{0%{transform:none;}25%{transform:translateY(calc(var(--t,96px) * -.15)) rotate(-9deg) scale(1.08);}55%{transform:rotate(5deg) scale(.95,1.05);}100%{transform:none;}}
/* IL MONTRE : il se penche vers le challenger, et revient. */
.fa-pointing .fa-corps{animation:fa-montre 1.4s ease-in-out infinite;}
@keyframes fa-montre{0%,100%{transform:rotate(-4deg);}50%{transform:rotate(-14deg) translateX(calc(var(--t,96px) * -.08));}}
/* IL CHUCHOTE : plus petit, penché, presque immobile. */
.fa-whisper .fa-corps{animation:fa-chuchote 3.2s ease-in-out infinite;}
@keyframes fa-chuchote{0%,100%{transform:scale(.92) rotate(8deg);}50%{transform:scale(.92) rotate(4deg) translateY(calc(var(--t,96px) * -.05));}}
/* LA FÊTE : trois bonds avec une vrille, puis il continue de danser. */
.fa-celebrate .fa-corps{animation:fa-bonds 1.8s cubic-bezier(.3,.7,.4,1) both,fa-danse 1.6s ease-in-out 1.8s infinite;}
@keyframes fa-bonds{0%,33%,66%,100%{transform:translateY(0) scale(1.07,.93);}16%{transform:translateY(calc(var(--t,96px) * -.22)) rotate(-10deg);}50%{transform:translateY(calc(var(--t,96px) * -.18)) rotate(10deg);}83%{transform:translateY(calc(var(--t,96px) * -.25)) scale(.95,1.06);}}
@keyframes fa-danse{0%,100%{transform:rotate(-7deg);}50%{transform:rotate(7deg) translateY(calc(var(--t,96px) * -.08));}}
/* URGENT : il tremble. */
.fa-urgent .fa-corps{animation:fa-tremble .35s ease-in-out infinite;}
@keyframes fa-tremble{0%,100%{transform:translateX(0);}25%{transform:translateX(-3px) rotate(-2deg);}75%{transform:translateX(3px) rotate(2deg);}}
/* DISCRET, quand les humains parlent : il s'efface, mais respire toujours. */
.fa-quiet{opacity:.6;}
.fa-quiet .fa-corps{animation-duration:4.4s;}
.fa-halo{position:absolute;inset:-8%;border-radius:50%;box-shadow:0 0 0 2px rgba(255,170,60,.55),0 0 22px rgba(255,170,60,.55);}
.fa-bulle{position:absolute;top:-6%;right:-10%;display:grid;place-items:center;min-width:26px;height:26px;padding:0 6px;border-radius:13px;
  font-style:normal;font-size:14px;font-weight:900;color:#2A1608;background:#FFF4E6;box-shadow:0 4px 12px rgba(0,0,0,.35);animation:fa-pop .35s ease-out both;}
.fa-bulle.q{color:#F6B54B;background:#2a1a0f;border:1.5px solid rgba(246,181,75,.8);font-size:16px;}
.fa-bulle.ok{color:#fff;background:#3DAA6A;}
.fa-bulle.pts{gap:3px;display:flex;align-items:center;padding:0 7px;}
.fa-bulle.pts b{width:4px;height:4px;border-radius:50%;background:#7a5a3a;animation:fa-pt 1.2s ease-in-out infinite;}
.fa-bulle.pts b:nth-child(2){animation-delay:.2s;}.fa-bulle.pts b:nth-child(3){animation-delay:.4s;}
@keyframes fa-pt{0%,100%{opacity:.3;}50%{opacity:1;}}
@keyframes fa-pop{from{transform:scale(.4);opacity:0;}to{transform:scale(1);opacity:1;}}
.fa-coeur{position:absolute;font-style:normal;color:#FF5FA8;font-size:calc(var(--t,96px) * .17);animation:fa-monte 1.9s ease-out infinite;}
.fa-coeur.c1{right:4%;top:18%;}
.fa-coeur.c2{right:-8%;top:36%;font-size:calc(var(--t,96px) * .12);animation-delay:.65s;}
.fa-coeur.c3{left:0;top:28%;font-size:calc(var(--t,96px) * .13);animation-delay:1.25s;}
@keyframes fa-monte{0%{transform:translateY(0) scale(.6);opacity:0;}20%{opacity:1;}100%{transform:translateY(calc(var(--t,96px) * -.35)) scale(1);opacity:0;}}
.fa-confettis{position:absolute;inset:-10%;pointer-events:none;}
.fa-confettis i{position:absolute;left:50%;top:40%;width:6px;height:9px;border-radius:2px;background:#F6B54B;animation:fa-eclat 1.3s ease-out 3 both;}
.fa-confettis i:nth-child(3n){background:#FF5FA8;}.fa-confettis i:nth-child(3n+1){background:#FFE3BD;}
${Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `.fa-confettis i:nth-child(${i + 1}){--x:${Math.round(Math.cos(a) * 62)}px;--y:${Math.round(Math.sin(a) * 52 - 12)}px;animation-delay:${(i % 3) * 0.09}s;}`;
}).join("")}
@keyframes fa-eclat{from{transform:translate(0,0) rotate(0);opacity:1;}to{transform:translate(var(--x),var(--y)) rotate(220deg);opacity:0;}}
/* LES ACCESSOIRES SONT DANS LE CORPS : ils bougent avec lui. La couronne se pose
   SUR la casquette (son sommet est au milieu, à 3 % du haut de l'image) — elle
   flottait au-dessus, détachée. */
.fa-acc{position:absolute;font-style:normal;line-height:1;pointer-events:none;}
.fa-acc.cr{left:50%;top:0;font-size:calc(var(--t,96px) * .3);transform:translate(-44%,-60%) rotate(10deg);
  filter:drop-shadow(0 3px 4px rgba(0,0,0,.45));animation:fa-couronne .55s cubic-bezier(.3,1.4,.5,1) both;}
@keyframes fa-couronne{from{transform:translate(-44%,-190%) rotate(-20deg);opacity:0;}to{transform:translate(-44%,-60%) rotate(10deg);opacity:1;}}
.fa-acc.pv{right:-16%;top:26%;font-size:calc(var(--t,96px) * .3);transform:rotate(-12deg);transform-origin:0 50%;animation:fa-crie 1.1s ease-in-out infinite;}
@keyframes fa-crie{0%,100%{transform:rotate(-12deg) scale(1);}50%{transform:rotate(-18deg) scale(1.12);}}
@media (prefers-reduced-motion: reduce){
  .fa-corps,.fa-corps img,.fa-ombre,.fa-acc,.fa-coeur,.fa-confettis i,.fa-bulle,.fa-bulle.pts b{animation:none !important;}
  .fa-confettis{display:none;}
}
`;

export function StylesFantome() {
  return <style dangerouslySetInnerHTML={{ __html: CSS_FANTOME }} />;
}
