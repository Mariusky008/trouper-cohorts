// Les polices du catalogue — celles de l'app v3 (public/popey-app-v3.html), qui
// est LA référence de design du produit : Playfair Display pour les noms de
// commerce sur les cartes, Inter pour tout le reste.
//
// Chargées par next/font : servies depuis notre domaine, pas depuis Google. Une
// police tierce sur une page qu'on veut voir installée sur un écran d'accueil,
// c'est une requête bloquante de plus au premier affichage.
import { Playfair_Display, Inter } from "next/font/google";
import type { ReactNode } from "react";

const fd = Playfair_Display({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--fd", display: "swap" });
const fb = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--fb", display: "swap" });

export default function VilleLayout({ children }: { children: ReactNode }) {
  return <div className={`${fd.variable} ${fb.variable}`}>{children}</div>;
}
