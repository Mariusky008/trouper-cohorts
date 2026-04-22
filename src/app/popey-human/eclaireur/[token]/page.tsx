import Link from "next/link";
import {
  activateScoutFromTokenAction,
  getScoutPortalByToken,
  submitScoutReferralFromTokenAction,
} from "@/lib/actions/human-scouts";
import { ScoutAlertForm } from "./_components/scout-alert-form";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isWinningStatus(status: string) {
  return status === "offered" || status === "converted";
}

function referralStatusLabel(status: string) {
  if (status === "submitted") return "Envoyée";
  if (status === "validated") return "RDV pris";
  if (status === "offered") return "Offre envoyée";
  if (status === "converted") return "Signée";
  if (status === "rejected") return "Refusée";
  return status;
}

function referralStatusClass(status: string) {
  if (status === "converted") return "border-cyan-300/45 bg-cyan-500/15 text-cyan-100";
  if (status === "offered") return "border-fuchsia-300/45 bg-fuchsia-500/15 text-fuchsia-100";
  if (status === "validated") return "border-emerald-300/45 bg-emerald-500/15 text-emerald-100";
  if (status === "rejected") return "border-red-300/45 bg-red-500/15 text-red-100";
  return "border-white/20 bg-white/8 text-white/85";
}

function referralTimelineStep(status: string) {
  if (status === "converted") return 3;
  if (status === "offered") return 2;
  if (status === "validated") return 1;
  return 0;
}

