import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  closeHumanSignalAction,
  createHumanSignalAction,
  getSignalTargetCandidates,
  listVisibleHumanSignals,
} from "@/lib/actions/human-signals";
import { TalkieSignalComposer } from "./_components/talkie-signal-composer";

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

export default async function PopeyHumanSignalPage({
  searchParams,
}: {
  searchParams?: Promise<{
    signalStatus?: string;
    signalMessage?: string;
  }>;
}) {
  return <PopeyHumanSignalContent searchParams={searchParams} />;
}

async function PopeyHumanSignalContent({
  searchParams,
}: {
  searchParams?: Promise<{
    signalStatus?: string;
    signalMessage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const signalStatus = typeof params.signalStatus === "string" ? params.signalStatus : "";
  const signalMessage = typeof params.signalMessage === "string" ? params.signalMessage : "";
  const [feed, targets] = await Promise.all([listVisibleHumanSignals(), getSignalTargetCandidates()]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300/85">Popey Human</p>
          <h1 className="text-3xl font-black">Signal</h1>
          <p className="text-sm text-white/75">Flux de signaux business + score d&apos;attention.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/popey-human/app">Retour cockpit</Link>
        </Button>
      </div>

      <TalkieSignalComposer candidates={targets.candidates} createSignalAction={createHumanSignalAction} />

      {signalStatus === "success" && (
        <p className="rounded border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {signalMessage || "Signal envoyé."}{" "}
          <Link className="underline" href="/popey-human/app/signal">
            Effacer
          </Link>
        </p>
      )}
      {signalStatus === "error" && (
        <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {signalMessage || "Action impossible."}{" "}
          <Link className="underline" href="/popey-human/app/signal">
            Effacer
          </Link>
        </p>
      )}

      {feed.error && <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{feed.error}</p>}

      {!feed.error && feed.signals.length === 0 && (
        <p className="rounded border border-white/15 bg-black/25 px-3 py-3 text-sm text-white/70">Aucun signal visible pour le moment.</p>
      )}

      {!feed.error && feed.signals.length > 0 && (
        <div className="space-y-3">
          {feed.signals.map((signal) => (
            <article key={signal.id} className="rounded-xl border border-white/15 bg-black/25 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">{statusLabel(signal.status)}</p>
                  <h2 className="text-lg font-black">{signal.title}</h2>
                  <p className="mt-1 text-sm text-white/75">{signal.detail}</p>
                  <p className="mt-1 text-xs text-white/60">
                    Émetteur: {signal.emitterLabel} • Cible: {signal.targetLabel}
                  </p>
                  <p className="text-xs font-bold text-white/70">Score: {signal.score}/100</p>
                  {signal.audio_url && (
                    <audio className="mt-2 w-full max-w-sm" controls src={signal.audio_url}>
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                  )}
                </div>
                {signal.status !== "closed" && (
                  <form action={closeHumanSignalAction}>
                    <input type="hidden" name="signal_id" value={signal.id} />
                    <input type="hidden" name="current_url" value="/popey-human/app/signal" />
                    <button className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold">Clôturer</button>
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
