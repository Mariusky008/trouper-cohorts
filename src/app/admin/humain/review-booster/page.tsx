import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CommercantCreateForm } from "./_components/commercant-create-form";

export const dynamic = "force-dynamic";

function statutBadge(abonnement: string) {
  if (abonnement === "actif") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (abonnement === "pause") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default async function ReviewBoosterPage() {
  const supabase = createAdminClient();

  const [{ data: commercants }, { data: avisNegatifs }, { data: clientsStats }] =
    await Promise.all([
      supabase
        .from("human_review_commercants")
        .select("id, nom, secteur, abonnement, mensualite, nb_avis_debut, nb_avis_actuel, note_actuelle, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("human_review_avis_negatifs")
        .select("id")
        .eq("traite", false),
      supabase
        .from("human_review_clients_finaux")
        .select("statut, commercant_id"),
    ]);

  const rows = Array.isArray(commercants) ? commercants : [];
  const nbAvisNegatifs = Array.isArray(avisNegatifs) ? avisNegatifs.length : 0;
  const clients = Array.isArray(clientsStats) ? clientsStats : [];

  const actifs = rows.filter((r) => r.abonnement === "actif");
  const revenus = actifs.reduce((sum, r) => sum + (Number(r.mensualite) || 0), 0);
  const avisGeneres = rows.reduce((sum, r) => {
    const delta = (Number(r.nb_avis_actuel) || 0) - (Number(r.nb_avis_debut) || 0);
    return sum + Math.max(0, delta);
  }, 0);
  const envoyCeMois = clients.filter((c) => c.statut !== "en_attente").length;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">100% Humain</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Review Booster</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Collecte automatisée d'avis Google pour les commerçants locaux.
            </p>
          </div>
          {nbAvisNegatifs > 0 && (
            <Link
              href="/admin/humain/review-booster/avis-negatifs"
              className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              ⚠️ {nbAvisNegatifs} avis négatif{nbAvisNegatifs > 1 ? "s" : ""} à traiter
            </Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Clients actifs", value: actifs.length },
            { label: "Envois total", value: envoyCeMois },
            { label: "Avis générés", value: avisGeneres },
            { label: "Revenus/mois", value: `${revenus} €` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <CommercantCreateForm />

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4 sm:px-7">
          <h2 className="font-bold text-slate-900">Mes clients ({rows.length})</h2>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            Aucun commerçant pour l'instant. Ajoutez votre premier client ci-dessus.
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => {
              const delta = Math.max(0, (r.nb_avis_actuel ?? 0) - (r.nb_avis_debut ?? 0));
              return (
                <li key={r.id}>
                  <Link
                    href={`/admin/humain/review-booster/${r.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors sm:px-7"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{r.nom}</p>
                      <p className="text-xs text-slate-500">{r.secteur || "—"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {r.note_actuelle && (
                        <span className="text-sm font-medium text-amber-600">
                          ★ {Number(r.note_actuelle).toFixed(1)}
                        </span>
                      )}
                      {delta > 0 && (
                        <span className="text-sm font-semibold text-emerald-600">+{delta} avis</span>
                      )}
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statutBadge(r.abonnement)}`}>
                        {r.abonnement}
                      </span>
                      <span className="text-slate-400">→</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
