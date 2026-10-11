"use client";

/**
 * 👔 CE QUI N'A DE SENS QU'AVEC DES VÊTEMENTS DANS LE DRESSING.
 *
 * « Avec mes vêtements », sur l'écran du résultat d'un essai : la pièce est
 * déjà essayée, et le dressing est vide — le bouton ne mène qu'à « ajoutez
 * d'abord une pièce ». Il attend donc qu'il y ait de quoi composer. Le
 * dressing n'est lu qu'ici, au moment où l'écran s'ouvre : un essai de
 * coiffeur n'a pas à aller le chercher.
 */

import type { ReactNode } from "react";
import { useDressing } from "@/lib/direct/dressing-depot";

export function SiDressingRempli({ children }: { children: ReactNode }) {
  const e = useDressing();
  return e.pret && e.pieces.length > 0 ? <>{children}</> : null;
}
