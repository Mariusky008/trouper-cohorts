import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminDecideAffiliateCommissionAction,
  adminDeleteAffiliateTicketAction,
  adminSendPrivilegeActivationFollowupNowAction,
  adminUpdatePrivilegeActivationStatusAction,
  getAdminMarketplaceSnapshot,
} from "@/lib/actions/human-marketplace";

type SignupLogRow = {
  id: string;
  scout_id: string | null;
  event_type: string;
  payload_json: Record<string, unknown> | null;
  created_at: string;
};

type ScoutRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: string | null;
};

type MemberMiniRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  metier: string | null;
};

type CommissionDecisionRow = {
  activation_id: string;
  decision_status: "pending" | "approved" | "rejected";
  commission_amount_eur: number | null;
  apporteur_type: "scout_public" | "member_pro" | "unknown";
  apporteur_name: string | null;
  apporteur_phone: string | null;
  note: string | null;
  decided_at: string | null;
};

function txt(value: unknown) {
  return String(value || "").trim();
}

function scoutLabel(input: ScoutRow | null) {
  if (!input) return "Éclaireur inconnu";
  const full = [txt(input.first_name), txt(input.last_name)].filter(Boolean).join(" ").trim();
  return full || input.phone || input.id;
}

function toDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date inconnue";
  return d.toLocaleString("fr-FR");
}

function readTicketStatus(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "pending";
  const value = String((metadata as Record<string, unknown>).workflow_status || "pending")
    .trim()
    .toLowerCase();
  if (value === "new") return "pending";
  if (value === "rdv") return "in_progress";
  if (value === "signed") return "validated";
  if (value === "closed") return "refused";
  if (!["pending", "contacted", "in_progress", "validated", "refused"].includes(value)) return "pending";
  return value;
}

function readTicketCode(metadata: unknown, fallbackId: string): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return `POPEY-${fallbackId.slice(0, 6).toUpperCase()}`;
  }
  const fromMeta = String((metadata as Record<string, unknown>).ticket_code || "").trim();
  if (fromMeta) return fromMeta;
  return `POPEY-${fallbackId.slice(0, 6).toUpperCase()}`;
}

function ticketLabel(status: string) {
  if (status === "contacted") return "Contacte";
  if (status === "in_progress") return "En cours";
  if (status === "validated") return "Valide";
  if (status === "refused") return "Refuse";
  return "En attente";
}

function readMetaText(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  return String((metadata as Record<string, unknown>)[key] || "").trim();
}

function webhookBadge(input: string) {
  const value = String(input || "").trim().toLowerCase();
  if (value === "positive") return { label: "Réponse Positive", className: "border-emerald-300 bg-emerald-50 text-emerald-700" };
  if (value === "negative") return { label: "Réponse Négative", className: "border-amber-300 bg-amber-50 text-amber-700" };
  if (value === "stop") return { label: "STOP", className: "border-rose-300 bg-rose-50 text-rose-700" };
  return { label: "Sans réponse", className: "border-slate-300 bg-slate-50 text-slate-600" };
}

function looksLikeUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(txt(value));
}

function commissionDecisionLabel(value: string) {
  if (value === "approved") return "Commission validée";
  if (value === "rejected") return "Commission refusée";
  return "Décision en attente";
}

function periodLabel(value: string) {
  if (value === "day") return "Jour";
  if (value === "week") return "Semaine";
  if (value === "month") return "Mois";
  if (value === "year") return "Année";
  return "Tout";
}

function periodThreshold(period: string): number | null {
  const now = Date.now();
  if (period === "day") return now - 24 * 60 * 60 * 1000;
  if (period === "week") return now - 7 * 24 * 60 * 60 * 1000;
  if (period === "month") return now - 30 * 24 * 60 * 60 * 1000;
  if (period === "year") return now - 365 * 24 * 60 * 60 * 1000;
  return null;
}

function toWhatsAppDigits(raw: string) {
  let digits = txt(raw).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `33${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return "";
  return digits;
}

function whatsappClientUrl(phone: string, message: string) {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return "";
  const base = `https://api.whatsapp.com/send?phone=${encodeURIComponent(digits)}`;
  const text = txt(message);
  if (!text) return base;
  return `${base}&text=${encodeURIComponent(text)}`;
}

