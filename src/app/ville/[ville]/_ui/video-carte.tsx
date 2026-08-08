"use client";

// LA VIDÉO D'UNE ANNONCE, SANS RALENTIR LE FIL.
//
// Le fil affiche des dizaines de cartes d'un coup. Une balise `<video>` posée
// naïvement dans chacune, et le téléphone télécharge des dizaines de mégaoctets
// pour un écran qu'on va parcourir en quinze secondes. Sur un forfait limité,
// c'est une facture ; sur une connexion moyenne, c'est un fil qui ne défile
// plus.
//
// Trois règles, dans cet ordre d'importance :
//
//   1. RIEN NE SE TÉLÉCHARGE AVANT D'ÊTRE VISIBLE. On affiche la première image
//      (déjà chargée, c'est la photo de l'annonce) et on ne pose la source
//      vidéo qu'à l'entrée dans l'écran.
//   2. RIEN NE SE JOUE HORS DE L'ÉCRAN. Une vidéo qui continue après qu'on a
//      défilé consomme et chauffe pour personne.
//   3. JAMAIS DE SON SANS QU'ON LE DEMANDE. Un fil qui se met à parler dans un
//      lieu public se ferme immédiatement, et on n'y revient pas.
import { useEffect, useRef, useState } from "react";

export function VideoCarte({ src, poster, alt }: { src: string; poster: string | null; alt: string }) {
  const hote = useRef<HTMLDivElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  // `charger` ne repasse jamais à faux : une fois le fichier en cache, le
  // remettre à faux ne libère rien et ferait repartir la lecture de zéro à
  // chaque passage.
  const [charger, setCharger] = useState(false);
  const [muet, setMuet] = useState(true);

  useEffect(() => {
    const el = hote.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // Navigateur sans observateur : on charge, c'est le comportement d'avant
      // et il reste correct. Mieux vaut télécharger que ne rien afficher.
      setCharger(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) {
            setCharger(true);
            void video.current?.play().catch(() => {});
          } else {
            video.current?.pause();
          }
        }
      },
      // 25 % visible : assez pour dire qu'on la regarde, pas assez pour
      // déclencher un téléchargement au passage d'un défilement rapide.
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Mouvement réduit : on laisse l'image fixe et le contrôle de lecture. Une
  // vidéo qui démarre seule est exactement ce que ce réglage demande d'éviter.
  const animeMoins =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  return (
    <div className="vidc" ref={hote}>
      <video
        ref={video}
        className="vidc-v"
        poster={poster ?? undefined}
        muted={muet}
        loop
        playsInline
        // `none` et non `metadata` : même les métadonnées coûtent un aller-retour
        // par carte, et l'image d'affiche donne déjà les dimensions.
        preload="none"
        autoPlay={!animeMoins}
        controls={!muet}
        aria-label={alt}
        {...(charger ? { src } : {})}
      />
      <button
        type="button"
        className="vidc-son"
        onClick={() => {
          const v = video.current;
          setMuet((m) => !m);
          if (v) {
            v.muted = !v.muted;
            void v.play().catch(() => {});
          }
        }}
        aria-label={muet ? "Activer le son" : "Couper le son"}
      >
        {muet ? "🔇" : "🔊"}
      </button>
    </div>
  );
}

export const STYLES_VIDEO_CARTE = `
.vidc{position:relative;background:#DDE4E0;}
.vidc-v{display:block;width:100%;height:150px;object-fit:cover;background:#DDE4E0;}
.vidc-son{position:absolute;right:9px;bottom:9px;width:32px;height:32px;border-radius:50%;
  border:none;background:rgba(20,32,26,.62);color:#fff;font-size:14px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
@media (prefers-reduced-motion:reduce){.vidc-v{--x:0;}}
`;
