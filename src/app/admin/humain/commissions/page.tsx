import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminStatusBanner } from "@/components/admin/status-banner";
import {
  adminProcessMarketplaceCommissionRequestAction,
  adminSetMarketplaceProCommissionRuleAction,
  adminSetHumanCommissionStatusAction,
  getAdminHumanCommissions,
} from "@/lib/actions/human-cash";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function paymentStatusLabel(status: "pending" | "requested" | "paid" | "cancelled") {
  if (status === "pending") return "En attente";
  if (status === "requested") return "Demandée";
  if (status === "paid") return "Payée";
  return "Annulée";
}

function requestKindLabel(kind: "apporteur_payout" | "pro_settlement") {
  return kind === "apporteur_payout" ? "Virement apporteur" : "Règlement pro";
}

function requestStatusLabel(status: "pending" | "processed" | "rejected") {
  if (status === "pending") return "En attente";
  if (status === "processed") return "Traitée";
  return "Refusée";
}

export default async function AdminHumainCommissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    commissionStatus?: string;
    commissionMessage?: string;
    month?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const commissionStatus = typeof params.commissionStatus === "string" ? params.commissionStatus : "";
  const commissionMessage = typeof params.commissionMessage === "string" ? params.commissionMessage : "";
  const selectedMonth = typeof params.month === "string" ? params.month : "";
  const feed = await getAdminHumanCommissions(selectedMonth);

  if (feed.error) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-black">Commissions & Virements</h1>
        <p className="text-sm text-red-600">{feed.error}</p>
      </section>
    );
  }

  const monthValue = feed.periodMonth.slice(0, 7);
  const clearHref = `/admin/humain/commissions?month=${monthValue}`;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Commissions & Virements</h1>
          <p className="text-sm text-muted-foreground">Vue mensuelle stricte du 1er au dernier jour.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/humain/cockpit">Aller au cockpit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/humain">Retour espace humain</Link>
          </Button>
        </div>
      </div>

      <AdminStatusBanner status={commissionStatus} message={commissionMessage} clearHref={clearHref} />

      <form method="get" className="flex items-end gap-2 rounded-xl border bg-white p-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Mois de clôture</p>
          <input type="month" name="month" defaultValue={monthValue} className="mt-1 h-9 rounded border px-2 text-sm" />
        </div>
        <button className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">Appliquer</button>
      </form>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Apporteurs à payer</p>
          <p className="mt-1 text-xl font-black text-emerald-700">{euros(feed.kpis.apporteurPending)}</p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Demandes reçues</p>
          <p className="mt-1 text-xl font-black text-amber-700">{euros(feed.kpis.apporteurRequested)}</p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total dû par les pros</p>
          <p className="mt-1 text-xl font-black text-slate-900">{euros(feed.kpis.proOutstanding)}</p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Part Popey à encaisser</p>
          <p className="mt-1 text-xl font-black text-fuchsia-700">{euros(feed.kpis.popeyOutstanding)}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Commission Popey fixe par pro</p>
        <form action={adminSetMarketplaceProCommissionRuleAction} className="mt-2 flex flex-wrap items-end gap-2">
          <input type="hidden" name="current_url" value={clearHref} />
          <div>
            <p className="text-[11px] text-muted-foreground">Pro</p>
            <select name="pro_member_id" className="h-9 rounded border px-2 text-sm">
              {feed.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Montant Popey / lead</p>
            <input name="popey_fee_eur" placeholder="30" className="h-9 rounded border px-2 text-sm" />
          </div>
          <button className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">Enregistrer</button>
        </form>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {feed.proRules.slice(0, 8).map((rule) => (
            <div key={rule.id} className="rounded border bg-muted/20 px-3 py-2 text-xs">
              <span className="font-semibold">{rule.proLabel}</span> · Popey: <span className="font-black">{euros(rule.popeyFeeEur)}</span>
            </div>
          ))}
          {feed.proRules.length === 0 ? <p className="text-xs text-muted-foreground">Aucune règle fixée pour le moment.</p> : null}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Demandes de virement</p>
        <div className="mt-2 space-y-2">
          {feed.requests.map((request) => (
            <article key={request.id} className="rounded border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {request.memberLabel} · {requestKindLabel(request.requestKind)} · {euros(request.requestedAmountEur)}
                </p>
                <span className="text-xs font-black uppercase tracking-wide">{requestStatusLabel(request.status)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Créée le {new Date(request.createdAt).toLocaleString("fr-FR")}</p>
              {request.status === "pending" ? (
                <form action={adminProcessMarketplaceCommissionRequestAction} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="current_url" value={clearHref} />
                  <input type="hidden" name="request_id" value={request.id} />
                  <input name="processed_note" placeholder="Note admin (optionnel)" className="h-8 min-w-52 rounded border px-2 text-xs" />
                  <button
                    name="status"
                    value="processed"
                    className="h-8 rounded border border-emerald-300 bg-emerald-50 px-2 text-[11px] font-black uppercase tracking-wide text-emerald-800"
                  >
                    Traitée
                  </button>
                  <button
                    name="status"
                    value="rejected"
                    className="h-8 rounded border border-rose-300 bg-rose-50 px-2 text-[11px] font-black uppercase tracking-wide text-rose-800"
                  >
                    Refuser
                  </button>
                </form>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">{request.processedNote || "Sans note admin."}</p>
              )}
            </article>
          ))}
          {feed.requests.length === 0 ? <p className="text-sm text-muted-foreground">Aucune demande sur ce mois.</p> : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-bold">Ticket</th>
              <th className="px-3 py-2 text-left font-bold">Date</th>
              <th className="px-3 py-2 text-left font-bold">Type ligne</th>
              <th className="px-3 py-2 text-left font-bold">Ville</th>
              <th className="px-3 py-2 text-left font-bold">Payeur</th>
              <th className="px-3 py-2 text-left font-bold">Bénéficiaire</th>
              <th className="px-3 py-2 text-left font-bold">Commission</th>
              <th className="px-3 py-2 text-left font-bold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {feed.ledger.map((row) => (
              <tr key={row.id} className="border-t align-top">
                <td className="px-3 py-2 text-xs font-semibold">{row.ticketCode}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2 text-xs">{row.rowKind === "popey" ? "Part Popey" : "Part apporteur"}</td>
                <td className="px-3 py-2 text-xs">{row.city}</td>
                <td className="px-3 py-2">{row.payerLabel}</td>
                <td className="px-3 py-2">{row.receiverLabel}</td>
                <td className="px-3 py-2 font-semibold text-emerald-700">{euros(row.amountEur)}</td>
                <td className="px-3 py-2">
                  <form action={adminSetHumanCommissionStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="ledger_id" value={row.id} />
                    <input type="hidden" name="current_url" value={clearHref} />
                    <select name="payment_status" defaultValue={row.paymentStatus} className="rounded border px-2 py-1 text-xs">
                      <option value="pending">En attente</option>
                      <option value="requested">Demandée</option>
                      <option value="paid">Payée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                    <input name="payment_note" defaultValue={row.note || ""} placeholder="Note" className="rounded border px-2 py-1 text-xs" />
                    <button className="rounded border px-2 py-1 text-xs font-semibold">Mettre à jour</button>
                  </form>
                  <p className="mt-1 text-xs text-muted-foreground">{paymentStatusLabel(row.paymentStatus)}</p>
                </td>
              </tr>
            ))}
            {feed.ledger.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-sm text-muted-foreground" colSpan={8}>
                  Aucune ligne commission sur ce mois.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
