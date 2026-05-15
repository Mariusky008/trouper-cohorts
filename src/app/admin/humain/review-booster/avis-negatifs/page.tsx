import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { TraiterButton } from "./_components/traiter-button";

export const dynamic = "force-dynamic";

export default async function AvisNegatifsPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("human_review_avis_negatifs")
    .select(`
      id, message, traite, created_at,
      human_review_commercants ( nom ),
      human_review_clients_finaux ( prenom, telephone )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = Array.isArray(data) ? data : [];
  const nonTraites = rows.filter((r) => !r.traite);
  const traites = rows.filter((r) => r.traite);

  function relativeTime(date: string) {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <Link href="/admin/humain/review-booster" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800">
          ← Review Booster
        </Link>
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Avis négatifs</h1>
        <p className="mt-1 text-sm text-slate-500">
          {nonTraites.length > 0
            ? `${nonTraites.length} à traiter`
            : "Aucun avis en attente — tout est traité ✅"}
        </p>
      </div>

      {/* Non traités */}
      {nonTraites.length > 0 && (
        <div className="space-y-3">
          {nonTraites.map((r) => {
            const commerce = r.human_review_commercants as unknown as { nom: string } | null;
            const client = r.human_review_clients_finaux as unknown as { prenom: string; telephone: string } | null;
            return (
              <div key={r.id} className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{commerce?.nom ?? "—"}</p>
                    <p className="text-xs text-slate-400">{relativeTime(r.created_at)}</p>
                  </div>
                  {client && (
                    <a
                      href={`tel:${client.telephone}`}
                      className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      📞 {client.prenom}
                    </a>
                  )}
                </div>
                <p className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                  &ldquo;{r.message}&rdquo;
                </p>
                {client && (
                  <p className="mb-3 text-xs text-slate-400">
                    Client : {client.prenom} · {client.telephone}
                  </p>
                )}
                <TraiterButton id={r.id} />
              </div>
            );
          })}
        </div>
      )}

      {/* Traités */}
      {traites.length > 0 && (
        <details className="rounded-2xl border bg-white shadow-sm">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-600 sm:px-6">
            Traités ({traites.length})
          </summary>
          <ul className="divide-y border-t">
            {traites.map((r) => {
              const commerce = r.human_review_commercants as unknown as { nom: string } | null;
              const client = r.human_review_clients_finaux as unknown as { prenom: string; telephone: string } | null;
              return (
                <li key={r.id} className="px-5 py-4 sm:px-6">
                  <p className="text-sm font-medium text-slate-700">{commerce?.nom ?? "—"} · {client?.prenom ?? "—"}</p>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{r.message}</p>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
