import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function CohortDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const saved = search?.saved === "1";

  const supabase = await createClient();

  const cohortRes = await supabase.from("cohorts").select("*").eq("id", id).single();

  if (cohortRes.error || !cohortRes.data) {
    return <div>Cohorte introuvable</div>;
  }

  const cohort = cohortRes.data;

  // Récupérer les missions
  const missionsRes = await supabase
    .from("missions")
    .select("*")
    .eq("cohort_id", id)
    .order("day_index", { ascending: true });

  // Récupérer les participants
  const membersRes = await supabase
    .from("cohort_members")
    .select("*, profiles(display_name, trade, department_code)")
    .eq("cohort_id", id)
    .order("joined_at", { ascending: false });

  async function updateCohort(formData: FormData) {
    "use server";
    const supabase = await createClient();

    const title = String(formData.get("title") || "");
    const slug = String(formData.get("slug") || "").toLowerCase().trim();
    const trade = String(formData.get("trade") || "");
    const startDate = String(formData.get("start_date") || "");
    const status = String(formData.get("status") || "draft");

    let endDate = null;
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + 13);
      endDate = d.toISOString().split("T")[0];
    }

    await supabase
      .from("cohorts")
      .update({
        title,
        slug,
        trade,
        start_date: startDate || null,
        end_date: endDate,
        status,
      })
      .eq("id", id);

    redirect(`/admin/cohorts/${id}?saved=1`);
  }

  async function generateMissions() {
    "use server";
    const supabase = await createClient();
    
    // Génère 14 missions placeholders si elles n'existent pas
    const missions = Array.from({ length: 14 }, (_, i) => ({
      cohort_id: id,
      day_index: i + 1,
      title: `Jour ${i + 1}`,
      description: "Description à remplir...",
      proof_type: "url",
    }));

    await supabase.from("missions").upsert(missions, { onConflict: "cohort_id, day_index" });
    redirect(`/admin/cohorts/${id}?tab=missions`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/cohorts">← Retour</Link>
          </Button>
          <h1 className="text-2xl font-bold">{cohort.title}</h1>
        </div>
        <Button asChild variant="secondary">
          <a href={`/app/today`} target="_blank">Voir côté App ↗</a>
        </Button>
      </div>

      {saved && (
        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
          Modifications enregistrées.
        </div>
      )}

      <Tabs defaultValue={search?.tab === "missions" ? "missions" : search?.tab === "participants" ? "participants" : "settings"}>
        <TabsList>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="missions">Missions ({missionsRes.data?.length || 0})</TabsTrigger>
          <TabsTrigger value="participants">Participants ({membersRes.data?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateCohort} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" name="title" defaultValue={cohort.title} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" name="slug" defaultValue={cohort.slug} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trade">Métier</Label>
                    <Input id="trade" name="trade" defaultValue={cohort.trade} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select name="status" defaultValue={cohort.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="live">Active</SelectItem>
                        <SelectItem value="archived">Archivée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input id="start_date" name="start_date" type="date" defaultValue={cohort.start_date || ""} required />
                </div>

                <div className="pt-2">
                  <Button type="submit">Enregistrer</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missions" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <form action={generateMissions}>
              <Button variant="outline" size="sm">Générer les 14 missions (Template)</Button>
            </form>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Jour</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type preuve</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missionsRes.data?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-bold">J{m.day_index}</TableCell>
                    <TableCell>{m.title}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{m.proof_type}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                         <Link href={`/admin/cohorts/${id}/missions/${m.id}`}>Éditer</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {missionsRes.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      Aucune mission. Cliquez sur "Générer" pour commencer.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4 mt-4">
           <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Dép.</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Rejoint le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersRes.data?.map((m) => (
                  <TableRow key={m.user_id}>
                    <TableCell>
                      <div className="font-medium">
                        {Array.isArray(m.profiles) ? m.profiles[0]?.display_name : m.profiles?.display_name || "Anonyme"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Array.isArray(m.profiles) ? m.profiles[0]?.trade : m.profiles?.trade}
                      </div>
                    </TableCell>
                    <TableCell>
                      {m.department_code || "—"}
                    </TableCell>
                    <TableCell>{m.member_role}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/cohorts/${id}/participants/${m.user_id}`}>Gérer</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {membersRes.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      Aucun participant.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
