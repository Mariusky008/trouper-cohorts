import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHumanAdminExport, toCsv } from "../_lib";

export async function GET() {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });

  const supabaseAdmin = createAdminClient();
  const { data: cashEvents } = await supabaseAdmin
    .from("human_cash_events")
    .select("id,member_id,source_type,source_id,kind,amount,description,event_date,created_at,updated_at")
    .order("event_date", { ascending: false });

  const csv = toCsv(
    ["id", "member_id", "source_type", "source_id", "kind", "amount", "description", "event_date", "created_at", "updated_at"],
    ((cashEvents as Array<Record<string, string | number | null>> | null) || []).map((event) => [
      event.id,
      event.member_id,
      event.source_type,
      event.source_id,
      event.kind,
      event.amount,
      event.description,
      event.event_date,
      event.created_at,
      event.updated_at,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="human-cash-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
