import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_SECTOR_ID = "other_custom";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  const rawSector = request.nextUrl.searchParams.get("sector");
  const sectorId = String(rawSector || "").trim().toLowerCase();

  const { data: sectors, error: listError } = await supabase
    .from("sector_vocabulary")
    .select("sector_id,label,pipeline_steps,is_active")
    .eq("is_active", true)
    .order("label", { ascending: true });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 400 });
  }

  if (!sectorId) {
    return NextResponse.json({
      sectors: sectors || [],
      defaultSectorId: DEFAULT_SECTOR_ID,
    });
  }

  const { data: selected, error: selectedError } = await supabase
    .from("sector_vocabulary")
    .select("sector_id,label,pipeline_steps,terms,message_templates,is_active")
    .eq("sector_id", sectorId)
    .eq("is_active", true)
    .maybeSingle();

  if (selectedError) {
    return NextResponse.json({ error: selectedError.message }, { status: 400 });
  }

  if (selected) {
    return NextResponse.json({
      sector: selected,
      sectors: sectors || [],
      fallbackUsed: false,
      defaultSectorId: DEFAULT_SECTOR_ID,
    });
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from("sector_vocabulary")
    .select("sector_id,label,pipeline_steps,terms,message_templates,is_active")
    .eq("sector_id", DEFAULT_SECTOR_ID)
    .eq("is_active", true)
    .maybeSingle();

  if (fallbackError) {
    return NextResponse.json({ error: fallbackError.message }, { status: 400 });
  }

  return NextResponse.json({
    sector: fallback || null,
    sectors: sectors || [],
    fallbackUsed: true,
    requestedSectorId: sectorId,
    defaultSectorId: DEFAULT_SECTOR_ID,
  });
}
