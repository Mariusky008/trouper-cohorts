"use client";

// 🔎 LA RECHERCHE DU FANTÔME — la vidéo de son monde, ou la scène générique.
//
// « Ne pas utiliser la vidéo vêtements pour toutes les catégories. Prévoir un
// champ de contexte qui choisira l'asset : fashion_beauty, food, going_out,
// generic. Si nous n'avons pas encore les assets correspondants, utiliser
// generic hors mode plutôt que montrer des vêtements à quelqu'un qui cherche
// un restaurant. »
//
// AUJOURD'HUI, UNE SEULE VIDÉO EXISTE : celle des vêtements (`recherche`).
// Les trois autres contextes jouent LA SCÈNE GÉNÉRIQUE : le Fantôme à la
// loupe, et des cartes de commerces qui apparaissent, qu'il passe en revue,
// puis il s'arrête sur l'une d'elles. Ni photo ni nom : ce sont des cartes
// abstraites, dont seule l'icône dit le monde du salon (un plat, un verre,
// une boutique) — rien n'y est prétendu trouvé.
//
// UNE NOUVELLE VIDÉO (`recherche-food`, par exemple) : la déposer dans
// `public/direct/videos` avec ses images de début et de fin, l'ajouter à
// `NomVideo`, puis à `VIDEO_DE_RECHERCHE` ci-dessous. Rien d'autre à toucher.
//
// MÊMES RÈGLES QUE LES VIDÉOS : une seule fois, sans son, la dernière image
// reste ; au mouvement réduit, la scène est posée directement sur sa fin.

import { useEffect, useState, type CSSProperties } from "react";
import type { ContexteRecherche } from "@/lib/direct/contexte-recherche";
import { mouvementReduit, StylesVideoFantome, VideoFantome, type Legende, type NomVideo } from "./video-fantome";

/** La vidéo de chaque contexte, quand elle existe ; sinon, la scène générique. */
const VIDEO_DE_RECHERCHE: Record<ContexteRecherche, NomVideo | null> = {
  fashion_beauty: "recherche",
  food: null,
  going_out: null,
  generic: null,
};

/** Les icônes des cartes de la scène générique, selon le monde du salon. */
const ICONES: Record<ContexteRecherche, string[]> = {
  fashion_beauty: ["👗", "💇", "💅", "💍", "👜", "🕶️"],
  food: ["🍝", "🥐", "🍣", "☕", "🍷", "🍰"],
  going_out: ["🍸", "🎵", "🎟️", "🌙", "🎤", "🍻"],
  generic: ["🛍️", "💐", "📚", "✂️", "🍽️", "🎵"],
};

/** Où flottent les six cartes (en % du cadre), et celle où il s'arrête. */
const PLACES: [number, number][] = [
  [8, 9],
  [38, 5],
  [68, 11],
  [55, 33],
  [79, 41],
  [27, 28],
];
const CHOISIE = 3;
/** La durée de la vidéo, que la scène reprend pour que les mots tombent pareil. */
const DUREE = 5.17;

export function RechercheFantome({
  contexte,
  legendes,
  jusqua,
  classe,
}: {
  contexte: ContexteRecherche;
  legendes: Legende[];
  /** S'arrêter avant la fin (en secondes) — la recherche raccourcie. */
  jusqua?: number;
  classe?: string;
}) {
  const video = VIDEO_DE_RECHERCHE[contexte];
  if (video) return <VideoFantome nom={video} classe={classe} jusqua={jusqua} legendes={legendes} />;
  return <SceneRecherche icones={ICONES[contexte]} legendes={legendes} duree={jusqua ?? DUREE} classe={classe} />;
}

