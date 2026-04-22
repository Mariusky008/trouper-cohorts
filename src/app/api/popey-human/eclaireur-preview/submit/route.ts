import { NextRequest, NextResponse } from "next/server";
import { getScoutPortalByToken, submitScoutReferralFromToken } from "@/lib/actions/human-scouts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        tokenOrCode?: string;
        contactName?: string;
        contactPhone?: string;
        projectType?: string;
        estimatedDealValue?: string | number | null;
        comment?: string;
      }
    | null;

  const tokenOrCode = String(body?.tokenOrCode || "").trim();
  const contactName = String(body?.contactName || "").trim();
  const contactPhone = String(body?.contactPhone || "").trim();
  const projectType = String(body?.projectType || "").trim();
  const estimatedDealValue = String(body?.estimatedDealValue || "").trim();
  const comment = String(body?.comment || "").trim();

  if (!tokenOrCode) return NextResponse.json({ error: "Token ou code requis." }, { status: 400 });

  const portal = await getScoutPortalByToken(tokenOrCode);
  if (portal.error || !portal.invite?.invite_token) {
    return NextResponse.json({ error: portal.error || "Invitation introuvable." }, { status: 400 });
  }

  const formData = new FormData();
  formData.set("invite_token", portal.invite.invite_token);
  formData.set("contact_name", contactName);
  formData.set("contact_phone", contactPhone);
  if (projectType) formData.set("project_type", projectType);
  if (estimatedDealValue) formData.set("estimated_deal_value", estimatedDealValue);
  if (comment) formData.set("comment", comment);

  const result = await submitScoutReferralFromToken(formData);
  if ("error" in result) {
    return NextResponse.json({ error: result.error || "Envoi impossible." }, { status: 400 });
  }

  return NextResponse.json({ success: true, referralId: result.referralId || null });
}
