import { createAdminClient } from "@/lib/supabase/admin";
import { ApifyJobLauncher } from "./_components/apify-job-launcher";
import { ApifySearchCommand } from "./_components/apify-search-command";
import { ManualVitrineCreateForm } from "./_components/manual-vitrine-create-form";
import { VitrinesDrawerDashboard, type VitrineRow } from "./_components/vitrines-drawer-dashboard";

export const dynamic = "force-dynamic";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export default async function AdminHumainVitrinesPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select(
      "id,slug,business_name,city,category,whatsapp_phone_e164,status,public_url,source_website,error_reason,created_at,approved_at,rejected_at,sent_at,revision_instructions,preview_url,preview_storage_prefix"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const vitrines: VitrineRow[] = Array.isArray(data) ? (data as VitrineRow[]) : [];
  const hasError = Boolean(error);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">100% Humain</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Vitrines</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Pilotage des vitrines générées : statut, erreurs, et lien public.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Total</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{vitrines.length}</p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">En erreur</p>
            <p className="mt-1 text-3xl font-black text-slate-950">
              {vitrines.filter((row) => normalize(row.status) === "error").length}
            </p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Publiées</p>
            <p className="mt-1 text-3xl font-black text-slate-950">
              {vitrines.filter((row) => ["uploaded", "approved", "sent"].includes(normalize(row.status))).length}
            </p>
          </div>
        </div>
      </div>

      <ApifyJobLauncher />

      <details className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <summary className="cursor-pointer text-sm font-bold text-slate-800">Mode expert (commande terminal)</summary>
        <div className="mt-4">
          <ApifySearchCommand />
        </div>
      </details>

      <ManualVitrineCreateForm />

      {hasError ? (
        <div className="rounded-2xl border bg-white p-5 text-sm text-red-700 shadow-sm">Erreur Supabase: {normalize(error?.message)}</div>
      ) : (
        <VitrinesDrawerDashboard vitrines={vitrines} />
      )}
    </section>
  );
}
