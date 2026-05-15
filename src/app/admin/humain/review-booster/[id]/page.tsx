import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CsvImport } from "./_components/csv-import";
import { CommercantEditForm } from "./_components/commercant-edit-form";
import { PipelineTable } from "./_components/pipeline-table";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const STATUT_LABEL: Record<string, string> = {
  en_attente: "⏳ En attente",
  envoyé: "📤 Envoyé",
  cliqué: "👁 Cliqué",
  avis_laissé: "✅ Avis laissé",
  insatisfait: "⚠️ Insatisfait",
  relancé: "🔄 Relancé",
  terminé: "🏁 Terminé",
};

export default async function CommercantDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const supabase = createAdminClient();

  const [{ data: commerce }, { data: clients }] = await Promise.all([
    supabase
      .from("human_review_commercants")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("human_review_clients_finaux")
      .select("id, prenom, telephone, date_prestation, statut, date_envoi_j1, satisfaction, created_at")
      .eq("commercant_id", id)
      .order("date_prestation", { ascending: false })
      .limit(200),
  ]);

  if (!commerce) notFound();

  const rows = Array.isArray(clients) ? clients : [];
  const enAttente = rows.filter((r) => r.statut === "en_attente").length;
  const envoyes = rows.filter((r) => r.statut === "envoyé").length;
  const cliques = rows.filter((r) => r.statut === "cliqué").length;
  const avisLaisses = rows.filter((r) => r.statut === "avis_laissé").length;
  const insatisfaits = rows.filter((r) => r.statut === "insatisfait").length;
  const relances = rows.filter((r) => r.statut === "relancé").length;

  const tauxClic = envoyes + cliques + avisLaisses > 0
    ? Math.round(((cliques + avisLaisses) / (envoyes + cliques + avisLaisses)) * 100)
    : 0;
  const tauxAvis = cliques + avisLaisses > 0
    ? Math.round((avisLaisses / (cliques + avisLaisses)) * 100)
    : 0;

  const delta = Math.max(0, (commerce.nb_avis_actuel ?? 0) - (commerce.nb_avis_debut ?? 0));

  const lienSaisie = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/saisie/${commerce.token_saisie}`;
  const lienFiltrage = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/avis/${commerce.slug}`;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <Link href="/admin/humain/review-booster" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800">
          ← Review Booster
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{commerce.nom}</h1>
            <p className="text-sm text-slate-500">{commerce.secteur || "—"} · {commerce.ville}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${commerce.abonnement === "actif" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            {commerce.abonnement}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Performance */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Performance</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Avis au départ</span><span className="font-semibold">{commerce.nb_avis_debut ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Avis aujourd'hui</span><span className="font-semibold">{commerce.nb_avis_actuel ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Progression</span><span className="font-bold text-emerald-600">+{delta} avis</span></div>
            {commerce.note_actuelle && (
              <div className="flex justify-between"><span className="text-slate-600">Note actuelle</span><span className="font-semibold text-amber-600">★ {Number(commerce.note_actuelle).toFixed(1)}</span></div>
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Pipeline</p>
          <div className="space-y-2 text-sm">
            {[
              { label: "En attente", val: enAttente },
              { label: "Envoyés", val: envoyes },
              { label: "Cliqués", val: cliques, pct: tauxClic },
              { label: "Avis laissés", val: avisLaisses, pct: tauxAvis, green: true },
              { label: "Insatisfaits", val: insatisfaits, red: true },
              { label: "Relancés", val: relances },
            ].map(({ label, val, pct, green, red }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-600">{label}</span>
                <span className={`font-semibold ${green ? "text-emerald-600" : red ? "text-red-600" : ""}`}>
                  {val}{pct !== undefined ? ` (${pct}%)` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import CSV */}
      <CsvImport commercantId={id} nom={commerce.nom} />

      {/* Liens */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Liens</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 overflow-hidden">
            <span className="text-slate-500">Page filtrage</span>
            <a href={lienFiltrage} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline">{lienFiltrage}</a>
          </div>
          <div className="flex items-center justify-between gap-3 overflow-hidden">
            <span className="text-slate-500">Saisie commerçant</span>
            <a href={lienSaisie} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline">{lienSaisie}</a>
          </div>
          {commerce.lien_avis && (
            <div className="flex items-center justify-between gap-3 overflow-hidden">
              <span className="text-slate-500">Lien Google</span>
              <a href={commerce.lien_avis} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline">Voir sur Google →</a>
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      <CommercantEditForm commerce={commerce} />

      {/* Pipeline table */}
      <PipelineTable clients={rows} statutLabels={STATUT_LABEL} />
    </section>
  );
}
