"use client";

/**
 * 🎺 LE PARCOURS SORTIE — ses quatre maquettes, jouées.
 *
 * ═══ CE QUI VIENT D'OÙ ═════════════════════════════════════════════════════
 *
 * RIEN N'EST ÉCRIT ICI DE CE QUE LA DÉMONSTRATION SAIT DÉJÀ. L'événement donne
 * son titre, son heure, son lieu, sa distance, ce qu'il faut savoir avant d'y
 * aller et son itinéraire — voir `evenementsDeLaVille`. Sa soirée donne
 * l'extrait sonore, sa durée, la question posée après l'écoute et les Fantômes
 * déjà présents — voir `soiree.ts`. Les recopier ferait deux vérités.
 *
 * ═══ TROIS ENDROITS OÙ SA MAQUETTE ET NOS DONNÉES NE DISAIENT PAS PAREIL ═══
 *
 * 1. SA MAQUETTE NOMME « LE SPLENDID ». La démonstration n'a pas ce lieu : son
 *    concert est au kiosque du parc, et les commerces de démonstration sont
 *    anonymes par principe. L'écran affiche donc le vrai lieu. Un nom inventé
 *    sur une démonstration qu'on montre à des commerçants est un nom qu'il
 *    faudra démentir.
 *
 * 2. SA MAQUETTE MONTRE TROIS PROFILS AVEC PRÉNOM ET VISAGE — Alice, Karim,
 *    Lila. Le produit, lui, ne montre personne : on est un Fantôme jusqu'à ce
 *    qu'on se rencontre, et c'est sa promesse la plus forte. Les trois cartes
 *    gardent EXACTEMENT sa forme — pastille ronde, nom, ce qu'on cherche — et
 *    sont remplies par les Fantômes de la soirée, qui existent pour de vrai
 *    dans les données. Sa maquette avait raison sur le dessin, pas sur qui.
 *
 * 3. SA MAQUETTE FINIT SUR « VOIR LES RÉSERVATIONS ». Cet événement est
 *    « gratuit, sans réservation » — c'est écrit dans ses infos pratiques. Le
 *    bouton mène donc au geste que le produit propose vraiment : laisser son
 *    Fantôme, ce qui dit qu'on y sera. L'itinéraire, lui, est un vrai lien.
 */

import { useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { FantomeAccueil } from "@/components/direct/fantome-accueil";
import { evenementsDeLaVille, VILLE } from "@/lib/direct/apercu-habitant";
import { motsDe, SOIREES } from "@/lib/direct/soiree";
import { DecouverteSoiree } from "@/components/direct/decouverte-soiree";
import { BoutonCote, CoteCommercant } from "@/components/direct/cote-commercant";
import { SORTIE_ID, TRIO_SORTIE } from "@/lib/direct/parcours-sortie";

export function ParcoursSortie({
  onFermer,
  onCategorie,
  choisirFantome,
}: {
  onFermer: () => void;
  onCategorie?: (cle: string) => void;
  /** « Je compte venir » demande d'abord le fantôme, quand l'application sait le faire choisir. */
  choisirFantome?: (apres: () => void) => void;
}) {
  /* ON LE CITE UNE FOIS POUR QU'IL NE SE PERDE PAS : si un jour un écran de
     ce parcours renvoie vers une autre envie, c'est par là que ça passera. */
  void onCategorie;
  const [etape, setEtape] = useState(1);
  /** Le panneau de l'organisateur, ouvert par la pastille. */
  const [cote, setCote] = useState(false);

  const evt = evenementsDeLaVille().find((e) => e.id === SORTIE_ID);
  const soiree = SOIREES[SORTIE_ID];
  if (!evt || !soiree) return null;

  const laMusique = evt.lignes?.[0] ?? evt.quoi;
  const precedent = () => (etape === 1 ? onFermer() : cote ? setCote(false) : setEtape(1));

  return (
    <div className={`ps ps-e${etape}`}>
      <div
        className="ps-fond"
        style={{ backgroundImage: `url("${TRIO_SORTIE}")` }}
        aria-hidden="true"
      />
      <div className="ps-voile" aria-hidden="true" />

      {/* ═══ LA COQUE, IDENTIQUE AUX QUATRE ÉTAPES ═══════════════════════ */}
      <header className="ps-haut" aria-label={`Étape ${etape} sur 2`}>
        {etape > 1 && (
          <button type="button" className="ps-retour" onClick={precedent} aria-label="L’étape précédente">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.4 5.4 7.8 12l6.6 6.6" />
            </svg>
          </button>
        )}
        {/* LE VRAI LOGO, PAS UN MOT EN GRAS. « Clikme » n'a pas de k :
            il a un curseur a sa place, et c'est tout le nom — on clique,
            et c'est moi. Ecrit au clavier, le mot perdait la seule chose
            qui en fait une marque. Le curseur est un trace, donc il suit
            la taille et la couleur de la ligne. Voir `mot-marque.tsx`. */}
        <p className="ps-logo">
          <MotMarque />
        </p>
        {/* ═══ PLUS DE BARRE DE PROGRESSION ═══════════════════════════════
            « Supprimer les barres de progression partout où il y en a. »
            ELLE ETAIT ENCORE LA, ET C'ETAIT UN OUBLI : les quatre autres
            parcours l'ont perdue, celui-ci l'avait gardée. Quatre traits et
            « 3/4 » disent combien d'écrans restent — une information de
            formulaire administratif, posée sur la seule ligne qui porte le logo
            et la porte de sortie. Sur quatre écrans qu'on traverse en glissant,
            l'effort n'est pas assez grand pour qu'on ait besoin de le mesurer.
            LE COMPTE RESTE POUR LES LECTEURS D'ECRAN, sur l'en-tête : eux ne
            voient pas qu'il ne reste qu'un écran. */}
        {/* LE FANTÔME RAMÈNE À L'ACCUEIL, comme sur les quatre autres
            parcours. Voir `fantome-accueil.tsx` : un composant, une place, un
            geste — chaque écran avait sa version, donc celui qu'on n'avait pas
            encore regardé n'avait rien. */}
        <FantomeAccueil onClick={onFermer} classe="ps-f" />
      </header>

      {/* LA PASTILLE DE LA SOIRÉE : elle dit où l'on est, aux quatre étapes,
          et elle porte la porte de sortie — même règle que la coiffure. */}
      <div className="ps-lieu">
        <span className="ps-lieu-v" style={{ backgroundImage: `url("${TRIO_SORTIE}")` }} />
        <span className="ps-lieu-t">
          {/* ═══ LA PASTILLE DIT OU, PAS LE NOM DU LIEU ══════════════════════
              MESURE A L'ECRAN : « Kiosque du parc Théodore-Denis · 450 m »
              passait SOUS le bouton maison, sur les quatre etapes. Et sur la
              premiere, il etait deja ecrit deux cents points plus bas — la
              meme information deux fois, ce qui est l'autre defaut.
              LE NOM DU LIEU VIT DONC EN BAS, ou il a de la place, et la
              pastille garde ce qui tient toujours : a quelle distance, dans
              quelle ville. */}
          <b>{evt.quoi}</b>
          <em>
            <i aria-hidden="true">📍</i>
            {evt.distance} · {VILLE}
          </em>
        </span>
      </div>

      {/* ──────────────────────── 1/4 · L'AFFICHE ───────────────────────── */}
      {etape === 1 && (
        <section className="ps-bas">
          <h1 className="ps-t">
            Ce soir,
            <br />
            <em>ça joue ici.</em>
            <s aria-hidden="true" />
          </h1>
          {/* LES DEUX LIGNES DE SA MAQUETTE : ce qu'on joue, et où. Elles
              viennent de l'événement — le titre de sa première ligne est bien
              « Trio de jazz landais », personne ne l'a écrit ici. */}
          {/* ═══ UN SEUL ELEMENT DE TEXTE PAR LIGNE, ET C'EST OBLIGATOIRE ════
              La ligne est une grille « puce + texte ». Or une grille fait de
              CHAQUE enfant une cellule, y compris des bouts de texte nus :
              « · 19 h » posé à côté du gras partait dans la cellule suivante,
              c'est-à-dire à la ligne, un mot par rangée. Vu à l'écran. Tout le
              texte tient donc dans un seul span. */}
          <ul className="ps-quoi">
            <li>
              <i aria-hidden="true">♪</i>
              <span>
                <b>{laMusique}</b> · {evt.heure}
              </span>
            </li>
            <li>
              <i aria-hidden="true">📍</i>
              <span>
                <b>{evt.lieu}</b> · {evt.distance}
              </span>
            </li>
          </ul>
          <p className="ps-dit">Entrez dans l’ambiance avant de sortir.</p>
          {/* « DÉCOUVRIR », COMME DANS L'APPLICATION : la suite est la même
              découverte en trois onglets — l'ambiance (l'extrait part tout
              seul), qui vient, la discussion. */}
          <button type="button" className="ps-go" onClick={() => setEtape(2)}>
            {motsDe(soiree).geste}
            <s aria-hidden="true">→</s>
          </button>
          {/* ═══ PLUS DE RACCOURCI « VOIR LA SOIREE » ══════════════════
              « Je ne vois cet écran que lorsque je reviens en arrière,
              autrement je ne le vois pas. Il faut qu'il soit à l'étape après
              avoir écouté la musique, pour voir qui y sera et ce qu'ils
              disent. »
              C'EST CE BOUTON QUI LE CACHAIT. Il sautait directement à la
              dernière étape, donc par-dessus le Live — et il était posé juste
              sous le bouton principal, aux deux premières étapes. On pouvait
              faire le parcours entier sans jamais voir l'écran qui porte tout
              ce que le produit sait faire, puis le découvrir par hasard en
              appuyant sur la flèche de retour. C'est exactement ce qui lui est
              arrivé.
              UN PARCOURS DE QUATRE ECRANS N'A PAS BESOIN D'UN RACCOURCI. Il se
              traverse en trois appuis ; celui qui veut les informations
              pratiques y est dans cinq secondes. Le raccourci ne faisait
              gagner que le temps de ce qu'on est venu montrer. */}
        </section>
      )}


      {/* ──────────────── 2/2 · LA DÉCOUVERTE — la même que dans l'application ──────────────── */}
      {etape === 2 && !cote && (
        <section className="ps-dec">
          {/* LE CADRE NE DÉFILE PAS, SON CONTENU SI : la feuille « Tu viens pour… » se pose sur le cadre. */}
          <div className="ps-dec-d">
            <DecouverteSoiree soiree={soiree} ville={VILLE} itineraire={evt.itineraire} choisirFantome={choisirFantome} />
            {/* ET ON PASSE DE SON CÔTÉ — voir `cote-commercant.tsx`. */}
            <div className="ps-dec-cote">
              <BoutonCote commerce={SORTIE_ID} branche="sortie" onClick={() => setCote(true)} />
            </div>
          </div>
        </section>
      )}
      {/* LE PANNEAU PREND TOUTE LA PLACE : on est passé côté organisateur, donc
          on ne voit plus le bouton de l'habitant. Même correction qu'au salon. */}
      {etape === 2 && cote && (
        <section className="ps-bas">
          <CoteCommercant
            commerce={SORTIE_ID}
            branche="sortie"
            quoi={evt.quoi}
            nom={evt.lieu}
            visuel={soiree.photo ?? evt.photo}
            onRetour={() => setCote(false)}
            motRetour="Revenir côté habitant"
            avant="au"
          />
        </section>
      )}
    </div>
  );
}
