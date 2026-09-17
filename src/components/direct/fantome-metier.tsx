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
 * ═══ LES MASCOTTES, ET ELLES SONT DE LUI ═══════════════════════════════════
 *
 * « Je t'ai mis le fantôme en PNG pour chaque type de commerçant. »
 *
 * NEUF DESSINS SONT ARRIVÉS, et ils remplacent le fantôme vectoriel que ce
 * fichier dessinait en attendant. Le mien tenait debout — même personnage, même
 * clin d'œil, un pictogramme d'outil posé à côté — mais il ne faisait pas ce
 * que les siens font : le boucher porte une TOQUE et présente une entrecôte sur
 * sa planche, l'onglerie tient son pinceau, le fleuriste son bouquet. Ce ne sont
 * pas des variantes d'un même fichier, ce sont neuf personnages.
 *
 * ILS SONT SERVIS EN WEBP, ET C'ÉTAIT NÉCESSAIRE. Les PNG font entre 1,2 et
 * 1,9 mégaoctet chacun, en 1312 points de large. Sur un téléphone, le premier
 * objet de la page aurait coûté deux mégaoctets — plus que tout le reste de
 * l'application réunie. Rognés au sujet, ramenés à 440 points et passés en
 * WebP, ils pèsent une cinquantaine de kilooctets et restent nets jusqu'au
 * double de leur taille d'affichage. Voir `scripts/fantomes-mascottes.mjs`,
 * qui refait la conversion à l'identique le jour où il en envoie d'autres.
 *
 * `teinte` RESTE, ET ELLE NE SERT PLUS AU DESSIN. Elle colore le halo derrière
 * la mascotte, la question, la pastille et le liséré du style choisi — tout ce
 * qui doit s'accorder au personnage sans être le personnage.
 */
const OUTILS: { quand: RegExp; fichier?: string; emoji: string; teinte: string; nom: string }[] = [
  { quand: /ongulaire|onglerie|proth[ée]siste/i, fichier: "ongleries", emoji: "💅", teinte: "#FF4FA3", nom: "un vernis" },
  { quand: /coiffeur|coiffure|barbier/i, fichier: "coiffeurs", emoji: "💈", teinte: "#A855F7", nom: "une brosse" },
  { quand: /boucher|charcut/i, fichier: "boucher", emoji: "🥩", teinte: "#FF4D6D", nom: "une pièce de viande" },
  { quand: /fleurist/i, fichier: "fleuristes", emoji: "💐", teinte: "#FF7EB6", nom: "un bouquet" },
  { quand: /lunet|opticien/i, fichier: "lunettiers", emoji: "👓", teinte: "#5B8DEF", nom: "une monture" },
  { quand: /bar|caviste|vins/i, fichier: "bar", emoji: "🍷", teinte: "#C77DFF", nom: "un verre" },
  { quand: /restaurant|bistrot|brasserie|traiteur|pizz/i, fichier: "restaurant", emoji: "🍽️", teinte: "#FF8A5B", nom: "une assiette" },
  // « CRÉATEURS » COUVRE TOUT CE QUI SE FABRIQUE À LA MAIN — bijoux, cire,
  // tatouage. Ce n'est pas un repli faute de mieux : c'est le même geste, et le
  // dessin montre une créatrice avec son ouvrage.
  { quand: /bijou|bracelet|collier|joaill|cirier|ciri[èe]re|bougie|tatou|artisan|atelier/i, fichier: "createurs", emoji: "💍", teinte: "#E8B04B", nom: "une pièce" },
  { quand: /[ée]v[ée]nement|concert|march[ée]|expo|kiosque/i, fichier: "evenements", emoji: "🎪", teinte: "#7C93FF", nom: "un événement" },
  /**
   * ═══ CEUX QUI N'ONT PAS ENCORE LEUR MASCOTTE ═══════════════════════════
   *
   * Sans `fichier`, on retombe sur le fantôme dessiné plus bas, avec son
   * pictogramme. Il tient debout, il n'est simplement pas de sa main.
   *
   * IL N'EN MANQUE PLUS QU'UN : l'HYPNOTHÉRAPEUTE. La BOUTIQUE DE VÊTEMENTS et
   * la BOULANGERIE sont arrivées depuis — « ce n'est pas le bon fantôme, je
   * t'ai mis le bon en photo 5 ; idem pour le fantôme boulangerie ».
   *
   * CES DEUX-LÀ SONT RECADRÉS À LA CONVERSION, ET C'ÉTAIT INDISPENSABLE. Ils
   * sont dessinés comme des VITRINES entières — une boulangerie, une boutique —
   * là où les neuf autres sont des personnages : servis tels quels à la même
   * largeur, leur fantôme paraissait deux fois plus petit à taille de fichier
   * égale. Voir `scripts/fantomes-mascottes.mjs`.
   */
  { quand: /mode|pr[êe]t-[àa]-porter|friperie|fripe|v[êe]tement/i, fichier: "mode", emoji: "👗", teinte: "#FF4FA3", nom: "un cintre" },
  { quand: /boulanger|p[âa]tiss/i, fichier: "boulangerie", emoji: "🥖", teinte: "#F0A44A", nom: "une baguette" },
  { quand: /hypno|th[ée]rapeute|sophro/i, emoji: "🌙", teinte: "#7C93FF", nom: "un croissant de lune" },
];

const DEFAUT = { emoji: "✨", teinte: "#FF4FA3", nom: "une étincelle" };

export function outilDuMetier(metier: string): {
  fichier?: string;
  emoji: string;
  teinte: string;
  nom: string;
} {
  return OUTILS.find((o) => o.quand.test(metier)) ?? DEFAUT;
}

/**
 * LA MASCOTTE DU MÉTIER, OU LE FANTÔME DESSINÉ QUAND ELLE MANQUE.
 *
 * LE HALO EST DERRIÈRE DANS LES DEUX CAS. Les mascottes sont déjà lumineuses ;
 * le halo ne les éclaire pas, il les POSE — sans lui, un PNG détouré flotte sur
 * le panneau rose comme un autocollant.
 */
export function FantomeMetier({ metier, classe }: { metier: string; classe?: string }) {
  const o = outilDuMetier(metier);
  return (
    <span
      className={`fm${classe ? ` ${classe}` : ""}${o.fichier ? " vrai" : ""}`}
      style={{ "--fm-teinte": o.teinte } as React.CSSProperties}
    >
      <span className="fm-halo" aria-hidden="true" />
      {o.fichier ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="fm-img" src={`/direct/fantomes/${o.fichier}.webp`} alt="" />
      ) : (
        <FantomeDessine emoji={o.emoji} />
      )}
    </span>
  );
}

/**
 * LE FANTÔME DESSINÉ — le repli, et il reste utile.
 *
 * Il ne couvre plus qu'un métier — l'hypnothérapeute — mais il couvrira tout
 * métier nouveau le jour où il en entre un. Un écran qui attend un fichier pour
 * s'afficher est un écran qui ne s'affiche pas.
 *
 * IL NE DÉPEND DE RIEN : ni `defs`, ni dégradé nommé, ni feuille extérieure.
 * C'est la leçon du fantôme de la page d'accueil, qui dépend d'un bloc d'encres
 * posé une fois pour SA page : monté ailleurs, il devient un trou noir.
 */
function FantomeDessine({ emoji }: { emoji: string }) {
  return (
    <>
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
          pour qu'il garde sa couleur de système : un emoji dans un `text` SVG se
          rend en noir sur plusieurs navigateurs. */}
      <span className="fm-outil" aria-hidden="true">
        {emoji}
      </span>
    </>
  );
}
