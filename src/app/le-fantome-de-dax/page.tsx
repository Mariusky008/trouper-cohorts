/**
 * 🖋️ « LE FANTÔME DE DAX » — LE MAGAZINE BD DE CLIKME, NUMÉRO D'ESSAI.
 *
 * Épisode 1 du « gossip du jour » : l'histoire vraie du Splendid, racontée
 * par deux fantômes à sa propre terrasse — une couverture, deux pages. Les
 * décors et les fantômes sont redessinés par le moteur d'images à la première
 * ouverture — voir `api/direct/bd/[id]`.
 *
 * PAGE D'ESSAI : elle ne s'indexe pas, et aucun menu n'y mène.
 */
import type { Metadata } from "next";
import { Magazine } from "./magazine";

export const metadata: Metadata = {
  title: "Le Fantôme de Dax — numéro d'essai",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Magazine />;
}
