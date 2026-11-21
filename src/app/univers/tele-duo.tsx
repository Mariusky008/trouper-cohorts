"use client";

/**
 * 📺 LA TÉLÉ DE LA PIÈCE DU DUO (`lib/direct/tele.ts`, `docs/univers/piece-du-duo.md`) — un morceau autonome : la
 * maquette de la pièce vivante (puis la conversation) la pose sur l'écran de la télé de sa pièce (`zone`, relevée sur
 * l'image : `pieces-duo.ts`), et lui dit si la caméra est près d'elle (`proche`).
 *
 * DE LOIN : allumée, elle continue de jouer (le lecteur suit l'écran, sans prendre le toucher) ; éteinte, l'écran
 * montre ce qui passe (l'aperçu du dernier lien, l'image du clip), sans bouton ; un toucher appelle
 * `onToucher` (la maquette s'approche). DE PRÈS : « ▶ Allumer la télé » (YouTube, lu dans l'écran : sur iPhone, ce
 * bouton est le geste qui donne le son ; si le téléphone refuse encore, le lecteur de YouTube garde son propre bouton) ;
 * « ▶ Ouvrir sur TikTok / Instagram » (ils se lisent mal hors de leur appli) ; « Éteindre ». Une vidéo qui refuse d'être
 * lue hors de YouTube (les erreurs du lecteur) : un clip de secours prend le relais, et « ▶ La regarder sur YouTube ».
 *
 * LE LECTEUR, LUI, N'EST PAS AGRANDI PAR LA CAMÉRA (15 novembre 2026, le propriétaire : « le bouton pause est à
 * l'extérieur de la télé et il est énorme ») : allumée, la télé pose le lecteur de YouTube par-dessus la page, exactement
 * sur son écran tel qu'on le voit (sa place mesurée à chaque image, pendant que la caméra glisse), à sa taille réelle —
 * ses boutons gardent leur taille normale.
 *
 * 📐 EN PERSPECTIVE (le propriétaire : « la télé posée au mur est en perspective, donc plus large à droite qu'à
 * gauche ») : avec ses quatre coins (`coins`, posés à la main), l'écran — l'image comme le lecteur — se déforme pour les
 * épouser (une transformation de perspective, `versQuad`). Et l'image remplit tout l'écran, comme une photo recadrée :
 * plus de bandes noires autour (« ça ne fait pas télé, mais iPad »).
 *
 * LES TAILLES suivent la télé (en part de sa largeur, jamais en pixels) : la caméra qui s'approche (une mise à l'échelle)
 * agrandit l'écran ET ses boutons ensemble, dans les mêmes proportions.
 *
 * Le lecteur : celui de YouTube (`youtube-nocookie.com`, chargé au premier allumage) ; s'il ne se charge pas, un
 * simple cadre de YouTube. 🎬 (lot S6, le salon du duo) une vidéo de leur conversation, filmée au téléphone
 * (`sorte: "video"`) : une simple vidéo, posée de la même façon, avec le son (« ▶ Allumer » est le geste qui le donne).
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PHRASES_TELE, secoursApres, surYouTube, vignetteYouTube, type ClipSecours, type ProgrammeTele, type ZoneTele } from "@/lib/direct/tele";

/** Ce qui joue : une vidéo YouTube (`id`), ou une vidéo de leur conversation (`src`, son adresse ; `id` : son message). */
type Video = { id: string; debut?: number; src?: string };
type LecteurYT = { destroy?: () => void; playVideo?: () => void; unloadModule?: (m: string) => void };
type EspaceYT = { Player: new (el: HTMLElement, o: Record<string, unknown>) => LecteurYT };
type FenetreYT = Window & { YT?: EspaceYT; onYouTubeIframeAPIReady?: () => void };

