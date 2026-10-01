/**
 * 🖋️ « LE FANTÔME DE DAX » — LE MAGAZINE BD DE CLIKME, NUMÉRO D'ESSAI.
 *
 * Une couverture et une planche, « La rencontre du mois » : El Txupinazo et
 * l'onglerie d'en face. Les décors et les fantômes sont redessinés par le
 * moteur d'images à la première ouverture — voir `api/direct/bd/[id]`.
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
