"use client";

/**
 * 🎭 LA CONVERSATION VIVANTE, À L'ÉCRAN — lot R4a (`lib/direct/vivant.ts` pour la règle) : ce que `proches.tsx` ajoute à
 * la scène de leurs deux figurines.
 *   · `useVivant` : la conversation se relit toutes les 4 s (page visible) — s'il prépare un message, leurs gestes, un
 *     nouveau message (elle se relit, et les figurines sursautent) ;
 *   · `useAppuiLong` : un appui long sur un message (ou le clic droit) ouvre les réactions ;
 *   · `FeuillePanneaux`, `FeuilleReactions` : les huit panneaux, les six réactions ;
 *   · `Calque` : par-dessus chaque figurine, « … » (il prépare un message), le panneau brandi, l'éclat d'une réaction,
 *     les zZz, et 🎭 sa bulle d'aparté (lot R4b) ;
 *   · `STYLES_VIVANT` : les postures (s'occuper, danser, s'affaler, bras croisés, dormir, se pencher, sursauter) — avec
 *     `rotate` et `translate`, qui s'ajoutent aux transformations de la scène sans les défaire.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Feuille } from "./ma-figurine";
import { PANNEAUX, REACTIONS, RELIRE_MS, panneauDe, reactionDe, type AparteVue, type GesteFil, type Posture, type Vivant } from "@/lib/direct/vivant";

/** 🎭 La conversation vivante, relue toutes les quelques secondes (page visible). */
export function useVivant(cle: string, dernierConnu: number, rappels: { onNouveau: () => void; onGestes: (g: GesteFil[]) => void; onAparte: (a: AparteVue) => void }) {
  const [vivant, setVivant] = useState<Vivant | null>(null);
  const vus = useRef<Set<string> | null>(null);
  const apartesVus = useRef<Set<string> | null>(null);
  const connu = useRef(dernierConnu);
  const r = useRef(rappels);
  useEffect(() => {
    r.current = rappels;
  });
  useEffect(() => {
    connu.current = Math.max(connu.current, dernierConnu);
  }, [dernierConnu]);
  useEffect(() => {
    let fini = false;
    const lire = () => {
      if (document.visibilityState === "hidden") return;
      fetch(`/api/direct/proches?vivant=${cle}`, { cache: "no-store" })
        .then((x) => x.json())
        .then((j: { vivant?: Vivant }) => {
          if (fini || !j.vivant) return;
          const v = j.vivant;
          if (!vus.current) {
            vus.current = new Set(v.gestes.map((g) => g.id));
            // (à l'ouverture : son dernier panneau des douze dernières heures, s'il est la dernière chose qu'il a faite)
            const d = v.gestes[v.gestes.length - 1];
            if (d && !d.moi && d.type === "panneau" && Date.now() - Date.parse(d.le) < 12 * 3_600_000) r.current.onGestes([d]);
          } else {
            const neufs = v.gestes.filter((g) => !vus.current!.has(g.id));
            neufs.forEach((g) => vus.current!.add(g.id));
            const deLui = neufs.filter((g) => !g.moi);
            if (deLui.length) r.current.onGestes(deLui);
          }
          // 🎭 un aparté tout neuf (pas ceux d'avant l'ouverture) : leurs figurines le jouent
          const apartes = Array.isArray(v.apartes) ? v.apartes : [];
          if (!apartesVus.current) apartesVus.current = new Set(apartes.map((a) => a.id));
          else {
            const neuf = apartes.filter((a) => !apartesVus.current!.has(a.id));
            neuf.forEach((a) => apartesVus.current!.add(a.id));
            if (neuf.length) r.current.onAparte(neuf[neuf.length - 1]);
          }
          // (un message arrivé depuis : elle se relit — une seule fois par message)
          if (v.dernier > connu.current) {
            const avant = connu.current;
            connu.current = v.dernier;
            if (avant > 0) r.current.onNouveau();
          }
          setVivant({ ...v, apartes });
        })
        .catch(() => undefined);
    };
    lire();
    const t = window.setInterval(lire, RELIRE_MS);
    return () => {
      fini = true;
      window.clearInterval(t);
    };
  }, [cle]);
  /** Son propre geste, posé tout de suite (une réaction remplace la sienne sur ce message). */
  const ajouter = useCallback((g: GesteFil) => {
    vus.current?.add(g.id);
    setVivant((v) =>
      v
        ? {
            ...v,
            gestes: [
              ...v.gestes.filter((x) => !(x.id.startsWith("tmp-") && x.type === g.type && x.cle === g.cle && x.message === g.message) && !(g.type === "reaction" && x.type === "reaction" && x.moi && x.message === g.message && x.id !== g.id)),
              ...(v.gestes.some((x) => x.id === g.id) ? [] : [g]),
            ],
          }
        : v,
    );
  }, []);
  /** Un geste provisoire qui n'est pas parti : il s'en va. */
  const retirer = useCallback((id: string) => setVivant((v) => (v ? { ...v, gestes: v.gestes.filter((x) => x.id !== id) } : v)), []);
  /** 🎭 Un aparté effacé : il s'en va (pour les deux). */
  const sansAparte = useCallback((id: string) => setVivant((v) => (v ? { ...v, apartes: v.apartes.filter((a) => a.id !== id) } : v)), []);
  return [vivant, ajouter, retirer, sansAparte] as const;
}

