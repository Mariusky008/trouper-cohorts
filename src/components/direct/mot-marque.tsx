// ✒️ LE MOT-MARQUE — « cli », le curseur, « me ».
//
// ═══ POURQUOI CE COMPOSANT EXISTE ══════════════════════════════════════════
//
// « Sur ces endroits je ne vois pas les nouveaux logos. Les couleurs sont
// fuchsias et roses comme sur ce screenshot, où le logo n'est plus bon mais les
// couleurs sont les bonnes. »
//
// LE NOM ÉTAIT ÉCRIT « ClikMe », AVEC UN K. Or le logo de Clikme n'a pas de k :
// il a un CURSEUR de souris à sa place, et c'est tout le nom — on clique, et
// c'est moi. Écrit au clavier, le mot perd la seule chose qui en fait une
// marque, et il ne reste qu'un mot de plus en gras.
//
// ET L'IMAGE NE POUVAIT PAS SERVIR ICI, sa feuille le dit déjà : « une image de
// mot se crénelle sur un écran dense et ne suit pas la police du produit ».
// C'est juste. Le curseur, lui, est un TRACÉ — trois polygones — donc il se
// pose dans la ligne de texte, prend sa couleur, suit sa taille et reste net à
// n'importe quelle densité.
//
// ═══ IL N'EST PAS À LA BONNE HAUTEUR PAR HASARD ═══════════════════════════
//
// Le curseur remplace une lettre à jambage haut. Son tracé fait 42 unités de
// haut pour 29 de large ; posé sur la ligne de base comme une lettre, il
// dépasserait du haut et flotterait du bas. On le cale donc sur la hauteur de
// capitale — `1em` de haut, aligné sur le texte, avec le même décalage optique
// que porte le logo d'origine.
import type { CSSProperties } from "react";

export function MotMarque({
  className,
  /** La couleur des lettres. Par défaut celle du texte autour. */
  encre = "currentColor",
  /** La couleur du curseur. Le fuchsia de la charte. */
  accent = "#FF2E9A",
  style,
}: {
  className?: string;
  encre?: string;
  accent?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={className} style={{ ...style, whiteSpace: "nowrap" }}>
      {/* LE NOM COMPLET RESTE LISIBLE PAR LES MACHINES ET LES VOIX. Un curseur
          dessiné au milieu d'un mot coupe le mot en deux pour un lecteur
          d'écran : « cli », un objet muet, « me ». On écrit donc le nom une
          fois, caché, et tout le reste est décoratif. */}
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      >
        Clikme
      </span>
      <span aria-hidden="true" style={{ color: encre }}>
        cli
        <svg
          viewBox="0 0 29 42"
          role="presentation"
          focusable="false"
          style={{
            height: "1em",
            width: "0.69em",
            display: "inline-block",
            verticalAlign: "baseline",
            /* LA LIGNE DE BASE EST CELLE DES LETTRES, PAS CELLE DE LA BOÎTE.
               Sans ce décalage, le tracé s'assoit sur la ligne et son montant
               descend sous les « i » et les « e ». */
            transform: "translateY(0.09em)",
            marginInline: "0.02em",
          }}
        >
          <rect x="1" y="1.5" width="6.8" height="38" fill="currentColor" />
          <path d="M11.8 23.5 L11.8 6.5 L26 20.5 L19.5 21 Z" fill={accent} />
          <path d="M11.8 23.5 L17 23.5 L27.5 38.5 L22 41 Z" fill={accent} />
        </svg>
        me
      </span>
    </span>
  );
}
