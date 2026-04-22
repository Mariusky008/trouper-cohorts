import { NextRequest, NextResponse } from "next/server";
import { getScoutPortalByToken } from "@/lib/actions/human-scouts";
import { createAdminClient } from "@/lib/supabase/admin";

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

  let availableTargets: Array<{ label: string; type: "metier" | "member" }> = [];
  if (data.scout?.owner_member_id) {
    const supabaseAdmin = createAdminClient();
    const { data: ownerMember } = await supabaseAdmin
      .from("human_members")
      .select("first_name,last_name,metier,buddy_name,buddy_metier,trio_name,trio_metier")
      .eq("id", data.scout.owner_member_id)
      .maybeSingle();

    const ownerName = [ownerMember?.first_name, ownerMember?.last_name].filter(Boolean).join(" ").trim();
    const ownerMetier = String(ownerMember?.metier || "").trim();
    const buddyName = String(ownerMember?.buddy_name || "").trim();
    const buddyMetier = String(ownerMember?.buddy_metier || "").trim();
    const trioName = String(ownerMember?.trio_name || "").trim();
    const trioMetier = String(ownerMember?.trio_metier || "").trim();

    const rawTargets = [
      ownerName || null,
      ownerMetier || null,
      buddyName || null,
      buddyMetier || null,
      trioName || null,
      trioMetier || null,
    ].filter(Boolean) as string[];

    const dedup = Array.from(new Set(rawTargets.map((item) => item.trim()).filter(Boolean)));
    availableTargets = dedup.map((label) => ({
      label,
      type: label.includes(" ") ? "member" : "metier",
    }));
  }

  return NextResponse.json({
    error: null,
    scout: data.scout,
    sponsorName: data.sponsorName || null,
    sponsorPhone: data.sponsor?.phone || null,
    availableTargets,
    referrals: data.referrals || [],
    inviteToken: data.invite?.invite_token || null,
    shortCode: data.invite?.short_code || null,
  });
}
