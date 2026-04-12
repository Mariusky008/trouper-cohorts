import Link from "next/link";
import {
  listVisibleHumanLeads,
  markHumanLeadOpenedAction,
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
    lead?: string;
    sign?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const leadStatus = typeof params.leadStatus === "string" ? params.leadStatus : "";
  const leadMessage = typeof params.leadMessage === "string" ? params.leadMessage : "";
  const selectedLeadId = typeof params.lead === "string" ? params.lead : "";
  const signLeadId = typeof params.sign === "string" ? params.sign : "";
  const feed = await listVisibleHumanLeads();
  const selectedLead = !feed.error ? feed.leads.find((lead) => lead.id === selectedLeadId) || null : null;
  const signLead = !feed.error ? feed.leads.find((lead) => lead.id === signLeadId) || null : null;

  const withQuery = (updates: Record<string, string>) => {
    const query = new URLSearchParams();
    Object.entries({
      ...(leadStatus ? { leadStatus } : {}),
      ...(leadMessage ? { leadMessage } : {}),
      ...updates,
    }).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.toString();
    return suffix ? `/popey-human/app/clients?${suffix}` : "/popey-human/app/clients";
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]">Clients reçus</p>
          <h1 className="text-3xl font-black">Clients</h1>
          <p className="text-sm text-white/75">Touchez un client pour ouvrir sa fiche complète.</p>
        </div>
        <Link
          href="/popey-human/app"
          className="h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide border border-white/20 bg-white/10 text-white/90"
        >
          Retour cockpit
        </Link>
      </div>

      {feed.error && <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{feed.error}</p>}
      {leadStatus === "success" && (
        <p className="rounded border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {leadMessage || "Action appliquée."}{" "}
          <Link className="underline" href="/popey-human/app/clients">
            Effacer
          </Link>
        </p>
      )}
      {leadStatus === "error" && (
        <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {leadMessage || "Action impossible."}{" "}
          <Link className="underline" href="/popey-human/app/clients">
            Effacer
          </Link>
        </p>
      )}

      {!feed.error && feed.leads.length === 0 && (
        <p className="rounded border border-white/15 bg-black/20 px-3 py-3 text-sm text-white/70">
          Aucun lead visible pour le moment.
        </p>
      )}

      {!feed.error && feed.leads.length > 0 && (
        <div className="space-y-3">
          {feed.leads.map((lead) => (
            <article
              key={lead.id}
              className={`rounded-xl border p-4 ${
                lead.status === "pris"
                  ? "border-emerald-400/45 bg-emerald-500/15"
                  : lead.status === "signe"
                  ? "border-[#EAC886]/45 bg-[#EAC886]/15"
                  : lead.status === "perdu"
                  ? "border-red-400/40 bg-red-500/10"
                  : "border-white/15 bg-black/25"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/65">{statusLabel(lead.status)}</p>
                  <h2 className="text-lg font-black">{lead.client_name}</h2>
                  <p className="mt-1 text-sm text-white/75">{lead.besoin || "Besoin non renseigné"}</p>
                  <p className="text-sm text-white/75">
                    {lead.budget ? `${lead.budget.toLocaleString("fr-FR")} €` : "Budget non renseigné"}
                  </p>
                  <p className="text-xs text-white/65">Apporteur: {lead.sourceLabel}</p>
                </div>
                <Link
                  href={withQuery({ lead: lead.id, sign: "" })}
                  className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold"
                >
                  Ouvrir fiche
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-white/25 bg-[#1B2227] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Fiche client</p>
                <h3 className="mt-1 text-2xl font-black">{selectedLead.client_name}</h3>
              </div>
              <Link href="/popey-human/app/clients" className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </Link>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                <span className="font-black">Besoin:</span> {selectedLead.besoin || "Non renseigné"}
              </p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                <span className="font-black">Budget:</span>{" "}
                {selectedLead.budget ? `${selectedLead.budget.toLocaleString("fr-FR")} €` : "Non renseigné"}
              </p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                <span className="font-black">Zone:</span> {selectedLead.adresse || "Non renseignée"}
              </p>
              <p className="rounded-lg border border-[#EAC886]/25 bg-[#EAC886]/10 px-3 py-2">
                <span className="font-black">Apporteur:</span> {selectedLead.sourceLabel}
              </p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                <span className="font-black">Notes:</span> {selectedLead.notes || "Aucune note"}
              </p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href={selectedLead.phone ? `tel:${selectedLead.phone.replaceAll(" ", "")}` : undefined}
                className={`h-11 rounded-xl inline-flex items-center justify-center text-sm font-black uppercase tracking-wide ${
                  selectedLead.phone ? "bg-emerald-400 text-black" : "border border-white/20 text-white/45 pointer-events-none"
                }`}
              >
                Appeler le client
              </a>
              <form action={markHumanLeadOpenedAction}>
                <input type="hidden" name="lead_id" value={selectedLead.id} />
                <input type="hidden" name="current_url" value={withQuery({ lead: selectedLead.id, sign: "" })} />
                <button className="h-11 w-full rounded-xl border border-white/20 text-sm font-black uppercase tracking-wide">
                  {selectedLead.opened_at ? "Fiche déjà lue" : "Marquer comme lue"}
                </button>
              </form>
            </div>
            <div className="mt-3">
              {selectedLead.status === "nouveau" && (
                <form action={takeHumanLeadAction}>
                  <input type="hidden" name="lead_id" value={selectedLead.id} />
                  <input type="hidden" name="current_url" value={withQuery({ lead: selectedLead.id, sign: "" })} />
                  <button className="h-11 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide">
                    Je prends le deal et je contacte le client
                  </button>
                </form>
              )}
              {selectedLead.status === "pris" && (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={withQuery({ lead: selectedLead.id, sign: selectedLead.id })}
                    className="h-10 rounded-lg bg-[#EAC886] text-black text-xs font-black uppercase tracking-wide inline-flex items-center justify-center"
                  >
                    J&apos;ai signé le client
                  </Link>
                  <form action={markHumanLeadLostAction}>
                    <input type="hidden" name="lead_id" value={selectedLead.id} />
                    <input type="hidden" name="current_url" value="/popey-human/app/clients" />
                    <button className="h-10 w-full rounded-lg border border-red-300/35 bg-red-500/10 text-red-200 text-xs font-black uppercase tracking-wide">
                      Je n&apos;ai pas signé
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {signLead && signLead.status === "pris" && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/25 bg-[#1B2227] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Validation signature</p>
                <h3 className="mt-1 text-2xl font-black">{signLead.client_name}</h3>
              </div>
              <Link href={withQuery({ lead: signLead.id, sign: "" })} className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </Link>
            </div>
            <p className="mt-2 text-sm text-white/75">
              Saisissez le montant signé. La rétrocession apporteur est calculée automatiquement à 10%.
            </p>
            <form action={markHumanLeadSignedAction} className="mt-4 space-y-3">
              <input type="hidden" name="lead_id" value={signLead.id} />
              <input type="hidden" name="current_url" value="/popey-human/app/clients" />
              <div>
                <label className="text-xs font-black uppercase tracking-[0.1em] text-white/60">Montant signé (€)</label>
                <input
                  type="number"
                  min="1"
                  name="signed_amount"
                  defaultValue={signLead.budget || ""}
                  className="mt-2 h-12 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-base font-bold"
                  placeholder="Ex: 22000"
                />
              </div>
              <button className="h-12 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide">
                Valider et envoyer à l&apos;admin + apporteur
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
