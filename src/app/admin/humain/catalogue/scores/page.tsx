import Link from "next/link";
import { getAdminMarketplaceSnapshot } from "@/lib/actions/human-marketplace";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ScoresPageProps = {
  searchParams?: Promise<{ marketStatus?: string; marketMessage?: string }>;
};

type Agg = { open: number; favorite: number; reserve: number; card_open: number; mystery_reveal: number; refName: string };
type RefRow = { ref: string; ref_name: string | null; declared_contacts: number | null; propulsion_day: number | null };

type Row = {
  ref: string;
  name: string;
  clics: number;
  interet: number;
  declared: number | null;
  day: number | null;
};

function statut(row: Row, today: number): { label: string; cls: string } {
  if (row.day && today < row.day) return { label: "⏳ Bientôt", cls: "bg-slate-100 text-slate-500" };
  if (row.clics === 0) return { label: "⚠️ Relance", cls: "bg-red-100 text-red-700" };
  if (row.declared && row.clics >= Math.max(5, row.declared * 0.15)) return { label: "🚀 Joué le jeu", cls: "bg-emerald-100 text-emerald-700" };
  return { label: "✅ Actif", cls: "bg-sky-100 text-sky-700" };
}

export default async function CatalogueScoresPage({ searchParams }: ScoresPageProps) {
  const qp = (await searchParams) || {};
  const marketStatus = typeof qp.marketStatus === "string" ? qp.marketStatus : "";
  const marketMessage = typeof qp.marketMessage === "string" ? qp.marketMessage : "";

  // Gate admin (réutilise le snapshot qui renvoie une erreur si non-admin)
  const snapshot = await getAdminMarketplaceSnapshot({ placeCity: "all" });
  if (snapshot.error) {
    return (
      <section className="space-y-4 p-4">
        <h1 className="text-2xl font-black">Tableau des scores</h1>
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{snapshot.error}</p>
      </section>
    );
  }

  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const monthLabel = (() => {
    const m = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return m.charAt(0).toUpperCase() + m.slice(1);
  })();

  // 1) Agrégation des events du mois par référent
  const aggByRef: Record<string, Agg> = {};
  try {
    const res = await admin
      .from("human_marketplace_events")
      .select("event_type,payload,created_at")
      .like("event_type", "priv_%")
      .gte("created_at", monthStart)
      .limit(50000);
    if (!res.error && res.data) {
      (res.data as Array<{ event_type: string | null; payload: Record<string, unknown> | null }>).forEach((r) => {
        const payload = r.payload && typeof r.payload === "object" ? r.payload : {};
        const ref = String((payload as { ref?: unknown }).ref || "").trim();
        if (!ref) return; // visites sans référent → exclues du leaderboard membres
        const refName = String((payload as { ref_name?: unknown }).ref_name || "").trim();
        const ev = String(r.event_type || "").replace("priv_", "");
        if (!aggByRef[ref]) aggByRef[ref] = { open: 0, favorite: 0, reserve: 0, card_open: 0, mystery_reveal: 0, refName: "" };
        if (refName && !aggByRef[ref].refName) aggByRef[ref].refName = refName;
        if (ev === "open" || ev === "favorite" || ev === "reserve" || ev === "card_open" || ev === "mystery_reveal") {
          aggByRef[ref][ev] += 1;
        }
      });
    }
  } catch {
    /* events indisponibles → leaderboard vide */
  }

  // 2) Infos déclaratives / planning
  const refInfo: Record<string, RefRow> = {};
  let tableReady = false;
  try {
    const res = await admin.from("human_catalogue_referrers").select("ref,ref_name,declared_contacts,propulsion_day").limit(2000);
    tableReady = !res.error;
    if (!res.error && res.data) {
      (res.data as RefRow[]).forEach((r) => {
        if (r.ref) refInfo[r.ref] = r;
      });
    }
  } catch {
    tableReady = false;
  }

  // 3) Fusion
  const allRefs = Array.from(new Set([...Object.keys(aggByRef), ...Object.keys(refInfo)]));
  const rows: Row[] = allRefs.map((ref) => {
    const a = aggByRef[ref];
    const info = refInfo[ref];
    return {
      ref,
      name: (info?.ref_name || a?.refName || ref).toString(),
      clics: a ? a.open : 0,
      interet: a ? a.favorite + a.reserve + a.card_open : 0,
      declared: info?.declared_contacts ?? null,
      day: info?.propulsion_day ?? null,
    };
  });
  rows.sort((x, y) => y.clics - x.clics || y.interet - x.interet);

  const today = now.getDate();
  const totalClics = rows.reduce((s, r) => s + r.clics, 0);

  return (
    <section className="mx-auto max-w-5xl space-y-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Catalogue · {monthLabel}</p>
          <h1 className="text-3xl font-black">Tableau des scores</h1>
          <p className="text-sm text-muted-foreground">
            Qui « joue le jeu » du partage ce mois-ci — transparence totale pour l&apos;effet de meute.
          </p>
        </div>
        <Link href="/admin/humain/catalogue" className="inline-flex h-9 items-center rounded border px-3 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
          ← Catalogue
        </Link>
      </div>

      {marketStatus === "success" ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{marketMessage || "Enregistré."}</p>
      ) : null}
      {marketStatus === "error" ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{marketMessage || "Erreur."}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <div className="text-sm">
          <strong className="text-emerald-700">{rows.length}</strong> membre(s) actifs · <strong>{totalClics}</strong> clics ce mois
        </div>
        <form action="/api/admin/humain/catalogue/referrer" method="post" className="ml-auto">
          <input type="hidden" name="current_url" value="/admin/humain/catalogue/scores" />
          <input type="hidden" name="intent" value="auto_assign" />
          <button className="h-9 rounded border border-amber-300 bg-amber-50 px-3 text-xs font-black uppercase tracking-wide text-amber-800">
            📅 Répartir les vagues (auto)
          </button>
        </form>
      </div>

      {/* En-tête colonnes */}
      <div className="hidden grid-cols-[28px_minmax(0,1fr)_70px_90px_70px_80px_110px_64px] gap-2 px-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground md:grid">
        <span>#</span>
        <span>Membre</span>
        <span>Jour</span>
        <span>Contacts WA</span>
        <span>Clics</span>
        <span>Intérêt</span>
        <span>Statut</span>
        <span></span>
      </div>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Aucune donnée encore. Dès que des membres partagent leur lien (avec <code>?ref=…</code>), les clics apparaîtront ici.
          </p>
        ) : null}
        {rows.map((row, i) => {
          const st = statut(row, today);
          return (
            <form
              key={row.ref}
              action="/api/admin/humain/catalogue/referrer"
              method="post"
              className="grid grid-cols-2 items-center gap-2 rounded-xl border bg-white p-3 md:grid-cols-[28px_minmax(0,1fr)_70px_90px_70px_80px_110px_64px]"
            >
              <input type="hidden" name="current_url" value="/admin/humain/catalogue/scores" />
              <input type="hidden" name="ref" value={row.ref} />
              <input type="hidden" name="ref_name" value={row.name} />
              <span className="font-black text-slate-400">{i + 1}</span>
              <span className="min-w-0 truncate text-sm font-bold text-slate-800" title={row.ref}>{row.name}</span>
              <input
                name="propulsion_day"
                type="number"
                min="1"
                max="28"
                defaultValue={row.day ?? ""}
                placeholder="J"
                className="h-9 w-full rounded border bg-background px-2 text-sm"
              />
              <input
                name="declared_contacts"
                type="number"
                min="0"
                defaultValue={row.declared ?? ""}
                placeholder="ex: 400"
                className="h-9 w-full rounded border bg-background px-2 text-sm"
              />
              <span className="font-black text-slate-800">{row.clics}</span>
              <span className="text-slate-600">{row.interet}</span>
              <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
              <button className="h-9 rounded border border-emerald-300 bg-emerald-50 text-xs font-black text-emerald-800">💾</button>
            </form>
          );
        })}
      </div>

      {!tableReady ? (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          ⚠️ Migration <code>20260606150000_create_catalogue_referrers</code> non appliquée : l&apos;édition (contacts / jour) ne sera pas sauvegardée tant qu&apos;elle n&apos;est pas passée dans Supabase.
        </p>
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        « Clics » = ouvertures du catalogue via le lien du membre (<code>?ref=…</code>). « Intérêt » = favoris + réservations + cartes
        ouvertes générés par ses contacts. Les contacts WhatsApp sont déclaratifs (saisis au point mensuel).
      </p>
    </section>
  );
}
