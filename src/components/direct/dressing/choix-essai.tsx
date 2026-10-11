"use client";

/**
 * 👗 « COMMENT VOULEZ-VOUS L'ESSAYER ? » — l'écran 2 de la maquette.
 *
 * Il s'ouvre quand on touche une pièce dans l'essai d'une boutique de
 * vêtements — dans l'application comme sur la page de la boutique, puisque
 * c'est le même essai. Trois chemins :
 *
 *   · AVEC MES VÊTEMENTS — « Je le vois avec ce que j'ai déjà » : le look avec
 *     mon dressing.
 *   · EN SOLO — « Je l'essaie simplement » : l'essai de toujours, sans rien
 *     changer.
 *
 * ═══ CE QUI ÉTAIT CONFUS, ET CE QUI A CHANGÉ ═══════════════════════════════
 *
 * « Je n'ai encore mis aucun vêtement à moi dans "Ma Maison", et pourtant
 * j'ai l'option, ce qui est confusant. Et aussi l'option "en parler avec mes
 * amis" alors que je n'ai même pas encore essayé le vêtement. »
 *
 *   · DRESSING VIDE : « En solo » passe en tête — c'est le seul geste qui
 *     marche tout de suite — et « Avec mes vêtements » dit pourquoi il
 *     attend : « Votre dressing est vide : photographiez d'abord une pièce que
 *     vous portez. » Le toucher mène à la vignette du dressing vide.
 *   · LES AMIS VIENNENT APRÈS L'ESSAI, plus avant : on ne parle pas d'une
 *     pièce qu'on n'a pas encore vue sur soi. « En parler avec mes amis » est
 *     sur l'écran du résultat. `onAmis` reste accepté, et n'affiche plus rien.
 */

import { useDressing } from "@/lib/direct/dressing-depot";
import { Dessin, DESSINS_DRESSING } from "./dessins-dressing";

export function ChoixEssai({
  piece,
  onDressing,
  onSolo,
  onFermer,
}: {
  piece: { nom: string; photo: string; prix?: string };
  onDressing: () => void;
  onSolo: () => void;
  /** Plus affiché : les amis viennent après l'essai (voir plus haut). */
  onAmis?: () => void;
  onFermer: () => void;
}) {
  /* Le dressing n'est branché que quand ce choix s'ouvre : un essai de
     coiffeur ou de fleuriste n'a pas à aller le chercher. */
  const dressing = useDressing();
  const nbDressing = dressing.pieces.length;
  /** Vide, et on le sait (pas seulement « pas encore lu ») : le dire. */
  const vide = dressing.pret && nbDressing === 0;
  const solo = (
    <button type="button" className={`dr-option${vide ? " une" : ""}`} onClick={onSolo}>
      <i>
        <Dessin d={DESSINS_DRESSING.photo} />
      </i>
      <span>
        <b>En solo</b>
        <em>Je l’essaie sur ma photo</em>
      </span>
      <Dessin d={DESSINS_DRESSING.chevron} />
    </button>
  );
  return (
    <div className="dr-voile" onClick={onFermer}>
      <div className="dr-feuille dr-choix" role="dialog" aria-modal="true" aria-label="Comment voulez-vous l’essayer ?" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dr-rond dr-choix-x" onClick={onFermer} aria-label="Fermer">
          <Dessin d={DESSINS_DRESSING.fermer} />
        </button>
        <div className="dr-choix-tete">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="piece" src={piece.photo} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fant" src="/direct/fantome-humeurs/fantome-pointing.webp" alt="" />
        </div>
        <h3>{piece.nom}</h3>
        <p className="dr-choix-q">Comment voulez-vous l’essayer ?</p>
        {vide && solo}
        <button type="button" className={`dr-option${vide ? " attend" : " une"}`} onClick={onDressing}>
          <i>
            <Dessin d={DESSINS_DRESSING.cintre} />
          </i>
          <span>
            <b>
              Avec mes vêtements{vide && <small className="dr-vide-pastille">Dressing vide</small>}
            </b>
            <em>
              {vide
                ? "Votre dressing est vide : photographiez d’abord une pièce que vous portez, je chercherai ce qui va avec."
                : nbDressing
                  ? `Je le vois avec ce que j’ai déjà · ${nbDressing} pièce${nbDressing > 1 ? "s" : ""} dans mon dressing`
                  : "Je le vois avec ce que j’ai déjà"}
            </em>
          </span>
          <Dessin d={DESSINS_DRESSING.chevron} />
        </button>
        {!vide && solo}
      </div>
    </div>
  );
}
