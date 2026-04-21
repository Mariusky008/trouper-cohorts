import { NextRequest, NextResponse } from "next/server";
import { logSmartScanExternalClick } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    source?: "linkedin" | "whatsapp_group";
    targetUrl?: string;
    context?: "cockpit" | "profile" | "other";
  };

  if (!body?.source || !body?.targetUrl) {
    return NextResponse.json({ error: "source et targetUrl requis." }, { status: 400 });
  }

  const result = await logSmartScanExternalClick({
    source: body.source,
    targetUrl: body.targetUrl,
    context: body.context || "cockpit",
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
