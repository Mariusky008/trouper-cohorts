import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, Target, CalendarDays, Users, Video, Rocket, Brain, GlassWater, ArrowDown, Trophy, Clock, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

function computeDayIndex(startDate: string | null) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

const TYPE_CONFIG: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  solo: { icon: Target, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20", label: "Challenge" },
  duo: { icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", label: "Duo" },
  trio: { icon: Users, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/20", label: "Trio" },
  workshop: { icon: Video, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20", label: "Live" },
  coaching: { icon: Rocket, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20", label: "Coaching" },
  quiz: { icon: Brain, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/20", label: "Quiz" },
  networking: { icon: GlassWater, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/20", label: "Apéro" },
};

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

  // Récupérer toutes les missions avec leurs étapes
  const { data: missions } = await supabase
    .from("missions")
    .select(`
        id, day_index, title, description, proof_type, mission_type, duration, energy_level,
        mission_steps ( content, position, category )
    `)
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
          14 jours intensifs. Prépare-toi à transpirer.
        </p>
      </div>

      <div className="relative pl-4 space-y-8">
        {/* Ligne verticale de timeline */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-border -z-10" />

        {days.map((day) => {
          const mission = missions?.find((m) => m.day_index === day);
          const isCompleted = mission && completedMissionIds.has(mission.id);
          const isToday = day === currentDay;
          const isFuture = day > currentDay;
          
          const type = mission?.mission_type || "solo";
          const config = TYPE_CONFIG[type] || TYPE_CONFIG["solo"];
          const Icon = config.icon;

          return (
            <div key={day} className="relative flex gap-4">
              {/* Badge Jour / Statut */}
              <div className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-background z-10 transition-all",
                isCompleted ? "border-green-500 text-green-500" :
                isToday ? "border-primary text-primary shadow-lg scale-110" :
                "border-muted text-muted-foreground"
              )}>
                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <span className="font-bold text-lg">{day}</span>}
              </div>

              {/* Carte Mission */}
              <Card className={cn(
                "flex-1 transition-all overflow-hidden",
                isToday ? "border-primary border-2 shadow-md" : "border-border",
                // J'ai retiré l'opacité et le grayscale pour que tout soit visible
                config.bg
              )}>
                <div className="absolute top-0 right-0 p-2 flex gap-2">
                    {isFuture && (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-white/50 backdrop-blur-sm border-muted-foreground/20">
                            À venir
                        </Badge>
                    )}
                    <Badge variant="secondary" className={cn("text-[10px] uppercase font-bold", config.color, "bg-white/80 backdrop-blur-sm")}>
                        {config.label}
                    </Badge>
                </div>
                
                <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn("h-5 w-5", config.color)} />
                        <h3 className={cn("font-bold text-lg leading-tight", isToday ? "text-foreground" : "text-muted-foreground")}>
                            {mission ? mission.title : "Repos / Mystère"}
                        </h3>
                    </div>
                    {mission && (
                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-1">
                            {mission.duration && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {mission.duration}
                                </div>
                            )}
                            {mission.energy_level === 'extreme' && (
                                <div className="flex items-center gap-1 text-red-600 font-bold">
                                    <Flame className="h-3.5 w-3.5 fill-red-600" />
                                    INTENSE
                                </div>
                            )}
                            {mission.energy_level === 'high' && (
                                <div className="flex items-center gap-1 text-orange-600">
                                    <Zap className="h-3.5 w-3.5 fill-orange-600" />
                                    Énergique
                                </div>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  {mission ? (
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap font-medium">
                            {mission.description?.replace(/\\n/g, '\n') || "Prépare-toi..."}
                        </div>
                        
                        {/* Étapes détaillées */}
                        {mission.mission_steps && mission.mission_steps.length > 0 && (
                            <div className="space-y-2 pt-2">
                                {mission.mission_steps
                                    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                                    .map((step: any, idx: number) => (
                                    <div key={idx} className="flex gap-3 text-sm group">
                                        <span className="font-mono text-slate-300 font-bold shrink-0 group-hover:text-orange-400 transition-colors">{idx + 1}.</span>
                                        <span className="text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                                            {step.category === 'creative' && step.content.toLowerCase().includes('vidéo') && '🎥 '}
                                            {step.content}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Pas de mission programmée.
                    </p>
                  )}
                  {isToday && (
                      <div className="mt-3">
                          <Button size="sm" className="w-full font-bold" asChild>
                              <Link href="/app/today">Voir la mission du jour</Link>
                          </Button>
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
        
        {/* Fin du parcours */}
        <div className="relative flex gap-4 opacity-50">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted text-muted-foreground bg-background z-10">
                <Trophy className="h-6 w-6" />
            </div>
            <div className="flex-1 py-4 text-muted-foreground italic">
                La gloire éternelle...
            </div>
        </div>
      </div>
    </div>
  );
}

