// LA HAUTEUR VISIBLE, MESURÉE — ET NON DÉDUITE D'UNE UNITÉ CSS.
//
// TROIS TENTATIVES, TROIS ÉCHECS, ET CE QU'ILS ONT APPRIS.
//
//  1. `100dvh` : la hauteur suit l'état des barres du navigateur, donc toute
//     la mise en page respirait à chaque geste.
//  2. `100svh` avec `html` et `body` verrouillés et `body` en position fixe :
//     le raisonnement supposait que le coupable était le repli de la barre
//     d'adresse de Safari. Le défaut est revenu, identique, SUR CHROME — ce qui
//     démontre que la cause n'était pas celle-là. Diagnostic faux.
//  3. Donc : on arrête de déduire.
//
// CE QUI EST SÛR, ET C'EST LA SEULE CHOSE QUI COMPTE. `window.visualViewport`
// décrit ce que la personne VOIT : sa hauteur, et son décalage par rapport au
// haut de la page. Ce n'est pas une convention entre navigateurs, c'est une
// mesure, et elle est juste sur tous — y compris quand le clavier monte, cas
// où toutes les unités en `vh` mentent également. On écrit cette mesure dans
// deux propriétés personnalisées, et la feuille de style s'en sert au lieu de
// deviner.
//
// LE REPLI DE SÛRETÉ RESTE `100svh` : entre le premier rendu et la première
// mesure, il vaut mieux une valeur approchée qu'une hauteur nulle. Et sur un
// navigateur sans `visualViewport` — il n'en reste presque plus — la page vit
// exactement comme avant.
//
// CE MODULE NE REND RIEN ET NE LIT RIEN DE PERSONNEL : deux nombres, écrits
// sur l'élément racine.

const H = "--ap-h";
const T = "--ap-t";

let branche = false;
let dernierH = -1;
let dernierT = -1;

function ecrire() {
  try {
    const vv = window.visualViewport;
    // `innerHeight` est le repli : il vaut la hauteur de la fenêtre, ce qui
    // reste plus proche du vrai que n'importe quelle unité CSS.
    const h = Math.round(vv?.height ?? window.innerHeight);
    const t = Math.round(vv?.offsetTop ?? 0);
    if (h === dernierH && t === dernierT) return;
    dernierH = h;
    dernierT = t;
    const r = document.documentElement.style;
    r.setProperty(H, `${h}px`);
    r.setProperty(T, `${t}px`);
  } catch {
    /* Sans mesure, la feuille de style retombe sur son repli. */
  }
}

/**
 * Branche la mesure. Appelable autant de fois qu'on veut : elle ne s'installe
 * qu'une fois, et elle se met à jour à chaque changement de ce qui est visible.
 */
export function suivreHauteurEcran() {
  if (typeof window === "undefined") return;
  ecrire();
  if (branche) return;
  branche = true;
  const vv = window.visualViewport;
  if (vv) {
    // `resize` couvre la rotation, le clavier et le repli des barres ;
    // `scroll` couvre le décalage quand le clavier pousse la vue.
    vv.addEventListener("resize", ecrire);
    vv.addEventListener("scroll", ecrire);
  }
  window.addEventListener("resize", ecrire);
  window.addEventListener("orientationchange", () => {
    // La rotation met un instant à se stabiliser : une mesure prise trop tôt
    // rend l'ancienne hauteur.
    ecrire();
    setTimeout(ecrire, 200);
    setTimeout(ecrire, 600);
  });
}
