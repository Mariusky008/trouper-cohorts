// LA PAGE EST UN COMPOSANT CLIENT : elle ne peut pas exporter de `metadata`.
// Ce calque n'existe que pour porter la consigne d'indexation à sa place.
//
// Il y a une de ces adresses par commerce, toutes bâties sur le même gabarit, et
// on y arrive par un lien qu'un commerçant a envoyé — jamais par une recherche.
// Sans consigne, chacune entrait dans l'index avec le titre et la description de
// la page d'accueil, ce qui les met toutes en concurrence avec elle.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rejoindre ce commerce",
  robots: { index: false, follow: false },
};

export default function RejoindreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
