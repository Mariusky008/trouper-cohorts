"use client";

/**
 * 🎬 LA PAGE DU MOMENT QUI LE REJOUE (les grands moments, lot R4 ; `docs/univers/grands-moments.md`). En haut, la vidéo —
 * d'abord sa miniature et « ▶ Revoir le moment » ; un toucher : elle repart trois secondes avant, avec le son. Dessous, la
 * figurine de celui qui l'a envoyé, assise ; à la seconde de sa réaction, elle prend la scène (son grand moment : la tête
 * de l'émotion, l'aura, la bulle, les émojis). YouTube ne répond pas (ou tarde) : la miniature
 * reste, et le moment se joue quand même.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { chargerYouTube } from "@/app/univers/tele-duo";
import { GrandMoment } from "@/app/univers/salons/grand-moment";
import { GRAND_MOMENT, MOMENTS, type CleMoment } from "@/lib/direct/grands-moments";
import { MOMENT_PARTAGE as MP, PHRASES_MOMENT as P, minuteDuMoment } from "@/lib/direct/moment-partage";

type Lecteur = { getCurrentTime?: () => number; destroy?: () => void; playVideo?: () => void; unMute?: () => void };
const H = 300;

export function RejouerLeMoment({ id, video, t, e, mot, prenom }: { id: string; video: { id: string; titre: string }; t: number; e: CleMoment; mot: string; prenom: string }) {
  const m = MOMENTS[e];
  const [phase, setPhase] = useState<"attente" | "lecture" | "moment" | "fini">("attente");
  const [simple, setSimple] = useState(false);
  const [L, setL] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const tele = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const figure = `/api/direct/moment/${id}/figurine`;
  const minute = minuteDuMoment(t);
  const debut = Math.max(0, Math.floor(t) - MP.avant);

  useLayoutEffect(() => {
    const el = scene.current;
    if (!el) return;
    const mesurer = () => setL(el.clientWidth);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // (la lecture : la vidéo trois secondes avant ; à sa seconde, son grand moment)
  useEffect(() => {
    if (phase !== "lecture") return;
    let fini = false;
    let attente = 0;
    let suivi = 0;
    let secours = 0;
    let joue = false;
    const jouerLeMoment = () => {
      if (fini || joue) return;
      joue = true;
      window.clearTimeout(secours);
      setPhase("moment");
    };
    const sansYouTube = () => {
      setSimple(true);
      attente = window.setTimeout(jouerLeMoment, (t - debut) * 1000);
    };
    // (YouTube lent, ou la lecture bloquée : le moment se joue quand même, un peu après sa seconde)
    secours = window.setTimeout(() => {
      if (!lecteur.current?.getCurrentTime || Number(lecteur.current.getCurrentTime()) <= 0) setSimple(true);
      jouerLeMoment();
    }, (t - debut) * 1000 + 6000);
    chargerYouTube()
      .then((YT) => {
        if (fini || !tele.current) return;
        const cible = document.createElement("div");
        tele.current.replaceChildren(cible);
        lecteur.current = new YT.Player(cible, {
          videoId: video.id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, start: debut, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, origin: window.location.origin },
          events: {
            onReady: (x: { target?: Lecteur }) => {
              x.target?.unMute?.();
              x.target?.playVideo?.();
              suivi = window.setInterval(() => {
                const ici = Number(lecteur.current?.getCurrentTime?.() ?? -1);
                if (ici >= t) {
                  window.clearInterval(suivi);
                  jouerLeMoment();
                }
              }, 150);
            },
            onError: () => !fini && sansYouTube(),
          },
        }) as Lecteur;
      })
      .catch(() => !fini && sansYouTube());
    return () => {
      fini = true;
      window.clearTimeout(attente);
      window.clearTimeout(secours);
      window.clearInterval(suivi);
    };
  }, [phase === "lecture" || phase === "attente" ? phase : "suite", video.id, t, debut]); // eslint-disable-line react-hooks/exhaustive-deps

  // (son grand moment joué : la légende « Léa a réagi à 0:42 »)
  useEffect(() => {
    if (phase !== "moment") return;
    const x = window.setTimeout(() => setPhase("fini"), GRAND_MOMENT.ms + 400);
    return () => window.clearTimeout(x);
  }, [phase]);

  useEffect(
    () => () => {
      try {
        lecteur.current?.destroy?.();
      } catch {
        /* (déjà parti) */
      }
    },
    [],
  );

  // (sa place, assise au milieu, en bas de la scène)
  const h = Math.round(H * 0.5);
  const de = { x: L / 2, y: H - 6, h };
  return (
    <div className="rm" data-rejouer={phase} style={{ ["--c" as string]: m.couleur } as React.CSSProperties}>
      <div className="rm-tele">
        {phase === "attente" || simple ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="rm-mini" src={`/api/direct/moment/${id}/miniature`} alt="" />
            {phase === "attente" && (
              <button type="button" className="rm-revoir" data-revoir onClick={() => setPhase("lecture")}>
                ▶ Revoir le moment
              </button>
            )}
            <span className="rm-heure">à {minute}</span>
          </>
        ) : null}
        <div ref={tele} className="rm-lecteur" hidden={phase === "attente" || simple} />
      </div>
      {video.titre && <p className="rm-titre">{video.titre}</p>}
      <div ref={scene} className={`rm-scene${phase === "moment" ? " en-moment" : ""}`} style={{ height: H }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rm-fig" src={figure} alt={prenom} style={{ height: h, left: de.x, bottom: 6, opacity: phase === "moment" ? 0 : 1 }} />
        <small className="rm-qui" style={{ left: de.x }}>
          {prenom}
        </small>
        {phase === "moment" && L > 0 && (
          <GrandMoment
            id={id}
            m={m}
            L={L}
            H={H}
            // eslint-disable-next-line @next/next/no-img-element
            vedettes={[{ cle: "auteur", mot, de, figure: (hh) => <img src={figure} alt="" style={{ height: hh }} /> }]}
          />
        )}
      </div>
      <p className="rm-legende">{phase === "fini" ? P.aReagi(prenom, minute) : phase === "attente" ? `${prenom} a réagi ici : revois-le avec sa figurine` : " "}</p>
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
.rm{width:100%;max-width:480px;display:flex;flex-direction:column;gap:8px}
.rm-tele{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:16px;overflow:hidden}
.rm-mini,.rm-lecteur{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.rm-lecteur iframe{width:100%;height:100%;border:0}
.rm-revoir{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;border-radius:999px;padding:12px 20px;background:#FF2E9A;color:#fff;font:inherit;font-weight:800;font-size:16px;box-shadow:0 10px 24px -8px #000;cursor:pointer}
.rm-heure{position:absolute;left:10px;bottom:10px;padding:3px 10px;border-radius:9px;background:#FF2E9A;color:#fff;font-weight:800;font-size:13px}
.rm-titre{margin:0;font-size:13px;opacity:.75;text-align:left}
.rm-scene{position:relative;width:100%;border-radius:18px;overflow:hidden;background:radial-gradient(120% 80% at 50% 100%,#3a1633,#1f0a1b 70%)}
.rm-fig{position:absolute;transform:translateX(-50%);width:auto;max-width:none;transition:opacity .2s;filter:drop-shadow(0 8px 10px rgba(0,0,0,.5))}
.rm-qui{position:absolute;bottom:4px;transform:translateX(-50%);padding:1px 8px;border-radius:999px;background:rgba(0,0,0,.6);font-size:11px;font-weight:800}
.rm-legende{margin:0;min-height:1.3em;font-weight:700}
`;
