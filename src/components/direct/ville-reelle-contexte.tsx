"use client";

// 🏙️ L'APPLICATION SAIT-ELLE QU'ELLE EST DANS UNE VRAIE VILLE ?
//
// Posé par `/ville/<ville>` autour de l'application (`apercu-habitant.tsx`),
// absent sur `/autour-de-moi`. Les commerces eux-mêmes passent par
// `source-ville.ts` ; ce contexte ne porte que ce que l'écran doit savoir en
// plus — le nom de la ville — et le fait même d'y être.
import { createContext, useContext } from "react";

export type VilleReelleInfo = { slug: string; nom: string };

export const VilleReelleContexte = createContext<VilleReelleInfo | null>(null);

/** `null` : la démonstration. Sinon, la ville où l'on est. */
export function useVilleReelle(): VilleReelleInfo | null {
  return useContext(VilleReelleContexte);
}
