import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
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

export default async function AdminHumainAffiliationPage() {
  const supabaseAdmin = createAdminClient();
  const snapshot = await getAdminMarketplaceSnapshot({ placeCity: "all" });
  const { data: logsData, error } = await supabaseAdmin
    .from("human_scout_notification_log")
    .select("id,scout_id,event_type,payload_json,created_at")
    .eq("event_type", "public_affiliate_signup")
    .order("created_at", { ascending: false })
    .limit(300);

  const logs = ((logsData as SignupLogRow[] | null) || []).filter((row) => row.event_type === "public_affiliate_signup");
  const activationTickets = (snapshot.recentActivations || []).slice(0, 120);
  const ticketsWithoutReplyOver48h = activationTickets.filter((ticket) => {
    const relanceAt = readMetaText(ticket.metadata, "pro_followup_sent_at");
    const replyAt = readMetaText(ticket.metadata, "pro_followup_last_reply_at");
    if (!relanceAt || replyAt) return false;
    const sentTs = Date.parse(relanceAt);
    if (!Number.isFinite(sentTs)) return false;
    return Date.now() - sentTs > 48 * 60 * 60 * 1000;
  }).length;
  const scoutIds = Array.from(new Set(logs.map((row) => txt(row.scout_id)).filter(Boolean)));

  let scoutById = new Map<string, ScoutRow>();
  if (scoutIds.length > 0) {
    const { data: scoutsData } = await supabaseAdmin
      .from("human_scouts")
      .select("id,first_name,last_name,phone,status")
      .in("id", scoutIds);
    const scouts = (scoutsData as ScoutRow[] | null) || [];
    scoutById = new Map(scouts.map((scout) => [scout.id, scout]));
  }

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

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Inscriptions</p>
          <p className="mt-1 text-2xl font-black">{logs.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Éclaireurs actifs</p>
          <p className="mt-1 text-2xl font-black">
            {
              logs.filter((log) => {
                const scout = scoutById.get(txt(log.scout_id));
                return txt(scout?.status).toLowerCase() === "active";
              }).length
            }
          </p>
        </div>
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

      <div className="rounded-xl border bg-white p-4 space-y-3">
        {logs.map((row) => {
          const payload = row.payload_json || {};
          const sponsorName = txt(payload.sponsor_name) || "Parrain inconnu";
          const scoutNameFromPayload = txt(payload.scout_name);
          const scoutPhoneFromPayload = txt(payload.scout_phone);
          const referralUrl = txt(payload.referral_url);
          const previewUrl = txt(payload.preview_url);
          const refCode = txt(payload.generated_ref_code) || txt(payload.short_code) || txt(payload.invite_token).slice(0, 10);
          const scout = scoutById.get(txt(row.scout_id)) || null;
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
                </div>
              </div>
            </article>
          );
        })}
        {!error && logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune inscription affiliation publique pour le moment.</p>
        ) : null}
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tickets de commission</p>
            <h2 className="text-lg font-black">Parcours Apporteur → Client → Pro</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 items-center rounded border border-amber-300 bg-amber-50 px-3 text-xs font-black uppercase tracking-wide text-amber-700">
              Sans réponse &gt; 48h: {ticketsWithoutReplyOver48h}
            </span>
            <Link
              href="/admin/humain/privileges"
              className="inline-flex h-9 items-center rounded border px-3 text-xs font-black uppercase tracking-wide"
            >
              Ouvrir la vue privilèges
            </Link>
          </div>
        </div>

        {snapshot.error ? (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Impossible de charger les tickets: {snapshot.error}
          </p>
        ) : null}

        {activationTickets.map((ticket) => {
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
          return (
            <article key={ticket.id} className="rounded-lg border p-3">
              <p className="font-black">
                #{ticketCode} · {ticket.client_name} → {ticket.partner_name || ticket.place?.metier || "Pro"}
              </p>
              <p className="mt-1 text-xs text-black/70">
                Apporteur: {ticket.referrer_name} · Ville: {ticket.city} · Créé le {toDate(ticket.created_at)}
              </p>
              <div className="mt-1">
                <span className={`inline-flex h-7 items-center rounded border px-2 text-[11px] font-black uppercase tracking-wide ${replyBadge.className}`}>
                  {replyBadge.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-black/60">
                Dernière relance: {lastFollowupAt ? toDate(lastFollowupAt) : "Jamais"}
                {" · "}
                Dernière réponse pro: {lastReplyAt ? `${toDate(lastReplyAt)} (${lastReplyClassif || "message"})` : "Aucune"}
              </p>
              {lastReplyText ? <p className="mt-1 text-xs text-black/55">Message pro: “{lastReplyText}”</p> : null}
              <form action={adminUpdatePrivilegeActivationStatusAction} className="mt-2 grid gap-2 md:grid-cols-4">
                <input type="hidden" name="current_url" value="/admin/humain/affiliation" />
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
              <form action={adminSendPrivilegeActivationFollowupNowAction} className="mt-2">
                <input type="hidden" name="current_url" value="/admin/humain/affiliation" />
                <input type="hidden" name="activation_id" value={ticket.id} />
                <button className="h-9 rounded border border-emerald-300/60 bg-emerald-500/10 px-3 text-[11px] font-black uppercase tracking-wide text-emerald-700">
                  Relancer maintenant (WhatsApp pro)
                </button>
              </form>
            </article>
          );
        })}
        {!snapshot.error && activationTickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun ticket pour le moment.</p>
        ) : null}
      </div>
    </section>
  );
}