/** 👆 Un appui long (une demi-seconde) ou le clic droit ; `etaitLong()` : le clic qui suit ne joue pas le message. */
export function useAppuiLong(onLong: (id: string) => void) {
  const t = useRef(0);
  const long = useRef(false);
  const stop = () => window.clearTimeout(t.current);
  const props = (id: string) => ({
    onPointerDown: () => {
      long.current = false;
      stop();
      t.current = window.setTimeout(() => {
        long.current = true;
        onLong(id);
      }, 500);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      stop();
      long.current = true;
      onLong(id);
    },
  });
  const etaitLong = () => {
    const l = long.current;
    long.current = false;
    return l;
  };
  return { props, etaitLong };
}

/** 🪧 Les huit panneaux : un toucher, sa figurine le brandit, chez les deux. */
export function FeuillePanneaux({ ouverte, prenom, onFermer, onChoisi }: { ouverte: boolean; prenom: string; onFermer: () => void; onChoisi: (cle: string) => void }) {
  return (
    <Feuille ouverte={ouverte} onFermer={onFermer} titre="Brandir un panneau" className="pv-feuille">
      <b className="pv-feuille-titre">🪧 Ta figurine brandit…</b>
      <p className="pv-feuille-dit">{prenom} le voit tout de suite, sans que tu aies à parler.</p>
      <div className="pv-panneaux">
        {PANNEAUX.map((p) => (
          <button key={p.cle} type="button" data-panneau={p.cle} onClick={() => onChoisi(p.cle)}>
            {p.texte}
          </button>
        ))}
      </div>
    </Feuille>
  );
}

/** 👏 Les six réactions avec le corps (un appui long sur un message). */
export function FeuilleReactions({ ouverte, onFermer, onChoisi }: { ouverte: boolean; onFermer: () => void; onChoisi: (cle: string) => void }) {
  return (
    <Feuille ouverte={ouverte} onFermer={onFermer} titre="Réagir avec ta figurine" className="pv-feuille">
      <b className="pv-feuille-titre">Ta figurine réagit</b>
      <div className="pv-reactions">
        {REACTIONS.map((r) => (
          <button key={r.cle} type="button" data-reaction={r.cle} onClick={() => onChoisi(r.cle)}>
            <span aria-hidden="true">{r.emoji}</span>
            <small>{r.nom}</small>
          </button>
        ))}
      </div>
    </Feuille>
  );
}

/** Ce qui se passe par-dessus une figurine, un instant : un panneau, ou une réaction. */
export type Anim = { qui: "moi" | "lui"; geste: GesteFil; n: number };

