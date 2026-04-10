import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMyHumanDashboard } from "@/lib/actions/human-dashboard";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default async function PopeyHumanAppPage() {
  const dashboard = await getMyHumanDashboard();
  const firstName = dashboard.profile?.first_name || "Membre";

  return (
    <section className="space-y-5">
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-black/60">Popey Human</p>
          <h1 className="mt-2 text-3xl font-black">Cockpit membre</h1>
          <p className="mt-2 text-sm text-black/70">Bonjour {firstName}, voici la vue unifiée Clients / Signal / Cash.</p>
          {dashboard.error && (
            <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{dashboard.error}</p>
          )}
        </div>

        {!dashboard.error && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-black/60">Leads ouverts</p>
              <p className="mt-2 text-2xl font-black">{dashboard.kpis.leadsOpen}</p>
              <p className="text-xs text-black/60">Leads à traiter dans votre scope</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-black/60">Leads pris par moi</p>
              <p className="mt-2 text-2xl font-black">{dashboard.kpis.leadsTakenByMe}</p>
              <p className="text-xs text-black/60">Deals dont vous êtes propriétaire</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-black/60">Signals actifs</p>
              <p className="mt-2 text-2xl font-black">{dashboard.kpis.signalsOpen}</p>
              <p className="text-xs text-black/60">Score moyen: {dashboard.kpis.signalsAvgScore}/100</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-black/60">Notifications non lues</p>
              <p className="mt-2 text-2xl font-black">{dashboard.kpis.unreadNotifications}</p>
              <p className="text-xs text-black/60">Messages admin ou ciblés</p>
            </div>
            <div className="rounded-xl border bg-white p-4 sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-black/60">Cash - entrées</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">{euros(dashboard.kpis.cashIn)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-black/60">Cash - sorties / net</p>
              <p className="mt-2 text-xl font-black text-rose-700">
                {euros(dashboard.kpis.cashOut)} /{" "}
                <span className={dashboard.kpis.cashNet >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {euros(dashboard.kpis.cashNet)}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/popey-human/app/clients">Ouvrir les clients</Link>
            </Button>
            <Button asChild>
              <Link href="/popey-human/app/cash">Ouvrir Cash</Link>
            </Button>
            <Button asChild>
              <Link href="/popey-human/app/signal">Ouvrir Signal</Link>
            </Button>
            <Button asChild>
              <Link href="/popey-human/app/annuaire">Ouvrir l&apos;annuaire</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/popey-human/app/profile">Mettre à jour mon profil</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/popey-human/app/notifications">Voir mes notifications</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/popey-human">Retour landing</Link>
            </Button>
          </div>
        </div>
    </section>
  );
}
