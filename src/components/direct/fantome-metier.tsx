// 👻 LE FANTÔME QUI PORTE L'OUTIL DU MÉTIER.
//
// ═══ CE QU'IL A REMARQUÉ ═══════════════════════════════════════════════════
//
// « Tu remarqueras aussi que le fantôme s'adapte à chaque métier… »
//
// ET C'EST LA CHOSE LA PLUS FINE DE SES MAQUETTES. Chez l'onglerie il tient un
// vernis, chez le boucher une planche et une pièce de viande, chez la boutique
// un cintre, chez le coiffeur une brosse. Le personnage ne change pas — c'est
// le même fantôme, avec le même sourire et le même clin d'œil — mais il a pris
// l'outil de la maison où l'on est entré.
//
// CE N'EST PAS DE LA DÉCORATION, C'EST LA PHRASE DE LA PAGE. Le bloc dit « et si
// vous l'essayiez ? » ; un fantôme les mains vides le dit moins bien qu'un
// fantôme qui tient déjà le pinceau. Il montre ce qu'on va faire AVANT qu'on
// ait lu le titre.
//
// ═══ POURQUOI UN DESSIN ET PAS UNE IMAGE ══════════════════════════════════
//
// Ses maquettes sont des rendus : un fantôme lumineux, un peu volumineux, avec
// un halo rose. Le reproduire en images demanderait DIX FICHIERS — un par
// métier — que personne n'a, et qui pèseraient chacun deux cents kilooctets sur
// la première image de la page.
//
// EN SVG, LE PERSONNAGE EST ÉCRIT UNE FOIS et l'outil est la seule chose qui
// change. Il prend la couleur du métier par une variable, il est net sur
// n'importe quel écran, et un métier nouveau se dessine en ajoutant une entrée
// à une table — pas en commandant une illustration.

/**
 * L'OUTIL, PAR MÉTIER.
 *
 * `emoji` EST LE DESSIN, ET C'EST UN CHOIX ASSUMÉ. Un pictogramme vectoriel par
 * outil serait plus beau et prendrait deux cents lignes ; l'emoji est rendu par
 * le système, il est en couleur, il est reconnaissable à vingt points, et il
 * tombe juste pour les onze métiers du paquet. Le jour où l'on fait dessiner
 * les outils, seule cette table change.
 *
 * `teinte` EST LE HALO DERRIÈRE LE FANTÔME. Ses maquettes le font rose partout
 * sauf chez le coiffeur, où il vire au violet : la couleur suit l'univers du
 * commerce, pas l'application.
 */
const OUTILS: { quand: RegExp; emoji: string; teinte: string; nom: string }[] = [
  { quand: /ongulaire|onglerie|proth[ée]siste/i, emoji: "💅", teinte: "#FF4FA3", nom: "un vernis" },
  { quand: /coiffeur|coiffure|barbier/i, emoji: "💈", teinte: "#A855F7", nom: "une brosse" },
  { quand: /boucher|charcut/i, emoji: "🥩", teinte: "#FF4D6D", nom: "une pièce de viande" },
  { quand: /boulanger|p[âa]tiss/i, emoji: "🥖", teinte: "#F0A44A", nom: "une baguette" },
  { quand: /mode|pr[êe]t-[àa]-porter|friperie|fripe/i, emoji: "👗", teinte: "#FF4FA3", nom: "un cintre" },
  { quand: /lunet|opticien/i, emoji: "👓", teinte: "#5B8DEF", nom: "une monture" },
  { quand: /fleurist/i, emoji: "💐", teinte: "#FF7EB6", nom: "un bouquet" },
  { quand: /tatou/i, emoji: "🖊️", teinte: "#8B5CF6", nom: "un dermographe" },
  { quand: /bijou|bracelet|collier/i, emoji: "💍", teinte: "#E8B04B", nom: "une bague" },
  { quand: /cirier|ciri[èe]re|bougie/i, emoji: "🕯️", teinte: "#F0A44A", nom: "une bougie" },
  { quand: /restaurant|bistrot|brasserie|traiteur|pizz/i, emoji: "🍽️", teinte: "#FF8A5B", nom: "une assiette" },
  { quand: /bar|caviste|vins/i, emoji: "🍷", teinte: "#C77DFF", nom: "un verre" },
  { quand: /hypno|th[ée]rapeute|sophro/i, emoji: "🌙", teinte: "#7C93FF", nom: "un croissant de lune" },
];

