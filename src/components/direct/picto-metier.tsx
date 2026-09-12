// LE PICTOGRAMME DU MÉTIER — un trait, une grille de 24, et rien d'autre.
//
// ─── POURQUOI IL EST SORTI DE `apercu-habitant.tsx` ────────────────────────
//
// Il y vivait depuis toujours, et il y était bien tant qu'un seul écran s'en
// servait. La page boutique en a besoin aussi : c'est ELLE qui doit rejouer
// l'anneau de la carte, faute de quoi on ne reconnaît pas le même commerce
// d'un écran à l'autre — et c'était tout l'objet de l'exercice.
//
// LA COPIE ÉTAIT LE VRAI DANGER, PAS L'IMPORT. Deux jeux d'icônes qui
// commencent identiques finissent différents : on ajoute un métier d'un côté,
// on corrige un tracé de l'autre, et six mois plus tard la même fleuriste n'a
// pas la même tulipe sur sa carte et sur sa page. C'est exactement la
// divergence qu'on vient de passer trois jours à diagnostiquer ailleurs.
//
// ─── CE QUI COMPTE DANS CES DESSINS, ET QUI SE PERD VITE ────────────────────
//
// MÊME GRILLE, MÊME ÉPAISSEUR, MÊME NIVEAU DE DÉTAIL. C'est ce qui en fait une
// famille ; un dessin plus fouillé que ses voisins saute aux yeux comme une
// faute d'orthographe. L'épaisseur et la couleur ne sont PAS ici : elles
// viennent du CSS de l'écran qui l'affiche, parce qu'un pictogramme posé sur
// une photo et le même posé sur un fond sombre n'ont pas les mêmes besoins.
import type { ReactNode } from "react";
import type { CleIcone } from "@/lib/direct/apercu-habitant";

