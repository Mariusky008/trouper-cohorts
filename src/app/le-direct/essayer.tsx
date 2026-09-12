"use client";

// 🪞 LA SECTION 2 DE LA MAQUETTE — on clique un métier, on voit l'exemple.
//
// ═══ D'OÙ ELLE VIENT ═══════════════════════════════════════════════════════
//
// « Oula, c'est beaucoup trop compliqué à comprendre, ça manque de simplicité !
// J'ai fait un mock-up que tu peux répliquer et animer : quand section 2 on
// clique sur un métier on a un exemple animé. »
//
// LA MAQUETTE AVAIT RAISON CONTRE MA PAGE. J'avais écrit six chapitres qui
// démontraient chacun une chose vraie ; il en résultait une page qu'il fallait
// LIRE. Cinq métiers en colonne, un panneau qui change quand on appuie : on
// n'explique plus rien, on donne un objet à manipuler. C'est la même leçon que
// le miroir, appliquée une fois de plus — ce produit ne se raconte pas.
//
// ═══ CE QUE JE PEUX PROUVER, ET CE QUE JE NE PEUX PAS ══════════════════════
//
// UNE SEULE PAIRE AVANT/APRÈS EXISTE VRAIMENT DANS CE DÉPÔT : le salon avec les
// bougies. Le rendu d'un objet POSÉ se calcule dans le téléphone
// (`lib/direct/essai.ts`), sans réseau et sans clé, donc il sort ici ; tout ce
// qui se porte SUR LE CORPS passe par un modèle d'image, et cet environnement
// n'a aucune clé.
//
// ON NE FABRIQUE DONC PAS LES QUATRE AUTRES. Poser la photo de référence d'un
// mannequin sous l'étiquette « après » serait exactement le mensonge que ce
// produit combat depuis le début — et que la page d'accueil doit combattre plus
// que tout le reste, puisque c'est elle qui promet.
//
// LES QUATRE AUTRES MONTRENT DONC CE QU'ON ESSAIE, pas un résultat : la vraie
// pièce du commerçant, en grand, avec son nom et son prix, et une ligne qui dit
// où va le rendu. La mécanique est la même, le panneau s'anime pareil, et le
// jour où les paires arrivent il n'y a que `apres` à renseigner — la garde
// `aVenir` tombe toute seule.

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Miroir, PAIRE_SALON, type PaireMiroir } from "./essai-fantome";

/**
 * UN MÉTIER DE LA COLONNE.
 *
 * `paire` EST LA PREUVE, `piece` EST LA PROMESSE. Quand on a la paire, on
 * montre le miroir — c'est-à-dire la démonstration. Quand on ne l'a pas, on
 * montre la pièce qu'on essaierait, et on le dit.
 */
type Metier = {
  cle: string;
  mot: string;
  /** La vignette de la colonne : toujours une vraie photo du produit. */
  vignette: string;
  /** La paire avant/après, quand elle existe vraiment. */
  paire?: PaireMiroir;
  /** Sinon : la pièce du commerçant, telle qu'elle est dans l'application. */
  piece?: { photo: string; nom: string; prix: string; chez: string; alt: string };
};

const METIERS: Metier[] = [
  {
    cle: "coiffure",
    mot: "Coiffure",
    vignette: "/direct/coiffure1.jpg",
    piece: {
      photo: "/direct/coiffure1.jpg",
      nom: "Boucles longues, frange",
      prix: "68 €",
      chez: "Un salon du centre · 220 m",
      alt: "Une coupe bouclée longue avec frange, vue de face.",
    },
  },
  {
    cle: "ongles",
    mot: "Ongles",
    vignette: "/direct/ongles2.jpeg",
    piece: {
      photo: "/direct/ongles2.jpeg",
      nom: "Pastel amande, motif feuille",
      prix: "48 €",
      chez: "Une prothésiste ongulaire · 340 m",
      alt: "Une pose d’ongles amande en pastel, avec un motif feuille blanc.",
    },
  },
  {
    cle: "vetements",
    mot: "Vêtements",
    vignette: "/direct/mode-chemise-jean.jpg",
    piece: {
      photo: "/direct/mode-chemise-jean.jpg",
      nom: "Chemise en jean",
      prix: "69 €",
      chez: "Une boutique de la rue piétonne · 180 m",
      alt: "Une chemise en jean tenue par une vendeuse.",
    },
  },
  {
    cle: "tatouage",
    mot: "Tatouage",
    vignette: "/direct/tattou2.jpeg",
    piece: {
      photo: "/direct/tattou2.jpeg",
      nom: "Hirondelle et fleurs de cerisier",
      prix: "140 €",
      chez: "Un tatoueur du centre · 480 m",
      alt: "Une planche de flash : une hirondelle et des fleurs de cerisier à l’encre bleue.",
    },
  },
  /**
   * LA DÉCO EST LA DERNIÈRE DE LA COLONNE, ET ELLE EST OUVERTE EN ARRIVANT.
   *
   * C'EST LA SEULE QUI PEUT PROUVER, donc c'est elle qu'on montre d'abord : une
   * section dont le premier écran est une promesse plutôt qu'une démonstration
   * a déjà perdu. On la laisse en bas de la liste parce que c'est le métier le
   * moins attendu — on la découvre après avoir lu les quatre autres.
   */
  {
    cle: "deco",
    mot: "Déco",
    vignette: "/direct/table-salon-bougie.jpg",
    paire: PAIRE_SALON,
  },
];

