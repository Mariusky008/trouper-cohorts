import { NextRequest, NextResponse } from "next/server";
import { logSmartScanAction } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanActionSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload action invalide." }, { status: 400 });
  }
  const body = parsed.data;

  const result = await logSmartScanAction({
    contactId: body.contactId,
    externalContactRef: body.externalContactRef,
    fullName: body.fullName,
    city: body.city,
    companyHint: body.companyHint,
    actionType: body.actionType,
    messageDraft: body.messageDraft || null,
    sendChannel: body.sendChannel || "whatsapp",
    status: body.status,
    clientEventId: body.clientEventId || null,
    templateVersion: body.templateVersion || null,
    aiPromptVersion: body.aiPromptVersion || null,
    aiGeneratedAt: body.aiGeneratedAt || null,
    aiGenerationSource: body.aiGenerationSource || null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
