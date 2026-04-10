import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDateRangeFromUrl, requireHumanAdminExport, toCsv } from "../_lib";

export async function GET(request: Request) {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });
  const { start, end } = getDateRangeFromUrl(request.url);

  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin
    .from("human_commissions")
    .select("id,lead_id,signed_amount,commission_amount,payer_member_id,receiver_member_id,payment_status,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (start) query = query.gte("created_at", `${start}T00:00:00.000Z`);
  if (end) query = query.lte("created_at", `${end}T23:59:59.999Z`);
  const { data: commissions } = await query;

  const csv = toCsv(
    [
      "id",
      "lead_id",
      "signed_amount",
      "commission_amount",
      "payer_member_id",
      "receiver_member_id",
      "payment_status",
      "created_at",
      "updated_at",
    ],
    ((commissions as Array<Record<string, string | number | null>> | null) || []).map((commission) => [
      commission.id,
      commission.lead_id,
      commission.signed_amount,
      commission.commission_amount,
      commission.payer_member_id,
      commission.receiver_member_id,
      commission.payment_status,
      commission.created_at,
      commission.updated_at,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="human-commissions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
