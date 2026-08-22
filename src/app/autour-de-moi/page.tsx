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
import type { Metadata } from "next";
import { MARQUE } from "@/lib/marque";
import { ApercuHabitant } from "./apercu-habitant";

export const metadata: Metadata = {
  title: { absolute: `Autour de moi — un aperçu de ${MARQUE}` },
  description:
    "Ce qui se passe maintenant à deux cents mètres de vous, et ce que vous pourriez demander. Une idée en test.",
  robots: { index: false, follow: false },
};

// LA PASTILLE DU BANDEAU NE PORTE PLUS LA VILLE MAIS LE MÉTIER : on y choisit
// la branche qu'on regarde. Et le lien de retour d'avis a disparu de l'écran —
// il ajoutait une sortie hors de l'application dans une maquette qui doit se
// jouer, pas se commenter. Le retour se demande de vive voix, en montrant.
export default function AutourDeMoiPage() {
  return <ApercuHabitant />;
}
