import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if admin with explicit status check
  // Using supabaseAdmin (service role) to bypass RLS in case user doesn't have read access to admins table
  const supabaseAdmin = createAdminClient();
  
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
      console.error("Admin Check Error:", adminError);
  }

  if (!adminData) {
    console.error("Admin Access Denied. User:", user.id, "Admin Table Check:", adminData);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p>Tu n&apos;as pas les droits administrateur.</p>
        <div className="text-left text-xs bg-slate-100 p-4 rounded border font-mono">
            <p>User ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Admin Check: {adminData ? "Found" : "Not Found"}</p>
        </div>
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
          Exécute ce SQL dans Supabase pour devenir admin :<br />
          <code>insert into public.admins (user_id) values (&apos;{user.id}&apos;);</code>
        </p>
        <Button asChild>
          <Link href="/app/today">Retour à l&apos;app</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-6">
          <Link href="/admin/cohorts" className="font-bold text-lg">
            Trouper Admin
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/admin/cohorts" className="hover:underline">
              Cohortes
            </Link>
            <Link href="/admin/registrations" className="hover:underline">
              Inscriptions
            </Link>
            <Link href="/admin/members" className="hover:underline">
              Membres
            </Link>
            <Link href="/admin/sessions" className="hover:underline">
              Sessions (Dates)
            </Link>
            <Link href="/admin/program" className="hover:underline text-blue-600">
              Programme
            </Link>
            <Link href="/admin/network" className="hover:underline text-purple-600">
              Réseau
            </Link>
            <Link href="/admin/commando" className="hover:underline text-amber-700">
              Commando
            </Link>
            <Link href="/admin/settings" className="hover:underline">
              Équipe
            </Link>
            {/* Add more links later */}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">Admin: {user.email}</span>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/today">Voir App</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6 w-full max-w-none">{children}</main>
    </div>
  );
}
