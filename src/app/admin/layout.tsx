import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminNoServiceWorkerGuard } from "@/components/admin/admin-no-sw-guard";
import { isCurrentUserAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Défense en profondeur : le middleware exige l'authentification sur /admin/humain
  // mais PAS le rôle admin. On bloque ici tout utilisateur connecté non-admin.
  // On affiche un écran 403 (pas de redirect → évite la boucle avec admin-login,
  // qui renvoie un user connecté vers /admin/humain).
  if (!(await isCurrentUserAdmin())) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-black text-slate-900">Accès réservé aux administrateurs</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Ce compte n&apos;a pas les droits administrateur. Si tu penses que c&apos;est une erreur, contacte un administrateur Popey.
        </p>
        <form method="post" action="/auth/signout?next=%2Fpopey-human%2Flogin">
          <Button type="submit" variant="outline" size="sm">
            Se déconnecter
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40">
      <AdminNoServiceWorkerGuard />
      <header className="sticky top-0 z-30 border-b bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
          <Link href="/admin/humain" className="font-bold text-lg" prefetch={false}>
            Trouper Admin
          </Link>
          <nav className="hidden gap-4 text-sm font-medium md:flex items-center">
            <a href="/admin/humain" className="hover:underline text-emerald-700">
              100% Humain
            </a>
            <a href="/admin/humain/vitrines" className="hover:underline">
              Vitrines
            </a>
            <a href="/admin/humain/marketplace" className="hover:underline">
              Marketplace
            </a>
            <a href="/admin/humain/privilege-sante" className="hover:underline font-semibold text-emerald-700">
              🩺 Santé Privilège
            </a>
            <a href="/admin/humain/affiliation" className="hover:underline">
              Affiliation
            </a>
            <a href="/admin/humain/commissions" className="hover:underline">
              Commissions
            </a>
            <span className="mx-4 h-4 w-px bg-slate-300" />
            <a href="/admin/humain/review-booster" className="hover:underline font-semibold text-amber-600 hover:text-amber-700">
              Avis Google
            </a>
            <a href="/admin/humain/review-booster/prospection" className="hover:underline font-semibold text-amber-600 hover:text-amber-700">
              Prospection
            </a>
          </nav>
        </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline-block">Admin</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/humain/chat" prefetch={false}>Chat WhatsApp</Link>
            </Button>
            <form method="post" action="/auth/signout?next=%2Fpopey-human%2Flogin">
              <Button type="submit" variant="outline" size="sm">
                Déconnexion
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
