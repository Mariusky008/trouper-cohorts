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
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NOM_GUIDE, SONS_PABLITO, imageFigurineGuide, imageVisage, type Visage } from "@/lib/direct/guide";

export type { Visage };

/**
 * L'ONGLET OÙ IL SE TROUVE EST-IL À L'ÉCRAN ? (`ma-collection.tsx`) — un onglet caché ne montre pas sa fenêtre (et ne
 * bloque pas le défilement de la page) : elle attend qu'on l'ouvre. Hors des onglets : toujours.
 */
export const OngletVisible = createContext(true);

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

/**
 * 🎙️ SON LECTEUR, UN SEUL POUR TOUTE LA PAGE : débloqué une fois par un toucher (l'iPhone ne laisse jouer un son
 * qu'après un geste), il joue ensuite toutes ses voix — ses bulles, les questions du test, la fabrication.
 */
let lecteurPartage: HTMLAudioElement | null = null;
const lecteurPablito = () => (lecteurPartage ??= new Audio());
const lacher = (a: HTMLAudioElement) => {
  a.onplaying = a.onpause = a.onended = a.onloadedmetadata = null;
  a.pause();
};

/**
 * 🔓 DÉBLOQUER SA VOIX PENDANT UN TOUCHER (la bienvenue, `bienvenue.tsx` : sa bulle suivante arrive un peu après le
 * toucher, quand l'iPhone ne laisse plus jouer) : un silence joué tout de suite, et le lecteur reste débloqué.
 */
const SILENCE = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==";
export function debloquerLaVoix(): void {
  try {
    const a = lecteurPablito();
    if (!a.paused) return;
    a.src = SILENCE;
    void a.play().catch(() => undefined);
  } catch {
    /* (pas de son ici : la bulle s'écrit sans voix) */
  }
}

/** Il dit ce son (un de ses enregistrements) quand il change ; rend « il parle ». Sans son : rien. */
export function useVoixPablito(son: string | undefined, actif = true): boolean {
  const [joue, setJoue] = useState(false);
  useEffect(() => {
    if (!son || !actif) return;
    const a = lecteurPablito();
    a.onplaying = () => setJoue(true);
    a.onpause = a.onended = () => setJoue(false);
    a.src = son;
    a.play().catch(() => setJoue(false));
    return () => lacher(a);
  }, [son, actif]);
  return Boolean(son && actif && joue);
}

/**
 * 🎙️ SA VOIX POUR UNE BULLE (le tuto, `tuto.tsx`) : elle part quand la bulle arrive (la bulle est remontée à chaque
 * nouvelle, avec une `key`). Refusée par le téléphone (on n'a pas encore touché la page) : `bloque`, et `rejouer` la
 * fait entendre au premier toucher.
 */
export function useVoixBulle(son: string | undefined, actif = true): { parle: boolean; bloque: boolean; rejouer: () => void } {
  const [joue, setJoue] = useState(false);
  const [bloque, setBloque] = useState(false);
  useEffect(() => {
    if (!son || !actif) return;
    const a = lecteurPablito();
    let fini = false;
    a.onplaying = () => {
      setJoue(true);
      setBloque(false);
    };
    a.onpause = a.onended = () => setJoue(false);
    a.src = son;
    a.play().catch((e: unknown) => {
      if (!fini && (e as { name?: string })?.name === "NotAllowedError") setBloque(true);
    });
    return () => {
      fini = true;
      lacher(a);
    };
  }, [son, actif]);
  const rejouer = () => {
    if (!son) return;
    const a = lecteurPablito();
    if (!a.src.endsWith(son)) a.src = son;
    void a.play().catch(() => undefined);
  };
  return { parle: Boolean(son && actif && joue), bloque: Boolean(son && actif && bloque), rejouer };
}

/**
 * Une bulle : son texte, le visage qu'il fait en la disant (`v`, `neutre` si rien n'est dit), celui qu'il fait une fois
 * dite (`apres` : « il sourit… puis louche »), et son enregistrement (`son` ; sinon `SONS_PABLITO`, s'il y en a un).
 */
