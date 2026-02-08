import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default async function EditParticipantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; userId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, userId } = await params;
  const search = await searchParams;
  const saved = search?.saved === "1";
  const errorMsg = search?.error;

  const supabase = await createClient();

  // Récupérer le membre et son profil
  const memberRes = await supabase
    .from("cohort_members")
    .select("*, profiles(*)")
    .eq("cohort_id", id)
    .eq("user_id", userId)
    .single();

  if (memberRes.error || !memberRes.data) {
    return <div>Participant introuvable dans cette cohorte.</div>;
  }

  const member = memberRes.data;
  const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;

  async function updateParticipant(formData: FormData) {
    "use server";
    const supabase = await createClient();

    const role = String(formData.get("role") || "participant");
    const departmentCode = String(formData.get("department_code") || "").trim();

    // 1. Update role in cohort_members
    const { error: memberError } = await supabase
      .from("cohort_members")
      .update({
        member_role: role,
        department_code: departmentCode || null,
      })
      .eq("cohort_id", id)
      .eq("user_id", userId);

    if (memberError) {
      redirect(`/admin/cohorts/${id}/participants/${userId}?error=${encodeURIComponent(memberError.message)}`);
    }
    
    // 2. Update profile department_code as well (optional but good for sync)
    if (departmentCode) {
        await supabase
        .from("profiles")
        .update({ department_code: departmentCode })
        .eq("id", userId);
    }

    redirect(`/admin/cohorts/${id}/participants/${userId}?saved=1`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/cohorts/${id}?tab=participants`}>← Retour liste</Link>
        </Button>
        <h1 className="text-2xl font-bold">
            {profile?.display_name || "Anonyme"}
        </h1>
      </div>

      {saved && (
        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
          Participant mis à jour.
        </div>
      )}
      
      {errorMsg && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          Erreur : {errorMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assignation</CardTitle>
          <CardDescription>Gérer le rôle et le département officiel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateParticipant} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email (Info)</Label>
                <Input disabled value={profile?.email || "N/A"} />
              </div>
              <div className="space-y-2">
                 <Label>Métier (Profil)</Label>
                 <Input disabled value={profile?.trade || "N/A"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select name="role" defaultValue={member.member_role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participant">Participant</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department_code">Département (Officiel)</Label>
                <Input 
                    id="department_code" 
                    name="department_code" 
                    placeholder="75" 
                    defaultValue={member.department_code || ""} 
                />
                <p className="text-xs text-muted-foreground">
                    C'est ce code qui compte pour l'unicité du département.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit">Enregistrer l'assignation</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Infos Profil</CardTitle>
              <CardDescription>Données saisies par l'utilisateur.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-muted-foreground">Display Name</div>
                  <div className="col-span-2">{profile?.display_name || "—"}</div>
                  
                  <div className="font-medium text-muted-foreground">Département souhaité</div>
                  <div className="col-span-2">{profile?.department_code || "—"}</div>
                  
                  <div className="font-medium text-muted-foreground">ID</div>
                  <div className="col-span-2 font-mono text-xs">{userId}</div>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
