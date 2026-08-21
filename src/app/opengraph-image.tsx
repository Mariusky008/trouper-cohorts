import { clikmeOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/clikme-og";
import { MARQUE } from "@/lib/marque";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${MARQUE} — votre commerce en direct dans votre ville`;

export default function Image() {
  // LA PHRASE DE L'IMAGE EST CELLE DU PRODUIT D'AUJOURD'HUI.
  // « Votre site web gratuit, construit sous vos yeux » décrivait le produit
  // de l'époque où le site était le sujet. C'est la première chose que voit
  // quelqu'un à qui on envoie le lien dans un WhatsApp : elle promettait un
  // site à des gens à qui on parle d'un fil de ville.
  return clikmeOgImage("Vous le dites. Les habitants autour de vous le savent.");
}
