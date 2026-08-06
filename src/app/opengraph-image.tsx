import { clikmeOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/clikme-og";
import { MARQUE } from "@/lib/marque";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${MARQUE} — votre site web gratuit + une assistante qui répond à vos clients`;

export default function Image() {
  return clikmeOgImage("Votre site web gratuit, construit sous vos yeux.");
}
