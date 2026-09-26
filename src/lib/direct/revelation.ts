"use client";

import { useEffect, useRef } from "react";

/**
 * 🪄 LA RÉVÉLATION — l'essayage se joue tout seul en arrivant sur l'écran.
 *
 * ═══ POURQUOI ELLE EXISTE ══════════════════════════════════════════════════
 *
 * « On ne saisit pas vraiment le lien entre l'étape 2 et l'étape 3 : à l'étape
 * 2 on nous demande si on veut essayer la coupe, et tout à coup on voit une
 * nouvelle coupe sur quelqu'un d'autre. Il faudrait une animation de 3 ou 4
 * secondes où l'on voit d'abord le visage normal — ou la silhouette entière,
 * pour la mode — puis le résultat. Il faut que cette étape soit compréhensible :
 * c'est quelqu'un qui met sa photo et qui veut voir ce que la coupe ou le
 * vêtement donne sur lui. »
 *
 * LA GLISSIÈRE OUVRAIT AU MILIEU, ET C'EST TOUT LE DÉFAUT. Un demi-visage
 * coiffé à côté d'un demi-visage qui ne l'est pas ne se lit pas comme un
 * essayage : ça se lit comme une image bizarre. Il fallait DÉJÀ savoir ce que
 * la poignée fait pour comprendre ce qu'on regarde — or personne ne le sait
 * avant d'avoir tiré, et personne ne tire avant d'avoir compris.
 *
 * ON MONTRE DONC LE GESTE À SA PLACE. L'écran s'ouvre sur la personne telle
 * qu'elle est, tient une seconde — le temps de la reconnaître — puis la coupe
 * se pose sur elle, de gauche à droite, en deux secondes et demie. Trois
 * secondes et demie en tout, et on a compris sans qu'un mot l'explique : cette
 * personne a mis sa photo, et voilà ce que ça donne sur elle.
 *
 * LA POIGNÉE RESTE, ET C'EST ELLE LE PRODUIT. L'animation ne fait que la
 * présenter : au premier doigt posé, elle s'arrête net et rend la main. Une
 * animation qui lutte contre le doigt est pire que pas d'animation.
 *
 * ELLE NE SE REJOUE PAS EN BOUCLE. Une fois comprise, elle n'a plus rien à
 * apprendre — et un écran qui bouge tout seul en permanence empêche de
 * regarder. C'est la même leçon que la bulle de glissement de l'écran de
 * démarrage, qui part au premier geste.
 */

export type Revelation = {
  /** Vrai quand l'écran de l'essayage est celui qu'on regarde. */
  actif: boolean;
  /** Où poser la poignée, en pour cent. */
  poser: (v: number) => void;
  /** Tout à gauche : la personne telle qu'elle est. */
  depart: number;
  /** Tout à droite, ou presque : la chose posée sur elle. */
  fin: number;
};

/** Le temps d'arrêt sur la personne, avant que ça ne bouge. */
const TENUE_MS = 1100;
/** La durée du passage. Les deux font 3,4 s — « 3 ou 4 secondes ». */
const PASSAGE_MS = 2300;

export function useRevelation({ actif, poser, depart, fin }: Revelation) {
  /* LE DOIGT GAGNE TOUJOURS. Posé sur la glissière, il coupe l'animation et
     elle ne repart pas : on ne reprend pas la main à quelqu'un qui l'a prise. */
  const coupe = useRef(false);
  const joue = useRef(false);

  useEffect(() => {
    if (!actif) {
      /* On quitte l'écran : tout se remet à zéro, pour que l'animation se
         rejoue si l'on y revient par la flèche. Elle n'a alors plus rien à
         apprendre, mais un écran figé au milieu serait pire. */
      joue.current = false;
      coupe.current = false;
      return;
    }
    if (joue.current) return;
    joue.current = true;

    /* CEUX QUI ONT DEMANDÉ MOINS DE MOUVEMENT N'EN AURONT PAS. On leur donne
       directement le résultat : c'est ce que l'animation allait montrer, sans
       le trajet. */
    const calme =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (calme) {
      poser(fin);
      return;
    }

    poser(depart);
    let brut = 0;
    let t0 = 0;
    const pas = (t: number) => {
      if (coupe.current) return;
      if (!t0) t0 = t;
      const ecoule = t - t0;
      if (ecoule < TENUE_MS) {
        brut = requestAnimationFrame(pas);
        return;
      }
      const p = Math.min(1, (ecoule - TENUE_MS) / PASSAGE_MS);
      /* UNE COURBE, PAS UNE RAMPE. Un balayage à vitesse constante se lit comme
         un curseur de chargement ; celui-ci part doucement, prend de la
         vitesse, et se pose — c'est le geste d'une main. */
      const doux = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      poser(depart + (fin - depart) * doux);
      if (p < 1) brut = requestAnimationFrame(pas);
    };
    brut = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(brut);
    // `poser` est recréée à chaque rendu : la mettre en dépendance relancerait
    // l'animation à chaque image qu'elle produit elle-même.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, depart, fin]);

  /** À appeler au premier contact : l'animation s'arrête et rend la main. */
  return () => {
    coupe.current = true;
  };
}
