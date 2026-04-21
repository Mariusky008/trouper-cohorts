import { NextRequest, NextResponse } from "next/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanProfileUpdateSchema } from "@/lib/popey-human/smart-scan-validation";
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
  const { data, error } = await supabaseAdmin
    .from("human_members")
    .select("id,first_name,last_name,metier,ville,phone,status")
    .eq("id", member.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    profile: data || null,
  });
}

export async function POST(request: NextRequest) {
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

  const parsed = smartScanProfileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload profil invalide." }, { status: 400 });
  }
  const body = parsed.data;

  const supabaseAdmin = createAdminClient();
  const payload = {
    first_name: String(body.firstName || "").trim() || null,
    last_name: String(body.lastName || "").trim() || null,
    metier: String(body.metier || "").trim() || null,
    ville: String(body.ville || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("human_members")
    .update(payload)
    .eq("id", member.id)
    .select("id,first_name,last_name,metier,ville,phone,status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    profile: data || null,
  });
}
