import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listVisibleHumanLeads, takeHumanLeadAction } from "@/lib/actions/human-leads";

function statusLabel(status: "nouveau" | "pris" | "signe" | "perdu") {
  switch (status) {
    case "nouveau":
      return "Nouveau";
    case "pris":
      return "Pris";
    case "signe":
      return "Signé";
    case "perdu":
      return "Perdu";
    default:
      return status;
  }
}

export default async function PopeyHumanClientsPage() {
  const feed = await listVisibleHumanLeads();

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/60">Popey Human</p>
            <h1 className="text-3xl font-black">Clients</h1>
            <p className="text-sm text-black/70">Leads visibles selon votre niveau d&apos;accès.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/popey-human/app">Retour cockpit</Link>
          </Button>
        </div>

        {feed.error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{feed.error}</p>}

        {!feed.error && feed.leads.length === 0 && (
          <p className="rounded border bg-white px-3 py-3 text-sm text-black/70">Aucun lead visible pour le moment.</p>
        )}

        {!feed.error && feed.leads.length > 0 && (
          <div className="space-y-3">
            {feed.leads.map((lead) => (
              <article key={lead.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/60">{statusLabel(lead.status)}</p>
                    <h2 className="text-lg font-black">{lead.client_name}</h2>
                    <p className="mt-1 text-sm text-black/70">Besoin: {lead.besoin || "Non renseigné"}</p>
                    <p className="text-sm text-black/70">Budget: {lead.budget ? `${lead.budget.toLocaleString("fr-FR")} €` : "Non renseigné"}</p>
                    <p className="text-xs text-black/60">
                      Source: {lead.sourceLabel} • Propriétaire: {lead.ownerLabel}
                    </p>
                  </div>
                  {lead.status === "nouveau" && (
                    <form action={takeHumanLeadAction}>
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <button className="rounded border px-3 py-1.5 text-xs font-semibold">Prendre ce deal</button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
