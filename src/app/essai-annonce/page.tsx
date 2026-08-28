// ⚠️ ESSAI — UNE AUTRE FAÇON DE DESSINER L'ANNONCE.
//
// CETTE PAGE NE TOUCHE À RIEN. Elle est posée à côté de `/autour-de-moi`,
// qui continue de vivre sa vie : c'est une maquette de comparaison, faite pour
// être regardée à côté de l'autre et jetée si elle ne vaut pas mieux.
//
// CE QU'ELLE ESSAIE, ET CE QU'ELLE ENLÈVE POUR L'ESSAYER. Le reproche fait à
// l'annonce actuelle est qu'on ne comprend pas le plat en une seconde : le
// nom du commerce est plus gros que le plat, l'adresse, la description, les
// pastilles secondaires et les quatre actions du bas se disputent le regard.
// Ici on ne garde que trois choses au centre — LA NATURE, LE PLAT, LE PRIX —
// et une seule action en bas. Le reste tombe dans un bandeau fin.
//
// LE RISQUE EST NOMMÉ, ET IL EST MESURABLE. Écrire en blanc sur une photo
// sans voile, c'est prendre le risque d'un texte illisible dès que la photo
// est claire à cet endroit — et c'est précisément le défaut qu'on cherche à
// corriger. La page porte donc un interrupteur : « sans voile » (la demande
// telle quelle) et « voile sous le texte » (un dégradé qui n'assombrit que la
// zone du texte, pas la photo). On regarde les deux sur le même plat plutôt
// que d'en discuter.
import type { Metadata } from "next";
import EssaiAnnonce from "./essai-annonce";

export const metadata: Metadata = {
  title: "Essai — l’annonce en une seconde",
  // MAQUETTE : elle ne doit pas être indexée. `noindex` seul, sans `Disallow` —
  // c'est la règle écrite dans robots.ts : interdire l'exploration empêcherait
  // Google de lire l'instruction qui lui ordonne de ne pas indexer.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <EssaiAnnonce />;
}
