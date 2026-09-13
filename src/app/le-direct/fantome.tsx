"use client";

// 👻 LE FANTÔME DE LA PAGE D'ACCUEIL — celui de l'application, pas un autre.
//
// ═══ CE QU'ON REPROCHAIT À CELUI D'AVANT ═══════════════════════════════════
//
// « Le fantôme doit être plus présent et au cœur des actions, donc vraiment
// utilise-le pour raconter l'histoire narrative et le chemin de A à Z. Et comme
// sur l'app (même problème) il est bizarrement coupé à droite. »
//
// DEUX REPROCHES, ET LE SECOND EXPLIQUE LE PREMIER. La page d'accueil dessinait
// SON PROPRE fantôme : un corps blanc, deux ellipses sombres, un arc pour la
// bouche. Soixante lignes de moins que celui de l'application, et surtout : pas
// de bras, pas de joues, pas d'ombre portée, pas de relief. Il ne pouvait donc
// rien faire — un pictogramme ne regarde pas, ne montre pas, n'accompagne pas.
// C'est pour ça qu'il n'apparaissait que deux fois, en décoration, dans la
// marge. On ne met pas au cœur de l'action quelqu'un qui n'a pas de bras.
//
// CELUI-CI EST LE MÊME TRACÉ QUE `apercu-habitant.tsx`, coordonnée par
// coordonnée : le corps, les deux moignons, les joues, les yeux avec leurs deux
// points de lumière, la bouche, l'ombre au sol. Ce qui change est ce qui doit
// changer — les identifiants des dégradés (préfixe `ldf`, sinon ils entreraient
// en collision avec ceux de l'application dans le cadre de l'essai) et les noms
// de classes, parce que la feuille de style de cette page est la sienne.
//
// ═══ ET IL N'EST PAS ROGNÉ ═════════════════════════════════════════════════
//
// SES BRAS DÉBORDENT DU CADRE, ET C'EST LA CAUSE EXACTE DE « coupé à droite ».
// Le moignon droit est une ellipse à cx=36,6 et rx=4 : son bord atteint 40,6
// sur une zone de dessin qui s'arrête à 40. Le gauche, à cx=3,4, descend à -0,6.
// Un `<svg>` rogne son propre cadre — c'est la règle du format, pas un réglage,
// et `overflow:visible` sur le parent n'y change rien. Six dixièmes de point de
// chaque côté suffisaient à en faire un personnage manchot.
//
// LE CADRE S'OUVRE DONC D'UN POINT ET DEMI DE CHAQUE CÔTÉ, sans qu'une seule
// coordonnée du dessin bouge. Même correction, même valeur, même raison que dans
// l'application — et si l'une des deux change un jour, l'autre doit suivre.

/**
 * LES ENCRES DU FANTÔME, DÉCLARÉES UNE SEULE FOIS POUR TOUTE LA PAGE.
 *
 * ═══ ET CE N'EST PAS UNE ÉCONOMIE, C'EST UNE CORRECTION ════════════════════
 *
 * LE DÉFAUT, MESURÉ À 390 POINTS : tous les fantômes de la page étaient
 * DÉCAPITÉS — bras, joues, bouche et points de lumière visibles, corps et yeux
 * absents. Exactement les pièces remplies par un dégradé, et uniquement
 * celles-là.
 *
 * LA CAUSE. Chaque fantôme portait sa propre copie des dégradés, avec les mêmes
 * identifiants ; le navigateur prend alors le PREMIER du document et ignore les
 * suivants. Or le premier de cette page est celui de l'ouverture, et celui-là
 * est en `display:none` en dessous de 900 points — il n'y a pas de place pour
 * lui à côté du titre. Un élément retiré de l'arbre de rendu ne fournit PLUS
 * ses serveurs de peinture : `fill:url(#ldfCorps)` ne résolvait donc rien, et
 * les neuf autres copies, ignorées, ne pouvaient pas prendre le relais.
 *
 * SUR ORDINATEUR TOUT ALLAIT BIEN, ce qui est la pire forme du défaut : il ne
 * se voyait que sur le seul appareil où la page compte.
 *
 * LES ENCRES SORTENT DONC DES FANTÔMES et se posent une fois, dans un SVG de
 * taille nulle mais RENDU — pas `display:none`, pas `visibility:hidden`, les
 * deux ramèneraient exactement le même défaut.
 */
