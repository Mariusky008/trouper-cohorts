// LA PAGE MONTRÉE AUX HABITANTS — une maquette, pas le produit.
//
// Tout le site s'adresse au commerçant. Celle-ci s'adresse à celui qui marche
// dans la rue, et elle sert à savoir si l'idée lui parle avant qu'on la
// construise. Ce qu'elle met en scène et ce qui n'existe pas sont détaillés en
// tête de `apercu-habitant.tsx` et de `lib/direct/apercu-habitant.ts`.
//
// NOINDEX, ET CE N'EST PAS UN DÉTAIL. Une page qui promet une recherche par
// envie et des alertes, indexée sous le même domaine que l'argumentaire
// commerçant, finirait par être le premier résultat pour « clikme » — et par
// vendre à des commerçants des fonctions qui n'existent pas. Elle se partage
// par un lien, à quelques personnes, et à personne d'autre.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { ApercuHabitant } from "./apercu-habitant";

/**
 * `viewport-fit=cover` — SANS LUI, L'IPHONE LAISSE UNE BANDE.
 *
 * Défaut rapporté sur iPhone 16 Pro Max : « un énorme espace libre » sous
 * l'application. Sans cette valeur, Safari encadre la page à l'intérieur des
 * marges de sécurité et peint ces marges avec le fond du site — beige. Avec
 * elle, la page occupe l'écran d'un bord à l'autre et `env(safe-area-inset-*)`
 * rend enfin de vraies valeurs, dont la mise en page a besoin pour ne pas
 * glisser sous l'encoche ni sous la barre gestuelle.
 *
 * Cet objet REMPLACE celui de `app/layout.tsx` : il faut donc y répéter la
 * largeur et l'échelle, sinon on les perdrait.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // La couleur des barres du système, pour que le noir de l'application ne
  // s'arrête pas net au bord de l'écran.
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Autour de moi — un aperçu de ${MARQUE}` },
  description:
    "Ce qui se passe maintenant à deux cents mètres de vous, et ce que vous pourriez demander. Une idée en test.",
  robots: { index: false, follow: false },
  // SON PROPRE MANIFESTE, sinon « ajouter à l'écran d'accueil » posait l'icône
  // et ouvrait clikme.fr : le manifeste racine porte `start_url: "/"`, et c'est
  // lui que le téléphone suit, pas la page depuis laquelle on installe.
  manifest: "/autour-de-moi/manifest.webmanifest",
  // Sur iPhone, ces deux-là décident du nom sous l'icône et du fait que la
  // barre du navigateur disparaisse. Sans eux, on ouvre un onglet Safari.
  appleWebApp: { capable: true, title: "Autour de moi", statusBarStyle: "black-translucent" },
};

// LA PASTILLE DU BANDEAU NE PORTE PLUS LA VILLE MAIS LE MÉTIER : on y choisit
// la branche qu'on regarde. Et le lien de retour d'avis a disparu de l'écran —
// il ajoutait une sortie hors de l'application dans une maquette qui doit se
// jouer, pas se commenter. Le retour se demande de vive voix, en montrant.
export default function AutourDeMoiPage() {
  return <ApercuHabitant />;
}