const DEFAUT = { emoji: "✨", teinte: "#FF4FA3", nom: "une étincelle" };

export function outilDuMetier(metier: string): { emoji: string; teinte: string; nom: string } {
  return OUTILS.find((o) => o.quand.test(metier)) ?? DEFAUT;
}

/**
 * LE FANTÔME, SON HALO ET SON OUTIL.
 *
 * IL FAIT UN CLIN D'ŒIL, ET C'EST DANS LA MAQUETTE. L'œil gauche est un trait
 * plutôt qu'un ovale — un détail d'un pixel qui change tout le personnage : un
 * fantôme qui regarde est un logo, un fantôme qui cligne est quelqu'un.
 *
 * IL N'A PAS DE `defs`, DONC PAS D'IDENTIFIANT GLOBAL. C'est la leçon du
 * fantôme de la page d'accueil, qui dépend d'un bloc d'encres posé une fois
 * pour SA page : monté ailleurs, il devient un trou noir. Celui-ci ne dépend
 * que de `currentColor` et de deux couleurs en dur.
 */
export function FantomeMetier({ metier, classe }: { metier: string; classe?: string }) {
  const o = outilDuMetier(metier);
  return (
    <span
      className={`fm${classe ? ` ${classe}` : ""}`}
      style={{ "--fm-teinte": o.teinte } as React.CSSProperties}
    >
      <span className="fm-halo" aria-hidden="true" />
      <svg className="fm-corps" viewBox="0 0 120 132" aria-hidden="true" focusable="false">
        {/* LE CORPS, EN DEUX COUCHES : un aplat très clair pour le volume, puis
            le blanc par-dessus, légèrement rentré. C'est ce qui donne l'air
            translucide des rendus de la maquette sans aucun dégradé nommé. */}
        <path
          d="M60 6C33.5 6 12 27.5 12 54v56.5c0 3.7 4.2 5.8 7.2 3.6l8.7-6.2c2.1-1.5 4.9-1.2 6.7.6l6 6c2.4 2.4 6.2 2.4 8.6 0l5.7-5.7c2.1-2.1 5.6-2.1 7.7 0l5.7 5.7c2.4 2.4 6.2 2.4 8.6 0l6-6c1.8-1.8 4.6-2.1 6.7-.6l8.7 6.2c3 2.2 7.2.1 7.2-3.6V54c0-26.5-21.5-48-48-48z"
          fill="var(--fm-teinte)"
          opacity=".22"
        />
        <path
          d="M60 12C36.8 12 18 30.8 18 54v52c0 3.2 3.7 5.1 6.3 3.2l7.6-5.4c1.9-1.3 4.4-1.1 6 .5l5.2 5.2c2.1 2.1 5.5 2.1 7.6 0l5-5c1.9-1.9 4.9-1.9 6.8 0l5 5c2.1 2.1 5.5 2.1 7.6 0l5.2-5.2c1.6-1.6 4.1-1.8 6-.5l7.6 5.4c2.6 1.9 6.3 0 6.3-3.2V54c0-23.2-18.8-42-42-42z"
          fill="#FFFFFF"
        />
        {/* LES JOUES, DANS LA COULEUR DU MÉTIER. C'est le seul endroit où elle
            touche le personnage lui-même — le reste du fantôme reste blanc,
            sinon on obtient un fantôme teint, pas un fantôme éclairé. */}
        <ellipse cx="34" cy="72" rx="8.5" ry="5" fill="var(--fm-teinte)" opacity=".3" />
        <ellipse cx="86" cy="72" rx="8.5" ry="5" fill="var(--fm-teinte)" opacity=".3" />
        {/* L'ŒIL OUVERT, ET L'ŒIL QUI CLIGNE. */}
        <ellipse cx="44" cy="56" rx="6.5" ry="8.5" fill="#2B1D45" />
        <circle cx="46.4" cy="52.5" r="2.4" fill="#FFFFFF" />
        <path
          d="M70 57c2.5-4 8.5-4 11 0"
          stroke="#2B1D45"
          strokeWidth="4.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M50 80c3.5 4.5 13 4.5 16.5 0"
          stroke="#2B1D45"
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {/* L'OUTIL, TENU DEVANT LUI. Il est posé en absolu plutôt que dans le SVG
          pour qu'il garde sa couleur de système : un emoji dans un `<text>` SVG
          se rend en noir sur plusieurs navigateurs. */}
      <span className="fm-outil" aria-hidden="true">
        {o.emoji}
      </span>
    </span>
  );
}
