import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  listVisibleHumanLeads,
  markHumanLeadLostAction,
  markHumanLeadSignedAction,
  takeHumanLeadAction,
} from "@/lib/actions/human-leads";

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

export default async function PopeyHumanClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    leadStatus?: string;
    leadMessage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const leadStatus = typeof params.leadStatus === "string" ? params.leadStatus : "";
  const leadMessage = typeof params.leadMessage === "string" ? params.leadMessage : "";
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
        {leadStatus === "success" && (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {leadMessage || "Action appliquée."}{" "}
            <Link className="underline" href="/popey-human/app/clients">
              Effacer
            </Link>
          </p>
        )}
        {leadStatus === "error" && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {leadMessage || "Action impossible."}{" "}
            <Link className="underline" href="/popey-human/app/clients">
              Effacer
            </Link>
          </p>
        )}

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
                  <div className="flex flex-wrap gap-2">
                    {lead.status === "nouveau" && (
                      <form action={takeHumanLeadAction}>
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <input type="hidden" name="current_url" value="/popey-human/app/clients" />
                        <button className="rounded border px-3 py-1.5 text-xs font-semibold">Prendre ce deal</button>
                      </form>
                    )}
                    {lead.status === "pris" && (
                      <>
                        <form action={markHumanLeadSignedAction}>
                          <input type="hidden" name="lead_id" value={lead.id} />
                          <input type="hidden" name="current_url" value="/popey-human/app/clients" />
                          <button className="rounded border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            Marquer signé
                          </button>
                        </form>
                        <form action={markHumanLeadLostAction}>
                          <input type="hidden" name="lead_id" value={lead.id} />
                          <input type="hidden" name="current_url" value="/popey-human/app/clients" />
                          <button className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700">
                            Marquer perdu
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
