import { popeyOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/popey-og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Popey — votre site web gratuit + une assistante IA pour votre commerce";

export default function Image() {
  return popeyOgImage("Votre site web gratuit, construit sous vos yeux.");
}
