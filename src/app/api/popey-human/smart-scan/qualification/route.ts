import { NextRequest, NextResponse } from "next/server";
import { saveQualification } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    contactId?: string;
    externalContactRef?: string;
    fullName?: string;
    city?: string | null;
    companyHint?: string | null;
    heat?: "froid" | "tiede" | "brulant";
    opportunityChoice?: "can-buy" | "ideal-client" | "can-refer" | "opens-doors" | "identified-need" | "no-potential" | null;
    communityTags?: string[];
    estimatedGain?: "Faible" | "Moyen" | "Eleve";
  };

  if (!body?.heat || !body?.estimatedGain || !Array.isArray(body.communityTags)) {
    return NextResponse.json({ error: "Payload qualification incomplet." }, { status: 400 });
  }

  const result = await saveQualification({
    contactId: body.contactId,
    externalContactRef: body.externalContactRef,
    fullName: body.fullName,
    city: body.city,
    companyHint: body.companyHint,
    heat: body.heat,
    opportunityChoice: body.opportunityChoice || null,
    communityTags: body.communityTags as Array<
      "serious-work" | "high-budget" | "fast-reply" | "slow-decider" | "hard-close" | "reliable-partner" | "avoid" | "unknown"
    >,
    estimatedGain: body.estimatedGain,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
