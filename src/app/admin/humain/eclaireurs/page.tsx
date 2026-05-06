import Link from "next/link";
import {
  adminResolveScoutDealAction,
  adminSendScoutNudgeAction,
  adminSetScoutCommissionRateAction,
  getAdminScoutSnapshot,
} from "@/lib/actions/human-scouts";
import { getAdminMarketplaceSnapshot } from "@/lib/actions/human-marketplace";

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

function toNumber(value: unknown) {
  const parsed = Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function readMetaNumber(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  return toNumber((metadata as Record<string, unknown>)[key]);
}

function readMetaString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  return String((metadata as Record<string, unknown>)[key] || "").trim();
}

function normalizePhoneDigits(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function whatsappThreadHref(phone: string) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return "";
  return `https://api.whatsapp.com/send?phone=${digits}`;
}

function affiliationTicketHref(activationId?: string | null, period = "week") {
  const params = new URLSearchParams();
  params.set("period", period);
  if (activationId) params.set("marketFocus", activationId);
  const base = `/admin/humain/affiliation?${params.toString()}`;
  return activationId ? `${base}#ticket-${activationId}` : base;
}

export default async function AdminHumainEclaireursPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const scoutStatus = typeof params.scoutStatus === "string" ? params.scoutStatus : "";
  const scoutMessage = typeof params.scoutMessage === "string" ? params.scoutMessage : "";
  const viewMode = typeof params.view === "string" && params.view === "compact" ? "compact" : "detailed";
  const [snapshot, marketplaceSnapshot] = await Promise.all([
    getAdminScoutSnapshot(),
    getAdminMarketplaceSnapshot({ placeCity: "all" }),
  ]);
  const activationById = new Map((marketplaceSnapshot.recentActivations || []).map((ticket) => [ticket.id, ticket]));
  const currentUrl = "/admin/humain/eclaireurs";

  const scoutCards = snapshot.scouts
    .map((scout) => {
      const referrals = snapshot.referrals.filter((referral) => referral.scout_id === scout.id);
      const inboundCount = referrals.length;
      const validatedCount = referrals.filter((referral) => {
        const activation = referral.matched_activation_id ? activationById.get(referral.matched_activation_id) : null;
        const status = readMetaString(activation?.metadata, "commission_decision_status");
        return status === "approved";
      }).length;
      return {
        scout,
        referrals,
        inboundCount,
        validatedCount,
      };
    })
    .sort((a, b) => b.inboundCount - a.inboundCount);
  const compactRows = scoutCards
    .flatMap(({ scout, referrals }) =>
      referrals.map((referral) => ({
        scout,
        referral,
      })),
    )
    .sort((a, b) => Date.parse(String(b.referral.created_at || "")) - Date.parse(String(a.referral.created_at || "")));

  let totalDuePro = 0;
  let totalDueScout = 0;
  let totalPopey = 0;
  snapshot.referrals.forEach((referral) => {
    if (!referral.matched_activation_id) return;
    const activation = activationById.get(referral.matched_activation_id);
    if (!activation) return;
    const decision = readMetaString(activation.metadata, "commission_decision_status");
    if (decision !== "approved") return;
    const scoutAmount = readMetaNumber(activation.metadata, "commission_amount_eur");
    const popeyAmount = readMetaNumber(activation.metadata, "commission_popey_fee_eur");
    const total = readMetaNumber(activation.metadata, "deal_total_due_pro_eur");
    totalDueScout += scoutAmount;
    totalPopey += popeyAmount;
    totalDuePro += total > 0 ? total : scoutAmount + popeyAmount;
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Admin Éclaireurs</h1>
          <p className="text-sm text-muted-foreground">
            Vue simple: éclaireurs, contacts entrants, validation du deal, commissions éclaireur/Popey et total dû pro.
          </p>
        </div>
        <Link href="/admin/humain" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
          Retour admin humain
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/humain/eclaireurs?view=detailed"
          className={`inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide ${
            viewMode === "detailed" ? "bg-black text-white" : ""
          }`}
        >
          Vue détaillée
        </Link>
        <Link
          href="/admin/humain/eclaireurs?view=compact"
          className={`inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide ${
            viewMode === "compact" ? "bg-black text-white" : ""
          }`}
        >
          Vue ultra compacte
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
      {marketplaceSnapshot.error && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Tickets affiliation indisponibles: {marketplaceSnapshot.error}
        </p>
      )}

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
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Contacts entrants</p>
              <p className="mt-1 text-2xl font-black">{snapshot.referrals.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Deals validés</p>
              <p className="mt-1 text-2xl font-black">
                {
                  snapshot.referrals.filter((referral) => {
                    if (!referral.matched_activation_id) return false;
                    const activation = activationById.get(referral.matched_activation_id);
                    return readMetaString(activation?.metadata, "commission_decision_status") === "approved";
                  }).length
                }
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total dû par les pros</p>
              <p className="mt-1 text-2xl font-black">{euros(Math.round(totalDuePro * 100) / 100)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total dû aux éclaireurs</p>
              <p className="mt-1 text-2xl font-black">{euros(Math.round(totalDueScout * 100) / 100)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total commission Popey</p>
              <p className="mt-1 text-2xl font-black">{euros(Math.round(totalPopey * 100) / 100)}</p>
            </div>
          </div>

          {viewMode === "compact" ? (
            <div className="rounded-xl border bg-white p-3 overflow-x-auto">
              <table className="min-w-[1400px] w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-black">Éclaireur</th>
                    <th className="px-2 py-2 text-left font-black">Parrain</th>
                    <th className="px-2 py-2 text-left font-black">Contact</th>
                    <th className="px-2 py-2 text-left font-black">Téléphone</th>
                    <th className="px-2 py-2 text-left font-black">WA</th>
                    <th className="px-2 py-2 text-left font-black">Deal €</th>
                    <th className="px-2 py-2 text-left font-black">% éclaireur</th>
                    <th className="px-2 py-2 text-left font-black">€ éclaireur (prioritaire)</th>
                    <th className="px-2 py-2 text-left font-black">Popey €</th>
                    <th className="px-2 py-2 text-left font-black">Dû éclaireur</th>
                    <th className="px-2 py-2 text-left font-black">Total dû pro</th>
                    <th className="px-2 py-2 text-left font-black">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {compactRows.map(({ scout, referral }) => {
                    const activation = referral.matched_activation_id ? activationById.get(referral.matched_activation_id) : null;
                    const dealAmount = readMetaNumber(activation?.metadata, "deal_amount_eur");
                    const dueScout = readMetaNumber(activation?.metadata, "commission_amount_eur");
                    const duePopey = readMetaNumber(activation?.metadata, "commission_popey_fee_eur");
                    const totalDue =
                      readMetaNumber(activation?.metadata, "deal_total_due_pro_eur") ||
                      (readMetaString(activation?.metadata, "commission_decision_status") === "approved" ? dueScout + duePopey : 0);
                    const rewardMode = (readMetaString(activation?.metadata, "apporteur_reward_mode") || scout.ownerRewardMode || "percent") as
                      | "percent"
                      | "eur";
                    const rewardValue = readMetaNumber(activation?.metadata, "apporteur_reward_value") || scout.ownerRewardValue || 0;
                    const rewardValueEur =
                      readMetaNumber(activation?.metadata, "apporteur_reward_value_eur") || (rewardMode === "eur" ? rewardValue : 0);
                    const rewardValuePercent =
                      readMetaNumber(activation?.metadata, "apporteur_reward_value_percent") || (rewardMode === "percent" ? rewardValue : 0);
                    const contactPhone = String(referral.contact_phone_normalized || referral.contact_phone || "").trim();
                    const waHref = whatsappThreadHref(contactPhone);
                    return (
                      <tr key={referral.id} className="border-b align-top">
                        <td className="px-2 py-2">{scoutLabel(scout)}</td>
                        <td className="px-2 py-2">{scout.ownerLabel}</td>
                        <td className="px-2 py-2">
                          {referral.contact_name || "Contact"}
                          <div className="text-[11px] text-black/60">{referralStatusLabel(String(referral.status || ""))}</div>
                        </td>
                        <td className="px-2 py-2">{contactPhone || "—"}</td>
                        <td className="px-2 py-2">
                          {waHref ? (
                            <a href={waHref} target="_blank" rel="noreferrer" className="underline">
                              Ouvrir
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        {referral.matched_activation_id ? (
                          <td className="px-2 py-2" colSpan={7}>
                            <form action={adminResolveScoutDealAction} className="grid grid-cols-[110px_110px_110px_110px_1fr_110px_110px] gap-2">
                              <input type="hidden" name="current_url" value="/admin/humain/eclaireurs?view=compact" />
                              <input type="hidden" name="activation_id" value={referral.matched_activation_id} />
                              <input type="hidden" name="scout_id" value={scout.id} />
                              <input name="deal_amount_eur" defaultValue={dealAmount > 0 ? String(dealAmount) : ""} className="h-8 rounded border px-2" />
                              <input name="reward_value_percent" defaultValue={rewardValuePercent > 0 ? String(rewardValuePercent) : ""} className="h-8 rounded border px-2" />
                              <input name="reward_value_eur" defaultValue={rewardValueEur > 0 ? String(rewardValueEur) : ""} className="h-8 rounded border px-2" />
                              <input name="popey_fee_eur" defaultValue={duePopey > 0 ? String(duePopey) : "0"} className="h-8 rounded border px-2" />
                              <input
                                name="note"
                                defaultValue={readMetaString(activation?.metadata, "workflow_note")}
                                placeholder="Note"
                                className="h-8 rounded border px-2"
                              />
                              <input type="hidden" name="reward_mode" value={rewardMode} />
                              <input type="hidden" name="reward_value" value={rewardValue > 0 ? String(rewardValue) : ""} />
                              <button
                                type="submit"
                                name="decision_status"
                                value="approved"
                                className="h-8 rounded border border-emerald-300 bg-emerald-50 px-2 font-black text-emerald-700"
                              >
                                Valider
                              </button>
                              <button
                                type="submit"
                                name="decision_status"
                                value="rejected"
                                className="h-8 rounded border border-red-300 bg-red-50 px-2 font-black text-red-700"
                              >
                                Refuser
                              </button>
                            </form>
                          </td>
                        ) : (
                          <>
                            <td className="px-2 py-2">—</td>
                            <td className="px-2 py-2">—</td>
                            <td className="px-2 py-2">—</td>
                            <td className="px-2 py-2">{euros(duePopey)}</td>
                            <td className="px-2 py-2">{euros(dueScout)}</td>
                            <td className="px-2 py-2">{euros(totalDue)}</td>
                            <td className="px-2 py-2">
                              <Link href={affiliationTicketHref(null)} className="underline">
                                Rattacher
                              </Link>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {compactRows.length === 0 && <p className="p-3 text-sm text-muted-foreground">Aucun contact pour le moment.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {scoutCards.map(({ scout, referrals, inboundCount, validatedCount }) => (
                <article key={scout.id} className="rounded-xl border bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black">
                        {scoutLabel(scout)} • {scout.status}
                      </p>
                      <p className="text-xs text-black/70">
                        Parrain (pro): {scout.ownerLabel} • Contacts reçus: {inboundCount} • Deals validés: {validatedCount}
                      </p>
                    </div>
                    <form action={adminSetScoutCommissionRateAction} className="flex items-center gap-2">
                      <input type="hidden" name="scout_id" value={scout.id} />
                      <input type="hidden" name="current_url" value={currentUrl} />
                      <select name="reward_mode" defaultValue={scout.ownerRewardMode || "percent"} className="h-9 rounded border px-2 text-xs">
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
                  <p className="text-xs text-black/70">
                    Règle actuelle de base: <strong>{scout.ownerRewardText || "—"}</strong>
                  </p>

                  <div className="space-y-2">
                    {referrals.map((referral) => {
                      const activation = referral.matched_activation_id ? activationById.get(referral.matched_activation_id) : null;
                      const decisionStatus = readMetaString(activation?.metadata, "commission_decision_status") || "pending";
                      const dealAmount = readMetaNumber(activation?.metadata, "deal_amount_eur");
                      const dueScout = readMetaNumber(activation?.metadata, "commission_amount_eur");
                      const duePopey = readMetaNumber(activation?.metadata, "commission_popey_fee_eur");
                      const totalDue =
                        readMetaNumber(activation?.metadata, "deal_total_due_pro_eur") || (decisionStatus === "approved" ? dueScout + duePopey : 0);
                      const rewardMode = (readMetaString(activation?.metadata, "apporteur_reward_mode") || scout.ownerRewardMode || "percent") as
                        | "percent"
                        | "eur";
                      const rewardValue = readMetaNumber(activation?.metadata, "apporteur_reward_value") || scout.ownerRewardValue || 0;
                      const rewardValueEur =
                        readMetaNumber(activation?.metadata, "apporteur_reward_value_eur") || (rewardMode === "eur" ? rewardValue : 0);
                      const rewardValuePercent =
                        readMetaNumber(activation?.metadata, "apporteur_reward_value_percent") || (rewardMode === "percent" ? rewardValue : 0);
                      const note = readMetaString(activation?.metadata, "workflow_note");
                      const contactPhone = String(referral.contact_phone_normalized || referral.contact_phone || "").trim();
                      const waHref = whatsappThreadHref(contactPhone);
                      return (
                        <div key={referral.id} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-black">
                                {referral.contact_name || "Contact"} • {referralStatusLabel(String(referral.status || ""))}
                              </p>
                              <p className="text-xs text-black/70">
                                Téléphone: {contactPhone || "Non renseigné"} • Statut deal:{" "}
                                {decisionStatus === "approved" ? "Validé" : decisionStatus === "rejected" ? "Refusé" : "À confirmer"}
                              </p>
                              <p className="text-xs text-black/70">
                                Dû éclaireur: {euros(dueScout)} • Commission Popey: {euros(duePopey)} • Total dû pro: {euros(totalDue)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {waHref ? (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide"
                                >
                                  Ouvrir WhatsApp
                                </a>
                              ) : null}
                              <Link
                                href={affiliationTicketHref(referral.matched_activation_id || null)}
                                className="inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide"
                              >
                                {referral.matched_activation_id ? "Ouvrir ticket" : "Voir affiliation"}
                              </Link>
                            </div>
                          </div>

                          {referral.matched_activation_id ? (
                            <form action={adminResolveScoutDealAction} className="mt-3 grid gap-2 md:grid-cols-6">
                              <input type="hidden" name="current_url" value={currentUrl} />
                              <input type="hidden" name="activation_id" value={referral.matched_activation_id} />
                              <input type="hidden" name="scout_id" value={scout.id} />
                              <input
                                name="deal_amount_eur"
                                defaultValue={dealAmount > 0 ? String(dealAmount) : ""}
                                placeholder="Montant deal €"
                                className="h-9 rounded border px-2 text-xs"
                              />
                              <input
                                name="reward_value_percent"
                                defaultValue={rewardValuePercent > 0 ? String(rewardValuePercent) : ""}
                                placeholder="Rétribution %"
                                className="h-9 rounded border px-2 text-xs"
                              />
                              <input
                                name="reward_value_eur"
                                defaultValue={rewardValueEur > 0 ? String(rewardValueEur) : ""}
                                placeholder="Rétribution € (prioritaire)"
                                className="h-9 rounded border px-2 text-xs"
                              />
                              <input
                                name="popey_fee_eur"
                                defaultValue={duePopey > 0 ? String(duePopey) : "0"}
                                placeholder="Commission Popey €"
                                className="h-9 rounded border px-2 text-xs"
                              />
                              <input
                                name="note"
                                defaultValue={note}
                                placeholder="Note"
                                className="h-9 rounded border px-2 text-xs md:col-span-2"
                              />
                              <input type="hidden" name="reward_mode" value={rewardMode} />
                              <input type="hidden" name="reward_value" value={rewardValue > 0 ? String(rewardValue) : ""} />
                              <div className="flex items-center gap-2">
                                <button
                                  type="submit"
                                  name="decision_status"
                                  value="approved"
                                  className="h-9 rounded border border-emerald-300 bg-emerald-50 px-3 text-xs font-black uppercase tracking-wide text-emerald-700"
                                >
                                  Valider deal
                                </button>
                                <button
                                  type="submit"
                                  name="decision_status"
                                  value="rejected"
                                  className="h-9 rounded border border-red-300 bg-red-50 px-3 text-xs font-black uppercase tracking-wide text-red-700"
                                >
                                  Refuser
                                </button>
                              </div>
                            </form>
                          ) : (
                            <p className="mt-2 text-xs text-amber-700">
                              Aucun ticket lié automatiquement à ce contact. Ouvre “Affiliation” pour rattacher/valider manuellement.
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {referrals.length === 0 && <p className="text-sm text-muted-foreground">Aucun contact pour cet éclaireur.</p>}
                  </div>
                </article>
              ))}
              {scoutCards.length === 0 && <p className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">Aucun éclaireur pour le moment.</p>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
