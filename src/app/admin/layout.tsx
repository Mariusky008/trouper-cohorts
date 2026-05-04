export const dynamic = "force-static";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-6">
          <a href="/admin/humain" className="font-bold text-lg">
            Trouper Admin
          </a>
          <nav className="flex gap-4 text-sm font-medium">
            <a href="/admin/humain" className="hover:underline text-emerald-700">
              100% Humain
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">Admin</span>
          <a href="/admin/humain/marketplace" className="text-sm underline underline-offset-2">Marketplace</a>
          <a href="/admin/humain/affiliation" className="text-sm underline underline-offset-2">Affiliation</a>
          <a href="/admin/humain/chat" className="text-sm underline underline-offset-2">Chat WhatsApp</a>
          <a href="/app/today" className="text-sm underline underline-offset-2">Voir App</a>
          <a href="/popey-human/login" className="text-sm underline underline-offset-2">Déconnexion</a>
        </div>
      </header>
      <main className="flex-1 p-6 w-full max-w-none">{children}</main>
    </div>
  );
}
