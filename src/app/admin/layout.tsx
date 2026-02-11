import { createClient } from "@/lib/supabase/server";
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

  // Check if admin
  const { data: adminData } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p>Tu n'as pas les droits administrateur.</p>
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
          Exécute ce SQL dans Supabase pour devenir admin :<br />
          <code>insert into public.admins (user_id) values ('{user.id}');</code>
        </p>
        <Button asChild>
          <Link href="/app/today">Retour à l'app</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-yellow-100 border-4 border-red-500">
      <header className="border-b px-6 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-6">
          <Link href="/admin/cohorts" className="font-bold text-lg">
            Trouper Admin <span className="text-red-600 text-xs ml-2">DEBUG BUILD {new Date().toLocaleTimeString()}</span>
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
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
