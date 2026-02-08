import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Mon Profil</h1>
        <form action="/auth/signout" method="post">
            <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-5 w-5" />
            </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            Complète ton profil pour que ton équipage puisse te connaître.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialData={profile || {}} />
        </CardContent>
      </Card>
    </div>
  );
}
