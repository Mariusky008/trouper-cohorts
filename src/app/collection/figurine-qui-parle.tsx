"use client";

/**
 * 🗣️ UNE FIGURINE QUI PARLE — ses deux images (bouche fermée, bouche ouverte) et une voix : la bouche s'ouvre quand
 * la voix est forte, comme dans la démo. Le volume se mesure dans le navigateur (`AnalyserNode`) ; si le navigateur
 * ne sait pas — ou si la mesure ne rend que du silence alors que la voix joue depuis une demi-seconde (certains
 * navigateurs coupent la mesure sans rien dire) —, la bouche bat en rythme tant que la voix joue.
 *
 * CE QU'ELLE RESSENT (`sentiment`) : ses images ne changent pas ; elle sautille de joie, tremble de colère, s'affaisse
 * de tristesse ou bondit d'euphorie, le fond prend la couleur du sentiment et ce qui flotte autour le dit (💢, 💧…).
 * `decoupe` : des images détourées (fond transparent), posées debout au lieu de remplir le cadre.
 *
 * LA VOIX EST CHARGÉE EN ENTIER AVANT DE JOUER (une adresse `blob:`) : l'iPhone ne lit pas un son servi sans
 * « morceaux », et la mesure du volume demande un son de la même origine.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { sentimentDe, type Sentiment } from "@/lib/direct/ma-figurine";

/** Ce qui flotte autour d'elle, selon ce qu'elle ressent. */
const PARTICULES: Record<Sentiment, string[]> = {
  joie: ["😄", "✨", "💛", "🌟", "😊", "✨"],
  colere: ["💢", "😠", "💢", "🔥", "💢", "⚡"],
  tristesse: ["💧", "💧", "😢", "💧", "💧", "💧"],
  euphorie: ["🎉", "🤩", "⭐", "🥳", "✨", "🎊"],
};

/** La couche du sentiment : les particules, et l'emoji en badge. `cle` la relance à chaque nouveau choix. */
export function CoucheSentiment({ sentiment, cle = 0 }: { sentiment: Sentiment | null | undefined; cle?: number }) {
  const s = sentimentDe(sentiment);
  if (!s) return null;
  const parts = PARTICULES[s.cle];
  return (
    <span key={`${s.cle}-${cle}`} className="fqp-sent" aria-hidden="true">
      {[...parts, ...parts].map((e, i) => (
        <i key={i} style={{ "--x": `${(i * 37 + 11) % 92}%`, "--d": `${(i * 0.23) % 1.6}s`, "--r": `${((i * 53) % 40) - 20}deg` } as CSSProperties}>
          {e}
        </i>
      ))}
      <b className="fqp-badge">{s.emoji}</b>
    </span>
  );
}

type Props = {
  neutre: string;
  parle: string;
  /** Une adresse `blob:` (son propre enregistrement) ou notre route (`/api/direct/ma-figurine/son?m=…`). */
  src: string;
  /** « ▶ Écouter », « ▶ Réécouter ». */
  etiquette?: string;
  /** Appelé à la fin de la voix. */
  onFin?: () => void;
  className?: string;
  /** Ce qu'elle ressent dans ce message (rien : elle parle, simplement). */
  sentiment?: Sentiment | null;
  /** Relance l'animation du sentiment (un nouveau choix du même sentiment). */
  rejoue?: number;
  /** Images détourées (fond transparent) : posées debout dans le cadre. */
  decoupe?: boolean;
};

type Fenetre = Window & { webkitAudioContext?: typeof AudioContext };

