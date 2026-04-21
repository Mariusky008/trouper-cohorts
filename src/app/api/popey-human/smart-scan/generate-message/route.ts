import { NextRequest, NextResponse } from "next/server";
import { generateSmartScanMessage } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    contactName?: string;
    actionType?: "passer" | "eclaireur" | "package" | "exclients";
    trustLevel?: "family" | "pro-close" | "acquaintance" | null;
    opportunityChoice?: "can-buy" | "ideal-client" | "can-refer" | "opens-doors" | "identified-need" | "no-potential" | null;
    communityTags?: string[];
    city?: string | null;
    companyHint?: string | null;
  };

  if (!body?.contactName || !body?.actionType) {
    return NextResponse.json({ error: "contactName et actionType requis." }, { status: 400 });
  }

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