/** Par-dessus chaque figurine : « … », le panneau, l'éclat d'une réaction, les zZz. */
export function Calque({
  qui,
  style,
  prepare,
  anim,
  posture,
  aparte = null,
}: {
  qui: "moi" | "lui";
  style?: CSSProperties;
  prepare: boolean;
  anim: Anim | null;
  posture: Posture | "prepare";
  aparte?: { texte: string; second: boolean; n: string } | null;
}) {
  const a = anim?.qui === qui ? anim : null;
  const panneau = a?.geste.type === "panneau" ? panneauDe(a.geste.cle) : null;
  const reaction = a?.geste.type === "reaction" ? reactionDe(a.geste.cle) : null;
  return (
    <div className={`pv-calque ${qui}`} style={style} aria-hidden="true" data-qui={qui}>
      {prepare && (
        <span className="pv-prepare">
          <i />
          <i />
          <i />
        </span>
      )}
      {panneau && (
        <span key={a!.n} className="pv-panneau">
          {panneau.texte}
        </span>
      )}
      {reaction && (
        <span key={a!.n} className="pv-eclat">
          <i>{reaction.emoji}</i>
          <i>{reaction.emoji}</i>
          <i>{reaction.emoji}</i>
        </span>
      )}
      {aparte && (
        <span key={aparte.n} className={`pv-aparte${aparte.second ? " second" : ""}`}>
          {aparte.texte}
        </span>
      )}
      {posture === "dort" && !aparte && <span className="pv-zzz">z z Z</span>}
      {posture === "bras" && <span className="pv-boude">😤</span>}
    </div>
  );
}

