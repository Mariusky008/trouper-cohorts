import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CockpitDashboard } from "@/components/dashboard/cockpit";
import { getMyBuddies } from "@/lib/data/buddy";
import { getBuddyHistory } from "@/actions/buddy";
import { AlertCircle, CalendarDays, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

function computeDayIndex(startDate: string | null) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membershipRes = await supabase
    .from("cohort_members")
    .select("cohort_id, department_code")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipRes.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Erreur Technique</h2>
        <p className="text-muted-foreground">Impossible de charger ta cohorte.</p>
      </div>
    );
  }

  if (!membershipRes.data) {
     // Redirection vers démo si pas de cohorte (logique existante)
     async function joinDemoCohort() {
      "use server";
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) redirect("/login");

      const cohortRes = await supabase.from("cohorts").select("id").eq("slug", "demo-coach").maybeSingle();
      if (!cohortRes.data?.id) redirect("/app/today");

      await supabase.from("cohort_members").insert({
        cohort_id: cohortRes.data.id,
        user_id: user.id,
        member_role: "participant",
        department_code: null,
      });

      redirect("/app/today");
    }

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 max-w-md mx-auto text-center px-4">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Bienvenue soldat !</h2>
          <p className="text-muted-foreground">
            Aucune cohorte active trouvée. Rejoins la cohorte de démo.
          </p>
        </div>
        <form action={joinDemoCohort} className="w-full">
          <Button type="submit" size="lg" className="w-full rounded-full font-semibold">
            Rejoindre la cohorte Démo
          </Button>
        </form>
      </div>
    );
  }

  const cohortRes = await supabase
    .from("cohorts")
    .select("id, title, trade, start_date, end_date, status")
    .eq("id", membershipRes.data.cohort_id)
    .maybeSingle();

  if (!cohortRes.data) return <div>Cohorte introuvable</div>;

  const dayIndex = computeDayIndex(cohortRes.data.start_date);

  // Cas particuliers (Avant / Après cohorte)
  if (!dayIndex) {
      return <div className="p-10 text-center">Date de démarrage non définie.</div>;
  }
  if (dayIndex < 1) {
      return <div className="p-10 text-center">J-{Math.abs(dayIndex) + 1} avant le lancement !</div>;
  }
  if (dayIndex > 14) {
      return <div className="p-10 text-center">Félicitations, cohorte terminée !</div>;
  }

  // Récupération de la Mission
  const missionRes = await supabase
    .from("missions")
    .select("id, title, description, proof_type, video_url, duo_instructions")
    .eq("cohort_id", cohortRes.data.id)
    .eq("day_index", dayIndex)
    .maybeSingle();

  // Récupération des Étapes (Steps)
  let steps: any[] = [];
  if (missionRes.data) {
      const stepsRes = await supabase
        .from("mission_steps")
        .select("*")
        .eq("mission_id", missionRes.data.id)
        .order("position", { ascending: true });
      steps = stepsRes.data || [];
  }

  // Récupération du binôme (ou des binômes si Trio)
  const buddies = await getMyBuddies(cohortRes.data.id, user.id);
  const primaryBuddy = buddies.length > 0 ? buddies[0] : null;

  // Récupération des Messages de TOUS les binômes (pour Trio)
  let initialMessages: any[] = [];
  let buddyMission: any = null;

  if (buddies.length > 0) {
      const buddyIds = buddies.map(b => b.id);
      
      // On récupère large (tous mes messages) et on filtre en JS pour simplifier la requête OR complexe
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true })
        .limit(100); // Limite raisonnable

      // On ne garde que les messages échangés avec les binômes du jour
      initialMessages = (msgs || []).filter(m => {
          const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
          return buddyIds.includes(otherId);
      });

      // Récupération de la mission du PREMIER binôme (pour validation croisée simplifiée)
      // (Idéalement on gérerait la validation de tous, mais on reste simple pour l'instant)
      if (primaryBuddy) {
          const { data: bMission } = await supabase
            .from("missions")
            .select("id, status, validation_type, duo_instructions")
            .eq("user_id", primaryBuddy.id)
            .eq("day_index", dayIndex)
            .maybeSingle();
          buddyMission = bMission;
      }
  }

  const buddyHistory = await getBuddyHistory();

  return (
    <div className="space-y-6">
      <CockpitDashboard 
        user={user} 
        cohort={cohortRes.data} 
        mission={missionRes.data} 
        dayIndex={dayIndex} 
        buddy={primaryBuddy} 
        allBuddies={buddies}
        steps={steps} 
        initialMessages={initialMessages}
        buddyMission={buddyMission}
        buddyHistory={buddyHistory}
      />
    </div>
  );
}
