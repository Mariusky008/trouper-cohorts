"use client";

// 👻 LE FANTÔME QUI RAMÈNE À L'ACCUEIL — le même sur les cinq parcours.
//
// ═══ POURQUOI IL EXISTE ════════════════════════════════════════════════════
//
// « Onglet sortie : on n'a pas le petit fantôme en haut à droite pour revenir à
// l'accueil. Il manque à pas mal d'endroits, et parfois c'est une maison au
// lieu du fantôme. »
//
// CINQ PARCOURS, TROIS FAÇONS DE RENTRER. La mode avait une maison nue, la
// sortie et la déco une maison cachée dans la pastille du lieu, la coiffure et
// la table le fantôme avec sa maison. Chaque écran avait été réparé
// séparément, donc chaque écran avait sa version — et celui qu'on n'avait pas
// encore regardé n'avait rien du tout.
//
// UN COMPOSANT, UNE PLACE, UN GESTE. Le jour où le dessin bouge, il bouge une
// fois. C'est la même leçon que le mot-marque, tirée le même jour.
//
// ═══ ET LE FANTÔME PLUTÔT QUE LA MAISON, PARCE QU'IL L'A DEMANDÉ ═══════════
//
// « Ou mieux encore, il faut qu'on comprenne que le petit fantôme en haut à
// droite est fait pour revenir à l'accueil. »
//
// IL EST DÉJÀ LÀ, À CETTE PLACE, SUR CHAQUE ÉCRAN. Lui donner la fonction
// évite d'ajouter une icône à un en-tête qui en porte déjà trois. Ce qui
// manquait pour qu'on le comprenne, c'est que ça se voie : il est donc un
// BOUTON — il réagit au doigt, il porte un nom pour les lecteurs d'écran — et
// la petite maison se pose sur son épaule pour dire où il mène. Une mascotte
// cliquable sans aucun signe reste une mascotte.

/** Le halo suit la charte : le fuchsia de l'écran de démarrage, jamais le violet. */
export function FantomeAccueil({
  onClick,
  classe = "",
  /** Ce qu'on retrouve en appuyant. « l'accueil » par défaut. */
  ou = "l’accueil",
  /* LE MÊME FANTÔME VA DANS LES DEUX SENS. Sur les parcours il RAMÈNE à
     l'accueil ; sur l'écran de démarrage, il ENTRE dans l'application. Le
     dessin et la place ne changent pas — seul le verbe change, parce qu'un
     lecteur d'écran qui annonce « Revenir à l'application » à quelqu'un qui
     n'y est jamais allé lui ment. */
  verbe = "Revenir à",
}: {
  onClick: () => void;
  /** La classe qui donne SA TAILLE au fantôme sur cet écran-là. */
  classe?: string;
  ou?: string;
  verbe?: string;
}) {
  return (
    <button
      type="button"
      className="fa"
      onClick={onClick}
      aria-label={`${verbe} ${ou}`}
      title={`${verbe} ${ou}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`fa-f ${classe}`.trim()} src="/clikme-fantome.png" alt="" />
      <s className="fa-m" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3.6 10.6 12 3.8l8.4 6.8" />
          <path d="M5.8 9v10.4a1 1 0 0 0 1 1h10.4a1 1 0 0 0 1-1V9" />
        </svg>
      </s>
      <style
        dangerouslySetInnerHTML={{
          __html: `
/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
.fa{position:relative;flex:none;padding:0;border:0;background:none;
  font:inherit;cursor:pointer;line-height:0;border-radius:999px;}
.fa:active{transform:scale(.94);}
.fa:focus-visible{outline:2px solid #FF2E9A;outline-offset:3px;}
/* LA TAILLE VIENT DE L'ECRAN, PAS D'ICI : chaque parcours a la sienne, et
   elle est ecrite dans sa feuille. Ce fichier ne pose que le halo, qui lui
   est commun. */
.fa-f{height:auto;filter:drop-shadow(0 0 16px rgba(255,46,154,.65));}
.fa-m{position:absolute;right:-2px;bottom:-2px;
  width:22px;height:22px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  color:#06060A;background:#FF2E9A;
  box-shadow:0 2px 10px rgba(255,46,154,.55);}
.fa-m svg{width:12px;height:12px;fill:none;stroke:currentColor;
  stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
@media (prefers-reduced-motion:reduce){.fa:active{transform:none;}}
`,
        }}
      />
    </button>
  );
}
