import Link from "next/link";
import {
  createHumanSignalAction,
  getSignalTargetCandidates,
} from "@/lib/actions/human-signals";
import { TalkieSignalComposer } from "./_components/talkie-signal-composer";

export default async function PopeyHumanSignalPage({
  searchParams,
}: {
  searchParams?: Promise<{
    signalStatus?: string;
    signalMessage?: string;
    target_member_id?: string;
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
    target_member_id?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const signalStatus = typeof params.signalStatus === "string" ? params.signalStatus : "";
  const signalMessage = typeof params.signalMessage === "string" ? params.signalMessage : "";
  const targetMemberId = typeof params.target_member_id === "string" ? params.target_member_id : "";
  const targets = await getSignalTargetCandidates();

  return (
    <section className="space-y-5">
      <TalkieSignalComposer
        candidates={targets.candidates}
        createSignalAction={createHumanSignalAction}
        initialTargetMemberId={targetMemberId}
      />

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
    </section>
  );
}
