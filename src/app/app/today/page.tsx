import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmissionForm } from "@/components/submission-form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, MapPin, Target, CheckCircle2, AlertCircle, Trophy } from "lucide-react";

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
  const params = await searchParams;
  const submitted = params?.submitted === "1";

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
    const message =
      membershipRes.error.message.includes("relation") ||
      membershipRes.error.message.includes("does not exist")
        ? "Base non initialisée. Exécute le script supabase/mvp.sql dans Supabase (SQL Editor)."
        : "Impossible de charger ta cohorte.";

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Oups, petit problème</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (!membershipRes.data) {
    async function joinDemoCohort() {
      "use server";
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
            Aucune cohorte active trouvée. Rejoins la cohorte de démo pour commencer ton entraînement.
          </p>
        </div>
        <form action={joinDemoCohort} className="w-full">
          <Button type="submit" size="lg" className="w-full rounded-full font-semibold">
            Rejoindre la cohorte Démo
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Ton département sera assigné automatiquement plus tard.
          </p>
        </form>
      </div>
    );
  }

  const cohortRes = await supabase
    .from("cohorts")
    .select("id, title, trade, start_date, end_date, status")
    .eq("id", membershipRes.data.cohort_id)
    .maybeSingle();

  if (cohortRes.error || !cohortRes.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Cohorte introuvable</h2>
        <p className="text-muted-foreground">Impossible de charger les données de la cohorte.</p>
      </div>
    );
  }

  const dayIndex = computeDayIndex(cohortRes.data.start_date);

  // States: Not Started, Finished, No Date
  if (!dayIndex) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <CalendarDays className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold">{cohortRes.data.title}</h2>
        <p className="text-muted-foreground">La date de démarrage n'est pas encore fixée. Prépare-toi !</p>
      </div>
    );
  }

  if (dayIndex < 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CalendarDays className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">J-{Math.abs(dayIndex) + 1} avant le lancement</h2>
        <p className="text-muted-foreground max-w-sm">
          La cohorte <strong>{cohortRes.data.title}</strong> commence bientôt. Affûte tes armes.
        </p>
      </div>
    );
  }

  if (dayIndex > 14) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <Trophy className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Mission Accomplie !</h2>
        <p className="text-muted-foreground max-w-sm">
          Félicitations, tu as terminé les 14 jours du sprint <strong>{cohortRes.data.title}</strong>.
        </p>
        <Button asChild variant="outline">
            <a href="/app/leaderboard">Voir le classement final</a>
        </Button>
      </div>
    );
  }

  const missionRes = await supabase
    .from("missions")
    .select("id, title, description, proof_type")
    .eq("cohort_id", cohortRes.data.id)
    .eq("day_index", dayIndex)
    .maybeSingle();

  if (missionRes.error || !missionRes.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold">Repos</h2>
        <p className="text-muted-foreground">Aucune mission trouvée pour le Jour {dayIndex}.</p>
      </div>
    );
  }

  const submissionRes = await supabase
    .from("submissions")
    .select("id, proof_url, note, status, updated_at")
    .eq("mission_id", missionRes.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const progress = (dayIndex / 14) * 100;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    {cohortRes.data.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="gap-1">
                        <Target className="h-3 w-3" /> {cohortRes.data.trade}
                    </Badge>
                    {membershipRes.data.department_code && (
                        <Badge variant="secondary" className="gap-1">
                            <MapPin className="h-3 w-3" /> {membershipRes.data.department_code}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="text-right">
                <div className="text-2xl font-black text-primary">Jour {dayIndex}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">sur 14</div>
            </div>
        </div>
        <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Début</span>
                <span>Fin</span>
            </div>
        </div>
      </div>

      {/* Mission Card */}
      <Card className="border-l-4 border-l-primary shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs mb-1">
            <Target className="h-4 w-4" /> Mission du jour
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold leading-tight">
            {missionRes.data.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {missionRes.data.description ? (
            <div className="prose prose-sm sm:prose-base text-muted-foreground max-w-none whitespace-pre-line leading-relaxed">
                {missionRes.data.description}
            </div>
          ) : (
            <p className="text-muted-foreground italic">Aucune description pour cette mission.</p>
          )}
        </CardContent>
      </Card>

      {/* Proof Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Validation
            </h3>
            <div className="h-px bg-border flex-1" />
        </div>

        <Card className={submitted ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10" : "border-dashed"}>
            <CardHeader>
                <CardTitle className="text-base">
                    {submitted ? "Mission validée ✅" : "Prouve ton action"}
                </CardTitle>
                <CardDescription>
                    {submitted 
                        ? "Bien joué ! Tu peux modifier ta preuve si besoin." 
                        : "Envoie une capture d'écran ou un lien pour valider tes points."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {submissionRes.data?.proof_url && (
                    <div className="mb-6 p-4 bg-background border rounded-lg shadow-sm">
                        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Preuve actuelle</p>
                         {(submissionRes.data.proof_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || submissionRes.data.proof_url.includes("supabase.co/storage")) ? (
                            <div className="relative h-48 w-full max-w-sm rounded-md overflow-hidden border bg-muted group">
                                <a href={submissionRes.data.proof_url} target="_blank" rel="noopener noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                    src={submissionRes.data.proof_url} 
                                    alt="Preuve" 
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                    />
                                </a>
                            </div>
                        ) : (
                            <a href={submissionRes.data.proof_url} target="_blank" className="text-primary underline font-medium break-all">
                                {submissionRes.data.proof_url}
                            </a>
                        )}
                        {submissionRes.data.note && (
                            <div className="mt-3 pt-3 border-t text-sm italic text-muted-foreground">
                                "{submissionRes.data.note}"
                            </div>
                        )}
                    </div>
                )}
                
                <SubmissionForm missionId={missionRes.data.id} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

