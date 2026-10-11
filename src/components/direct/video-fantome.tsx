"use client";

// 🎬 LES VIDÉOS DU FANTÔME — cinq états de son intelligence, une seule façon de les jouer.
//
//   · `dressing`  — « Montrez-moi ce que vous avez déjà, je chercherai ce qui va avec. »
//   · `recherche` — « Tu me demandes quelque chose : je cherche maintenant. »
//   · `surprise`  — « Tu ne m'as rien demandé : j'ai trouvé quelque chose pour toi. »
//   · `soiree`    — « Je ne te connais pas encore assez : montre-moi ce que tu cherches. »
//   · `salon`     — « Ici, tes amis donnent leur avis, et moi je t'aide à trancher. »
//
// CE NE SONT PAS DES PUBLICITÉS, ET ELLES NE S'EN DONNENT PAS L'AIR : sans son,
// sans contrôles, sans boucle ; elles se jouent UNE fois, à l'endroit même où
// l'on va agir, et restent sur leur dernière image. Les mots sont en HTML,
// par-dessus, jamais dans l'image : ils se traduisent, se lisent, se changent.
//
// LES FICHIERS (`public/direct/videos`) : 720 × 1280, 24 images/s, sans piste
// son — environ 0,8 Mo pour 5,2 s, au lieu de 7 Mo pour l'original. Deux
// formats : WebM d'abord (les navigateurs sans H.264, et plus léger), MP4
// ensuite (Safari, iPhone). Une image de début (l'affiche, rien de noir avant
// la première image) et une de fin (ce qui reste, et ce qu'on montre seul au
// mouvement réduit).
//
// TROIS CAS OÙ ELLE NE JOUE PAS, ET LA PAGE N'EN SOUFFRE PAS :
//   · mouvement réduit demandé → l'image de fin, les mots, et `onFin` aussitôt ;
//   · lecture automatique refusée (mode économie d'énergie d'un iPhone) → la
//     même image, et `onFin` après le temps de lire ;
//   · fichier introuvable → idem.

import { useEffect, useRef, useState, type ReactNode } from "react";

export type NomVideo = "dressing" | "recherche" | "surprise" | "soiree" | "salon";

/** Une ligne de texte, et la seconde à partir de laquelle elle remplace la précédente. */
export type Legende = { a: number; texte: ReactNode };

const DUREE = 5.17;
export const videoDe = (nom: NomVideo) => ({
  webm: `/direct/videos/${nom}.webm`,
  mp4: `/direct/videos/${nom}.mp4`,
  debut: `/direct/videos/${nom}-debut.webp`,
  fin: `/direct/videos/${nom}-fin.webp`,
});

