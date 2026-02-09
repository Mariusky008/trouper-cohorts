import { createClient } from "@/lib/supabase/server";
import { DailyPairsList } from "@/components/admin/daily-pairs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminCohortDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Infos Cohorte
  const { data: cohort } = await supabase
    .from("cohorts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!cohort) return <div>Cohorte introuvable</div>;

  // 2. Membres
  const { data: members } = await supabase
    .from("cohort_members")
    .select("count")
    .eq("cohort_id", params.id)
    .single();

  // 3. Paires du jour
  const { data: rawPairs } = await supabase
    .from("cohort_pairs")
    .select("*")
    .eq("cohort_id", params.id)
    .eq("pair_date", today);

  // 4. Infos Utilisateurs pour les paires
  const userIds = rawPairs?.flatMap(p => [p.user1_id, p.user2_id]) || [];
  let pairsWithDetails = [];
  
  if (userIds.length > 0) {
      const { data: usersInfo } = await supabase
        .from("pre_registrations")
        .select("user_id, first_name, last_name, trade")
        .in("user_id", userIds);
      
      pairsWithDetails = rawPairs?.map(p => ({
        ...p,
        user1_details: usersInfo?.find(u => u.user_id === p.user1_id),
        user2_details: usersInfo?.find(u => u.user_id === p.user2_id),
      })) || [];
  }

  return (
    <div className="space-y-8">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/cohorts"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    {cohort.title}
                    <Badge variant={cohort.status === "active" ? "default" : "secondary"}>{cohort.status}</Badge>
                    <span className="text-red-500 text-xs">VERSION TEST BINOMES</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                    {members?.count || 0} membres • Début: {new Date(cohort.start_date).toLocaleDateString()}
                </p>
            </div>
        </div>

        {/* Gestion des Binômes */}
        <section>
            <DailyPairsList cohortId={cohort.id} pairs={pairsWithDetails} />
        </section>

        {/* Liste des membres (placeholder pour l'instant) */}
        <section className="bg-slate-50 border rounded-xl p-6 opacity-50">
            <h3 className="font-bold mb-4">Liste des Membres (À venir)</h3>
            <p className="text-sm">La gestion individuelle des membres sera ici.</p>
        </section>
    </div>
  );
}
