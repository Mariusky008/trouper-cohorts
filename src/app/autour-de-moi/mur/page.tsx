// 👻 LE MUR DU JOUR — la maquette qui doit répondre à UNE question.
//
// « Je ne ferais pas une maquette jolie. Je ferais une maquette qui permet de
// tester une seule chose : est-ce qu'en arrivant sur le mur, en une seconde,
// j'ai envie de regarder le Fantôme suivant et de cliquer sur Ça m'intéresse ? »
//
// TOUT CE QUI SUIT EST SUBORDONNÉ À CETTE PHRASE, et c'est elle qui a décidé de
// la forme : ce n'est pas une liste et ce n'est pas un fil. C'est UN FANTÔME PAR
// ÉCRAN, plein cadre, avec un seul geste sous le pouce. Une grille de vignettes
// se parcourt du regard sans qu'on s'arrête jamais sur personne — et sur ce mur,
// s'arrêter sur quelqu'un EST le produit.
//
// LE CONCEPT, SES QUATRE DÉCISIONS ET CE QU'ELLES COÛTENT sont écrits en tête de
// `lib/direct/fantomes.ts`. Ils ne se relisent pas ici : cette page n'est qu'un
// écran, et un écran ne doit pas être l'endroit où vit une doctrine.
//
// CE QUI N'EXISTE PAS ENCORE, ET QU'IL FAUT SAVOIR EN REGARDANT :
//
//   · LE DÉPÔT PAR ESSAI. Les fantômes d'essai sont montrés une fois POSÉS ; la
//     génération d'image — photographier son poignet, choisir la bague,
//     attendre le rendu — n'est pas branchée. Elle demande un modèle d'image,
//     une facture par essai et quelques secondes d'attente, et rien de tout cela
//     ne se vérifie depuis ici. C'est le seul morceau du concept que cette
//     maquette met en scène sans le prouver.
//   · LA MISE EN RELATION s'ouvre et s'écrit, mais n'envoie rien.
//   · LES PERSONNES SONT INVENTÉES. Les photos montrent ce qu'elles montrent —
//     une assiette, des vinyles, un comptoir — et jamais un visage : voir
//     `public/direct/LISEZ-MOI.md`, et l'en-tête de `fantomes.ts` pour la raison
//     de produit, qui pèse plus lourd que la précaution.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { Mur } from "./mur";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Le mur du jour — ${MARQUE}` },
  description:
    "Ce que les gens ont laissé ici aujourd’hui. Une photo, quelques mots, un lieu, une durée. Une maquette.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Le mur", statusBarStyle: "black-translucent" },
};

export default function MurPage() {
  return <Mur />;
}
