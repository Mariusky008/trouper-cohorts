"use client";

// La barre des quatre onglets. Elle vit dans le layout, donc elle n'est jamais
// démontée : changer d'onglet ne recharge pas la page, la coque reste en place
// et l'historique du navigateur fonctionne.
//
// `usePathname` plutôt qu'un état : c'est l'URL qui dit où l'on est. Un état
// local se désynchroniserait du bouton « retour », et un onglet allumé qui ne
// correspond pas à l'écran affiché est pire que pas d'onglet allumé du tout.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ONGLETS = [
  { seg: "", i: "◉", label: "Le Direct" },
  { seg: "a-saisir", i: "⚡", label: "À saisir" },
  // « MES CLICS » et non « Mes commerces » : ce qu'on vient y chercher, c'est le
  // code à présenter en poussant la porte d'un commerce. Les gardées et les
  // suivis restent dedans, en second.
  { seg: "mes-commerces", i: "♡", label: "Mes Clics" },
  { seg: "moi", i: "◔", label: "Moi" },
] as const;

export function Onglets({ ville }: { ville: string }) {
  const chemin = usePathname() || "";
  const racine = `/ville/${ville}`;
  /**
   * L'ONGLET S'ALLUME AU DOIGT, PAS À L'ARRIVÉE DE LA PAGE.
   *
   * `usePathname` ne change qu'une fois la nouvelle page rendue. Sur des pages
   * serveur dynamiques qui enchaînent une dizaine de lectures, ça fait une à
   * deux secondes pendant lesquelles le doigt a appuyé et RIEN n'a bougé —
   * l'onglet précédent reste allumé, l'écran précédent reste affiché. On
   * appuie une deuxième fois en croyant que c'est bloqué.
   *
   * `vise` est la cible du dernier appui. Il prend la main sur l'URL jusqu'à
   * ce qu'elle le rattrape, et il ne ment jamais longtemps : l'effet plus bas
   * le remet à zéro dès que le chemin correspond.
   */
  const [vise, setVise] = useState<{ seg: string; depuis: string } | null>(null);
  // Le segment courant, quel que soit ce qui suit (une sous-page de Mes
  // commerces doit garder son onglet allumé).
  const reste = chemin.startsWith(racine) ? chemin.slice(racine.length).replace(/^\/+/, "") : "";
  const ici = ONGLETS.find((o) => o.seg && reste.startsWith(o.seg))?.seg ?? "";
  // L'appui ne vaut que TANT QUE L'URL N'A PAS BOUGÉ. On retient donc d'où on
  // partait : à la première mutation du chemin — l'arrivée, mais aussi un
  // retour arrière du navigateur — l'onglet cible est abandonné de lui-même.
  // Écrit avec un effet, ce nettoyage déclenchait un rendu en cascade et
  // pouvait, sur un retour arrière rapide, allumer l'onglet d'où l'on venait.
  const actif = vise && vise.depuis === chemin ? vise.seg : ici;

  // « À saisir » et « les cartes du jour » sont pleins écran et sombres : la
  // barre s'accorde, sinon elle découpe un bandeau blanc au bas d'une image.
  // Les cartes du jour restent sous l'onglet « Le Direct » — c'est bien le fil
  // qu'on est en train de lire, autrement.
  // La couleur de la barre suit la page RÉELLEMENT affichée, pas la cible :
  // basculée à l'appui, elle poserait une barre sombre au bas d'un écran clair
  // pendant tout le chargement.
  const sombre = ici === "a-saisir" || reste.startsWith("menus");

  return (
    <nav className={`nav${sombre ? " dark" : ""}`} aria-label="Navigation principale">
      {ONGLETS.map((o) => (
        <Link
          key={o.seg || "direct"}
          href={o.seg ? `${racine}/${o.seg}` : racine}
          className={actif === o.seg ? (o.seg === ici ? "on" : "on va") : undefined}
          aria-current={ici === o.seg ? "page" : undefined}
          onClick={() => setVise({ seg: o.seg, depuis: chemin })}
          // `prefetch` explicite : sans lui, ces routes dynamiques ne sont
          // jamais préchargées et chaque onglet repart de zéro.
          prefetch
        >
          <span className="i" aria-hidden="true">{o.i}</span>
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
