export default async function AdminHumainPage() {
  const sections = [
    {
      title: "Pilotage commercial",
      links: [
        { href: "/admin/humain/marketplace", label: "Marketplace" },
        { href: "/admin/humain/marketplace/inscriptions", label: "Inscriptions marketplace" },
        { href: "/admin/humain/marketplace/tour-de-controle", label: "Tour de controle" },
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
      ],
    },
  ];

  const quickActions = [
    { href: "/admin/humain/marketplace", label: "Suivre les places", description: "Demandes, offres et statuts en cours." },
    { href: "/admin/humain/chat", label: "Lire les messages WhatsApp", description: "Boîte de réception admin et réponses." },
    { href: "/admin/humain/affiliation", label: "Valider les tickets affiliation", description: "Suivi des apporteurs et commissions." },
    { href: "/admin/humain/cockpit", label: "Contrôler le cockpit", description: "Vue synthèse des signaux et exports." },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">100% Humain</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Admin Popey Human</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Espace de pilotage organisé pour accéder rapidement aux actions quotidiennes importantes.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="rounded-xl border bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section, index) => (
          <article key={section.title} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">{section.title}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Bloc {index + 1}
              </span>
            </div>
            <ul className="space-y-2.5 text-sm">
              {section.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-slate-100"
                  >
                    <span>{link.label}</span>
                    <span className="text-muted-foreground">Ouvrir</span>
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
