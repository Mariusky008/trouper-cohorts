import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminHumanDashboard } from "@/lib/actions/human-admin-dashboard";
import { buildAdminHumanHref, pickParam } from "@/lib/url/admin-human-navigation";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default async function AdminHumainCockpitPage({
  searchParams,
}: {
  searchParams?: Promise<{
    start?: string;
    end?: string;
    cockpitStart?: string;
    cockpitEnd?: string;
    topSort?: string;
    topPage?: string;
    signalSort?: string;
    signalPage?: string;
    clientsSort?: string;
    clientsPage?: string;
    notificationsSort?: string;
    notificationsPage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const start = pickParam(params, ["cockpitStart", "start"], "");
  const end = pickParam(params, ["cockpitEnd", "end"], "");
  const topSort = pickParam(params, ["topSort"], "value_desc");
  const signalSort = pickParam(params, ["signalSort"], "value_desc");
  const topPage = Math.max(1, Number(params.topPage || "1") || 1);
  const signalPage = Math.max(1, Number(params.signalPage || "1") || 1);
  const topPageSize = 5;
  const data = await getAdminHumanDashboard({ startDate: start, endDate: end });
  const exportQuery = new URLSearchParams();
  if (start) exportQuery.set("start", start);
  if (end) exportQuery.set("end", end);
  const exportSuffix = exportQuery.toString() ? `?${exportQuery.toString()}` : "";
  const sharedParams = {
    ...params,
    cockpitStart: start,
    cockpitEnd: end,
    topSort,
    topPage: String(topPage),
    signalSort,
    signalPage: String(signalPage),
  };
  const cockpitHref = (updates: Record<string, string>) =>
    buildAdminHumanHref("/admin/humain/cockpit", sharedParams, { ...updates, start: "", end: "" });

  if (data.error || !data.kpis) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-black">Cockpit KPI Humain</h1>
        <p className="text-sm text-red-600">{data.error || "Données indisponibles."}</p>
      </section>
    );
  }

  const sortedTopLeads = [...data.topMembersByLeads].sort((a, b) => {
    if (topSort === "label") return a.label.localeCompare(b.label, "fr");
    if (topSort === "value_asc") return a.value - b.value;
    return b.value - a.value;
  });
  const sortedTopSignals = [...data.topMembersBySignals].sort((a, b) => {
    if (signalSort === "label") return a.label.localeCompare(b.label, "fr");
    if (signalSort === "value_asc") return a.value - b.value;
    return b.value - a.value;
  });
  const totalTopPages = Math.max(1, Math.ceil(sortedTopLeads.length / topPageSize));
  const totalSignalPages = Math.max(1, Math.ceil(sortedTopSignals.length / topPageSize));
  const safeTopPage = Math.min(topPage, totalTopPages);
  const safeSignalPage = Math.min(signalPage, totalSignalPages);
  const pagedTopLeads = sortedTopLeads.slice((safeTopPage - 1) * topPageSize, safeTopPage * topPageSize);
  const pagedTopSignals = sortedTopSignals.slice((safeSignalPage - 1) * topPageSize, safeSignalPage * topPageSize);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Cockpit KPI</h1>
          <p className="text-sm text-muted-foreground">Vue globale membres, pipeline, signaux, cash et notifications.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={buildAdminHumanHref("/admin/humain/clients", sharedParams)}>Aller aux clients</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={buildAdminHumanHref("/admin/humain/notifications", sharedParams)}>Aller aux notifications</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/humain/cockpit/export/leads${exportSuffix}`}>Exporter Leads CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/humain/cockpit/export/signals${exportSuffix}`}>Exporter Signals CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/humain/cockpit/export/cash${exportSuffix}`}>Exporter Cash CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/humain/cockpit/export/commissions${exportSuffix}`}>Exporter Commissions CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/humain/commissions">Gérer les commissions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/humain">Retour espace humain</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
        Exports disponibles: leads, signaux, cash et commissions au format CSV. Les téléchargements sont réservés aux admins.
      </div>

      <form className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div>
          <label htmlFor="start" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Début
          </label>
          <input id="start" name="start" type="date" defaultValue={start} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="end" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Fin
          </label>
          <input id="end" name="end" type="date" defaultValue={end} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </div>
        <button className="rounded bg-black px-4 py-2 text-sm font-bold text-white">Appliquer</button>
        <Button asChild variant="outline">
          <Link href="/admin/humain/cockpit">Réinitialiser</Link>
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Membres actifs</p>
          <p className="mt-2 text-3xl font-black">{data.kpis.membersActive}</p>
          <p className="text-xs text-muted-foreground">En pause: {data.kpis.membersPaused}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Leads</p>
          <p className="mt-2 text-3xl font-black">{data.kpis.leadsOpen}</p>
          <p className="text-xs text-muted-foreground">Signés: {data.kpis.leadsWon}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Signals actifs</p>
          <p className="mt-2 text-3xl font-black">{data.kpis.signalsOpen}</p>
          <p className="text-xs text-muted-foreground">Force moyenne: {data.kpis.signalsAvgStrength}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cash entrées</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{euros(data.kpis.cashIn)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cash sorties</p>
          <p className="mt-2 text-3xl font-black text-rose-700">{euros(data.kpis.cashOut)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notifications non lues</p>
          <p className="mt-2 text-3xl font-black">{data.kpis.notificationsUnread}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Commissions en attente</p>
          <p className="mt-2 text-3xl font-black text-amber-700">{euros(data.kpis.commissionsPending)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Commissions payées</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{euros(data.kpis.commissionsPaid)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black">Top membres (leads)</h2>
            <div className="flex gap-2 text-xs">
              <Link className="rounded border px-2 py-1" href={cockpitHref({ topSort: "value_desc", topPage: "1", signalSort, signalPage: String(safeSignalPage) })}>
                Score desc
              </Link>
              <Link className="rounded border px-2 py-1" href={cockpitHref({ topSort: "value_asc", topPage: "1", signalSort, signalPage: String(safeSignalPage) })}>
                Score asc
              </Link>
              <Link className="rounded border px-2 py-1" href={cockpitHref({ topSort: "label", topPage: "1", signalSort, signalPage: String(safeSignalPage) })}>
                Nom A-Z
              </Link>
            </div>
          </div>
          {sortedTopLeads.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Aucune donnée.</p>}
          {sortedTopLeads.length > 0 && (
            <ul className="mt-2 space-y-2">
              {pagedTopLeads.map((row) => (
                <li key={`lead-${row.label}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{row.label}</span>
                  <span className="font-bold">{row.value}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <Link
              className="rounded border px-2 py-1"
              href={cockpitHref({ topSort, topPage: String(Math.max(1, safeTopPage - 1)), signalSort, signalPage: String(safeSignalPage) })}
            >
              Précédent
            </Link>
            <Link
              className="rounded border px-2 py-1"
              href={cockpitHref({ topSort, topPage: String(Math.min(totalTopPages, safeTopPage + 1)), signalSort, signalPage: String(safeSignalPage) })}
            >
              Suivant
            </Link>
            <span className="text-muted-foreground">
              Page {safeTopPage}/{totalTopPages}
            </span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black">Top membres (signals)</h2>
            <div className="flex gap-2 text-xs">
              <Link className="rounded border px-2 py-1" href={cockpitHref({ signalSort: "value_desc", signalPage: "1", topSort, topPage: String(safeTopPage) })}>
                Score desc
              </Link>
              <Link className="rounded border px-2 py-1" href={cockpitHref({ signalSort: "value_asc", signalPage: "1", topSort, topPage: String(safeTopPage) })}>
                Score asc
              </Link>
              <Link className="rounded border px-2 py-1" href={cockpitHref({ signalSort: "label", signalPage: "1", topSort, topPage: String(safeTopPage) })}>
                Nom A-Z
              </Link>
            </div>
          </div>
          {sortedTopSignals.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Aucune donnée.</p>}
          {sortedTopSignals.length > 0 && (
            <ul className="mt-2 space-y-2">
              {pagedTopSignals.map((row) => (
                <li key={`signal-${row.label}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{row.label}</span>
                  <span className="font-bold">{row.value}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <Link
              className="rounded border px-2 py-1"
              href={cockpitHref({ signalSort, signalPage: String(Math.max(1, safeSignalPage - 1)), topSort, topPage: String(safeTopPage) })}
            >
              Précédent
            </Link>
            <Link
              className="rounded border px-2 py-1"
              href={cockpitHref({ signalSort, signalPage: String(Math.min(totalSignalPages, safeSignalPage + 1)), topSort, topPage: String(safeTopPage) })}
            >
              Suivant
            </Link>
            <span className="text-muted-foreground">
              Page {safeSignalPage}/{totalSignalPages}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
