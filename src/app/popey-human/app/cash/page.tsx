import Link from "next/link";
import { Button } from "@/components/ui/button";
import { addMyCashEventAction, getMyCashSummary } from "@/lib/actions/human-cash";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function kindLabel(kind: "encaissement" | "decaissement") {
  return kind === "encaissement" ? "Encaissement" : "Décaissement";
}

export default async function PopeyHumanCashPage() {
  const summary = await getMyCashSummary();

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/60">Popey Human</p>
            <h1 className="text-3xl font-black">Cash</h1>
            <p className="text-sm text-black/70">Suivi de vos entrées/sorties et marge nette.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/popey-human/app">Retour cockpit</Link>
          </Button>
        </div>

        {summary.error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{summary.error}</p>}

        {!summary.error && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black/60">Entrées</p>
                <p className="mt-2 text-2xl font-black text-emerald-700">{euros(summary.totals.in)}</p>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black/60">Sorties</p>
                <p className="mt-2 text-2xl font-black text-rose-700">{euros(summary.totals.out)}</p>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-black/60">Net</p>
                <p className={`mt-2 text-2xl font-black ${summary.totals.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {euros(summary.totals.net)}
                </p>
              </div>
            </div>

            <form action={addMyCashEventAction} className="grid gap-3 rounded-xl border bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <select name="kind" required className="w-full rounded border px-2 py-2 text-sm">
                  <option value="encaissement">Encaissement</option>
                  <option value="decaissement">Décaissement</option>
                </select>
                <input name="amount" required placeholder="Montant" className="w-full rounded border px-2 py-2 text-sm" />
                <input name="event_date" type="date" className="w-full rounded border px-2 py-2 text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select name="source_type" className="w-full rounded border px-2 py-2 text-sm">
                  <option value="manual">Source manuelle</option>
                  <option value="lead">Source lead</option>
                  <option value="signal">Source signal</option>
                </select>
                <input name="source_id" placeholder="Source ID (optionnel)" className="w-full rounded border px-2 py-2 text-sm" />
              </div>
              <input name="description" required placeholder="Description" className="w-full rounded border px-2 py-2 text-sm" />
              <button className="w-fit rounded bg-black px-4 py-2 text-sm font-bold text-white">Ajouter le mouvement</button>
            </form>

            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold">Date</th>
                    <th className="px-3 py-2 text-left font-bold">Type</th>
                    <th className="px-3 py-2 text-left font-bold">Description</th>
                    <th className="px-3 py-2 text-left font-bold">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.events.map((event) => (
                    <tr key={event.id} className="border-t">
                      <td className="px-3 py-2">{event.event_date}</td>
                      <td className="px-3 py-2">{kindLabel(event.kind)}</td>
                      <td className="px-3 py-2">{event.description}</td>
                      <td className={`px-3 py-2 font-semibold ${event.kind === "encaissement" ? "text-emerald-700" : "text-rose-700"}`}>
                        {event.kind === "encaissement" ? "+" : "-"} {euros(Number(event.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
