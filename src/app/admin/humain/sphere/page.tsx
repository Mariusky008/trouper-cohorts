import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getHumanPermissionsAdminSnapshot, type HumanAccessMode } from "@/lib/actions/human-permissions";
import { adminDispatchHumanSignalAction, getAdminSignalDispatchSnapshot } from "@/lib/actions/human-signals";

type ModeKey = HumanAccessMode;

const MODE_LABELS: Record<ModeKey, string> = {
  BINOME_ONLY: "Binôme uniquement",
  SELECTED_MEMBERS: "Membres sélectionnés",
  SPHERE_FULL: "Sphère complète",
};

function fullName(member: { first_name: string | null; last_name: string | null }) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || "Membre sans nom";
}

export default async function AdminHumainSpherePage({
  searchParams,
}: {
  searchParams?: Promise<{
    dispatchStatus?: string;
    dispatchMessage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const dispatchStatus = typeof params.dispatchStatus === "string" ? params.dispatchStatus : "";
  const dispatchMessage = typeof params.dispatchMessage === "string" ? params.dispatchMessage : "";
  const [snapshot, signalSnapshot] = await Promise.all([getHumanPermissionsAdminSnapshot(), getAdminSignalDispatchSnapshot()]);

  if (snapshot.error) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-black">Vue Sphère</h1>
        <p className="text-sm text-red-600">{snapshot.error}</p>
      </section>
    );
  }

  const memberById = new Map(snapshot.members.map((member) => [member.id, member]));
  const statsByMode: Record<ModeKey, number> = {
    BINOME_ONLY: 0,
    SELECTED_MEMBERS: 0,
    SPHERE_FULL: 0,
  };

  const inconsistencies: Array<{ memberId: string; issue: string }> = [];

  snapshot.members.forEach((member) => {
    const mode = snapshot.permissionsByMemberId[member.id]?.access_mode || "BINOME_ONLY";
    statsByMode[mode] += 1;

    const allowed = snapshot.allowedByMemberId[member.id] || [];
    const buddies = snapshot.buddiesByMemberId[member.id] || [];

    if (mode === "BINOME_ONLY" && buddies.length === 0) {
      inconsistencies.push({
        memberId: member.id,
        issue: "Mode BINOME_ONLY sans binôme actif.",
      });
    }

    if (mode === "SELECTED_MEMBERS" && allowed.length === 0) {
      inconsistencies.push({
        memberId: member.id,
        issue: "Mode SELECTED_MEMBERS sans membre autorisé.",
      });
    }
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Vue Sphère</h1>
          <p className="text-sm text-muted-foreground">
            Synthèse des niveaux d&apos;accès et contrôle des incohérences de permissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/humain/membres">Membres</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/humain/permissions">Permissions</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["BINOME_ONLY", "SELECTED_MEMBERS", "SPHERE_FULL"] as ModeKey[]).map((mode) => (
          <div key={mode} className="rounded-xl border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{MODE_LABELS[mode]}</p>
            <p className="mt-2 text-3xl font-black">{statsByMode[mode]}</p>
            <p className="text-xs text-muted-foreground">membre(s)</p>
          </div>
        ))}
      </div>

      {dispatchStatus === "success" && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {dispatchMessage || "Dispatch effectué."}{" "}
          <Link className="underline" href="/admin/humain/sphere">
            Effacer
          </Link>
        </p>
      )}
      {dispatchStatus === "error" && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {dispatchMessage || "Dispatch impossible."}{" "}
          <Link className="underline" href="/admin/humain/sphere">
            Effacer
          </Link>
        </p>
      )}

      <div className="rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-black">Incohérences détectées</h2>
        </div>
        <div className="p-4">
          {inconsistencies.length === 0 && (
            <p className="text-sm text-emerald-700">Aucune incohérence détectée sur les règles de visibilité.</p>
          )}
          {inconsistencies.length > 0 && (
            <ul className="space-y-2">
              {inconsistencies.map((item) => {
                const member = memberById.get(item.memberId);
                return (
                  <li key={`${item.memberId}-${item.issue}`} className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm">
                    <span className="font-semibold">{member ? fullName(member) : item.memberId}</span>: {item.issue}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {signalSnapshot.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Impossible de charger le cockpit dispatch vocal: {signalSnapshot.error}
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black">Cockpit Dispatch Vocaux</h2>
            <p className="text-xs text-muted-foreground">
              {signalSnapshot.signals.filter((signal) => signal.status !== "closed").length} vocal(aux) actif(s)
            </p>
          </div>

          <div className="mt-3 space-y-3">
            {signalSnapshot.signals.slice(0, 25).map((signal) => (
              <article key={signal.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{signal.status}</p>
                    <p className="font-black">{signal.title}</p>
                    <p className="text-sm text-black/70">{signal.detail}</p>
                    <p className="text-xs text-black/60">
                      Émetteur: {signal.emitterLabel} • Cible directe: {signal.directTargetLabel}
                    </p>
                    {signal.audio_url && (
                      <audio controls className="mt-2 w-full max-w-sm" src={signal.audio_url}>
                        Votre navigateur ne supporte pas la lecture audio.
                      </audio>
                    )}
                  </div>
                </div>

                <form action={adminDispatchHumanSignalAction} className="mt-3 space-y-2">
                  <input type="hidden" name="signal_id" value={signal.id} />
                  <input type="hidden" name="current_url" value="/admin/humain/sphere" />
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Dispatch métiers / membres</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-40 overflow-y-auto pr-1">
                    {signalSnapshot.candidates
                      .filter((candidate) => candidate.member_id !== signal.emitter_member_id)
                      .map((candidate) => (
                        <label key={`${signal.id}-${candidate.member_id}`} className="rounded border px-2 py-1.5 text-xs">
                          <input type="checkbox" name="target_member_ids" value={candidate.member_id} className="mr-2 align-middle" />
                          {candidate.label}
                        </label>
                      ))}
                  </div>
                  <input
                    type="text"
                    name="note"
                    placeholder="Note admin (optionnel)"
                    className="w-full rounded border px-2 py-2 text-sm"
                  />
                  <button className="rounded bg-black px-3 py-2 text-xs font-black uppercase tracking-wide text-white">
                    Dispatcher ce vocal
                  </button>
                </form>

                {signal.dispatchTargets.length > 0 && (
                  <div className="mt-3 rounded border bg-muted/20 p-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cibles déjà dispatchées</p>
                    <ul className="mt-1 space-y-1">
                      {signal.dispatchTargets.map((target) => (
                        <li key={`${signal.id}-${target.target_member_id}`} className="text-xs">
                          {target.label} • {target.status} • {new Date(target.notified_at).toLocaleString("fr-FR")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
            {signalSnapshot.signals.length === 0 && <p className="text-sm text-muted-foreground">Aucun vocal pour le moment.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
