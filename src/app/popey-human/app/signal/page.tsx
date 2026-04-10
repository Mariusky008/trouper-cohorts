import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  closeHumanSignalAction,
  createHumanSignalAction,
  getSignalTargetCandidates,
  listVisibleHumanSignals,
} from "@/lib/actions/human-signals";

function statusLabel(status: "open" | "in_progress" | "closed") {
  switch (status) {
    case "open":
      return "Ouvert";
    case "in_progress":
      return "En cours";
    case "closed":
      return "Clôturé";
    default:
      return status;
  }
}

export default async function PopeyHumanSignalPage() {
  const [feed, targets] = await Promise.all([listVisibleHumanSignals(), getSignalTargetCandidates()]);

  return (
    <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/60">Popey Human</p>
            <h1 className="text-3xl font-black">Signal</h1>
            <p className="text-sm text-black/70">Flux de signaux business + score d&apos;attention.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/popey-human/app">Retour cockpit</Link>
          </Button>
        </div>

        <form action={createHumanSignalAction} className="grid gap-3 rounded-xl border bg-white p-4">
          <input name="title" required placeholder="Titre du signal" className="w-full rounded border px-2 py-2 text-sm" />
          <textarea name="detail" required placeholder="Détail du signal" className="min-h-20 w-full rounded border px-2 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="signal_strength" defaultValue="3" className="w-full rounded border px-2 py-2 text-sm">
              <option value="1">Force 1</option>
              <option value="2">Force 2</option>
              <option value="3">Force 3</option>
              <option value="4">Force 4</option>
              <option value="5">Force 5</option>
            </select>
            <select name="target_member_id" className="w-full rounded border px-2 py-2 text-sm">
              <option value="">Cible: sphère</option>
              {targets.candidates.map((candidate) => (
                <option key={candidate.member_id} value={candidate.member_id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </div>
          <button className="w-fit rounded bg-black px-4 py-2 text-sm font-bold text-white">Publier le signal</button>
        </form>

        {feed.error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{feed.error}</p>}

        {!feed.error && feed.signals.length === 0 && (
          <p className="rounded border bg-white px-3 py-3 text-sm text-black/70">Aucun signal visible pour le moment.</p>
        )}

        {!feed.error && feed.signals.length > 0 && (
          <div className="space-y-3">
            {feed.signals.map((signal) => (
              <article key={signal.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/60">{statusLabel(signal.status)}</p>
                    <h2 className="text-lg font-black">{signal.title}</h2>
                    <p className="mt-1 text-sm text-black/75">{signal.detail}</p>
                    <p className="mt-1 text-xs text-black/60">
                      Émetteur: {signal.emitterLabel} • Cible: {signal.targetLabel}
                    </p>
                    <p className="text-xs font-bold text-black/70">Score: {signal.score}/100</p>
                  </div>
                  {signal.status !== "closed" && (
                    <form action={closeHumanSignalAction}>
                      <input type="hidden" name="signal_id" value={signal.id} />
                      <button className="rounded border px-3 py-1.5 text-xs font-semibold">Clôturer</button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
    </section>
  );
}
