import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const applicationId = url.searchParams.get("applicationId") || "";

  if (!applicationId) {
    return NextResponse.json({ error: "Candidature introuvable." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const { data: application, error } = await supabaseAdmin
    .from("commando_applications")
    .select("id, status, qualification_status")
    .eq("id", applicationId)
    .single();

  if (error || !application) {
    return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    applicationId: application.id,
    status: application.status,
    qualificationStatus: application.qualification_status,
    canPayNow: application.qualification_status === "qualified",
  });
}
