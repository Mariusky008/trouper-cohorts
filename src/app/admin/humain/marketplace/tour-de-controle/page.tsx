import Link from "next/link";
import {
  adminSendPrivilegeActivationFollowupNowAction,
  adminUpdatePrivilegeActivationStatusAction,
  getAdminMarketplaceSnapshot,
} from "@/lib/actions/human-marketplace";

type TourControlePageProps = {
  searchParams?: Promise<{
    status?: string;
    city?: string;
    q?: string;
    marketStatus?: string;
    marketMessage?: string;
  }>;
};

function txt(value: unknown) {
  return String(value || "").trim();
}

function readWorkflowStatus(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "pending";
  const value = String((metadata as Record<string, unknown>).workflow_status || "pending")
    .trim()
    .toLowerCase();
  if (value === "new") return "pending";
  if (value === "rdv") return "in_progress";
  if (value === "signed") return "validated";
  if (value === "closed") return "refused";
  if (!["pending", "contacted", "in_progress", "validated", "refused"].includes(value)) return "pending";
  return value;
}

function readMetaText(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  return String((metadata as Record<string, unknown>)[key] || "").trim();
}

function statusLabel(status: string) {
  if (status === "contacted") return "Contacte";
  if (status === "in_progress") return "En cours";
  if (status === "validated") return "Valide";
  if (status === "refused") return "Refuse";
  return "En attente";
}

function badgeClass(status: string) {
  if (status === "validated") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "border-amber-300 bg-amber-50 text-amber-700";
  if (status === "contacted") return "border-cyan-300 bg-cyan-50 text-cyan-700";
  if (status === "refused") return "border-slate-300 bg-slate-100 text-slate-700";
  return "border-rose-300 bg-rose-50 text-rose-700";
}

function ticketCode(metadata: unknown, fallbackId: string) {
  const fromMeta = readMetaText(metadata, "ticket_code");
  if (fromMeta) return fromMeta;
  return `POPEY-${fallbackId.slice(0, 6).toUpperCase()}`;
}

