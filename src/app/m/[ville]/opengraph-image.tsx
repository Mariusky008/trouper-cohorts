import { popeyOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/popey-og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Popey";

export default async function Image({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const slug = String(ville || "dax").trim().toLowerCase() || "dax";
  const cityLabel = slug.charAt(0).toUpperCase() + slug.slice(1);
  return popeyOgImage(`Les bons plans de ${cityLabel}`);
}
