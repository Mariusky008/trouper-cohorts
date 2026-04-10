import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  adminCreateHumanLeadAction,
  getAdminHumanLeads,
  getHumanLeadSourceCandidates,
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

export default async function AdminHumainClientsPage() {
  const [feed, sources] = await Promise.all([getAdminHumanLeads(), getHumanLeadSourceCandidates()]);

  if (feed.error) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-black">Leads clients</h1>
        <p className="text-sm text-red-600">{feed.error}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Leads clients</h1>
          <p className="text-sm text-muted-foreground">Création et pilotage des leads envoyés dans la sphère.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/humain">Retour espace humain</Link>
        </Button>
      </div>

      <form action={adminCreateHumanLeadAction} className="grid gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="source_user_id" required className="w-full rounded border px-2 py-2 text-sm">
            <option value="">Source du lead</option>
            {sources.candidates.map((candidate) => (
              <option key={candidate.user_id} value={candidate.user_id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <input name="client_name" required placeholder="Nom client" className="w-full rounded border px-2 py-2 text-sm" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="budget" placeholder="Budget (ex: 45000)" className="w-full rounded border px-2 py-2 text-sm" />
          <input name="phone" placeholder="Téléphone" className="w-full rounded border px-2 py-2 text-sm" />
        </div>
        <input name="adresse" placeholder="Adresse" className="w-full rounded border px-2 py-2 text-sm" />
        <input name="besoin" placeholder="Besoin principal" className="w-full rounded border px-2 py-2 text-sm" />
        <textarea name="notes" placeholder="Notes" className="min-h-20 w-full rounded border px-2 py-2 text-sm" />
        <button className="w-fit rounded bg-black px-4 py-2 text-sm font-bold text-white">Créer le lead</button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-bold">Date</th>
              <th className="px-3 py-2 text-left font-bold">Client</th>
              <th className="px-3 py-2 text-left font-bold">Source</th>
              <th className="px-3 py-2 text-left font-bold">Owner</th>
              <th className="px-3 py-2 text-left font-bold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {feed.leads.map((lead) => (
              <tr key={lead.id} className="border-t">
                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleString("fr-FR")}</td>
                <td className="px-3 py-2">
                  <p className="font-semibold">{lead.client_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.besoin || "Sans besoin précisé"}</p>
                </td>
                <td className="px-3 py-2">{lead.sourceLabel}</td>
                <td className="px-3 py-2">{lead.ownerLabel}</td>
                <td className="px-3 py-2">{statusLabel(lead.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
