import { NextRequest, NextResponse } from "next/server";
import { pollAllianceB2BAsyncSearch, searchAllianceProspects, startAllianceB2BAsyncSearch } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanAllianceSearchSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";
export const maxDuration = 240;

export async function GET(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const searchRunId = String(searchParams.get("runId") || "").trim();
  if (!searchRunId) {
    return NextResponse.json({ error: "runId requis." }, { status: 400 });
  }
  const result = await pollAllianceB2BAsyncSearch({ searchRunId });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanAllianceSearchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload recherche alliances invalide." }, { status: 400 });
  }

  const body = parsed.data;
  if (body.provider === "b2b") {
    const started = await startAllianceB2BAsyncSearch({
      city: body.city,
      sourceMetier: body.sourceMetier || null,
      targetMetiers: body.targetMetiers || [],
      radiusKm: body.radiusKm,
      limit: body.limit,
    });
    if ("error" in started) {
      return NextResponse.json({ error: started.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, status: "running", runId: started.searchRunId });
  }
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
  return NextResponse.json({ success: true, status: "completed", prospects: result.prospects });
}
