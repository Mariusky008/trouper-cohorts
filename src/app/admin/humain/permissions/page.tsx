import Link from "next/link";
import {
  adminAssignBuddy,
  adminGrantMember,
  adminRevokeMember,
  adminSetMode,
  getHumanPermissionsAdminSnapshot,
  type HumanAccessMode,
} from "@/lib/actions/human-permissions";
import { Button } from "@/components/ui/button";

const ACCESS_MODES: HumanAccessMode[] = ["BINOME_ONLY", "SELECTED_MEMBERS", "SPHERE_FULL"];

function memberLabel(member: {
  first_name: string | null;
  last_name: string | null;
  metier: string | null;
  ville: string | null;
}) {
  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
  const identity = fullName || "Membre sans nom";
  const subtitle = [member.metier, member.ville].filter(Boolean).join(" • ");
  return subtitle ? `${identity} (${subtitle})` : identity;
}

export default async function AdminHumainPermissionsPage() {
  const snapshot = await getHumanPermissionsAdminSnapshot();

  if (snapshot.error) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-black">Permissions Popey Human</h1>
        <p className="text-sm text-red-600">{snapshot.error}</p>
      </section>
    );
  }

  const memberById = new Map(snapshot.members.map((member) => [member.id, member]));

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
        <h1 className="text-3xl font-black">Permissions réseau</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Réglez l&apos;accès membre: `BINOME_ONLY`, `SELECTED_MEMBERS` ou `SPHERE_FULL`.
        </p>
        <div className="mt-3">
          <Button asChild variant="outline">
            <Link href="/admin/humain/membres">Gérer les membres</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 lg:grid-cols-3">
        <form action={adminSetMode} className="space-y-3 rounded-lg border p-3">
          <h2 className="text-sm font-black uppercase tracking-wide">Définir le mode</h2>
          <select name="user_id" required className="w-full rounded border px-2 py-2 text-sm">
            <option value="">Choisir un membre</option>
            {snapshot.candidates.map((candidate) => (
              <option key={candidate.user_id} value={candidate.user_id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <select name="access_mode" required className="w-full rounded border px-2 py-2 text-sm">
            {ACCESS_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
          <input
            name="note"
            type="text"
            placeholder="Note admin (optionnel)"
            className="w-full rounded border px-2 py-2 text-sm"
          />
          <button className="rounded bg-black px-3 py-2 text-sm font-bold text-white">Enregistrer</button>
        </form>

        <form action={adminGrantMember} className="space-y-3 rounded-lg border p-3">
          <h2 className="text-sm font-black uppercase tracking-wide">Autoriser un membre</h2>
          <select name="user_id" required className="w-full rounded border px-2 py-2 text-sm">
            <option value="">Membre qui reçoit l&apos;accès</option>
            {snapshot.candidates.map((candidate) => (
              <option key={candidate.user_id} value={candidate.user_id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <select name="allowed_user_id" required className="w-full rounded border px-2 py-2 text-sm">
            <option value="">Membre autorisé</option>
            {snapshot.candidates.map((candidate) => (
              <option key={candidate.user_id} value={candidate.user_id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <button className="rounded bg-black px-3 py-2 text-sm font-bold text-white">Ajouter</button>
        </form>

        <form action={adminAssignBuddy} className="space-y-3 rounded-lg border p-3">
          <h2 className="text-sm font-black uppercase tracking-wide">Assigner un binôme</h2>
          <select name="user_a_id" required className="w-full rounded border px-2 py-2 text-sm">
            <option value="">Membre A</option>
            {snapshot.candidates.map((candidate) => (
              <option key={candidate.user_id} value={candidate.user_id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <select name="user_b_id" required className="w-full rounded border px-2 py-2 text-sm">
            <option value="">Membre B</option>
            {snapshot.candidates.map((candidate) => (
              <option key={candidate.user_id} value={candidate.user_id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <button className="rounded bg-black px-3 py-2 text-sm font-bold text-white">Créer le binôme</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-bold">Membre</th>
              <th className="px-3 py-2 text-left font-bold">Mode</th>
              <th className="px-3 py-2 text-left font-bold">Membres autorisés</th>
              <th className="px-3 py-2 text-left font-bold">Binôme(s)</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.members.map((member) => {
              const permission = snapshot.permissionsByMemberId[member.id];
              const allowedIds = snapshot.allowedByMemberId[member.id] || [];
              const buddyIds = snapshot.buddiesByMemberId[member.id] || [];

              return (
                <tr key={member.id} className="border-t align-top">
                  <td className="px-3 py-2">
                    <p className="font-semibold">{memberLabel(member)}</p>
                    <p className="text-xs text-muted-foreground">{member.user_id}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-bold">{permission?.access_mode || "BINOME_ONLY"}</p>
                    {permission?.note && <p className="text-xs text-muted-foreground">{permission.note}</p>}
                  </td>
                  <td className="px-3 py-2">
                    {allowedIds.length === 0 && <p className="text-xs text-muted-foreground">Aucun</p>}
                    {allowedIds.map((allowedId) => {
                      const allowedMember = memberById.get(allowedId);
                      if (!allowedMember) return null;
                      return (
                        <form key={allowedId} action={adminRevokeMember} className="mb-1 flex items-center gap-2">
                          <input type="hidden" name="member_id" value={member.id} />
                          <input type="hidden" name="allowed_member_id" value={allowedId} />
                          <span className="rounded bg-muted px-2 py-1 text-xs">{memberLabel(allowedMember)}</span>
                          <button className="text-xs font-semibold text-red-600">Retirer</button>
                        </form>
                      );
                    })}
                  </td>
                  <td className="px-3 py-2">
                    {buddyIds.length === 0 && <p className="text-xs text-muted-foreground">Aucun</p>}
                    {buddyIds.map((buddyId) => {
                      const buddy = memberById.get(buddyId);
                      if (!buddy) return null;
                      return (
                        <p key={buddyId} className="mb-1 inline-block rounded bg-emerald-50 px-2 py-1 text-xs">
                          {memberLabel(buddy)}
                        </p>
                      );
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {snapshot.members.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun membre Popey Human initialisé. Utilisez les formulaires ci-dessus pour créer les premiers membres.
        </p>
      )}
    </section>
  );
}
