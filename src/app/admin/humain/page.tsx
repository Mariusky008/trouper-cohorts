export default async function AdminHumainPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
        <h1 className="text-3xl font-black">Admin Popey Human</h1>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Point d&apos;entrée simplifié pour stabiliser l&apos;admin.
      </p>
      <div className="grid gap-2 rounded-xl border bg-card p-5 text-sm">
        <a href="/admin/humain/marketplace" className="underline underline-offset-2">
          Ouvrir le marketplace
        </a>
        <a href="/admin/humain/privileges" className="underline underline-offset-2">
          Ouvrir le pilotage privilèges
        </a>
        <a href="/admin/humain/affiliation" className="underline underline-offset-2">
          Ouvrir l&apos;affiliation publique
        </a>
        <a href="/admin/humain/chat" className="underline underline-offset-2">
          Ouvrir le chat WhatsApp
        </a>
      </div>
    </section>
  );
}
