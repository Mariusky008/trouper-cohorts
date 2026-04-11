import Link from "next/link";
import {
  activateScoutFromTokenAction,
  getScoutPortalByToken,
  submitScoutReferralFromTokenAction,
} from "@/lib/actions/human-scouts";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default async function PopeyHumanScoutPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ status?: string; message?: string }>;
}) {
  const route = await params;
  const token = route.token;
  const query = (await searchParams) || {};
  const status = typeof query.status === "string" ? query.status : "";
  const message = typeof query.message === "string" ? query.message : "";
  const data = await getScoutPortalByToken(token);

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Portail Éclaireur</p>
            <h1 className="text-3xl font-black">Mes alertes & gains</h1>
          </div>
          <Link href="/popey-human/login" className="text-xs font-black uppercase tracking-wide border border-white/20 rounded px-3 py-2">
            Accès membre
          </Link>
        </div>

        {status === "success" && (
          <p className="rounded border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message || "Action réussie."}</p>
        )}
        {status === "error" && (
          <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{message || "Action impossible."}</p>
        )}

        {data.error && <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{data.error}</p>}

        {!data.error && data.scout && (
          <>
            <section className="rounded-2xl border border-white/15 bg-black/25 p-4 space-y-2">
              <p className="text-sm font-black">
                {data.scout.first_name || "Éclaireur"} {data.scout.last_name || ""} • {data.scout.status}
              </p>
              <p className="text-xs text-white/75">Taux de commission: {Math.round(Number(data.scout.commission_rate || 0) * 100)}%</p>
              <p className="text-xs text-white/75">
                Gains latents: {euros(Number(data.scout.pending_earnings || 0))} • Gains encaissés: {euros(Number(data.scout.total_paid || 0))}
              </p>
            </section>

            {data.scout.status !== "active" && (
              <section className="rounded-2xl border border-[#EAC886]/40 bg-[#2A2111] p-4">
                <p className="text-sm font-black">Activer mon profil éclaireur</p>
                <form action={activateScoutFromTokenAction} className="mt-3 space-y-2">
                  <input type="hidden" name="invite_token" value={token} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      name="first_name"
                      placeholder="Prénom"
                      defaultValue={data.scout.first_name || ""}
                      className="h-10 rounded border border-white/20 bg-black/25 px-2 text-sm"
                    />
                    <input
                      name="last_name"
                      placeholder="Nom"
                      defaultValue={data.scout.last_name || ""}
                      className="h-10 rounded border border-white/20 bg-black/25 px-2 text-sm"
                    />
                  </div>
                  <input
                    name="phone"
                    placeholder="Téléphone"
                    defaultValue={data.scout.phone || ""}
                    className="h-10 w-full rounded border border-white/20 bg-black/25 px-2 text-sm"
                  />
                  <button className="h-10 w-full rounded bg-[#EAC886] text-black text-xs font-black uppercase tracking-wide">
                    Activer mon accès
                  </button>
                </form>
              </section>
            )}

            <section className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-sm font-black">Lancer une alerte</p>
              <form action={submitScoutReferralFromTokenAction} className="mt-3 space-y-2">
                <input type="hidden" name="invite_token" value={token} />
                <input name="contact_name" required placeholder="Nom du contact" className="h-10 w-full rounded border border-white/20 bg-black/25 px-2 text-sm" />
                <input
                  name="contact_phone"
                  required
                  placeholder="Téléphone du contact"
                  className="h-10 w-full rounded border border-white/20 bg-black/25 px-2 text-sm"
                />
                <input name="project_type" placeholder="Type de projet (immo, auto, santé...)" className="h-10 w-full rounded border border-white/20 bg-black/25 px-2 text-sm" />
                <input
                  name="estimated_deal_value"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Valeur estimée du deal (optionnel)"
                  className="h-10 w-full rounded border border-white/20 bg-black/25 px-2 text-sm"
                />
                <textarea
                  name="comment"
                  placeholder="Commentaire libre"
                  className="min-h-24 w-full rounded border border-white/20 bg-black/25 px-2 py-2 text-sm"
                />
                <button className="h-11 w-full rounded bg-emerald-400 text-black text-xs font-black uppercase tracking-wide">Lancer une alerte</button>
              </form>
            </section>

            <section className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-sm font-black">Historique de mes alertes</p>
              <div className="mt-3 space-y-2">
                {data.referrals.map((referral) => (
                  <article key={referral.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                    <p className="text-sm font-black">
                      {referral.contact_name} • {referral.project_type || "Projet non précisé"}
                    </p>
                    <p className="text-xs text-white/70">Statut: {referral.status}</p>
                    {referral.estimated_commission ? <p className="text-xs text-emerald-300">Potentiel: {euros(Number(referral.estimated_commission || 0))}</p> : null}
                    {referral.final_commission ? <p className="text-xs text-cyan-300">Gagné: {euros(Number(referral.final_commission || 0))}</p> : null}
                    {referral.rejection_reason && <p className="text-xs text-red-300">Motif rejet: {referral.rejection_reason}</p>}
                  </article>
                ))}
                {data.referrals.length === 0 && <p className="text-sm text-white/70">Aucune alerte envoyée pour le moment.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
