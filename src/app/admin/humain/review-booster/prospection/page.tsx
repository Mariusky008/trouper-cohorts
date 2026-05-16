import { createAdminClient } from "@/lib/supabase/admin";
import { SearchForm } from "./_components/search-form";
import { ManualSendForm } from "./_components/manual-send-form";
import { ProspectsTable, ProspectRow } from "./_components/prospects-table";
import { HistoriqueSection, HistoriqueRow } from "./_components/historique-section";

export const dynamic = "force-dynamic";

export default async function ProspectionPage() {
  const supabase = createAdminClient();

  const [prospectsResult, historiqueResult] = await Promise.all([
    supabase
      .from("human_review_prospects")
      .select("id, nom, ville, secteur, note_google, nb_avis, telephone, est_mobile, statut, proprietaire")
      .neq("statut", "converti")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("human_review_prospects")
      .select("ville, zone, secteur, created_at, statut")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const prospects: ProspectRow[] = Array.isArray(prospectsResult.data)
    ? (prospectsResult.data as unknown as ProspectRow[])
    : [];

  // Group historique by ville+secteur+day
  const seen = new Map<string, HistoriqueRow>();
  ((historiqueResult.data || []) as Array<{ ville: string; zone: string | null; secteur: string | null; created_at: string; statut: string }>).forEach((row) => {
    const day = row.created_at.slice(0, 10);
    const key = `${row.ville}|${row.zone || ""}|${row.secteur || ""}|${day}`;
    if (!seen.has(key)) {
      seen.set(key, { ville: row.ville, zone: row.zone || "", secteur: row.secteur || "", date: day, count: 0, contactes: 0 });
    }
    const entry = seen.get(key)!;
    entry.count++;
    if (row.statut === "contacté") entry.contactes++;
  });
  const historique = Array.from(seen.values()).slice(0, 50);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">100% Humain</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Prospection commerçants</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trouvez et contactez de nouveaux commerçants locaux via Google Maps.
        </p>
      </div>

      <SearchForm />
      <ManualSendForm />
      <HistoriqueSection historique={historique} />
      <ProspectsTable prospects={prospects} />
    </section>
  );
}
