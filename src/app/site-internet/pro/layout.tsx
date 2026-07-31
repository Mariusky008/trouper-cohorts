// L'Espace Pro partage les polices du catalogue : Playfair Display pour les titres,
// Inter pour le texte. Une seule marque, deux surfaces.
//
// Chargées par next/font (servies depuis notre domaine) : l'Espace Pro s'ouvre
// sur un téléphone, souvent en 4G, et une police tierce est une requête
// bloquante de plus au premier affichage.
import { Playfair_Display, Inter } from "next/font/google";
import type { ReactNode } from "react";

const fd = Playfair_Display({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--fd", display: "swap" });
const fb = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--fb", display: "swap" });

export default function ProLayout({ children }: { children: ReactNode }) {
  return <div className={`${fd.variable} ${fb.variable}`}>{children}</div>;
}
