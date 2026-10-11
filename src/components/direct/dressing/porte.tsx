"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/**
 * 🚪 LE DRESSING S'OUVRE PAR-DESSUS TOUT — monté sur `<body>`.
 *
 * Il part de l'essai d'une boutique, qui vit dans des conteneurs transformés
 * (la feuille qui monte, le panneau qui glisse) : un `position: fixed` posé
 * là-dedans se fixerait au conteneur, pas à l'écran. Monté sur le corps de la
 * page, il couvre l'écran entier quel que soit l'endroit d'où on l'ouvre.
 */
export function Porte({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
