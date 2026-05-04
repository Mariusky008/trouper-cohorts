import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  // Check if admin with explicit status check
  // Using supabaseAdmin (service role) to bypass RLS in case user doesn't have read access to admins table
  let adminData: { user_id: string } | null = null;
  let adminError: unknown = null;
  try {
    const supabaseAdmin = createAdminClient();
    const result = await supabaseAdmin
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    adminData = (result.data as { user_id: string } | null) || null;
    adminError = result.error;
  } catch (error) {
    adminError = error;
  }

  if (adminError) {
    console.error("Admin Check Error:", adminError);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Contrôle admin indisponible</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Le service de vérification des droits admin ne répond pas. Réessayez dans quelques minutes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/popey-human/admin-login?next=%2Fadmin%2Fhumain">Se reconnecter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Retour accueil</Link>
          </Button>
        </div>
      </div>
    );
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
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/popey-human/admin-login?next=%2Fadmin%2Fhumain">Se connecter en admin</Link>
          </Button>
          <form method="post" action="/auth/signout?next=%2Fpopey-human%2Fadmin-login%3Fnext%3D%252Fadmin%252Fhumain">
            <Button type="submit" variant="outline">
              Changer de compte
            </Button>
          </form>
          <Button asChild variant="outline">
            <Link href="/app/today">Retour à l&apos;app</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-6">
          <Link href="/admin/humain" className="font-bold text-lg">
            Trouper Admin
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/admin/network" className="hover:underline text-purple-600">
              Réseau
            </Link>
            <Link href="/admin/humain" className="hover:underline text-emerald-700">
              100% Humain
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
            <Link href="/admin/humain/marketplace">Marketplace</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/humain/affiliation">Affiliation</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/humain/chat">Chat WhatsApp</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/today">Voir App</Link>
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
