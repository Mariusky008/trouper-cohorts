import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Users, Trash2, UserPlus, X, Calendar, Video } from "lucide-react";
import { createBuddyGroup, deleteBuddyGroup, addMemberToGroup, removeMemberFromGroup } from "@/app/actions/buddy";
import { createEvent, deleteEvent } from "@/app/actions/events";

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
  const currentTab = typeof search?.tab === "string" ? search.tab : "settings";

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
    .select("*, profiles(id, display_name, trade, department_code, instagram_handle)")
    .eq("cohort_id", id)
    .order("joined_at", { ascending: false });

  // Récupérer les groupes
  const groupsRes = await supabase
    .from("buddy_groups")
    .select("*, buddy_group_members(user_id, profiles(display_name))")
    .eq("cohort_id", id)
    .order("created_at", { ascending: true });

  // Récupérer les événements
  const eventsRes = await supabase
    .from("events")
    .select("*")
    .eq("cohort_id", id)
    .order("start_time", { ascending: true });

  // Calculer les membres sans groupe pour le select
  const membersInGroups = new Set(
    groupsRes.data?.flatMap(g => g.buddy_group_members.map((m: any) => m.user_id)) || []
  );
  
  const availableMembers = membersRes.data?.filter(m => !membersInGroups.has(m.user_id)) || [];

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
    <div className="space-y-6 pb-20">
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

      <Tabs defaultValue={currentTab}>
        <TabsList>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="missions">Missions ({missionsRes.data?.length || 0})</TabsTrigger>
          <TabsTrigger value="participants">Participants ({membersRes.data?.length || 0})</TabsTrigger>
          <TabsTrigger value="groups">Groupes ({groupsRes.data?.length || 0})</TabsTrigger>
          <TabsTrigger value="agenda">Agenda ({eventsRes.data?.length || 0})</TabsTrigger>
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
             <div className="flex justify-end">
               <Button variant="outline" size="sm" asChild>
                 <a href={`/admin/cohorts/${id}/export`} target="_blank" rel="noopener noreferrer">
                   <Download className="mr-2 h-4 w-4" /> Exporter CSV
                 </a>
               </Button>
             </div>
             <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Dép.</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersRes.data?.map((m) => {
                    const profile = m.profiles as unknown as { display_name: string; trade: string; instagram_handle: string };
                    return (
                      <TableRow key={m.user_id}>
                        <TableCell>
                          <div className="font-medium">
                            {profile?.display_name || "Anonyme"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {profile?.trade || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {m.department_code || "—"}
                        </TableCell>
                        <TableCell>
                            {profile?.instagram_handle ? (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    @{profile.instagram_handle}
                                </span>
                            ) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/cohorts/${id}/participants/${m.user_id}`}>Gérer</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                })}
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

        <TabsContent value="groups" className="space-y-6 mt-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Buddy System</h2>
                <form action={async (formData) => {
                  "use server";
                  await createBuddyGroup(formData);
                }} className="flex gap-2">
                    <input type="hidden" name="cohort_id" value={id} />
                    <Input name="name" placeholder="Nom du groupe (ex: Duo Alpha)" className="w-64" required />
                    <Button type="submit" size="sm">
                        <Users className="mr-2 h-4 w-4" /> Créer Groupe
                    </Button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupsRes.data?.map((group) => (
                    <Card key={group.id} className="relative">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base">{group.name}</CardTitle>
                                <form action={async (formData) => {
                                  "use server";
                                  await deleteBuddyGroup(formData);
                                }}>
                                    <input type="hidden" name="group_id" value={group.id} />
                                    <input type="hidden" name="cohort_id" value={id} />
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {group.buddy_group_members.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Vide</p>
                                ) : (
                                    group.buddy_group_members.map((member: any) => (
                                        <div key={member.user_id} className="flex justify-between items-center text-sm border p-2 rounded bg-muted/20">
                                            <span>{member.profiles?.display_name || "Anonyme"}</span>
                                            <form action={async (formData) => {
                                              "use server";
                                              await removeMemberFromGroup(formData);
                                            }}>
                                                <input type="hidden" name="group_id" value={group.id} />
                                                <input type="hidden" name="user_id" value={member.user_id} />
                                                <input type="hidden" name="cohort_id" value={id} />
                                                <Button variant="ghost" size="icon" className="h-5 w-5">
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </form>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form action={async (formData) => {
                              "use server";
                              await addMemberToGroup(formData);
                            }} className="flex gap-2">
                                <input type="hidden" name="group_id" value={group.id} />
                                <input type="hidden" name="cohort_id" value={id} />
                                <Select name="user_id" required>
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Ajouter..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableMembers.map((m) => {
                                            const profile = m.profiles as unknown as { display_name: string };
                                            const name = profile?.display_name || "Anonyme";
                                            return (
                                                <SelectItem key={m.user_id} value={m.user_id}>
                                                    {name}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                <Button type="submit" size="sm" variant="outline" className="px-2">
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6 mt-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Événements Live</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ajouter un événement</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                      "use server";
                      await createEvent(formData);
                    }} className="flex flex-wrap gap-4 items-end">
                        <input type="hidden" name="cohort_id" value={id} />
                        <div className="space-y-2">
                            <Label>Titre</Label>
                            <Input name="title" placeholder="Atelier Démo" required className="w-48" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input name="date" type="date" required className="w-40" />
                        </div>
                        <div className="space-y-2">
                            <Label>Heure</Label>
                            <Input name="time" type="time" required className="w-32" />
                        </div>
                        <div className="space-y-2">
                            <Label>Lien Visio</Label>
                            <Input name="meeting_url" placeholder="https://meet..." className="w-48" />
                        </div>
                        <Button type="submit">
                            <Calendar className="mr-2 h-4 w-4" /> Ajouter
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {eventsRes.data?.map((event) => (
                    <Card key={event.id}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                                    <Video className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-bold">{event.title}</div>
                                    <div className="text-sm text-muted-foreground flex gap-2">
                                        <span>{new Date(event.start_time).toLocaleDateString()}</span>
                                        <span>{new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {event.meeting_url && (
                                    <a href={event.meeting_url} target="_blank" className="text-sm text-blue-600 hover:underline truncate max-w-[200px]">
                                        {event.meeting_url}
                                    </a>
                                )}
                                <form action={async (formData) => {
                                  "use server";
                                  await deleteEvent(formData);
                                }}>
                                    <input type="hidden" name="event_id" value={event.id} />
                                    <input type="hidden" name="cohort_id" value={id} />
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {eventsRes.data?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                        Aucun événement prévu.
                    </div>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