export const STYLES_VIVANT = `
.pv-calque{position:absolute;top:14px;bottom:0;z-index:3;width:46%;pointer-events:none}
.pv-calque.lui{left:2%}
.pv-calque.moi{right:2%}
.pr-scene.chez .pv-calque{top:auto;width:auto;aspect-ratio:2/3;transform:translateX(-50%)}
.pv-prepare{position:absolute;left:58%;top:6%;display:flex;gap:4px;padding:9px 12px;border-radius:16px 16px 16px 4px;background:#FFF4E6;box-shadow:0 6px 16px rgba(0,0,0,.35);animation:pv-pop .35s cubic-bezier(.2,1.6,.4,1) both}
.pv-prepare i{width:7px;height:7px;border-radius:50%;background:#B0386F;animation:pv-point 1.2s ease-in-out infinite}
.pv-prepare i:nth-child(2){animation-delay:.18s}
.pv-prepare i:nth-child(3){animation-delay:.36s}
.pv-panneau{position:absolute;left:50%;top:2%;z-index:2;translate:-50% 0;max-width:150%;padding:8px 14px;border-radius:10px;background:#FFF4E6;color:#2A1220;font-size:17px;font-weight:900;white-space:nowrap;box-shadow:0 0 0 3px #F2C46B,0 10px 22px rgba(0,0,0,.4);animation:pv-brandit 4s cubic-bezier(.2,1.4,.4,1) both}
.pv-panneau::after{content:"";position:absolute;left:50%;top:100%;width:5px;height:34px;margin-left:-2.5px;border-radius:3px;background:#8A5A2B}
.pv-eclat{position:absolute;left:50%;top:22%;translate:-50% 0;display:flex;gap:6px}
.pv-eclat i{font-style:normal;font-size:30px;animation:pv-eclat 1.8s ease-out both}
.pv-eclat i:nth-child(2){animation-delay:.12s;font-size:38px}
.pv-eclat i:nth-child(3){animation-delay:.24s}
.pv-zzz{position:absolute;left:60%;top:8%;color:#D9E6FA;font-weight:900;font-size:18px;letter-spacing:4px;animation:pv-zzz 2.4s ease-in-out infinite}
.pv-aparte{position:absolute;left:50%;top:0;z-index:3;translate:-50% 0;width:max-content;max-width:min(64vw,230px);padding:8px 11px;border-radius:14px;background:#FFF4E6;color:#2A1220;font-size:13px;font-weight:800;line-height:1.3;text-align:center;box-shadow:0 8px 18px rgba(0,0,0,.4);animation:pv-aparte 9s cubic-bezier(.2,1.4,.4,1) both}
.pv-aparte::after{content:"";position:absolute;left:50%;top:100%;margin-left:-7px;border:7px solid transparent;border-top-color:#FFF4E6}
.pv-aparte.second{top:16%;animation-delay:1.6s}
.pv-calque.lui .pv-aparte{left:0;translate:none;max-width:min(60vw,215px)}
.pv-calque.moi .pv-aparte{left:auto;right:0;translate:none;max-width:min(60vw,215px)}
.pv-calque.lui .pv-aparte::after{left:32%}
.pv-calque.moi .pv-aparte::after{left:auto;right:32%;margin-left:0;margin-right:-7px}
.pr-scene.chez .pv-calque .pv-aparte{left:50%;right:auto;translate:-50% 0}
.pr-scene.chez .pv-calque .pv-aparte::after{left:50%;right:auto;margin-left:-7px;margin-right:0}
.pr-fil li.pv-aparte-fil{justify-content:center}
.pr-fil li.pv-aparte-fil > div{display:flex;flex-direction:column;gap:4px;width:min(92%,420px);padding:9px 12px;border-radius:16px;background:rgba(127,240,196,.08);box-shadow:inset 0 0 0 1.5px rgba(127,240,196,.35)}
.pr-fil li.pv-aparte-fil b{font-size:12px;font-weight:900;letter-spacing:.04em;color:#7FF0C4}
.pr-fil li.pv-aparte-fil p{margin:0;font-size:13.5px;line-height:1.35}
.pr-fil li.pv-aparte-fil p small{color:#B49AA8;font-weight:800}
.pr-fil li.pv-aparte-fil .pv-aparte-bas{display:flex;align-items:center;justify-content:space-between;gap:8px}
.pr-fil li.pv-aparte-fil .pv-aparte-bas small{font-size:10.5px;color:#8A7A84}
.pr-fil li.pv-aparte-fil button{all:unset;cursor:pointer;font-size:11.5px;font-weight:800;color:#FFB4B4;text-decoration:underline}
.pv-boude{position:absolute;left:62%;top:10%;font-size:24px;animation:pv-pop .35s both}
.pr-scene [data-posture="occupe"]{animation:pv-occupe 4.2s ease-in-out infinite}
.pr-scene [data-posture="danse"]{animation:pv-danse .62s ease-in-out infinite}
.pr-scene [data-posture="affale"]{translate:0 5%;rotate:-5deg;filter:saturate(.7) brightness(.92);animation:pv-souffle 5s ease-in-out infinite}
.pr-scene [data-posture="bras"]{rotate:3deg;animation:pv-boude 2.6s ease-in-out infinite}
.pr-scene [data-posture="dort"]{translate:0 4%;rotate:7deg;opacity:.8;animation:pv-souffle 4s ease-in-out infinite}
.pr-scene [data-posture="prepare"]{rotate:7deg;translate:6% -2%;animation:pv-penche 1.4s ease-in-out infinite}
.pr-scene [data-geste="applaudir"]{animation:pv-saute .3s ease-in-out 5}
.pr-scene [data-geste="mdr"]{animation:pv-secoue .18s ease-in-out 8}
.pr-scene [data-geste="coeur"]{animation:pv-battre .5s ease-in-out 3}
.pr-scene [data-geste="check"]{animation:pv-check .9s cubic-bezier(.2,1.4,.4,1) 1}
.pr-scene [data-geste="front"]{animation:pv-front 1.4s ease-in-out 1}
.pr-scene [data-geste="waouh"]{animation:pv-waouh 1s cubic-bezier(.2,1.6,.4,1) 1}
.pr-scene.pv-sursaut .pr-parleur,.pr-scene.pv-sursaut .pr-ecoute,.pr-scene.pv-sursaut .pr-ecoute-chez{animation:pv-sursaut .6s cubic-bezier(.2,1.6,.4,1) 1}
.pv-bouton-panneau{flex:none;width:58px;min-height:58px;border:0;border-radius:18px;background:#2A1422;color:#FFF4E6;font-size:26px;cursor:pointer;box-shadow:inset 0 0 0 1.5px rgba(242,196,107,.5)}
.pv-astuce{flex:none;margin:0;font-size:11.5px;font-weight:700;color:#B49AA8;text-align:center}
.pr-fil li.pv-panneau-fil{justify-content:flex-start}
.pr-fil li.pv-panneau-fil.moi{justify-content:flex-end}
.pr-fil li.pv-panneau-fil > span{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:12px;background:#FFF4E6;color:#2A1220;font-size:13.5px;font-weight:900;box-shadow:inset 0 0 0 2px #F2C46B}
.pr-fil li.pv-panneau-fil small{color:#8A6A78;font-weight:700}
.pv-feuille-titre{display:block;font-size:19px;font-weight:900}
.pv-feuille-dit{margin:4px 0 12px;font-size:13.5px;color:#D9C3CB}
.pv-panneaux{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pv-panneaux button{padding:14px 10px;border:0;border-radius:12px;background:#FFF4E6;color:#2A1220;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:inset 0 0 0 2px #F2C46B}
.pv-reactions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.pv-reactions button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;border:0;border-radius:16px;background:#2A1422;color:#FFF4E6;font:inherit;cursor:pointer}
.pv-reactions span{font-size:32px;line-height:1}
.pv-reactions small{font-size:12px;font-weight:800;text-align:center}
@keyframes pv-pop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes pv-point{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
@keyframes pv-brandit{0%{transform:translateY(40px) rotate(-12deg);opacity:0}12%{transform:translateY(0) rotate(4deg);opacity:1}20%,80%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}100%{transform:translateY(20px);opacity:0}}
@keyframes pv-eclat{0%{transform:translateY(10px) scale(.4);opacity:0}25%{opacity:1;transform:translateY(-10px) scale(1.15)}100%{transform:translateY(-70px) scale(.9);opacity:0}}
@keyframes pv-aparte{0%{opacity:0;transform:translateY(8px) scale(.85)}6%{opacity:1;transform:none}88%{opacity:1}100%{opacity:0}}
@keyframes pv-zzz{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-8px);opacity:1}}
@keyframes pv-occupe{0%,70%,100%{rotate:0deg;scale:1}78%{rotate:-4deg;scale:1 1.04}86%{rotate:4deg;scale:1 1.04}}
@keyframes pv-danse{0%,100%{translate:0 0;rotate:-6deg}50%{translate:0 -7%;rotate:6deg}}
@keyframes pv-souffle{0%,100%{scale:1}50%{scale:1 .98}}
@keyframes pv-boude{0%,100%{rotate:3deg}50%{rotate:1deg}}
@keyframes pv-penche{0%,100%{scale:1}50%{scale:1.03}}
@keyframes pv-saute{0%,100%{translate:0 0}50%{translate:0 -6%}}
@keyframes pv-secoue{0%,100%{rotate:0deg}25%{rotate:-6deg}75%{rotate:6deg}}
@keyframes pv-battre{0%,100%{scale:1}50%{scale:1.08}}
@keyframes pv-check{0%{translate:0 0}40%{translate:10% -5%}100%{translate:0 0}}
@keyframes pv-front{0%,100%{rotate:0deg;translate:0 0}30%,70%{rotate:-10deg;translate:0 4%}}
@keyframes pv-waouh{0%{scale:1}40%{scale:1.12}100%{scale:1}}
@keyframes pv-sursaut{0%,100%{translate:0 0}35%{translate:0 -10%}}
@media (prefers-reduced-motion:reduce){.pr-scene [data-posture],.pr-scene [data-geste],.pv-panneau,.pv-eclat i,.pv-prepare i,.pv-zzz{animation:none}}
`;
