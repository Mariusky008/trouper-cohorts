"use client";

// 🖐️ GLISSER VERS LE BAS POUR FERMER — le geste qu'on ne demande plus.
//
// ═══ POURQUOI CE FICHIER EXISTE ═══════════════════════════════════════════
//
// « Quand une pop-up est ouverte, j'aimerais qu'en swipant vers le bas elle
// disparaisse comme sur la majorité des applications actuelles, plutôt que de
// cliquer sur la croix — qui est optionnelle mais de moins en moins utilisée.
// Naturellement, on swipe la pop-up vers le bas pour la faire disparaître
// maintenant. »
//
// C'EST EXACT, ET C'EST DEVENU UN RÉFLEXE PLUS RAPIDE QUE LE REGARD. Chercher
// une croix demande de la trouver ; glisser ne demande rien. La croix reste —
// elle sert au clavier, à la souris, et à ceux qui ne connaissent pas le geste
// — mais elle n'est plus le seul chemin.
//
// ═══ LA DIFFICULTÉ, ET ELLE EST TOUT LE FICHIER ═══════════════════════════
//
// UNE FEUILLE QUI CONTIENT DU DÉFILEMENT NE PEUT PAS SE FERMER DÈS QU'ON TIRE
// VERS LE BAS. Le mur fait deux écrans de haut : à mi-hauteur, tirer vers le bas
// veut dire « remonte », pas « ferme ». Une feuille qui se fermerait là serait
// pire que pas de geste du tout — on perdrait ce qu'on lisait, sans comprendre
// pourquoi.
//
// LA RÈGLE EST DONC : ON NE FERME QUE SI LE CONTENU EST DÉJÀ EN HAUT. On
// remonte les parents du doigt jusqu'à la feuille, on cherche le premier qui
// défile, et on ne prend le geste que s'il est à zéro. C'est exactement ce que
// font les feuilles du système, et c'est pour ça qu'elles ne surprennent jamais.
//
// TROIS AUTRES GARDES, CHACUNE PAYÉE PAR UN DÉFAUT CONNU :
//
//   · PLUS VERTICAL QU'HORIZONTAL. Sans ça, un balayage de carrousel dans la
//     feuille la ferait descendre en biais.
//   · UN SEUIL DE DÉPART. En dessous de dix points, c'est un appui, pas un
//     glissement — et un bouton qui bouge sous le doigt ne se presse pas.
//   · LE CHAMP DE TEXTE EST INTOUCHABLE. Poser le doigt dans une zone de saisie
//     pour placer le curseur ne doit jamais emmener la feuille.
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

/** Au-delà de cette distance, on lâche : la feuille part. */
const SEUIL_FERMER = 108;
/** En dessous, c'est un appui. */
const SEUIL_DEPART = 10;

export type Glissement = {
  /** À poser sur la feuille elle-même. */
  poignee: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerCancel: (e: PointerEvent) => void;
    style: CSSProperties;
  };
  /** Vrai pendant le glissement : sert à couper l'animation d'entrée. */
  glisse: boolean;
};

export function useGlisserPourFermer(fermer: () => void): Glissement {
  const [dy, setDy] = useState(0);
  const [glisse, setGlisse] = useState(false);
  const suivi = useRef<{ x: number; y: number; pris: boolean; refuse: boolean } | null>(null);

  /**
   * LE CONTENU SOUS LE DOIGT EST-IL DÉJÀ EN HAUT DE SON DÉFILEMENT ?
   *
   * ON REMONTE D'ABORD DEPUIS LE DOIGT, parce que c'est ce qu'il touche qui
   * décide : deux zones qui défilent peuvent cohabiter dans la même feuille.
   *
   * ET S'IL N'A RIEN TOUCHÉ QUI DÉFILE, ON REDESCEND. Le doigt peut se poser sur
   * la marge de la feuille, entre deux blocs, ou sur son fond — la remontée ne
   * trouve alors rien et concluait « on est en haut », donc la feuille se
   * fermait en pleine lecture. On cherche donc, à défaut, le premier bloc qui
   * défile DANS la feuille, et c'est lui qui répond.
   */
  const enHaut = (cible: EventTarget | null, feuille: Element | null): boolean => {
    let e = cible as HTMLElement | null;
    while (e && e !== feuille) {
      if (e.tagName === "TEXTAREA" || e.tagName === "INPUT") return false;
      if (e.scrollHeight > e.clientHeight + 2) return e.scrollTop <= 0;
      e = e.parentElement;
    }
    if (!(feuille instanceof HTMLElement)) return true;
    if (feuille.scrollHeight > feuille.clientHeight + 2) return feuille.scrollTop <= 0;
    // LA DESCENTE, ET ELLE S'ARRETE AU PREMIER TROUVE : une feuille n'a qu'une
    // zone de lecture, les autres defilements sont horizontaux et ne nous
    // regardent pas.
    const dedans = feuille.querySelectorAll<HTMLElement>("*");
    for (const d of dedans) {
      if (d.scrollHeight > d.clientHeight + 2) return d.scrollTop <= 0;
    }
    return true;
  };

  return {
    glisse,
    poignee: {
      onPointerDown: (e) => {
        const feuille = e.currentTarget as HTMLElement;
        suivi.current = {
          x: e.clientX,
          y: e.clientY,
          pris: false,
          refuse: !enHaut(e.target, feuille),
        };
      },
      onPointerMove: (e) => {
        const s = suivi.current;
        if (!s || s.refuse) return;
        const dx = e.clientX - s.x;
        const d = e.clientY - s.y;
        if (!s.pris) {
          if (Math.abs(d) < SEUIL_DEPART) return;
          // Plus vertical qu'horizontal, et vers le BAS. Sinon on rend le geste
          // a ce qui vit dans la feuille — un carrousel, un champ, un bouton.
          if (d < 0 || Math.abs(d) <= Math.abs(dx)) {
            s.refuse = true;
            return;
          }
          s.pris = true;
          setGlisse(true);
        }
        setDy(Math.max(0, d - SEUIL_DEPART));
      },
      onPointerUp: () => {
        const s = suivi.current;
        suivi.current = null;
        if (!s?.pris) {
          setDy(0);
          setGlisse(false);
          return;
        }
        setGlisse(false);
        if (dy > SEUIL_FERMER) {
          // ON LA LAISSE PARTIR AVANT DE FERMER : couper net a mi-chemin donne
          // l'impression d'un bouton, pas d'un glissement.
          setDy(900);
          window.setTimeout(() => {
            setDy(0);
            fermer();
          }, 160);
          return;
        }
        setDy(0);
      },
      onPointerCancel: () => {
        suivi.current = null;
        setDy(0);
        setGlisse(false);
      },
      style: {
        transform: dy ? `translate3d(0, ${dy}px, 0)` : undefined,
        // PENDANT LE GESTE, LE DOIGT MENE : aucune transition, sinon la feuille
        // traine derriere lui. Au relachement seulement, elle revient toute
        // seule.
        transition: glisse ? "none" : "transform .22s cubic-bezier(.2,.8,.25,1)",
        // L'animation d'entree et le glissement se disputent la meme propriete.
        animation: dy ? "none" : undefined,
        touchAction: "pan-y",
      },
    },
  };
}
