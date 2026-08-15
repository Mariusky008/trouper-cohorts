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
  // Le segment courant, quel que soit ce qui suit (une sous-page de Mes
  // commerces doit garder son onglet allumé).
  const reste = chemin.startsWith(racine) ? chemin.slice(racine.length).replace(/^\/+/, "") : "";
  const actif = ONGLETS.find((o) => o.seg && reste.startsWith(o.seg))?.seg ?? "";

  // L'écran « À saisir » est plein écran et sombre : la barre s'accorde, sinon
  // elle découpe un bandeau blanc au bas d'une image.
  const sombre = actif === "a-saisir";

  return (
    <nav className={`nav${sombre ? " dark" : ""}`} aria-label="Navigation principale">
      {ONGLETS.map((o) => (
        <Link
          key={o.seg || "direct"}
          href={o.seg ? `${racine}/${o.seg}` : racine}
          className={actif === o.seg ? "on" : undefined}
          aria-current={actif === o.seg ? "page" : undefined}
        >
          <span className="i" aria-hidden="true">{o.i}</span>
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
