// L'ÉCRAN D'ESSAI DE L'INTERVIEW — l'enveloppe et la feuille de style.
//
// NOINDEX : c'est un instrument d'essai, pas une page du produit. Il ouvre la
// caméra, appelle un service payant (la transcription) et n'a rien à faire
// dans un moteur de recherche.
//
// La feuille de style est dans `styles-interview.tsx` : le comptoir du
// restaurant ouvre la même interview.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { EssaiInterview } from "./essai-interview";
import { StylesInterview } from "./styles-interview";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `L'interview du fantôme — ${MARQUE}` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <StylesInterview />
      <EssaiInterview />
    </>
  );
}
