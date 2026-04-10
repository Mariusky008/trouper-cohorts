import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHumanAdminExport, toCsv } from "../_lib";

export async function GET() {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });

  const supabaseAdmin = createAdminClient();
  const { data: leads } = await supabaseAdmin
    .from("human_leads")
    .select("id,owner_member_id,source_member_id,client_name,budget,besoin,phone,adresse,notes,status,opened_at,created_at,updated_at")
    .order("created_at", { ascending: false });

  const csv = toCsv(
    [
      "id",
      "owner_member_id",
      "source_member_id",
      "client_name",
      "budget",
      "besoin",
      "phone",
      "adresse",
      "notes",
      "status",
      "opened_at",
      "created_at",
      "updated_at",
    ],
    ((leads as Array<Record<string, string | number | null>> | null) || []).map((lead) => [
      lead.id,
      lead.owner_member_id,
      lead.source_member_id,
      lead.client_name,
      lead.budget,
      lead.besoin,
      lead.phone,
      lead.adresse,
      lead.notes,
      lead.status,
      lead.opened_at,
      lead.created_at,
      lead.updated_at,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="human-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
