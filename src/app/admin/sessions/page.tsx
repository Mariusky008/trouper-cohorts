import { createClient } from "@/lib/supabase/server";
import { SessionsManager } from "@/components/admin/sessions-manager";

export default async function AdminSessionsPage() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("public_sessions")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestion des Sessions (Page d'accueil)</h1>
      <p className="text-muted-foreground">
        Définissez ici les dates qui apparaîtront dans le formulaire d'inscription.
      </p>
      
      <SessionsManager initialSessions={sessions || []} />
    </div>
  );
}
