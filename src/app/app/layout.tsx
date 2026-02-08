import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold">
              Trouper
            </Link>
            <nav className="text-sm text-muted-foreground flex items-center gap-3">
              <Link href="/app/today">Aujourd’hui</Link>
              <Link href="/app/proof">Preuves</Link>
              <Link href="/app/leaderboard">Classement</Link>
              <Link href="/app/settings">Profil</Link>
            </nav>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Se déconnecter
            </Button>
          </form>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
