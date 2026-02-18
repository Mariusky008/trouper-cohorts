import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // On récupère d'abord le cohort_id du user
  const membershipRes = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membershipRes.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classement</CardTitle>
          <CardDescription>Tu ne fais partie d'aucune cohorte.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // MVP: On compte juste le nombre de preuves 'validated' ou 'submitted' par user
  // Idéalement, faire une RPC ou une View pour ça, mais en MVP on fait 2 requêtes
  const membersRes = await supabase
    .from("cohort_members")
    .select(`
      user_id,
      profiles (
        display_name,
        department_code
      )
    `)
    .eq("cohort_id", membershipRes.data.cohort_id);

  const submissionsRes = await supabase
    .from("submissions")
    .select("user_id")
    .in(
      "user_id",
      membersRes.data?.map((m) => m.user_id) || []
    );

  // Agrégation JS (MVP style)
  const scores = (membersRes.data || []).map((m) => {
    const count = (submissionsRes.data || []).filter((s) => s.user_id === m.user_id).length;
    return {
      userId: m.user_id,
      // @ts-expect-error: supabase typing join array vs single
      displayName: Array.isArray(m.profiles) ? m.profiles[0]?.display_name : m.profiles?.display_name,
      // @ts-expect-error: supabase typing join array vs single
      dept: Array.isArray(m.profiles) ? m.profiles[0]?.department_code : m.profiles?.department_code,
      score: count,
    };
  });

  // Tri par score décroissant
  scores.sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Classement</CardTitle>
          <CardDescription>Top des participants les plus assidus.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scores.map((p, i) => (
              <div
                key={p.userId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  p.userId === user.id ? "bg-muted border-primary/50" : "bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="font-mono text-lg font-bold w-6 text-center text-muted-foreground">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-medium">
                      {p.displayName || "Anonyme"} {p.userId === user.id && "(Toi)"}
                    </div>
                    {p.dept && <div className="text-xs text-muted-foreground">Dép. {p.dept}</div>}
                  </div>
                </div>
                <div className="font-bold text-xl">{p.score} pts</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
