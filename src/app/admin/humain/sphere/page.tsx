import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getHumanPermissionsAdminSnapshot, type HumanAccessMode } from "@/lib/actions/human-permissions";

type ModeKey = HumanAccessMode;

const MODE_LABELS: Record<ModeKey, string> = {
  BINOME_ONLY: "Binôme uniquement",
  SELECTED_MEMBERS: "Membres sélectionnés",
  SPHERE_FULL: "Sphère complète",
};

function fullName(member: { first_name: string | null; last_name: string | null }) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || "Membre sans nom";
}

export default async function AdminHumainSpherePage() {
  const snapshot = await getHumanPermissionsAdminSnapshot();

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
    </section>
  );
}
