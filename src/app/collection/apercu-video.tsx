"use client";

/**
 * ▶ L'APERÇU QUI SE LANCE TOUT SEUL (26 novembre 2026, le propriétaire : « comme sur YouTube : quand je scrolle, je vois
 * le début de la vidéo avec le son, et ça me donne envie »).
 *
 * Une vignette de vidéo (Découvrir : la télé d'un salon, d'une séance, d'un rendez-vous ; Mes groupes : l'écran d'une
 * proposition, les pochettes d'« Avec mes proches ») devient un lecteur dès qu'elle est À L'ÉCRAN — UNE SEULE À LA FOIS
 * dans toute l'appli : celle qui se voit le mieux (au moins 60 % d'elle), la plus haute puis la plus à gauche si deux se
 * valent. On glisse : la suivante démarre, la précédente s'arrête (et son lecteur s'en va : rien ne tourne pour rien).
 *
 * LE SON. Les navigateurs (Safari, Chrome) refusent qu'une page lance du son toute seule tant qu'on ne l'a pas touchée.
 * Donc :
 *   · avant le premier toucher, l'aperçu démarre sans le son, avec « 🔇 Touche pour le son » ;
 *   · au premier toucher (n'importe où), le son vient, et ensuite chaque vidéo qui démarre a le son, comme sur YouTube ;
 *   · « 🔊 » coupe le son pour toutes les suivantes (on s'en souvient) ; « 🔇 » le remet ;
 *   · si le navigateur refuse quand même (un iPhone, parfois), la vidéo continue sans le son, et le bouton reste là.
 *
 * Le lecteur ne prend jamais le doigt : on glisse par-dessus comme sur la vignette (le fil, les rangées de côté).
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { chargerYouTube } from "@/app/univers/tele-duo";

export const PHRASES_APERCU = {
  pourLeSon: "Touche pour le son",
  couper: "Couper le son",
  remettre: "Remettre le son",
} as const;

const CLE_SON_COUPE = "clikme-apercu-son-coupe";
/** au moins cette part de la vignette à l'écran pour qu'elle démarre */
const SEUIL = 0.6;
/** le temps de s'arrêter dessus (un glissé rapide ne lance rien) */
const ATTENTE_MS = 350;

type Lecteur = {
  destroy?: () => void;
  playVideo?: () => void;
  mute?: () => void;
  unMute?: () => void;
  isMuted?: () => boolean;
  setVolume?: (v: number) => void;
  getPlayerState?: () => number;
};

// ═══ QUI JOUE : UN SEUL APERÇU DANS TOUTE L'APPLI ═══
type Inscrit = { ratio: number; allumer: (oui: boolean) => void };
const inscrits = new Map<Element, Inscrit>();
let observateur: IntersectionObserver | null = null;
let actif: Element | null = null;
let minuterie = 0;
/** une feuille ouverte par-dessus (la vidéo en grand) : plus d'aperçu tant qu'elle est là */
let suspendus = 0;

function choisir() {
  window.clearTimeout(minuterie);
  minuterie = window.setTimeout(() => {
    let meilleur: Element | null = null;
    let haut = Infinity;
    let gauche = Infinity;
    if (!suspendus && document.visibilityState === "visible")
      for (const [el, i] of inscrits) {
        if (i.ratio < SEUIL) continue;
        const r = el.getBoundingClientRect();
        if (r.top < haut - 4 || (Math.abs(r.top - haut) <= 4 && r.left < gauche)) {
          meilleur = el;
          haut = r.top;
          gauche = r.left;
        }
      }
    if (meilleur === actif) return;
    if (actif) inscrits.get(actif)?.allumer(false);
    actif = meilleur;
    if (actif) inscrits.get(actif)?.allumer(true);
  }, ATTENTE_MS);
}

function inscrire(el: Element, allumer: (oui: boolean) => void) {
  if (!observateur) {
    observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          const i = inscrits.get(e.target);
          if (i) i.ratio = e.isIntersecting ? e.intersectionRatio : 0;
        }
        choisir();
      },
      { threshold: [0, 0.3, 0.6, 0.8, 1] },
    );
    document.addEventListener("visibilitychange", choisir);
  }
  inscrits.set(el, { ratio: 0, allumer });
  observateur.observe(el);
  return () => {
    observateur?.unobserve(el);
    inscrits.delete(el);
    if (actif === el) {
      actif = null;
      allumer(false);
    }
    choisir();
  };
}

