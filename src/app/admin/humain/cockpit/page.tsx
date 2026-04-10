import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminHumanDashboard } from "@/lib/actions/human-admin-dashboard";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default async function AdminHumainCockpitPage({
  searchParams,
}: {
  searchParams?: Promise<{ start?: string; end?: string }>;
}) {
  const params = (await searchParams) || {};
  const start = params.start || "";
  const end = params.end || "";
  const data = await getAdminHumanDashboard({ startDate: start, endDate: end });
  const exportQuery = new URLSearchParams();
  if (start) exportQuery.set("start", start);
  if (end) exportQuery.set("end", end);
  const exportSuffix = exportQuery.toString() ? `?${exportQuery.toString()}` : "";

  if (data.error || !data.kpis) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-black">Cockpit KPI Humain</h1>
        <p className="text-sm text-red-600">{data.error || "Données indisponibles."}</p>
      </section>
    );
  }

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
            <Link href={`/admin/humain/cockpit/export/leads${exportSuffix}`}>Exporter Leads CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/humain/cockpit/export/signals${exportSuffix}`}>Exporter Signals CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/humain/cockpit/export/cash${exportSuffix}`}>Exporter Cash CSV</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/humain">Retour espace humain</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
        Exports disponibles: leads, signaux et cash au format CSV. Les téléchargements sont réservés aux admins.
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-black">Top membres (leads)</h2>
          {data.topMembersByLeads.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Aucune donnée.</p>}
          {data.topMembersByLeads.length > 0 && (
            <ul className="mt-2 space-y-2">
              {data.topMembersByLeads.map((row) => (
                <li key={`lead-${row.label}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{row.label}</span>
                  <span className="font-bold">{row.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-black">Top membres (signals)</h2>
          {data.topMembersBySignals.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Aucune donnée.</p>}
          {data.topMembersBySignals.length > 0 && (
            <ul className="mt-2 space-y-2">
              {data.topMembersBySignals.map((row) => (
                <li key={`signal-${row.label}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{row.label}</span>
                  <span className="font-bold">{row.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
