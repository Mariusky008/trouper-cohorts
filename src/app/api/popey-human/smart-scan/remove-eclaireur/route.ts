import { NextRequest, NextResponse } from "next/server";
import { removeContactFromEclaireurs } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanPromoteEclaireurSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanPromoteEclaireurSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload suppression eclaireur invalide." }, { status: 400 });
  }

  const result = await removeContactFromEclaireurs(parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
