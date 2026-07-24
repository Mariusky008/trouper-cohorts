// /admin/humain/site-internet — Onglet de prospection "Site internet" (canal lettre).
// Liste des prospects, ajout manuel, accès à la lettre N&B, suivi du cycle de vie.
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { SiteAddForm } from "./_components/site-add-form";
import { SiteDiscover } from "./_components/site-discover";
import { SiteLink } from "./_components/site-link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  id: string;
  slug: string;
  business_name: string | null;
  city: string | null;
  activite: string | null;
  variant: string | null;
  google_rating: number | null;
  letter_status: string | null;
  letter_delivered_at: string | null;
  contact_scanned_at: string | null;
  metadata: Record<string, unknown> | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "📝 Brouillon",
  validated: "✅ Validée",
  printed: "🖨️ Imprimée",
  delivered: "🤝 Remise",
  contacted: "📞 Contact reçu",
  skipped: "⏭️ Ignorée",
};

function normalize(value: unknown) {
  return String(value || "").trim();
}

export default async function AdminSiteInternetPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select(
      "id,slug,business_name,city,activite,variant,google_rating,letter_status,letter_delivered_at,contact_scanned_at,metadata"
    )
    .eq("channel", "letter")
    .order("created_at", { ascending: false })
    .limit(300);

  const rows: Row[] = Array.isArray(data) ? (data as Row[]) : [];
  const hasError = Boolean(error);
  const count = (s: string) => rows.filter((r) => normalize(r.letter_status) === s).length;

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : null;

  // État de la configuration — lu CÔTÉ SERVEUR (prod). On n'expose que des
  // booléens, jamais les valeurs.
  const env = process.env;
  const cfg: Array<{ label: string; ok: boolean; hint: string }> = [
    { label: "Apify (diagnostic + découverte)", ok: Boolean(env.APIFY_TOKEN), hint: "APIFY_TOKEN" },
    { label: "Claude (FAQ accueil)", ok: Boolean(env.ANTHROPIC_API_KEY), hint: "ANTHROPIC_API_KEY" },
    { label: "SMS / buzz (Twilio)", ok: Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && (env.TWILIO_SMS_FROM || env.TWILIO_MESSAGING_SERVICE_SID)), hint: "TWILIO_ACCOUNT_SID + AUTH_TOKEN + SMS_FROM (ou MESSAGING_SERVICE_SID)" },
    { label: "Notif email des réservations", ok: Boolean(env.RESEND_API_KEY && (env.SITE_NOTIFY_EMAIL || env.ADMIN_NOTIFICATION_EMAIL)), hint: "RESEND_API_KEY + (SITE_NOTIFY_EMAIL ou ADMIN_NOTIFICATION_EMAIL)" },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">100% Humain</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Site internet</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Prospection par lettre remise en main propre : on propose aux commerçants de refaire (ou créer) leur site.
          Chaque prospect génère une lettre N&amp;B personnalisée à imprimer.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/admin/humain/site-internet/decouverte" className="inline-flex items-center gap-1 rounded-full bg-sky-700 px-4 py-1.5 text-sm font-bold text-white hover:bg-sky-800">
            🚀 Découverte en lot →
          </Link>
          <Link href="/admin/humain/site-internet/marche" className="inline-block self-center text-sm font-semibold text-amber-700 hover:underline">
            🔍 Recherches Google par métier &amp; ville →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Total</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{rows.length}</p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">À valider</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{count("draft")}</p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Imprimées</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{count("printed") + count("delivered") + count("contacted")}</p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Contacts reçus</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{count("contacted")}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Configuration (prod)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {cfg.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-sm">
                <span className={c.ok ? "text-emerald-600" : "text-red-500"}>{c.ok ? "✓" : "✗"}</span>
                <span className="font-semibold text-slate-800">{c.label}</span>
                {!c.ok && <span className="text-[11px] text-slate-400">— {c.hint}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SiteDiscover />

      <SiteAddForm />

      {hasError ? (
        <div className="rounded-2xl border bg-white p-5 text-sm text-red-700 shadow-sm">
          Erreur Supabase : {normalize(error?.message)}
          <p className="mt-2 text-slate-600">
            La migration <code>20260702160000_site_internet_letter_channel.sql</code> a-t-elle été appliquée ?
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">
              {rows.length} prospect{rows.length > 1 ? "s" : ""}
            </span>
          </div>
          {rows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Aucun prospect pour l&apos;instant. Ajoutes-en un ci-dessus.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Commerce</th>
                    <th className="px-4 py-3 font-medium">Ville</th>
                    <th className="px-4 py-3 font-medium">Activité</th>
                    <th className="px-4 py-3 font-medium">Var.</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Lettre</th>
                    <th className="px-4 py-3 font-medium">Site web</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {r.business_name || "—"}
                        {r.metadata && (r.metadata as Record<string, unknown>).self_serve ? (
                          <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700" title="Créé par le pro depuis la page d'accueil (lead entrant)">🔥 Auto-site</span>
                        ) : null}
                        {r.metadata && (r.metadata as Record<string, unknown>).demarchage_target ? (
                          <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700" title="Cible de la démo « choc » : recommandé·e à la réservation sur les autres sites de démo">🎯 Cible démo</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.city || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{r.activite || "—"}</td>
                      <td className="px-4 py-3">
                        {r.variant ? (
                          <span
                            className="rounded px-2 py-0.5 text-xs font-bold text-black"
                            style={{ background: r.variant === "A" ? "#fbbf24" : "#93c5fd" }}
                          >
                            {r.variant}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {STATUS_LABEL[normalize(r.letter_status)] ?? r.letter_status}
                        {fmtDate(r.letter_delivered_at) && (
                          <div className="text-[11px] text-slate-400">Remise {fmtDate(r.letter_delivered_at)}</div>
                        )}
                        {r.contact_scanned_at && (
                          <div className="text-[11px] font-semibold text-sky-600">👁 QR scanné</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/humain/site-internet/lettre/${r.slug}`}
                          target="_blank"
                          className="rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800"
                        >
                          Lettre →
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <SiteLink slug={r.slug} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {[
                            { action: "validate", label: "Valider" },
                            { action: "printed", label: "Imprimée" },
                            { action: "delivered", label: "Remise" },
                            { action: "skip", label: "Ignorer" },
                          ].map((a) => (
                            <form key={a.action} action="/api/admin/humain/site-internet/prospect" method="post">
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="action" value={a.action} />
                              <button
                                type="submit"
                                className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                              >
                                {a.label}
                              </button>
                            </form>
                          ))}
                          {r.metadata && (r.metadata as Record<string, unknown>).demarchage_target ? (
                            <form action="/api/admin/humain/site-internet/prospect" method="post">
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="action" value="demo_target_off" />
                              <button type="submit" className="rounded border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700 hover:bg-violet-100" title="Retirer la cible de la démo « choc »">🎯 Cible ✓</button>
                            </form>
                          ) : (
                            <form action="/api/admin/humain/site-internet/prospect" method="post">
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="action" value="demo_target" />
                              <button type="submit" className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-violet-50" title="Cibler ce commerce pour la démo « choc » : il sera recommandé à la réservation sur les autres sites de démo">🎯 Cibler</button>
                            </form>
                          )}
                          <form action="/api/admin/humain/site-internet/prospect" method="post">
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="action" value="delete" />
                            <button
                              type="submit"
                              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              🗑
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
