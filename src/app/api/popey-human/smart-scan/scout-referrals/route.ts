import { NextResponse } from "next/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  const member = await ensureHumanMemberForUserId(user.id);
  if (!member) {
    return NextResponse.json({ error: "Profil Popey Human introuvable." }, { status: 404 });
  }

  const supabaseAdmin = createAdminClient();
  const { data: referrals, error } = await supabaseAdmin
    .from("human_scout_referrals")
    .select(
      "id,scout_id,contact_name,contact_phone,project_type,comment,status,rejection_reason,created_at,validated_at,offered_at,converted_at,updated_at",
    )
    .eq("owner_member_id", member.id)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const scoutIds = Array.from(new Set(((referrals || []) as Array<{ scout_id: string | null }>).map((row) => row.scout_id).filter(Boolean))) as string[];
  let scoutNameById = new Map<string, string>();
  if (scoutIds.length > 0) {
    const { data: scouts } = await supabaseAdmin
      .from("human_scouts")
      .select("id,first_name,last_name,email,phone,ville,scout_type")
      .in("id", scoutIds);
    const rows = (scouts || []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      ville: string | null;
      scout_type: "perso" | "pro" | null;
    }>;
    scoutNameById = new Map(
      rows.map((item) => {
        const full = [item.first_name, item.last_name].filter(Boolean).join(" ").trim();
        return [item.id, full || item.email || item.phone || "Eclaireur"];
      }),
    );
    const scoutPhoneById = new Map(rows.map((item) => [item.id, item.phone || null]));
    const scoutVilleById = new Map(rows.map((item) => [item.id, item.ville || null]));
    const scoutTypeById = new Map(rows.map((item) => [item.id, item.scout_type || "perso"]));

    return NextResponse.json({
      referrals: ((referrals || []) as Array<{
        id: string;
        scout_id: string;
        contact_name: string;
        contact_phone: string | null;
        project_type: string | null;
        comment: string | null;
        status: string;
        rejection_reason: string | null;
        created_at: string;
        validated_at: string | null;
        offered_at: string | null;
        converted_at: string | null;
        updated_at: string;
      }>).map((row) => ({
        ...row,
        scout_name: scoutNameById.get(row.scout_id) || null,
        scout_phone: scoutPhoneById.get(row.scout_id) || null,
        scout_ville: scoutVilleById.get(row.scout_id) || null,
        scout_type: scoutTypeById.get(row.scout_id) || "perso",
      })),
    });
  }

  return NextResponse.json({
    referrals: ((referrals || []) as Array<{
      id: string;
      scout_id: string;
      contact_name: string;
      contact_phone: string | null;
      project_type: string | null;
      comment: string | null;
      status: string;
      rejection_reason: string | null;
      created_at: string;
      validated_at: string | null;
      offered_at: string | null;
      converted_at: string | null;
      updated_at: string;
    }>).map((row) => ({
      ...row,
      scout_name: scoutNameById.get(row.scout_id) || null,
      scout_type: "perso",
    })),
  });
}
