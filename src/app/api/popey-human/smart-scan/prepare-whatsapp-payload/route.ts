import { NextRequest, NextResponse } from "next/server";
import { prepareSmartScanWhatsAppPayload } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    contactId?: string;
    externalContactRef?: string;
    fullName?: string;
    city?: string | null;
    companyHint?: string | null;
    actionType?: "passer" | "eclaireur" | "package" | "exclients";
    messageDraft?: string;
    phoneE164?: string | null;
  };

  if (!body?.actionType || !body?.messageDraft) {
    return NextResponse.json({ error: "actionType et messageDraft requis." }, { status: 400 });
  }

  const result = await prepareSmartScanWhatsAppPayload({
    contactId: body.contactId,
    externalContactRef: body.externalContactRef,
    fullName: body.fullName,
    city: body.city,
    companyHint: body.companyHint,
    actionType: body.actionType,
    messageDraft: body.messageDraft,
    phoneE164: body.phoneE164 || null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
