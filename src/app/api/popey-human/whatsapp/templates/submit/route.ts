import { NextResponse } from "next/server";
import { submitWhatsAppTemplateToMeta } from "@/lib/actions/whatsapp-meta";
import { whatsappTemplateSubmitSchema } from "@/lib/popey-human/whatsapp-meta-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = whatsappTemplateSubmitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Payload template invalide." }, { status: 400 });
  }
  const body = parsed.data;
  const result = await submitWhatsAppTemplateToMeta({
    templateName: body.template_name,
    languageCode: body.language_code,
    category: body.category,
    bodyText: body.body_text,
    variables: body.variables,
    quickReplies: body.quick_replies,
    ownerMemberId: body.owner_member_id,
  });
  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
