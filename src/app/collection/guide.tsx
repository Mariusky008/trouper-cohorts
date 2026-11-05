"use client";

/**
 * 🧑 LE GUIDE DE « MA COLLECTION » : LA FIGURINE DU PATRON DE CLIKME (`lib/direct/guide.ts`) — 5 novembre 2026
 * (« pourquoi ne reprends-tu pas cette figurine qui est moi ? Elle a déjà plein d'expressions… ça permettra de voir à
 * quoi ça ressemble dès le départ, au lieu d'avoir un personnage cartoon »). Il remplace Clik, le personnage dessiné.
 *
 *   · `Guide` : son portrait, qui parle — la bouche s'ouvre et se ferme (ses deux images), dans le visage de ce qu'il
 *     dit (joie, euphorie, tristesse, colère : ses vraies expressions). C'est ce que fera la tienne.
 *   · `FigurineGuide` : sa figurine seule, sans fond, dans la tenue de l'édition — l'exemple, là où il n'y a pas encore
 *     la vraie (l'album, la frise des éditions, un commerce sans figurine). Dorée (`or`), holographique (`rare`), en
 *     silhouette (`ombre`).
 *   · `GuideDit` : il explique, une bulle après l'autre, tapées comme un message.
 */
import { useEffect, useState, type ReactNode } from "react";
import { NOM_GUIDE, imageFigurineGuide, imageVisage, type Visage } from "@/lib/direct/guide";

export type { Visage };

/** Son portrait qui parle : la bouche bouge (`parle`), dans le visage de ce qu'il dit. */
export function Guide({
  visage = "neutre",
  parle = false,
  bref = false,
  salue = false,
  fixe = false,
  className,
}: {
  visage?: Visage;
  parle?: boolean;
  /** Il parle un instant, puis se tait (une question, une étape : on le remonte avec une `key` pour qu'il reparle). */
  bref?: boolean;
  salue?: boolean;
  fixe?: boolean;
  className?: string;
}) {
  return (
    <span className={`mq${parle ? " parle" : ""}${bref ? " bref" : ""}${fixe ? " fixe" : ""}${className ? ` ${className}` : ""}`} aria-hidden="true">
      <span className="mq-cadre">
        <span className="mq-anim">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mq-i" src={imageVisage(visage, "n")} alt="" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mq-i mq-o" src={imageVisage(visage, "p")} alt="" draggable={false} />
        </span>
      </span>
      {salue && <span className="mq-salut">👋</span>}
    </span>
  );
}

/** Sa figurine seule (sans fond), dans la tenue d'une édition : l'exemple, à la place d'un fantôme. */
export function FigurineGuide({ edition, or = false, rare = false, ombre = false, fixe = false, className }: { edition?: string | null; or?: boolean; rare?: boolean; ombre?: boolean; fixe?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`mqf${fixe ? "" : " anime"}${or ? " or" : ""}${rare ? " rare" : ""}${ombre ? " ombre" : ""}${className ? ` ${className}` : ""}`}
      src={imageFigurineGuide(or || rare ? null : edition)}
      alt=""
      draggable={false}
      loading="lazy"
    />
  );
}

/** La figurine d'un commerce : la vraie s'il en a une ; sinon la sienne, dans la tenue de l'édition (plus de fantôme). */
export function FigurineOuGuide({ src, ...p }: { src?: string | null; edition?: string | null; className?: string; fixe?: boolean; or?: boolean; rare?: boolean; ombre?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src && !src.startsWith("/direct/double/")) return <img className={p.className} src={src} alt="" draggable={false} loading="lazy" />;
  return <FigurineGuide {...p} />;
}

/** Une bulle : son texte, et le visage qu'il fait en la disant (`neutre` si rien n'est dit). */
export type Replique = string | { t: string; v: Visage };
const enBulle = (x: Replique) => (typeof x === "string" ? { t: x, v: "neutre" as Visage } : x);

/**
 * 💬 IL EXPLIQUE — une bulle après l'autre, tapées comme un message (sa bouche bouge pendant qu'il « parle », son visage
 * suit ce qu'il dit) ; un toucher passe à la suite. Dessous, ce qu'il propose de faire (`children`), tout de suite.
 * Revenu sur la page, on ne réécoute pas tout : la dernière bulle, et « ↺ Réécouter » (`cle` : ce qu'on retient sur
 * l'appareil). Avec `edition` : sa figurine dans la tenue du mois (« Tu as vu ma tenue ? »).
 */
