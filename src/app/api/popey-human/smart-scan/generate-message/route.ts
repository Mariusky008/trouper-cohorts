import { NextRequest, NextResponse } from "next/server";
import { generateSmartScanMessage } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanGenerateMessageSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanGenerateMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload generation message invalide." }, { status: 400 });
  }
  const body = parsed.data;

  const result = await generateSmartScanMessage({
    contactName: body.contactName,
    actionType: body.actionType,
    trustLevel: body.trustLevel || null,
    opportunityChoice: body.opportunityChoice || null,
    communityTags: body.communityTags || [],
    city: body.city || null,
    companyHint: body.companyHint || null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json(result);
}
