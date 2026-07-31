// L'Espace Pro partage les polices du catalogue : Fraunces pour les titres,
// Instrument Sans pour le texte. Une seule marque, deux surfaces.
//
// Chargées par next/font (servies depuis notre domaine) : l'Espace Pro s'ouvre
// sur un téléphone, souvent en 4G, et une police tierce est une requête
// bloquante de plus au premier affichage.
import { Fraunces, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";

const fd = Fraunces({ subsets: ["latin"], weight: ["400", "600", "700", "900"], variable: "--fd", display: "swap" });
const fb = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--fb", display: "swap" });

export default function ProLayout({ children }: { children: ReactNode }) {
  return <div className={`${fd.variable} ${fb.variable}`}>{children}</div>;
}
