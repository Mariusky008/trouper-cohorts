import { createAdminClient } from "@/lib/supabase/admin";

type VitrineRow = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  category: string;
  status: string;
  public_url: string;
  source_website: string;
  error_reason: string | null;
  created_at: string;
};

function normalize(value: unknown) {
  return String(value || "").trim();
}

export default async function AdminHumainVitrinesPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select("id,slug,business_name,city,category,status,public_url,source_website,error_reason,created_at")
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

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">Dernières vitrines</h2>
          <a
            href="https://vitrine.popey.academy"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Ouvrir vitrine.popey.academy
          </a>
        </div>
        {hasError ? (
          <div className="p-5 text-sm text-red-700">Erreur Supabase: {normalize(error?.message)}</div>
        ) : vitrines.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Aucune vitrine pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-white">
                <tr className="border-b text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-5 py-3">Entreprise</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Ville</th>
                  <th className="px-5 py-3">Catégorie</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Public</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Créée</th>
                </tr>
              </thead>
              <tbody>
                {vitrines.map((row) => {
                  const publicUrl = normalize(row.public_url);
                  const sourceUrl = normalize(row.source_website);
                  const status = normalize(row.status);
                  const created = normalize(row.created_at);
                  return (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="px-5 py-3 font-semibold text-slate-950">
                        {normalize(row.business_name) || "—"}
                        {row.error_reason ? (
                          <div className="mt-1 text-xs font-medium text-red-700">{normalize(row.error_reason)}</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-700">{normalize(row.slug) || "—"}</td>
                      <td className="px-5 py-3 text-slate-700">{normalize(row.city) || "—"}</td>
                      <td className="px-5 py-3 text-slate-700">{normalize(row.category) || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-full border bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {status || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {publicUrl ? (
                          <a href={publicUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline">
                            Ouvrir
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {sourceUrl ? (
                          <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-slate-700 underline">
                            Site
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{created ? new Date(created).toLocaleString("fr-FR") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