export default async function AdminHumainAffiliationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const supabaseAdmin = createAdminClient();
  const requestedPeriodRaw = typeof params.period === "string" ? params.period : "week";
  const period = ["all", "day", "week", "month", "year"].includes(requestedPeriodRaw) ? requestedPeriodRaw : "week";
  const threshold = periodThreshold(period);
  const scoutFilterId = typeof params.scout === "string" ? params.scout : "";
  const ticketFilterCode = typeof params.ticket === "string" ? txt(params.ticket) : "";

  const snapshot = await getAdminMarketplaceSnapshot({ placeCity: "all" });
  const { data: logsData, error } = await supabaseAdmin
    .from("human_scout_notification_log")
    .select("id,scout_id,event_type,payload_json,created_at")
    .eq("event_type", "public_affiliate_signup")
    .order("created_at", { ascending: false })
    .limit(300);

  const logs = ((logsData as SignupLogRow[] | null) || []).filter((row) => row.event_type === "public_affiliate_signup");
  let activationTicketsAll = (snapshot.recentActivations || []).slice(0, 300);
  if (scoutFilterId || ticketFilterCode) {
    const { data: activationsWide } = await supabaseAdmin
      .from("human_marketplace_landing_activations")
      .select(
        "id,city,category_key,client_name,referrer_id,referrer_name,partner_member_id,partner_name,partner_phone,source,created_at,metadata,place:human_marketplace_places(id,city,metier)",
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    activationTicketsAll = ((activationsWide as typeof activationTicketsAll) || []).slice(0, 2000);
  }
  const thresholdEffective = ticketFilterCode ? null : threshold;
  const activationTickets = activationTicketsAll.filter((ticket) => {
    if (thresholdEffective === null) return true;
    const ts = Date.parse(String(ticket.created_at || ""));
    if (!Number.isFinite(ts)) return false;
    return ts >= thresholdEffective;
  });
  const ticketsWithoutReplyOver48h = activationTickets.filter((ticket) => {
    const relanceAt = readMetaText(ticket.metadata, "pro_followup_sent_at");
    const replyAt = readMetaText(ticket.metadata, "pro_followup_last_reply_at");
    if (!relanceAt || replyAt) return false;
    const sentTs = Date.parse(relanceAt);
    if (!Number.isFinite(sentTs)) return false;
    return Date.now() - sentTs > 48 * 60 * 60 * 1000;
  }).length;
  const scoutIds = Array.from(
    new Set(
      [...logs.map((row) => txt(row.scout_id)), ...activationTickets.map((ticket) => readMetaText(ticket.metadata, "scout_id"))]
        .filter(Boolean),
    ),
  );
  const memberIds = Array.from(
    new Set(
      activationTickets
        .flatMap((ticket) => [txt(ticket.referrer_id), txt(ticket.partner_member_id), readMetaText(ticket.metadata, "apporteur_member_id")])
        .filter((value) => looksLikeUuid(value)),
    ),
  );
  const activationIds = activationTickets.map((ticket) => ticket.id);

  let scoutById = new Map<string, ScoutRow>();
  if (scoutIds.length > 0) {
    const { data: scoutsData } = await supabaseAdmin
      .from("human_scouts")
      .select("id,first_name,last_name,phone,status")
      .in("id", scoutIds);
    const scouts = (scoutsData as ScoutRow[] | null) || [];
    scoutById = new Map(scouts.map((scout) => [scout.id, scout]));
  }
  let memberById = new Map<string, MemberMiniRow>();
  if (memberIds.length > 0) {
    const { data: membersData } = await supabaseAdmin
      .from("human_members")
      .select("id,first_name,last_name,phone,metier")
      .in("id", memberIds);
    const members = (membersData as MemberMiniRow[] | null) || [];
    memberById = new Map(members.map((member) => [member.id, member]));
  }

  let decisionByActivationId = new Map<string, CommissionDecisionRow>();
  let decisionsLoadError = "";
  if (activationIds.length > 0) {
    const { data: decisionsData, error: decisionsError } = await supabaseAdmin
      .from("human_affiliate_commission_decisions")
      .select("activation_id,decision_status,commission_amount_eur,apporteur_type,apporteur_name,apporteur_phone,note,decided_at")
      .in("activation_id", activationIds);
    if (decisionsError) decisionsLoadError = decisionsError.message || "Table commission non disponible.";
    const decisions = (decisionsData as CommissionDecisionRow[] | null) || [];
    decisionByActivationId = new Map(decisions.map((decision) => [decision.activation_id, decision]));
  }

  // Read status feedback coming from admin POST routes.
  const affStatus = typeof params.affStatus === "string" ? params.affStatus : typeof params.marketStatus === "string" ? params.marketStatus : "";
  const affMessage = typeof params.affMessage === "string" ? params.affMessage : typeof params.marketMessage === "string" ? params.marketMessage : "";
  const focusedTicketId = typeof params.marketFocus === "string" ? params.marketFocus : "";
  const currentUrlForForms = `/admin/humain/affiliation?period=${period}${scoutFilterId ? `&scout=${encodeURIComponent(scoutFilterId)}` : ""}${
    ticketFilterCode ? `&ticket=${encodeURIComponent(ticketFilterCode)}` : ""
  }`;
  const ticketFilterScout = scoutFilterId ? scoutById.get(scoutFilterId) || null : null;
  const activationTicketsFiltered = activationTickets.filter((ticket) => {
    if (ticketFilterCode) {
      const code = readMetaText(ticket.metadata, "ticket_code") || readTicketCode(ticket.metadata, ticket.id);
      if (code !== ticketFilterCode) return false;
    }
    if (scoutFilterId) {
      const metaScout = readMetaText(ticket.metadata, "apporteur_scout_id") || readMetaText(ticket.metadata, "scout_id");
      if (metaScout !== scoutFilterId) return false;
    }
    return true;
  });
  const activeScoutsCount = logs.filter((log) => {
    const scout = scoutById.get(txt(log.scout_id));
    return txt(scout?.status).toLowerCase() === "active";
  }).length;
  const scoutSignupRows = Array.from(
    logs.reduce((acc, row) => {
      const scoutId = txt(row.scout_id);
      const key = scoutId || `log:${row.id}`;
      const existing = acc.get(key);
      if (!existing) {
        acc.set(key, row);
        return acc;
      }
      const existingTs = Date.parse(existing.created_at);
      const nextTs = Date.parse(row.created_at);
      if (!Number.isFinite(existingTs) || (Number.isFinite(nextTs) && nextTs > existingTs)) {
        acc.set(key, row);
      }
      return acc;
    }, new Map<string, SignupLogRow>()).values(),
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">100% Humain · Sprint 1</p>
          <h1 className="text-3xl font-black">Affiliation Grand Public</h1>
          <p className="text-sm text-muted-foreground">
            Inscriptions issues du bouton “Devenir Apporteur d&apos;Affaires” sur le catalogue privilèges.
          </p>
        </div>
        <Link href="/admin/humain" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
          Retour admin humain
        </Link>
      </div>

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Impossible de charger le suivi affiliation: {error.message}
        </p>
      ) : null}
      {affMessage ? (
        <p
          className={`rounded border px-3 py-2 text-sm ${
            affStatus === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {affStatus === "success" ? "✅ " : "⚠️ "}
          {affMessage}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Inscriptions</p>
          <p className="mt-1 text-2xl font-black">{logs.length}</p>
        </div>
        <Link href="/admin/humain/affiliation#scouts" className="rounded-xl border bg-card p-4 transition hover:border-emerald-400">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Éclaireurs actifs</p>
          <p className="mt-1 text-2xl font-black">{activeScoutsCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Cliquer pour voir la liste</p>
        </Link>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Villes actives</p>
          <p className="mt-1 text-2xl font-black">
            {
              new Set(
                logs
                  .map((log) => txt(log.payload_json?.city_label || log.payload_json?.city_slug))
                  .filter(Boolean)
                  .map((value) => value.toLowerCase()),
              ).size
            }
          </p>
        </div>
      </div>

      <div id="scouts" className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Éclaireurs inscrits</p>
            <p className="text-xs text-muted-foreground">Nom · Téléphone · Lien webapp · Lien catalogue</p>
          </div>
          <Link
            href="/admin/humain/affiliation#tickets"
            className="inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide"
          >
            Aller aux tickets →
          </Link>
        </div>
        {scoutSignupRows.map((row) => {
          const payload = row.payload_json || {};
          const sponsorName = txt(payload.sponsor_name) || "Parrain inconnu";
          const scoutNameFromPayload = txt(payload.scout_name);
          const scoutPhoneFromPayload = txt(payload.scout_phone);
          const referralUrl = txt(payload.referral_url);
          const previewUrl = txt(payload.preview_url);
          const refCode = txt(payload.generated_ref_code) || txt(payload.short_code) || txt(payload.invite_token).slice(0, 10);
          const scout = scoutById.get(txt(row.scout_id)) || null;
          const scoutId = txt(row.scout_id);
          return (
            <article key={row.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-black">
                    {scoutNameFromPayload || scoutLabel(scout)} · {scoutPhoneFromPayload || txt(scout?.phone) || "Téléphone non renseigné"}
                  </p>
                  <p className="text-xs text-black/70">
                    Parrain: {sponsorName} · Réf: {refCode || "n/a"} · Créé le {toDate(row.created_at)}
                  </p>
                  <p className="text-xs text-black/60">
                    Ville: {txt(payload.city_label) || txt(payload.city_slug) || "Non renseignée"}
                  </p>
                  {previewUrl ? (
                    <p className="text-xs text-black/60">
                      Webapp:{" "}
                      <a href={previewUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
                        {previewUrl}
                      </a>
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {referralUrl ? (
                    <a
                      href={referralUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center rounded border border-cyan-300/50 bg-cyan-500/10 px-3 text-xs font-black uppercase tracking-wide text-cyan-900"
                    >
                      Ouvrir lien catalogue
                    </a>
                  ) : null}
                  {previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide"
                    >
                      Ouvrir webapp éclaireur
                    </a>
                  ) : null}
                  {scoutId ? (
                    <a
                      href={`/admin/humain/affiliation?period=${period}${scoutId ? `&scout=${encodeURIComponent(scoutId)}` : ""}#tickets`}
                      className="inline-flex h-9 items-center rounded border border-emerald-300/60 bg-emerald-500/10 px-3 text-xs font-black uppercase tracking-wide text-emerald-800"
                    >
                      Voir ses WhatsApp
                    </a>
                  ) : null}
                  <form action="/api/admin/humain/affiliation/scouts/delete" method="post">
                    <input type="hidden" name="current_url" value={currentUrlForForms} />
                    <input type="hidden" name="scout_id" value={scoutId} />
                    <input type="hidden" name="log_id" value={row.id} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center rounded border border-red-300 bg-red-50 px-3 text-xs font-black uppercase tracking-wide text-red-700"
                    >
                      Supprimer compte fictif
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
        {!error && logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune inscription affiliation publique pour le moment.</p>
        ) : null}
      </div>

      <div id="tickets" className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tickets de commission</p>
            <h2 className="text-lg font-black">Parcours apporteur → lead client → validation commission</h2>
            <p className="text-xs text-muted-foreground">Période active: {periodLabel(period)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 items-center rounded border border-amber-300 bg-amber-50 px-3 text-xs font-black uppercase tracking-wide text-amber-700">
              Sans réponse &gt; 48h: {ticketsWithoutReplyOver48h}
            </span>
            {scoutFilterId ? (
              <Link
                href={`/admin/humain/affiliation?period=${period}#tickets`}
                className="inline-flex h-9 items-center rounded border border-emerald-300 bg-emerald-50 px-3 text-xs font-black uppercase tracking-wide text-emerald-800"
              >
                Filtre: {ticketFilterScout ? scoutLabel(ticketFilterScout) : scoutFilterId} ✕
              </Link>
            ) : null}
            <Link
              href="/admin/humain/privileges"
              className="inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide"
            >
              Ouvrir la vue privilèges
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["day", "week", "month", "year", "all"] as const).map((key) => (
            <Link
              key={key}
              href={`/admin/humain/affiliation?period=${key}${scoutFilterId ? `&scout=${encodeURIComponent(scoutFilterId)}` : ""}#tickets`}
              className={`inline-flex h-8 items-center rounded border px-3 text-[11px] font-black uppercase tracking-wide ${
                period === key ? "border-black bg-black text-white" : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {periodLabel(key)}
            </Link>
          ))}
        </div>

        {snapshot.error ? (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Impossible de charger les tickets: {snapshot.error}
          </p>
        ) : null}
        {decisionsLoadError ? (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Historique commission avancé indisponible: {decisionsLoadError}. Les boutons Valider/Refuser restent actifs (mode dégradé).
          </p>
        ) : null}
        {ticketFilterCode && activationTicketsFiltered.length === 0 ? (
          <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Ticket {ticketFilterCode} introuvable. Si tu as reçu WhatsApp mais rien ici, l’activation n’a probablement pas été enregistrée en base.
          </p>
        ) : null}

        {activationTicketsFiltered.map((ticket) => {
          const status = readTicketStatus(ticket.metadata);
          const note =
            ticket.metadata && typeof ticket.metadata === "object" && !Array.isArray(ticket.metadata)
              ? String((ticket.metadata as Record<string, unknown>).workflow_note || "").trim()
              : "";
          const lastFollowupAt = readMetaText(ticket.metadata, "pro_followup_sent_at");
          const lastReplyAt = readMetaText(ticket.metadata, "pro_followup_last_reply_at");
          const lastReplyText = readMetaText(ticket.metadata, "pro_followup_last_reply_text");
          const lastReplyClassif = readMetaText(ticket.metadata, "pro_followup_last_reply_classification");
          const replyBadge = webhookBadge(lastReplyClassif);
          const ticketCode = readTicketCode(ticket.metadata, ticket.id);
          const placeId = txt(ticket.place?.id);
          const proWebappUrl = placeId ? `/popey-human/accueil-test/webapp-pro?place_id=${encodeURIComponent(placeId)}` : "";
          const decision = decisionByActivationId.get(ticket.id) || null;
          const decisionStatusFromMeta = readMetaText(ticket.metadata, "commission_decision_status");
          const decisionAmountFromMeta = readMetaText(ticket.metadata, "commission_amount_eur");
          const decisionDecidedAtFromMeta = readMetaText(ticket.metadata, "commission_decided_at");
          const decisionStatusEffective = String(decision?.decision_status || decisionStatusFromMeta || "pending");
          const decisionDecidedAt = decision?.decided_at || decisionDecidedAtFromMeta;
          const scoutId = readMetaText(ticket.metadata, "apporteur_scout_id") || readMetaText(ticket.metadata, "scout_id");
          const memberIdFromMeta = readMetaText(ticket.metadata, "apporteur_member_id");
          const apporteurNameFromMeta = readMetaText(ticket.metadata, "apporteur_name");
          const apporteurPhoneFromMeta = readMetaText(ticket.metadata, "apporteur_phone");
          const apporteurSourceFromMeta = readMetaText(ticket.metadata, "apporteur_source");
          const scout = scoutId ? scoutById.get(scoutId) || null : null;
          const refMemberLookupId = looksLikeUuid(ticket.referrer_id) ? ticket.referrer_id : looksLikeUuid(memberIdFromMeta) ? memberIdFromMeta : "";
          const refMember = refMemberLookupId ? memberById.get(refMemberLookupId) || null : null;
          const apporteurType = scout?.id ? "scout_public" : refMember?.id ? "member_pro" : "unknown";
          const apporteurSourceLabel =
            apporteurType === "scout_public"
              ? "Particulier (webapp éclaireur)"
              : apporteurType === "member_pro"
                ? "Pro (webapp membre)"
                : apporteurSourceFromMeta === "member_pro"
                  ? "Pro (lié via metadata ticket)"
                  : apporteurSourceFromMeta === "scout_public"
                    ? "Particulier (lié via metadata ticket)"
                : ticket.referrer_name
                  ? "Apporteur déclaré (sans identifiant technique)"
                  : "Source non déterminée";
          const apporteurName =
            decision?.apporteur_name ||
            apporteurNameFromMeta ||
            (scout ? scoutLabel(scout) : [txt(refMember?.first_name), txt(refMember?.last_name)].filter(Boolean).join(" ").trim()) ||
            ticket.referrer_name ||
            "Apporteur inconnu";
          const apporteurPhone = decision?.apporteur_phone || apporteurPhoneFromMeta || txt(scout?.phone) || txt(refMember?.phone) || "Non renseigné";
          const commissionPrefill =
            decision?.commission_amount_eur !== null && decision?.commission_amount_eur !== undefined
              ? String(decision.commission_amount_eur)
              : decisionAmountFromMeta;
          const isFocused = focusedTicketId === ticket.id;
          const clientPhone = readMetaText(ticket.metadata, "client_phone");
          const clientMessage = readMetaText(ticket.metadata, "client_message");
          const offerLabel = txt(ticket.place?.metier) || txt(ticket.partner_name) || "offre Popey";
          const defaultClientFollowup = `Bonjour ${txt(ticket.client_name) || "!"}, c'est Jean-Philippe (Popey). Je fais suite à votre demande pour "${offerLabel}".`;
          const clientChatUrl = clientPhone ? whatsappClientUrl(clientPhone, defaultClientFollowup) : "";
          return (
            <article
              key={ticket.id}
              id={`ticket-${ticket.id}`}
              className={`rounded-lg border p-3 ${isFocused ? "border-emerald-400 bg-emerald-50/30" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Ticket #{ticketCode}</p>
                  <p className="text-xs text-black/80">
                    Client: <span className="font-semibold">{ticket.client_name || "Non renseigné"}</span>
                  </p>
                  <p className="text-xs text-black/80">
                    Pro ciblé: <span className="font-semibold">{ticket.partner_name || ticket.place?.metier || "Non renseigné"}</span>
                  </p>
                  {proWebappUrl ? (
                    <p className="text-xs text-sky-700">
                      Webapp pro:{" "}
                      <a href={proWebappUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
                        Ouvrir
                      </a>
                    </p>
                  ) : null}
                  <p className="text-xs text-black/60">
                    Ville: {ticket.city} · Créé le {toDate(ticket.created_at)}
                  </p>
                </div>
                {decisionStatusEffective ? (
                  <span
                    className={`inline-flex h-7 items-center rounded border px-2 text-[11px] font-black uppercase tracking-wide ${
                      decisionStatusEffective === "approved"
                        ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                        : decisionStatusEffective === "rejected"
                          ? "border-rose-300 bg-rose-100 text-rose-800"
                          : "border-slate-300 bg-slate-100 text-slate-700"
                    }`}
                  >
                    {commissionDecisionLabel(decisionStatusEffective)}
                  </span>
                ) : null}
              </div>
              <div className="mt-1">
                <span className={`inline-flex h-7 items-center rounded border px-2 text-[11px] font-black uppercase tracking-wide ${replyBadge.className}`}>
                  {replyBadge.label}
                </span>
              </div>
              <div className="mt-2 rounded-lg border border-cyan-200 bg-cyan-50/60 p-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-cyan-800">Source du contact</p>
                <p className="mt-1 text-xs text-cyan-900">Canal: {apporteurSourceLabel}</p>
                <p className="text-xs text-cyan-900">Apporteur identifié: {apporteurName}</p>
                <p className="text-xs text-cyan-900">Contact apporteur: {apporteurPhone}</p>
              </div>
              <p className="mt-1 text-xs text-black/60">
                Dernière relance: {lastFollowupAt ? toDate(lastFollowupAt) : "Jamais"}
                {" · "}
                Dernière réponse pro: {lastReplyAt ? `${toDate(lastReplyAt)} (${lastReplyClassif || "message"})` : "Aucune"}
              </p>
              {lastReplyText ? <p className="mt-1 text-xs text-black/55">Message pro: “{lastReplyText}”</p> : null}
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-wide text-emerald-800">Décision commission</p>
                  <span className="text-[11px] text-emerald-900">
                    État actuel: <span className="font-black">{commissionDecisionLabel(decisionStatusEffective)}</span>
                  </span>
                </div>
                <form action={adminDecideAffiliateCommissionAction} className="mt-2 grid gap-2 md:grid-cols-4">
                  <input type="hidden" name="current_url" value={currentUrlForForms} />
                  <input type="hidden" name="activation_id" value={ticket.id} />
                  <input
                    name="commission_amount_eur"
                    defaultValue={commissionPrefill}
                    placeholder="Montant € (règle pro)"
                    className="h-9 rounded border bg-white px-2 text-xs"
                  />
                  <input
                    name="commission_note"
                    defaultValue={txt(decision?.note)}
                    placeholder="Note décision commission"
                    className="h-9 rounded border bg-white px-2 text-xs md:col-span-2"
                  />
                  <div className="md:col-span-4 flex flex-wrap gap-2">
                    <button
                      name="decision_status"
                      value="approved"
                      className="h-9 rounded border border-emerald-300 bg-emerald-100 px-3 text-[11px] font-black uppercase tracking-wide text-emerald-800"
                    >
                      ✅ Deal conclu (valider)
                    </button>
                    <button
                      name="decision_status"
                      value="rejected"
                      className="h-9 rounded border border-rose-300 bg-rose-100 px-3 text-[11px] font-black uppercase tracking-wide text-rose-800"
                    >
                      ⛔ Pas conclu (refuser)
                    </button>
                  </div>
                </form>
              </div>
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">WhatsApp reçu (client → admin)</p>
                <p className="mt-1 text-xs text-slate-700">
                  Téléphone client: <span className="font-semibold">{clientPhone || "Non renseigné"}</span>
                </p>
                {clientMessage ? <p className="mt-1 text-xs text-slate-700">Message client: “{clientMessage}”</p> : null}
                {clientChatUrl ? (
                  <p className="mt-2">
                    <a
                      href={clientChatUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center rounded border border-slate-300 bg-white px-3 text-[11px] font-black uppercase tracking-wide text-slate-700"
                    >
                      Ouvrir WhatsApp client →
                    </a>
                  </p>
                ) : null}
              </div>
              <form action={adminUpdatePrivilegeActivationStatusAction} className="mt-2 grid gap-2 md:grid-cols-4">
                <input type="hidden" name="current_url" value={currentUrlForForms} />
                <input type="hidden" name="activation_id" value={ticket.id} />
                <select name="next_status" defaultValue={status} className="h-9 rounded border px-2 text-xs">
                  <option value="pending">En attente</option>
                  <option value="contacted">Contacte</option>
                  <option value="in_progress">En cours</option>
                  <option value="validated">Valide</option>
                  <option value="refused">Refuse</option>
                </select>
                <input
                  name="note"
                  defaultValue={note}
                  placeholder="Note ticket (optionnel)"
                  className="h-9 rounded border px-2 text-xs md:col-span-2"
                />
                <button className="h-9 rounded border px-3 text-[11px] font-black uppercase tracking-wide">
                  MAJ {ticketLabel(status)}
                </button>
              </form>
              <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50/40 p-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-violet-800">
                  Relance Pro WhatsApp
                </p>
                <p className="mt-1 text-xs text-violet-900">
                  Envoie un message au pro pour confirmer si le lead est conclu (OUI/NON).
                </p>
                <form action={adminSendPrivilegeActivationFollowupNowAction} className="mt-2">
                  <input type="hidden" name="current_url" value={currentUrlForForms} />
                  <input type="hidden" name="activation_id" value={ticket.id} />
                  <button className="h-9 rounded border border-emerald-300/60 bg-emerald-500/10 px-3 text-[11px] font-black uppercase tracking-wide text-emerald-700">
                    Relancer maintenant (WhatsApp pro)
                  </button>
                </form>
              </div>
              <form action={adminDeleteAffiliateTicketAction} className="mt-2">
                <input type="hidden" name="current_url" value={currentUrlForForms} />
                <input type="hidden" name="activation_id" value={ticket.id} />
                <button
                  name="confirm"
                  value="delete"
                  className="h-9 rounded border border-rose-300 bg-rose-50 px-3 text-[11px] font-black uppercase tracking-wide text-rose-800"
                >
                  Supprimer ce ticket
                </button>
              </form>
              {decisionDecidedAt ? (
                <p className="mt-2 text-[11px] text-black/55">Dernière décision commission: {toDate(decisionDecidedAt)}</p>
              ) : null}
            </article>
          );
        })}
        {!snapshot.error && activationTicketsFiltered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun ticket pour le moment.</p>
        ) : null}
      </div>
    </section>
  );
}
