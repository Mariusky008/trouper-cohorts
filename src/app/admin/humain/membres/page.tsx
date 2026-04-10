import Link from "next/link";
import {
  adminInitMemberAction,
  adminSetMemberStatusAction,
  getHumanPermissionsAdminSnapshot,
  type HumanMemberStatus,
} from "@/lib/actions/human-permissions";
import { Button } from "@/components/ui/button";
import { AdminStatusBanner } from "@/components/admin/status-banner";

const MEMBER_STATUSES: HumanMemberStatus[] = ["active", "paused", "archived"];

function memberName(member: { first_name: string | null; last_name: string | null }) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || "Membre sans nom";
}

export default async function AdminHumainMembresPage({
  searchParams,
}: {
  searchParams?: Promise<{
    memberStatus?: string;
    memberMessage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const memberStatus = typeof params.memberStatus === "string" ? params.memberStatus : "";
  const memberMessage = typeof params.memberMessage === "string" ? params.memberMessage : "";
  const snapshot = await getHumanPermissionsAdminSnapshot();

  if (snapshot.error) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-black">Membres Popey Human</h1>
        <p className="text-sm text-red-600">{snapshot.error}</p>
      </section>
    );
  }

  const currentHref = (() => {
    const query = new URLSearchParams();
    if (memberStatus) query.set("memberStatus", memberStatus);
    if (memberMessage) query.set("memberMessage", memberMessage);
    const search = query.toString();
    return search ? `/admin/humain/membres?${search}` : "/admin/humain/membres";
  })();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Membres</h1>
          <p className="text-sm text-muted-foreground">
            Initialisation des membres Popey Human et pilotage des statuts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/humain">Retour espace humain</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/humain/permissions">Aller aux permissions</Link>
          </Button>
        </div>
      </div>

      <form action={adminInitMemberAction} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto]">
        <select name="user_id" required className="w-full rounded border px-3 py-2 text-sm">
          <option value="">Sélectionner un utilisateur à initialiser</option>
          {snapshot.candidates.map((candidate) => (
            <option key={candidate.user_id} value={candidate.user_id}>
              {candidate.label}
            </option>
          ))}
        </select>
        <button className="rounded bg-black px-3 py-2 text-sm font-bold text-white">Initialiser le membre</button>
        <input type="hidden" name="current_url" value={currentHref} />
      </form>

      <AdminStatusBanner status={memberStatus} message={memberMessage} clearHref="/admin/humain/membres" />

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-bold">Nom</th>
              <th className="px-3 py-2 text-left font-bold">Métier</th>
              <th className="px-3 py-2 text-left font-bold">Ville</th>
              <th className="px-3 py-2 text-left font-bold">Téléphone</th>
              <th className="px-3 py-2 text-left font-bold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.members.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="px-3 py-2">
                  <p className="font-semibold">{memberName(member)}</p>
                  <p className="text-xs text-muted-foreground">{member.user_id}</p>
                </td>
                <td className="px-3 py-2">{member.metier || "-"}</td>
                <td className="px-3 py-2">{member.ville || "-"}</td>
                <td className="px-3 py-2">{member.phone || "-"}</td>
                <td className="px-3 py-2">
                  <form action={adminSetMemberStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="member_id" value={member.id} />
                    <input type="hidden" name="current_url" value={currentHref} />
                    <select name="status" defaultValue={member.status} className="rounded border px-2 py-1 text-xs">
                      {MEMBER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button className="rounded border px-2 py-1 text-xs font-semibold">Mettre à jour</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
