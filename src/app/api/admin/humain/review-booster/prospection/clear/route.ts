import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/actions/review-booster-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const statuts: string[] = Array.isArray(body.statuts) ? body.statuts : ["contacté", "refusé"];

  const supabase = createAdminClient();
  const { error, count } = await supabase
    .from("human_review_prospects")
    .delete({ count: "exact" })
    .in("statut", statuts);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: count ?? 0 });
}