/** Une feuille par-dessus qui joue sa propre vidéo (« Voir la vidéo ») : les aperçus se taisent tant qu'elle est ouverte. */
export function useSuspendreApercus(oui: boolean) {
  useEffect(() => {
    if (!oui) return;
    suspendus++;
    choisir();
    return () => {
      suspendus--;
      choisir();
    };
  }, [oui]);
}

// ═══ LE SON : VOULU PAR DÉFAUT, PERMIS APRÈS LE PREMIER TOUCHER ═══
let sonCoupe = false;
try {
  sonCoupe = typeof window !== "undefined" && window.localStorage.getItem(CLE_SON_COUPE) === "1";
} catch {
  /* (pas de mémoire : le son est voulu) */
}
let touche = false;
/** le lecteur qui joue en ce moment, pour lui donner le son au premier toucher */
let lecteurActif: { lecteur: Lecteur; donnerLeSon: () => void } | null = null;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());
const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => void abonnes.delete(f);
};

const aEteTouche = () => {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return touche || Boolean(ua?.hasBeenActive);
};

let ecoute = false;
function ecouterLePremierToucher() {
  if (ecoute || typeof window === "undefined") return;
  ecoute = true;
  const surGeste = (e: Event) => {
    // (un glissé n'est pas un toucher pour le navigateur : on ne compte que ce qu'il compte)
    const ua = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
    if (ua && !ua.isActive) return;
    touche = true;
    if (!sonCoupe && lecteurActif && !(e.target as Element | null)?.closest?.("[data-apercu-son]")) lecteurActif.donnerLeSon();
  };
  for (const t of ["pointerup", "keydown", "touchend", "click"]) window.addEventListener(t, surGeste, true);
}

function couperLeSon(oui: boolean) {
  sonCoupe = oui;
  try {
    if (oui) window.localStorage.setItem(CLE_SON_COUPE, "1");
    else window.localStorage.removeItem(CLE_SON_COUPE);
  } catch {
    /* (on s'en souviendra le temps de la page) */
  }
  prevenir();
}

type Etat = "rien" | "charge" | "muet" | "son";

/**
 * ▶ L'aperçu d'une vidéo YouTube : posé DANS le cadre de la vignette (`position: relative`), par-dessus l'image, sous ce
 * qui est écrit dessus. Rien ne change tant qu'il n'est pas à l'écran.
 */
