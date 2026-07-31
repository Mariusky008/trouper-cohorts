// Les polices du catalogue — les mêmes que le catalogue Privilège, qui était
// abouti : Fraunces pour les titres (serif à fort caractère), Instrument Sans
// pour le texte courant.
//
// Chargées par next/font : elles sont servies depuis notre domaine, pas depuis
// Google. Une police tierce sur une page qu'on veut voir installée sur un écran
// d'accueil, c'est une requête bloquante de plus au premier affichage.
import { Fraunces, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";

const fd = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--fd",
  display: "swap",
});

const fb = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fb",
  display: "swap",
});

export default function VilleLayout({ children }: { children: ReactNode }) {
  return <div className={`${fd.variable} ${fb.variable}`}>{children}</div>;
}
