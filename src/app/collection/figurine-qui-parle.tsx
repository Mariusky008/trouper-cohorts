"use client";

/**
 * 🗣️ UNE FIGURINE QUI PARLE — ses images (bouche fermée, bouche ouverte) et une voix : la bouche s'ouvre quand la voix
 * est forte. Le volume se mesure dans le navigateur (`AnalyserNode`) ; si le navigateur ne sait pas — ou si la mesure
 * ne rend que du silence alors que la voix joue depuis une demi-seconde —, la bouche bat en rythme.
 *
 * CE QU'ELLE RESSENT (`sentiment`), SUR SON VISAGE (4 novembre 2026 : « les émotions devaient être réelles, avec des
 * expressions du visage, et pas un décor ») : ses images d'expression (`expressions`, faites par le moteur d'image)
 * remplacent ses images de tous les jours. Toutes sont posées l'une sur l'autre dès le début : passer d'une expression
 * à l'autre est immédiat. Tant qu'une expression n'est pas faite, elle la joue seulement en bougeant (un petit badge
 * le dit) — plus de fond coloré ni de pluie d'émojis.
 *
 * `jouer(son)` (par `ref`) : la voix peut arriver APRÈS le toucher (un texte lu par une voix, fabriqué en une ou deux
 * secondes) — le son est préparé au toucher même (un iPhone ne laisse jouer qu'un son lancé par un geste), puis joué
 * dès qu'il arrive. LA VOIX EST CHARGÉE EN ENTIER (une adresse `blob:` ou `data:`) : l'iPhone ne lit pas un son servi
 * sans « morceaux », et la mesure du volume demande un son de la même origine.
 */
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { SENTIMENTS, sentimentDe, type Expressions, type Sentiment } from "@/lib/direct/ma-figurine";

export type FigurineHandle = {
  /** Joue ce son (une adresse, ou de quoi l'obtenir : il est préparé au toucher, joué dès qu'il arrive). */
  jouer: (son: string | (() => Promise<string>)) => Promise<boolean>;
  arreter: () => void;
};

type Props = {
  neutre: string;
  parle: string;
  /** Ses expressions déjà faites (sinon, elle bouge seulement). */
  expressions?: Expressions;
  /** Une voix à jouer avec son propre bouton (la page d'un message reçu). Sans elle : `ref.jouer`. */
  src?: string;
  /** « ▶ Écouter », « ▶ Réécouter ». */
  etiquette?: string;
  /** Appelé à la fin de la voix. */
  onFin?: () => void;
  /** Elle parle / elle se tait. */
  onJoue?: (joue: boolean) => void;
  className?: string;
  /** Ce qu'elle ressent (rien : son visage de tous les jours). */
  sentiment?: Sentiment | null;
  /** Relance le petit saut du changement d'expression. */
  rejoue?: number;
  /** Images détourées (fond transparent) : posées debout dans le cadre. */
  decoupe?: boolean;
  ref?: Ref<FigurineHandle>;
};

