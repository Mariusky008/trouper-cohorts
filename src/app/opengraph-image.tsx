import { clikmeOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/clikme-og";
import { MARQUE } from "@/lib/marque";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${MARQUE} — ta ville, à essayer et à partager`;

export default function Image() {
  // LA PHRASE DE L'IMAGE EST CELLE DE L'ACCUEIL DE L'APPLICATION, « Ta ville,
  // à essayer et à partager. » — la même pour toutes les pages, puisque c'est
  // l'image de la marque. Ce que chaque page a de propre (le commerçant, la
  // ville, l'application) passe par son titre et sa description.
  return clikmeOgImage();
}
