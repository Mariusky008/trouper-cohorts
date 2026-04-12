import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getHumanPermissionsAdminSnapshot, type HumanAccessMode } from "@/lib/actions/human-permissions";
import { adminDispatchHumanSignalAction, getAdminSignalDispatchSnapshot } from "@/lib/actions/human-signals";

type ModeKey = HumanAccessMode;
type AdminSphereFilter = "toutes" | "habitat" | "sante" | "auto";

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
    adminSphere?: string;
    selectedSignal?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const dispatchStatus = typeof params.dispatchStatus === "string" ? params.dispatchStatus : "";
  const dispatchMessage = typeof params.dispatchMessage === "string" ? params.dispatchMessage : "";
  const adminSphere: AdminSphereFilter =
    params.adminSphere === "habitat" || params.adminSphere === "sante" || params.adminSphere === "auto"
      ? params.adminSphere
      : "toutes";
  const selectedSignalId = typeof params.selectedSignal === "string" ? params.selectedSignal : "";
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

  const baseSphereHref = (sphere: AdminSphereFilter) =>
    sphere === "toutes" ? "/admin/humain/sphere" : `/admin/humain/sphere?adminSphere=${sphere}`;

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
        <div className="rounded-xl border bg-[#0E1113] text-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">Cockpit admin Radar</p>
              <h2 className="text-lg font-black">Timeline de distribution vocale</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "toutes", label: "Toutes" },
                { key: "habitat", label: "Habitat" },
                { key: "sante", label: "Santé" },
                { key: "auto", label: "Auto" },
              ] as Array<{ key: AdminSphereFilter; label: string }>).map((sphere) => (
                <Link
                  key={sphere.key}
                  href={baseSphereHref(sphere.key)}
                  className={`h-8 rounded-full px-3 text-[11px] font-black uppercase tracking-wide inline-flex items-center ${
                    adminSphere === sphere.key ? "bg-white text-black" : "border border-white/25 text-white/80"
                  }`}
                >
                  {sphere.label}
                </Link>
              ))}
            </div>
          </div>

          {(() => {
            const scopedSignals = signalSnapshot.signals
              .filter((signal) => adminSphere === "toutes" || signal.sphere === adminSphere)
              .sort((a, b) => {
                const urgentDiff = Number(b.urgent) - Number(a.urgent);
                if (urgentDiff !== 0) return urgentDiff;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              });
            const selectedSignal = scopedSignals.find((signal) => signal.id === selectedSignalId) || scopedSignals[0] || null;
            const activeVocals = scopedSignals.filter((signal) => signal.status !== "closed").length;
            const dispatchedVocals = scopedSignals.filter((signal) => signal.dispatchTargets.length > 0).length;
            const totalDispatchTargets = scopedSignals.reduce((sum, signal) => sum + signal.dispatchTargets.length, 0);
            const urgentVocals = scopedSignals.filter((signal) => signal.urgent).length;

            return (
              <>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <p className="text-[10px] uppercase font-black tracking-[0.12em] text-white/65">Vocaux reçus</p>
                    <p className="mt-1 text-xl font-black">{scopedSignals.length}</p>
                  </div>
                  <div className="rounded-xl border border-[#EAC886]/25 bg-[#2A2111] p-3">
                    <p className="text-[10px] uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Vocaux actifs</p>
                    <p className="mt-1 text-xl font-black text-[#EAC886]">{activeVocals}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-400/25 bg-[#10251D] p-3">
                    <p className="text-[10px] uppercase font-black tracking-[0.12em] text-emerald-300/80">Vocaux dispatchés</p>
                    <p className="mt-1 text-xl font-black text-emerald-300">{dispatchedVocals}</p>
                  </div>
                  <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
                    <p className="text-[10px] uppercase font-black tracking-[0.12em] text-cyan-200/85">Cibles notifiées</p>
                    <p className="mt-1 text-xl font-black text-cyan-200">{totalDispatchTargets}</p>
                    <p className="text-[10px] text-cyan-100/80">Urgence: {urgentVocals}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Timeline des vocaux</p>
                    <div className="mt-3 space-y-2 max-h-[560px] overflow-y-auto pr-1">
                      {scopedSignals.map((signal) => (
                        <Link
                          key={signal.id}
                          href={`${baseSphereHref(adminSphere)}${adminSphere === "toutes" ? "?" : "&"}selectedSignal=${signal.id}`}
                          className={`block rounded-lg border px-3 py-2 ${
                            signal.id === selectedSignal?.id
                              ? "border-emerald-300/45 bg-emerald-500/10"
                              : signal.urgent
                              ? "border-red-300/45 bg-red-500/15"
                              : "border-white/15 bg-black/25"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-black">
                              {signal.emitterLabel} {signal.emitterTrade ? `(${signal.emitterTrade})` : ""}
                              {signal.urgent ? " • URGENCE" : ""}
                            </p>
                            <span className="text-[10px] text-white/65">{new Date(signal.created_at).toLocaleString("fr-FR")}</span>
                          </div>
                          <p className="mt-1 text-xs text-white/80">{signal.title}</p>
                          <p className="text-[11px] text-white/60">
                            Statut: {signal.status} • Dispatch: {signal.dispatchTargets.length}
                          </p>
                        </Link>
                      ))}
                      {scopedSignals.length === 0 && <p className="text-sm text-white/70">Aucun vocal pour ce filtre.</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
                    {!selectedSignal && <p className="text-sm text-white/70">Sélectionnez un vocal dans la timeline.</p>}
                    {selectedSignal && (
                      <>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Dispatch chirurgical</p>
                        <p className="mt-1 text-sm font-black">{selectedSignal.title}</p>
                        <p className="text-xs text-white/70">
                          Émetteur: {selectedSignal.emitterLabel} • Cible directe: {selectedSignal.directTargetLabel}
                        </p>
                        <p className="mt-2 text-xs text-white/75">{selectedSignal.detail}</p>
                        {selectedSignal.audio_url && (
                          <audio controls className="mt-2 w-full" src={selectedSignal.audio_url}>
                            Votre navigateur ne supporte pas la lecture audio.
                          </audio>
                        )}
                        <form action={adminDispatchHumanSignalAction} className="mt-3 space-y-2">
                          <input type="hidden" name="signal_id" value={selectedSignal.id} />
                          <input type="hidden" name="current_url" value={baseSphereHref(adminSphere)} />
                          <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
                            {signalSnapshot.candidates
                              .filter((candidate) => candidate.member_id !== selectedSignal.emitter_member_id)
                              .map((candidate) => (
                                <label key={`${selectedSignal.id}-${candidate.member_id}`} className="rounded border border-white/20 px-2 py-1.5 text-xs">
                                  <input type="checkbox" name="target_member_ids" value={candidate.member_id} className="mr-2 align-middle" />
                                  {candidate.label}
                                </label>
                              ))}
                          </div>
                          <input
                            type="text"
                            name="note"
                            placeholder="Note admin (optionnel)"
                            className="w-full rounded border border-white/20 bg-black/35 px-2 py-2 text-sm"
                          />
                          <button className="h-10 w-full rounded-lg bg-emerald-400 text-black text-xs font-black uppercase tracking-wide">
                            Valider et notifier
                          </button>
                        </form>

                        {selectedSignal.dispatchTargets.length > 0 && (
                          <div className="mt-3 rounded border border-white/15 bg-white/5 p-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/65">Cibles déjà dispatchées</p>
                            <ul className="mt-1 space-y-1">
                              {selectedSignal.dispatchTargets.map((target) => (
                                <li key={`${selectedSignal.id}-${target.target_member_id}`} className="text-xs text-white/85">
                                  {target.label} • {target.status} • {new Date(target.notified_at).toLocaleString("fr-FR")}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </section>
  );
}