function toWaDigits(raw: string) {
  let digits = txt(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `33${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return "";
  return digits;
}

function buildAdminWaUrl(message: string) {
  const adminPhone = toWaDigits(
    process.env.MARKETPLACE_ADMIN_WHATSAPP_PHONE || process.env.POPEY_ADMIN_WHATSAPP_PHONE || "33768233347",
  );
  if (!adminPhone) return "";
  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
}

function priorityBadge(createdAt: string, status: string) {
  if (status !== "pending") return { label: "Normal", className: "border-slate-300 bg-slate-50 text-slate-600" };
  const ageHours = Math.floor((Date.now() - Date.parse(createdAt)) / (1000 * 60 * 60));
  if (ageHours >= 24) return { label: "Urgent +24h", className: "border-rose-300 bg-rose-50 text-rose-700" };
  if (ageHours >= 8) return { label: "Priorité", className: "border-amber-300 bg-amber-50 text-amber-700" };
  return { label: "Nouveau", className: "border-emerald-300 bg-emerald-50 text-emerald-700" };
}

export default async function AdminHumainMarketplaceTourControlePage({ searchParams }: TourControlePageProps) {
  const params = (await searchParams) || {};
  const selectedStatus = typeof params.status === "string" ? params.status : "all";
  const selectedCity = typeof params.city === "string" ? params.city : "all";
  const queryText = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const marketStatus = typeof params.marketStatus === "string" ? params.marketStatus : "";
  const marketMessage = typeof params.marketMessage === "string" ? params.marketMessage : "";

  const snapshot = await getAdminMarketplaceSnapshot({ placeCity: "all" });
  const rawActivations = snapshot.recentActivations || [];

  const activations = rawActivations.filter((item) => {
    const status = readWorkflowStatus(item.metadata);
    if (selectedStatus !== "all" && status !== selectedStatus) return false;
    if (selectedCity !== "all" && txt(item.city).toLowerCase() !== selectedCity.toLowerCase()) return false;
    if (!queryText) return true;
    const haystack = `${txt(item.client_name)} ${txt(item.referrer_name)} ${txt(item.partner_name)} ${txt(item.place?.metier)} ${ticketCode(item.metadata, item.id)}`.toLowerCase();
    return haystack.includes(queryText);
  });

  const pending = rawActivations.filter((row) => readWorkflowStatus(row.metadata) === "pending").length;
  const inProgress = rawActivations.filter((row) => readWorkflowStatus(row.metadata) === "in_progress").length;
  const validated = rawActivations.filter((row) => readWorkflowStatus(row.metadata) === "validated").length;
  const refused = rawActivations.filter((row) => readWorkflowStatus(row.metadata) === "refused").length;
  const cityOptions = Array.from(new Set(rawActivations.map((item) => txt(item.city)).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  const currentUrl = `/admin/humain/marketplace/tour-de-controle?status=${encodeURIComponent(selectedStatus)}&city=${encodeURIComponent(selectedCity)}&q=${encodeURIComponent(queryText)}`;
  const kanbanStatuses = ["pending", "contacted", "in_progress", "validated", "refused"] as const;
  const kanbanColumns = kanbanStatuses.map((status) => {
    const rows = activations
      .filter((item) => readWorkflowStatus(item.metadata) === status)
      .sort((a, b) => {
        const aTs = Date.parse(a.created_at);
        const bTs = Date.parse(b.created_at);
        if (status === "pending") return aTs - bTs; // oldest first for auto-priority
        return bTs - aTs;
      });
    return { status, rows };
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">100% Humain · Tour de contrôle</p>
          <h1 className="text-3xl font-black">Pilotage Leads Catalogue</h1>
          <p className="text-sm text-muted-foreground">
            Vue dédiée gros volume: qualification centrale JPR, dispatch manuel pro et suivi statut des abonnements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/humain/marketplace" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
            Retour marketplace
          </Link>
          <Link
            href="/admin/humain/chat"
            className="rounded border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-700"
          >
            Voir messages WhatsApp
          </Link>
          <Link href="/admin/humain" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
            Retour admin
          </Link>
        </div>
      </div>

      {marketStatus === "success" ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{marketMessage || "Action effectuée."}</p>
      ) : null}
      {marketStatus === "error" ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{marketMessage || "Action impossible."}</p>
      ) : null}
      {snapshot.error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{snapshot.error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total leads</p>
          <p className="mt-1 text-2xl font-black">{rawActivations.length}</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">En attente</p>
          <p className="mt-1 text-2xl font-black text-rose-600">{pending}</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">En cours</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{inProgress}</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Validés</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{validated}</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Refusés</p>
          <p className="mt-1 text-2xl font-black text-slate-600">{refused}</p>
        </article>
      </div>

      <form method="get" className="rounded-xl border bg-card p-4">
        <div className="grid gap-2 md:grid-cols-4">
          <select name="status" defaultValue={selectedStatus} className="h-10 rounded border bg-background px-2 text-sm">
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="contacted">Contacté</option>
            <option value="in_progress">En cours</option>
            <option value="validated">Validé</option>
            <option value="refused">Refusé</option>
          </select>
          <select name="city" defaultValue={selectedCity} className="h-10 rounded border bg-background px-2 text-sm">
            <option value="all">Toutes villes</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <input name="q" defaultValue={queryText} placeholder="Client, referrer, pro, ticket…" className="h-10 rounded border bg-background px-3 text-sm" />
          <button className="h-10 rounded border bg-muted px-3 text-xs font-black uppercase tracking-wide">Filtrer</button>
        </div>
      </form>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black">Kanban opérationnel</h2>
          <p className="text-xs text-muted-foreground">Priorité auto: les plus anciens “En attente” remontent en tête.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {kanbanColumns.map((column) => (
            <div key={column.status} className="rounded-lg border bg-slate-50 p-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wide">{statusLabel(column.status)}</p>
                <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold">{column.rows.length}</span>
              </div>
              <div className="space-y-2">
                {column.rows.slice(0, 30).map((item) => {
                  const code = ticketCode(item.metadata, item.id);
                  const priority = priorityBadge(item.created_at, column.status);
                  return (
                    <article key={item.id} className="rounded border bg-white p-2 text-xs">
                      <p className="font-semibold">{txt(item.client_name)}</p>
                      <p className="text-muted-foreground">{txt(item.partner_name) || txt(item.place?.metier) || "Partenaire"}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{code}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${priority.className}`}>{priority.label}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </article>
                  );
                })}
                {column.rows.length === 0 ? <p className="text-[11px] text-muted-foreground">Aucun lead.</p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black">File d&apos;attente opérationnelle</h2>
          <p className="text-xs text-muted-foreground">Lead entrant → qualification JPR → dispatch manuel → confirmation</p>
        </div>

        <div className="space-y-3">
          {activations.map((activation) => {
            const status = readWorkflowStatus(activation.metadata);
            const note = readMetaText(activation.metadata, "workflow_note");
            const code = ticketCode(activation.metadata, activation.id);
            const waMessage = [
              "NOUVEAU LEAD CATALOGUE POPEY",
              `ID: ${code}`,
              `Client: ${txt(activation.client_name)}`,
              `Referrer: ${txt(activation.referrer_name)}`,
              `Pro cible: ${txt(activation.partner_name) || txt(activation.place?.metier) || "Partenaire"}`,
              `Ville: ${txt(activation.city)}`,
            ].join("\n");
            const waAdminUrl = buildAdminWaUrl(waMessage);

            return (
              <article key={activation.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {txt(activation.client_name)} → {txt(activation.partner_name) || txt(activation.place?.metier) || "Partenaire"}{" "}
                      <span className="text-xs text-muted-foreground">via {txt(activation.referrer_name)}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {txt(activation.city)} · {new Date(activation.created_at).toLocaleString("fr-FR")} · {code}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tel: {readMetaText(activation.metadata, "client_phone") || "Non renseigné"} · Message:{" "}
                      {readMetaText(activation.metadata, "client_message") || "Aucun message client"}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass(status)}`}>
                    {statusLabel(status)}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto]">
                  <form action={adminUpdatePrivilegeActivationStatusAction} className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
                    <input type="hidden" name="current_url" value={currentUrl} />
                    <input type="hidden" name="activation_id" value={activation.id} />
                    <select name="next_status" defaultValue={status} className="h-9 rounded border bg-background px-2 text-xs">
                      <option value="pending">En attente</option>
                      <option value="contacted">Contacté</option>
                      <option value="in_progress">En cours</option>
                      <option value="validated">Validé</option>
                      <option value="refused">Refusé</option>
                    </select>
                    <input name="note" defaultValue={note} placeholder="Note qualification / dispatch" className="h-9 rounded border bg-background px-2 text-xs" />
                    <button className="h-9 rounded border bg-muted px-3 text-[11px] font-black uppercase tracking-wide">MAJ</button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    {waAdminUrl ? (
                      <a
                        href={waAdminUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded border border-emerald-300/60 bg-emerald-50 px-3 text-[11px] font-black uppercase tracking-wide text-emerald-700"
                      >
                        WhatsApp Admin
                      </a>
                    ) : null}
                    <form action={adminSendPrivilegeActivationFollowupNowAction}>
                      <input type="hidden" name="current_url" value={currentUrl} />
                      <input type="hidden" name="activation_id" value={activation.id} />
                      <button className="h-9 rounded border border-cyan-300/60 bg-cyan-50 px-3 text-[11px] font-black uppercase tracking-wide text-cyan-700">
                        Relance Pro
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
          {activations.length === 0 ? <p className="text-sm text-muted-foreground">Aucun lead sur ce filtre.</p> : null}
        </div>
      </div>
    </section>
  );
}
