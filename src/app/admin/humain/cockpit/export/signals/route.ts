import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDateRangeFromUrl, requireHumanAdminExport, toCsv } from "../_lib";

export async function GET(request: Request) {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });
  const { start, end } = getDateRangeFromUrl(request.url);

  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin
    .from("human_signals")
    .select("id,emitter_member_id,target_member_id,title,detail,signal_strength,status,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (start) query = query.gte("created_at", `${start}T00:00:00.000Z`);
  if (end) query = query.lte("created_at", `${end}T23:59:59.999Z`);
  const { data: signals } = await query;

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
