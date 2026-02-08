import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Check Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: adminData } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminData) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 2. Fetch Data (Participants + Profiles + Submissions Count)
  // MVP: On fait simple, pas de count SQL complexe, on récupère tout et on map en JS.
  // Pour une grosse app, faire une View ou RPC.

  const membersRes = await supabase
    .from("cohort_members")
    .select(`
      user_id,
      member_role,
      department_code,
      joined_at,
      profiles (
        email,
        display_name,
        trade,
        department_code
      )
    `)
    .eq("cohort_id", id);

  if (membersRes.error) {
    return new NextResponse(membersRes.error.message, { status: 500 });
  }

  const submissionsRes = await supabase
    .from("submissions")
    .select("user_id, status")
    .in(
        "user_id", 
        membersRes.data.map(m => m.user_id)
    );

  // 3. Generate CSV Content
  const header = [
    "User ID",
    "Email",
    "Nom affiché",
    "Métier",
    "Rôle",
    "Département (Officiel)",
    "Département (Souhaité)",
    "Date inscription",
    "Preuves soumises",
    "Preuves validées"
  ].join(",");

  const rows = membersRes.data.map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    
    const userSubs = submissionsRes.data?.filter(s => s.user_id === m.user_id) || [];
    const submittedCount = userSubs.length;
    const validatedCount = userSubs.filter(s => s.status === 'validated').length;

    return [
      m.user_id,
      profile?.email || "",
      `"${(profile?.display_name || "").replace(/"/g, '""')}"`, // Escape quotes
      `"${(profile?.trade || "").replace(/"/g, '""')}"`,
      m.member_role,
      m.department_code || "",
      profile?.department_code || "",
      new Date(m.joined_at).toISOString().split("T")[0],
      submittedCount,
      validatedCount
    ].join(",");
  });

  const csvContent = [header, ...rows].join("\n");

  // 4. Return CSV File
  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cohort-${id}-export.csv"`,
    },
  });
}
