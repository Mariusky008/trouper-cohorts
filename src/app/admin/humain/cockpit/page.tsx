import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminHumanDashboard } from "@/lib/actions/human-admin-dashboard";
import { getSmartScanAdminDailyAnalytics } from "@/lib/actions/human-smart-scan";
import { buildAdminHumanHref, pickParam } from "@/lib/url/admin-human-navigation";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

type SmartScanTotals = {
  actionsTotal: number;
  actionsSent: number;
  qualificationsTotal: number;
  outcomesConverted: number;
  followupOps: number;
  externalClicks: number;
  analyticsEvents: number;
};

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
    smartScanDays?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const start = pickParam(params, ["cockpitStart", "start"], "");
  const end = pickParam(params, ["cockpitEnd", "end"], "");
  const topSort = pickParam(params, ["topSort"], "value_desc");
  const signalSort = pickParam(params, ["signalSort"], "value_desc");
  const smartScanDaysRaw = pickParam(params, ["smartScanDays"], "14");
  const smartScanDays = Math.max(1, Math.min(90, Number(smartScanDaysRaw) || 14));
  const topPage = Math.max(1, Number(params.topPage || "1") || 1);
  const signalPage = Math.max(1, Number(params.signalPage || "1") || 1);
  const topPageSize = 5;
  const [data, smartScanAnalytics] = await Promise.all([
    getAdminHumanDashboard({ startDate: start, endDate: end }),
    getSmartScanAdminDailyAnalytics(smartScanDays),
  ]);
  const exportQuery = new URLSearchParams();
  if (start) exportQuery.set("start", start);
  if (end) exportQuery.set("end", end);
  const exportSuffix = exportQuery.toString() ? `?${exportQuery.toString()}` : "";
  const smartScanExportQuery = new URLSearchParams();
  smartScanExportQuery.set("days", String(smartScanDays));
  const smartScanExportSuffix = `?${smartScanExportQuery.toString()}`;
  const sharedParams = {
    ...params,
    cockpitStart: start,
    cockpitEnd: end,
    topSort,
    topPage: String(topPage),
    signalSort,
    signalPage: String(signalPage),
    smartScanDays: String(smartScanDays),
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
  const smartScanDaily = (smartScanAnalytics.daily as Array<Record<string, unknown>>) || [];
  const smartScanTotals = smartScanDaily.reduce<SmartScanTotals>(
    (acc, row) => {
      acc.actionsTotal += toNumber(row.actions_total);
      acc.actionsSent += toNumber(row.actions_sent);
      acc.qualificationsTotal += toNumber(row.qualifications_total);
      acc.outcomesConverted += toNumber(row.outcomes_converted);
      acc.followupOps +=
        toNumber(row.followup_copied) +
        toNumber(row.followup_replied) +
        toNumber(row.followup_converted) +
        toNumber(row.followup_not_interested) +
        toNumber(row.followup_ignored);
      acc.externalClicks += toNumber(row.external_click_linkedin) + toNumber(row.external_click_whatsapp_group);
      acc.analyticsEvents +=
        toNumber(row.analytics_contact_opened) +
        toNumber(row.analytics_trust_level_set) +
        toNumber(row.analytics_whatsapp_sent) +
        toNumber(row.analytics_daily_goal_progressed);
      return acc;
    },
    {
      actionsTotal: 0,
      actionsSent: 0,
      qualificationsTotal: 0,
      outcomesConverted: 0,
      followupOps: 0,
      externalClicks: 0,
      analyticsEvents: 0,
    }
  );
  const smartScanSentToConversionRate =
    smartScanTotals.actionsSent > 0 ? Math.round((smartScanTotals.outcomesConverted / smartScanTotals.actionsSent) * 100) : 0;
  const smartScanLatestDay = smartScanDaily.length > 0 ? smartScanDaily[smartScanDaily.length - 1] : null;
  const smartScanRecentDays = smartScanDaily.slice(-7).reverse();

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
            <Link href={`/admin/humain/cockpit/export/smart-scan${smartScanExportSuffix}`}>Exporter Smart Scan CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/humain/cockpit/export/smart-scan-details${smartScanExportSuffix}`}>Exporter Smart Scan Détail CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/api/admin/humain/smart-scan/analytics-pii-audit?days=${smartScanDays}`}>Audit PII Smart Scan (JSON)</Link>
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

      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black">Smart Scan KPI</h2>
            <p className="text-xs text-muted-foreground">Agrégats journaliers Smart Scan admin.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <Link className="rounded border px-2 py-1" href={cockpitHref({ smartScanDays: "7" })}>
              7 jours
            </Link>
            <Link className="rounded border px-2 py-1" href={cockpitHref({ smartScanDays: "14" })}>
              14 jours
            </Link>
            <Link className="rounded border px-2 py-1" href={cockpitHref({ smartScanDays: "30" })}>
              30 jours
            </Link>
          </div>
        </div>
        {smartScanAnalytics.error && (
          <p className="mt-2 text-sm text-red-600">
            Smart Scan indisponible: {smartScanAnalytics.error}
          </p>
        )}
        {!smartScanAnalytics.error && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Actions ({smartScanDays}j)</p>
              <p className="mt-1 text-2xl font-black">{smartScanTotals.actionsTotal}</p>
              <p className="text-xs text-muted-foreground">Envoyées: {smartScanTotals.actionsSent}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Qualifications</p>
              <p className="mt-1 text-2xl font-black">{smartScanTotals.qualificationsTotal}</p>
              <p className="text-xs text-muted-foreground">Conversions: {smartScanTotals.outcomesConverted}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Taux Conversion</p>
              <p className="mt-1 text-2xl font-black">{smartScanSentToConversionRate}%</p>
              <p className="text-xs text-muted-foreground">Base: actions envoyées</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Ops & Tracking</p>
              <p className="mt-1 text-2xl font-black">{smartScanTotals.followupOps + smartScanTotals.externalClicks}</p>
              <p className="text-xs text-muted-foreground">
                Follow-up: {smartScanTotals.followupOps} • Clics: {smartScanTotals.externalClicks}
              </p>
            </div>
          </div>
        )}
        {!smartScanAnalytics.error && smartScanLatestDay && (
          <p className="mt-2 text-xs text-muted-foreground">
            Dernier jour: {String(smartScanLatestDay.day)} • Events analytics: {toNumber(smartScanLatestDay.analytics_contact_opened) +
              toNumber(smartScanLatestDay.analytics_trust_level_set) +
              toNumber(smartScanLatestDay.analytics_whatsapp_sent) +
              toNumber(smartScanLatestDay.analytics_daily_goal_progressed)}
          </p>
        )}
        {!smartScanAnalytics.error && smartScanRecentDays.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded border">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold">Jour</th>
                  <th className="px-2 py-2 text-right font-semibold">Actions</th>
                  <th className="px-2 py-2 text-right font-semibold">Envoyées</th>
                  <th className="px-2 py-2 text-right font-semibold">Qualif</th>
                  <th className="px-2 py-2 text-right font-semibold">Conv.</th>
                  <th className="px-2 py-2 text-right font-semibold">Follow-up</th>
                  <th className="px-2 py-2 text-right font-semibold">Clics ext.</th>
                </tr>
              </thead>
              <tbody>
                {smartScanRecentDays.map((row) => (
                  <tr key={String(row.day)} className="border-t">
                    <td className="px-2 py-2">{String(row.day)}</td>
                    <td className="px-2 py-2 text-right">{toNumber(row.actions_total)}</td>
                    <td className="px-2 py-2 text-right">{toNumber(row.actions_sent)}</td>
                    <td className="px-2 py-2 text-right">{toNumber(row.qualifications_total)}</td>
                    <td className="px-2 py-2 text-right">{toNumber(row.outcomes_converted)}</td>
                    <td className="px-2 py-2 text-right">
                      {toNumber(row.followup_copied) +
                        toNumber(row.followup_replied) +
                        toNumber(row.followup_converted) +
                        toNumber(row.followup_not_interested) +
                        toNumber(row.followup_ignored)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {toNumber(row.external_click_linkedin) + toNumber(row.external_click_whatsapp_group)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