export type Replique = string | { t: string; v?: Visage; apres?: Visage; son?: string };
type Bulle = { t: string; v: Visage; apres?: Visage; son?: string };
const enBulle = (x: Replique): Bulle => (typeof x === "string" ? { t: x, v: "neutre" } : { ...x, v: x.v ?? "neutre" });

const retenu = (cle?: string) => {
  try {
    return Boolean(cle && typeof window !== "undefined" && window.localStorage.getItem(`clikme-clik-${cle}`));
  } catch {
    return false;
  }
};
const retenir = (cle?: string) => {
  try {
    if (cle) window.localStorage.setItem(`clikme-clik-${cle}`, "1");
  } catch {
    /* rien */
  }
};

/**
 * 💬 IL EXPLIQUE — une bulle après l'autre, tapées comme un message (sa bouche bouge pendant qu'il « parle », son visage
 * suit ce qu'il dit, et sa voix s'il l'a enregistrée) ; un toucher passe à la suite. Avec `edition` : sa figurine dans
 * la tenue du mois (« Tu as vu ma tenue ? »).
 *
 * EN FENÊTRE, LA PREMIÈRE FOIS (`popup`, 5 novembre 2026 : « ça doit arriver la première fois comme une pop-up, et pas
 * comme quelque chose de fixe en haut ») : il arrive par-dessus la page ; ce qu'il propose (`children`) ferme la
 * fenêtre et le fait. Ensuite (`cle` : ce qu'on retient sur l'appareil), il n'en reste qu'un petit bouton
 * « Pablito t'explique », et ce qu'il propose (sauf `actionDehors={false}` : l'accueil, où la quête est juste dessous).
 * Sans `popup` : à sa place dans la page ; revenu, on ne réécoute pas tout (la dernière bulle, et « ↺ Réécouter »).
 */