export function FigurineQuiParle({ neutre, parle, src, etiquette = "▶ Écouter", onFin, className, sentiment, rejoue = 0, decoupe }: Props) {
  const boite = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const contexte = useRef<AudioContext | null>(null);
  const analyse = useRef<AnalyserNode | null>(null);
  const local = useRef<string>("");
  const raf = useRef(0);
  /** Le plus fort volume mesuré depuis le début de la lecture (pour repérer une mesure muette). */
  const pic = useRef(0);
  const [joue, setJoue] = useState(false);
  const [charge, setCharge] = useState(false);
  const [ennui, setEnnui] = useState("");

  // un nouveau son : on oublie l'ancien
  useEffect(() => {
    return () => {
      cancelAnimationFrame(raf.current);
      audio.current?.pause();
      if (local.current) URL.revokeObjectURL(local.current);
      local.current = "";
      audio.current = null;
      analyse.current = null;
    };
  }, [src]);
  useEffect(() => () => void contexte.current?.close().catch(() => undefined), []);

  const bouche = (ouverte: boolean) => boite.current?.classList.toggle("ouverte", ouverte);
  /** Où en est la lecture (`data-lecture`), et comment la bouche suit (`data-mesure`) : lisible par les essais. */
  const marquer = (cle: "lecture" | "mesure", v: string) => {
    const r = boite.current?.parentElement;
    if (r) r.dataset[cle] = v;
  };

  function animer() {
    const a = audio.current;
    if (!a) return;
    const n = analyse.current;
    let ouverte: boolean;
    if (n) {
      const t = new Uint8Array(n.fftSize);
      n.getByteTimeDomainData(t);
      let somme = 0;
      for (const v of t) somme += ((v - 128) / 128) ** 2;
      const rms = Math.sqrt(somme / t.length);
      pic.current = Math.max(pic.current, rms);
      ouverte = rms > 0.045;
      // une mesure muette alors que la voix avance : on passe au rythme
      if (a.currentTime > 0.5 && pic.current < 0.004) {
        analyse.current = null;
        marquer("mesure", "rythme");
      }
    } else {
      ouverte = !a.paused && Math.floor(a.currentTime * 7) % 2 === 0;
    }
    bouche(ouverte && !a.paused);
    if (!a.paused && !a.ended) raf.current = requestAnimationFrame(animer);
  }

  async function jouer() {
    setEnnui("");
    try {
      if (!audio.current) {
        setCharge(true);
        let url = src;
        if (!src.startsWith("blob:")) {
          const r = await fetch(src, { cache: "no-store" });
          if (!r.ok) throw new Error("son");
          url = URL.createObjectURL(await r.blob());
          local.current = url;
        }
        const a = new Audio(url);
        a.preload = "auto";
        a.onended = () => {
          marquer("lecture", `fini ${a.duration.toFixed(1)} s`);
          setJoue(false);
          bouche(false);
          onFin?.();
        };
        a.onpause = () => {
          setJoue(false);
          bouche(false);
        };
        audio.current = a;
        try {
          const C = window.AudioContext ?? (window as Fenetre).webkitAudioContext;
          if (C) {
            contexte.current ??= new C();
            const n = contexte.current.createAnalyser();
            n.fftSize = 1024;
            contexte.current.createMediaElementSource(a).connect(n);
            n.connect(contexte.current.destination);
            analyse.current = n;
          }
        } catch {
          analyse.current = null; // la bouche battra en rythme
        }
        marquer("mesure", analyse.current ? "volume" : "rythme");
      }
      await contexte.current?.resume().catch(() => undefined);
      const a = audio.current!;
      a.currentTime = 0;
      pic.current = 0;
      marquer("lecture", "lance");
      await a.play();
      marquer("lecture", "joue");
      setJoue(true);
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(animer);
    } catch (e) {
      marquer("lecture", `erreur ${(e as Error)?.name ?? ""}`.trim());
      setEnnui("Le son n’a pas pu se lancer. Réessaie.");
    } finally {
      setCharge(false);
    }
  }

  return (
    <div className={`fqp${className ? ` ${className}` : ""}${decoupe ? " decoupe" : ""}${sentiment ? ` sent-${sentiment}` : ""}`} data-sentiment={sentiment ?? ""}>
      <div className="fqp-fig" ref={boite}>
        <CoucheSentiment sentiment={sentiment} cle={rejoue} />
        <span className="fqp-corps" key={`${sentiment ?? ""}-${rejoue}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fqp-n" src={neutre} alt="" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fqp-p" src={parle} alt="" draggable={false} />
        </span>
        {joue && <span className="fqp-ondes" aria-hidden="true" />}
      </div>
      <button type="button" className="fqp-jouer" onClick={() => (joue ? audio.current?.pause() : jouer())} disabled={charge}>
        {charge ? "…" : joue ? "⏸ Pause" : etiquette}
      </button>
      {ennui && (
        <p className="fqp-ennui" role="alert">
          {ennui}
        </p>
      )}
    </div>
  );
}

export const STYLES_FIGURINE_QUI_PARLE = `
.fqp{display:flex;flex-direction:column;align-items:center;gap:12px}
.fqp-fig{position:relative;width:min(260px,70vw);aspect-ratio:3/4;border-radius:24px;overflow:hidden;background:linear-gradient(160deg,#FF8FCB,#7B1B5E);border:2px solid rgba(255,255,255,.3);box-shadow:0 22px 44px -18px rgba(0,0,0,.9),0 0 40px rgba(255,46,154,.25)}
.fqp-fig{transition:background .6s}
.fqp-corps{position:absolute;inset:0;transform-origin:50% 100%}
.fqp-fig img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fqp.decoupe .fqp-fig img{top:7%;height:93%;object-fit:contain;object-position:50% 100%;filter:drop-shadow(0 14px 12px rgba(0,0,0,.45))}
.fqp-p{opacity:0}
.fqp-fig.ouverte .fqp-p{opacity:1}
.fqp-fig.ouverte .fqp-n{opacity:0}
.fqp-ondes{position:absolute;inset:-2px;border-radius:24px;box-shadow:inset 0 0 0 3px rgba(242,196,107,.8);animation:fqp-ondes 1.2s ease-out infinite;pointer-events:none}
.fqp-jouer{min-width:170px;padding:14px 26px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 10px 24px -10px rgba(255,46,154,.9)}
.fqp-jouer:disabled{opacity:.6}
.fqp-ennui{margin:0;font-size:13px;color:#FFB4B4}
@keyframes fqp-ondes{0%{opacity:1}100%{opacity:0;transform:scale(1.04)}}
/* ce qu'elle ressent */
.fqp-sent{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.fqp-sent i{position:absolute;left:var(--x);font-style:normal;font-size:24px;opacity:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
.fqp-badge{position:absolute;right:10px;top:10px;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.92);font-size:28px;box-shadow:0 8px 18px rgba(0,0,0,.35);animation:fqp-badge .55s cubic-bezier(.2,1.6,.4,1) both}
@keyframes fqp-badge{from{transform:scale(0) rotate(-40deg)}}
.sent-joie .fqp-fig{background:radial-gradient(80% 60% at 50% 30%,#FFE58A,#FF9A3D 60%,#E2543A)}
.sent-joie .fqp-corps{animation:fqp-joie .5s ease-in-out infinite alternate}
.sent-joie .fqp-sent i{bottom:-12%;animation:fqp-monte 2.4s ease-out var(--d) infinite}
@keyframes fqp-joie{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-6%) rotate(3deg)}}
.sent-colere .fqp-fig{background:radial-gradient(80% 60% at 50% 30%,#FF6B4A,#B3121F 60%,#3A0408)}
.sent-colere .fqp-corps{animation:fqp-colere .11s linear infinite;filter:drop-shadow(0 0 16px rgba(255,40,20,.85)) saturate(1.3)}
.sent-colere .fqp-sent i{top:6%;left:calc(18% + var(--x) * .64);animation:fqp-gonfle 1.1s ease-out var(--d) infinite}
@keyframes fqp-colere{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-2.5%) rotate(-1.5deg)}75%{transform:translateX(2.5%) rotate(1.5deg)}}
.sent-tristesse .fqp-fig{background:radial-gradient(80% 60% at 50% 30%,#9EC9FF,#3C5FA8 60%,#16234A)}
.sent-tristesse .fqp-corps{animation:fqp-triste 3s ease-in-out infinite;filter:grayscale(.35) brightness(.92)}
.sent-tristesse .fqp-sent i{top:-10%;font-size:18px;animation:fqp-pluie 1.6s linear var(--d) infinite}
@keyframes fqp-triste{0%,100%{transform:rotate(-3deg) translateY(2%) scale(.97)}50%{transform:rotate(-6deg) translateY(4%) scale(.95)}}
.sent-euphorie .fqp-fig{background:linear-gradient(135deg,#FF2E9A,#FFB547,#5CE1E6,#9B5CFF,#FF2E9A);background-size:300% 300%;animation:fqp-arcenciel 3s linear infinite}
.sent-euphorie .fqp-corps{animation:fqp-bond .7s cubic-bezier(.3,1.6,.5,1) infinite}
.sent-euphorie .fqp-sent i{top:42%;animation:fqp-eclate 1.4s ease-out var(--d) infinite}
@keyframes fqp-bond{0%,100%{transform:translateY(0) scale(1.04,.94)}45%{transform:translateY(-16%) scale(.96,1.05) rotate(var(--r,4deg))}}
@keyframes fqp-arcenciel{to{background-position:300% 0}}
@keyframes fqp-monte{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translateY(-110%) scale(1.2) rotate(var(--r))}}
@keyframes fqp-gonfle{0%{opacity:0;transform:scale(.3)}30%{opacity:1;transform:scale(1.25)}100%{opacity:0;transform:scale(.9) translateY(-30px)}}
@keyframes fqp-pluie{0%{opacity:0;transform:translateY(0)}10%{opacity:.9}100%{opacity:0;transform:translateY(340px)}}
@keyframes fqp-eclate{0%{opacity:0;transform:translate(0,0) scale(.4)}20%{opacity:1}100%{opacity:0;transform:translate(calc((var(--x) - 46%) * 1.6),-160px) scale(1.3) rotate(var(--r))}}
@media (prefers-reduced-motion:reduce){.fqp-corps,.fqp-sent i,.fqp-fig{animation:none!important}}
`;
