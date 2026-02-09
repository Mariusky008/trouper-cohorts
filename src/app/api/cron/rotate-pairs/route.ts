import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  // 1. Récupérer toutes les cohortes actives
  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id")
    .neq("status", "archived");

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