export function ApercuVideo({ id, className }: { id: string; className?: string }) {
  const cadre = useRef<HTMLSpanElement>(null);
  const hote = useRef<HTMLSpanElement>(null);
  const [allume, setAllume] = useState(false);
  const [etat, setEtat] = useState<Etat>("rien");
  const coupe = useSyncExternalStore(sAbonner, () => sonCoupe, () => false);

  // (à l'écran ou pas : c'est le chef d'orchestre qui décide)
  useEffect(() => {
    const el = cadre.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // (le forfait économe du téléphone : pas d'aperçu)
    const connexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connexion?.saveData) return;
    ecouterLePremierToucher();
    return inscrire(el, setAllume);
  }, []);

  // ▶ allumé : le lecteur, sans le son d'abord (toujours permis), puis le son si on a déjà touché la page
  useEffect(() => {
    if (!allume) return;
    let fini = false;
    let lecteur: Lecteur | null = null;
    let verif = 0;
    const parent = cadre.current?.parentElement;
    const ici = hote.current;

    const essayerLeSon = () => {
      const l = lecteur;
      if (!l || fini) return;
      try {
        l.unMute?.();
        l.setVolume?.(100);
      } catch {
        return;
      }
      // (le navigateur a pu refuser : la vidéo s'arrête, ou reste muette — on la relance sans le son)
      window.clearTimeout(verif);
      verif = window.setTimeout(() => {
        if (fini) return;
        try {
          const joue = l.getPlayerState?.() === 1;
          if (joue && !l.isMuted?.()) return setEtat("son");
          l.mute?.();
          l.playVideo?.();
        } catch {
          /* (rien) */
        }
        setEtat("muet");
      }, 900);
    };

    void Promise.resolve().then(() => !fini && setEtat("charge"));
    chargerYouTube()
      .then((YT) => {
        if (fini || !ici) return;
        const cible = document.createElement("div");
        ici.replaceChildren(cible);
        lecteur = new YT.Player(cible, {
          videoId: id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, mute: 1, playsinline: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, cc_load_policy: 0, loop: 1, playlist: id, origin: window.location.origin },
          events: {
            onReady: () => {
              if (fini || !lecteur) return;
              try {
                lecteur.mute?.();
                lecteur.playVideo?.();
              } catch {
                /* (rien) */
              }
              lecteurActif = { lecteur, donnerLeSon: essayerLeSon };
              if (!sonCoupe && aEteTouche()) essayerLeSon();
              else setEtat("muet");
            },
            onStateChange: (e: { data?: number }) => {
              if (fini) return;
              // (elle joue : l'image du dessous s'efface)
              if (e.data === 1) parent?.setAttribute("data-apercu-joue", "");
            },
            // (elle refuse d'être lue hors de YouTube, ou elle est partie : la vignette reste, simplement)
            onError: () => {
              if (fini) return;
              setEtat("rien");
              parent?.removeAttribute("data-apercu-joue");
              ici?.replaceChildren();
            },
          },
        }) as unknown as Lecteur;
      })
      .catch(() => !fini && setEtat("rien"));

    return () => {
      fini = true;
      window.clearTimeout(verif);
      if (lecteurActif?.lecteur === lecteur) lecteurActif = null;
      try {
        lecteur?.destroy?.();
      } catch {
        /* (déjà parti) */
      }
      ici?.replaceChildren();
      parent?.removeAttribute("data-apercu-joue");
      setEtat("rien");
    };
  }, [allume, id]);

  // (le son coupé ou remis depuis un autre aperçu : celui-ci suit)
  useEffect(() => {
    const l = lecteurActif;
    if (!allume || !l) return;
    if (coupe && etat === "son") {
      try {
        l.lecteur.mute?.();
      } catch {
        /* (rien) */
      }
      void Promise.resolve().then(() => setEtat("muet"));
    }
  }, [coupe, allume, etat]);

  const surSon = (e: React.MouseEvent) => {
    e.stopPropagation();
    touche = true;
    if (etat === "son") {
      couperLeSon(true);
      return;
    }
    couperLeSon(false);
    lecteurActif?.donnerLeSon();
  };

  return (
    <span ref={cadre} className={`av${className ? ` ${className}` : ""}`} data-apercu={id} data-apercu-etat={etat}>
      <span ref={hote} className="av-lecteur" aria-hidden="true" />
      {(etat === "muet" || etat === "son") && (
        <button
          type="button"
          className={`av-son${etat === "muet" && !coupe ? " invite" : ""}`}
          onClick={surSon}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          aria-label={etat === "son" ? PHRASES_APERCU.couper : PHRASES_APERCU.remettre}
          data-apercu-son={etat}
        >
          <span aria-hidden="true">{etat === "son" ? "🔊" : "🔇"}</span>
          {etat === "muet" && !coupe && <small>{PHRASES_APERCU.pourLeSon}</small>}
        </button>
      )}
    </span>
  );
}

/** (à poser une fois avec les styles de la page qui s'en sert) */
export const STYLES_APERCU = `
.av{position:absolute;inset:0;pointer-events:none;border-radius:inherit;overflow:hidden}
.av-lecteur{position:absolute;inset:0;opacity:0;transition:opacity .35s ease}
[data-apercu-joue] .av-lecteur{opacity:1}
.av-lecteur iframe,.av-lecteur>div{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none}
.av-son{position:absolute;right:8px;top:8px;z-index:2;pointer-events:auto;display:inline-flex;align-items:center;gap:6px;min-width:36px;min-height:36px;padding:0 10px;justify-content:center;border:0;border-radius:999px;background:rgba(11,4,9,.72);color:#fff;font:inherit;font-size:16px;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.av-son small{font-size:12.5px;font-weight:800}
.av-son.invite{background:#FF2E9A;animation:av-bat 1.6s ease-in-out infinite}
@keyframes av-bat{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@media (prefers-reduced-motion:reduce){.av-son.invite{animation:none}}
`;
