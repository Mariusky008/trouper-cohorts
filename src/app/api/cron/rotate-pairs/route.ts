import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Use Service Role Key for Cron Jobs to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Récupérer toutes les cohortes actives
  const { data: cohorts, error: cohortError } = await supabase
    .from("cohorts")
    .select("id")
    .neq("status", "archived");

  if (cohortError) {
    console.error("Erreur récupération cohortes:", cohortError);
    return NextResponse.json({ success: false, error: cohortError.message }, { status: 500 });
  }

  if (!cohorts || cohorts.length === 0) {
    return NextResponse.json({ message: "Aucune cohorte active." });
  }

  const results = [];

  // 2. Pour chaque cohorte, lancer la rotation
  for (const cohort of cohorts) {
    const { error } = await supabase.rpc("rotate_daily_pairs", { target_cohort_id: cohort.id });
    if (error) {
        console.error(`Erreur rotation cohorte ${cohort.id}:`, error);
        results.push({ id: cohort.id, status: "error", error: error.message });
    } else {
        results.push({ id: cohort.id, status: "rotated" });
    }
  }

  return NextResponse.json({ success: true, results });
}