export function GuideDit({
  repliques,
  edition,
  cle,
  salue = true,
  grand = false,
  popup = false,
  actionDehors = true,
  voix,
  children,
  className,
}: {
  repliques: Replique[];
  edition?: string | null;
  cle?: string;
  salue?: boolean;
  /** En grand, au-dessus de sa bulle (comme dans la fenêtre). */
  grand?: boolean;
  /** En fenêtre la première fois, puis un petit bouton pour le revoir. */
  popup?: boolean;
  /** Ce qu'il propose reste dans la page une fois la fenêtre fermée (`popup`). */
  actionDehors?: boolean;
  /** Le nom de ses enregistrements (`SONS_PABLITO`), quand ce n'est pas `cle` (« Ce mois-ci » : un par mois, une voix). */
  voix?: string;
  children?: ReactNode;
  className?: string;
}) {
  const bulles = repliques.map(enBulle);
  const visible = useContext(OngletVisible);
  // DÉJÀ ÉCOUTÉ ? (Il n'apparaît qu'une fois la page chargée dans le navigateur : on lit ce qu'on a retenu dès le départ.)
  const [deja] = useState(() => retenu(cle));
  const [ouvert, setOuvert] = useState(() => popup && !deja);
  const [reduit] = useState(() => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  const [i, setI] = useState(deja && !popup ? bulles.length - 1 : 0);
  const [n, setN] = useState(deja && !popup ? Number.MAX_SAFE_INTEGER : 0);
  const bulle = bulles[i] ?? { t: "", v: "neutre" as Visage };
  const texte = bulle.t;
  const vu = reduit ? texte.length : n;
  const tape = vu < texte.length;
  // la fenêtre se montre (ouverte, et son onglet à l'écran) ; il parle quand on le voit
  const montre = popup && ouvert && visible;
  const actif = popup ? montre : visible;

  // SA VOIX, s'il a enregistré cette bulle : elle part avec la bulle (si le téléphone refuse de la jouer avant un
  // premier toucher, la bulle propose de l'entendre). La bulle s'écrit au rythme de sa voix ; quand elle se tait, la
  // bulle suivante vient toute seule.
  const son = bulle.son ?? ((voix ?? cle) ? SONS_PABLITO[`${voix ?? cle}-${i + 1}`] : undefined);
  const [joue, setJoue] = useState(false);
  const [bloque, setBloque] = useState(false);
  const [pas, setPas] = useState(24);
  const derniere = bulles.length - 1;
  useEffect(() => {
    if (!son || !actif) return;
    // SON LECTEUR (le même pour toute la page : débloqué une fois, il joue ensuite les suivantes)
    const a = lecteurPablito();
    let fini = false;
    let ensuite = 0;
    a.onplaying = () => setJoue(true);
    a.onpause = () => setJoue(false);
    // (deux lettres à la fois : la bulle finit de s'écrire un peu avant sa voix)
    a.onloadedmetadata = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setPas(Math.max(24, Math.min(140, (a.duration * 850) / Math.max(1, texte.length / 2))));
    };
    a.onended = () => {
      setJoue(false);
      if (fini || i >= derniere) return;
      ensuite = window.setTimeout(() => {
        setI(i + 1);
        setN(0);
      }, 700);
    };
    a.src = son;
    // refusée par le téléphone (pas encore touché la page) : on propose de l'entendre ; interrompue (on est passé à la
    // suite, la fenêtre s'est fermée) : rien
    a.play().catch((e: unknown) => {
      if (!fini && (e as { name?: string })?.name === "NotAllowedError") setBloque(true);
    });
    return () => {
      fini = true;
      window.clearTimeout(ensuite);
      lacher(a);
    };
  }, [son, i, actif, texte.length, derniere]);
  const rythme = son ? pas : 24;
  const parle = tape || joue;
  const visage = !parle && bulle.apres ? bulle.apres : bulle.v;

  // ses visages de la conversation, chargés d'avance (pas de blanc quand il change de tête)
  const visages = [...new Set(bulles.flatMap((b) => (b.apres ? [b.v, b.apres] : [b.v])))].join(",");
  useEffect(() => {
    if (edition || !actif) return;
    for (const v of visages.split(",") as Visage[])
      for (const b of ["n", "p"] as const) {
        const im = new Image();
        im.src = imageVisage(v, b);
      }
  }, [visages, edition, actif]);

  // la bulle se tape, lettre après lettre (au rythme de sa voix, s'il l'a enregistrée)
  useEffect(() => {
    if (!actif || reduit || n >= texte.length) return;
    const t = window.setTimeout(() => setN((x) => Math.min(texte.length, x + 2)), rythme);
    return () => window.clearTimeout(t);
  }, [n, texte.length, reduit, actif, rythme]);
  const fin = i === bulles.length - 1 && !tape;
  useEffect(() => {
    if (fin && !popup) retenir(cle);
  }, [fin, cle, popup]);

  const fermer = () => {
    retenir(cle);
    setOuvert(false);
  };
  const rouvrir = () => {
    setI(0);
    setN(0);
    setBloque(false);
    setOuvert(true);
  };
  // la fenêtre : Échap la ferme ; la page dessous ne défile pas
  const croix = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!montre) return;
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    croix.current?.focus({ preventScroll: true });
    const touche = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      retenir(cle);
      setOuvert(false);
    };
    window.addEventListener("keydown", touche);
    return () => {
      document.documentElement.style.overflow = avant;
      window.removeEventListener("keydown", touche);
    };
  }, [montre, cle]);

  const suite = () => {
    if (bloque && son) {
      setBloque(false);
      void lecteurPablito().play().catch(() => undefined);
      return;
    }
    if (tape) return setN(texte.length);
    if (i < derniere) {
      setBloque(false);
      setI(i + 1);
      setN(0);
    }
  };

  // FENÊTRE FERMÉE : un petit bouton pour le revoir, et ce qu'il propose
  if (popup && !ouvert)
    return (
      <div className={`mqd-mini${className ? ` ${className}` : ""}`}>
        <button type="button" className="mqd-revoir" onClick={rouvrir}>
          <span className="mqd-revoir-tete">
            <Guide fixe />
          </span>
          <span>
            <b>{NOM_GUIDE}</b> t’explique ›
          </span>
        </button>
        {actionDehors && children && <div className="mqd-fin">{children}</div>}
      </div>
    );

  const enGrand = grand || popup;
  const dedans = (
    <div className={`mqd${edition ? " tenue" : ""}${enGrand ? " grand" : ""}${!popup && className ? ` ${className}` : ""}`}>
      <button type="button" className={`mqd-clik${parle ? " parle" : ""}`} onClick={suite} aria-label={`${NOM_GUIDE} : la suite`}>
        {edition ? <FigurineGuide edition={edition} /> : <Guide visage={visage} parle={parle} salue={salue && i === 0} />}
      </button>
      <div className="mqd-droite">
        <button type="button" className="mqd-bulle" onClick={suite} aria-live="polite">
          <span className="mqd-nom">{NOM_GUIDE}</span>
          <span className="mqd-texte">
            {texte.slice(0, vu)}
            {tape && <i className="mqd-curseur" aria-hidden="true" />}
          </span>
          {bloque && <span className="mqd-ecouter">🔊 Touche pour l’entendre</span>}
          {!fin && (
            <span className="mqd-suite">
              {bulles.map((_, k) => (
                <i key={k} className={k <= i ? "vu" : ""} />
              ))}
              <b>{tape ? "…" : "Suite ›"}</b>
            </span>
          )}
        </button>
        {/* ce qu'il propose de faire : tout de suite (on n'attend pas la fin de ses bulles pour agir) ; dans la fenêtre,
            le faire la ferme — APRÈS l'action du bouton (fermée avant, la fenêtre emporterait le bouton et son action) */}
        {(children || (fin && (popup || bulles.length > 1))) && (
          <div className="mqd-fin" onClick={popup ? () => fermer() : undefined}>
            {children}
            {popup && fin && !children && (
              <button type="button" className="og-go">
                C’est compris 👍
              </button>
            )}
            {!popup && fin && bulles.length > 1 && (
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
  if (!popup) return dedans;
  if (!visible) return null;
  return (
    <div className="pb-voile" role="dialog" aria-modal="true" aria-label={`${NOM_GUIDE} t’explique`}>
      <div className="pb-boite">
        <button type="button" className="pb-fermer" ref={croix} onClick={fermer} aria-label="Fermer">
          ✕
        </button>
        {dedans}
        {!fin && (
          <button type="button" className="pb-passer" onClick={fermer}>
            Passer
          </button>
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
.mqd-ecouter{align-self:flex-start;padding:4px 10px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:12.5px;font-weight:900}
/* la fenêtre, la première fois */
.pb-voile{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:rgba(10,3,8,.74);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:pb-voile .25s ease-out}
.pb-boite{position:relative;width:100%;max-width:440px;max-height:calc(100dvh - 32px);overflow:auto;padding:26px 16px 14px;border-radius:28px;background:linear-gradient(180deg,#3A1230,#1E0918);border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px -20px rgba(0,0,0,.9);animation:pb-entre .5s cubic-bezier(.2,1.3,.4,1)}
.pb-fermer{position:absolute;right:10px;top:10px;z-index:2;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-size:17px;cursor:pointer}
.pb-fermer:focus-visible{outline:2px solid rgba(255,255,255,.35);outline-offset:1px}
.pb-passer{display:block;margin:10px auto 0;border:0;background:none;color:#A88E99;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}
.pb-boite .mqd.grand .mqd-clik{width:min(190px,48vw)}
/* la fenêtre fermée : le revoir */
.mqd-mini{display:flex;flex-direction:column;gap:10px}
.mqd-revoir{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;padding:4px 14px 4px 4px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#E8D3DC;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}
.mqd-revoir b{color:#FFF4E6;font-weight:900}
.mqd-revoir-tete{display:block;width:40px;flex:none}
.mqd-revoir-tete .mq-cadre{aspect-ratio:1;border-radius:50%;box-shadow:0 0 0 2px rgba(255,46,154,.6)}
.mqd-revoir-tete .mq-i{object-position:50% 10%;transform:scale(1.7);transform-origin:50% 18%}
@keyframes pb-voile{from{opacity:0}}
@keyframes pb-entre{from{opacity:0;transform:translateY(34px) scale(.94)}}
@keyframes mqd-entre{from{opacity:0;transform:translateY(8px) scale(.97)}}
@keyframes mqd-curseur{50%{opacity:0}}
@media (min-width:860px){.mqd{grid-template-columns:150px minmax(0,1fr);gap:14px}.mqd-texte{font-size:17px}}
@media (prefers-reduced-motion:reduce){.mq *,.mqd *,.mqf{animation:none!important}}
`;
