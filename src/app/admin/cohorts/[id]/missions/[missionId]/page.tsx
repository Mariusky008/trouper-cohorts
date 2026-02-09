import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { MissionStepsEditor } from "@/components/admin/mission-steps-editor";

export default async function EditMissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; missionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, missionId } = await params;
  const search = await searchParams;
  const saved = search?.saved === "1";

  const supabase = await createClient();

  const missionRes = await supabase.from("missions").select("*").eq("id", missionId).single();

  if (missionRes.error || !missionRes.data) {
    return <div>Mission introuvable</div>;
  }

  const mission = missionRes.data;

  // Récupérer les étapes (steps)
  const { data: steps } = await supabase
    .from("mission_steps")
    .select("*")
    .eq("mission_id", missionId)
    .order("position", { ascending: true });

  async function updateMission(formData: FormData) {
    "use server";
    const supabase = await createClient();

    const title = String(formData.get("title") || "");
    const description = String(formData.get("description") || "");
    const proofType = String(formData.get("proof_type") || "url");
    const missionType = String(formData.get("mission_type") || "solo");
    const videoUrl = String(formData.get("video_url") || "");

    await supabase
      .from("missions")
      .update({
        title,
        description,
        proof_type: proofType,
        mission_type: missionType,
        video_url: videoUrl || null,
      })
      .eq("id", missionId);

    redirect(`/admin/cohorts/${id}/missions/${missionId}?saved=1`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/cohorts/${id}?tab=missions`}>← Retour à la cohorte</Link>
        </Button>
        <h1 className="text-2xl font-bold">Éditer Mission J{mission.day_index}</h1>
      </div>

      {saved && (
        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
          Mission mise à jour.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contenu Principal</CardTitle>
              <CardDescription>Informations générales de la mission.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateMission} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input id="title" name="title" defaultValue={mission.title} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Intro / Contexte)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    className="min-h-[100px] font-mono text-sm"
                    defaultValue={mission.description || ""}
                    placeholder="Une petite intro avant la checklist..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url">URL de la vidéo (Briefing)</Label>
                  <Input id="video_url" name="video_url" defaultValue={mission.video_url || ""} placeholder="https://..." />
                  <p className="text-xs text-muted-foreground">Lien direct vers la vidéo (mp4) ou embed URL.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proof_type">Type de preuve attendue</Label>
                    <Select name="proof_type" defaultValue={mission.proof_type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">Lien (URL)</SelectItem>
                        <SelectItem value="text">Texte libre</SelectItem>
                        <SelectItem value="image">Image (Upload)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mission_type">Type de Journée</Label>
                    <Select name="mission_type" defaultValue={mission.mission_type || "solo"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">🔥 Mission Solo</SelectItem>
                        <SelectItem value="duo">🤝 Duo (Binôme)</SelectItem>
                        <SelectItem value="trio">👥 Trio</SelectItem>
                        <SelectItem value="workshop">🎥 Atelier Live</SelectItem>
                        <SelectItem value="coaching">🚀 Coaching</SelectItem>
                        <SelectItem value="quiz">🧠 Quiz</SelectItem>
                        <SelectItem value="networking">🍸 Networking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button type="submit">Enregistrer les modifications</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
               {/* Éditeur d'étapes */}
               <MissionStepsEditor missionId={missionId} initialSteps={steps || []} />
          </div>
      </div>
    </div>
  );
}
