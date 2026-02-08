import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const submitted = searchParams?.submitted === "1";

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
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Aujourd’hui</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
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
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Aujourd’hui</CardTitle>
          <CardDescription>
            Aucun accès cohorte trouvé pour ce compte. Demande au coach de t’ajouter à une cohorte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={joinDemoCohort} className="space-y-2">
            <Button type="submit" className="w-full">
              Rejoindre la cohorte démo
            </Button>
            <div className="text-xs text-muted-foreground">
              Le département sera assigné plus tard par le coach.
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const cohortRes = await supabase
    .from("cohorts")
    .select("id, title, trade, start_date, end_date, status")
    .eq("id", membershipRes.data.cohort_id)
    .maybeSingle();

  if (cohortRes.error || !cohortRes.data) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Aujourd’hui</CardTitle>
          <CardDescription>Impossible de charger la cohorte.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dayIndex = computeDayIndex(cohortRes.data.start_date);

  if (!dayIndex) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{cohortRes.data.title}</CardTitle>
          <CardDescription>La date de début n’est pas configurée.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (dayIndex < 1) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{cohortRes.data.title}</CardTitle>
          <CardDescription>Le sprint n’a pas encore commencé.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (dayIndex > 14) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{cohortRes.data.title}</CardTitle>
          <CardDescription>Sprint terminé. Bravo.</CardDescription>
        </CardHeader>
      </Card>
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
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{cohortRes.data.title}</CardTitle>
          <CardDescription>Aucune mission trouvée pour le Jour {dayIndex}.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const submissionRes = await supabase
    .from("submissions")
    .select("id, proof_url, note, status, updated_at")
    .eq("mission_id", missionRes.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  async function submitProof(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const missionId = String(formData.get("mission_id") || "");
    const proofUrl = String(formData.get("proof_url") || "").trim();
    const note = String(formData.get("note") || "").trim();

    if (!missionId) redirect("/app/today");

    const { error } = await supabase.from("submissions").upsert(
      {
        mission_id: missionId,
        user_id: user.id,
        proof_url: proofUrl,
        note,
        status: "submitted",
      },
      { onConflict: "mission_id,user_id" }
    );

    if (error) redirect("/app/today");
    redirect("/app/today?submitted=1");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{cohortRes.data.title}</CardTitle>
          <CardDescription>
            Jour {dayIndex} — {cohortRes.data.trade} — Département {membershipRes.data.department_code ?? "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-lg font-semibold">{missionRes.data.title}</div>
          {missionRes.data.description ? (
            <div className="text-sm text-muted-foreground whitespace-pre-line">{missionRes.data.description}</div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Ta preuve</CardTitle>
          <CardDescription>
            {submitted ? "Preuve enregistrée." : submissionRes.data ? "Tu peux mettre à jour ta preuve." : "Soumets ta preuve pour valider la mission."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitProof} className="space-y-4">
            <input type="hidden" name="mission_id" value={missionRes.data.id} />
            <div className="space-y-2">
              <Label htmlFor="proof_url">Lien</Label>
              <Input
                id="proof_url"
                name="proof_url"
                type="url"
                placeholder="https://..."
                defaultValue={submissionRes.data?.proof_url ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                name="note"
                placeholder="Ce que tu as fait, le résultat, ce qui bloque…"
                defaultValue={submissionRes.data?.note ?? ""}
              />
            </div>
            <Button type="submit" className="w-full">
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
