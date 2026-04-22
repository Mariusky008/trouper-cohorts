import { NextRequest, NextResponse } from "next/server";
import { generateScoutLinkFromSmartScanContact } from "@/lib/actions/human-scouts";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { contactId?: string } | null;
  const contactId = String(body?.contactId || "").trim();
  if (!contactId) {
    return NextResponse.json({ error: "contactId requis." }, { status: 400 });
  }

  const result = await generateScoutLinkFromSmartScanContact({ contactId });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const previewBaseUrl = "https://www.popey.academy/popey-human/eclaireur-webapp-preview";
  const previewUrl = result.shortCode
    ? `${previewBaseUrl}?code=${encodeURIComponent(result.shortCode)}`
    : result.inviteToken
      ? `${previewBaseUrl}?token=${encodeURIComponent(result.inviteToken)}`
      : previewBaseUrl;

  return NextResponse.json({
    ...result,
    legacyShortUrl: result.shortUrl,
    legacyFullUrl: result.fullUrl,
    shortUrl: previewUrl,
    fullUrl: previewUrl,
  });
}
