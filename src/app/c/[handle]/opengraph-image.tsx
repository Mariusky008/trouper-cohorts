import { popeyOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/popey-og";
import { lookupSharePlace } from "@/lib/popey-human/place-share";

export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Popey";

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const info = await lookupSharePlace(String(handle || "").trim());
  const cityLabel = info?.cityLabel || "ta ville";
  return popeyOgImage(`Les bons plans de ${cityLabel}`);
}
