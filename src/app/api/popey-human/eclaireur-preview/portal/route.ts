import { NextRequest, NextResponse } from "next/server";
import { getScoutPortalByToken } from "@/lib/actions/human-scouts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tokenOrCode = String(request.nextUrl.searchParams.get("token") || "").trim();
  if (!tokenOrCode) {
    return NextResponse.json({ error: "Token ou code requis." }, { status: 400 });
  }

  const data = await getScoutPortalByToken(tokenOrCode);
  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }

  return NextResponse.json({
    error: null,
    scout: data.scout,
    sponsorName: data.sponsorName || null,
    referrals: data.referrals || [],
    inviteToken: data.invite?.invite_token || null,
    shortCode: data.invite?.short_code || null,
  });
}
