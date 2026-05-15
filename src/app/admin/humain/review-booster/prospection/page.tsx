import { createAdminClient } from "@/lib/supabase/admin";
import { SearchForm } from "./_components/search-form";
import { ProspectsTable, ProspectRow } from "./_components/prospects-table";

export const dynamic = "force-dynamic";

export default async function ProspectionPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("human_review_prospects")
    .select("id, nom, ville, secteur, note_google, nb_avis, telephone, est_mobile, statut, proprietaire")
    .neq("statut", "converti")
    .order("created_at", { ascending: false })
    .limit(100);

  const prospects: ProspectRow[] = Array.isArray(data)
    ? (data as unknown as ProspectRow[])
    : [];

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

      <ProspectsTable prospects={prospects} />
    </section>
  );
}
