import { NextResponse } from "next/server";
import { enqueueWhatsAppTemplateMessage } from "@/lib/actions/whatsapp-meta";
import { whatsappSendTemplateSchema } from "@/lib/popey-human/whatsapp-meta-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = whatsappSendTemplateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Payload invalide pour send-template." }, { status: 400 });
  }
  const body = parsed.data;
  const result = await enqueueWhatsAppTemplateMessage({
    phone: body.phone,
    templateName: body.template_name,
    vars: body.vars || [],
    languageCode: body.language_code || "fr",
    source: body.source || "api",
    ownerMemberId: body.owner_member_id,
    metadata: body.metadata || {},
  });
  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
