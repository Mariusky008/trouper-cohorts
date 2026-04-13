import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  adminCreateHumanLeadAction,
  getAdminHumanLeads,
  getHumanLeadSourceCandidates,
} from "@/lib/actions/human-leads";
import { buildAdminHumanHref, pickParam } from "@/lib/url/admin-human-navigation";

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

export default async function AdminHumainClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    sort?: string;
    page?: string;
    clientsSort?: string;
    clientsPage?: string;
    notificationsSort?: string;
    notificationsPage?: string;
    start?: string;
    end?: string;
    topSort?: string;
    topPage?: string;
    signalSort?: string;
    signalPage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const sort = pickParam(params, ["clientsSort", "sort"], "date_desc");
  const page = Math.max(1, Number(pickParam(params, ["clientsPage", "page"], "1")) || 1);
  const pageSize = 12;
  const [feed, sources] = await Promise.all([getAdminHumanLeads(), getHumanLeadSourceCandidates()]);

  if (feed.error) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-black">Leads clients</h1>
        <p className="text-sm text-red-600">{feed.error}</p>
      </section>
    );
  }

  const sortedLeads = [...feed.leads].sort((a, b) => {
    if (sort === "date_asc") return a.created_at.localeCompare(b.created_at);
    if (sort === "status") return a.status.localeCompare(b.status);
    if (sort === "client") return a.client_name.localeCompare(b.client_name, "fr");
    return b.created_at.localeCompare(a.created_at);
  });
  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedLeads = sortedLeads.slice(startIndex, startIndex + pageSize);
  const sharedParams = {
    ...params,
    clientsSort: sort,
    clientsPage: String(safePage),
  };
  const hrefFor = (nextSort: string, nextPage: number) =>
    buildAdminHumanHref("/admin/humain/clients", sharedParams, {
      clientsSort: nextSort,
      clientsPage: String(nextPage),
      sort: "",
      page: "",
    });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Leads clients</h1>
          <p className="text-sm text-muted-foreground">Création et pilotage des leads envoyés dans la sphère.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={buildAdminHumanHref("/admin/humain/cockpit", sharedParams)}>Aller au cockpit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={buildAdminHumanHref("/admin/humain/notifications", sharedParams)}>Aller aux notifications</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/humain">Retour espace humain</Link>
          </Button>
        </div>
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
          <select name="owner_user_id" required className="w-full rounded border px-2 py-2 text-sm">
            <option value="">Donner le lead à</option>
            {sources.candidates.map((candidate) => (
              <option key={`owner-${candidate.user_id}`} value={candidate.user_id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="client_name" required placeholder="Nom client" className="w-full rounded border px-2 py-2 text-sm" />
          <input name="budget" placeholder="Budget (ex: 45000)" className="w-full rounded border px-2 py-2 text-sm" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="phone" placeholder="Téléphone" className="w-full rounded border px-2 py-2 text-sm" />
          <input name="adresse" placeholder="Adresse" className="w-full rounded border px-2 py-2 text-sm" />
        </div>
        <input name="besoin" placeholder="Besoin principal" className="w-full rounded border px-2 py-2 text-sm" />
        <textarea name="notes" placeholder="Notes" className="min-h-20 w-full rounded border px-2 py-2 text-sm" />
        <button className="w-fit rounded bg-black px-4 py-2 text-sm font-bold text-white">Créer le lead</button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Link className="rounded border px-2 py-1" href={hrefFor("date_desc", 1)}>
            Tri: plus récents
          </Link>
          <Link className="rounded border px-2 py-1" href={hrefFor("date_asc", 1)}>
            Tri: plus anciens
          </Link>
          <Link className="rounded border px-2 py-1" href={hrefFor("status", 1)}>
            Tri: statut
          </Link>
          <Link className="rounded border px-2 py-1" href={hrefFor("client", 1)}>
            Tri: client A-Z
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Page {safePage}/{totalPages} • {sortedLeads.length} leads
        </p>
      </div>

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
            {pagedLeads.map((lead) => (
              <tr key={lead.id} className="border-t">
                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleString("fr-FR")}</td>
                <td className="px-3 py-2">
                  <p className="flex items-center gap-2 font-semibold">
                    {!lead.opened_at && <span className="inline-block h-2 w-2 rounded-full bg-blue-500" aria-label="Non lu" />}
                    {lead.client_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{lead.besoin || "Sans besoin précisé"}</p>
                </td>
                <td className="px-3 py-2">{lead.sourceLabel}</td>
                <td className="px-3 py-2">{lead.ownerLabel}</td>
                <td className="px-3 py-2">
                  <p>{statusLabel(lead.status)}</p>
                  <p className="text-xs text-muted-foreground">{lead.opened_at ? "Lu" : "Non lu"}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="rounded border px-3 py-1.5 text-sm disabled:pointer-events-none disabled:opacity-50"
          href={hrefFor(sort, Math.max(1, safePage - 1))}
          aria-disabled={safePage <= 1}
        >
          Précédent
        </Link>
        <Link
          className="rounded border px-3 py-1.5 text-sm disabled:pointer-events-none disabled:opacity-50"
          href={hrefFor(sort, Math.min(totalPages, safePage + 1))}
          aria-disabled={safePage >= totalPages}
        >
          Suivant
        </Link>
      </div>
    </section>
  );
}
