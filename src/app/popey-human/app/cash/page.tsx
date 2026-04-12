import Link from "next/link";
import { addMyCashEventAction, getMyCashSummary, requestMyCashPayoutAction } from "@/lib/actions/human-cash";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function kindLabel(kind: "encaissement" | "decaissement") {
  return kind === "encaissement" ? "Encaissement" : "Décaissement";
}

function commissionStatusLabel(status: "pending" | "paid" | "cancelled") {
  if (status === "pending") return "En attente";
  if (status === "paid") return "Payée";
  return "Annulée";
}

export default async function PopeyHumanCashPage({
  searchParams,
}: {
  searchParams?: Promise<{
    cashStatus?: string;
    cashMessage?: string;
    modal?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const cashStatus = typeof params.cashStatus === "string" ? params.cashStatus : "";
  const cashMessage = typeof params.cashMessage === "string" ? params.cashMessage : "";
  const modal = typeof params.modal === "string" ? params.modal : "";
  const summary = await getMyCashSummary();
  const isCashZeroState =
    !summary.error &&
    summary.totals.in === 0 &&
    summary.totals.out === 0 &&
    summary.commissionsTotals.total === 0 &&
    summary.commissionsOutboundTotals.total === 0;

  const cashDisponiblePopey = !summary.error ? summary.commissionsTotals.paid : 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Cash Radar</p>
          <h1 className="text-3xl font-black">Cash</h1>
          <p className="text-sm text-white/75">Montants signés, commissions reçues et commissions à payer.</p>
        </div>
        <Link
          href="/popey-human/app"
          className="h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide border border-white/20 bg-white/10 text-white/90"
        >
          Retour cockpit
        </Link>
      </div>

      {summary.error && <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{summary.error}</p>}
      {cashStatus === "success" && (
        <p className="rounded border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {cashMessage || "Action appliquée."}{" "}
          <Link className="underline" href="/popey-human/app/cash">
            Effacer
          </Link>
        </p>
      )}
      {cashStatus === "error" && (
        <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {cashMessage || "Action impossible."}{" "}
          <Link className="underline" href="/popey-human/app/cash">
            Effacer
          </Link>
        </p>
      )}

      {!summary.error && (
        <>
          <div className="grid gap-2">
            <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-3">
              <p className="text-xs text-fuchsia-200/90 uppercase font-black">Ma contribution au groupe</p>
              <p className="text-2xl font-black text-fuchsia-200">{euros(summary.commissionsOutboundTotals.total)}</p>
              <p className="text-[11px] text-fuchsia-200/75">Commissions liées à vos deals signés (sortant)</p>
            </div>
            <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
              <p className="text-xs text-cyan-200/90 uppercase font-black">Mon cash disponible Popey</p>
              <p className="text-2xl font-black text-cyan-200">{euros(cashDisponiblePopey)}</p>
              <form action={requestMyCashPayoutAction} className="mt-2 space-y-2">
                <input type="hidden" name="current_url" value="/popey-human/app/cash" />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  name="requested_amount"
                  defaultValue={cashDisponiblePopey > 0 ? String(cashDisponiblePopey) : ""}
                  placeholder="Montant du virement"
                  className="h-10 w-full rounded-lg border border-cyan-200/40 bg-black/25 px-3 text-sm"
                />
                <button className="h-10 w-full rounded-lg bg-cyan-300 text-black text-xs font-black uppercase tracking-wide">
                  Demander un virement Popey
                </button>
              </form>
            </div>
            {isCashZeroState && (
              <div className="rounded-xl border border-dashed border-emerald-300/35 bg-emerald-500/10 px-3 py-3">
                <p className="text-sm font-black text-emerald-200">Le compteur est à zéro.</p>
                <p className="text-xs text-emerald-200/80">A vous de faire tomber la première pluie sur Dax.</p>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/popey-human/app/cash?modal=inbound" className="rounded-xl border border-emerald-400/30 bg-[#10251D] p-3">
              <p className="text-xs uppercase font-black text-emerald-300/80">Commissions dues (Inbound)</p>
              <p className="mt-1 text-2xl font-black text-emerald-300">{euros(summary.commissionsTotals.total)}</p>
              <p className="text-[11px] text-emerald-300/70">
                Payé: {euros(summary.commissionsTotals.paid)} • En attente: {euros(summary.commissionsTotals.pending)}
              </p>
            </Link>
            <Link href="/popey-human/app/cash?modal=outbound" className="rounded-xl border border-[#EAC886]/30 bg-[#2A2111] p-3">
              <p className="text-xs uppercase font-black text-[#EAC886]/80">Commissions à payer (Outbound)</p>
              <p className="mt-1 text-2xl font-black text-[#EAC886]">{euros(summary.commissionsOutboundTotals.pending)}</p>
              <p className="text-[11px] text-[#EAC886]/70">Total outbound: {euros(summary.commissionsOutboundTotals.total)}</p>
            </Link>
            <Link href="/popey-human/app/cash?modal=events" className="rounded-xl border border-white/20 bg-black/25 p-3">
              <p className="text-xs uppercase font-black text-white/75">Mouvements cash</p>
              <p className="mt-1 text-xl font-black text-white">
                {euros(summary.totals.in)} / {euros(summary.totals.out)}
              </p>
              <p className="text-[11px] text-white/65">Net: {euros(summary.totals.net)}</p>
            </Link>
          </div>

          <form action={addMyCashEventAction} className="grid gap-3 rounded-xl border border-white/15 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">Mouvement manuel</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <select name="kind" required className="w-full rounded border border-white/20 bg-black/25 px-2 py-2 text-sm">
                <option value="encaissement">Encaissement</option>
                <option value="decaissement">Décaissement</option>
              </select>
              <input name="amount" required placeholder="Montant" className="w-full rounded border border-white/20 bg-black/25 px-2 py-2 text-sm" />
              <input name="event_date" type="date" className="w-full rounded border border-white/20 bg-black/25 px-2 py-2 text-sm" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="source_type" className="w-full rounded border border-white/20 bg-black/25 px-2 py-2 text-sm">
                <option value="manual">Source manuelle</option>
                <option value="lead">Source lead</option>
                <option value="signal">Source signal</option>
              </select>
              <input name="source_id" placeholder="Source ID (optionnel)" className="w-full rounded border border-white/20 bg-black/25 px-2 py-2 text-sm" />
            </div>
            <input name="description" required placeholder="Description" className="w-full rounded border border-white/20 bg-black/25 px-2 py-2 text-sm" />
            <button className="w-fit rounded bg-emerald-400 px-4 py-2 text-sm font-black text-black uppercase tracking-wide">
              Ajouter le mouvement
            </button>
          </form>
        </>
      )}

      {modal === "events" && !summary.error && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-white/25 bg-[#1B2227] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-white/65">Mouvements cash</p>
                <h3 className="mt-1 text-2xl font-black">Historique entrées / sorties</h3>
              </div>
              <Link href="/popey-human/app/cash" className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </Link>
            </div>
            <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {summary.events.map((event) => (
                <div key={event.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                  <p className="text-sm font-black">{event.description}</p>
                  <p className="text-xs text-white/70">
                    {event.event_date} • {kindLabel(event.kind)} • {event.source_type}
                  </p>
                  <p className={`text-xs font-black ${event.kind === "encaissement" ? "text-emerald-300" : "text-rose-300"}`}>
                    {event.kind === "encaissement" ? "+" : "-"} {euros(Number(event.amount))}
                  </p>
                </div>
              ))}
              {summary.events.length === 0 && <p className="text-sm text-white/70">Aucun mouvement pour le moment.</p>}
            </div>
          </div>
        </div>
      )}

      {modal === "inbound" && !summary.error && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-white/25 bg-[#1B2227] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-emerald-300/80">Commissions dues (Inbound)</p>
                <h3 className="mt-1 text-2xl font-black">Qui a payé / qui n&apos;a pas payé</h3>
              </div>
              <Link href="/popey-human/app/cash" className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </Link>
            </div>
            <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {summary.commissionsInbound.map((commission) => (
                <div key={commission.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                  <p className="text-sm font-black">Lead {commission.lead_id}</p>
                  <p className="text-xs text-white/70">
                    Montant signé: {euros(Number(commission.signed_amount))} • Commission: {euros(Number(commission.commission_amount))}
                  </p>
                  <p
                    className={`text-xs font-black ${
                      commission.payment_status === "paid"
                        ? "text-emerald-300"
                        : commission.payment_status === "pending"
                        ? "text-amber-300"
                        : "text-red-300"
                    }`}
                  >
                    {commissionStatusLabel(commission.payment_status)}
                  </p>
                </div>
              ))}
              {summary.commissionsInbound.length === 0 && <p className="text-sm text-white/70">Aucune commission inbound pour le moment.</p>}
            </div>
          </div>
        </div>
      )}

      {modal === "outbound" && !summary.error && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-white/25 bg-[#1B2227] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Commissions à payer (Outbound)</p>
                <h3 className="mt-1 text-2xl font-black">Détail des commissions sortantes</h3>
              </div>
              <Link href="/popey-human/app/cash" className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </Link>
            </div>
            <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {summary.commissionsOutbound.map((commission) => (
                <div key={commission.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                  <p className="text-sm font-black">Lead {commission.lead_id}</p>
                  <p className="text-xs text-white/70">
                    Montant signé: {euros(Number(commission.signed_amount))} • Commission: {euros(Number(commission.commission_amount))}
                  </p>
                  <p
                    className={`text-xs font-black ${
                      commission.payment_status === "paid"
                        ? "text-emerald-300"
                        : commission.payment_status === "pending"
                        ? "text-amber-300"
                        : "text-red-300"
                    }`}
                  >
                    {commissionStatusLabel(commission.payment_status)}
                  </p>
                </div>
              ))}
              {summary.commissionsOutbound.length === 0 && (
                <p className="text-sm text-white/70">Aucune commission outbound pour le moment.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
