import { NextRequest, NextResponse } from "next/server";
import { logSmartScanAction } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    contactId?: string;
    externalContactRef?: string;
    fullName?: string;
    city?: string | null;
    companyHint?: string | null;
    actionType?: "passer" | "eclaireur" | "package" | "exclients";
    messageDraft?: string | null;
    sendChannel?: "whatsapp" | "other";
    status?: "drafted" | "sent" | "validated_without_send";
  };

  if (!body?.actionType || !body?.status) {
    return NextResponse.json({ error: "actionType et status requis." }, { status: 400 });
  }

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
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