export function GuideDit({
  repliques,
  edition,
  cle,
  salue = true,
  grand = false,
  children,
  className,
}: {
  repliques: Replique[];
  edition?: string | null;
  cle?: string;
  salue?: boolean;
  /** En grand, au-dessus de sa bulle (l'accueil : on voit tout de suite à quoi ressemble une figurine). */
  grand?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const bulles = repliques.map(enBulle);
  // DÉJÀ ÉCOUTÉ ? la dernière bulle, tout de suite. (Il n'apparaît qu'une fois la page chargée dans le navigateur : on
  // lit ce qu'on a retenu dès le départ.)
  const [deja] = useState(() => {
    try {
      return Boolean(cle && typeof window !== "undefined" && window.localStorage.getItem(`clikme-clik-${cle}`));
    } catch {
      return false;
    }
  });
  const [reduit] = useState(() => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  const [i, setI] = useState(deja ? bulles.length - 1 : 0);
  const [n, setN] = useState(deja ? Number.MAX_SAFE_INTEGER : 0);
  const { t: texte, v: visage } = bulles[i] ?? { t: "", v: "neutre" as Visage };
  const vu = reduit ? texte.length : n;
  const parle = vu < texte.length;

  // ses visages de la conversation, chargés d'avance (pas de blanc quand il change de tête)
  const visages = [...new Set(bulles.map((b) => b.v))].join(",");
  useEffect(() => {
    if (edition) return;
    for (const v of visages.split(",") as Visage[])
      for (const b of ["n", "p"] as const) {
        const im = new Image();
        im.src = imageVisage(v, b);
      }
  }, [visages, edition]);

  // la bulle se tape, lettre après lettre
  useEffect(() => {
    if (reduit || n >= texte.length) return;
    const t = window.setTimeout(() => setN((x) => Math.min(texte.length, x + 2)), 24);
    return () => window.clearTimeout(t);
  }, [n, texte.length, reduit]);
  const fin = i === bulles.length - 1 && !parle;
  useEffect(() => {
    if (!fin || !cle) return;
    try {
      window.localStorage.setItem(`clikme-clik-${cle}`, "1");
    } catch {
      /* rien */
    }
  }, [fin, cle]);

  const suite = () => {
    if (parle) return setN(texte.length);
    if (i < bulles.length - 1) {
      setI(i + 1);
      setN(0);
    }
  };
  return (
    <div className={`mqd${edition ? " tenue" : ""}${grand ? " grand" : ""}${className ? ` ${className}` : ""}`}>
      <button type="button" className={`mqd-clik${parle ? " parle" : ""}`} onClick={suite} aria-label={`${NOM_GUIDE} : la suite`}>
        {edition ? <FigurineGuide edition={edition} /> : <Guide visage={visage} parle={parle} salue={salue && i === 0} />}
      </button>
      <div className="mqd-droite">
        <button type="button" className="mqd-bulle" onClick={suite} aria-live="polite">
          <span className="mqd-nom">{NOM_GUIDE}</span>
          <span className="mqd-texte">
            {texte.slice(0, vu)}
            {parle && <i className="mqd-curseur" aria-hidden="true" />}
          </span>
          {!fin && (
            <span className="mqd-suite">
              {bulles.map((_, k) => (
                <i key={k} className={k <= i ? "vu" : ""} />
              ))}
              <b>{parle ? "…" : "Suite ›"}</b>
            </span>
          )}
        </button>
        {/* ce qu'il propose de faire : tout de suite (on n'attend pas la fin de ses bulles pour agir) */}
        {(children || (fin && bulles.length > 1)) && (
          <div className="mqd-fin">
            {children}
            {fin && bulles.length > 1 && (
              <button
                type="button"
                className="mqd-rejouer"
                onClick={() => {
                  setI(0);
                  setN(0);
                }}
              >
                ↺ Réécouter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const STYLES_GUIDE = `
.mq{position:relative;display:block;width:100%}
.mq-cadre{position:relative;display:block;width:100%;aspect-ratio:852/1024;border-radius:20px;overflow:hidden;background:#D9739A;box-shadow:0 16px 30px -14px rgba(0,0,0,.85),0 0 0 2px rgba(255,255,255,.14)}
.mq-anim{position:absolute;inset:0;transform-origin:50% 92%;animation:mq-dodeline 3.2s ease-in-out infinite}
.mq-i{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;transform:scale(1.04)}
.mq-o{opacity:0}
.mq.parle .mq-o{animation:mq-bouche .28s steps(1) infinite}
.mq.parle .mq-anim{animation:mq-hoche .56s ease-in-out infinite}
.mq.parle.bref .mq-o{animation-iteration-count:8}
.mq.parle.bref .mq-anim{animation:mq-hoche .56s ease-in-out 4,mq-dodeline 3.2s ease-in-out 2.24s infinite}
.mq-salut{position:absolute;right:-8px;top:-10px;font-size:30px;line-height:1;transform-origin:70% 85%;animation:mq-salut .5s ease-in-out infinite alternate;filter:drop-shadow(0 4px 4px rgba(0,0,0,.4))}
.mq.fixe *{animation:none!important}
.mqf{display:block;object-fit:contain;object-position:50% 100%}
.mqf.anime{transform-origin:50% 100%;animation:mqf-bobble 2.8s ease-in-out infinite}
.mqf.or{filter:sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.05) drop-shadow(0 0 10px rgba(255,214,120,.6))}
.mqf.rare{animation:mqf-holo 5s linear infinite}
.mqf.ombre{filter:brightness(0);opacity:.5;animation:none}
@keyframes mq-dodeline{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}
@keyframes mq-hoche{0%,100%{transform:translateY(0) rotate(-.8deg)}50%{transform:translateY(-2px) rotate(.8deg)}}
@keyframes mq-bouche{0%{opacity:1}50%{opacity:0}}
@keyframes mq-salut{from{transform:rotate(-14deg)}to{transform:rotate(16deg)}}
@keyframes mqf-bobble{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg) translateY(-2px)}}
@keyframes mqf-holo{0%{filter:hue-rotate(0deg) saturate(1.4) drop-shadow(0 0 8px rgba(201,182,255,.7))}100%{filter:hue-rotate(360deg) saturate(1.4) drop-shadow(0 0 8px rgba(201,182,255,.7))}}
/* il explique */
.mqd{display:grid;grid-template-columns:104px minmax(0,1fr);align-items:end;gap:10px}
.mqd-clik{display:block;padding:0;border:0;background:none;cursor:pointer}
.mqd.tenue .mqd-clik{filter:drop-shadow(0 12px 14px rgba(0,0,0,.45))}
.mqd.tenue .mqd-clik .mqf{width:100%;height:auto}
.mqd.tenue .mqd-clik.parle .mqf{animation:mq-hoche .56s ease-in-out infinite}
.mqd-droite{display:flex;flex-direction:column;gap:10px;min-width:0}
.mqd-bulle{position:relative;display:flex;flex-direction:column;gap:6px;width:100%;min-height:86px;padding:12px 14px 10px;border:0;border-radius:20px 20px 20px 6px;background:#FFF4E6;color:#2A0F1F;font:inherit;text-align:left;cursor:pointer;box-shadow:0 14px 30px -14px rgba(0,0,0,.8);animation:mqd-entre .35s cubic-bezier(.2,1.4,.4,1)}
.mqd-bulle::before{content:"";position:absolute;left:-7px;bottom:12px;width:16px;height:16px;background:#FFF4E6;transform:rotate(45deg);border-radius:3px}
.mqd-nom{font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#FF2E9A}
.mqd-texte{font-size:15.5px;line-height:1.38;font-weight:700}
.mqd-curseur{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:#FF2E9A;animation:mqd-curseur .6s steps(1) infinite}
.mqd-suite{display:flex;align-items:center;gap:4px}
.mqd-suite i{width:6px;height:6px;border-radius:50%;background:#E8C9D6}
.mqd-suite i.vu{background:#FF2E9A}
.mqd-suite b{margin-left:auto;font-size:12.5px;font-weight:900;color:#C2187A}
.mqd-fin{display:flex;flex-direction:column;gap:8px;animation:mqd-entre .4s cubic-bezier(.2,1.4,.4,1)}
.mqd-rejouer{align-self:flex-start;border:0;background:none;color:#A88E99;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
.mqd.grand{grid-template-columns:minmax(0,1fr);justify-items:center;gap:16px}
.mqd.grand .mqd-clik{width:min(200px,54vw)}
.mqd.grand .mq-cadre{border-radius:28px}
.mqd.grand .mq-salut{font-size:40px;right:-14px;top:-12px}
.mqd.grand .mqd-droite{width:100%}
.mqd.grand .mqd-bulle{border-radius:20px}
.mqd.grand .mqd-bulle::before{left:50%;top:-7px;bottom:auto;margin-left:-8px}
@keyframes mqd-entre{from{opacity:0;transform:translateY(8px) scale(.97)}}
@keyframes mqd-curseur{50%{opacity:0}}
@media (min-width:860px){.mqd{grid-template-columns:150px minmax(0,1fr);gap:14px}.mqd-texte{font-size:17px}}
@media (prefers-reduced-motion:reduce){.mq *,.mqd *,.mqf{animation:none!important}}
`;
