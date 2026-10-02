import { COPIES_PRESENTATION } from "@/lib/direct/copies-presentation";
import { HotePhoto } from "./hote-photo";

// 👻 OÙ SE TIENT LE FANTÔME PROPRIÉTAIRE ? — sur la photo ClikMe d'une page.
//
// « J'ai cliqué sur le fantôme et je n'ai vu aucune animation : le fantôme
// propriétaire n'a rien fait. » Il ne bouge que si l'on sait où la photo le
// peint, et ce repérage est confié à un modèle qui peut échouer. Ici on voit
// ce qui s'est passé, on relance le modèle, ou on l'entoure soi-même.
export const dynamic = "force-dynamic";

export default function HotePhotoPage() {
  const raccourcis = COPIES_PRESENTATION.map((c) => ({ slug: c.source, nom: c.carte.nom }));
  return <HotePhoto raccourcis={raccourcis} />;
}
