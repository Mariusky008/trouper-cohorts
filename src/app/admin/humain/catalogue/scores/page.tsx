import Link from "next/link";
import { getAdminMarketplaceSnapshot } from "@/lib/actions/human-marketplace";
import { getCatalogueLeaderboard, type LeaderboardRow } from "@/lib/popey-human/catalogue-leaderboard";

export const dynamic = "force-dynamic";

type ScoresPageProps = {
  searchParams?: Promise<{ marketStatus?: string; marketMessage?: string; city?: string }>;
};

const COLS = "28px minmax(140px,1fr) 60px 88px 56px 64px 66px 104px 52px";

function statut(row: LeaderboardRow, today: number): { label: string; cls: string } {
  if (row.day && today < row.day) return { label: "⏳ Bientôt", cls: "bg-slate-100 text-slate-500" };
  if (row.clics === 0) return { label: "⚠️ Relance", cls: "bg-red-100 text-red-700" };
  if (row.declared && row.clics >= Math.max(5, row.declared * 0.15)) return { label: "🚀 Joué le jeu", cls: "bg-emerald-100 text-emerald-700" };
  return { label: "✅ Actif", cls: "bg-sky-100 text-sky-700" };
}

export default async function CatalogueScoresPage({ searchParams }: ScoresPageProps) {
  const qp = (await searchParams) || {};
  const marketStatus = typeof qp.marketStatus === "string" ? qp.marketStatus : "";
  const marketMessage = typeof qp.marketMessage === "string" ? qp.marketMessage : "";
  const selectedCity = typeof qp.city === "string" ? qp.city : "";

  const snapshot = await getAdminMarketplaceSnapshot({ placeCity: "all" });
  if (snapshot.error) {
    return (
      <section className="space-y-4 p-4">
        <h1 className="text-2xl font-black">Tableau des scores</h1>
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{snapshot.error}</p>
      </section>
    );
  }

  const { rows, tableReady, monthLabel, totalClics, cities } = await getCatalogueLeaderboard(selectedCity);
  const today = new Date().getDate();
  const cityUrl = `/admin/humain/catalogue/scores${selectedCity ? `?city=${encodeURIComponent(selectedCity)}` : ""}`;

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
        <form method="get" className="flex items-center gap-2">
          <select name="city" defaultValue={selectedCity} className="h-9 rounded border bg-background px-2 text-sm">
            <option value="">Toutes les villes</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="h-9 rounded border border-sky-300 bg-sky-50 px-3 text-xs font-black uppercase tracking-wide text-sky-800">Filtrer</button>
        </form>
        <div className="text-sm">
          <strong className="text-emerald-700">{rows.length}</strong> membre(s) · <strong>{totalClics}</strong> clics ce mois
        </div>
        <form action="/api/admin/humain/catalogue/referrer" method="post" className="ml-auto">
          <input type="hidden" name="current_url" value={cityUrl} />
          <input type="hidden" name="intent" value="auto_assign" />
          <input type="hidden" name="city" value={selectedCity} />
          <button className="h-9 rounded border border-amber-300 bg-amber-50 px-3 text-xs font-black uppercase tracking-wide text-amber-800">
            📅 Répartir les vagues {selectedCity ? `· ${selectedCity}` : "· toutes villes"}
          </button>
        </form>
      </div>

      {!tableReady ? (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          ⚠️ Migration <code>20260606150000_create_catalogue_referrers</code> non appliquée : l&apos;édition (contacts / jour) ne sera pas sauvegardée tant qu&apos;elle n&apos;est pas passée dans Supabase.
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <div className="min-w-[700px] space-y-2">
          <div className="grid items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground" style={{ gridTemplateColumns: COLS }}>
            <span>#</span>
            <span>Membre</span>
            <span>Jour</span>
            <span>Contacts</span>
            <span>Clics</span>
            <span>Intérêt</span>
            <span>Coupons</span>
            <span>Statut</span>
            <span></span>
          </div>

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
                className="grid items-center gap-2 rounded-xl border bg-white p-3 text-sm"
                style={{ gridTemplateColumns: COLS }}
              >
                <input type="hidden" name="current_url" value="/admin/humain/catalogue/scores" />
                <input type="hidden" name="ref" value={row.ref} />
                <input type="hidden" name="ref_name" value={row.name} />
                <span className="font-black text-slate-400">{i + 1}</span>
                <span className="min-w-0 truncate font-bold text-slate-800" title={row.ref}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] + " " : ""}
                  {row.name}
                </span>
                <input name="propulsion_day" type="number" min="1" max="28" defaultValue={row.day ?? ""} placeholder="J" className="h-9 w-full rounded border bg-background px-2 text-sm" />
                <input name="declared_contacts" type="number" min="0" defaultValue={row.declared ?? ""} placeholder="400" className="h-9 w-full rounded border bg-background px-2 text-sm" />
                <span className="font-black text-slate-800">{row.clics}</span>
                <span className="text-slate-600">{row.interet}</span>
                <span className="font-bold text-amber-700">{row.coupons}</span>
                <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                <button className="h-9 rounded border border-emerald-300 bg-emerald-50 text-xs font-black text-emerald-800">💾</button>
              </form>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        « Clics » = ouvertures du catalogue via le lien du membre (<code>?ref=…</code>). « Intérêt » = favoris + réservations +
        cartes ouvertes. « Coupons » = activations attribuées au membre. Les contacts WhatsApp sont déclaratifs.
      </p>
    </section>
  );
}
