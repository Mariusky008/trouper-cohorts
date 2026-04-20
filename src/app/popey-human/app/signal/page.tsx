import Link from "next/link";
import {
  createHumanSignalAction,
} from "@/lib/actions/human-signals";
import { TalkieSignalComposer } from "./_components/talkie-signal-composer";

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

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Signal Live</p>
        <h2 className="mt-1 text-2xl font-black">Talkie Walkie Popey</h2>
        <p className="mt-1 text-sm text-white/75">Active un besoin chaud en quelques secondes.</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <TalkieSignalComposer
          createSignalAction={createHumanSignalAction}
          initialSuccessVisible={signalStatus === "success"}
        />
      </div>

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
