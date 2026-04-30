import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHumanAdminExport, toCsv } from "@/app/admin/humain/cockpit/export/_lib";

export async function GET(request: Request) {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });

  const url = new URL(request.url);
  const offerStatus = String(url.searchParams.get("offerStatus") || "all");
  const offerActionType = String(url.searchParams.get("offerActionType") || "all");
  const placeCity = String(url.searchParams.get("placeCity") || "all");

  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin
    .from("human_marketplace_offers")
    .select(
      "id,place_id,action_type,full_name,metier,city,whatsapp,message,offer_amount_eur,status,requester_ip,assigned_member_id,processed_at,created_at,place:human_marketplace_places(id,city,metier,status,list_price_eur)",
    )
    .order("created_at", { ascending: false });

  if (offerStatus !== "all") query = query.eq("status", offerStatus);
  if (offerActionType !== "all") query = query.eq("action_type", offerActionType);
  if (placeCity !== "all") query = query.eq("city", placeCity);

  const { data } = await query.limit(5000);
  const rows = (data as Array<Record<string, unknown>> | null) || [];

  const csv = toCsv(
    [
      "offer_id",
      "action_type",
      "status",
      "full_name",
      "metier",
      "city",
      "whatsapp",
      "offer_amount_eur",
      "requester_ip",
      "assigned_member_id",
      "processed_at",
      "created_at",
      "place_id",
      "place_metier",
      "place_city",
      "place_status",
      "place_list_price_eur",
      "message",
    ],
    rows.map((row) => {
      const place = (row.place as Record<string, unknown> | null) || {};
      return [
        row.id as string,
        row.action_type as string,
        row.status as string,
        row.full_name as string,
        (row.metier as string) || "",
        (row.city as string) || "",
        (row.whatsapp as string) || "",
        row.offer_amount_eur as number | null,
        (row.requester_ip as string) || "",
        (row.assigned_member_id as string) || "",
        (row.processed_at as string) || "",
        row.created_at as string,
        (row.place_id as string) || "",
        (place.metier as string) || "",
        (place.city as string) || "",
        (place.status as string) || "",
        (place.list_price_eur as number | null) || null,
        (row.message as string) || "",
      ];
    }),
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="human-marketplace-offers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