type Fenetre = Window & { webkitAudioContext?: typeof AudioContext };
/** Un silence d'un instant : joué au toucher, il ouvre le son pour la suite (iPhone). */
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export function FigurineQuiParle({ neutre, parle, expressions, src, etiquette = "▶ Écouter", onFin, onJoue, className, sentiment, rejoue = 0, decoupe, ref }: Props) {
  const boite = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const contexte = useRef<AudioContext | null>(null);
  const analyse = useRef<AnalyserNode | null>(null);
  const locaux = useRef<string[]>([]);
  const raf = useRef(0);
  const pic = useRef(0);
  const tour = useRef(0);
  const [joue, setJoue] = useState(false);
  const [charge, setCharge] = useState(false);
  const [ennui, setEnnui] = useState("");

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      audio.current?.pause();
      for (const u of locaux.current) URL.revokeObjectURL(u);
      void contexte.current?.close().catch(() => undefined);
    },
    [],
  );
  useEffect(() => onJoue?.(joue), [joue, onJoue]);

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

  /** Le lecteur, préparé une fois (au premier toucher) : relié à la mesure du volume. */
  function lecteur(): HTMLAudioElement {
    if (audio.current) return audio.current;
    const a = new Audio();
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
    return a;
  }

  /** Une adresse que le navigateur peut lire ET mesurer : `blob:` ou `data:` telles quelles, sinon chargée en entier. */
  async function enLocal(u: string): Promise<string> {
    if (u.startsWith("blob:") || u.startsWith("data:")) return u;
    const r = await fetch(u, { cache: "no-store" });
    if (!r.ok) throw new Error("son");
    const local = URL.createObjectURL(await r.blob());
    locaux.current.push(local);
    return local;
  }

  async function jouer(son: string | (() => Promise<string>)): Promise<boolean> {
    setEnnui("");
    const mon = ++tour.current;
    // AU TOUCHER MÊME : le lecteur et le son s'ouvrent (un iPhone ne joue qu'un son lancé par un geste)
    const a = lecteur();
    void contexte.current?.resume().catch(() => undefined);
    a.pause();
    a.src = SILENCE;
    void a.play().catch(() => undefined);
    setCharge(true);
    try {
      const url = await enLocal(typeof son === "string" ? son : await son());
      if (mon !== tour.current) return false;
      a.pause();
      a.src = url;
      a.currentTime = 0;
      pic.current = 0;
      marquer("lecture", "lance");
      await a.play();
      marquer("lecture", "joue");
      setJoue(true);
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(animer);
      return true;
    } catch (e) {
      marquer("lecture", `erreur ${(e as Error)?.name ?? ""}`.trim());
      // (nos propres messages, en français ; jamais ceux du navigateur, en anglais)
      const notre = e instanceof Error && e.name === "Error" && e.message && e.message !== "son";
      if (mon === tour.current) setEnnui(notre ? (e as Error).message : "Le son n’a pas pu se lancer. Réessaie.");
      return false;
    } finally {
      if (mon === tour.current) setCharge(false);
    }
  }

  const arreter = () => {
    tour.current++;
    audio.current?.pause();
    setCharge(false);
  };
  useImperativeHandle(ref, () => ({ jouer, arreter }));

  // ses poses : celle de tous les jours, et chaque expression faite (toutes posées d'avance : le changement est immédiat)
  const poses = [{ cle: "", n: neutre, p: parle }, ...SENTIMENTS.flatMap(({ cle }) => (expressions?.[cle] ? [{ cle, ...expressions[cle]! }] : []))];
  const active = sentiment && expressions?.[sentiment] ? sentiment : "";
  const sansVisage = Boolean(sentiment && !active);
  const s = sentimentDe(sentiment);

  return (
    <div
      className={`fqp${className ? ` ${className}` : ""}${decoupe ? " decoupe" : ""}${sentiment ? ` sent-${sentiment}` : ""}${sansVisage ? " bouge" : ""}`}
      data-sentiment={sentiment ?? ""}
      data-visage={active || (sentiment ? "mouvement" : "")}
    >
      <div className="fqp-fig" ref={boite}>
        <span className="fqp-corps" key={`${sentiment ?? ""}-${rejoue}`}>
          {poses.map((x) => (
            <span key={x.cle || "base"} className={`fqp-pose${x.cle === active ? " vu" : ""}`} aria-hidden={x.cle !== active}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="fqp-n" src={x.n} alt="" draggable={false} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="fqp-p" src={x.p} alt="" draggable={false} />
            </span>
          ))}
        </span>
        {sansVisage && s && (
          <b className="fqp-badge" aria-hidden="true">
            {s.emoji}
          </b>
        )}
        {joue && <span className="fqp-ondes" aria-hidden="true" />}
      </div>
      {src !== undefined && (
        <button type="button" className="fqp-jouer" onClick={() => (joue ? arreter() : void jouer(src))} disabled={charge}>
          {charge ? "…" : joue ? "⏸ Pause" : etiquette}
        </button>
      )}
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
.fqp-fig{position:relative;width:min(260px,70vw);aspect-ratio:3/4;border-radius:24px;overflow:hidden;
  background:radial-gradient(70% 55% at 50% 38%,#FF9AD0,#C2367F 62%,#5E1240);box-shadow:0 22px 44px -18px rgba(0,0,0,.9)}
.fqp-corps{position:absolute;inset:0;transform-origin:50% 100%;animation:fqp-change .35s cubic-bezier(.2,1.5,.4,1)}
.fqp-pose{position:absolute;inset:0;opacity:0;transition:opacity .22s}
.fqp-pose.vu{opacity:1}
.fqp-fig img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fqp.decoupe .fqp-fig img{top:7%;height:93%;object-fit:contain;object-position:50% 100%;filter:drop-shadow(0 14px 12px rgba(0,0,0,.45))}
.fqp-p{opacity:0}
.fqp-fig.ouverte .fqp-pose.vu .fqp-p{opacity:1}
.fqp-fig.ouverte .fqp-pose.vu .fqp-n{opacity:0}
.fqp-ondes{position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 3px rgba(242,196,107,.85);animation:fqp-ondes 1.2s ease-out infinite;pointer-events:none}
.fqp-jouer{min-width:170px;padding:14px 26px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 10px 24px -10px rgba(255,46,154,.9)}
.fqp-jouer:disabled{opacity:.6}
.fqp-ennui{margin:0;font-size:13px;color:#FFB4B4;text-align:center}
.fqp-badge{position:absolute;right:10px;top:10px;z-index:2;display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.92);font-size:24px;box-shadow:0 8px 18px rgba(0,0,0,.35);animation:fqp-badge .45s cubic-bezier(.2,1.6,.4,1) both}
@keyframes fqp-change{from{transform:scale(.96)}}
@keyframes fqp-ondes{0%{opacity:1}100%{opacity:0;transform:scale(1.04)}}
@keyframes fqp-badge{from{transform:scale(0) rotate(-40deg)}}
/* une expression pas encore faite : elle la joue en bougeant */
.bouge.sent-joie .fqp-corps{animation:fqp-joie .5s ease-in-out infinite alternate}
.bouge.sent-colere .fqp-corps{animation:fqp-colere .11s linear infinite}
.bouge.sent-tristesse .fqp-corps{animation:fqp-triste 3s ease-in-out infinite;filter:grayscale(.3) brightness(.94)}
.bouge.sent-euphorie .fqp-corps{animation:fqp-bond .7s cubic-bezier(.3,1.6,.5,1) infinite}
@keyframes fqp-joie{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-5%) rotate(3deg)}}
@keyframes fqp-colere{0%,100%{transform:translateX(0)}25%{transform:translateX(-2%) rotate(-1deg)}75%{transform:translateX(2%) rotate(1deg)}}
@keyframes fqp-triste{0%,100%{transform:rotate(-2deg) translateY(2%) scale(.98)}50%{transform:rotate(-4deg) translateY(3%) scale(.97)}}
@keyframes fqp-bond{0%,100%{transform:translateY(0) scale(1.03,.95)}45%{transform:translateY(-12%) scale(.97,1.04)}}
@media (prefers-reduced-motion:reduce){.fqp-corps,.fqp-badge,.fqp-ondes{animation:none!important}}
`;
