import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHumanAdminExport, toCsv } from "../_lib";

export async function GET(request: Request) {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });

  const parsed = new URL(request.url);
  const rawDays = parsed.searchParams.get("days") || parsed.searchParams.get("smartScanDays") || "14";
  const days = Math.max(1, Math.min(90, Number(rawDays) || 14));
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  since.setUTCHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const supabaseAdmin = createAdminClient();
  const { data: actions, error: actionsError } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select(
      "id,owner_member_id,contact_id,action_type,status,send_channel,message_draft,sent_at,validated_at,followup_due_at,outcome_status,outcome_notes,template_version,ai_prompt_version,ai_generation_source,created_at,updated_at,human_smart_scan_contacts!inner(full_name,city)"
    )
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(100000);
  if (actionsError) return NextResponse.json({ error: actionsError.message }, { status: 400 });

  const actionRows = (actions as Array<Record<string, unknown>> | null) || [];
  const contactIds = Array.from(new Set(actionRows.map((row) => String(row.contact_id || "")).filter(Boolean)));
  const actionIds = actionRows.map((row) => String(row.id || "")).filter(Boolean);

  const qualificationMap = new Map<
    string,
    { heat: string | null; opportunity_choice: string | null; estimated_gain: string | null; community_tags: string[] }
  >();
  if (contactIds.length > 0) {
    const { data: qualifications } = await supabaseAdmin
      .from("human_smart_scan_qualifications")
      .select("contact_id,heat,opportunity_choice,estimated_gain,community_tags,updated_at")
      .in("contact_id", contactIds)
      .order("updated_at", { ascending: false })
      .limit(100000);
    ((qualifications as Array<Record<string, unknown>> | null) || []).forEach((row) => {
      const contactId = String(row.contact_id || "");
      if (!contactId || qualificationMap.has(contactId)) return;
      qualificationMap.set(contactId, {
        heat: (row.heat as string | null) || null,
        opportunity_choice: (row.opportunity_choice as string | null) || null,
        estimated_gain: (row.estimated_gain as string | null) || null,
        community_tags: ((row.community_tags as string[] | null) || []).filter(Boolean),
      });
    });
  }

  const followupCountMap = new Map<string, number>();
  if (actionIds.length > 0) {
    const { data: followupEvents } = await supabaseAdmin
      .from("human_smart_scan_followup_job_events")
      .select("action_id")
      .in("action_id", actionIds)
      .limit(100000);
    ((followupEvents as Array<Record<string, unknown>> | null) || []).forEach((row) => {
      const actionId = String(row.action_id || "");
      if (!actionId) return;
      followupCountMap.set(actionId, (followupCountMap.get(actionId) || 0) + 1);
    });
  }

  const csv = toCsv(
    [
      "action_id",
      "created_at",
      "updated_at",
      "owner_member_id",
      "contact_id",
      "contact_name",
      "contact_city",
      "action_type",
      "status",
      "send_channel",
      "outcome_status",
      "sent_at",
      "validated_at",
      "followup_due_at",
      "followup_events_count",
      "qualification_heat",
      "qualification_opportunity_choice",
      "qualification_estimated_gain",
      "qualification_community_tags",
      "template_version",
      "ai_prompt_version",
      "ai_generation_source",
      "message_draft_length",
      "outcome_notes",
    ],
    actionRows.map((row) => {
      const contact = row.human_smart_scan_contacts as { full_name?: string; city?: string | null } | null;
      const actionId = String(row.id || "");
      const contactId = String(row.contact_id || "");
      const qualification = qualificationMap.get(contactId);
      const messageDraft = String(row.message_draft || "");
      return [
        actionId,
        String(row.created_at || ""),
        String(row.updated_at || ""),
        String(row.owner_member_id || ""),
        contactId,
        contact?.full_name || "",
        contact?.city || "",
        String(row.action_type || ""),
        String(row.status || ""),
        String(row.send_channel || ""),
        String(row.outcome_status || ""),
        String(row.sent_at || ""),
        String(row.validated_at || ""),
        String(row.followup_due_at || ""),
        followupCountMap.get(actionId) || 0,
        qualification?.heat || "",
        qualification?.opportunity_choice || "",
        qualification?.estimated_gain || "",
        (qualification?.community_tags || []).join("|"),
        String(row.template_version || ""),
        String(row.ai_prompt_version || ""),
        String(row.ai_generation_source || ""),
        messageDraft.length,
        String(row.outcome_notes || ""),
      ];
    })
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="human-smart-scan-details-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
