import { NextRequest, NextResponse } from "next/server";
import { generateScoutLinkFromSmartScanContact } from "@/lib/actions/human-scouts";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    contactId?: string;
    externalContactRef?: string;
    fullName?: string;
    city?: string | null;
    phoneE164?: string | null;
  } | null;
  const contactId = String(body?.contactId || "").trim();
  const externalContactRef = String(body?.externalContactRef || "").trim();
  const fullName = String(body?.fullName || "").trim();
  if (!contactId && !externalContactRef && !fullName) {
    return NextResponse.json({ error: "contactId ou externalContactRef requis." }, { status: 400 });
  }

  const result = await generateScoutLinkFromSmartScanContact({
    contactId: contactId || undefined,
    externalContactRef: externalContactRef || undefined,
    fullName: fullName || undefined,
    city: body?.city || null,
    phoneE164: body?.phoneE164 || null,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