/** Celui qui est ouvert quand on arrive : le seul qui démontre. Voir ci-dessus. */
const AU_DEPART = "deco";

export function Essayer() {
  const [cle, setCle] = useState(AU_DEPART);
  const m = METIERS.find((x) => x.cle === cle) ?? METIERS[0];

  /**
   * SUR TÉLÉPHONE, LA COLONNE DEVIENT UNE RANGÉE QUI DÉFILE — ET LE MÉTIER
   * OUVERT ÉTAIT DEHORS.
   *
   * DÉFAUT MESURÉ À 390 POINTS : cinq vignettes ne tiennent pas côte à côte, la
   * rangée défile, et « Déco » — qui est le métier ouvert en arrivant, le seul
   * qui démontre — se trouvait coupé au bord droit. On voyait donc le panneau
   * du salon sans voir quel bouton était allumé : la relation entre les deux
   * était invisible, c'est-à-dire que la section ne s'expliquait plus.
   *
   * ON AMÈNE DONC LE BOUTON ACTIF SOUS LES YEUX, à l'arrivée et à chaque
   * changement. `block: "nearest"` empêche la page entière de sauter : on ne
   * veut déplacer que la rangée, pas remonter le visiteur.
   */
  const rangee = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const actif = rangee.current?.querySelector<HTMLElement>("button.on");
    actif?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [cle]);

  return (
    <div className="ld-es">
      {/* ═══ LE PANNEAU, À GAUCHE ═══════════════════════════════════════════
          Il change au clic, et il change EN S'ANIMANT : la clé sur le cadre
          force React à le remonter, donc l'animation d'entrée se rejoue à
          chaque métier. Sans la clé, React réutilise le nœud, l'image se
          remplace d'un coup, et on ne voit rien se produire. */}
      <div className="ld-es-vue" key={m.cle}>
        {m.paire ? (
          <Miroir paire={m.paire} />
        ) : (
          /* PAS DE PAIRE, DONC PAS D'« APRÈS ». On montre la pièce qu'on
             essaierait — la vraie, celle du commerçant — et la ligne dit où va
             le rendu. Mettre cette photo sous une étiquette « après » serait
             exactement le mensonge que ce produit combat. */
          <figure className="ld-es-p">
            <Image
              src={m.piece!.photo}
              alt={m.piece!.alt}
              width={900}
              height={900}
              sizes="(max-width:900px) 90vw, 420px"
              className="ld-es-pi"
            />
            <figcaption>
              <span className="ld-es-chez">{m.piece!.chez}</span>
              <b>{m.piece!.nom}</b>
              <em>{m.piece!.prix}</em>
            </figcaption>
          </figure>
        )}
      </div>

      {/* ═══ LA COLONNE DES MÉTIERS ═════════════════════════════════════════
          DE VRAIS BOUTONS DANS UN GROUPE D'ONGLETS, et pas des div cliquables :
          la flèche du clavier passe de l'un à l'autre, le lecteur d'écran
          annonce « sélectionné », et on n'a rien à écrire pour ça. */}
      <div className="ld-es-l" ref={rangee} role="tablist" aria-label="Ce qu’on peut essayer">
        {METIERS.map((x) => (
          <button
            key={x.cle}
            type="button"
            role="tab"
            aria-selected={x.cle === cle}
            className={x.cle === cle ? "on" : undefined}
            onClick={() => setCle(x.cle)}
          >
            <Image
              src={x.vignette}
              alt=""
              width={160}
              height={200}
              sizes="64px"
              className="ld-es-v"
            />
            <span>{x.mot}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
