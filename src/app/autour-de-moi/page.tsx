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

const WA_DIGITS = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "") || "33768233347";
// Le lien est construit ici, côté serveur, parce que le numéro vient de
// l'environnement.
const CONTACT = `https://wa.me/${WA_DIGITS}?text=${encodeURIComponent(
  "Mon avis sur l'application : ",
)}`;

/** La ville affichée dans le bandeau. Celle où le produit tourne vraiment. */
const VILLE = "Dax";

export default function AutourDeMoiPage() {
  return <ApercuHabitant contact={CONTACT} ville={VILLE} />;
}