export function mouvementReduit(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function VideoFantome({
  nom,
  legendes = [],
  jusqua,
  onFin,
  passer,
  classe,
  enfants,
  immobile = false,
}: {
  nom: NomVideo;
  /** Déjà vue : sa dernière image et sa dernière ligne, sans jouer ni appeler `onFin`. */
  immobile?: boolean;
  legendes?: Legende[];
  /** S'arrêter avant la fin (en secondes) — la recherche, raccourcie aux fois suivantes. */
  jusqua?: number;
  /** La vidéo est finie (ou ne jouera pas). Appelé une seule fois. */
  onFin?: () => void;
  /** Un petit « Passer », pour ne jamais bloquer. */
  passer?: boolean;
  classe?: string;
  /** Ce que la page pose par-dessus en plus (un bouton à la fin, par exemple). */
  enfants?: ReactNode;
}) {
  const v = videoDe(nom);
  const ref = useRef<HTMLVideoElement | null>(null);
  const finRef = useRef(onFin);
  useEffect(() => {
    finRef.current = onFin;
  });
  const [t, setT] = useState(0);
  /** `joue` · `fini` (resté sur sa dernière image) · `fige` (elle ne jouera pas : l'image seule). */
  const [etat, setEtat] = useState<"joue" | "fini" | "fige">(immobile ? "fige" : "joue");
  const dejaFini = useRef(false);

  useEffect(() => {
    const el = ref.current;
    let minuteur = 0;
    if (immobile) return;
    const finir = () => {
      if (dejaFini.current) return;
      dejaFini.current = true;
      finRef.current?.();
    };
    /* ELLE NE JOUERA PAS : l'image de fin, puis la suite après `apres` ms. */
    const figer = (apres: number) => {
      minuteur = window.setTimeout(() => {
        setEtat("fige");
        minuteur = window.setTimeout(finir, apres);
      }, 0);
    };
    if (!el || mouvementReduit()) {
      figer(0);
      return () => window.clearTimeout(minuteur);
    }
    /* MUET AVANT TOUT : iOS ne lance seul qu'une vidéo muette, et l'attribut
       que React écrit ne suffit pas toujours. */
    el.muted = true;
    el.defaultMuted = true;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => figer(2600));
    return () => window.clearTimeout(minuteur);
  }, [immobile]);

  /* LE TEMPS DE LA VIDÉO, POUR LES MOTS — et l'arrêt anticipé. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tic = () => {
      const tt = el.currentTime;
      setT(tt);
      if (jusqua && tt >= jusqua && !el.paused) {
        el.pause();
        setEtat("fini");
        if (!dejaFini.current) {
          dejaFini.current = true;
          finRef.current?.();
        }
        return;
      }
      if (!el.ended && !el.paused) raf = requestAnimationFrame(tic);
    };
    const enJeu = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tic);
    };
    const fin = () => {
      setT(DUREE);
      setEtat("fini");
      if (!dejaFini.current) {
        dejaFini.current = true;
        finRef.current?.();
      }
    };
    const erreur = () => {
      setEtat("fige");
      window.setTimeout(() => {
        if (!dejaFini.current) {
          dejaFini.current = true;
          finRef.current?.();
        }
      }, 2600);
    };
    el.addEventListener("playing", enJeu);
    el.addEventListener("ended", fin);
    el.addEventListener("error", erreur);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("playing", enJeu);
      el.removeEventListener("ended", fin);
      el.removeEventListener("error", erreur);
    };
  }, [jusqua]);

  /* LA LIGNE DU MOMENT : la dernière dont l'heure est passée. Figée, on montre la dernière. */
  const visibles = legendes.filter((l) => (etat === "fige" ? true : t >= l.a));
  const ligne = visibles[visibles.length - 1];

  return (
    <div className={`vf${etat !== "joue" ? ` ${etat}` : ""}${classe ? ` ${classe}` : ""}`}>
      <StylesVideoFantome />
      {etat === "fige" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="vf-media" src={v.fin} alt="" />
      ) : (
        <video
          ref={ref}
          className="vf-media"
          muted
          playsInline
          autoPlay
          preload="auto"
          poster={v.debut}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={v.webm} type="video/webm" />
          <source src={v.mp4} type="video/mp4" />
        </video>
      )}
      {ligne && (
        <p key={legendes.indexOf(ligne)} className="vf-legende">
          {ligne.texte}
        </p>
      )}
      {passer && etat === "joue" && (
        <button
          type="button"
          className="vf-passer"
          onClick={() => {
            ref.current?.pause();
            setEtat("fini");
            if (!dejaFini.current) {
              dejaFini.current = true;
              finRef.current?.();
            }
          }}
        >
          Passer
        </button>
      )}
      {enfants}
    </div>
  );
}

function StylesVideoFantome() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.vf{position:relative;overflow:hidden;border-radius:22px;background:#1A120D;isolation:isolate;}
.vf-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}
.vf::after{content:"";position:absolute;inset:auto 0 0 0;height:46%;z-index:1;pointer-events:none;
  background:linear-gradient(180deg,transparent,rgba(12,7,4,.72));}
.vf-legende{position:absolute;left:14px;right:14px;bottom:14px;z-index:2;margin:0;text-align:center;
  font-size:15px;font-weight:800;line-height:1.3;color:#FFF6EA;text-shadow:0 2px 10px rgba(0,0,0,.6);
  animation:vfLegende .35s ease both;}
@keyframes vfLegende{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.vf-passer{position:absolute;top:10px;right:10px;z-index:3;padding:5px 11px;border-radius:999px;border:0;cursor:pointer;
  font:inherit;font-size:12px;font-weight:700;color:#FFF6EA;background:rgba(12,7,4,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
@media (prefers-reduced-motion:reduce){.vf-legende{animation:none;}}
`,
      }}
    />
  );
}
