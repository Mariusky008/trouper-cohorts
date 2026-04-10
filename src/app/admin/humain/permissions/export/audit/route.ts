import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHumanAdminExport, toCsv } from "../../../cockpit/export/_lib";

const ALLOWED_ACTIONS = new Set([
  "permission_created",
  "permission_updated",
  "permission_deleted",
  "allowed_member_granted",
  "allowed_member_revoked",
  "buddy_assigned",
  "buddy_removed",
]);

function normalizeDate(value: string | null) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}

export async function GET(request: Request) {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });

  const url = new URL(request.url);
  const action = url.searchParams.get("auditAction") || "";
  const memberId = url.searchParams.get("auditMemberId") || "";
  const start = normalizeDate(url.searchParams.get("auditStart"));
  const end = normalizeDate(url.searchParams.get("auditEnd"));
  const sort = url.searchParams.get("auditSort") === "date_asc" ? "date_asc" : "date_desc";

  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin
    .from("human_permissions_audit_log")
    .select("id,member_id,actor_user_id,action,previous_mode,next_mode,note,meta,created_at")
    .order("created_at", { ascending: sort === "date_asc" });

  if (action && ALLOWED_ACTIONS.has(action)) {
    query = query.eq("action", action);
  }
  if (memberId) {
    query = query.eq("member_id", memberId);
  }
  if (start) {
    query = query.gte("created_at", `${start}T00:00:00.000Z`);
  }
  if (end) {
    query = query.lte("created_at", `${end}T23:59:59.999Z`);
  }

  const { data } = await query;
  const rows = (data as Array<Record<string, unknown>> | null) || [];

  const csv = toCsv(
    ["id", "member_id", "actor_user_id", "action", "previous_mode", "next_mode", "note", "meta", "created_at"],
    rows.map((row) => [
      row.id as string | null,
      row.member_id as string | null,
      row.actor_user_id as string | null,
      row.action as string | null,
      row.previous_mode as string | null,
      row.next_mode as string | null,
      row.note as string | null,
      row.meta ? JSON.stringify(row.meta) : null,
      row.created_at as string | null,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="human-permissions-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
