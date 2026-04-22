import { NextResponse } from "next/server";
import { getMySelfScoutPortalLink } from "@/lib/actions/human-scouts";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const data = await getMySelfScoutPortalLink();
  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }

  const shortUrl = data.shortCode ? `https://www.popey.academy/popey-human/eclaireur?code=${data.shortCode}` : null;
  const fullUrl = data.inviteToken ? `https://www.popey.academy/popey-human/eclaireur/${data.inviteToken}` : null;
  const previewUrl = data.shortCode
    ? `https://www.popey.academy/popey-human/eclaireur-webapp-preview?code=${encodeURIComponent(data.shortCode)}`
    : data.inviteToken
      ? `https://www.popey.academy/popey-human/eclaireur-webapp-preview?token=${encodeURIComponent(data.inviteToken)}`
      : "https://www.popey.academy/popey-human/eclaireur-webapp-preview";

  return NextResponse.json({
    shortCode: data.shortCode || null,
    shortUrl: previewUrl,
    inviteToken: data.inviteToken || null,
    fullUrl: previewUrl,
    previewUrl,
    legacyShortUrl: shortUrl,
    legacyFullUrl: fullUrl,
  });
}
