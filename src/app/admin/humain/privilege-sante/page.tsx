import { createAdminClient } from "@/lib/supabase/admin";
import { whatsappTwilioConfig } from "@/lib/popey-human/whatsapp-twilio-config";

export const dynamic = "force-dynamic";

// Vue « santé du lancement » (fondateur, admin-only via le layout /admin). Métriques par ville :
// offres actives, membres engagés, réservations, visites validées, conversion résa→visite, fans, coups
// de feu. + statut de config WhatsApp (sans exposer les valeurs). Tout résilient.

type CityRow = {
  city: string;
  offers: number;
  members: number;
  reservations: number;
  visits: number;
  fans: number;
  coups: number;
};

async function loadHealth(): Promise<{ rows: CityRow[]; totals: CityRow }> {
  const supabase = createAdminClient();
  const byCity = new Map<string, CityRow>();
  const membersByCity = new Map<string, Set<string>>();
  const placeCity = new Map<string, string>();

  const ensure = (city: string): CityRow => {
    const key = city || "—";
    if (!byCity.has(key)) byCity.set(key, { city: key, offers: 0, members: 0, reservations: 0, visits: 0, fans: 0, coups: 0 });
    return byCity.get(key)!;
  };

  // Commerçants configurés.
  try {
    const { data } = await supabase
      .from("human_marketplace_places")
      .select("id,city,company_name,privilege_badge")
      .limit(5000);
    for (const p of (data as Array<{ id: string; city: string | null; company_name: string | null; privilege_badge: string | null }> | null) || []) {
      const configured = Boolean(String(p.company_name || "").trim() || String(p.privilege_badge || "").trim());
      const city = String(p.city || "—").trim() || "—";
      placeCity.set(p.id, city);
      if (configured) ensure(city).offers += 1;
    }
  } catch {
    /* résilient */
  }

  const aggregate = async (
    table: string,
    apply: (row: CityRow) => void,
    extra?: (placeId: string, row: Record<string, unknown>) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter?: (q: any) => any,
    select = "place_id",
  ) => {
    try {
      let q = supabase.from(table).select(select).limit(50000);
      if (filter) q = filter(q);
      const { data } = await q;
      for (const r of (data as Array<Record<string, unknown>> | null) || []) {
        const city = placeCity.get(String(r.place_id)) || "—";
        apply(ensure(city));
        if (extra) extra(String(r.place_id), r);
      }
    } catch {
      /* résilient */
    }
  };

  await aggregate("human_privilege_reservations", (row) => (row.reservations += 1));
  await aggregate("human_privilege_visits", (row) => (row.visits += 1), undefined, (q) => q.eq("status", "validated"));
  await aggregate("human_privilege_alert_subscribers", (row) => (row.fans += 1), undefined, (q) => q.eq("status", "confirmed"));
  await aggregate("human_privilege_coup_campaigns", (row) => (row.coups += 1));
  await aggregate(
    "human_privilege_relationships",
    () => {},
    (placeId, r) => {
      const city = placeCity.get(placeId) || "—";
      if (!membersByCity.has(city)) membersByCity.set(city, new Set());
      const phone = String((r as { member_phone?: unknown }).member_phone || "").trim();
      if (phone) membersByCity.get(city)!.add(phone);
    },
    undefined,
    "place_id,member_phone",
  );

  membersByCity.forEach((set, city) => (ensure(city).members = set.size));

  const rows = Array.from(byCity.values()).sort((a, b) => b.visits - a.visits || b.reservations - a.reservations || a.city.localeCompare(b.city, "fr"));
  const totals: CityRow = { city: "TOTAL", offers: 0, members: 0, reservations: 0, visits: 0, fans: 0, coups: 0 };
  for (const r of rows) {
    totals.offers += r.offers;
    totals.members += r.members;
    totals.reservations += r.reservations;
    totals.visits += r.visits;
    totals.fans += r.fans;
    totals.coups += r.coups;
  }
  return { rows, totals };
}

function pct(visits: number, reservations: number): string {
  if (reservations <= 0) return "—";
  return Math.round((visits / reservations) * 100) + " %";
}

