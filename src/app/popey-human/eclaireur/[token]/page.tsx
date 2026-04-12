import {
  activateScoutFromTokenAction,
  getScoutPortalByToken,
  submitScoutReferralFromTokenAction,
} from "@/lib/actions/human-scouts";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isWinningStatus(status: string) {
  return status === "validated" || status === "converted";
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
  const scout = data.scout;
  const referrals = data.referrals || [];
  const pendingFromScout = Number(scout?.pending_earnings || 0);
  const paidFromScout = Number(scout?.total_paid || 0);
  const potentialFromReferrals = referrals.reduce((sum, referral) => sum + Number(referral.estimated_commission || 0), 0);
  const wonFromReferrals = referrals.reduce((sum, referral) => sum + Number(referral.final_commission || 0), 0);
  const effectivePending = Math.max(pendingFromScout, potentialFromReferrals);
  const effectivePaid = Math.max(paidFromScout, wonFromReferrals);
  const total = effectivePending + effectivePaid;
  const level = 1 + Math.floor(total / 500);
  const nextMilestone = (level + 1) * 500;
  const levelProgress = clamp(((total - level * 500) / 500) * 100, 0, 100);
  const sortedByDate = [...referrals].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  let currentStreak = 0;
  for (const referral of sortedByDate) {
    if (!isWinningStatus(referral.status)) break;
    currentStreak += 1;
  }
  const weeklyWins = sortedByDate.filter(
    (referral) =>
      isWinningStatus(referral.status) &&
      Date.now() - +new Date(referral.created_at) <= 1000 * 60 * 60 * 24 * 7
  ).length;
  const weeklyBadge =
    weeklyWins >= 6 ? "Pluie d'Or" : weeklyWins >= 3 ? "Sprinter" : weeklyWins >= 1 ? "En feu" : "Starter";
  const sponsorName = data.sponsor?.name || data.sponsorName || "Popey Human";

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Portail Éclaireur</p>
          <h1 className="text-3xl font-black">Mes alertes & gains</h1>
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
            <section className="relative overflow-hidden rounded-2xl border border-[#EAC886]/45 bg-[radial-gradient(120%_120%_at_0%_0%,#2d240f_0%,#1a160d_45%,#0e1012_100%)] p-4 space-y-3 shadow-[0_25px_60px_-35px_rgba(234,200,134,0.75)]">
              <div className="pointer-events-none absolute -top-10 -right-12 h-40 w-40 rounded-full bg-[#EAC886]/20 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Tableau des gains</p>
                  <h2 className="mt-1 text-2xl font-black leading-tight">
                    {data.scout.first_name || "Éclaireur"} {data.scout.last_name || ""} • {data.scout.status}
                  </h2>
                </div>
                <div className="rounded-xl border border-[#EAC886]/45 bg-[#EAC886]/15 px-3 py-2 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Niveau</p>
                  <p className="text-xl font-black text-[#EAC886]">#{level}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.1em] text-emerald-200/90">Potentiel en jeu</p>
                  <p className="mt-1 text-xl font-black text-emerald-200">{euros(effectivePending)}</p>
                </div>
                <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.1em] text-cyan-200/90">Gains encaissés</p>
                  <p className="mt-1 text-xl font-black text-cyan-200">{euros(effectivePaid)}</p>
                </div>
                <div className="rounded-xl border border-[#EAC886]/35 bg-[#EAC886]/10 p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.1em] text-[#EAC886]/90">Commission</p>
                  <p className="mt-1 text-xl font-black text-[#EAC886]">{Math.round(Number(data.scout.commission_rate || 0) * 100)}%</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/15 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-[0.1em]">
                  <span className="text-white/70">Progression vers niveau {level + 1}</span>
                  <span className="text-[#EAC886]">{euros(nextMilestone)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-[#EAC886] to-cyan-300 animate-pulse"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/12 p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.1em] text-emerald-200/85">Streak actuel</p>
                  <p className="mt-1 text-2xl font-black text-emerald-200">{currentStreak}x</p>
                  <p className="text-[11px] text-emerald-100/80">Alertes qualifiées d&apos;affilée</p>
                </div>
                <div className="rounded-xl border border-[#EAC886]/45 bg-[#EAC886]/12 p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.1em] text-[#EAC886]/90">Badge hebdo</p>
                  <p className="mt-1 text-2xl font-black text-[#EAC886] animate-pulse">{weeklyBadge}</p>
                  <p className="text-[11px] text-[#EAC886]/75">{weeklyWins} victoire(s) cette semaine</p>
                </div>
              </div>
            </section>

            {data.scout.status !== "active" && (
              <section className="rounded-2xl border border-[#EAC886]/40 bg-[#2A2111] p-4">
                <p className="text-sm font-black">Activer mon profil éclaireur</p>
                <form action={activateScoutFromTokenAction} className="mt-3 space-y-2">
                  <input type="hidden" name="invite_token" value={data.invite?.invite_token || token} />
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
              <p className="text-xs text-white/70">
                Cette alerte sera envoyée à votre parrain {sponsorName} pour qualification et dispatch.
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-cyan-200/90">Votre parrain</p>
                  <p className="mt-1 text-sm font-black text-cyan-100">{sponsorName}</p>
                  <p className="text-[11px] text-cyan-100/80">
                    {[data.sponsor?.metier, data.sponsor?.ville].filter(Boolean).join(" • ") || "Équipe Popey Human"}
                  </p>
                  {data.sponsor?.phone ? (
                    <a
                      href={`tel:${data.sponsor.phone.replaceAll(" ", "")}`}
                      className="mt-2 inline-flex h-8 rounded-lg border border-cyan-200/40 px-2 items-center text-[11px] font-black uppercase tracking-wide text-cyan-100"
                    >
                      Appeler mon parrain
                    </a>
                  ) : null}
                </div>
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-200/90">Confiance & suivi</p>
                  <ul className="mt-1 space-y-1 text-[11px] text-emerald-100/85">
                    <li>Qualification humaine du besoin avant diffusion.</li>
                    <li>Alerte tracée avec statut visible dans votre historique.</li>
                    <li>Commission calculée automatiquement selon votre taux.</li>
                  </ul>
                </div>
              </div>
              <form action={submitScoutReferralFromTokenAction} className="mt-3 space-y-2">
                <input type="hidden" name="invite_token" value={data.invite?.invite_token || token} />
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
