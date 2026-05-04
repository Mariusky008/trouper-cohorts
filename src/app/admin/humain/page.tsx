export default async function AdminHumainPage() {
  const sections = [
    {
      title: "Pilotage commercial",
      links: [
        { href: "/admin/humain/marketplace", label: "Marketplace" },
        { href: "/admin/humain/marketplace/inscriptions", label: "Inscriptions marketplace" },
        { href: "/admin/humain/marketplace/tour-de-controle", label: "Tour de controle" },
        { href: "/admin/humain/privileges", label: "Privilèges" },
        { href: "/admin/humain/affiliation", label: "Affiliation publique" },
      ],
    },
    {
      title: "Opérations humaines",
      links: [
        { href: "/admin/humain/chat", label: "Chat WhatsApp admin" },
        { href: "/admin/humain/eclaireurs", label: "Éclaireurs" },
        { href: "/admin/humain/membres", label: "Membres" },
        { href: "/admin/humain/clients", label: "Clients" },
        { href: "/admin/humain/notifications", label: "Notifications" },
      ],
    },
    {
      title: "Suivi & contrôle",
      links: [
        { href: "/admin/humain/cockpit", label: "Cockpit" },
        { href: "/admin/humain/commissions", label: "Commissions" },
        { href: "/admin/humain/permissions", label: "Permissions" },
        { href: "/admin/humain/sphere", label: "Sphère" },
        { href: "/app/today", label: "Voir l'app" },
      ],
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
        <h1 className="text-3xl font-black">Admin Popey Human</h1>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Tableau de bord admin rétabli avec accès rapide aux modules utiles webapp, sans chargement serveur
        additionnel au niveau de cette page.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {section.title}
            </h2>
            <ul className="space-y-2 text-sm">
              {section.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="underline underline-offset-2">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
