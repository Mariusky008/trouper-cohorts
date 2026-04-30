import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type MarketplaceOfferRow = {
  id: string;
  full_name: string;
  metier: string | null;
  city: string | null;
  whatsapp: string | null;
  status: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function extractMetaValue(metadata: Record<string, unknown> | null, key: string): string {
  const value = metadata?.[key];
  if (typeof value !== "string") return "";
  return value.trim();
}

function toDateFr(value: string): string {
  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

export default async function AdminHumainMarketplaceInscriptionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const sourceFilter = typeof params.source === "string" ? params.source.trim() : "personnel_landing";
  const referralFilter = typeof params.referral === "string" ? params.referral.trim().toLowerCase() : "";

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_marketplace_offers")
    .select("id,full_name,metier,city,whatsapp,status,created_at,metadata")
    .eq("action_type", "join_request")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = ((data as MarketplaceOfferRow[] | null) || []).filter((row) => {
    const source = extractMetaValue(row.metadata, "source");
    const referralCode = extractMetaValue(row.metadata, "referral_code").toLowerCase();
    if (sourceFilter && source !== sourceFilter) return false;
    if (referralFilter && !referralCode.includes(referralFilter)) return false;
    return true;
  });

  const referralCodes = Array.from(
    new Set(
      rows
        .map((row) => extractMetaValue(row.metadata, "referral_code"))
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "fr"));

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Inscriptions Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des inscriptions venant de la page perso via <code>metadata.source</code> et <code>metadata.referral_code</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/humain/marketplace" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
            Pipeline marketplace
          </Link>
          <Link href="/admin/humain" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
            Retour admin humain
          </Link>
        </div>
      </div>

      <form method="get" className="rounded-xl border bg-card p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input
            name="source"
            defaultValue={sourceFilter}
            placeholder="source (ex: personnel_landing)"
            className="h-10 rounded border bg-background px-3 text-sm"
          />
          <input
            name="referral"
            defaultValue={typeof params.referral === "string" ? params.referral : ""}
            placeholder="referral_code (ex: jean-philippe-roth)"
            className="h-10 rounded border bg-background px-3 text-sm"
          />
          <button className="h-10 rounded border px-3 text-xs font-black uppercase tracking-wide">Filtrer</button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Inscriptions trouvées</p>
          <p className="mt-1 text-2xl font-black">{rows.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Source active</p>
          <p className="mt-1 text-lg font-black">{sourceFilter || "toutes"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Referrals détectés</p>
          <p className="mt-1 text-lg font-black">{referralCodes.length}</p>
        </div>
      </div>

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>
      ) : (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-black">Détail des inscriptions</h2>
          <div className="mt-3 space-y-3">
            {rows.map((row) => {
              const source = extractMetaValue(row.metadata, "source") || "n/a";
              const referralCode = extractMetaValue(row.metadata, "referral_code") || "n/a";
              const referralLabel = extractMetaValue(row.metadata, "referral_label") || "n/a";
              const selectedPlan = extractMetaValue(row.metadata, "selected_plan") || "n/a";
              return (
                <article key={row.id} className="rounded-lg border p-3">
                  <p className="font-black">
                    {row.full_name} · {row.metier || "metier n/r"} · {row.city || "ville n/r"}
                  </p>
                  <p className="text-xs text-black/70">
                    WhatsApp: {row.whatsapp || "n/r"} · statut: {row.status} · date: {toDateFr(row.created_at)}
                  </p>
                  <p className="text-xs text-black/80">
                    source: <strong>{source}</strong> · referral_code: <strong>{referralCode}</strong> · referral_label:{" "}
                    <strong>{referralLabel}</strong> · plan: <strong>{selectedPlan}</strong>
                  </p>
                </article>
              );
            })}
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune inscription ne correspond aux filtres actuels.</p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
