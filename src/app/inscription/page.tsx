import type { Metadata } from "next";
import { Inscription } from "./inscription";

// 📝 CLIKME.FR/INSCRIPTION — la page d'inscription pour tout le monde : commerçants, artisans, entrepreneurs, dans
// une ville ouverte ou pas. `/commercants` (et l'accueil) reste la page des commerçants de Dax, pour le démarchage.
// Voir `inscription.tsx` ; les villes ouvertes, `lib/direct/villes-ouvertes.ts`.
export const metadata: Metadata = {
  title: "Créer ma page — ClikMe",
  description:
    "Commerçants, artisans, entrepreneurs : votre page ClikMe, une belle vidéo faite avec vos photos, et votre fantôme qui fait connaissance avec chacun de ceux qui l'ont vue. Gratuit, en une minute, partout en France.",
};

export default function PageInscription() {
  return <Inscription />;
}