export function EncresDuFantome() {
  return (
    <svg className="ld-f-encres" aria-hidden="true" focusable="false">
      <defs>
        {/* LA LUMIÈRE VIENT D'EN HAUT À GAUCHE, ET TOUT EN DÉCOULE : le dégradé
            du corps, le liseré clair sur cette épaule-là, et l'ombre qui se
            creuse à l'opposé. Un seul soleil : c'est ce qui sépare un dessin
            d'un collage. */}
        <linearGradient id="ldfCorps" x1=".2" y1="0" x2=".82" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".5" stopColor="#F3FAF6" />
          <stop offset="1" stopColor="#BFDFD0" />
        </linearGradient>
        {/* LE LISERÉ. Un trait clair qui ne fait que le quart haut gauche, et
            s'efface : c'est ce que fait la lumière sur un volume. */}
        <linearGradient id="ldfFil" x1=".05" y1="0" x2=".7" y2=".55">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".55" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ldfLueur" cx=".32" cy=".24" r=".44">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* L'OMBRE INTERNE, en bas à droite : sans elle le corps est un aplat,
            avec elle il est rond. */}
        <radialGradient id="ldfCreux" cx=".74" cy=".82" r=".55">
          <stop offset="0" stopColor="#5E9E85" stopOpacity=".34" />
          <stop offset="1" stopColor="#5E9E85" stopOpacity="0" />
        </radialGradient>
        {/* L'ŒIL EST UNE BILLE, pas un point : un dégradé du haut vers le bas
            suffit à le bomber. */}
        <radialGradient id="ldfOeil" cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#2A5C4A" />
          <stop offset="1" stopColor="#07211A" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/**
 * LE FANTÔME, À LA TAILLE QUE LUI DONNE SA CLASSE.
 *
 * IL N'A PAS DE PROPRIÉTÉ DE TAILLE, ET C'EST VOULU : une largeur passée en
 * paramètre se serait promenée dans le code de la page sous forme de nombres
 * nus, et la taille d'un dessin est une décision de mise en page, pas de
 * composant. La feuille de style porte `.ld-f` et ses variantes.
 *
 * `regarde` LUI FAIT SUIVRE QUELQUE CHOSE DU REGARD. Les pupilles se décalent
 * de huit dixièmes de point vers la droite ou la gauche : c'est peu, et c'est
 * exactement ce qu'il faut pour qu'on sente qu'il montre ce qui est à côté de
 * lui plutôt que de regarder dans le vide. C'est la brique qui permet de le
 * mettre « au cœur des actions » sans lui inventer une pose par écran.
 */
export function Fantome({
  classe,
  regarde,
}: {
  classe?: string;
  regarde?: "gauche" | "droite";
}) {
  const dx = regarde === "droite" ? 0.8 : regarde === "gauche" ? -0.8 : 0;
  return (
    <svg
      className={`ld-f${classe ? ` ${classe}` : ""}`}
      viewBox="-1.5 0 43 44.8"
      aria-hidden="true"
      focusable="false"
    >
      {/* PAS DE `defs` ICI : les encres sont posées une fois pour toute la page
          par `EncresDuFantome`, et la raison est un défaut mesuré — voir
          au-dessus. Dix copies du même identifiant ne servaient à rien, et la
          première décidait pour toutes les autres. */}
      <ellipse className="ld-f-ombre" cx="20" cy="41.6" rx="11" ry="2.4" />

      {/* ─── LES BRAS ───
          Ils sont dessinés AVANT le corps, donc derrière lui : ils sortent de
          dessous, comme les bras d'une peluche, et on ne voit jamais où ils
          s'attachent. Deux moignons suffisent — ce qui fait le personnage,
          c'est qu'ils BOUGENT. */}
      <ellipse className="ld-f-bras g" cx="3.4" cy="27.2" rx="4" ry="2.7" />
      <ellipse className="ld-f-bras d" cx="36.6" cy="27.2" rx="4" ry="2.7" />

      <path
        className="ld-f-corps"
        d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
      />
      <path
        className="ld-f-creux"
        d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
      />
      <path
        className="ld-f-lueur"
        d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
      />
      <path
        className="ld-f-fil"
        d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
      />

      <ellipse className="ld-f-joue g" cx="10.4" cy="24.6" rx="2.8" ry="1.8" />
      <ellipse className="ld-f-joue d" cx="29.6" cy="24.6" rx="2.8" ry="1.8" />

      {/* LES DEUX YEUX, ET LEURS DEUX POINTS DE LUMIÈRE CHACUN. Le gros en haut
          à gauche — du côté d'où vient le soleil du dessin — le petit en bas à
          droite. C'est ce second point, celui qu'on oublie, qui fait qu'un œil
          est vivant plutôt que percé. */}
      <g transform={dx ? `translate(${dx} 0)` : undefined}>
        <ellipse className="ld-f-oeil g" cx="14.2" cy="19" rx="2.6" ry="3.4" />
        <circle className="ld-f-eclat g" cx="15.1" cy="17.7" r=".95" />
        <circle className="ld-f-eclat2 g" cx="13.3" cy="20.5" r=".45" />
        <ellipse className="ld-f-oeil d" cx="25.8" cy="19" rx="2.6" ry="3.4" />
        <circle className="ld-f-eclat d" cx="26.7" cy="17.7" r=".95" />
        <circle className="ld-f-eclat2 d" cx="24.9" cy="20.5" r=".45" />
      </g>

      <path className="ld-f-bouche" d="M16.4 26.2c1.5 2 5.7 2 7.2 0" />
    </svg>
  );
}
