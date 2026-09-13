"use client";

// 📱 LE TÉLÉPHONE DE L'OUVERTURE — et ce qu'il montre est le geste, pas la carte.
//
// ═══ CE QU'ON DEMANDAIT ════════════════════════════════════════════════════
//
// « Le screenshot à côté, j'aurais aimé plutôt qu'il ait le fantôme et la barre
// de menu du bas, pour montrer dans l'animation que lorsqu'on clique sur le
// fantôme on peut essayer le produit. »
//
// LA VERSION D'AVANT FAISAIT TOURNER QUATRE CARTES, et c'était une démonstration
// d'étendue : voilà un coiffeur, voilà une fleuriste, voilà un boulanger. Utile,
// et racontable par n'importe quelle autre application. Ce qui ne se trouve
// nulle part ailleurs — le bouton vert au milieu de la barre, et ce qu'il ouvre
// — n'était visible sur aucune des quatre.
//
// DEUX ÉCRANS SUFFISENT À LE DIRE, et ils sont pris dans l'application telle
// qu'elle tourne : la carte du coiffeur avec sa barre du bas, puis la feuille
// d'essai qui monte. Entre les deux, un appui dessiné sur le fantôme. Personne
// n'a besoin de lire la légende pour comprendre ce qui s'est passé.
//
// ═══ CE SONT DE VRAIES CAPTURES, ET C'EST LA CONDITION ═════════════════════
//
// `hero-paquet.jpg` et `hero-essai.jpg` sortent de `/autour-de-moi` à 390×844,
// sans retouche. Redessiner ces deux écrans « en plus joli » aurait promis une
// application qui n'existe pas — et c'est précisément la faute que cette page a
// déjà payée une fois, avec une conversation redessinée façon réseau social.
//
// LA POSITION DU FANTÔME EST MESURÉE, PAS ESTIMÉE : 50 % de la largeur, 95,9 %
// de la hauteur de la capture, pour un bouton de 15,9 % de large. L'anneau se
// pose donc dessus au point près, quelle que soit l'échelle du cadre — c'est
// pour ça qu'il est placé en pourcentage et non en points.

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * LES QUATRE TEMPS, ET LEUR DURÉE EN MILLISECONDES.
 *
 * ILS SONT LONGS EXPRÈS. Premier réglage, à 900 ms par temps : l'œil voyait un
 * clignotement et pas un geste — on n'a pas le temps de lire la carte avant
 * qu'elle disparaisse, donc on ne comprend pas ce qu'on essaie. Une animation
 * qui se répète doit laisser LIRE à chaque tour, sans quoi elle ne se regarde
 * qu'une fois.
 *
 *   0 · la carte du jour, avec sa barre du bas — on a le temps de la lire
 *   1 · l'appui sur le fantôme — court, c'est un geste
 *   2 · la feuille d'essai, montée par-dessus — le plus long des quatre
 *   3 · elle redescend, et on recommence
 */
const TEMPS = [2600, 620, 4200, 1400];

export function Ouverture() {
  const [pas, setPas] = useState(0);

  /**
   * IL TOURNE, SAUF QUAND ON A DEMANDÉ QUE RIEN NE BOUGE.
   *
   * `prefers-reduced-motion` NE FIGE PAS SUR LA CARTE : figé là, le téléphone
   * ne dit plus que « voici une annonce », c'est-à-dire exactement ce que cette
   * ouverture ne veut plus dire. On s'arrête donc sur la feuille d'essai, qui
   * est la moitié de la démonstration — et l'anneau reste posé sur le fantôme,
   * immobile, pour que le lien entre les deux reste lisible.
   */
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setPas(2);
      return;
    }
    const t = window.setTimeout(() => setPas((p) => (p + 1) % TEMPS.length), TEMPS[pas]);
    return () => window.clearTimeout(t);
  }, [pas]);

  const essai = pas === 2;
  const doigt = pas === 1;

  return (
    <div className="ld-ouv">
      <div className="ld-vt">
        <div className="ld-vt-ecran">
          {/* LA CARTE DU JOUR RESTE DESSOUS EN PERMANENCE. On ne la démonte pas
              quand la feuille monte : c'est ce qui se passe dans l'application,
              et c'est aussi ce qui permet à la feuille de glisser sur quelque
              chose plutôt que sur du noir. */}
          <Image
            src="/le-direct/hero-paquet.jpg"
            alt="L’écran du Direct : la carte du jour d’un salon de coiffure — coupe homme, 18 €, il reste 3 créneaux — et la barre du bas, avec le fantôme au milieu."
            width={780}
            height={1688}
            priority
            sizes="(max-width:900px) 62vw, 330px"
            className="ld-ouv-i"
          />

          {/* ─── L'APPUI SUR LE FANTÔME ───
              Deux objets et pas un seul : l'anneau qui bat en continu dit
              « c'est ici », le disque qui s'écrase dit « on vient d'appuyer ».
              Un anneau seul se lit comme une décoration ; un appui seul arrive
              sans prévenir et on l'a manqué. */}
          <span className={`ld-ouv-cible${doigt ? " tape" : ""}`} aria-hidden="true">
            <i className="ld-ouv-anneau" />
            <i className="ld-ouv-appui" />
          </span>

          {/* LA FEUILLE D'ESSAI MONTE DU BAS, comme dans l'application. Elle est
              toujours montée dans le document — une image qui apparaît au
              moment où elle doit glisser arrive en retard au premier tour, et
              le premier tour est le seul que beaucoup verront. */}
          <div className={`ld-ouv-feuille${essai ? " ouverte" : ""}`}>
            <Image
              src="/le-direct/hero-essai.jpg"
              alt="La feuille d’essai : « Votre coupe, avant le rendez-vous » — prenez-vous en photo, la coupe du salon s’installe sur vos cheveux."
              width={780}
              height={1688}
              sizes="(max-width:900px) 62vw, 330px"
              className="ld-ouv-i"
            />
          </div>
        </div>
      </div>

      {/* IL N'Y A PAS DE LÉGENDE MANUSCRITE SUR CE TÉLÉPHONE, ET ELLE A ÉTÉ
          RETIRÉE APRÈS MESURE. Posée à droite du cadre — la seule place libre —
          elle passait DERRIÈRE le téléphone sur un écran large : on en lisait
          deux caractères au bord droit. Et l'ouverture en porte déjà une, à
          côté du fantôme, qui dit la même chose. Deux phrases à la main dans le
          même écran ne se lisent ni l'une ni l'autre. */}
    </div>
  );
}
