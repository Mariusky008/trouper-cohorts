// L'APERÇU DE LIEN DE L'APPLICATION — et rien d'autre : ce gabarit ne change
// pas l'affichage, il ne porte que ce que montre un WhatsApp.
//
// SANS LUI, UN LIEN DE L'APPLICATION PARLAIT AUX COMMERÇANTS. Les pages d'ici
// donnent leur titre mais pas leur aperçu ; WhatsApp lisait donc celui de
// `app/layout.tsx` — « votre commerce en direct dans votre ville », « votre site
// est créé gratuitement à partir de votre fiche Google » — sous un lien envoyé
// à un ami pour lui montrer sa ville. Ici, l'aperçu dit ce que dit l'accueil de
// l'application (« Bienvenue sur Clikme ») : ses quatre rubriques, au tutoiement.
// La page d'un commerce le remplace par le nom du commerce : voir
// `boutique/page.tsx`.
import type { Metadata } from "next";
import { MARQUE } from "@/lib/marque";

const TITRE = `${MARQUE} — ta ville, à essayer et à partager`;
const DESCRIPTION =
  "Découvre les commerces autour de toi et essaie avant d’y aller. Vois les essais et les idées des habitants, et parles-en avec tes amis.";

export const metadata: Metadata = {
  openGraph: { title: TITRE, description: DESCRIPTION, siteName: MARQUE, locale: "fr_FR", type: "website" },
  twitter: { card: "summary_large_image", title: TITRE, description: DESCRIPTION },
};

export default function AutourDeMoiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