export default async function PopeyHumanScoutPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ status?: string; message?: string; modal?: string; tab?: string }>;
}) {
  const route = await params;
  const token = route.token;
  const query = (await searchParams) || {};
  const status = typeof query.status === "string" ? query.status : "";
  const message = typeof query.message === "string" ? query.message : "";
  const tab = query.tab === "history" || query.tab === "gains" ? query.tab : "alert";
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
  const historyHref = `/popey-human/eclaireur/${token}?tab=history`;
  const alertHref = `/popey-human/eclaireur/${token}?tab=alert`;
  const gainsHref = `/popey-human/eclaireur/${token}?tab=gains`;

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-[calc(env(safe-area-inset-top)+22px)] pb-8 space-y-5">
        <div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Portail Éclaireur</p>
            <h1 className="text-3xl font-black">Mes alertes & gains</h1>
          </div>
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
            {tab === "gains" && (
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

                <section className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-cyan-200/90">Votre parrain</p>
                  <p className="mt-1 text-lg font-black text-cyan-100">{sponsorName}</p>
                  <p className="text-sm text-cyan-100/80">
                    {[data.sponsor?.metier, data.sponsor?.ville].filter(Boolean).join(" • ") || "Équipe Popey Human"}
                  </p>
                  {data.sponsor?.phone ? (
                    <a
                      href={`tel:${data.sponsor.phone.replaceAll(" ", "")}`}
                      className="mt-3 inline-flex h-10 rounded-lg border border-cyan-200/40 px-3 items-center text-xs font-black uppercase tracking-wide text-cyan-100"
                    >
                      Appeler mon parrain
                    </a>
                  ) : null}
                </section>
              </>
            )}

            {tab === "alert" && (
              <ScoutAlertForm
                inviteToken={data.invite?.invite_token || token}
                sponsorName={sponsorName}
                submitAction={submitScoutReferralFromTokenAction}
              />
            )}

            {tab === "history" && (
              <section className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#12191B] to-[#0B0E10] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">Historique</p>
                    <h2 className="mt-1 text-xl sm:text-2xl font-black">Mes alertes envoyées</h2>
                  </div>
                  <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/80">
                    {data.referrals.length} alerte(s)
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-200/90">Signées</p>
                    <p className="mt-1 text-xl font-black text-emerald-100">{data.referrals.filter((r) => r.status === "converted").length}</p>
                  </div>
                  <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-cyan-200/90">Offres</p>
                    <p className="mt-1 text-xl font-black text-cyan-100">{data.referrals.filter((r) => r.status === "offered").length}</p>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/80">En cours</p>
                    <p className="mt-1 text-xl font-black text-white">{data.referrals.filter((r) => !["converted", "offered", "rejected"].includes(r.status)).length}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {data.referrals.map((referral) => (
                    <article key={referral.id} className="rounded-xl border border-white/15 bg-black/25 px-3 py-3 sm:px-4">
                      {(() => {
                        const step = referralTimelineStep(referral.status);
                        const timeline = [
                          { id: "recu", label: "Reçu", idx: 0, at: referral.created_at },
                          { id: "rdv", label: "RDV", idx: 1, at: referral.validated_at },
                          { id: "offre", label: "Offre", idx: 2, at: referral.offered_at },
                          { id: "signe", label: "Signé", idx: 3, at: referral.converted_at },
                        ];
                        return (
                          <div className="mb-2 rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-2 py-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-cyan-200/90">
                              Suivi synchronisé membre
                            </p>
                            <div className="mt-2 grid grid-cols-4 gap-1">
                              {timeline.map((item) => (
                                <div
                                  key={`${referral.id}-${item.id}`}
                                  className={`rounded-md border px-1 py-1 text-center ${
                                    item.idx <= step
                                      ? "border-emerald-300/45 bg-emerald-500/20 text-emerald-100"
                                      : "border-white/20 bg-white/5 text-white/65"
                                  }`}
                                >
                                  <p className="text-[10px] font-black uppercase tracking-[0.08em]">{item.label}</p>
                                  <p className="mt-0.5 text-[9px] text-white/70">
                                    {item.at ? new Date(item.at).toLocaleDateString("fr-FR") : "—"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-base sm:text-lg font-black leading-tight">
                          {referral.contact_name}
                        </p>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${referralStatusClass(referral.status)}`}>
                          {referralStatusLabel(referral.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/75">{referral.project_type || "Projet non précisé"}</p>
                      <p className="mt-1 text-[11px] text-white/50">
                        {new Date(referral.created_at).toLocaleDateString("fr-FR")} • {new Date(referral.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-2 py-1.5">
                          <p className="text-[10px] uppercase font-black tracking-[0.1em] text-emerald-200/90">Potentiel</p>
                          <p className="text-sm font-black text-emerald-100">{referral.estimated_commission ? euros(Number(referral.estimated_commission || 0)) : "—"}</p>
                        </div>
                        <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-2 py-1.5">
                          <p className="text-[10px] uppercase font-black tracking-[0.1em] text-cyan-200/90">Gagné</p>
                          <p className="text-sm font-black text-cyan-100">{referral.final_commission ? euros(Number(referral.final_commission || 0)) : "—"}</p>
                        </div>
                      </div>
                      {referral.rejection_reason && <p className="mt-2 text-xs text-red-300">Motif rejet: {referral.rejection_reason}</p>}
                    </article>
                  ))}
                  {data.referrals.length === 0 && (
                    <div className="rounded-xl border border-white/15 bg-black/20 px-4 py-5 text-center">
                      <p className="text-sm text-white/75">Aucune alerte envoyée pour le moment.</p>
                      <p className="mt-1 text-xs text-white/55">Commencez par l’onglet “Alerte” pour déclencher votre première opportunité.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      {!data.error && data.scout && (
        <nav className="fixed inset-x-0 bottom-0 z-40 pb-safe px-4">
          <div className="mx-auto max-w-2xl mb-3 rounded-2xl border border-white/20 bg-[#0E1213]/95 p-2 grid grid-cols-3 gap-2 backdrop-blur">
            <Link
              href={historyHref}
              className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide inline-flex items-center justify-center ${
                tab === "history" ? "bg-emerald-400 text-black" : "border border-white/20 bg-black/25 text-white/85"
              }`}
            >
              Historique
            </Link>
            <Link
              href={alertHref}
              className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide inline-flex items-center justify-center ${
                tab === "alert" ? "bg-emerald-400 text-black" : "border border-white/20 bg-black/25 text-white/85"
              }`}
            >
              Alerte
            </Link>
            <Link
              href={gainsHref}
              className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide inline-flex items-center justify-center ${
                tab === "gains" ? "bg-emerald-400 text-black" : "border border-white/20 bg-black/25 text-white/85"
              }`}
            >
              Gains
            </Link>
          </div>
        </nav>
      )}
    </main>
  );
}
