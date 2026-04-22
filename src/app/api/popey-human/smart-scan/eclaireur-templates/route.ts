import { NextRequest, NextResponse } from "next/server";
import { getEclaireurMessageTemplates } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { contactName?: string; metier?: string | null } | null;
  const contactName = String(body?.contactName || "").trim();
  if (!contactName) {
    return NextResponse.json({ error: "contactName requis." }, { status: 400 });
  }

  const result = await getEclaireurMessageTemplates({ contactName, metier: body?.metier || null });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ templates: result.templates });
}
