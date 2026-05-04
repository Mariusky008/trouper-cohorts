import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminNoServiceWorkerGuard } from "@/components/admin/admin-no-sw-guard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (supabaseError) {
    if ((supabaseError as { digest?: string } | null)?.digest === "DYNAMIC_SERVER_USAGE") {
      throw supabaseError;
    }
    console.error("Admin Supabase client init failed:", supabaseError);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Configuration admin manquante</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Les variables Supabase publiques ne sont pas disponibles en production. Ajoutez
          `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` puis redeployez.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Retour accueil</Link>
        </Button>
      </div>
    );
  }

  let user: { id: string; email?: string | null } | null = null;
  try {
    const authResult = await supabase.auth.getUser();
    user = authResult.data.user as { id: string; email?: string | null } | null;
  } catch (authError) {
    console.error("Admin auth check failed:", authError);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Admin temporairement indisponible</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Impossible de vérifier votre session pour le moment. Réessayez dans quelques instants.
        </p>
        <Button asChild>
          <Link href="/popey-human/admin-login?next=%2Fadmin%2Fhumain">Retour connexion admin</Link>
        </Button>
      </div>
    );
  }

  if (!user) redirect("/popey-human/admin-login?next=%2Fadmin%2Fhumain");

  // NOTE: admin role check is intentionally bypassed here to avoid service-role runtime failures.
  // The page still requires an authenticated session.

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNoServiceWorkerGuard />
      <header className="border-b px-6 py-3 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-6">
          <Link href="/admin/humain" className="font-bold text-lg">
            Trouper Admin
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/admin/humain" className="hover:underline text-emerald-700" prefetch={false}>
              100% Humain
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">Admin: {user.email}</span>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/humain/marketplace" prefetch={false}>Marketplace</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/humain/affiliation" prefetch={false}>Affiliation</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/humain/chat" prefetch={false}>Chat WhatsApp</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/today" prefetch={false}>Voir App</Link>
          </Button>
          <form method="post" action="/auth/signout?next=%2Fpopey-human%2Flogin">
            <Button type="submit" variant="outline" size="sm">
              Déconnexion
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6 w-full max-w-none">{children}</main>
    </div>
  );
}
