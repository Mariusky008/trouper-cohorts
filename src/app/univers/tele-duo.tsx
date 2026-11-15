"use client";

/**
 * 📺 LA TÉLÉ DE LA PIÈCE DU DUO (`lib/direct/tele.ts`, `docs/univers/piece-du-duo.md`) — un morceau autonome : la
 * maquette de la pièce vivante (puis la conversation) la pose sur l'écran de la télé de sa pièce (`zone`, relevée sur
 * l'image : `pieces-duo.ts`), et lui dit si la caméra est près d'elle (`proche`).
 *
 * DE LOIN : l'écran montre ce qui passe (l'aperçu du dernier lien, l'image du clip), sans bouton ; un toucher appelle
 * `onToucher` (la maquette s'approche). DE PRÈS : « ▶ Allumer la télé » (YouTube, lu dans l'écran : sur iPhone, ce
 * bouton est le geste qui donne le son ; si le téléphone refuse encore, le lecteur de YouTube garde son propre bouton) ;
 * « ▶ Ouvrir sur TikTok / Instagram » (ils se lisent mal hors de leur appli) ; « Éteindre ». Une vidéo qui refuse d'être
 * lue hors de YouTube (les erreurs du lecteur) : un clip de secours prend le relais, et « ▶ La regarder sur YouTube ».
 *
 * LES TAILLES suivent la télé (en part de sa largeur, jamais en pixels) : la caméra qui s'approche (une mise à l'échelle)
 * agrandit l'écran ET ses boutons ensemble, dans les mêmes proportions.
 *
 * Le lecteur : celui de YouTube (`youtube-nocookie.com`, chargé au premier allumage) ; s'il ne se charge pas, un
 * simple cadre de YouTube.
 */
import { useEffect, useRef, useState } from "react";
import { PHRASES_TELE, secoursApres, surYouTube, vignetteYouTube, type ClipSecours, type ProgrammeTele, type ZoneTele } from "@/lib/direct/tele";

type Video = { id: string; debut?: number };
type LecteurYT = { destroy?: () => void; playVideo?: () => void };
type EspaceYT = { Player: new (el: HTMLElement, o: Record<string, unknown>) => LecteurYT };
type FenetreYT = Window & { YT?: EspaceYT; onYouTubeIframeAPIReady?: () => void };

let chargement: Promise<EspaceYT> | null = null;
/** Le lecteur de YouTube, chargé une fois (au premier allumage). */
function chargerYouTube(): Promise<EspaceYT> {
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

/** L'image que l'écran montre, éteint : l'aperçu du lien, l'image du clip. */
function imageDe(p: ProgrammeTele): string {
  if (p.sorte === "youtube") return p.apercu || vignetteYouTube(p.id);
  if (p.sorte === "ouvrir") return p.apercu ?? "";
  if (p.sorte === "secours") return vignetteYouTube(p.id);
  return "";
}

export function TeleDuo({
  programme,
  secours = [],
  zone,
  proche = true,
  onToucher,
}: {
  programme: ProgrammeTele;
  secours?: ClipSecours[];
  zone?: ZoneTele;
  proche?: boolean;
  onToucher?: () => void;
}) {
  const [video, setVideo] = useState<Video | null>(null);
  const [refusees, setRefusees] = useState<string[]>([]);
  const [note, setNote] = useState<{ texte: string; lien?: string } | null>(null);
  const [simple, setSimple] = useState(false);
  const hote = useRef<HTMLDivElement>(null);
  const allumee = Boolean(video);

  // (de loin, la télé s'éteint : on n'entend pas une télé qu'on ne regarde plus)
  useEffect(() => {
    if (!proche) void Promise.resolve().then(() => setVideo(null));
  }, [proche]);

  useEffect(() => {
    if (!video || simple) return;
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
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 1, ...(video.debut ? { start: video.debut } : {}), origin: window.location.origin },
          events: {
            onReady: (e: { target?: LecteurYT }) => {
              try {
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
  }, [video?.id, simple]);

  function allumer() {
    setNote(null);
    if (programme.sorte === "youtube" || programme.sorte === "secours") setVideo({ id: programme.id, ...(programme.debut ? { debut: programme.debut } : {}) });
  }

  const image = imageDe(programme);
  const style = zone ? { left: `${zone[0] * 100}%`, top: `${zone[1] * 100}%`, width: `${zone[2] * 100}%`, height: `${zone[3] * 100}%` } : { inset: 0 };
  const deLoin = !proche && onToucher;
  return (
    <div
      className={`tv${allumee ? " allumee" : ""}${proche ? " proche" : ""}`}
      style={style}
      data-tele={allumee ? "allumee" : "eteinte"}
      data-programme={programme.sorte}
      data-video={video?.id ?? ""}
      {...(deLoin ? { role: "button", tabIndex: 0, "aria-label": "La télé", onClick: onToucher, onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && onToucher() } : {})}
    >
      {allumee && video ? (
        simple ? (
          <iframe
            className="tv-cadre"
            title="La télé"
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0${video.debut ? `&start=${video.debut}` : ""}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="tv-lecteur" ref={hote} />
        )
      ) : (
        <span className="tv-ecran" aria-hidden="true">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" referrerPolicy="no-referrer" />
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
    </div>
  );
}

const STYLES_TELE = `
.tv{position:absolute;container-type:inline-size;border-radius:3px;overflow:visible;background:#06080b;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.tv[role="button"]{cursor:pointer}
.tv-ecran{position:absolute;inset:0;overflow:hidden;border-radius:inherit}
.tv-ecran img{width:100%;height:100%;object-fit:cover;filter:saturate(.9) brightness(.82)}
.tv-ecran::after{content:"";position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 38%),radial-gradient(120% 90% at 50% 50%,rgba(0,0,0,0) 55%,rgba(0,0,0,.45) 100%);pointer-events:none}
.tv-lecteur,.tv-cadre{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:inherit;overflow:hidden;background:#000}
.tv-lecteur iframe{width:100%;height:100%;border:0}
.tv-gestes{position:absolute;left:0;right:0;bottom:7%;display:flex;flex-direction:column;align-items:center;gap:2cqw;pointer-events:none}
.tv.allumee .tv-gestes{top:100%;bottom:auto;margin-top:2cqw;align-items:flex-end}
.tv-bouton,.tv-eteindre{pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;gap:.3em;padding:.5em 1.1em;border:0;border-radius:999px;background:#ff2e9a;color:#fff;font-weight:800;font-size:5.4cqw;line-height:1.1;text-decoration:none;box-shadow:0 .5cqw 2.5cqw rgba(0,0,0,.35);cursor:pointer;white-space:nowrap}
.tv-eteindre{background:rgba(20,20,24,.82);font-weight:700;font-size:3.8cqw}
.tv-legende,.tv-rien{padding:.2em .7em;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font-size:3.6cqw;text-align:center;max-width:92%;white-space:nowrap}
.tv-rien{white-space:normal;line-height:1.25;border-radius:1em}
.tv-note{position:absolute;left:0;right:0;bottom:100%;margin-bottom:2cqw;display:flex;flex-wrap:wrap;justify-content:center;gap:.3em .7em;padding:.4em .7em;border-radius:1em;background:rgba(20,20,24,.86);color:#fff;font-size:3.6cqw;line-height:1.3;text-align:center}
.tv-note a{color:#ffd400;font-weight:700;text-decoration:none}
`;
