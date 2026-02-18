import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CockpitDark } from "@/components/dashboard/cockpit-dark";
import { getMyBuddies } from "@/lib/data/buddy";
import { getBuddyHistory } from "@/actions/buddy";
import { AlertCircle, Trophy } from "lucide-react";
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
  const sp = await searchParams;
  
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
    .select("id, title, trade, start_date, end_date, status, program_type")
    .eq("id", membershipRes.data.cohort_id)
    .maybeSingle();

  if (!cohortRes.data) return <div>Cohorte introuvable</div>;

  const computedDay = computeDayIndex(cohortRes.data.start_date) || 0;
  const requestedDay = sp?.day ? parseInt(Array.isArray(sp.day) ? sp.day[0] : sp.day) : null;

  // On détermine le jour à afficher
  let dayIndex = computedDay;

  if (requestedDay && requestedDay > 0 && requestedDay <= 15) {
      // On peut voir les jours passés. Pour les jours futurs, on bloque sauf si la cohorte est finie.
      // (Ou si on est admin/debug, mais on reste strict pour l'instant)
      if (requestedDay <= computedDay || computedDay > 15) {
          dayIndex = requestedDay;
      }
  }

  // Cas particuliers (Avant / Après cohorte)
  if (dayIndex === computedDay) {
      if (computedDay < 1) {
          return <div className="p-10 text-center">J-{Math.abs(computedDay) + 1} avant le lancement !</div>;
      }
      if (computedDay > 15 && !requestedDay) {
          // Si c'est fini et qu'on n'a pas demandé un jour spécifique, on peut rediriger ou afficher un message
          // Pour l'instant on affiche un message
          return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center">
                <Trophy className="h-16 w-16 text-yellow-500" />
                <h2 className="text-3xl font-black text-white">Cohorte Terminée !</h2>
                <p className="text-slate-400">Bravo pour ce parcours. Vous pouvez revoir vos missions via le Programme.</p>
                <Button asChild>
                    <a href="/app/program">Voir le Programme</a>
                </Button>
            </div>
          );
      }
  }

  // Clamp dayIndex
  if (dayIndex < 1) dayIndex = 1;
  if (dayIndex > 15) dayIndex = 15;

  // Récupération de la Mission
  const missionRes = await supabase
    .from("missions")
    .select("id, title, description, proof_type, video_url, duo_instructions")
    .eq("cohort_id", cohortRes.data.id)
    .eq("day_index", dayIndex)
    .maybeSingle();

  // Vérification de la soumission globale
  let globalSubmission = null;
  if (missionRes.data) {
      const { data } = await supabase
          .from("submissions")
          .select("status")
          .eq("mission_id", missionRes.data.id)
          .eq("user_id", user.id)
          .maybeSingle();
      globalSubmission = data;
  }
  
  // Injecter le statut utilisateur dans l'objet mission passé au composant
  const missionWithStatus = missionRes.data ? {
      ...missionRes.data,
      user_status: globalSubmission?.status || 'pending'
  } : null;

  // Récupération des Étapes (Steps) et du progrès utilisateur
  let steps: any[] = [];
  if (missionRes.data) {
      const stepsRes = await supabase
        .from("mission_steps")
        .select("*")
        .eq("mission_id", missionRes.data.id)
        .order("position", { ascending: true });
      
      const rawSteps = stepsRes.data || [];

      // Récupérer le progrès spécifique à l'utilisateur
      const { data: userProgress } = await supabase
        .from("user_mission_steps")
        .select("step_id, status, proof_content")
        .eq("user_id", user.id)
        .in("step_id", rawSteps.map(s => s.id));

      // Fusionner les données
      steps = rawSteps.map(step => {
          const progress = userProgress?.find(p => p.step_id === step.id);
          return {
              ...step,
              status: progress?.status || 'pending', // Overwrite status from user progress
              proof_content: progress?.proof_content || null // Overwrite proof from user progress
          };
      });
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

      // Récupération de la soumission du PREMIER binôme
      if (primaryBuddy && missionRes.data) {
          const { data: bSubmission } = await supabase
            .from("submissions")
            .select("status")
            .eq("user_id", primaryBuddy.id)
            .eq("mission_id", missionRes.data.id)
            .maybeSingle();
          buddyMission = bSubmission;
      }
  }

  const buddyHistory = await getBuddyHistory();

  return (
    <div className="bg-[#0a0f1c]">
      <CockpitDark 
        user={user} 
        cohort={cohortRes.data} 
        mission={missionWithStatus} 
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
