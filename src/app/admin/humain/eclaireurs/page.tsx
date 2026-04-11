import Link from "next/link";
import {
  adminSendScoutNudgeAction,
  adminSetScoutCommissionRateAction,
  getAdminScoutSnapshot,
} from "@/lib/actions/human-scouts";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function scoutLabel(input: { first_name: string | null; last_name: string | null; email: string | null; phone: string | null }) {
  const full = [input.first_name, input.last_name].filter(Boolean).join(" ").trim();
  return full || input.email || input.phone || "Éclaireur";
}

export default async function AdminHumainEclaireursPage({
  searchParams,
}: {
  searchParams?: Promise<{ scoutStatus?: string; scoutMessage?: string }>;
}) {
  const params = (await searchParams) || {};
  const scoutStatus = typeof params.scoutStatus === "string" ? params.scoutStatus : "";
  const scoutMessage = typeof params.scoutMessage === "string" ? params.scoutMessage : "";
  const snapshot = await getAdminScoutSnapshot();

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Admin Éclaireurs</h1>
          <p className="text-sm text-muted-foreground">Performance des apporteurs, taux commission et relances.</p>
        </div>
        <Link href="/admin/humain" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
          Retour admin humain
        </Link>
      </div>

      {scoutStatus === "success" && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {scoutMessage || "Action effectuée."}{" "}
          <Link className="underline" href="/admin/humain/eclaireurs">
            Effacer
          </Link>
        </p>
      )}
      {scoutStatus === "error" && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {scoutMessage || "Action impossible."}{" "}
          <Link className="underline" href="/admin/humain/eclaireurs">
            Effacer
          </Link>
        </p>
      )}

      {snapshot.error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{snapshot.error}</p>}

      {!snapshot.error && (
        <>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Relance inactivité</p>
            <form action={adminSendScoutNudgeAction} className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
              <input type="hidden" name="mode" value="inactive14d" />
              <input type="hidden" name="current_url" value="/admin/humain/eclaireurs" />
              <input
                name="message"
                placeholder="Message de relance (optionnel)"
                className="h-10 rounded border bg-background px-2 text-sm"
              />
              <button className="h-10 rounded bg-black px-3 text-xs font-black uppercase tracking-wide text-white">Relancer les inactifs (14j)</button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Éclaireurs</p>
              <p className="mt-1 text-2xl font-black">{snapshot.scouts.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Referrals</p>
              <p className="mt-1 text-2xl font-black">{snapshot.referrals.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Referrals convertis</p>
              <p className="mt-1 text-2xl font-black">{snapshot.referrals.filter((r) => r.status === "converted").length}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 space-y-3">
            {snapshot.scouts.map((scout) => (
              <article key={scout.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">
                      {scoutLabel(scout)} • {scout.status}
                    </p>
                    <p className="text-xs text-black/70">
                      Owner: {scout.ownerLabel} • Referrals: {scout.referralsCount} • Convertis: {scout.convertedCount}
                    </p>
                    <p className="text-xs text-black/70">
                      Latent: {euros(Number(scout.pending_earnings || 0))} • Encaissé: {euros(Number(scout.total_paid || 0))}
                    </p>
                  </div>
                  <form action={adminSetScoutCommissionRateAction} className="flex items-center gap-2">
                    <input type="hidden" name="scout_id" value={scout.id} />
                    <input type="hidden" name="current_url" value="/admin/humain/eclaireurs" />
                    <input
                      name="commission_rate"
                      defaultValue={String(scout.commission_rate)}
                      className="h-9 w-24 rounded border px-2 text-xs"
                    />
                    <button className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">MAJ taux</button>
                  </form>
                </div>
              </article>
            ))}
            {snapshot.scouts.length === 0 && <p className="text-sm text-muted-foreground">Aucun éclaireur pour le moment.</p>}
          </div>
        </>
      )}
    </section>
  );
}
