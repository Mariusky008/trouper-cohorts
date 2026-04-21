import { NextRequest, NextResponse } from "next/server";
import { saveQualification } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanQualificationSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanQualificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload qualification invalide." }, { status: 400 });
  }
  const body = parsed.data;

  const result = await saveQualification({
    contactId: body.contactId,
    externalContactRef: body.externalContactRef,
    fullName: body.fullName,
    city: body.city,
    companyHint: body.companyHint,
    heat: body.heat,
    opportunityChoice: body.opportunityChoice || null,
    communityTags: body.communityTags,
    estimatedGain: body.estimatedGain,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
