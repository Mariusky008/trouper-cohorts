export default function AdminPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="text-sm text-muted-foreground">Entrée simplifiée en mode secours.</p>
      <a className="underline underline-offset-2" href="/admin/humain">
        Ouvrir admin humain
      </a>
    </section>
  );
}