function SceneRecherche({ icones, legendes, duree, classe }: { icones: string[]; legendes: Legende[]; duree: number; classe?: string }) {
  /* Montée seulement après un geste (« Avec ClikMe ») : jamais rendue par le
     serveur, la préférence se lit donc dès le premier rendu. */
  const [fige] = useState(mouvementReduit);
  const [t, setT] = useState(() => (fige ? duree : 0));
  useEffect(() => {
    if (fige) return;
    const debut = performance.now();
    const minuteur = window.setInterval(() => {
      const tt = (performance.now() - debut) / 1000;
      setT(Math.min(tt, duree));
      if (tt >= duree) window.clearInterval(minuteur);
    }, 100);
    return () => window.clearInterval(minuteur);
  }, [fige, duree]);
  /* LA LIGNE DU MOMENT : la dernière dont l'heure est passée — comme la vidéo. */
  const visibles = legendes.filter((l) => t >= l.a);
  const ligne = visibles[visibles.length - 1];
  /* UNE SEULE ÉCHELLE DE TEMPS : la scène raccourcie joue la même chose, plus vite. */
  const k = duree / DUREE;
  return (
    <div className={`vf rf${fige ? " fige" : ""}${classe ? ` ${classe}` : ""}`} style={{ "--k": k } as CSSProperties}>
      <StylesVideoFantome />
      <StylesScene />
      <div className="rf-fond" aria-hidden="true" />
      {PLACES.map(([x, y], i) => (
        <span
          key={i}
          className={`rf-carte${i === CHOISIE ? " choisie" : ""}`}
          style={{ left: `${x}%`, top: `${y}%`, "--i": i } as CSSProperties}
          aria-hidden="true"
        >
          <i>{icones[i % icones.length]}</i>
          <s />
          <s />
        </span>
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="rf-fantome" src="/direct/fantome-humeurs/fantome-searching.webp" alt="" />
      {ligne && (
        <p key={legendes.indexOf(ligne)} className="vf-legende">
          {ligne.texte}
        </p>
      )}
    </div>
  );
}

function StylesScene() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.rf .rf-fond{position:absolute;inset:0;
  background:radial-gradient(70% 55% at 62% 30%,rgba(246,181,75,.22),transparent 70%),
    radial-gradient(60% 50% at 20% 85%,rgba(255,138,76,.16),transparent 70%),
    linear-gradient(180deg,#2A1A10,#1A120D 70%);}
.rf .rf-fond::before,.rf .rf-fond::after{content:"";position:absolute;border-radius:50%;filter:blur(2px);
  background:rgba(255,214,150,.35);width:6px;height:6px;}
.rf .rf-fond::before{left:18%;top:62%;box-shadow:140px -120px 0 rgba(255,214,150,.25),220px 40px 0 rgba(255,214,150,.2);}
.rf .rf-fond::after{left:84%;top:74%;box-shadow:-60px -230px 0 rgba(255,214,150,.22);}
.rf-carte{position:absolute;z-index:1;width:21%;aspect-ratio:3 / 4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
  border-radius:12px;border:1.5px solid rgba(255,214,150,.55);background:linear-gradient(160deg,rgba(255,244,230,.16),rgba(255,244,230,.05));
  box-shadow:0 0 14px rgba(246,181,75,.25);opacity:0;
  animation:rfVient calc(.45s * var(--k)) ease calc((.15s + var(--i) * .2s) * var(--k)) forwards,
    rfRevue calc(.38s * var(--k)) ease calc((1.6s + var(--i) * .36s) * var(--k)) 1,
    rfEteint calc(.5s * var(--k)) ease calc(3.9s * var(--k)) forwards;}
.rf-carte.choisie{animation:rfVient calc(.45s * var(--k)) ease calc((.15s + var(--i) * .2s) * var(--k)) forwards,
    rfRevue calc(.38s * var(--k)) ease calc((1.6s + var(--i) * .36s) * var(--k)) 1,
    rfChoisie calc(.5s * var(--k)) ease calc(3.9s * var(--k)) forwards;}
.rf-carte i{font-style:normal;font-size:clamp(18px,6vw,28px);line-height:1;}
.rf-carte s{display:block;width:62%;height:4px;border-radius:4px;background:rgba(255,244,230,.28);}
.rf-carte s+s{width:42%;background:rgba(255,244,230,.18);}
.rf-fantome{position:absolute;z-index:1;left:-3%;bottom:18%;width:60%;height:auto;pointer-events:none;
  filter:drop-shadow(0 10px 24px rgba(0,0,0,.45));
  animation:rfFlotte calc(1.3s * var(--k)) ease-in-out 0s 4 alternate;}
@keyframes rfVient{from{opacity:0;transform:translateY(10px) scale(.9)}to{opacity:1;transform:none}}
@keyframes rfRevue{0%,100%{transform:none}50%{transform:scale(1.1);box-shadow:0 0 26px rgba(246,181,75,.7);border-color:#F6B54B}}
@keyframes rfEteint{from{opacity:1}to{opacity:.38;transform:scale(.94)}}
@keyframes rfChoisie{from{opacity:1}to{opacity:1;transform:scale(1.16);border-color:#F6B54B;border-width:2px;
  box-shadow:0 0 0 3px rgba(246,181,75,.25),0 0 34px rgba(246,181,75,.8)}}
@keyframes rfFlotte{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-8px) rotate(2deg)}}
.rf.fige .rf-carte,.rf.fige .rf-fantome{animation:none;opacity:.38;transform:scale(.94);}
.rf.fige .rf-fantome{opacity:1;transform:none;}
.rf.fige .rf-carte.choisie{opacity:1;transform:scale(1.16);border-color:#F6B54B;box-shadow:0 0 34px rgba(246,181,75,.8);}
`,
      }}
    />
  );
}