let chargement: Promise<EspaceYT> | null = null;
/** Le lecteur de YouTube, chargé une fois (au premier allumage) — 📺 ma télé du jour s'en sert aussi (`tele-du-jour.tsx`). */
export function chargerYouTube(): Promise<EspaceYT> {
  const w = window as FenetreYT;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (!chargement)
    chargement = new Promise<EspaceYT>((ok, ko) => {
      const avant = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        avant?.();
        if (w.YT?.Player) ok(w.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => {
        chargement = null;
        ko(new Error("YouTube ne répond pas"));
      };
      document.head.appendChild(s);
      setTimeout(() => {
        if (w.YT?.Player) return;
        chargement = null;
        ko(new Error("YouTube ne répond pas"));
      }, 12_000);
    });
  return chargement;
}

/** L'écran tel qu'on le voit (après la caméra), en pixels de la fenêtre. */
type Cadre = { l: number; t: number; w: number; h: number; coupe?: string };
/**
 * L'écran tel qu'on le voit ; et, si la scène qui le contient coupe ce qui la dépasse (son `overflow`), ce que le
 * lecteur posé par-dessus doit couper aussi (`coupe`, un `inset()` : il ne déborde jamais de la scène).
 */
function mesurer(el: HTMLElement | null, scene?: HTMLElement | null): Cadre | null {
  const r = el?.getBoundingClientRect();
  if (!r || r.width <= 0 || r.height <= 0) return null;
  const s = scene?.getBoundingClientRect();
  const coupe = s ? [s.top - r.top, r.right - s.right, r.bottom - s.bottom, s.left - r.left].map((v) => `${Math.max(0, Math.round(v))}px`).join(" ") : undefined;
  return { l: r.left, t: r.top, w: r.width, h: r.height, ...(coupe && coupe !== "0px 0px 0px 0px" ? { coupe } : {}) };
}
/**
 * 🧍 (21 novembre 2026, le propriétaire : « la télé passe au-dessus de la tête de la figurine ») le lecteur flotte
 * par-dessus la scène : là où une figurine assise devant la télé le recouvre, il est découpé à sa silhouette (le corps de
 * la figurine, sa tête d'origine comprise) — elle reste devant l'écran. En pixels du lecteur.
 */
type Silhouette = { src: string; x: number; y: number; w: number; h: number };
function silhouettesDevant(scene: HTMLElement | null, c: Cadre): Silhouette[] {
  if (!scene) return [];
  const l: Silhouette[] = [];
  for (const img of scene.querySelectorAll<HTMLImageElement>(".sc-fig > .sc-calque > img")) {
    const r = img.getBoundingClientRect();
    const src = img.currentSrc || img.src;
    if (!src || r.width <= 0 || r.right <= c.l || r.left >= c.l + c.w || r.bottom <= c.t || r.top >= c.t + c.h) continue;
    l.push({ src, x: Math.round(r.left - c.l), y: Math.round(r.top - c.t), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return l;
}
/** Le masque du lecteur : tout l'écran, moins les silhouettes (chacune « exclue » du fond). */
function masqueDe(s: Silhouette[]): React.CSSProperties {
  if (!s.length) return {};
  const images = [...s.map((x) => `url("${x.src}")`), "linear-gradient(#000,#000)"].join(",");
  const positions = [...s.map((x) => `${x.x}px ${x.y}px`), "0 0"].join(",");
  const tailles = [...s.map((x) => `${x.w}px ${x.h}px`), "100% 100%"].join(",");
  return {
    WebkitMaskImage: images,
    WebkitMaskPosition: positions,
    WebkitMaskSize: tailles,
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskComposite: [...s.map(() => "xor"), "source-over"].join(","),
    maskImage: images,
    maskPosition: positions,
    maskSize: tailles,
    maskRepeat: "no-repeat",
    maskComposite: [...s.map(() => "exclude"), "add"].join(","),
  } as React.CSSProperties;
}
const memesSilhouettes = (a: Silhouette[], b: Silhouette[]) => a.length === b.length && a.every((x, k) => x.src === b[k].src && x.x === b[k].x && x.y === b[k].y && x.w === b[k].w && x.h === b[k].h);
/** La scène qui contient la télé et coupe ce qui la dépasse (le premier parent en `overflow: hidden`). */
function sceneDe(el: HTMLElement | null): HTMLElement | null {
  for (let x = el?.parentElement ?? null; x; x = x.parentElement) {
    const o = getComputedStyle(x).overflow;
    if (o.includes("hidden") || o.includes("clip")) return x;
  }
  return null;
}

/**
 * 📐 La transformation qui pose un rectangle L × H sur quatre coins (en haut à gauche, en haut à droite, en bas à droite,
 * en bas à gauche, en pixels) : le carré unité vers le quadrilatère (Heckbert), mise à l'échelle du rectangle, en
 * `matrix3d` (son origine en haut à gauche).
 */
export function versQuad(q: [number, number][], L: number, H: number): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = det ? (sx * dy2 - dx2 * sy) / det : 0;
  const h = det ? (dx1 * sy - sx * dy1) / det : 0;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const n = (v: number) => Number(v.toFixed(6));
  return `matrix3d(${n(a / L)},${n(d / L)},0,${n(g / L)},${n(b / H)},${n(e / H)},0,${n(h / H)},0,0,1,0,${n(x0)},${n(y0)},0,1)`;
}

/** La vidéo (16/9) qui couvre un écran L × H, centrée : ce qui dépasse est coupé, jamais de bandes noires. */
function couvrir(L: number, H: number) {
  const l = Math.max(L, (H * 16) / 9);
  const h = (l * 9) / 16;
  return { left: (L - l) / 2, top: (H - h) / 2, width: l, height: h };
}

/** L'image que l'écran montre, éteint : l'aperçu du lien, l'image du clip. */
function imageDe(p: ProgrammeTele): string {
  if (p.sorte === "youtube") return p.apercu || vignetteYouTube(p.id);
  if (p.sorte === "ouvrir") return p.apercu ?? "";
  if (p.sorte === "secours") return vignetteYouTube(p.id);
  if (p.sorte === "video") return p.vignette;
  if (p.sorte === "film") return p.affiche ?? "";
  return "";
}

export function TeleDuo({
  programme,
  secours = [],
  zone,
  coins,
  proche = true,
  onToucher,
}: {
  programme: ProgrammeTele;
  secours?: ClipSecours[];
  zone?: ZoneTele;
  /** 📐 les quatre coins de l'écran, en fractions de l'image (comme `zone`, qui est alors leur boîte) */
  coins?: [number, number][];
  proche?: boolean;
  onToucher?: () => void;
}) {
  const [video, setVideo] = useState<Video | null>(null);
  const [refusees, setRefusees] = useState<string[]>([]);
  const [note, setNote] = useState<{ texte: string; lien?: string } | null>(null);
  const [simple, setSimple] = useState(false);
  const hote = useRef<HTMLDivElement>(null);
  const ecran = useRef<HTMLDivElement>(null);
  const [cadre, setCadre] = useState<Cadre | null>(null);
  const [silhouettes, setSilhouettes] = useState<Silhouette[]>([]);
  const [taille, setTaille] = useState<{ l: number; h: number } | null>(null);
  const allumee = Boolean(video);
  // (les coins, dans la télé : de 0 à 1 sur sa boîte)
  const rel = zone && coins?.length === 4 && zone[2] > 0 && zone[3] > 0 ? coins.map(([x, y]) => [(x - zone[0]) / zone[2], (y - zone[1]) / zone[3]] as [number, number]) : null;

  // (sa taille avant la caméra : la déformation se calcule dessus)
  useEffect(() => {
    const el = ecran.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setTaille({ l: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // (allumée : l'écran tel qu'on le voit, mesuré à chaque image — la caméra peut glisser, la page défiler)
  useEffect(() => {
    if (!allumee) return;
    let id = 0;
    const scene = sceneDe(ecran.current);
    const suivre = () => {
      const c = mesurer(ecran.current, scene);
      if (c) setCadre((x) => (x && Math.abs(x.l - c.l) < 0.5 && Math.abs(x.t - c.t) < 0.5 && Math.abs(x.w - c.w) < 0.5 && Math.abs(x.h - c.h) < 0.5 && x.coupe === c.coupe ? x : c));
      // (🧍 les figurines assises devant l'écran : découpées dans le lecteur)
      if (c) {
        const s = silhouettesDevant(scene, c);
        setSilhouettes((x) => (memesSilhouettes(x, s) ? x : s));
      }
      id = requestAnimationFrame(suivre);
    };
    id = requestAnimationFrame(suivre);
    return () => cancelAnimationFrame(id);
  }, [allumee]);

  // (DE LOIN, ELLE RESTE ALLUMÉE — le propriétaire : « rester allumée même quand je clique sur la pièce entière, pour
  // continuer à profiter de toute la pièce » ; le lecteur suit l'écran, et un toucher ramène la caméra sur elle)

  useEffect(() => {
    if (!video || simple || video.src) return;
    let fini = false;
    let lecteur: LecteurYT | null = null;
    chargerYouTube()
      .then((YT) => {
        if (fini || !hote.current) return;
        const cible = document.createElement("div");
        hote.current.replaceChildren(cible);
        lecteur = new YT.Player(cible, {
          videoId: video.id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          // (ni annotations, ni sous-titres d'office : une télé, pas une page de YouTube)
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 1, iv_load_policy: 3, cc_load_policy: 0, ...(video.debut ? { start: video.debut } : {}), origin: window.location.origin },
          events: {
            onReady: (e: { target?: LecteurYT }) => {
              try {
                e.target?.unloadModule?.("captions");
                e.target?.playVideo?.();
              } catch {
                /* (le téléphone garde la main : le bouton de YouTube reste là) */
              }
            },
            // (101, 150 : elle refuse d'être lue hors de YouTube ; 100 : partie ; 2, 5 : illisible ici)
            onError: () => {
              if (fini) return;
              const r = [...refusees, video.id];
              const suivant = secoursApres(secours, r);
              setRefusees(r);
              setNote({ texte: PHRASES_TELE.refuse, lien: surYouTube(video.id, video.debut) });
              setVideo(suivant ? { id: suivant.id, ...(suivant.debut ? { debut: suivant.debut } : {}) } : null);
            },
          },
        });
      })
      .catch(() => {
        if (!fini) setSimple(true);
      });
    return () => {
      fini = true;
      try {
        lecteur?.destroy?.();
      } catch {
        /* (déjà parti) */
      }
    };
    // (un lecteur par vidéo : `refusees` et `secours` sont lus au moment de l'erreur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id, simple, Boolean(cadre)]);

  function allumer() {
    setNote(null);
    // (le lecteur se pose tout de suite sur l'écran : sa place, mesurée avant de l'allumer)
    setCadre(mesurer(ecran.current, sceneDe(ecran.current)));
    if (programme.sorte === "youtube" || programme.sorte === "secours") setVideo({ id: programme.id, ...(programme.debut ? { debut: programme.debut } : {}) });
    else if (programme.sorte === "video") setVideo({ id: programme.message, src: programme.url });
  }

  const image = imageDe(programme);
  // 📐 l'écran déformé sur ses quatre coins (dans la télé, avant la caméra) ; le lecteur, sur l'écran tel qu'on le voit
  const deforme = rel && taille ? { left: 0, top: 0, right: "auto", bottom: "auto", width: taille.l, height: taille.h, transformOrigin: "0 0", transform: versQuad(rel.map(([u, v]) => [u * taille.l, v * taille.h]), taille.l, taille.h) } : undefined;
  const deformeLecteur = rel && cadre ? { width: cadre.w, height: cadre.h, transformOrigin: "0 0", transform: versQuad(rel.map(([u, v]) => [u * cadre.w, v * cadre.h]), cadre.w, cadre.h) } : { width: "100%", height: "100%" };
  const video169 = cadre ? couvrir(cadre.w, cadre.h) : null;
  const style = zone ? { left: `${zone[0] * 100}%`, top: `${zone[1] * 100}%`, width: `${zone[2] * 100}%`, height: `${zone[3] * 100}%` } : { inset: 0 };
  const deLoin = !proche && onToucher;
  return (
    <div
      ref={ecran}
      className={`tv${allumee ? " allumee" : ""}${proche ? " proche" : ""}${rel ? " en-perspective" : ""}`}
      style={style}
      data-tele={allumee ? "allumee" : "eteinte"}
      data-programme={programme.sorte}
      data-video={video?.id ?? ""}
      {...(deLoin ? { role: "button", tabIndex: 0, "aria-label": "La télé", onClick: onToucher, onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && onToucher() } : {})}
    >
      {allumee && video ? (
        <span className="tv-ecran noir" aria-hidden="true" style={deforme} />
      ) : (
        <span className="tv-ecran" aria-hidden="true" style={deforme}>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
          )}
          {/* 🍿 (lot S6) un film : son titre sur l'écran, et « Ce soir » */}
          {programme.sorte === "film" && (
            <>
              {!image && <span className="tv-titre-film">{programme.titre || programme.site}</span>}
              <span className="tv-ce-soir">{PHRASES_TELE.ceSoirBadge}</span>
            </>
          )}
        </span>
      )}
      {proche && (
        <span className="tv-gestes">
          {allumee ? (
            <button
              type="button"
              className="tv-eteindre"
              onClick={(e) => {
                e.stopPropagation();
                setVideo(null);
              }}
            >
              ⏻ {PHRASES_TELE.eteindre}
            </button>
          ) : programme.sorte === "ouvrir" ? (
            <a className="tv-bouton" data-geste="ouvrir" href={programme.url} target="_blank" rel="noopener noreferrer">
              {PHRASES_TELE.ouvrir(programme.plateforme)}
            </a>
          ) : programme.sorte === "film" ? (
            <a className="tv-bouton" data-geste="ouvrir" href={programme.url} target="_blank" rel="noopener noreferrer">
              {PHRASES_TELE.ouvrirFilm(programme.site)}
            </a>
          ) : programme.sorte === "eteinte" ? (
            <small className="tv-rien">{PHRASES_TELE.eteinte}</small>
          ) : (
            <>
              {programme.sorte === "secours" && <small className="tv-legende">{PHRASES_TELE.secours}</small>}
              <button
                type="button"
                className="tv-bouton"
                data-geste="allumer"
                onClick={(e) => {
                  e.stopPropagation();
                  allumer();
                }}
              >
                {PHRASES_TELE.allumer}
              </button>
            </>
          )}
        </span>
      )}
      {proche && note && (
        <span className="tv-note" role="status">
          {note.texte}
          {note.lien && (
            <a href={note.lien} target="_blank" rel="noopener noreferrer">
              {PHRASES_TELE.surYouTube}
            </a>
          )}
        </span>
      )}
      <style>{STYLES_TELE}</style>
      {allumee &&
        video &&
        cadre &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="tv-flottant"
            // (de loin, le lecteur ne prend pas le toucher : il passe à la télé, qui ramène la caméra)
            style={{ left: cadre.l, top: cadre.t, width: cadre.w, height: cadre.h, pointerEvents: proche ? "auto" : "none", ...(cadre.coupe ? { clipPath: `inset(${cadre.coupe})` } : {}), ...masqueDe(silhouettes) }}
            data-lecteur={video.id}
            data-silhouettes={silhouettes.length || undefined}
            data-proche={proche ? "1" : "0"}
          >
            <div className="tv-deforme" style={deformeLecteur}>
              <div className="tv-video" style={video.src ? { inset: 0 } : (video169 ?? undefined)}>
                {video.src ? (
                  <video
                    className="tv-lecteur tv-fichier"
                    src={video.src}
                    autoPlay
                    playsInline
                    controls
                    onError={() => {
                      setNote({ texte: PHRASES_TELE.illisible });
                      setVideo(null);
                    }}
                  />
                ) : simple ? (
                  <iframe
                    className="tv-cadre"
                    title="La télé"
                    src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0&iv_load_policy=3${video.debut ? `&start=${video.debut}` : ""}`}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="tv-lecteur" ref={hote} />
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const STYLES_TELE = `
.tv{position:absolute;container-type:inline-size;border-radius:3px;overflow:visible;background:#06080b;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.tv[role="button"]{cursor:pointer}
.tv-ecran{position:absolute;inset:0;overflow:hidden;border-radius:inherit}
.tv-ecran img{width:100%;height:100%;object-fit:cover;filter:saturate(.9) brightness(.82)}
.tv-ecran::after{content:"";position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 38%),radial-gradient(120% 90% at 50% 50%,rgba(0,0,0,0) 55%,rgba(0,0,0,.45) 100%);pointer-events:none}
.tv-ecran.noir{background:#000}
.tv-ce-soir{position:absolute;left:4%;top:6%;padding:.25em .6em;border-radius:999px;background:#ffd400;color:#2a1424;font-weight:800;font-size:4.2cqw;line-height:1.1;box-shadow:0 .4cqw 1.6cqw rgba(0,0,0,.35);z-index:1}
.tv-titre-film{position:absolute;inset:0;display:grid;place-items:center;padding:0 8%;color:#fff;font-weight:800;font-size:6cqw;line-height:1.15;text-align:center;background:radial-gradient(circle at 50% 40%,#3a1d4a,#0b0610)}
.tv.en-perspective{background:transparent;box-shadow:none;border-radius:0}
.tv.en-perspective .tv-ecran{border-radius:0}
.tv-flottant{position:fixed;z-index:40;overflow:visible;background:transparent}
.tv-deforme{position:absolute;left:0;top:0;overflow:hidden;background:#000}
.tv-video{position:absolute}
.tv-lecteur,.tv-cadre{position:absolute;inset:0;width:100%;height:100%;border:0;overflow:hidden;background:#000}
.tv-lecteur iframe{width:100%;height:100%;border:0}
.tv-fichier{object-fit:cover}
.tv-gestes{position:absolute;left:0;right:0;bottom:7%;display:flex;flex-direction:column;align-items:center;gap:2cqw;pointer-events:none}
.tv.allumee .tv-gestes{top:100%;bottom:auto;margin-top:2cqw;align-items:flex-end}
.tv-bouton,.tv-eteindre{pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;gap:.3em;padding:.5em 1.1em;border:0;border-radius:999px;background:#ff2e9a;color:#fff;font-weight:800;font-size:5.4cqw;line-height:1.1;text-decoration:none;box-shadow:0 .5cqw 2.5cqw rgba(0,0,0,.35);cursor:pointer;white-space:nowrap}
.tv-eteindre{background:rgba(20,20,24,.82);font-weight:700;font-size:3.8cqw}
.tv-legende,.tv-rien{padding:.2em .7em;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font-size:3.6cqw;text-align:center;max-width:92%;white-space:nowrap}
.tv-rien{white-space:normal;line-height:1.25;border-radius:1em}
.tv-note{position:absolute;left:0;right:0;bottom:100%;margin-bottom:2cqw;display:flex;flex-wrap:wrap;justify-content:center;gap:.3em .7em;padding:.4em .7em;border-radius:1em;background:rgba(20,20,24,.86);color:#fff;font-size:3.6cqw;line-height:1.3;text-align:center}
.tv-note a{color:#ffd400;font-weight:700;text-decoration:none}
`;