export default async function PrivilegeSantePage() {
  const { rows, totals } = await loadHealth();
  const cfg = whatsappTwilioConfig;
  const fromIsReal = Boolean(cfg.whatsappFrom) && cfg.whatsappFrom !== "whatsapp:+14155238886";
  const wa: Array<{ label: string; ok: boolean; hint: string }> = [
    { label: "Compte Twilio (SID + Token)", ok: Boolean(cfg.accountSid && cfg.authToken), hint: "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN" },
    {
      label: "Numéro émetteur réel (pas le n° démo Twilio)",
      ok: fromIsReal,
      hint: "TWILIO_WHATSAPP_FROM = whatsapp:+33… (et non +14155238886) + TWILIO_WHATSAPP_SANDBOX_MODE=false",
    },
    { label: "Template Opt-in (ajout de clients)", ok: Boolean(cfg.alertOptinContentSid), hint: "TWILIO_WHATSAPP_CONTENT_SID_ALERT_OPTIN" },
    { label: "Template Diffusion / Coup de feu", ok: Boolean(cfg.alertBroadcastContentSid), hint: "TWILIO_WHATSAPP_CONTENT_SID_ALERT_BROADCAST" },
    { label: "Template Match (visite validée)", ok: Boolean(cfg.matchContentSid), hint: "TWILIO_WHATSAPP_CONTENT_SID_MATCH" },
    { label: "Template Digest hebdo", ok: Boolean(cfg.proDigestContentSid), hint: "TWILIO_WHATSAPP_CONTENT_SID_PRO_DIGEST" },
  ];

  const Cell = ({ children, head = false }: { children: React.ReactNode; head?: boolean }) => (
    <td className={`border-b border-slate-200 px-3 py-2 text-sm ${head ? "font-bold text-slate-900" : "text-slate-700"}`}>{children}</td>
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-black text-slate-900">🩺 Santé du lancement — Privilège</h1>
      <p className="mt-1 text-sm text-slate-500">Par ville, en temps réel. Le taux résa→visite est l&apos;indicateur clé (la boucle de fidélité tourne ou pas).</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-slate-50 text-left">
              <Cell head>Ville</Cell>
              <Cell head>Offres</Cell>
              <Cell head>Membres</Cell>
              <Cell head>Réserv.</Cell>
              <Cell head>Visites ✅</Cell>
              <Cell head>Résa→Visite</Cell>
              <Cell head>Fans</Cell>
              <Cell head>Coups de feu</Cell>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-sm text-slate-500" colSpan={8}>
                  Aucune donnée pour l&apos;instant.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.city}>
                  <Cell head>{r.city}</Cell>
                  <Cell>{r.offers}</Cell>
                  <Cell>{r.members}</Cell>
                  <Cell>{r.reservations}</Cell>
                  <Cell>{r.visits}</Cell>
                  <Cell>
                    <span className="font-bold text-emerald-700">{pct(r.visits, r.reservations)}</span>
                  </Cell>
                  <Cell>{r.fans}</Cell>
                  <Cell>{r.coups}</Cell>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 ? (
            <tfoot>
              <tr className="bg-slate-50">
                <Cell head>{totals.city}</Cell>
                <Cell head>{totals.offers}</Cell>
                <Cell head>{totals.members}</Cell>
                <Cell head>{totals.reservations}</Cell>
                <Cell head>{totals.visits}</Cell>
                <Cell head>{pct(totals.visits, totals.reservations)}</Cell>
                <Cell head>{totals.fans}</Cell>
                <Cell head>{totals.coups}</Cell>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <h2 className="mt-8 text-lg font-black text-slate-900">📲 Config WhatsApp</h2>
      <p className="mt-1 text-sm text-slate-500">
        Tout doit être <b>✅</b> pour que les WhatsApp partent à de vrais clients. Un <b>❌</b> = ce message ne part pas (variable d&apos;env à poser dans Vercel, indiquée à droite).
      </p>
      <ul className="mt-3 space-y-2">
        {wa.map((w) => (
          <li key={w.label} className="flex items-start gap-2 text-sm">
            <span>{w.ok ? "✅" : "❌"}</span>
            <span className="flex-1">
              <span className="text-slate-700">{w.label}</span>
              {w.ok ? null : <code className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700">{w.hint}</code>}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">
        Les valeurs ne sont jamais affichées — uniquement « configuré ou non ». À vérifier aussi côté console Twilio (pas une variable) :
        le <b>webhook entrant</b> pour les réponses OUI/NON.
      </p>
    </div>
  );
}
