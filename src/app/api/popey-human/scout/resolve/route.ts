import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: "Missing Supabase credentials" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const rawCode = (searchParams.get("code") || "").trim();
    if (!rawCode) {
      return NextResponse.json({ success: false, error: "Missing code parameter" }, { status: 400 });
    }

    const normalizedCode = normalizeScoutShortCode(rawCode);
    if (!normalizedCode) {
      return NextResponse.json({ success: false, error: "Invalid short code format" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: invite } = await supabase
      .from("human_scout_invites")
      .select("invite_token,expires_at")
      .eq("short_code", normalizedCode)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });
    }

    const expiresAt = new Date(invite.expires_at).getTime();
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
      return NextResponse.json({ success: false, error: "Invitation expired" }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      code: normalizedCode,
      portal_path: `/popey-human/eclaireur/${invite.invite_token}`,
      portal_url: `${searchParams.get("origin") || "https://www.popey.academy"}/popey-human/eclaireur/${invite.invite_token}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}

function normalizeScoutShortCode(value: string) {
  const raw = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 8) return "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

