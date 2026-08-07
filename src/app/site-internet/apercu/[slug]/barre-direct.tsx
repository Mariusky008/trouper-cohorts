// La barre affichée en haut de la boutique quand on arrive depuis Le Direct.
//
// Deux rôles, et le second est le plus important : le retour au fil. Une
// boutique ouverte depuis l'application est un site complet, conçu pour retenir
// — sans chemin de retour explicite, l'habitant doit fermer l'onglet, et il ne
// revient pas dans l'application. C'est la fuite la plus bête possible.
//
// Composant serveur : il n'a aucun état, seul le bouton « Suivre » qu'il reçoit
// en enfant est interactif.
import Link from "next/link";
import type { ReactNode } from "react";

export function BarreDirect({ ville, children }: { ville: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "10px 16px",
        background: "#14201A",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <Link
        href={`/ville/${ville}`}
        prefetch={false}
        style={{ color: "#3FD79A", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}
      >
        ← Le Direct
      </Link>
      <div style={{ marginLeft: "auto" }}>{children}</div>
    </div>
  );
}
