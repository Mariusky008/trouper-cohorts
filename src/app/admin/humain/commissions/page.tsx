import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminStatusBanner } from "@/components/admin/status-banner";
import {
  adminSetHumanCommissionStatusAction,
  getAdminHumanCommissions,
} from "@/lib/actions/human-cash";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function paymentStatusLabel(status: "pending" | "paid" | "cancelled") {
  if (status === "pending") return "En attente";
  if (status === "paid") return "Payée";
  return "Annulée";
}

export default async function AdminHumainCommissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    commissionStatus?: string;
    commissionMessage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const commissionStatus = typeof params.commissionStatus === "string" ? params.commissionStatus : "";
  const commissionMessage = typeof params.commissionMessage === "string" ? params.commissionMessage : "";
  const feed = await getAdminHumanCommissions();

  if (feed.error) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-black">Commissions</h1>
        <p className="text-sm text-red-600">{feed.error}</p>
      </section>
    );
  }

  const clearHref = "/admin/humain/commissions";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Commissions</h1>
          <p className="text-sm text-muted-foreground">Pilotage des commissions générées sur les deals signés.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/humain/cockpit">Aller au cockpit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/humain">Retour espace humain</Link>
          </Button>
        </div>
      </div>

      <AdminStatusBanner status={commissionStatus} message={commissionMessage} clearHref={clearHref} />

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-bold">Date</th>
              <th className="px-3 py-2 text-left font-bold">Lead</th>
              <th className="px-3 py-2 text-left font-bold">Payeur</th>
              <th className="px-3 py-2 text-left font-bold">Receveur</th>
              <th className="px-3 py-2 text-left font-bold">Montant signé</th>
              <th className="px-3 py-2 text-left font-bold">Commission</th>
              <th className="px-3 py-2 text-left font-bold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {feed.commissions.map((commission) => (
              <tr key={commission.id} className="border-t align-top">
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(commission.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{commission.lead_id}</td>
                <td className="px-3 py-2">{commission.payerLabel}</td>
                <td className="px-3 py-2">{commission.receiverLabel}</td>
                <td className="px-3 py-2">{euros(Number(commission.signed_amount))}</td>
                <td className="px-3 py-2 font-semibold text-emerald-700">{euros(Number(commission.commission_amount))}</td>
                <td className="px-3 py-2">
                  <form action={adminSetHumanCommissionStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="commission_id" value={commission.id} />
                    <input type="hidden" name="current_url" value={clearHref} />
                    <select name="payment_status" defaultValue={commission.payment_status} className="rounded border px-2 py-1 text-xs">
                      <option value="pending">En attente</option>
                      <option value="paid">Payée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                    <button className="rounded border px-2 py-1 text-xs font-semibold">Mettre à jour</button>
                  </form>
                  <p className="mt-1 text-xs text-muted-foreground">{paymentStatusLabel(commission.payment_status)}</p>
                </td>
              </tr>
            ))}
            {feed.commissions.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-sm text-muted-foreground" colSpan={7}>
                  Aucune commission disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
