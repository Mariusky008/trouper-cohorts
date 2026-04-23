import { NextRequest, NextResponse } from "next/server";
import { searchAllianceProspects } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanAllianceSearchSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanAllianceSearchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload recherche alliances invalide." }, { status: 400 });
  }

  const body = parsed.data;
  const result = await searchAllianceProspects({
    provider: body.provider,
    city: body.city,
    sourceMetier: body.sourceMetier || null,
    targetMetiers: body.targetMetiers || [],
    radiusKm: body.radiusKm,
    limit: body.limit,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ prospects: result.prospects });
}
