import { NextResponse } from "next/server";
import { getWhatsAppInboxEvents } from "@/lib/actions/whatsapp-360dialog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classificationRaw = String(searchParams.get("classification") || "all").trim().toLowerCase();
  const classification =
    classificationRaw === "positive" ||
    classificationRaw === "negative" ||
    classificationRaw === "stop" ||
    classificationRaw === "neutral"
      ? classificationRaw
      : "all";
  const limitRaw = Number(searchParams.get("limit") || "50");
  const result = await getWhatsAppInboxEvents({
    classification,
    limit: Number.isFinite(limitRaw) ? limitRaw : 50,
  });
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
