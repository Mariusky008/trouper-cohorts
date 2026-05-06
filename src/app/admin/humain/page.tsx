import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminMarketplaceSnapshot } from "@/lib/actions/human-marketplace";

function asMeta(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export default async function AdminHumainPage() {
  const supabaseAdmin = createAdminClient();
  const snapshot = await getAdminMarketplaceSnapshot({ placeCity: "all" });
  const activationTickets = snapshot.recentActivations || [];

  // Marketplace pending = demandes pending + reviewing
  const marketplacePendingCount = Math.max(0, Number(snapshot.kpis?.offersPending || 0) + Number(snapshot.kpis?.offersReviewing || 0));

  // Commission pending = tickets en cours de workflow OU tickets validés sans décision commission explicite
  const workflowPendingCount = activationTickets.filter((ticket) => {
    const status = String(asMeta(ticket.metadata).workflow_status || "pending").trim().toLowerCase();
    return ["pending", "contacted", "in_progress", "reviewing", "rdv", "new"].includes(status);
  }).length;

  let pendingCommissionDecisionsCount = 0;
  try {
    const ids = activationTickets.map((ticket) => ticket.id);
    if (ids.length > 0) {
      const { data: decisions } = await supabaseAdmin
        .from("human_affiliate_commission_decisions")
        .select("activation_id,decision_status")
        .in("activation_id", ids);
      const byActivation = new Map(
        ((decisions as Array<{ activation_id: string; decision_status: string }> | null) || []).map((row) => [row.activation_id, row.decision_status]),
      );
      pendingCommissionDecisionsCount = activationTickets.filter((ticket) => {
        const workflow = String(asMeta(ticket.metadata).workflow_status || "pending").trim().toLowerCase();
        if (!["validated", "signed"].includes(workflow)) return false;
        const decision = String(byActivation.get(ticket.id) || "").trim().toLowerCase();
        return !["approved", "rejected"].includes(decision);
      }).length;
    }
  } catch {
    pendingCommissionDecisionsCount = 0;
  }

  // Affiliation "a traiter" = nouveaux inscrits recents + décisions commission manquantes
  let recentSignupsCount = 0;
  try {
    const sinceIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("human_scout_notification_log")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "public_affiliate_signup")
      .gte("created_at", sinceIso);
    recentSignupsCount = Number(count || 0);
  } catch {
    recentSignupsCount = 0;
  }

  const affiliationPendingCount = Math.max(0, recentSignupsCount + pendingCommissionDecisionsCount + workflowPendingCount);
  const dashboardBadges: Record<string, number> = {
    "/admin/humain/marketplace": marketplacePendingCount,
    "/admin/humain/affiliation": affiliationPendingCount,
  };

  const sections = [
    {
      title: "Pilotage commercial",
      links: [
        { href: "/admin/humain/marketplace", label: "Marketplace" },
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
              className="relative rounded-xl border bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              {dashboardBadges[action.href] > 0 ? (
                <span className="absolute right-3 top-3 inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-black text-white">
                  {dashboardBadges[action.href]}
                </span>
              ) : null}
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
                    <span className="flex items-center gap-2">
                      <span>{link.label}</span>
                      {dashboardBadges[link.href] > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                          {dashboardBadges[link.href]}
                        </span>
                      ) : null}
                    </span>
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
