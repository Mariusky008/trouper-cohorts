import { createClient } from "@/lib/supabase/server";
import { DailyPairsList } from "@/components/admin/daily-pairs-list";
import { CohortMembersList } from "@/components/admin/cohort-members-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminCohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const { id } = await params;

  // 1. Infos Cohorte
  const { data: cohort, error } = await supabase
    .from("cohorts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cohort) {
      return (
        <div className="p-8 border border-red-200 bg-red-50 text-red-700 rounded-lg">
            <h2 className="font-bold text-lg mb-2">Erreur : Cohorte introuvable</h2>
            <p>ID cherché : <code>{id}</code></p>
            <p>Erreur Supabase : {error?.message || "Aucune donnée retournée"}</p>
            <div className="mt-4">
                <Button asChild variant="outline"><Link href="/admin/cohorts">Retour à la liste</Link></Button>
            </div>
        </div>
      );
  }

  // 2. Membres (Liste complète)
  const { data: membersData } = await supabase
    .from("cohort_members")
    .select("user_id, department_code, joined_at")
    .eq("cohort_id", id);

  let membersWithDetails: any[] = [];
  if (membersData && membersData.length > 0) {
      const userIds = membersData.map(m => m.user_id);
      const { data: userDetails } = await supabase
          .from("pre_registrations")
          .select("user_id, first_name, last_name, email, trade")
          .in("user_id", userIds);
      
      membersWithDetails = membersData.map(m => {
          const details = userDetails?.find(u => u.user_id === m.user_id);
          return { ...m, ...details };
      });
  }

  // 3. Paires du jour
  const { data: rawPairs } = await supabase
    .from("cohort_pairs")
    .select("*")
    .eq("cohort_id", id)
    .eq("pair_date", today);

  // 4. Infos Utilisateurs pour les paires
  const pairUserIds = rawPairs?.flatMap(p => [p.user1_id, p.user2_id]) || [];
  let pairsWithDetails = [];
  
  if (pairUserIds.length > 0) {
      // On réutilise userDetails si possible, ou on refait une requête (plus simple ici de refaire)
      const { data: usersInfo } = await supabase
        .from("pre_registrations")
        .select("user_id, first_name, last_name, trade")
        .in("user_id", pairUserIds);
      
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
                    {membersData?.length || 0} membres • Début: {new Date(cohort.start_date).toLocaleDateString()}
                </p>
            </div>
        </div>

        {/* Gestion des Binômes */}
        <section>
            <DailyPairsList cohortId={cohort.id} pairs={pairsWithDetails} />
        </section>

        {/* Liste des membres */}
        <section>
            <CohortMembersList members={membersWithDetails} />
        </section>
    </div>
  );
}
