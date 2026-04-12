import Link from "next/link";
import {
  convertScoutReferralAction,
  createScoutInviteAction,
  getMyScoutWorkspace,
  markScoutReferralPaidAction,
  rejectScoutReferralAction,
  validateScoutReferralAction,
} from "@/lib/actions/human-scouts";
import { ScoutShareLink } from "@/components/popey-human/scout-share-link";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function scoutLabel(input: { first_name: string | null; last_name: string | null; email: string | null; phone: string | null }) {
  const full = [input.first_name, input.last_name].filter(Boolean).join(" ").trim();
  return full || input.email || input.phone || "Éclaireur";
}

export default async function PopeyHumanScoutsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    scoutStatus?: string;
    scoutMessage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const scoutStatus = typeof params.scoutStatus === "string" ? params.scoutStatus : "";
  const scoutMessage = typeof params.scoutMessage === "string" ? params.scoutMessage : "";
  const workspace = await getMyScoutWorkspace();

  const referralsByScoutId = new Map<string, typeof workspace.referrals>();
  workspace.referrals.forEach((referral) => {
    const arr = referralsByScoutId.get(referral.scout_id) || [];
    arr.push(referral);
    referralsByScoutId.set(referral.scout_id, arr);
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Popey Human</p>
          <h1 className="text-3xl font-black">Éclaireurs</h1>
          <p className="text-sm text-white/75">Vos apporteurs locaux et leurs alertes en temps réel.</p>
        </div>
        <Link
          href="/popey-human/app"
          className="h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide border border-white/20 bg-white/10 text-white/90"
        >
          Retour cockpit
        </Link>
      </div>

      {scoutStatus === "success" && (
        <p className="rounded border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {scoutMessage || "Action effectuée."}{" "}
          <Link className="underline" href="/popey-human/app/eclaireurs">
            Effacer
          </Link>
        </p>
      )}
      {scoutStatus === "error" && (
        <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {scoutMessage || "Action impossible."}{" "}
          <Link className="underline" href="/popey-human/app/eclaireurs">
            Effacer
          </Link>
        </p>
      )}

      {workspace.error && <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{workspace.error}</p>}

      {!workspace.error && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/15 bg-black/25 p-4 space-y-3">
            <p className="text-xs uppercase font-black tracking-[0.12em] text-white/65">Inviter un éclaireur</p>
            <form action={createScoutInviteAction} className="space-y-2">
              <input type="hidden" name="current_url" value="/popey-human/app/eclaireurs" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="first_name" placeholder="Prénom" className="h-10 rounded border border-white/20 bg-black/25 px-2 text-sm" />
                <input name="last_name" placeholder="Nom" className="h-10 rounded border border-white/20 bg-black/25 px-2 text-sm" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="phone" placeholder="Téléphone" className="h-10 rounded border border-white/20 bg-black/25 px-2 text-sm" />
                <input name="email" placeholder="Email" className="h-10 rounded border border-white/20 bg-black/25 px-2 text-sm" />
              </div>
              <input
                name="commission_rate"
                defaultValue="0.10"
                placeholder="Taux commission (0.10)"
                className="h-10 w-full rounded border border-white/20 bg-black/25 px-2 text-sm"
              />
              <button className="h-10 w-full rounded-lg bg-[#EAC886] text-black text-xs font-black uppercase tracking-wide">
                Générer le lien éclaireur
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
            <p className="text-xs uppercase font-black tracking-[0.12em] text-white/65">Vos éclaireurs</p>
            <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {workspace.scouts.map((scout) => {
                const referrals = referralsByScoutId.get(scout.id) || [];
                const invite = workspace.inviteByScoutId[scout.id];
                return (
                  <div key={scout.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                    <p className="text-sm font-black">
                      {scoutLabel(scout)} • {scout.status}
                    </p>
                    <p className="text-xs text-white/70">
                      Taux: {Math.round(Number(scout.commission_rate || 0) * 100)}% • Latent: {euros(Number(scout.pending_earnings || 0))} • Encaissé:{" "}
                      {euros(Number(scout.total_paid || 0))}
                    </p>
                    <p className="text-xs text-white/65">Referrals: {referrals.length}</p>
                    {invite && (
                      <>
                        {invite.short_code ? (
                          <p className="mt-1 text-[11px] text-[#EAC886]">
                            Code court: <span className="font-black tracking-wider">{invite.short_code}</span>
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-emerald-300/85 break-all">
                          Lien complet: https://www.popey.academy/popey-human/eclaireur/{invite.invite_token}
                        </p>
                        {invite.short_code ? (
                          <>
                            <p className="mt-1 text-[11px] text-[#EAC886]/85">
                              Accès simple ensuite: https://www.popey.academy/popey-human/eclaireur?code={invite.short_code}
                            </p>
                            <ScoutShareLink url={`https://www.popey.academy/popey-human/eclaireur?code=${invite.short_code}`} />
                          </>
                        ) : (
                          <ScoutShareLink url={`https://www.popey.academy/popey-human/eclaireur/${invite.invite_token}`} />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {workspace.scouts.length === 0 && <p className="text-sm text-white/70">Aucun éclaireur pour le moment.</p>}
            </div>
          </div>
        </div>
      )}

      {!workspace.error && (
        <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
          <p className="text-xs uppercase font-black tracking-[0.12em] text-white/65">Alertes éclaireurs à traiter</p>
          <div className="mt-3 space-y-3">
            {workspace.referrals.map((referral) => {
              const scout = workspace.scouts.find((item) => item.id === referral.scout_id) || null;
              return (
                <article key={referral.id} className="rounded-lg border border-white/15 bg-black/25 p-3">
                  <p className="text-sm font-black">
                    {referral.contact_name} • {referral.project_type || "Projet non précisé"}
                  </p>
                  <p className="text-xs text-white/70">
                    Éclaireur: {scout ? scoutLabel(scout) : referral.scout_id} • Statut: {referral.status}
                  </p>
                  {referral.contact_phone && <p className="text-xs text-white/70">Tél: {referral.contact_phone}</p>}
                  {referral.comment && <p className="text-xs text-white/75 mt-1">{referral.comment}</p>}
                  {referral.rejection_reason && <p className="text-xs text-red-300 mt-1">Motif rejet: {referral.rejection_reason}</p>}

                  {referral.status === "submitted" && (
                    <div className="mt-2 grid gap-2 lg:grid-cols-2">
                      <form action={validateScoutReferralAction} className="space-y-2">
                        <input type="hidden" name="referral_id" value={referral.id} />
                        <input type="hidden" name="current_url" value="/popey-human/app/eclaireurs" />
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          name="estimated_deal_value"
                          defaultValue={referral.estimated_deal_value || ""}
                          placeholder="Deal estimé (€)"
                          className="h-9 w-full rounded border border-white/20 bg-black/25 px-2 text-xs"
                        />
                        <button className="h-9 w-full rounded bg-emerald-400 text-black text-xs font-black uppercase">Valider</button>
                      </form>
                      <form action={rejectScoutReferralAction} className="space-y-2">
                        <input type="hidden" name="referral_id" value={referral.id} />
                        <input type="hidden" name="current_url" value="/popey-human/app/eclaireurs" />
                        <input
                          name="rejection_reason"
                          placeholder="Motif rejet (obligatoire)"
                          className="h-9 w-full rounded border border-white/20 bg-black/25 px-2 text-xs"
                        />
                        <button className="h-9 w-full rounded border border-red-300/40 text-red-200 text-xs font-black uppercase">Rejeter</button>
                      </form>
                    </div>
                  )}

                  {referral.status === "validated" && (
                    <form action={convertScoutReferralAction} className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input type="hidden" name="referral_id" value={referral.id} />
                      <input type="hidden" name="current_url" value="/popey-human/app/eclaireurs" />
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        name="signed_amount"
                        defaultValue={referral.estimated_deal_value || ""}
                        className="h-9 rounded border border-white/20 bg-black/25 px-2 text-xs"
                        placeholder="Montant signé"
                      />
                      <button className="h-9 rounded bg-[#EAC886] px-3 text-black text-xs font-black uppercase">Passer signé</button>
                    </form>
                  )}

                  {referral.status === "converted" && !referral.paid_at && (
                    <form action={markScoutReferralPaidAction} className="mt-2">
                      <input type="hidden" name="referral_id" value={referral.id} />
                      <input type="hidden" name="current_url" value="/popey-human/app/eclaireurs" />
                      <button className="h-9 rounded border border-cyan-300/40 px-3 text-cyan-200 text-xs font-black uppercase">
                        Marquer payé ({euros(Number(referral.final_commission || 0))})
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
            {workspace.referrals.length === 0 && <p className="text-sm text-white/70">Aucune alerte éclaireur pour le moment.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
