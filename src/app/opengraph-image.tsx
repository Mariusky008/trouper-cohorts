import { popeyOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/popey-og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Popey — le club des bons plans de ta ville";

export default function Image() {
  return popeyOgImage("Les meilleurs commerces de ta ville, à swiper.");
}
