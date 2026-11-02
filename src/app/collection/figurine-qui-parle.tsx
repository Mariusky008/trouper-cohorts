"use client";

/**
 * 🗣️ UNE FIGURINE QUI PARLE — ses deux images (bouche fermée, bouche ouverte) et une voix : la bouche s'ouvre quand
 * la voix est forte, comme dans la démo. Le volume se mesure dans le navigateur (`AnalyserNode`) ; si le navigateur
 * ne sait pas, la bouche bat en rythme tant que la voix joue.
 *
 * LA VOIX EST CHARGÉE EN ENTIER AVANT DE JOUER (une adresse `blob:`) : l'iPhone ne lit pas un son servi sans
 * « morceaux », et la mesure du volume demande un son de la même origine.
 */
import { useEffect, useRef, useState } from "react";

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
};

type Fenetre = Window & { webkitAudioContext?: typeof AudioContext };

export function FigurineQuiParle({ neutre, parle, src, etiquette = "▶ Écouter", onFin, className }: Props) {
  const boite = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const contexte = useRef<AudioContext | null>(null);
  const analyse = useRef<AnalyserNode | null>(null);
  const local = useRef<string>("");
  const raf = useRef(0);
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
      ouverte = Math.sqrt(somme / t.length) > 0.045;
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
      }
      await contexte.current?.resume().catch(() => undefined);
      const a = audio.current!;
      a.currentTime = 0;
      await a.play();
      setJoue(true);
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(animer);
    } catch {
      setEnnui("Le son n’a pas pu se lancer. Réessaie.");
    } finally {
      setCharge(false);
    }
  }

  return (
    <div className={`fqp${className ? ` ${className}` : ""}`}>
      <div className="fqp-fig" ref={boite}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fqp-n" src={neutre} alt="" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fqp-p" src={parle} alt="" draggable={false} />
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
.fqp-fig img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fqp-p{opacity:0}
.fqp-fig.ouverte .fqp-p{opacity:1}
.fqp-fig.ouverte .fqp-n{opacity:0}
.fqp-ondes{position:absolute;inset:-2px;border-radius:24px;box-shadow:inset 0 0 0 3px rgba(242,196,107,.8);animation:fqp-ondes 1.2s ease-out infinite;pointer-events:none}
.fqp-jouer{min-width:170px;padding:14px 26px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 10px 24px -10px rgba(255,46,154,.9)}
.fqp-jouer:disabled{opacity:.6}
.fqp-ennui{margin:0;font-size:13px;color:#FFB4B4}
@keyframes fqp-ondes{0%{opacity:1}100%{opacity:0;transform:scale(1.04)}}
`;
