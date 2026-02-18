import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Target, Users, Video, Rocket, Brain, GlassWater, Trophy, Clock, Flame, Zap, Anchor, LogOut, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function computeDayIndex(startDate: string | null) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

const TYPE_CONFIG: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  solo: { icon: Target, color: "text-orange-500", bg: "bg-[#111827] border-orange-500/20", label: "Challenge" },
  duo: { icon: Users, color: "text-blue-500", bg: "bg-[#111827] border-blue-500/20", label: "Duo" },
  trio: { icon: Users, color: "text-indigo-500", bg: "bg-[#111827] border-indigo-500/20", label: "Trio" },
  workshop: { icon: Video, color: "text-purple-500", bg: "bg-[#111827] border-purple-500/20", label: "Live" },
  coaching: { icon: Rocket, color: "text-green-500", bg: "bg-[#111827] border-green-500/20", label: "Coaching" },
  quiz: { icon: Brain, color: "text-yellow-500", bg: "bg-[#111827] border-yellow-500/20", label: "Quiz" },
  networking: { icon: GlassWater, color: "text-pink-500", bg: "bg-[#111827] border-pink-500/20", label: "Apéro" },
};

export default async function ProgramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sign out function for the header button
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const membershipRes = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membershipRes.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 text-slate-400">
        <h2 className="text-xl font-bold text-white">Aucune cohorte</h2>
        <p>Rejoins une cohorte pour voir le programme.</p>
      </div>
    );
  }

  const cohortRes = await supabase
    .from("cohorts")
    .select("id, title, start_date")
    .eq("id", membershipRes.data.cohort_id)
    .maybeSingle();

  if (!cohortRes.data) return <div className="text-white">Erreur cohorte</div>;

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

  // Générer une liste de 1 à 15 jours
  const days = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-50 bg-[#0a0f1c]/90 backdrop-blur-md mb-8">
          <div className="flex items-center gap-8">
              <div className="font-black text-xl italic uppercase text-white tracking-tighter flex items-center gap-1 cursor-pointer">
                  <Anchor className="h-5 w-5 text-orange-500 mr-2" />
                  Popey
              </div>
              <nav className="hidden md:flex items-center gap-1">
                  {[
                      { label: "Aujourd'hui", active: false, href: "/app/today" },
                      { label: "Programme", active: true, href: "/app/program" },
                      { label: "Équipage", active: false, href: "/app/crew" },
                      { label: "Classement", active: false, href: "/app/ranking" },
                      { label: "Profil", active: false, href: "/app/settings" },
                  ].map((item) => (
                      <Button
                          key={item.label}
                          variant="ghost"
                          asChild
                          className={`h-9 px-4 text-sm font-bold uppercase tracking-wider transition-all ${
                              item.active 
                              ? "bg-slate-800 text-white" 
                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          }`}
                      >
                          <Link href={item.href}>{item.label}</Link>
                      </Button>
                  ))}
              </nav>
          </div>
          <div className="flex items-center gap-4">
              <form action={signOut}>
                  <Button 
                      type="submit"
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-500 hover:text-red-400 hover:bg-red-900/10 gap-2 px-2"
                  >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs font-bold uppercase">Se déconnecter</span>
                  </Button>
              </form>
          </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="space-y-4 mb-12 text-center">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase tracking-widest px-4 py-1">
              Bootcamp • {cohortRes.data.title}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
            Programme <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Opérationnel</span>
          </h1>
          <p className="text-slate-400 text-lg">
            15 jours pour transformer ton activité. Pas de théorie, que de l'action.
          </p>
        </div>

        <div className="relative pl-4 space-y-8">
          {/* Ligne verticale de timeline */}
          <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-800 -z-10" />

          {days.map((day) => {
            const mission = missions?.find((m) => m.day_index === day);
            const isCompleted = mission && completedMissionIds.has(mission.id);
            const isToday = day === currentDay;
            const isFuture = day > currentDay;
            
            const type = mission?.mission_type || "solo";
            const config = TYPE_CONFIG[type] || TYPE_CONFIG["solo"];
            const Icon = config.icon;

            return (
              <div key={day} className={`relative flex gap-6 group ${isFuture ? "opacity-50 hover:opacity-80 transition-opacity" : ""}`}>
                {/* Badge Jour / Statut */}
                <div className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 z-10 transition-all shadow-xl",
                  isCompleted ? "border-green-500 bg-green-950 text-green-500" :
                  isToday ? "border-blue-500 bg-blue-950 text-blue-400 shadow-blue-500/30 scale-110" :
                  "border-slate-800 bg-[#0d1220] text-slate-600"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <span className="font-black text-lg">{day}</span>}
                </div>

                {/* Carte Mission */}
                <Card className={cn(
                  "flex-1 transition-all overflow-hidden border bg-[#111827] relative",
                  isToday ? "border-blue-500 shadow-lg shadow-blue-900/20" : "border-slate-800 hover:border-slate-700",
                )}>
                  {/* Type Badge */}
                  <div className="absolute top-0 right-0 p-3">
                      <Badge variant="outline" className={cn("text-[10px] uppercase font-bold border-0 bg-slate-900/50 backdrop-blur-sm", config.color)}>
                          {config.label}
                      </Badge>
                  </div>
                  
                  <CardHeader className="pb-2 pt-5 px-6">
                      <div className="flex items-center gap-3 mb-2">
                          <div className={cn("p-2 rounded-lg bg-slate-900/50", config.color)}>
                              <Icon className="h-5 w-5" />
                          </div>
                          <div>
                              <h3 className={cn("font-bold text-xl uppercase tracking-tight leading-none", isToday ? "text-white" : "text-slate-300")}>
                                  {mission ? mission.title : "Repos / Mystère"}
                              </h3>
                              {mission && (
                                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                                      {mission.duration && (
                                          <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {mission.duration}
                                          </div>
                                      )}
                                      {mission.energy_level === 'extreme' && (
                                          <div className="flex items-center gap-1 text-red-500">
                                              <Flame className="h-3 w-3 fill-red-500" />
                                              Intense
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent className="pb-6 px-6">
                    {mission ? (
                      <div className="space-y-4">
                          <div className="text-sm text-slate-400 font-medium leading-relaxed">
                              {mission.description || "Prépare-toi..."}
                          </div>
                          
                          {/* Étapes (Preview) */}
                          {mission.mission_steps && mission.mission_steps.length > 0 && !isFuture && (
                              <div className="space-y-2 pt-2 border-t border-slate-800 mt-4">
                                  {mission.mission_steps
                                      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                                      .slice(0, 3) // Show only first 3 steps in preview
                                      .map((step: any, idx: number) => (
                                      <div key={idx} className="flex gap-3 text-xs group items-start">
                                          <span className="font-mono text-slate-600 font-bold shrink-0 mt-0.5">{idx + 1}.</span>
                                          <span className="text-slate-500 group-hover:text-slate-300 transition-colors line-clamp-1">
                                              {step.content}
                                          </span>
                                      </div>
                                  ))}
                                  {mission.mission_steps.length > 3 && (
                                      <p className="text-[10px] text-slate-600 italic pl-6">+ {mission.mission_steps.length - 3} autres étapes</p>
                                  )}
                              </div>
                          )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 italic">
                        Pas de mission programmée.
                      </p>
                    )}
                    
                    {/* Action Button */}
                    <div className="mt-6 flex justify-end">
                        {isToday ? (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider" asChild>
                                <Link href="/app/today">Accéder au Cockpit</Link>
                            </Button>
                        ) : isFuture ? (
                            <Button size="sm" disabled variant="outline" className="border-slate-700 text-slate-600 uppercase text-xs font-bold">
                                <Lock className="h-3 w-3 mr-2" /> Verrouillé
                            </Button>
                        ) : (
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white uppercase text-xs font-bold" asChild>
                                <Link href={`/app/today?day=${day}`}>Revoir</Link>
                            </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
          
          {/* Fin du parcours */}
          <div className="relative flex gap-6 opacity-30 grayscale">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-slate-800 bg-[#0d1220] z-10">
                  <Trophy className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1 py-4 text-slate-600 italic font-medium">
                  La gloire éternelle t'attend au bout du chemin...
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

