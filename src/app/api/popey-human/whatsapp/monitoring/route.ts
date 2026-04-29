import { NextResponse } from "next/server";
import { getWhatsAppQueueMonitoring } from "@/lib/actions/whatsapp-360dialog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerMemberId = String(searchParams.get("owner_member_id") || "").trim() || undefined;
  const hoursRaw = Number(searchParams.get("hours") || "24");
  const result = await getWhatsAppQueueMonitoring({
    ownerMemberId,
    hours: Number.isFinite(hoursRaw) ? hoursRaw : 24,
  });
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
