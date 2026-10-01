// 🎭 L'ATELIER DES POSES DU DOUBLE — générer, regarder, valider.
//
// « Il faudra que tu valides leur rendu avant que je les mette en place. »
// Chaque ligne est une tenue ; chaque colonne une pose nouvelle. On génère une
// proposition, on la regarde à côté de la pose d'origine, et on la valide —
// ou on la refait. Seules les poses validées apparaissent sur les pages.
//
// La garde d'administration est celle du gabarit `/admin` (voir `layout.tsx`).
import { AtelierPoses } from "./atelier";

export const dynamic = "force-dynamic";

export default function PosesDoublePage() {
  return <AtelierPoses />;
}
