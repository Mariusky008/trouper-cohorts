import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHumanAdminExport, toCsv } from "../_lib";

export async function GET() {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });

  const supabaseAdmin = createAdminClient();
  const { data: signals } = await supabaseAdmin
    .from("human_signals")
    .select("id,emitter_member_id,target_member_id,title,detail,signal_strength,status,created_at,updated_at")
    .order("created_at", { ascending: false });

  const csv = toCsv(
    ["id", "emitter_member_id", "target_member_id", "title", "detail", "signal_strength", "status", "created_at", "updated_at"],
    ((signals as Array<Record<string, string | number | null>> | null) || []).map((signal) => [
      signal.id,
      signal.emitter_member_id,
      signal.target_member_id,
      signal.title,
      signal.detail,
      signal.signal_strength,
      signal.status,
      signal.created_at,
      signal.updated_at,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="human-signals-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
