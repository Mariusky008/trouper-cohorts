import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Target, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

function computeDayIndex(startDate: string | null) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export default async function ProgramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membershipRes = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membershipRes.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <h2 className="text-xl font-bold">Aucune cohorte</h2>
        <p className="text-muted-foreground">Rejoins une cohorte pour voir le programme.</p>
      </div>
    );
  }

  const cohortRes = await supabase
    .from("cohorts")
    .select("id, title, start_date")
    .eq("id", membershipRes.data.cohort_id)
    .maybeSingle();

  if (!cohortRes.data) return <div>Erreur cohorte</div>;

  const currentDay = computeDayIndex(cohortRes.data.start_date) || 0;

  // Récupérer toutes les missions
  const { data: missions } = await supabase
    .from("missions")
    .select("id, day_index, title, description, proof_type")
    .eq("cohort_id", cohortRes.data.id)
    .order("day_index", { ascending: true });

  // Récupérer les soumissions de l'user pour marquer comme "fait"
  const { data: submissions } = await supabase
    .from("submissions")
    .select("mission_id, status")
    .eq("user_id", user.id);

  const completedMissionIds = new Set(submissions?.map((s) => s.mission_id));

  // Générer une liste de 1 à 14 jours (même si pas de mission en DB)
  const days = Array.from({ length: 14 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">Programme</h1>
        <p className="text-muted-foreground">
          14 jours pour transformer ton activité.
        </p>
      </div>

      <div className="grid gap-4">
        {days.map((day) => {
          const mission = missions?.find((m) => m.day_index === day);
          const isCompleted = mission && completedMissionIds.has(mission.id);
          const isToday = day === currentDay;
          const isLocked = day > currentDay; // On peut changer ça si on veut tout montrer
          
          // Si on veut tout montrer (spoiler), on enlève le lock sur le contenu
          // Mais on garde le style "futur".
          // Ici je choisis de tout montrer pour "voir ce qui m'attend", 
          // mais visuellement distinguer passé/présent/futur.

          return (
            <Card 
              key={day} 
              className={cn(
                "transition-all",
                isToday ? "border-primary border-2 shadow-md" : "border-border",
                isLocked ? "opacity-70 bg-muted/20" : "",
                isCompleted ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900" : ""
              )}
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                  isCompleted ? "bg-green-100 text-green-600 border-green-200" : 
                  isToday ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : day}
                </div>
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn("font-semibold leading-none", isToday && "text-primary")}>
                      {mission ? mission.title : `Jour ${day}`}
                    </h3>
                    {isToday && <Badge>Aujourd'hui</Badge>}
                    {isLocked && !isToday && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  
                  {mission ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {mission.description || "Pas de description."}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Mission mystère...
                    </p>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