export function PictoMetier({ icone }: { icone: CleIcone }) {
  const traces: Record<CleIcone, ReactNode> = {
    // Fourchette et couteau — le seul qui existait, et le seul qui était juste.
    restaurant: (
      <>
        <path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" />
        <path d="M6 12v9" />
        <path d="M17 3c-1.7 1.3-2.5 3.2-2.5 5.5S15.3 12.7 17 14v7" />
      </>
    ),
    // Un verre a cocktail : c'est la silhouette du bar, pas celle du repas.
    bar: (
      <>
        <path d="M4.5 4.5h15l-7.5 8.5z" />
        <path d="M12 13v6.5" />
        <path d="M8.5 20.5h7" />
      </>
    ),
    // Des ciseaux. Deux anneaux en bas, deux lames croisees : la seule image
    // qu'un coiffeur reconnait sans la lire.
    coiffeur: (
      <>
        <circle cx="6.2" cy="18" r="2.3" />
        <circle cx="17.8" cy="18" r="2.3" />
        <path d="M7.8 16.4 19 4" />
        <path d="M16.2 16.4 5 4" />
      </>
    ),
    // Un cintre : l'objet du magasin de vetements, friperie comprise.
    mode: (
      <>
        <path d="M12 5.6a1.7 1.7 0 1 1 1.7 1.7c-.9 0-1.7.8-1.7 1.7v1.2" />
        <path d="m12 10.2-8.4 5.4c-.8.5-.4 1.9.6 1.9h15.6c1 0 1.4-1.4.6-1.9L12 10.2z" />
      </>
    ),
    // Une tulipe. Une marguerite demande cinq petales et devient une tache a
    // cette taille ; une tulipe garde sa silhouette a trente points.
    fleuriste: (
      <>
        <path d="M7.8 4.6c0 4.2 1.8 6.8 4.2 6.8s4.2-2.6 4.2-6.8c-1.4 1.1-2.7 1.6-4.2 1.6S9.2 5.7 7.8 4.6z" />
        <path d="M12 11.4V20.5" />
        <path d="M12 16.4c-2.1 0-3.7-1.3-3.7-3.2" />
      </>
    ),
    // Un flacon de vernis : l'objet, pas la main — une main au trait a cette
    // taille ne se lit jamais.
    ongles: (
      <>
        <path d="M10.4 2.6h3.2v3.6h-3.2z" />
        <path d="M9 10.3c0-2.1 1.3-4.1 3-4.1s3 2 3 4.1v8.4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
        <path d="M9.3 13.2h5.4" />
      </>
    ),
    // Une paire de lunettes : deux cercles et un pont. C'est le seul objet de
    // cette liste que tout le monde dessine de la meme facon depuis toujours,
    // et il se lit encore a vingt points — ce qui n'est pas le cas d'un visage
    // qui les porterait.
    lunetier: (
      <>
        <circle cx="6.4" cy="14" r="3.6" />
        <circle cx="17.6" cy="14" r="3.6" />
        <path d="M10 13.4c.6-.7 1.4-1 2-1s1.4.3 2 1" />
        <path d="M2.8 12.2 4.6 8.4" />
        <path d="M21.2 12.2 19.4 8.4" />
      </>
    ),
    // ─── DEUX DESSINS QUE LES SIX BRANCHES NE COUVRAIENT PAS ───
    // Un boucher et un boulanger sont rangés sous « restaurant » faute de
    // branche a eux ; leur laisser la fourchette et le couteau redisait le
    // defaut d'un cran plus bas.
    // L'etal : l'auvent et le comptoir, la silhouette du marche couvert.
    etal: (
      <>
        <path d="M3 9.5 5 4h14l2 5.5z" />
        <path d="M3 9.5h18" />
        <path d="M4.8 9.5V20h14.4V9.5" />
        <path d="M8.6 20v-5.4h6.8V20" />
      </>
    ),
    // L'ARTISAN SANS METIER ECRIT tombe sur la bougie : c'est le repli de la
    // branche, et il vaut mieux qu'un pictogramme neutre qui ne dit rien.
    artisan: (
      <>
        <path d="M7.5 10.5h9v10a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5z" />
        <path d="M12 10.5V8.4" />
        <path d="M12 2.6c2.1 2 3 3.3 3 4.3a3 3 0 0 1-6 0c0-1 .9-2.3 3-4.3z" />
      </>
    ),
    // ─── LES TROIS ARTISANS ───
    // MEME GRILLE DE 24, MEME EPAISSEUR QUE LES SIX AUTRES : c'est ce qui fait
    // une famille d'icones, et c'est la seule chose qui compte ici. Un dessin
    // plus detaille que ses voisins saute aux yeux comme une faute.
    // La bougie : le pot, la meche, la flamme. La flamme est une goutte
    // pointue vers le haut — ronde, elle devient une ampoule.
    bougie: (
      <>
        <path d="M7.5 10.5h9v10a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5z" />
        <path d="M12 10.5V8.4" />
        <path d="M12 2.6c2.1 2 3 3.3 3 4.3a3 3 0 0 1-6 0c0-1 .9-2.3 3-4.3z" />
      </>
    ),
    // Le bijou : un fil qui fait le tour, et la pierre au milieu. Un collier
    // se reconnait a sa RETOMBEE, pas a son cercle : c'est le V du bas qui le
    // distingue d'un anneau.
    bijou: (
      <>
        <path d="M5 4.2c0 6.6 3.1 10.6 7 12.6 3.9-2 7-6 7-12.6" />
        <path d="M12 16.8v1.4" />
        <path d="m12 18.2 2.4 2.1-2.4 1.9-2.4-1.9z" />
      </>
    ),
    // La seance : un fauteuil vu de trois quarts, et rien d'autre. Un cerveau
    // ou une spirale auraient dit « hypnose de spectacle » — exactement ce que
    // ce metier passe son temps a corriger.
    seance: (
      <>
        <path d="M6.6 12.4V6.8a2.4 2.4 0 0 1 2.4-2.4h6a2.4 2.4 0 0 1 2.4 2.4v5.6" />
        <path d="M4.6 12.4h14.8v4.2a1.6 1.6 0 0 1-1.6 1.6H6.2a1.6 1.6 0 0 1-1.6-1.6z" />
        <path d="M7.4 18.2v2.4" />
        <path d="M16.6 18.2v2.4" />
      </>
    ),
    // Le pain : une miche et ses deux entailles.
    pain: (
      <>
        <path d="M3.2 12.6c0-3.4 3.9-6.1 8.8-6.1s8.8 2.7 8.8 6.1c0 3.1-3.9 4.9-8.8 4.9s-8.8-1.8-8.8-4.9z" />
        <path d="M9 9.6 7.4 14.8" />
        <path d="M13.4 9.4 11.8 14.6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {traces[icone] ?? traces.restaurant}
    </svg>
  );
}

/**
 * L'ANNEAU DU MÉTIER — le disque dessiné qui porte le pictogramme.
 *
 * ─── POURQUOI IL EST ICI ET PAS RECOPIÉ ──────────────────────────────────
 *
 * C'EST LA SIGNATURE VISUELLE DU COMMERCE, et elle doit être IDENTIQUE au
 * pixel sur la carte du fil et en tête de sa page. C'est même toute la
 * mécanique du rapprochement des deux écrans : on ne les rend pas semblables
 * en repeignant l'un aux couleurs de l'autre, on pose le MÊME OBJET sur les
 * deux, et le reste peut différer sans que personne ne s'y perde. Le bandeau
 * d'une boutique Etsy fait exactement ça, et rien de plus.
 *
 * TROIS COUCHES, ET AUCUNE N'EST DÉCORATIVE : un halo extérieur très fin qui
 * décolle le disque de la photo, un reflet en haut qui lui donne son
 * épaisseur, et l'anneau en dégradé — menthe clair là où la lumière tombe,
 * émeraude au milieu, vert profond en bas. La lumière vient du haut gauche,
 * comme partout ailleurs dans le produit.
 *
 * LES IDENTIFIANTS DE DÉGRADÉ SONT CEUX DE LA CARTE (`cdPorteG`, `cdPorteL`)
 * et c'est voulu : les deux ne coexistent jamais sur le même écran, et garder
 * le même nom fait que la feuille de style de la carte s'applique telle quelle
 * si un jour l'anneau y revient par ici.
 */
export function AnneauMetier() {
  return (
    <svg className="cd-po-c" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="cdPorteG" x1=".12" y1="0" x2=".88" y2="1">
          <stop offset="0" stopColor="#DFFFF2" />
          <stop offset=".34" stopColor="#5CF0BC" />
          <stop offset=".68" stopColor="#17B98A" />
          <stop offset="1" stopColor="#0A6A50" />
        </linearGradient>
        <linearGradient id="cdPorteL" x1=".5" y1="0" x2=".5" y2=".66">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle className="cd-po-h" cx="50" cy="50" r="48.2" />
      <circle className="cd-po-l" cx="50" cy="50" r="45.4" />
      <circle className="cd-po-a" cx="50" cy="50" r="45.4" />
    </svg>
  );
}
