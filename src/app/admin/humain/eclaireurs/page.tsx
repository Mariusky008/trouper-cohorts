import Link from "next/link";
import {
  adminSendScoutNudgeAction,
  adminSetScoutCommissionRateAction,
  getAdminScoutSnapshot,
} from "@/lib/actions/human-scouts";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function formatRewardValueForInput(value: number, mode: "percent" | "eur") {
  const safe = Number(value || 0);
  if (!Number.isFinite(safe)) return "";
  if (mode === "percent") {
    return String(Math.round(safe * 100) / 100);
  }
  return String(Math.round(safe * 100) / 100);
}

function scoutLabel(input: { first_name: string | null; last_name: string | null; email: string | null; phone: string | null }) {
  const full = [input.first_name, input.last_name].filter(Boolean).join(" ").trim();
  return full || input.email || input.phone || "Éclaireur";
}

function referralStatusLabel(status: string) {
  if (status === "submitted") return "Signal reçu";
  if (status === "validated") return "RDV validé";
  if (status === "offered") return "Offre envoyée";
  if (status === "converted") return "Deal signé";
  if (status === "rejected") return "Refusé";
  if (status === "cancelled") return "Annulé";
  return status || "En attente";
}

function affiliationTicketHref(activationId?: string | null) {
  if (!activationId) return "/admin/humain/affiliation?period=week";
  const params = new URLSearchParams();
  params.set("period", "week");
  params.set("marketFocus", activationId);
  return `/admin/humain/affiliation?${params.toString()}#ticket-${activationId}`;
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
  const scoutNameById = new Map(snapshot.scouts.map((scout) => [scout.id, scoutLabel(scout)]));
  const scoutOwnerById = new Map(snapshot.scouts.map((scout) => [scout.id, scout.ownerLabel]));
  const recentReferrals = snapshot.referrals.slice(0, 12);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Admin Éclaireurs</h1>
          <p className="text-sm text-muted-foreground">Pilotage des apporteurs, des signaux entrants, des règles de rétribution et des relances.</p>
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
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Rôle de cette page</p>
            <p className="mt-2 text-sm text-black/80">
              Cette page sert à piloter les <strong>éclaireurs/apporteurs</strong>, voir les <strong>signaux reçus</strong> et régler la
              <strong> rétribution (% ou €)</strong> utilisée pour le pro concerné.
            </p>
            <p className="mt-2 text-xs text-black/70">
              Pour la décision finale d’un ticket commission marketplace (validation/refus + ledger), la référence reste{" "}
              <Link className="underline" href="/admin/humain/affiliation">
                /admin/humain/affiliation
              </Link>
              .
            </p>
          </div>

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
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Derniers signaux éclaireurs</p>
              <Link href="/admin/humain/affiliation" className="text-xs font-bold underline">
                Ouvrir tickets affiliation
              </Link>
            </div>
            {recentReferrals.map((referral) => (
              <article key={referral.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">
                      {referral.contact_name || "Contact"} • {referralStatusLabel(String(referral.status || ""))}
                    </p>
                    <p className="text-xs text-black/70">
                      Apporteur: {scoutNameById.get(referral.scout_id) || referral.scout_id} • Owner:{" "}
                      {scoutOwnerById.get(referral.scout_id) || referral.owner_member_id}
                    </p>
                    <p className="text-xs text-black/70">
                      Projet: {referral.project_type || "Non renseigné"} • Créé le:{" "}
                      {new Date(referral.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Link
                    href={affiliationTicketHref(referral.matched_activation_id || null)}
                    className="inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide"
                  >
                    {referral.matched_activation_id ? "Ouvrir ticket" : "Voir affiliation"}
                  </Link>
                </div>
              </article>
            ))}
            {recentReferrals.length === 0 && <p className="text-sm text-muted-foreground">Aucun signal éclaireur pour le moment.</p>}
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
                    <select
                      name="reward_mode"
                      defaultValue={scout.ownerRewardMode || "percent"}
                      className="h-9 rounded border px-2 text-xs"
                    >
                      <option value="percent">%</option>
                      <option value="eur">€</option>
                    </select>
                    <input
                      name="reward_value"
                      defaultValue={formatRewardValueForInput(scout.ownerRewardValue || 0, scout.ownerRewardMode || "percent")}
                      className="h-9 w-24 rounded border px-2 text-xs"
                    />
                    <button className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">MAJ règle</button>
                  </form>
                </div>
                <p className="mt-2 text-xs text-black/70">
                  Règle pro préremplie: <strong>{scout.ownerRewardText || "—"}</strong>
                </p>
              </article>
            ))}
            {snapshot.scouts.length === 0 && <p className="text-sm text-muted-foreground">Aucun éclaireur pour le moment.</p>}
          </div>
        </>
      )}
    </section>
  );
}
