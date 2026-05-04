import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminNoServiceWorkerGuard } from "@/components/admin/admin-no-sw-guard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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
          <span className="text-xs text-muted-foreground hidden sm:inline-block">Admin</span>
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
