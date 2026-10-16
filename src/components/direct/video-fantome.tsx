"use client";

// 🎬 LES VIDÉOS DU FANTÔME — cinq états de son intelligence, une seule façon de les jouer.
//
//   · `dressing`  — « Montrez-moi ce que vous avez déjà, je chercherai ce qui va avec. »
//   · `recherche` — « Tu me demandes quelque chose : je cherche maintenant. »
//   · `surprise`  — « Tu ne m'as rien demandé : j'ai trouvé quelque chose pour toi. »
//   · `soiree`    — « Je ne te connais pas encore assez : montre-moi ce que tu cherches. »
//   · `salon`     — « Ici, tes amis donnent leur avis, et moi je t'aide à trancher. »
//   · `rien`      — « J'ai cherché, et rien ne vous ressemblait assez aujourd'hui. »
//   · `cuisine`   — « Montrez-moi ce qui vous donne envie, je repère les plats du jour. »
//   · `fait`      — « C'est fait : votre demande est partie. » (recadrée : la
//                   phrase incrustée en bas de l'original est hors champ, les
//                   mots restent en HTML)
//   · `miroir`    — « Gardez une photo de vous, j'y essaierai ce que vous trouvez. »
//   · `direct`    — le tuto du Direct : il passe une carte à gauche, en propose
//                   une à droite à ses amis, et en ouvre une (6,6 s, 720 × 1260).
//   · `ville`     — le tuto de La Ville : il se promène, les bulles des
//                   habitants apparaissent autour de lui, il fait coucou.
//
// CE NE SONT PAS DES PUBLICITÉS, ET ELLES NE S'EN DONNENT PAS L'AIR : sans son,
// sans contrôles, sans boucle ; elles se jouent UNE fois, à l'endroit même où
// l'on va agir, et restent sur leur dernière image. Les mots sont en HTML,
// par-dessus, jamais dans l'image : ils se traduisent, se lisent, se changent.
//
// LES FICHIERS (`public/direct/videos`) : 720 × 1280, 24 images/s, sans piste
// son — environ 0,8 Mo pour 5,2 s, au lieu de 7 Mo pour l'original. Deux
// formats : MP4 (H.264) D'ABORD, puis WebM. L'iPhone d'abord : Safari ne lit
// pas le WebM partout, et un navigateur qui choisit une source qu'il décode
// mal ne revient pas à la suivante. Le codec exact est écrit sur chaque
// source (`avc1.4D401F` : profil Main, niveau 3.1, celui des fichiers) — un
// navigateur sans H.264 le sait sans essayer et passe au WebM. Une image de
// début (l'affiche, rien de noir avant la première image) et une de fin (ce
// qui reste, et ce qu'on montre seul au mouvement réduit).
//
// QUATRE CAS OÙ ELLE NE JOUE PAS, ET LA PAGE N'EN SOUFFRE PAS :
//   · mouvement réduit demandé → l'image de fin, les mots, et `onFin` aussitôt ;
//   · lecture automatique refusée (mode économie d'énergie d'un iPhone) → la
//     même image, et `onFin` après le temps de lire ;
//   · fichier introuvable → idem ;
//   · RÉSEAU LENT : pas commencée au bout de `ATTENTE_MAX` → l'image de fin,
//     tout de suite. En 3G lente, elle démarrait vingt secondes plus tard,
//     quand on avait déjà lu la page et commencé à s'en servir.

import { useEffect, useRef, useState, type ReactNode } from "react";

export type NomVideo = "dressing" | "recherche" | "surprise" | "soiree" | "salon" | "rien" | "cuisine" | "fait" | "miroir" | "direct" | "ville";

/** Une ligne de texte, et la seconde à partir de laquelle elle remplace la précédente. */
export type Legende = { a: number; texte: ReactNode };

const DUREE = 5.17;
/** Au-delà, elle ne commencera plus au bon moment : on montre sa fin. */
const ATTENTE_MAX = 4000;
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
  vitesse,
}: {
  nom: NomVideo;
  /** Plus vite que nature (1,3 : 5,2 s deviennent 4 s) — les mots suivent le temps de la vidéo. */
  vitesse?: number;
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
  /** Elle a vraiment commencé (l'évènement `playing`) — voir `ATTENTE_MAX`. */
  const demarre = useRef(false);

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
    if (vitesse) {
      el.defaultPlaybackRate = vitesse;
      el.playbackRate = vitesse;
    }
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => figer(2600));
    const tropLent = window.setTimeout(() => {
      if (demarre.current || dejaFini.current) return;
      el.pause();
      figer(0);
    }, ATTENTE_MAX);
    /* L'IPHONE MET EN PAUSE CE QUI JOUE QUAND ON QUITTE L'APPLICATION (un
       appel, WhatsApp, l'écran d'accueil) et ne reprend pas toujours seul : on
       relance au retour, pour finir sur la dernière image — sinon on figera. */
    const auRetour = () => {
      if (document.visibilityState !== "visible" || dejaFini.current || !el.paused || el.ended) return;
      const r = el.play();
      if (r && typeof r.catch === "function") r.catch(() => figer(0));
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      window.clearTimeout(minuteur);
      window.clearTimeout(tropLent);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [immobile, vitesse]);

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
      demarre.current = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tic);
    };
    const fin = () => {
      /* SA VRAIE DURÉE : elles ne font pas toutes 5,2 s (« rien » en fait 13,7). */
      setT(Number.isFinite(el.duration) ? el.duration : DUREE);
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
          <source src={v.mp4} type={'video/mp4; codecs="avc1.4D401F"'} />
          <source src={v.webm} type={'video/webm; codecs="vp9"'} />
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

export function StylesVideoFantome() {
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
