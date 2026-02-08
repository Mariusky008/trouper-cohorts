import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const saved = params?.saved === "1";

  const profileRes = await supabase
    .from("profiles")
    .select("display_name, trade, department_code")
    .eq("id", user.id)
    .maybeSingle();

  async function saveProfile(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const displayName = String(formData.get("display_name") || "").trim();
    const trade = String(formData.get("trade") || "").trim();
    const departmentCode = String(formData.get("department_code") || "").trim();

    await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      trade: trade || null,
      department_code: departmentCode || null,
    });

    redirect("/app/settings?saved=1");
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Profil</CardTitle>
          <CardDescription>Ces infos servent au coach et à l’assignation département.</CardDescription>
        </CardHeader>
        <CardContent>
          {saved && (
            <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
              Profil mis à jour.
            </div>
          )}
          <form action={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Nom affiché</Label>
              <Input
                id="display_name"
                name="display_name"
                placeholder="Prénom Nom"
                defaultValue={profileRes.data?.display_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade">Métier</Label>
              <Input
                id="trade"
                name="trade"
                placeholder="Coach sportif"
                defaultValue={profileRes.data?.trade ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department_code">Département (Souhaité)</Label>
              <Input
                id="department_code"
                name="department_code"
                placeholder="75"
                defaultValue={profileRes.data?.department_code ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                L'assignation officielle se fera par le coach.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <form action={signOut}>
          <Button variant="ghost" type="submit" className="text-muted-foreground hover:text-destructive">
            Se déconnecter
          </Button>
        </form>
      </div>
    </div>
  );
}

