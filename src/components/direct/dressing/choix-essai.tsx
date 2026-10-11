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
 *   · INVITER DES AMIS — « Je crée un salon pour en discuter » : seulement là
 *     où il y a des salons.
 */

import { useDressing } from "@/lib/direct/dressing-depot";
import { Dessin, DESSINS_DRESSING } from "./dessins-dressing";

export function ChoixEssai({
  piece,
  onDressing,
  onSolo,
  onAmis,
  onFermer,
}: {
  piece: { nom: string; photo: string; prix?: string };
  onDressing: () => void;
  onSolo: () => void;
  onAmis?: () => void;
  onFermer: () => void;
}) {
  /* Le dressing n'est branché que quand ce choix s'ouvre : un essai de
     coiffeur ou de fleuriste n'a pas à aller le chercher. */
  const nbDressing = useDressing().pieces.length;
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
        <button type="button" className="dr-option une" onClick={onDressing}>
          <i>
            <Dessin d={DESSINS_DRESSING.cintre} />
          </i>
          <span>
            <b>Avec mes vêtements</b>
            <em>{nbDressing ? `Je le vois avec ce que j’ai déjà · ${nbDressing} pièce${nbDressing > 1 ? "s" : ""}` : "Je le vois avec ce que j’ai déjà"}</em>
          </span>
          <Dessin d={DESSINS_DRESSING.chevron} />
        </button>
        <button type="button" className="dr-option" onClick={onSolo}>
          <i>
            <Dessin d={DESSINS_DRESSING.photo} />
          </i>
          <span>
            <b>En solo</b>
            <em>Je l’essaie simplement</em>
          </span>
          <Dessin d={DESSINS_DRESSING.chevron} />
        </button>
        {onAmis && (
          <button type="button" className="dr-option" onClick={onAmis}>
            <i>
              <Dessin d={DESSINS_DRESSING.partager} />
            </i>
            <span>
              <b>Inviter des amis</b>
              <em>Je crée un salon pour en discuter</em>
            </span>
            <Dessin d={DESSINS_DRESSING.chevron} />
          </button>
        )}
      </div>
    </div>
  );
}
